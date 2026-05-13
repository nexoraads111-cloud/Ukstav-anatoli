<?php
header('Content-Type: application/json');

require_once 'db-connect.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

$projectId = isset($data['project_id']) ? trim($data['project_id']) : '';
$customerName = isset($data['customer_name']) ? trim($data['customer_name']) : '';
$customerEmail = isset($data['customer_email']) ? trim($data['customer_email']) : '';
$customerPhone = isset($data['customer_phone']) ? trim($data['customer_phone']) : '';

if (empty($projectId)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'project_id je povinný']);
    exit;
}

try {
    $db = getDB();

    $token = bin2hex(random_bytes(16));

    $stmt = $db->prepare("
        INSERT INTO tokens (token, project_id, customer_name, customer_email, customer_phone)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt->execute([$token, $projectId, $customerName, $customerEmail, $customerPhone]);

    $baseUrl = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]";
    $tokenLink = $baseUrl . "/project.html?id=" . $projectId . "&token=" . $token;

    echo json_encode([
        'success' => true,
        'token' => $token,
        'link' => $tokenLink
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Chyba servera: ' . $e->getMessage()]);
}
?>