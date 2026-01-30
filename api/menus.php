<?php
// api/menus.php
error_reporting(E_ALL);
ini_set('display_errors', 0); // Prevent HTML error output

require 'db_connect.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $conn->query("SELECT * FROM menus ORDER BY sort_order ASC");
        $all_menus = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $menuMap = [];
        $menuTree = [];

        // Convert to objects to handle references automatically and safely
        foreach ($all_menus as $menu) {
            $obj = (object) $menu;
            $obj->subItems = [];
            $menuMap[$obj->id] = $obj;
        }

        foreach ($all_menus as $menu) {
            $id = $menu['id'];
            $parentId = $menu['parent_id'];
            
            if ($parentId && isset($menuMap[$parentId])) {
                $menuMap[$parentId]->subItems[] = $menuMap[$id];
            } else {
                $menuTree[] = $menuMap[$id];
            }
        }
        
        echo json_encode(['success' => true, 'data' => $menuTree]);
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
} 
elseif ($method === 'POST') {
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);
    $action = $data['action'] ?? '';

    try {
        if ($action === 'add') {
            $stmt = $conn->prepare("INSERT INTO menus (id, label, parent_id, sort_order) VALUES (?, ?, ?, ?)");
            $stmt->execute([
                $data['id'], 
                $data['label'], 
                !empty($data['parent_id']) ? $data['parent_id'] : null, 
                $data['order'] ?? 0
            ]);
            echo json_encode(['success' => true]);
        }
        elseif ($action === 'delete') {
            $stmt = $conn->prepare("DELETE FROM menus WHERE id = ?");
            $stmt->execute([$data['id']]);
            echo json_encode(['success' => true]);
        }
        elseif ($action === 'update') {
            // Updated logic to allow changing Label, Parent ID and Order
            $parentId = !empty($data['parent_id']) ? $data['parent_id'] : null;
            $stmt = $conn->prepare("UPDATE menus SET label=?, parent_id=?, sort_order=? WHERE id=?");
            $stmt->execute([$data['label'], $parentId, $data['order'] ?? 0, $data['id']]);
            echo json_encode(['success' => true]);
        } else {
             echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
}
?>