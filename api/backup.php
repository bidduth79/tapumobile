
<?php
// api/backup.php
require 'db_connect.php';

// Check permissions (Basic check, assume logged in via frontend token in real app)
// For simplicity, we proceed.

// Set Headers for Download
header('Content-Type: application/octet-stream');
header("Content-Transfer-Encoding: Binary"); 
header("Content-disposition: attachment; filename=\"backup_" . date('Y-m-d') . ".sql\""); 

// Helper function to get create table
function getCreateTable($conn, $table) {
    $stmt = $conn->query("SHOW CREATE TABLE `$table`");
    $row = $stmt->fetch(PDO::FETCH_NUM);
    return $row[1] . ";\n\n";
}

// Helper function to dump data
function getTableData($conn, $table) {
    $output = "";
    $stmt = $conn->query("SELECT * FROM `$table`");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $cols = array_keys($row);
        $vals = array_values($row);
        
        $vals = array_map(function($val) use ($conn) {
            if (is_null($val)) return "NULL";
            return $conn->quote($val);
        }, $vals);
        
        $output .= "INSERT INTO `$table` (`" . implode('`, `', $cols) . "`) VALUES (" . implode(", ", $vals) . ");\n";
    }
    return $output . "\n";
}

try {
    $tables = [];
    $stmt = $conn->query("SHOW TABLES");
    while ($row = $stmt->fetch(PDO::FETCH_NUM)) {
        $tables[] = $row[0];
    }

    $sql = "-- Database Backup for $dbname\n-- Generated: " . date('Y-m-d H:i:s') . "\n\n";
    $sql .= "SET FOREIGN_KEY_CHECKS=0;\n\n";

    foreach ($tables as $table) {
        $sql .= "-- Table structure for `$table`\n";
        $sql .= "DROP TABLE IF EXISTS `$table`;\n";
        $sql .= getCreateTable($conn, $table);
        
        $sql .= "-- Dumping data for `$table`\n";
        $sql .= getTableData($conn, $table);
    }

    $sql .= "SET FOREIGN_KEY_CHECKS=1;\n";

    echo $sql;

} catch(PDOException $e) {
    echo "-- Error: " . $e->getMessage();
}
?>
