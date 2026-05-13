<?php
// CORS headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Configuration
define('TELEGRAM_BOT_TOKEN', '7962194757:AAG6PXWF2qE00byPoqaOY1KaFDQm61uTEAU');
define('TELEGRAM_CHAT_ID', '740483075');
define('WHATSAPP_TOKEN', 'EACOrhl6bYN0BPzCNZBS1JvReaZCO1GdyBghA5jOisSD5YhWvR2ZBB4HX3h4P3BxioR3ivZAYpnSfDKMb5DRnoRl60FD8gHOqcEaeZBdbRjgfQXaOG3tYFzffcsLRbg7qTyO50pi96hZCg94V3U3ccksvKXZCFKgpCTqsaaqSAs1WaaOPjh4qaQ8cvTqjLCs68z2EzLAfuEZCgPbXK5EpZAAcl0nBpKl685GnWU4ge');
define('WHATSAPP_PHONE_NUMBER_ID', '856492304208579');
define('WHATSAPP_RECIPIENT', '421950880936');
define('LOG_FILE', 'applications.txt');

// Read and validate input
$data = json_decode(file_get_contents('php://input'), true);
$name = isset($data['name']) ? trim($data['name']) : '';
$phone = isset($data['phone']) ? trim($data['phone']) : '';
$description = isset($data['description']) ? trim($data['description']) : '';
$callbackTime = isset($data['callback_time']) ? trim($data['callback_time']) : '';

if (empty($name) || empty($phone)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Meno a telefón sú povinné']);
    exit;
}

// Log the submission
logSubmission($name, $phone, $description, $callbackTime);

// Send notifications
$results = [
    'telegram' => sendTelegramNotification($name, $phone, $description, $callbackTime),
    'whatsapp' => sendWhatsAppNotification($name, $phone, $description, $callbackTime)
];

// Return response
if ($results['telegram'] || $results['whatsapp']) {
    echo json_encode([
        'success' => true,
        'message' => 'Správa odoslaná',
        'details' => $results
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Chyba pri odosielaní',
        'details' => $results
    ]);
}

/**
 * Log submission to file
 */
function logSubmission($name, $phone, $description, $callbackTime) {
    $callback = '';

    if (!empty($callbackTime)) {
        $callback = "$callbackTime";
    }

    $logEntry = date('Y-m-d H:i:s') . " | $name | $phone | $description | $callback \n";
    file_put_contents(LOG_FILE, $logEntry, FILE_APPEND);
}

function formatCallbackInfo($callbackTime) {
    if (empty($callbackTime)) {
        return '';
    }

    $result = '';

    // Add time
    if ($callbackTime === 'anytime') {
        $timeStr = 'В любое время';
    } else {
        $timeStr = $callbackTime;
    }

    if (!empty($result)) {
        $result .= ' в ' . $timeStr;
    } else {
        $result = $timeStr;
    }

    return $result;
}

/**
 * Send notification via Telegram
 */
function sendTelegramNotification($name, $phone, $description, $callbackTime) {
    $message = "🔔 <b>Новый запрос с UKstav.sk</b>\n\n";
    $message .= "👤 <b>Имя:</b> " . htmlspecialchars($name) . "\n";
    $message .= "📞 <b>Телефон:</b> <code>" . htmlspecialchars($phone) . "</code>\n";

    if (!empty($description)) {
        $message .= "📝 <b>Описание:</b>\n" . htmlspecialchars($description) . "\n";
    }

    $callbackInfo = formatCallbackInfo($callbackTime);
    if (!empty($callbackInfo)) {
        $message .= "⏰ <b>Желаемое время звонка:</b> " . htmlspecialchars($callbackInfo) . "\n";
    }

    $message .= "\n🕐 <b>Получено:</b> " . date('d.m.Y H:i:s');

    $url = "https://api.telegram.org/bot" . TELEGRAM_BOT_TOKEN . "/sendMessage";
    $postData = [
        'chat_id' => TELEGRAM_CHAT_ID,
        'text' => $message,
        'parse_mode' => 'HTML'
    ];

    return sendCurlRequest($url, http_build_query($postData), []);
}

/**
 * Send notification via WhatsApp
 */
function sendWhatsAppNotification($name, $phone, $description, $callbackTime) {
    $message = "🔔 *Новый запрос с UKstav.sk*\n\n";
    $message .= "👤 Имя: " . $name . "\n";
    $message .= "📞 Телефон: " . $phone . "\n";

    if (!empty($description)) {
        $message .= "📝 Описание: " . $description . "\n";
    }

    $callbackInfo = formatCallbackInfo($callbackTime);
    if (!empty($callbackInfo)) {
        $message .= "⏰ Желаемое время звонка: " . $callbackInfo . "\n";
    }

    $message .= "\n🕐 Получено: " . date('d.m.Y H:i:s');

    $url = "https://graph.facebook.com/v20.0/" . WHATSAPP_PHONE_NUMBER_ID . "/messages";
    $postData = [
        'messaging_product' => 'whatsapp',
        'to' => WHATSAPP_RECIPIENT,
        'type' => 'text',
        'text' => ['body' => $message]
    ];

    $headers = [
        'Authorization: Bearer ' . WHATSAPP_TOKEN,
        'Content-Type: application/json'
    ];

    return sendCurlRequest($url, json_encode($postData), $headers);
}

/**
 * Send HTTP request using cURL
 */
function sendCurlRequest($url, $postData, $headers = []) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    if (!empty($headers)) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    }

    $response = curl_exec($ch);

    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
//    echo "WhatsApp Response ($httpCode): " . htmlspecialchars($response);
    curl_close($ch);

    if ($httpCode == 200) {
        $responseData = json_decode($response, true);
        return isset($responseData['ok']) || isset($responseData['messages']);
    }

    return false;
}
?>