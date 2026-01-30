
<?php
// api/maintenance.php
require 'db_connect.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid Request']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$action = $data['action'] ?? '';

try {
    if ($action === 'optimize') {
        $tables = $conn->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        foreach ($tables as $table) {
            $conn->query("OPTIMIZE TABLE `$table`");
        }
        echo json_encode(['success' => true, 'message' => 'All tables optimized successfully.']);
    }
    elseif ($action === 'clear_cache') {
        $files = glob('../downloads/*'); // Adjust path as needed
        $count = 0;
        foreach ($files as $file) {
            if (is_file($file)) {
                unlink($file);
                $count++;
            }
        }
        echo json_encode(['success' => true, 'message' => "$count temporary files deleted."]);
    }
    elseif ($action === 'clear_logs') {
        $conn->exec("TRUNCATE TABLE activity_logs");
        echo json_encode(['success' => true, 'message' => 'Activity logs cleared.']);
    }
    else {
        echo json_encode(['success' => false, 'message' => 'Invalid action.']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
