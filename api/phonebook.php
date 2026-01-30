<?php
// api/phonebook.php
require 'db_connect.php';
header('Content-Type: application/json');

$search = $_GET['q'] ?? '';
$category = $_GET['cat'] ?? '';

try {
    $sql = "SELECT * FROM phone_directory WHERE 1=1";
    $params = [];

    if (!empty($search)) {
        $sql .= " AND (name_bn LIKE ? OR name_en LIKE ? OR phone LIKE ? OR district LIKE ?)";
        $term = "%$search%";
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
        $params[] = $term;
    }

    if (!empty($category)) {
        $sql .= " AND category = ?";
        $params[] = $category;
    }

    $sql .= " ORDER BY category ASC, name_bn ASC";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $contacts = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $contacts]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>