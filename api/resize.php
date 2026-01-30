<?php
// api/resize.php
require 'config.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_FILES['image'])) {
    echo json_encode(['success' => false, 'message' => 'No image uploaded']);
    exit;
}

$width = intval($_POST['width'] ?? 800);
$file = $_FILES['image'];
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

$valid_exts = ['jpg', 'jpeg', 'png', 'gif'];

if (!in_array($ext, $valid_exts)) {
    echo json_encode(['success' => false, 'message' => 'Invalid image format']);
    exit;
}

$temp_path = $upload_dir . uniqid() . '.' . $ext;
move_uploaded_file($file['tmp_name'], $temp_path);

// ইমেজ প্রসেসিং
list($orig_w, $orig_h) = getimagesize($temp_path);
$height = ($orig_h / $orig_w) * $width;

$src = null;
if ($ext == 'jpg' || $ext == 'jpeg') $src = imagecreatefromjpeg($temp_path);
elseif ($ext == 'png') $src = imagecreatefrompng($temp_path);
elseif ($ext == 'gif') $src = imagecreatefromgif($temp_path);

if ($src) {
    $dst = imagescale($src, $width, $height);
    
    $output_filename = 'resized_' . uniqid() . '.' . $ext;
    $output_path = $download_dir . $output_filename;

    if ($ext == 'jpg' || $ext == 'jpeg') imagejpeg($dst, $output_path);
    elseif ($ext == 'png') imagepng($dst, $output_path);
    elseif ($ext == 'gif') imagegif($dst, $output_path);

    imagedestroy($src);
    imagedestroy($dst);
    unlink($temp_path);

    echo json_encode([
        'success' => true,
        'download_url' => 'http://localhost/licell_mediahub/downloads/' . $output_filename,
        'filename' => $output_filename
    ]);
} else {
    echo json_encode(['success' => false, 'message' => 'Image processing failed']);
}
?>