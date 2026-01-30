
<?php
// api/media_tools.php
require 'config.php';
header('Content-Type: application/json');

$action = $_POST['action'] ?? '';

// --- HELPER FUNCTION: GET DURATION ---
function getDuration($file, $ffprobe_path) {
    // ffprobe command to get duration in seconds
    // Note: Assuming standard PATH or config path
    $cmd = "ffprobe -v quiet -print_format json -show_format -show_streams \"$file\"";
    $json = shell_exec($cmd);
    $data = json_decode($json, true);
    return floatval($data['format']['duration'] ?? 0);
}

// 1. UPLOAD TEMP FILE & GET METADATA
if ($action === 'upload_temp') {
    if (!isset($_FILES['file'])) {
        echo json_encode(['success' => false, 'message' => 'No file']); exit;
    }
    $ext = pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION);
    $filename = uniqid('temp_') . '.' . $ext;
    $path = $upload_dir . $filename;
    
    if (move_uploaded_file($_FILES['file']['tmp_name'], $path)) {
        // Quick hack: use ffmpeg to get duration if ffprobe fails/missing
        $cmd = "\"$ffmpeg_path\" -i \"$path\" 2>&1";
        $output = shell_exec($cmd);
        preg_match('/Duration: (\d{2}:\d{2}:\d{2}\.\d{2})/', $output, $matches);
        $durationStr = $matches[1] ?? '00:00:00.00';
        
        // Convert to seconds
        $parts = explode(':', $durationStr);
        $seconds = ($parts[0] * 3600) + ($parts[1] * 60) + floatval($parts[2]);

        // Get URL
        $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
        $host = $_SERVER['HTTP_HOST'];
        $base_url = $protocol . "://" . $host . dirname(dirname($_SERVER['PHP_SELF'])) . '/uploads/' . $filename;

        echo json_encode([
            'success' => true,
            'file_token' => $filename, // Just filename as token
            'duration' => $seconds,
            'url' => $base_url
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Upload failed. Check php.ini upload_max_filesize.']);
    }
}

// 2. CUT MEDIA
elseif ($action === 'cut') {
    $token = $_POST['token'] ?? '';
    $start = $_POST['start'] ?? 0;
    $end = $_POST['end'] ?? 0;
    $mode = $_POST['mode'] ?? 'manual'; // manual or split
    $parts = intval($_POST['parts'] ?? 2);

    $input_path = $upload_dir . basename($token);
    if (!file_exists($input_path)) {
        echo json_encode(['success' => false, 'message' => 'File expired or not found']); exit;
    }

    $ext = pathinfo($input_path, PATHINFO_EXTENSION);
    $results = [];

    if ($mode === 'manual') {
        $output_file = uniqid('cut_') . '.' . $ext;
        $output_path = $download_dir . $output_file;
        
        $duration = $end - $start;
        // Re-encoding is safer for web
        $cmd = "\"$ffmpeg_path\" -ss $start -i \"$input_path\" -t $duration -c:v libx264 -c:a aac -preset fast \"$output_path\" 2>&1";
        shell_exec($cmd);
        
        if (file_exists($output_path)) {
            $results[] = ['name' => $output_file]; 
        }

    } elseif ($mode === 'split') {
        $total_duration = floatval($_POST['total_duration']);
        $segment_len = $total_duration / $parts;

        for ($i = 0; $i < $parts; $i++) {
            $seg_start = $i * $segment_len;
            $output_file = uniqid("part_".($i+1)."_") . '.' . $ext;
            $output_path = $download_dir . $output_file;
            
            $cmd = "\"$ffmpeg_path\" -ss $seg_start -i \"$input_path\" -t $segment_len -c:v libx264 -c:a aac -preset fast \"$output_path\" 2>&1";
            shell_exec($cmd);
            
            if (file_exists($output_path)) {
                $results[] = ['name' => $output_file];
            }
        }
    }

    if (!empty($results)) {
        echo json_encode(['success' => true, 'files' => $results]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Cutting failed.']);
    }
}

// 3. JOIN MEDIA
elseif ($action === 'join') {
    if (!isset($_FILES['files'])) {
        echo json_encode(['success' => false, 'message' => 'No files uploaded']); exit;
    }

    $uploaded_files = [];
    $list_file_content = "";
    
    // Process uploads
    foreach ($_FILES['files']['tmp_name'] as $key => $tmp_name) {
        if ($_FILES['files']['error'][$key] !== UPLOAD_ERR_OK) continue;

        $fname = $_FILES['files']['name'][$key];
        $ext = pathinfo($fname, PATHINFO_EXTENSION);
        $target = $upload_dir . uniqid('join_part_') . '.' . $ext;
        
        if (move_uploaded_file($tmp_name, $target)) {
            $uploaded_files[] = $target;
            // FFmpeg concat requires absolute paths or relative safe paths. 
            $safe_path = str_replace('\\', '/', realpath($target));
            $list_file_content .= "file '$safe_path'\n";
        }
    }

    if (count($uploaded_files) < 2) {
        echo json_encode(['success' => false, 'message' => 'Minimum 2 valid files required for joining.']); exit;
    }

    // Create list file
    $list_file = $upload_dir . uniqid('list_') . '.txt';
    file_put_contents($list_file, $list_file_content);

    // Output file (Use extension of first file)
    $ext = pathinfo($uploaded_files[0], PATHINFO_EXTENSION);
    $output_filename = uniqid('merged_') . '.' . $ext;
    $output_path = $download_dir . $output_filename;

    // Concat command (Safe 0 allows absolute paths)
    // Note: Re-encoding is safer if formats differ, but copy is faster. 
    // Using copy for now as per "Video Joiner" expectation of speed, assuming same format.
    // If different formats, user should use Converter first.
    $cmd = "\"$ffmpeg_path\" -f concat -safe 0 -i \"$list_file\" -c copy \"$output_path\" 2>&1";
    $output = shell_exec($cmd);

    // Cleanup input files and list
    unlink($list_file);
    foreach ($uploaded_files as $f) unlink($f);

    if (file_exists($output_path)) {
        echo json_encode([
            'success' => true, 
            'filename' => $output_filename // Return filename for frontend serve logic
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Join failed. Ensure all videos have same format/codec.', 'debug' => $output]);
    }
}
?>
