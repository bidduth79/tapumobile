<?php
// api/db_connect.php
error_reporting(E_ALL);
ini_set('display_errors', 0);

require_once 'db_config.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

try {
  $dsn = "mysql:host=$servername;port=$db_port;dbname=$dbname;charset=utf8mb4";
  
  $options = [
      PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
      PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      PDO::ATTR_EMULATE_PREPARES => false,
  ];

  $conn = new PDO($dsn, $username, $password, $options);
  
} catch(PDOException $e) {
  http_response_code(500);
  echo json_encode([
      'success' => false, 
      'message' => 'Database connection failed: ' . $e->getMessage() . ' (Port: ' . $db_port . ')'
  ]);
  exit;
}
?>