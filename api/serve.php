
<?php
// api/serve.php
require 'config.php';

// Get filename and validate
$file = $_GET['file'] ?? '';
$file = basename($file); // Prevent directory traversal (e.g. ../../etc/passwd)

if (!$file) {
    die("No file specified.");
}

$filepath = $download_dir . $file;

if (!file_exists($filepath)) {
    http_response_code(404);
    die("File not found.");
}

// Get MIME type
$mime_type = mime_content_type($filepath);

// Determine download filename (if provided via GET param, otherwise use stored filename)
// 'name' param is sent by download.php containing the sanitized Video Title
$download_name = $_GET['name'] ?? $file;
$download_name = basename(urldecode($download_name)); // Security check to prevent path traversal via name param

// Set headers to force download (3. No separate tab, direct download)
header('Content-Description: File Transfer');
header('Content-Type: application/octet-stream'); // Forces browser to download
header('Content-Disposition: attachment; filename="' . $download_name . '"');
header('Expires: 0');
header('Cache-Control: must-revalidate');
header('Pragma: public');
header('Content-Length: ' . filesize($filepath));

// Clear buffer and read file
ob_clean();
flush();
readfile($filepath);
exit;
?>
