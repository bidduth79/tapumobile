
<?php
// api/dashboard_stats.php
require 'db_connect.php';
header('Content-Type: application/json');

try {
    // 1. Total Counts
    $users = $conn->query("SELECT COUNT(*) FROM users")->fetchColumn();
    $links = $conn->query("SELECT COUNT(*) FROM links")->fetchColumn();
    $keywords = $conn->query("SELECT COUNT(*) FROM keywords")->fetchColumn();
    
    // 2. Today's News Count
    $todayStart = strtotime("today") * 1000;
    $todayNews = $conn->query("SELECT COUNT(*) FROM collected_news WHERE timestamp >= $todayStart")->fetchColumn();

    // 3. Database Size (Estimate)
    $stmt = $conn->query("SELECT table_schema AS 'db_name', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'size_mb' FROM information_schema.tables WHERE table_schema = '$dbname' GROUP BY table_schema");
    $dbSize = $stmt->fetch(PDO::FETCH_ASSOC);
    $sizeMB = $dbSize ? $dbSize['size_mb'] . ' MB' : 'Unknown';

    // 4. Server Uptime (Windows/Linux specific, fallback to PHP uptime)
    // Simple mock or system call
    $uptime = @shell_exec('uptime');
    if (!$uptime) $uptime = "Active";

    // 5. Recent Logs
    $logs = $conn->query("SELECT * FROM activity_logs ORDER BY timestamp DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
    $formattedLogs = array_map(function($l) {
        return [
            'id' => $l['id'],
            'user' => $l['user'],
            'action' => $l['action'],
            'type' => isset($l['type']) ? $l['type'] : 'info',
            'details' => isset($l['details']) ? $l['details'] : '',
            'timestamp' => (float)$l['timestamp']
        ];
    }, $logs);

    // 6. Disk Space
    $df = @disk_free_space("."); 
    $df_gb = $df ? round($df / (1024 * 1024 * 1024), 2) : 0;
    $dt = @disk_total_space(".");
    $dt_gb = $dt ? round($dt / (1024 * 1024 * 1024), 2) : 0;

    echo json_encode([
        'success' => true,
        'data' => [
            'total_users' => (int)$users,
            'total_links' => (int)$links,
            'total_keywords' => (int)$keywords,
            'todays_news' => (int)$todayNews,
            'db_size' => $sizeMB,
            'server_uptime' => trim($uptime),
            'recent_logs' => $formattedLogs,
            'disk_free' => $df_gb,
            'disk_total' => $dt_gb
        ]
    ]);

} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
