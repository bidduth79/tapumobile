
<?php
// api/rss_handler.php
require 'db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? ($_POST['action'] ?? '');

$cache_file_json = '../downloads/master_feed.json';
$cache_file_xml = '../downloads/master_feed.xml';

// Helper: Fetch URL
function fetchContent($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $agents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
    ];
    curl_setopt($ch, CURLOPT_USERAGENT, $agents[array_rand($agents)]);
    
    $data = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return ($httpCode === 200) ? $data : false;
}

function parseFeed($url, $limit = 5) {
    $content = fetchContent($url);
    if (!$content) return ['success' => false, 'message' => 'Failed to fetch URL'];

    $items = [];
    libxml_use_internal_errors(true);

    $xml = simplexml_load_string($content, 'SimpleXMLElement', LIBXML_NOCDATA);
    
    if ($xml) {
        $channel = isset($xml->channel) ? $xml->channel : $xml;
        if (isset($xml->entry)) { // Atom
            $count = 0;
            foreach ($xml->entry as $entry) {
                if ($count >= $limit) break;
                $link = (string)$entry->link['href'];
                $items[] = [
                    'title' => (string)$entry->title,
                    'link' => $link,
                    'date' => (string)$entry->updated,
                    'description' => strip_tags((string)$entry->summary),
                    'is_rss' => true
                ];
                $count++;
            }
        } elseif (isset($channel->item)) { // RSS 2.0
            $count = 0;
            foreach ($channel->item as $item) {
                if ($count >= $limit) break;
                $items[] = [
                    'title' => (string)$item->title,
                    'link' => (string)$item->link,
                    'date' => (string)$item->pubDate,
                    'description' => strip_tags((string)$item->description),
                    'is_rss' => true
                ];
                $count++;
            }
        }
    } 
    
    if (empty($items)) {
        return ['success' => false, 'message' => 'No items found.'];
    }

    return ['success' => true, 'items' => $items];
}

// --- MASTER FEED UPDATE LOGIC (Writes to Cache) ---
if ($action === 'force_update_master') {
    header('Content-Type: application/json');
    
    $stmt = $conn->query("SELECT * FROM rss_feeds WHERE is_active = 1");
    $feeds = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    $all_items = [];
    $processed_links = [];
    
    foreach ($feeds as $feed) {
        $res = parseFeed($feed['url'], 10); // Fetch top 10 from each
        if ($res['success']) {
            foreach ($res['items'] as $item) {
                // Deduplicate inside master feed
                if (!in_array($item['link'], $processed_links)) {
                    $item['source'] = $feed['name'];
                    $all_items[] = $item;
                    $processed_links[] = $item['link'];
                }
            }
        }
    }
    
    // Sort by Date (Newest First)
    usort($all_items, function($a, $b) {
        return strtotime($b['date']) - strtotime($a['date']);
    });
    
    // Limit total Master Items
    $all_items = array_slice($all_items, 0, 500);

    // Save JSON Cache (For Internal App)
    file_put_contents($cache_file_json, json_encode(['success' => true, 'updated' => time(), 'items' => $all_items]));

    // Save XML Cache (For External Readers)
    $xmlContent = '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel>';
    $xmlContent .= '<title>LI Cell Master Feed</title><description>Aggregated News</description>';
    foreach ($all_items as $item) {
        $title = htmlspecialchars($item['title'] . ' - ' . $item['source']);
        $link = htmlspecialchars($item['link']);
        $pubDate = date(DATE_RSS, strtotime($item['date']));
        $xmlContent .= "<item><title>$title</title><link>$link</link><pubDate>$pubDate</pubDate></item>";
    }
    $xmlContent .= '</channel></rss>';
    file_put_contents($cache_file_xml, $xmlContent);

    echo json_encode(['success' => true, 'count' => count($all_items), 'message' => 'Master feed updated successfully']);
    exit;
}

// --- SERVE CACHED MASTER FEED (JSON) ---
if ($action === 'get_master_json') {
    header('Content-Type: application/json');
    if (file_exists($cache_file_json)) {
        echo file_get_contents($cache_file_json);
    } else {
        echo json_encode(['success' => false, 'items' => [], 'message' => 'Cache not found. Please update master feed.']);
    }
    exit;
}

// --- SERVE CACHED MASTER FEED (XML) ---
if ($action === 'master_feed') {
    header('Content-Type: application/rss+xml; charset=UTF-8');
    if (file_exists($cache_file_xml)) {
        echo file_get_contents($cache_file_xml);
    } else {
        // Fallback empty XML
        echo '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>No Data</title></channel></rss>';
    }
    exit;
}

// ... (Rest of the standard CRUD logic remains same) ...
header('Content-Type: application/json');

if ($method === 'GET') {
    if ($action === 'list') {
        $stmt = $conn->query("SELECT * FROM rss_feeds ORDER BY id DESC");
        echo json_encode(['success' => true, 'data' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
    }
    elseif ($action === 'test') {
        $url = $_GET['url'] ?? '';
        echo json_encode(parseFeed($url));
    }
    elseif ($action === 'parse') {
        $id = $_GET['id'] ?? 0;
        $limit = $_GET['limit'] ?? 10;
        $stmt = $conn->prepare("SELECT * FROM rss_feeds WHERE id = ?");
        $stmt->execute([$id]);
        $feed = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($feed) {
            $result = parseFeed($feed['url'], $limit);
            $status = $result['success'] ? 'active' : 'error';
            $upd = $conn->prepare("UPDATE rss_feeds SET last_fetched=?, status=? WHERE id=?");
            $upd->execute([time() * 1000, $status, $id]);

            if ($result['success']) {
                foreach ($result['items'] as &$item) {
                    $item['source'] = $feed['name'];
                }
            }
            echo json_encode($result);
        } else {
            echo json_encode(['success' => false, 'message' => 'Feed not found']);
        }
    }
}

elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $act = $data['action'] ?? '';

    if ($act === 'add') {
        $stmt = $conn->prepare("INSERT INTO rss_feeds (name, url, type, status) VALUES (?, ?, ?, 'active')");
        $stmt->execute([$data['name'], $data['url'], $data['type']]);
        echo json_encode(['success' => true]);
    }
    elseif ($act === 'update') {
        $stmt = $conn->prepare("UPDATE rss_feeds SET name=?, url=?, type=? WHERE id=?");
        $stmt->execute([$data['name'], $data['url'], $data['type'], $data['id']]);
        echo json_encode(['success' => true]);
    }
    elseif ($act === 'toggle') {
        $stmt = $conn->prepare("UPDATE rss_feeds SET is_active=? WHERE id=?");
        $stmt->execute([$data['is_active'] ? 1 : 0, $data['id']]);
        echo json_encode(['success' => true]);
    }
    elseif ($act === 'delete') {
        $stmt = $conn->prepare("DELETE FROM rss_feeds WHERE id = ?");
        $stmt->execute([$data['id']]);
        echo json_encode(['success' => true]);
    }
    elseif ($act === 'import_opml') {
        $feeds = $data['feeds'];
        if (!empty($feeds)) {
            $stmt = $conn->prepare("INSERT INTO rss_feeds (name, url, type, status) VALUES (?, ?, ?, 'active')");
            foreach ($feeds as $feed) {
                $type = $feed['category'] ?? 'News';
                $stmt->execute([$feed['title'], $feed['url'], $type]);
            }
            echo json_encode(['success' => true, 'count' => count($feeds)]);
        } else {
            echo json_encode(['success' => false, 'message' => 'No feeds provided']);
        }
    }
}
?>
