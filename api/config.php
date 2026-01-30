
<?php
// api/config.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

$yt_dlp_path = 'C:/yt-dlp/yt-dlp.exe';
$ffmpeg_path = 'C:/ffmpeg/bin/ffmpeg.exe';

$upload_dir = '../uploads/';
$download_dir = '../downloads/';

if (!file_exists($upload_dir)) @mkdir($upload_dir, 0777, true);
if (!file_exists($download_dir)) @mkdir($download_dir, 0777, true);

$youtube_api_key = 'AIzaSyCjC54heLV6t0lUpRQGhtScNMjSPxAGrGQ';

// Updated Channel List based on user request
$monitored_channels = [
    'UCxH-dK9rL5g5y3w5g',       // Somoy TV
    'UCw6hF_5gE74a5_dI89G-9gQ', // Tritiyo Matra
    'UCnz6h3QyT9sJ3s8K1s8K1s8', // Ekattor TV
    'UC_s0sXj1jL5g5y3w5g',      // Channel i
    'UCHLqIOMPk20w-6cFgkA90jw', // User Provided 1
    'UCNUFterLJ9vpFZZ0try7sLA', // User Provided 2
    'UCN6sm8iHiPd0cnoUardDAnw', // User Provided 3
    'UCtqvtAVmad5zywaziN6CbfA'  // User Provided 4
];
