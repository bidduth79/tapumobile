
<?php
// api/channels.php
require 'db_connect.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $conn->query("SELECT * FROM monitor_channels ORDER BY id DESC");
        $channels = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'data' => $channels]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
} 
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? '';

    try {
        if ($action === 'add') {
            $stmt = $conn->prepare("INSERT INTO monitor_channels (name, channel_id, type) VALUES (?, ?, ?)");
            $stmt->execute([$data['name'], $data['channel_id'], $data['type']]);
            echo json_encode(['success' => true]);
        }
        elseif ($action === 'update') {
            $stmt = $conn->prepare("UPDATE monitor_channels SET name=?, channel_id=?, type=? WHERE id=?");
            $stmt->execute([$data['name'], $data['channel_id'], $data['type'], $data['id']]);
            echo json_encode(['success' => true]);
        }
        elseif ($action === 'delete') {
            $stmt = $conn->prepare("DELETE FROM monitor_channels WHERE id=?");
            $stmt->execute([$data['id']]);
            echo json_encode(['success' => true]);
        }
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
?>
