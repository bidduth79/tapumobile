
<?php
// api/news_proxy.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// --- CONFIGURATION ---
$cache_enabled = true;
$cache_duration = 900; // 15 Minutes (JSON Cache on Server)
$cache_dir = 'cache/'; 

// Create cache directory
if (!file_exists($cache_dir)) {
    mkdir($cache_dir, 0777, true);
}

$keyword = $_GET['q'] ?? '';
$type = $_GET['type'] ?? 'news'; 
$dork_type = $_GET['dork_type'] ?? 'all'; 
$force_refresh = isset($_GET['refresh']) ? true : false; 

if (empty($keyword)) {
    echo json_encode(['success' => false, 'articles' => []]);
    exit;
}

// 1. Anti-Block: User Agent List
function getRandomUserAgent() {
    $agents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0'
    ];
    return $agents[array_rand($agents)];
}

// 2. Robust Fetcher
function fetchUrl($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 20); 
    curl_setopt($ch, CURLOPT_ENCODING, ''); 
    curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4); 
    curl_setopt($ch, CURLOPT_USERAGENT, getRandomUserAgent());
    
    $headers = [
        'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language: en-US,en;q=0.9' 
    ];
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    $data = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($http_code != 200 || $data === false) {
        return ['error' => true, 'msg' => "HTTP $http_code: $error", 'data' => $data];
    }
    
    return ['error' => false, 'data' => $data];
}

function isBangla($str) {
    return preg_match('/[\x{0980}-\x{09FF}]/u', $str);
}

// --- URL GENERATION LOGIC ---

$is_bangla_query = isBangla($keyword);

// Language Params:
if ($is_bangla_query) {
    $lang_params = "hl=bn"; 
} else {
    $lang_params = "hl=en-US"; 
}

// Time window
$time_window = "when:7d"; 
$rss_url = "";
$encoded_keyword = urlencode($keyword);

// --- SEARCH TYPE LOGIC (ENHANCED) ---

switch ($type) {
    case 'facebook':
        $q = urlencode("site:facebook.com $keyword");
        $rss_url = "https://news.google.com/rss/search?q={$q}+{$time_window}&{$lang_params}&gl=US";
        break;

    case 'youtube':
        $q = urlencode("site:youtube.com $keyword");
        $rss_url = "https://news.google.com/rss/search?q={$q}+{$time_window}&{$lang_params}&gl=US";
        break;

    case 'tiktok':
        // Specifically look for video titles indexed
        $q = urlencode("site:tiktok.com \"$keyword\"");
        $rss_url = "https://news.google.com/rss/search?q={$q}+{$time_window}&{$lang_params}&gl=US";
        break;

    case 'twitter':
        $q = urlencode("(site:twitter.com OR site:x.com) $keyword");
        $rss_url = "https://news.google.com/rss/search?q={$q}+{$time_window}&{$lang_params}&gl=US";
        break;

    case 'reddit':
        // Target Reddit threads specifically
        $q = urlencode("site:reddit.com $keyword");
        $rss_url = "https://news.google.com/rss/search?q={$q}+{$time_window}&{$lang_params}&gl=US";
        break;

    case 'telegram':
        // Basic Telegram Channel Search (Public web view t.me)
        $q = urlencode("site:t.me $keyword");
        $rss_url = "https://news.google.com/rss/search?q={$q}+{$time_window}&{$lang_params}";
        break;

    case 'telegram_adv':
        // Deep search using aggregators like tgstat or telemetr
        $q = urlencode("(site:tgstat.com OR site:telemetr.io) $keyword");
        $rss_url = "https://news.google.com/rss/search?q={$q}+{$time_window}&{$lang_params}";
        break;

    case 'tor':
        // Dark Web Gateways (Onion Links via Clearnet Proxies)
        $q = urlencode("(site:onion.ly OR site:onion.pet OR site:tor2web.org OR site:dark.fail) $keyword");
        $rss_url = "https://news.google.com/rss/search?q={$q}&{$lang_params}";
        break;

    case 'bing':
        // Bing News RSS
        $rss_url = "https://www.bing.com/news/search?q={$encoded_keyword}&format=rss";
        break;

    case 'dorking':
        $dork_query = "";
        if ($dork_type === 'pdf') $dork_query = "filetype:pdf $keyword";
        elseif ($dork_type === 'doc') $dork_query = "(filetype:doc OR filetype:docx) $keyword";
        elseif ($dork_type === 'excel') $dork_query = "(filetype:xls OR filetype:xlsx OR filetype:csv) $keyword";
        elseif ($dork_type === 'drive') $dork_query = "site:drive.google.com $keyword";
        elseif ($dork_type === 'confidential') $dork_query = "\"confidential\" OR \"top secret\" $keyword";
        else $dork_query = "$keyword";
        
        $q = urlencode($dork_query);
        $rss_url = "https://news.google.com/rss/search?q={$q}&{$lang_params}";
        break;

    case 'news':
    default:
        // Standard News Search
        $rss_url = "https://news.google.com/rss/search?q={$encoded_keyword}+{$time_window}&{$lang_params}";
        break;
}

