
<?php
// api/dork_generator.php
// This is actually handled by the frontend (AutoDorker.tsx) which opens Google Links directly.
// However, if we need a backend proxy to bypass restrictions or fetch results, it would go here.
// For now, the user requested "separate proxy", but standard dorking is browser-based.
// We will create a simple redirector to avoid referrer leakage if needed, or just a placeholder.

// Since the implementation in AutoDorker.tsx uses window.open to Google directly (which is the standard way to Dork), 
// this PHP file isn't strictly necessary for the *generation* logic, but can serve as a future expansion point 
// or a simple redirector.

// Let's make it a redirector helper.
header("Access-Control-Allow-Origin: *");

$q = $_GET['q'] ?? '';
if ($q) {
    // Log the dork usage if needed
    // Redirect to Google
    header("Location: https://www.google.com/search?q=" . urlencode($q));
    exit;
} else {
    echo "Dork Generator API Ready.";
}
?>
