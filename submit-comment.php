<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'db-connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$projectId = isset($_GET['project_id']) ? trim($_GET['project_id']) : '';

if (empty($projectId)) {
    echo json_encode(['success' => false, 'message' => 'project_id je povinný']);
    exit;
}

try {
    $db = getDB();

    $stmt = $db->prepare("
        SELECT customer_name, rating, comment_text, created_at
        FROM comments
        WHERE project_id = ? AND is_approved = 1
        ORDER BY created_at DESC
    ");
    $stmt->execute([$projectId]);
    $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'comments' => $comments
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Chyba servera: ' . $e->getMessage()]);
}
?>