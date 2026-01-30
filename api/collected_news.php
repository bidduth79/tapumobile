
<?php
// api/collected_news.php
require 'db_connect.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

// GET: Fetch collected news (Limit to last 3000 to prevent overload, sorted by timestamp)
if ($method === 'GET') {
    try {
        // Fetch latest 3000 articles
        $stmt = $conn->query("SELECT * FROM collected_news ORDER BY timestamp DESC LIMIT 3000");
        $news = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $formatted = array_map(function($item) {
            return [
                'id' => $item['id'],
                'title' => $item['title'],
                'link' => $item['link'],
                'dateStr' => $item['date_str'],
                'timestamp' => (float)$item['timestamp'],
                'source' => $item['source'],
                'keyword' => $item['keyword'],
                'description' => $item['description'],
                'isLatest' => isset($item['is_latest']) ? (bool)$item['is_latest'] : false
            ];
        }, $news);

        echo json_encode(['success' => true, 'data' => $formatted]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
} 
// POST: Add new articles
elseif ($method === 'POST') {
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);
    $action = $data['action'] ?? '';

    try {
        if ($action === 'add') {
            $articles = $data['articles'];
            $forceMode = $data['force_mode'] ?? false;

            if (!empty($articles)) {
                $conn->beginTransaction();

                // 1. Mark ALL existing news as OLD (is_latest = 0) before inserting new batch
                $conn->exec("UPDATE collected_news SET is_latest = 0");

                // 2. FORCE MODE LOGIC: If enabled, delete existing entries with same link to ensure freshness
                if ($forceMode) {
                    $delStmt = $conn->prepare("DELETE FROM collected_news WHERE link = ?");
                    foreach ($articles as $art) {
                        $delStmt->execute([$art['link']]);
                    }
                }

                // 3. Insert NEW news as LATEST (is_latest = 1)
                $sql = "INSERT IGNORE INTO collected_news (id, title, link, date_str, timestamp, source, keyword, description, is_latest) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)";
                $stmt = $conn->prepare($sql);
                
                foreach ($articles as $art) {
                    $stmt->execute([
                        $art['id'],
                        $art['title'],
                        $art['link'],
                        $art['dateStr'],
                        $art['timestamp'],
                        $art['source'],
                        $art['keyword'],
                        $art['description'] ?? ''
                    ]);
                }
                $conn->commit();
            }
            echo json_encode(['success' => true]);
        }
        elseif ($action === 'delete') {
            $stmt = $conn->prepare("DELETE FROM collected_news WHERE id = ?");
            $stmt->execute([$data['id']]);
            echo json_encode(['success' => true]);
        }
        elseif ($action === 'clear_all') {
            $conn->exec("TRUNCATE TABLE collected_news");
            echo json_encode(['success' => true]);
        }
        elseif ($action === 'cleanup_old') {
            // Delete news older than 15 days
            $cutoff = time() * 1000 - (15 * 24 * 60 * 60 * 1000);
            $stmt = $conn->prepare("DELETE FROM collected_news WHERE timestamp < ?");
            $stmt->execute([$cutoff]);
            echo json_encode(['success' => true]);
        }
    } catch(PDOException $e) {
        if ($conn->inTransaction()) $conn->rollBack();
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
?>
