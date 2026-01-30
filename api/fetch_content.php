
<?php
// api/fetch_content.php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

$url = $_POST['url'] ?? '';

if (empty($url)) {
    echo json_encode(['success' => false, 'message' => 'URL is required']);
    exit;
}

function fetchUrlContent($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1); // Follow redirects (Important for Google News links)
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    // Mimic a real browser
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    $html = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);
    
    return $html;
}

$html = fetchUrlContent($url);

if (!$html) {
    echo json_encode(['success' => false, 'message' => 'Failed to load page content.']);
    exit;
}

// Simple Parsing Logic using DOMDocument
$dom = new DOMDocument();
@$dom->loadHTML(mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8'));

$xpath = new DOMXPath($dom);

// Remove unwanted elements (Script, Style, Nav, Footer, etc.)
$removals = $xpath->query('//script | //style | //nav | //header | //footer | //aside | //div[contains(@class, "menu")] | //div[contains(@class, "sidebar")] | //div[contains(@class, "comments")]');
foreach ($removals as $item) {
    $item->parentNode->removeChild($item);
}

// Extract Paragraphs
// We try to find the main article body. Usually contained in <article> or div with specific classes.
// Fallback: Get all <p> tags with significant text length.

$content = "";
$paragraphs = $xpath->query('//p');

foreach ($paragraphs as $p) {
    $text = trim($p->nodeValue);
    // Filter out short junk lines (menus, dates, author names often short)
    if (strlen($text) > 50) { 
        $content .= $text . "\n\n";
    }
}

if (strlen($content) < 100) {
    // Fallback: Try div containing text if p tags failed
    $content = "বিস্তারিত কন্টেন্ট অটোমেটিক ভাবে এক্সট্রাক্ট করা সম্ভব হয়নি। দয়া করে মূল লিংকে ভিজিট করুন।";
}

echo json_encode([
    'success' => true,
    'content' => $content
]);
?>
