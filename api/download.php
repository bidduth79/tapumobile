
<?php
// api/download.php
require 'config.php';
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");

// Increase execution time for large files/conversions
set_time_limit(0);
ini_set('max_execution_time', 0);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid Request']);
    exit;
}

$url = $_POST['url'] ?? '';
$type = $_POST['type'] ?? 'video'; // video or audio
$quality = $_POST['quality'] ?? 'best';
$title = $_POST['title'] ?? 'video'; // New param for filename

if (empty($url)) {
    echo json_encode(['success' => false, 'message' => 'URL is required']);
    exit;
}

// Sanitize Title for Filename (Remove illegal chars, keep Bengali)
// Regex: Allow alphanumeric, spaces, dots, dashes, underscores, and Bengali characters (\x{0980}-\x{09FF})
$safe_title = preg_replace('/[^a-zA-Z0-9_\-\. \x{0980}-\x{09FF}]/u', '', $title);
// Limit length
$safe_title = mb_substr($safe_title, 0, 80); 
if (empty($safe_title)) $safe_title = 'download';

// Ensure download directory exists and use Absolute Path
if (!file_exists($download_dir)) @mkdir($download_dir, 0777, true);
$abs_download_dir = realpath($download_dir) . DIRECTORY_SEPARATOR;

$file_id = uniqid();
$cmd = '';
$filename = '';

// Fix for HTTP 403 Forbidden (YouTube Anti-Bot) & Speed Optimizations
// --concurrent-fragments 4: Downloads parts in parallel (Speed Boost)
// --no-playlist: Prevents downloading whole playlist if URL is one
// --force-ipv4: Sometimes helps with speed/connectivity
$fix_flags = '--extractor-args "youtube:player_client=android" --no-check-certificates --geo-bypass --concurrent-fragments 4 --no-playlist --force-ipv4';

// Handle FFMPEG Path
$ffmpeg_cmd = "";
if (file_exists($ffmpeg_path)) {
    $ffmpeg_dir = dirname($ffmpeg_path);
    $ffmpeg_cmd = "--ffmpeg-location \"$ffmpeg_dir\"";
}

// Determine Output Template (Absolute Path) - Internal ID used for storage
$output_template = $abs_download_dir . $file_id . ".%(ext)s";

if ($type === 'audio') {
    // 2. Audio Processing (Convert to Audio using FFmpeg)
    if ($quality === 'opus_16k_mono') {
        // Highly compressed Opus voice
        $filename = $file_id . '.opus';
        $cmd = "\"$yt_dlp_path\" $fix_flags $ffmpeg_cmd -f \"bestaudio/best\" -x --audio-format opus --postprocessor-args \"ffmpeg:-ac 1 -ar 16000 -b:a 16k\" -o \"$output_template\" \"$url\"";
    } 
    else {
        // Standard MP3 conversion
        $audioArgs = "--audio-quality 192K"; 
        if ($quality === '128k') $audioArgs = "--audio-quality 128K";
        elseif ($quality === '64k') $audioArgs = "--audio-quality 64K";
        elseif ($quality === '24k') $audioArgs = "--audio-quality 24K";
        
        // -x triggers extract audio, --audio-format mp3 triggers conversion
        $cmd = "\"$yt_dlp_path\" $fix_flags $ffmpeg_cmd -f \"bestaudio/best\" -x --audio-format mp3 $audioArgs -o \"$output_template\" \"$url\"";
    }

} else {
    // Video Processing
    // Try to merge video+audio into MP4
    if ($quality === 'best') {
        $cmd = "\"$yt_dlp_path\" $fix_flags $ffmpeg_cmd -f \"bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best\" --merge-output-format mp4 -o \"$output_template\" \"$url\"";
    } else {
        $res = intval($quality);
        if ($res > 0) {
            $cmd = "\"$yt_dlp_path\" $fix_flags $ffmpeg_cmd -f \"bestvideo[height<=$res][ext=mp4]+bestaudio[ext=m4a]/best[height<=$res][ext=mp4]/best\" --merge-output-format mp4 -o \"$output_template\" \"$url\"";
        } else {
            $cmd = "\"$yt_dlp_path\" $fix_flags $ffmpeg_cmd -f \"bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best\" --merge-output-format mp4 -o \"$output_template\" \"$url\"";
        }
    }
}

// Execute Command
$output = shell_exec($cmd . " 2>&1");

// Check if any file was created with the ID
$files = glob($abs_download_dir . $file_id . ".*");

if ($files && count($files) > 0) {
    $final_file_path = $files[0];
    $storage_filename = basename($final_file_path);
    $ext = pathinfo($storage_filename, PATHINFO_EXTENSION);
    
    // Construct public filename using safe title + extension
    $public_filename = $safe_title . '.' . $ext;
    
    // Generate Download Link
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
    $host = $_SERVER['HTTP_HOST'];
    $script_dir = str_replace('\\', '/', dirname($_SERVER['PHP_SELF']));
    
    // Append 'name' parameter for serve.php to use as Content-Disposition filename
    $serve_url = $protocol . "://" . $host . $script_dir . '/serve.php?file=' . $storage_filename . '&name=' . urlencode($public_filename);
    
    echo json_encode([
        'success' => true,
        'message' => 'Download Successful',
        'download_url' => $serve_url,
        'filename' => $public_filename 
    ]);
} else {
    // Check for common errors
    $debug_msg = "Unknown Error";
    if (strpos($output, 'command not found') !== false) $debug_msg = "yt-dlp path incorrect in config.php";
    elseif (strpos($output, 'Permission denied') !== false) $debug_msg = "Permission denied for downloads folder";
    elseif (strpos($output, 'HTTP Error 403') !== false) $debug_msg = "YouTube blocked the request (403)";
    elseif (strpos($output, 'Sign in to confirm') !== false) $debug_msg = "Age restricted / Sign-in required";
    
    echo json_encode([
        'success' => false,
        'message' => 'Download Failed: ' . $debug_msg,
        'debug' => substr($output, -500) // Send last 500 chars of log
    ]);
}
?>
