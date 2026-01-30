
<?php
// api/settings.php
require 'db_connect.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $conn->query("SELECT * FROM system_settings");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $settings = [];
        foreach($rows as $row) {
            $val = $row['key_value'];
            // Try to parse boolean/numbers
            if ($val === 'true') $val = true;
            elseif ($val === 'false') $val = false;
            elseif (is_numeric($val)) $val = floatval($val);
            
            $settings[$row['key_name']] = $val;
        }
        
        echo json_encode(['success' => true, 'data' => $settings]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
} 
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    try {
        $conn->beginTransaction();
        $stmt = $conn->prepare("REPLACE INTO system_settings (key_name, key_value) VALUES (?, ?)");
        
        foreach ($data as $key => $value) {
            // Convert boolean to string
            if ($value === true) $valStr = 'true';
            elseif ($value === false) $valStr = 'false';
            else $valStr = (string)$value;
            
            $stmt->execute([$key, $valStr]);
        }
        
        $conn->commit();
        echo json_encode(['success' => true]);
    } catch(PDOException $e) {
        $conn->rollBack();
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
?>
