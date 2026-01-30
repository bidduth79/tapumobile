<?php
// api/system_status.php
require_once 'db_config.php';

header("Access-Control-Allow-Origin: *");
header('Content-Type: application/json');

// Check DB Connection explicitly
$db_connected = false;
$error_msg = '';
$error_code = 0;

try {
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 3 // 3 seconds timeout
    ];

    $dsn = "mysql:host=$servername;port=$db_port;dbname=$dbname;charset=utf8mb4";
    $conn = new PDO($dsn, $username, $password, $options);
    
    // Try a simple query
    $conn->query("SELECT 1");
    $db_connected = true;
} catch(PDOException $e) {
    $db_connected = false;
    $error_msg = $e->getMessage();
    $error_code = $e->getCode();
} catch(Exception $e) {
    $db_connected = false;
    $error_msg = $e->getMessage();
}

// Disk Space Info
$df = @disk_free_space("C:"); 
$df_gb = $df ? round($df / (1024 * 1024 * 1024), 2) : 0;

$dt = @disk_total_space("C:");
$dt_gb = $dt ? round($dt / (1024 * 1024 * 1024), 2) : 0;

echo json_encode([
    'success' => $db_connected, 
    'db_status' => $db_connected ? 'Connected' : 'Disconnected',
    'db_port' => $db_port,
    'db_error' => $error_msg,
    'db_code' => $error_code,
    'free_space' => $df_gb,
    'total_space' => $dt_gb,
    'server_time' => date('Y-m-d H:i:s'),
    'software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'
]);
?>