<?php
// api/video_info.php
require 'config.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid Request']);
    exit;
}

$url = $_POST['url'] ?? '';

if (empty($url)) {
    echo json_encode(['success' => false, 'message' => 'URL required']);
    exit;
}

// Fix flags for HTTP 403
// Using Android client emulation (User Agent removed to let yt-dlp set correct Android UA)
$fix_flags = '--extractor-args "youtube:player_client=android"';

// JSON আকারে মেটাডাটা পাওয়ার কমান্ড
$cmd = "$yt_dlp_path $fix_flags --dump-json --skip-download --no-warnings \"$url\"";
$output = shell_exec($cmd);

if ($output) {
    $data = json_decode($output, true);
    if ($data) {
        echo json_encode([
            'success' => true,
            'info' => [
                'title' => $data['title'] ?? 'অজানা টাইটেল',
                'thumbnail' => $data['thumbnail'] ?? null,
                'duration_string' => $data['duration_string'] ?? 'N/A',
                'uploader' => $data['uploader'] ?? 'N/A'
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'তথ্য পার্স করা যায়নি (yt-dlp আপডেট প্রয়োজন হতে পারে)']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'ভিডিও পাওয়া যায়নি বা রেস্ট্রিক্টেড']);
}
?>