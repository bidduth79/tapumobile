
<?php
// api/convert.php
require 'config.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_FILES['file'])) {
    echo json_encode(['success' => false, 'message' => 'File missing']);
    exit;
}

$file = $_FILES['file'];
$format = $_POST['format'] ?? 'mp4';
$quality = $_POST['quality'] ?? '720p';

$allowed_formats = ['mp3', 'aac', 'wav', 'opus', 'mp4', 'mkv', 'avi'];

if (!in_array($format, $allowed_formats)) {
    echo json_encode(['success' => false, 'message' => 'Invalid format']);
    exit;
}

// ফাইল আপলোড
$ext = pathinfo($file['name'], PATHINFO_EXTENSION);
$original_name = pathinfo($file['name'], PATHINFO_FILENAME);
$temp_name = uniqid('src_') . '.' . $ext;
$target_path = $upload_dir . $temp_name;

if (move_uploaded_file($file['tmp_name'], $target_path)) {
    
    $output_filename = uniqid('conv_') . '.' . $format;
    $output_path = $download_dir . $output_filename;

    // Quality Presets
    $video_settings = '';
    $audio_settings = '';

    // Audio Conversion Logic
    if (in_array($format, ['mp3', 'aac', 'wav', 'opus'])) {
        if ($format === 'opus' && $quality === 'voice') {
            // Opus Voice Specific: 16k bitrate, 16000Hz sample rate, Mono (1 channel)
            $audio_settings = '-c:a libopus -b:a 16k -ac 1 -ar 16000 -vbr on';
        } else {
            // Standard Bitrates
            $bitrate = '128k'; // default
            if ($quality === '64k') $bitrate = '64k';
            if ($quality === '24k') $bitrate = '24k';
            
            $codec = '';
            if ($format === 'mp3') $codec = '-c:a libmp3lame';
            elseif ($format === 'aac') $codec = '-c:a aac';
            
            $audio_settings = "$codec -b:a $bitrate";
        }
        $cmd = "$ffmpeg_path -y -i \"$target_path\" -vn $audio_settings \"$output_path\" 2>&1";
    } 
    // Video Conversion Logic
    else {
        // Video Resolution Scale
        $scale = '';
        if ($quality === '720p') $scale = '-vf scale=-2:720';
        elseif ($quality === '480p') $scale = '-vf scale=-2:480';
        elseif ($quality === '360p') $scale = '-vf scale=-2:360';
        elseif ($quality === '240p') $scale = '-vf scale=-2:240';
        else $scale = '-vf scale=-2:720'; // Default fallback

        // Default Video Codecs (H.264 + AAC)
        $video_settings = "-c:v libx264 -preset fast -crf 23 $scale -c:a aac -b:a 128k";
        
        $cmd = "$ffmpeg_path -y -i \"$target_path\" $video_settings \"$output_path\" 2>&1";
    }
    
    $output = shell_exec($cmd);

    if (file_exists($output_path)) {
        // Construct Direct Download URL via serve.php
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
        $host = $_SERVER['HTTP_HOST'];
        $script_dir = dirname($_SERVER['PHP_SELF']); // /licell_mediahub/api
        
        // Clean original name for URL
        $safe_name = preg_replace('/[^a-zA-Z0-9_\-\u0980-\u09FF]/u', '_', $original_name);
        $download_name = $safe_name . '_converted.' . $format;

        // Use serve.php to force download without opening new tab
        $serve_url = $protocol . "://" . $host . $script_dir . '/serve.php?file=' . $output_filename . '&name=' . urlencode($download_name);

        echo json_encode([
            'success' => true,
            'download_url' => $serve_url,
            'filename' => $output_filename
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Conversion failed. FFmpeg might be missing or input file corrupted.',
            'debug' => $output
        ]);
    }

    // টেম্প ফাইল ডিলিট
    if(file_exists($target_path)) unlink($target_path);

} else {
    echo json_encode(['success' => false, 'message' => 'File upload failed. Check PHP upload_max_filesize limit.']);
}
?>
