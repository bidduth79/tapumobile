
<?php
// api/messages.php
require 'db_connect.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $userId = $_GET['user_id'] ?? '';
    if (!$userId) { echo json_encode(['success' => false]); exit; }

    try {
        $stmt = $conn->prepare("SELECT * FROM user_messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 50");
        $stmt->execute([$userId]);
        $msgs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'data' => $msgs]);
    } catch(PDOException $e) { echo json_encode(['success' => false]); }
} 
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    try {
        $stmt = $conn->prepare("INSERT INTO user_messages (user_id, message, sender) VALUES (?, ?, ?)");
        $stmt->execute([$data['user_id'], $data['message'], $data['sender'] ?? 'Admin']);
        echo json_encode(['success' => true]);
    } catch(PDOException $e) { echo json_encode(['success' => false, 'message' => $e->getMessage()]); }
}
elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    // Mark as read
    try {
        $stmt = $conn->prepare("UPDATE user_messages SET is_read = 1 WHERE id = ?");
        $stmt->execute([$data['id']]);
        echo json_encode(['success' => true]);
    } catch(PDOException $e) { echo json_encode(['success' => false]); }
}
?>
