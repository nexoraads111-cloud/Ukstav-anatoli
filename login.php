<?php
require_once 'auth.php';
requireLogin();
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Debug: Loading manage-tokens.php</h1>";
echo "<hr>";

// Step 1: Check file paths
echo "<h2>Step 1: File Paths</h2>";
$dbConnectPath = __DIR__ . '/../db/db-connect.php';
echo "db-connect.php path: <strong>$dbConnectPath</strong><br>";
echo "File exists: " . (file_exists($dbConnectPath) ? "✅ Yes" : "❌ No") . "<br>";
echo "<hr>";

// Step 2: Try to require db-connect
echo "<h2>Step 2: Loading db-connect.php</h2>";
try {
    require_once $dbConnectPath;
    echo "✅ db-connect.php loaded successfully<br>";
} catch (Exception $e) {
    echo "❌ Error loading db-connect.php: " . $e->getMessage() . "<br>";
    exit;
}
echo "<hr>";

// Step 3: Try to connect to database
echo "<h2>Step 3: Database Connection</h2>";
try {
    $db = getDB();
    echo "✅ Database connection successful<br>";
} catch (Exception $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "<br>";
    exit;
}
echo "<hr>";

// Step 4: Try to query tokens
echo "<h2>Step 4: Query Tokens</h2>";
try {
    $stmt = $db->query("SELECT COUNT(*) as count FROM tokens");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "✅ Tokens count: " . $result['count'] . "<br>";
} catch (Exception $e) {
    echo "❌ Query failed: " . $e->getMessage() . "<br>";
    exit;
}
echo "<hr>";

// Step 5: Try to query comments
echo "<h2>Step 5: Query Comments</h2>";
try {
    $stmt = $db->query("SELECT COUNT(*) as count FROM comments");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "✅ Comments count: " . $result['count'] . "<br>";
} catch (Exception $e) {
    echo "❌ Query failed: " . $e->getMessage() . "<br>";
    exit;
}
echo "<hr>";

// Step 6: Try complex query
echo "<h2>Step 6: Complex Query (with join)</h2>";
try {
    $stmt = $db->query("
        SELECT t.*, 
               (SELECT COUNT(*) FROM comments c WHERE c.token_id = t.id) as comment_count
        FROM tokens t
        LIMIT 1
    ");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "✅ Complex query successful<br>";
    if ($result) {
        echo "Sample data: " . json_encode($result) . "<br>";
    }
} catch (Exception $e) {
    echo "❌ Complex query failed: " . $e->getMessage() . "<br>";
}
echo "<hr>";

echo "<h2>✅ All checks passed!</h2>";
echo "<p>If you see this, the issue is with the HTML rendering in manage-tokens.php</p>";
echo '<p><a href="manage-tokens.php">Try loading manage-tokens.php now</a></p>';
?>