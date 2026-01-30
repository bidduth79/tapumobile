
<?php
// api/setup.php
require_once 'db_config.php';

header("Access-Control-Allow-Origin: *");
header('Content-Type: application/json');

try {
    $dsn_no_db = "mysql:host=$servername;port=$db_port;charset=utf8mb4";
    $pdo = new PDO($dsn_no_db, $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbname` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'MySQL Connection Failed: ' . $e->getMessage()]);
    exit;
}

try {
    $dsn_with_db = "mysql:host=$servername;port=$db_port;dbname=$dbname;charset=utf8mb4";
    $conn = new PDO($dsn_with_db, $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // --- TABLE CREATION ---

    $conn->exec("CREATE TABLE IF NOT EXISTS `users` (
      `id` varchar(50) NOT NULL,
      `username` varchar(50) NOT NULL UNIQUE,
      `password` varchar(255) NOT NULL,
      `name` varchar(100) NOT NULL,
      `role` enum('admin','user') DEFAULT 'user',
      `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // NEW: Messages Table
    $conn->exec("CREATE TABLE IF NOT EXISTS `user_messages` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `user_id` varchar(50) NOT NULL,
      `message` text NOT NULL,
      `is_read` tinyint(1) DEFAULT 0,
      `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
      `sender` varchar(50) DEFAULT 'System',
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $conn->exec("CREATE TABLE IF NOT EXISTS `links` (
      `id` varchar(50) NOT NULL,
      `title` varchar(100) NOT NULL,
      `url` varchar(500) NOT NULL,
      `logo_url` varchar(500) DEFAULT '',
      `category` varchar(50) NOT NULL,
      `sub_category` varchar(50) DEFAULT '',
      `child_category` varchar(50) DEFAULT '',
      `sort_order` int(11) DEFAULT 0,
      `is_favorite` tinyint(1) DEFAULT 0,
      `last_opened` bigint(20) DEFAULT 0,
      `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $conn->exec("CREATE TABLE IF NOT EXISTS `keywords` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `keyword` varchar(100) NOT NULL,
      `type` varchar(20) DEFAULT 'monitor',
      `variations` text DEFAULT NULL,
      `color` varchar(20) DEFAULT '#0ea5e9',
      `opacity` float DEFAULT 1.0,
      `is_active` tinyint(1) DEFAULT 1,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $conn->exec("CREATE TABLE IF NOT EXISTS `keyword_rules` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `keyword_id` int(11) NOT NULL,
      `must_include` text DEFAULT NULL,
      `must_exclude` text DEFAULT NULL,
      `is_active` tinyint(1) DEFAULT 1,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $conn->exec("CREATE TABLE IF NOT EXISTS `menus` (
      `id` varchar(50) NOT NULL,
      `label` varchar(100) NOT NULL,
      `parent_id` varchar(50) DEFAULT NULL,
      `sort_order` int(11) DEFAULT 0,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $conn->exec("CREATE TABLE IF NOT EXISTS `phone_directory` (
      `id` varchar(50) NOT NULL,
      `name_bn` varchar(255) NOT NULL,
      `name_en` varchar(255) DEFAULT '',
      `designation` varchar(255) DEFAULT '',
      `phone` varchar(100) NOT NULL,
      `email` varchar(100) DEFAULT '',
      `category` varchar(100) NOT NULL,
      `district` varchar(100) DEFAULT '',
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $conn->exec("CREATE TABLE IF NOT EXISTS `activity_logs` (
      `id` varchar(50) NOT NULL,
      `user` varchar(50) NOT NULL,
      `action` varchar(255) NOT NULL,
      `type` varchar(20) DEFAULT 'info',
      `details` text DEFAULT NULL,
      `timestamp` bigint(20) NOT NULL,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $conn->exec("CREATE TABLE IF NOT EXISTS `collected_news` (
      `id` varchar(50) NOT NULL,
      `title` varchar(255) NOT NULL,
      `link` varchar(500) NOT NULL,
      `date_str` varchar(100) DEFAULT '',
      `timestamp` bigint(20) NOT NULL,
      `source` varchar(100) DEFAULT '',
      `keyword` varchar(100) DEFAULT '',
      `description` text DEFAULT NULL,
      `is_latest` tinyint(1) DEFAULT 1,
      `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (`id`),
      UNIQUE KEY `link` (`link`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $conn->exec("CREATE TABLE IF NOT EXISTS `rss_feeds` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `name` varchar(100) NOT NULL,
      `url` varchar(500) NOT NULL,
      `type` varchar(50) DEFAULT 'News',
      `is_active` tinyint(1) DEFAULT 1,
      `status` varchar(20) DEFAULT 'active',
      `last_fetched` bigint(20) DEFAULT 0,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $conn->exec("CREATE TABLE IF NOT EXISTS `spotlight_words` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `word` varchar(100) NOT NULL,
      `variations` text DEFAULT NULL,
      `color` varchar(20) DEFAULT '#ff0000',
      `opacity` float DEFAULT 1.0,
      `is_active` tinyint(1) DEFAULT 1,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    $conn->exec("CREATE TABLE IF NOT EXISTS `system_settings` (
      `key_name` varchar(50) NOT NULL,
      `key_value` text NOT NULL,
      PRIMARY KEY (`key_name`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // NEW: Monitor Channels Table
    $conn->exec("CREATE TABLE IF NOT EXISTS `monitor_channels` (
      `id` int(11) NOT NULL AUTO_INCREMENT,
      `channel_id` varchar(255) NOT NULL, 
      `name` varchar(100) NOT NULL,
      `type` enum('youtube','iptv') DEFAULT 'youtube',
      `is_active` tinyint(1) DEFAULT 1,
      PRIMARY KEY (`id`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // --- MIGRATIONS ---
    try {
        $cols = $conn->query("SHOW COLUMNS FROM keywords")->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('type', $cols)) $conn->exec("ALTER TABLE keywords ADD COLUMN type varchar(20) DEFAULT 'monitor'");
        else $conn->exec("ALTER TABLE keywords MODIFY COLUMN type varchar(20) DEFAULT 'monitor'");
    } catch (Exception $e) {}

    // --- SEED DATA ---
    $stmt = $conn->query("SELECT COUNT(*) FROM users WHERE username = 'admin'");
    if ($stmt->fetchColumn() == 0) {
        $pass = password_hash('123', PASSWORD_DEFAULT);
        $conn->exec("INSERT INTO users (id, username, password, name, role) VALUES ('1', 'admin', '$pass', 'Admin', 'admin')");
    }

    echo json_encode(['success' => true, 'message' => 'Database structure updated.']);

} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Setup Failed: ' . $e->getMessage()]);
}
?>
