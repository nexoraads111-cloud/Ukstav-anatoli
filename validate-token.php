<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');

require_once 'db-connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$token = isset($data['token']) ? trim($data['token']) : '';
$projectId = isset($data['project_id']) ? trim($data['project_id']) : '';
$customerName = isset($data['customer_name']) ? trim($data['customer_name']) : '';
$rating = isset($data['rating']) ? intval($data['rating']) : 0;
$commentText = isset($data['comment_text']) ? trim($data['comment_text']) : '';

if (empty($token) || empty($projectId) || empty($customerName) || $rating < 1 || $rating > 5 || empty($commentText)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Všetky polia sú povinné']);
    exit;
}

try {
    $db = getDB();
    $db->beginTransaction();

    $stmt = $db->prepare("
        SELECT id, is_used 
        FROM tokens 
        WHERE token = ? AND project_id = ?
    ");
    $stmt->execute([$token, $projectId]);
    $tokenData = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$tokenData) {
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => 'Neplatný token']);
        exit;
    }

    if ($tokenData['is_used'] == 1) {
        $db->rollBack();
        echo json_encode(['success' => false, 'message' => 'Token už bol použitý']);
        exit;
    }

    $stmt = $db->prepare("
        INSERT INTO comments (token_id, project_id, customer_name, rating, comment_text)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([$tokenData['id'], $projectId, $customerName, $rating, $commentText]);

    $stmt = $db->prepare("
        UPDATE tokens 
        SET is_used = 1, used_at = CURRENT_TIMESTAMP 
        WHERE id = ?
    ");
    $stmt->execute([$tokenData['id']]);

    $db->commit();

    echo json_encode(['success' => true, 'message' => 'Komentár bol úspešne odoslaný']);

} catch (Exception $e) {
    $db->rollBack();
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Chyba servera: ' . $e->getMessage()]);
}
?>