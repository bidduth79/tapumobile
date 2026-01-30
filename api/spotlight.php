
<?php
// api/spotlight.php
require 'db_connect.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $conn->query("SELECT * FROM spotlight_words ORDER BY id DESC");
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $formatted = array_map(function($item) {
            return [
                'id' => $item['id'],
                'word' => $item['word'],
                'variations' => (isset($item['variations']) && $item['variations']) ? json_decode($item['variations'], true) : [],
                'color' => $item['color'],
                'opacity' => (float)$item['opacity'],
                'isActive' => (bool)$item['is_active']
            ];
        }, $items);

        echo json_encode(['success' => true, 'data' => $formatted]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
} 
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? '';

    try {
        if ($action === 'add') {
            $stmt = $conn->prepare("INSERT INTO spotlight_words (word, variations, color, opacity, is_active) VALUES (?, ?, ?, ?, 1)");
            $variations = json_encode($data['variations'] ?? [], JSON_UNESCAPED_UNICODE);
            $stmt->execute([$data['word'], $variations, $data['color'], $data['opacity']]);
            echo json_encode(['success' => true]);
        }
        elseif ($action === 'update') {
            $stmt = $conn->prepare("UPDATE spotlight_words SET word=?, variations=?, color=?, opacity=? WHERE id=?");
            $variations = json_encode($data['variations'] ?? [], JSON_UNESCAPED_UNICODE);
            $stmt->execute([$data['word'], $variations, $data['color'], $data['opacity'], $data['id']]);
            echo json_encode(['success' => true]);
        }
        elseif ($action === 'delete') {
            $stmt = $conn->prepare("DELETE FROM spotlight_words WHERE id=?");
            $stmt->execute([$data['id']]);
            echo json_encode(['success' => true]);
        }
        elseif ($action === 'toggle') {
            $stmt = $conn->prepare("UPDATE spotlight_words SET is_active=? WHERE id=?");
            $stmt->execute([$data['isActive'] ? 1 : 0, $data['id']]);
            echo json_encode(['success' => true]);
        }
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
?>