// --- CACHING ---
$cache_key = md5($rss_url); 
$cache_file = $cache_dir . $cache_key . '.json';

if ($cache_enabled && !$force_refresh && file_exists($cache_file)) {
    $file_age = time() - filemtime($cache_file);
    if ($file_age < $cache_duration) {
        echo file_get_contents($cache_file);
        exit;
    }
}

// --- FETCHING ---
usleep(rand(50000, 150000)); 
$response = fetchUrl($rss_url);

if ($response['error']) {
    // Return cached if fetch fails
    if (file_exists($cache_file)) {
        echo file_get_contents($cache_file);
        exit;
    }
    echo json_encode(['success' => false, 'message' => $response['msg']]);
    exit;
}

$xml_content = $response['data'];

// --- PARSING ---
libxml_use_internal_errors(true);
$xml = simplexml_load_string($xml_content, 'SimpleXMLElement', LIBXML_NOCDATA);

if ($xml === false) {
    echo json_encode(['success' => false, 'message' => 'XML Parsing Failed. Source might be blocking or empty.']);
    exit;
}

$articles = [];
$count = 0;
$limit = 100;

// Handle Google/Standard RSS structure
if (isset($xml->channel->item)) {
    foreach ($xml->channel->item as $item) {
        if ($count >= $limit) break;
        
        // Handle Namespaces (Media/Bing often uses them)
        $namespaces = $item->getNamespaces(true);
        
        $title = (string)$item->title;
        $link = (string)$item->link;
        $pubDate = (string)$item->pubDate;
        
        // Source handling
        $source = "Unknown";
        if (isset($item->source)) $source = (string)$item->source;
        // For Bing, source might be different or implied
        if ($type === 'bing') $source = 'Bing News';

        // Overwrite source for dorking types to make it clear
        if ($type === 'facebook') $source = 'Facebook';
        elseif ($type === 'youtube') $source = 'YouTube';
        elseif ($type === 'reddit') $source = 'Reddit';
        elseif ($type === 'telegram' || $type === 'telegram_adv') $source = 'Telegram';
        elseif ($type === 'tiktok') $source = 'TikTok';
        elseif ($type === 'tor') $source = 'Dark Web (Tor)';

        $description = strip_tags((string)$item->description);

        $articles[] = [
            'title' => $title,
            'link' => $link,
            'date' => $pubDate,
            'source' => $source,
            'description' => $description,
            'time_ago' => time_elapsed_string($pubDate),
            'keyword' => $keyword,
            'type' => $type
        ];
        $count++;
    }
}

$json_output = json_encode(['success' => true, 'articles' => $articles]);

// Save to cache
if ($cache_enabled && count($articles) > 0) {
    file_put_contents($cache_file, $json_output);
}

echo $json_output;

function time_elapsed_string($datetime, $full = false) {
    try {
        $now = new DateTime;
        $ago = new DateTime($datetime);
        $diff = $now->diff($ago);

        $diff->w = floor($diff->d / 7);
        $diff->d -= $diff->w * 7;

        $string = array('y' => 'বছর', 'm' => 'মাস', 'w' => 'সপ্তাহ', 'd' => 'দিন', 'h' => 'ঘণ্টা', 'i' => 'মিনিট', 's' => 'সেকেন্ড');
        foreach ($string as $k => &$v) {
            if ($diff->$k) {
                $v = $diff->$k . ' ' . $v;
            } else {
                unset($string[$k]);
            }
        }

        if (!$full) $string = array_slice($string, 0, 1);
        return $string ? implode(', ', $string) . ' আগে' : 'এখনই';
    } catch (Exception $e) { return ''; }
}
?>
