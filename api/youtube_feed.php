
<?php
// api/youtube_feed.php

// 1. Start buffering IMMEDIATELY
ob_start();

// 2. Setup Headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json; charset=utf-8');
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");

// 3. Error Handling Setup
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Handle Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    exit(json_encode(['status' => 'ok']));
}

$responseSent = false;

function sendJson($data) {
    global $responseSent;
    if ($responseSent) return;
    if (ob_get_length()) ob_clean();
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PARTIAL_OUTPUT_ON_ERROR);
    $responseSent = true;
    exit;
}

// Fatal Error Handler
register_shutdown_function(function() {
    global $responseSent;
    if (!$responseSent) {
        $error = error_get_last();
        if (ob_get_length()) ob_clean(); 
        if ($error) {
            echo json_encode(['success' => false, 'message' => 'Fatal Error', 'debug' => $error['message']]);
        }
    }
});

try {
    // --- LOAD DB & CONFIG ---
    require 'db_connect.php'; // Include DB connection
    
    // Fallback config values if DB fails
    $monitored_channels = ['UCxH-dK9rL5g5y3w5g']; 
    $youtube_api_key = ''; 

    // Fetch System Settings for API Key
    try {
        $stmt = $conn->query("SELECT key_value FROM system_settings WHERE key_name = 'youtubeApiKey'");
        $dbKey = $stmt->fetchColumn();
        if ($dbKey) {
            // Check if JSON array
            $parsed = json_decode($dbKey, true);
            if (is_array($parsed) && isset($parsed[0]['key'])) {
                $youtube_api_key = $parsed[0]['key']; // Use first active key
            } else {
                $youtube_api_key = $dbKey;
            }
        }
    } catch (Exception $e) {}

    // Fetch Channels from DB (monitor_channels table)
    try {
        $stmt = $conn->query("SELECT channel_id FROM monitor_channels WHERE type = 'youtube' AND is_active = 1");
        $dbChannels = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (!empty($dbChannels)) {
            $monitored_channels = $dbChannels;
        }
    } catch (Exception $e) {}

    // CRITICAL STEP: WIPE BUFFER NOW
    if (ob_get_length()) ob_clean();

    // --- MAIN LOGIC ---
    $cache_file = '../downloads/youtube_cache.json';
    $cache_time = 300; // 5 Minutes Cache

    // Cache Check
    if (!isset($_GET['refresh']) && file_exists($cache_file) && (time() - filemtime($cache_file) < $cache_time)) {
        $cached = file_get_contents($cache_file);
        if ($cached) {
            if (ob_get_length()) ob_clean();
            echo $cached;
            $responseSent = true;
            exit;
        }
    }

    // Prepare API Keys
    $api_keys = [];
    $frontend_key = $_GET['key'] ?? '';
    
    if (!empty($frontend_key) && strlen($frontend_key) > 10) {
        $api_keys[] = $frontend_key;
    } elseif (!empty($youtube_api_key)) {
        $api_keys[] = $youtube_api_key;
    }

    $videos = [];
    $errors = [];

    foreach ($monitored_channels as $channelId) {
        if (strlen($channelId) < 5) continue;
        $found = false;

        // 1. Try API (Convert UC to UU for Playlist)
        if (!empty($api_keys)) {
            $uploadsId = substr_replace($channelId, 'U', 1, 1); 
            
            foreach ($api_keys as $key) {
                $apiUrl = "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=$uploadsId&maxResults=5&key=$key";
                
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $apiUrl);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                $json = curl_exec($ch);
                curl_close($ch);
                
                if ($json) {
                    $data = json_decode($json, true);
                    if (isset($data['items'])) {
                        foreach ($data['items'] as $item) {
                            $videos[] = [
                                'id' => $item['snippet']['resourceId']['videoId'],
                                'title' => $item['snippet']['title'],
                                'thumbnail' => $item['snippet']['thumbnails']['medium']['url'] ?? "https://i.ytimg.com/vi/{$item['snippet']['resourceId']['videoId']}/hqdefault.jpg",
                                'channel' => $item['snippet']['channelTitle'],
                                'publishedAt' => $item['snippet']['publishedAt'],
                                'description' => '',
                                'url' => "https://www.youtube.com/watch?v=" . $item['snippet']['resourceId']['videoId'],
                                'channel_id' => $channelId, // Added for frontend filtering
                                'method' => 'api'
                            ];
                        }
                        $found = true;
                        break; 
                    } else {
                        if (isset($data['error'])) {
                            $errors[] = "API Error ($channelId): " . ($data['error']['message'] ?? 'Unknown');
                        }
                    }
                }
            }
        }

        // 2. Try RSS Fallback
        if (!$found) {
            $rssUrl = "https://www.youtube.com/feeds/videos.xml?channel_id=" . $channelId;
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $rssUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36');
            $raw = curl_exec($ch);
            curl_close($ch);

            if ($raw) {
                libxml_use_internal_errors(true);
                $xml = simplexml_load_string($raw);
                if ($xml && isset($xml->entry)) {
                    $count = 0;
                    foreach ($xml->entry as $entry) {
                        if ($count++ >= 5) break;
                        $children = $entry->children('yt', true);
                        $vidId = (string)$children->videoId;
                        if (!$vidId) continue;
                        
                        $videos[] = [
                            'id' => $vidId,
                            'title' => (string)$entry->title,
                            'thumbnail' => "https://i.ytimg.com/vi/$vidId/hqdefault.jpg",
                            'channel' => (string)$entry->author->name,
                            'publishedAt' => (string)$entry->published,
                            'description' => '',
                            'url' => "https://www.youtube.com/watch?v=$vidId",
                            'channel_id' => $channelId,
                            'method' => 'rss'
                        ];
                    }
                    $found = true;
                }
            }
        }
    }

    if (empty($videos) && empty($monitored_channels)) {
        sendJson(['success' => false, 'message' => 'No channels configured in database.']);
    }

    // Deduplicate & Sort
    $unique = [];
    $ids = [];
    foreach ($videos as $v) {
        if (!in_array($v['id'], $ids)) {
            $ids[] = $v['id'];
            $unique[] = $v;
        }
    }
    
    // Sort Newest First
    usort($unique, function($a, $b) {
        return strtotime($b['publishedAt']) - strtotime($a['publishedAt']);
    });

    $response = [
        'success' => true,
        'videos' => array_slice($unique, 0, 100),
        'updated' => time(),
        'debug' => $errors
    ];

    // Save Cache
    if (!empty($unique)) {
        @file_put_contents($cache_file, json_encode($response));
    }

    sendJson($response);

} catch (Exception $e) {
    sendJson(['success' => false, 'message' => $e->getMessage()]);
}
?>
