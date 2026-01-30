<?php
// api/upload_logo.php
require 'config.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_FILES['logo'])) {
    echo json_encode(['success' => false, 'message' => 'No file uploaded']);
    exit;
}

$file = $_FILES['logo'];
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$valid_exts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

if (!in_array($ext, $valid_exts)) {
    echo json_encode(['success' => false, 'message' => 'Invalid image format']);
    exit;
}

// Create uploads/logos directory if not exists
$target_dir = $upload_dir . 'logos/';
if (!file_exists($target_dir)) mkdir($target_dir, 0777, true);

$filename = 'logo_' . uniqid() . '.' . $ext;
$target_path = $target_dir . $filename;

if (move_uploaded_file($file['tmp_name'], $target_path)) {
    // Generate public URL
    // Assuming api/ is accessed via localhost/licell_mediahub/api/
    // We need to return ../uploads/logos/filename relative to the app root or absolute URL
    
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
    $host = $_SERVER['HTTP_HOST'];
    $script_dir = dirname($_SERVER['PHP_SELF']); // /licell_mediahub/api
    $base_url = $protocol . "://" . $host . dirname($script_dir); // /licell_mediahub
    
    // Using relative path for storage in DB is often better, but for simplicity let's return full URL
    // Actually, serving static files:
    $public_url = $base_url . '/uploads/logos/' . $filename;

    echo json_encode([
        'success' => true,
        'url' => $public_url
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Upload failed']);
}
?>