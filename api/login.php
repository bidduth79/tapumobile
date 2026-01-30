<?php
// api/login.php
require 'db_connect.php';
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Support both JSON and FormData/POST
        $inputJSON = file_get_contents('php://input');
        $input = json_decode($inputJSON, true);
        
        $username = '';
        $password = '';

        if (!empty($_POST['username'])) {
            $username = trim($_POST['username']);
            $password = trim($_POST['password']);
        } elseif (is_array($input) && isset($input['username'])) {
            $username = trim($input['username']);
            $password = trim($input['password']);
        }

        if (empty($username) || empty($password)) {
            echo json_encode(['success' => false, 'message' => 'Username and password required']);
            exit;
        }

        $stmt = $conn->prepare("SELECT * FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            // Check Hash
            if (password_verify($password, $user['password'])) {
                unset($user['password']);
                echo json_encode(['success' => true, 'user' => $user]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Incorrect password']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'User not found']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => 'Login Error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid Request Method']);
}
?>