
<?php
// api/keywords.php
require 'db_connect.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Fetch Keywords safely
    try {
        $stmt = $conn->query("SELECT * FROM keywords ORDER BY id DESC");
        $keywords = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Fetch Rules safely
        $allRules = [];
        try {
            $stmtRules = $conn->query("SELECT * FROM keyword_rules");
            $allRules = $stmtRules->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            // Rules table might not exist in very old schema
        }

        // Group Rules by Keyword ID
        $rulesMap = [];
        foreach ($allRules as $rule) {
            $kid = $rule['keyword_id'];
            if (!isset($rulesMap[$kid])) {
                $rulesMap[$kid] = [];
            }
            $rulesMap[$kid][] = [
                'id' => $rule['id'],
                'keyword_id' => $rule['keyword_id'],
                'must_include' => isset($rule['must_include']) && $rule['must_include'] ? json_decode($rule['must_include'], true) : [],
                'must_exclude' => isset($rule['must_exclude']) && $rule['must_exclude'] ? json_decode($rule['must_exclude'], true) : [],
                'is_active' => isset($rule['is_active']) ? (bool)$rule['is_active'] : true
            ];
        }

        // Merge with safe defaults for missing columns
        $formatted = array_map(function($k) use ($rulesMap) {
            return [
                'id' => $k['id'],
                'keyword' => $k['keyword'],
                'type' => isset($k['type']) ? $k['type'] : 'monitor',
                'variations' => (isset($k['variations']) && $k['variations']) ? json_decode($k['variations'], true) : [],
                'color' => isset($k['color']) ? $k['color'] : '#0ea5e9',
                'opacity' => isset($k['opacity']) ? (float)$k['opacity'] : 1.0,
                'is_active' => isset($k['is_active']) ? (bool)$k['is_active'] : true,
                'rules' => isset($rulesMap[$k['id']]) ? $rulesMap[$k['id']] : []
            ];
        }, $keywords);

        echo json_encode(['success' => true, 'data' => $formatted]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
} 
elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? '';
    
    try {
        // KEYWORD ACTIONS
        if ($action === 'add') {
            $stmt = $conn->prepare("INSERT INTO keywords (keyword, type, variations, color, opacity, is_active) VALUES (?, ?, ?, ?, ?, ?)");
            $variations = isset($data['variations']) ? json_encode($data['variations'], JSON_UNESCAPED_UNICODE) : '[]';
            $color = isset($data['color']) ? $data['color'] : '#0ea5e9';
            $opacity = isset($data['opacity']) ? $data['opacity'] : 1.0;
            $isActive = isset($data['is_active']) ? ($data['is_active'] ? 1 : 0) : 1;
            
            $stmt->execute([$data['keyword'], $data['type'], $variations, $color, $opacity, $isActive]);
        } 
        elseif ($action === 'update') {
            // Build dynamic update query to handle partial updates
            $fields = [];
            $params = [];
            
            if (isset($data['keyword'])) { $fields[] = "keyword=?"; $params[] = $data['keyword']; }
            if (isset($data['type'])) { $fields[] = "type=?"; $params[] = $data['type']; }
            if (isset($data['variations'])) { $fields[] = "variations=?"; $params[] = json_encode($data['variations'], JSON_UNESCAPED_UNICODE); }
            if (isset($data['color'])) { $fields[] = "color=?"; $params[] = $data['color']; }
            if (isset($data['opacity'])) { $fields[] = "opacity=?"; $params[] = $data['opacity']; }
            if (isset($data['is_active'])) { $fields[] = "is_active=?"; $params[] = $data['is_active'] ? 1 : 0; }
            
            if (!empty($fields)) {
                $params[] = $data['id'];
                $sql = "UPDATE keywords SET " . implode(", ", $fields) . " WHERE id=?";
                $stmt = $conn->prepare($sql);
                $stmt->execute($params);
            }
        }
        elseif ($action === 'delete') {
            $stmt = $conn->prepare("DELETE FROM keywords WHERE id=?");
            $stmt->execute([$data['id']]);
        }
        
        // RULE ACTIONS
        elseif ($action === 'add_rule') {
            $stmt = $conn->prepare("INSERT INTO keyword_rules (keyword_id, must_include, must_exclude, is_active) VALUES (?, ?, ?, 1)");
            $include = isset($data['mustInclude']) ? json_encode($data['mustInclude'], JSON_UNESCAPED_UNICODE) : '[]';
            $exclude = isset($data['mustExclude']) ? json_encode($data['mustExclude'], JSON_UNESCAPED_UNICODE) : '[]';
            $stmt->execute([$data['keyword_id'], $include, $exclude]);
        }
        elseif ($action === 'toggle_rule') {
            $stmt = $conn->prepare("UPDATE keyword_rules SET is_active=? WHERE id=?");
            $stmt->execute([$data['is_active'] ? 1 : 0, $data['rule_id']]);
        }
        elseif ($action === 'delete_rule') {
            $stmt = $conn->prepare("DELETE FROM keyword_rules WHERE id=?");
            $stmt->execute([$data['rule_id']]);
        }

        echo json_encode(['success' => true]);
        
    } catch(PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'DB Error: ' . $e->getMessage()]);
    }
}
?>
