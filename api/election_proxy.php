<?php
// api/election_proxy.php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
error_reporting(0); 

$keyword = $_GET['q'] ?? 'রাজনীতি';

// --- 1. HELPER FUNCTIONS ---

function getRandomUserAgent() {
    $agents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0'
    ];
    return $agents[array_rand($agents)];
}

function fetchUrl($url) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);
    curl_setopt($ch, CURLOPT_USERAGENT, getRandomUserAgent());
    curl_setopt($ch, CURLOPT_ENCODING, ''); // Handle gzip
    
    // Better Headers
    $headers = [
        'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language: bn-BD,bn;q=0.9,en-US;q=0.8,en;q=0.7'
    ];
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    $data = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($http_code != 200 || !$data) return false;
    return $data;
}

function time_elapsed_string($datetime) {
    try {
        $now = new DateTime;
        $ago = new DateTime($datetime);
        $diff = $now->diff($ago);
        if ($diff->d > 0) return $diff->d . ' দিন আগে';
        if ($diff->h > 0) return $diff->h . ' ঘণ্টা আগে';
        if ($diff->i > 0) return $diff->i . ' মিনিট আগে';
        return 'এখনই';
    } catch (Exception $e) { return 'কিছুক্ষণ আগে'; }
}

// --- 2. FETCH LOGIC ---

$articles = [];
$encoded_query = urlencode($keyword);

// URL List (Search Focused for Specificity)
// Changed window to 7d (7 days) for better results
$urls = [
    // Google News Search (Most reliable for specific queries)
    'Google News' => "https://news.google.com/rss/search?q={$encoded_query}+when:7d&hl=bn&gl=BD&ceid=BD:bn",
    
    // Bing News Search (Fallback)
    'Bing News'   => "https://www.bing.com/news/search?q={$encoded_query}&format=rss"
];

foreach ($urls as $name => $url) {
    $xml_content = fetchUrl($url);
    
    if ($xml_content) {
        libxml_use_internal_errors(true);
        // Clean XML namespaces which can break simplexml
        $xml_content = preg_replace('/<(\/?)[\w-]+:([^>]+)>/', '', $xml_content);
        $xml = simplexml_load_string($xml_content, 'SimpleXMLElement', LIBXML_NOCDATA);

        if ($xml) {
            $items = isset($xml->channel->item) ? $xml->channel->item : (isset($xml->entry) ? $xml->entry : []);
            $count = 0;
            
            foreach ($items as $item) {
                if ($count >= 15) break; 
                
                $title = (string)($item->title ?? '');
                $link = isset($item->link['href']) ? (string)$item->link['href'] : (string)$item->link;
                $pubDate = (string)($item->pubDate ?? $item->updated ?? date('r'));
                
                // --- RELAXED FILTERING ---
                // We trust the search query mostly, but check for relevancy if it's broad
                $titleLower = mb_strtolower($title, 'UTF-8');
                
                // Broad keywords related to politics/crime/violence
                $relKeywords = ['নির্বাচন', 'ভোট', 'সংঘর্ষ', 'আহত', 'নিহত', 'হামলা', 'বিএনপি', 'আওয়ামী', 'লীগ', 'পুলিশ', 'র‌্যাব', 'বিজিবি', 'বিক্ষোভ', 'সমাবেশ', 'গ্রেপ্তার', 'মামলা', 'খুন', 'লাশ', 'রাজনীতি'];
                
                $isRelevant = false;
                foreach($relKeywords as $rk) {
                    if (mb_strpos($titleLower, $rk) !== false) {
                        $isRelevant = true;
                        break;
                    }
                }

                // Accept if relevant or if query matches title parts
                if ($isRelevant || mb_strpos($titleLower, mb_strtolower($keyword, 'UTF-8')) !== false) {
                    $articles[] = [
                        'title' => strip_tags($title),
                        'link' => $link,
                        'date' => $pubDate,
                        'source' => (string)($item->source ?? $name),
                        'time_ago' => time_elapsed_string($pubDate),
                        'keyword' => $keyword
                    ];
                    $count++;
                }
            }
        }
    }
}

// --- 3. OUTPUT ---

echo json_encode([
    'success' => true,
    'articles' => $articles
], JSON_UNESCAPED_UNICODE);
?>