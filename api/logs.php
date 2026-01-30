
<?php
// api/logs.php
require 'db_connect.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        // Fetch last 500 logs sorted by time
        $stmt = $conn->query("SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 500");
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $formatted = array_map(function($l) {
            return [
                'id' => $l['id'],
                'user' => $l['user'],
                'action' => $l['action'],
                'type' => isset($l['type']) ? $l['type'] : 'info',
                'details' => isset($l['details']) ? $l['details'] : '',
                'timestamp' => (float)$l['timestamp']
            ];
        }, $logs);

        echo json_encode(['success' => true, 'data' => $formatted]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
} 
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Default values
    $type = isset($data['type']) ? $data['type'] : 'info';
    $details = isset($data['details']) ? $data['details'] : '';

    $stmt = $conn->prepare("INSERT INTO activity_logs (id, user, action, type, details, timestamp) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$data['id'], $data['user'], $data['action'], $type, $details, $data['timestamp']]);
    echo json_encode(['success' => true]);
}
?>
