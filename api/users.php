<?php
// api/users.php
require 'db_connect.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $conn->prepare("SELECT id, username, name, role FROM users");
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        // Security: Never send passwords to frontend
        $formatted = array_map(function($u) {
            $u['password'] = ''; 
            return $u;
        }, $users);
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
            $stmt = $conn->prepare("INSERT INTO users (id, username, password, name, role) VALUES (?, ?, ?, ?, ?)");
            // Hash the password
            $hashed_pass = password_hash($data['password'], PASSWORD_DEFAULT);
            $stmt->execute([$data['id'], $data['username'], $hashed_pass, $data['name'], $data['role']]);
            echo json_encode(['success' => true]);
        }
        elseif ($action === 'update') {
            $sql = "UPDATE users SET name=?, username=?, role=?";
            $params = [$data['name'], $data['username'], $data['role']];
            
            if (!empty($data['password'])) {
                $sql .= ", password=?";
                // Hash new password
                $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
            }
            $sql .= " WHERE id=?";
            $params[] = $data['id'];
            
            $stmt = $conn->prepare($sql);
            $stmt->execute($params);
            echo json_encode(['success' => true]);
        }
        elseif ($action === 'delete') {
            $stmt = $conn->prepare("DELETE FROM users WHERE id=?");
            $stmt->execute([$data['id']]);
            echo json_encode(['success' => true]);
        }
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
?>