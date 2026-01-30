<?php
// api/cleanup.php
require 'config.php';
header('Content-Type: application/json');

// ১ ঘন্টার পুরনো ফাইল ডিলেট করবে
$expire_time = 3600; 
$count = 0;

function cleanupFolder($dir, $expire) {
    global $count;
    $files = glob($dir . '*');
    foreach ($files as $file) {
        if (is_file($file)) {
            if (time() - filemtime($file) > $expire) {
                unlink($file);
                $count++;
            }
        }
    }
}

cleanupFolder($upload_dir, $expire_time);
cleanupFolder($download_dir, $expire_time);

echo json_encode([
    'success' => true,
    'message' => "Cleaned up $count files",
    'timestamp' => time()
]);
?>