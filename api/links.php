<?php
// api/links.php
require 'db_connect.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Fetch All Links
    try {
        $stmt = $conn->prepare("SELECT * FROM links ORDER BY sort_order ASC");
        $stmt->execute();
        $links = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Convert integer booleans back to true/false and fix types
        $formatted = array_map(function($link) {
            return [
                'id' => $link['id'],
                'title' => $link['title'],
                'url' => $link['url'],
                'logo' => $link['logo_url'] ?? '',
                'category' => $link['category'],
                'subCategory' => $link['sub_category'],
                'childCategory' => $link['child_category'],
                'isFavorite' => (bool)$link['is_favorite'],
                'order' => (int)$link['sort_order'],
                'lastOpened' => (int)$link['last_opened']
            ];
        }, $links);

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
            $stmt = $conn->prepare("INSERT INTO links (id, title, url, logo_url, category, sub_category, child_category, sort_order, is_favorite) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $data['id'], $data['title'], $data['url'], $data['logo'], 
                $data['category'], $data['subCategory'] ?? '', $data['childCategory'] ?? '', 
                $data['order'] ?? 0, $data['isFavorite'] ? 1 : 0
            ]);
            echo json_encode(['success' => true]);
        }
        elseif ($action === 'add_bulk') {
            $links = $data['links'];
            $conn->beginTransaction();
            $stmt = $conn->prepare("INSERT INTO links (id, title, url, logo_url, category, sub_category, child_category, sort_order, is_favorite) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            foreach($links as $l) {
                $stmt->execute([
                    $l['id'], $l['title'], $l['url'], $l['logo'], 
                    $l['category'], $l['subCategory'] ?? '', $l['childCategory'] ?? '', 
                    $l['order'] ?? 0, 0
                ]);
            }
            $conn->commit();
            echo json_encode(['success' => true]);
        }
        elseif ($action === 'update') {
            $fields = [];
            $params = [];
            
            if (isset($data['title'])) { $fields[] = "title=?"; $params[] = $data['title']; }
            if (isset($data['url'])) { $fields[] = "url=?"; $params[] = $data['url']; }
            if (isset($data['isFavorite'])) { $fields[] = "is_favorite=?"; $params[] = $data['isFavorite'] ? 1 : 0; }
            if (isset($data['lastOpened'])) { $fields[] = "last_opened=?"; $params[] = $data['lastOpened']; }
            // Add other fields as needed

            if (!empty($fields)) {
                $params[] = $data['id'];
                $sql = "UPDATE links SET " . implode(", ", $fields) . " WHERE id=?";
                $stmt = $conn->prepare($sql);
                $stmt->execute($params);
            }
            echo json_encode(['success' => true]);
        }
        elseif ($action === 'delete') {
            $stmt = $conn->prepare("DELETE FROM links WHERE id=?");
            $stmt->execute([$data['id']]);
            echo json_encode(['success' => true]);
        }
        elseif ($action === 'reorder') {
            $conn->beginTransaction();
            $stmt = $conn->prepare("UPDATE links SET sort_order=? WHERE id=?");
            foreach($data['links'] as $item) {
                $stmt->execute([$item['order'], $item['id']]);
            }
            $conn->commit();
            echo json_encode(['success' => true]);
        }
    } catch(PDOException $e) {
        if ($conn->inTransaction()) $conn->rollBack();
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
?>