<?php
require_once 'auth.php';
requireLogin();
require_once __DIR__ . '/../db/db-connect.php';

// Handle actions
$message = '';
$messageType = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $db = getDB();
        $action = $_POST['action'] ?? '';

        switch ($action) {
            case 'delete_token':
                $tokenId = intval($_POST['token_id']);
                $stmt = $db->prepare("DELETE FROM tokens WHERE id = ?");
                $stmt->execute([$tokenId]);
                $message = "Token bol úspešne odstránený";
                $messageType = "success";
                break;

            case 'delete_comment':
                $commentId = intval($_POST['comment_id']);
                $stmt = $db->prepare("DELETE FROM comments WHERE id = ?");
                $stmt->execute([$commentId]);
                $message = "Komentár bol úspešne odstránený";
                $messageType = "success";
                break;

            case 'reset_token':
                $tokenId = intval($_POST['token_id']);
                $stmt = $db->prepare("UPDATE tokens SET is_used = 0, used_at = NULL WHERE id = ?");
                $stmt->execute([$tokenId]);
                $message = "Token bol resetovaný a môže byť znova použitý";
                $messageType = "success";
                break;

            case 'delete_project_tokens':
                $projectId = trim($_POST['project_id']);
                $stmt = $db->prepare("DELETE FROM tokens WHERE project_id = ?");
                $stmt->execute([$projectId]);
                $message = "Všetky tokeny pre projekt boli odstránené";
                $messageType = "success";
                break;

            case 'delete_project_comments':
                $projectId = trim($_POST['project_id']);
                $stmt = $db->prepare("DELETE FROM comments WHERE project_id = ?");
                $stmt->execute([$projectId]);
                $message = "Všetky komentáre pre projekt boli odstránené";
                $messageType = "success";
                break;

            case 'approve_comment':
                $commentId = intval($_POST['comment_id']);
                $stmt = $db->prepare("UPDATE comments SET is_approved = 1 WHERE id = ?");
                $stmt->execute([$commentId]);
                $message = "Komentár bol schválený";
                $messageType = "success";
                break;

            case 'unapprove_comment':
                $commentId = intval($_POST['comment_id']);
                $stmt = $db->prepare("UPDATE comments SET is_approved = 0 WHERE id = ?");
                $stmt->execute([$commentId]);
                $message = "Komentár bol zrušený";
                $messageType = "warning";
                break;
        }
    } catch (Exception $e) {
        $message = "Chyba: " . $e->getMessage();
        $messageType = "error";
    }
}

// Load data
try {
    $db = getDB();

    // Get all tokens
    $stmt = $db->query("
        SELECT t.*, 
               (SELECT COUNT(*) FROM comments c WHERE c.token_id = t.id) as comment_count
        FROM tokens t
        ORDER BY t.created_at DESC
    ");
    $tokens = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get all comments
    $stmt = $db->query("
        SELECT c.*, t.token
        FROM comments c
        LEFT JOIN tokens t ON c.token_id = t.id
        ORDER BY c.created_at DESC
    ");
    $comments = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Get stats by project
    $stmt = $db->query("
        SELECT 
            project_id,
            COUNT(*) as total_tokens,
            SUM(CASE WHEN is_used = 1 THEN 1 ELSE 0 END) as used_tokens,
            (SELECT COUNT(*) FROM comments WHERE project_id = tokens.project_id) as total_comments
        FROM tokens
        GROUP BY project_id
    ");
    $projectStats = $stmt->fetchAll(PDO::FETCH_ASSOC);

} catch (Exception $e) {
    $message = "Chyba načítania dát: " . $e->getMessage();
    $messageType = "error";
}
?>
<!DOCTYPE html>
<html lang="sk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Správa tokenov a komentárov - UKstav Admin</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: Arial, sans-serif;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #1e40af;
            margin-bottom: 30px;
            border-bottom: 3px solid #1e40af;
            padding-bottom: 10px;
        }
        h2 {
            color: #3b82f6;
            margin: 30px 0 15px;
            font-size: 1.3em;
        }
        .message {
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            font-weight: bold;
        }
        .message.success { background: #d1fae5; color: #065f46; border: 1px solid #10b981; }
        .message.error { background: #fee2e2; color: #991b1b; border: 1px solid #ef4444; }
        .message.warning { background: #fef3c7; color: #92400e; border: 1px solid #f59e0b; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 0.9em;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        th {
            background: #f3f4f6;
            font-weight: 600;
            color: #374151;
        }
        tr:hover { background: #f9fafb; }
        .btn {
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.85em;
            margin: 2px;
            transition: all 0.2s;
        }
        .btn-delete { background: #ef4444; color: white; }
        .btn-delete:hover { background: #dc2626; }
        .btn-reset { background: #f59e0b; color: white; }
        .btn-reset:hover { background: #d97706; }
        .btn-approve { background: #10b981; color: white; }
        .btn-approve:hover { background: #059669; }
        .btn-danger { background: #dc2626; color: white; padding: 10px 20px; }
        .btn-danger:hover { background: #991b1b; }
        .badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
        }
        .badge-used { background: #fee2e2; color: #991b1b; }
        .badge-unused { background: #d1fae5; color: #065f46; }
        .badge-approved { background: #d1fae5; color: #065f46; }
        .badge-pending { background: #fef3c7; color: #92400e; }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .stat-card {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
        }
        .stat-card h3 { margin-bottom: 10px; font-size: 1em; color: #6b7280; }
        .stat-card .stat-value { font-size: 2em; font-weight: bold; color: #1e40af; }
        .danger-zone {
            background: #fef2f2;
            border: 2px solid #ef4444;
            padding: 20px;
            border-radius: 8px;
            margin: 30px 0;
        }
        .danger-zone h3 { color: #dc2626; margin-bottom: 15px; }
        .actions { white-space: nowrap; }
        .token-link {
            font-size: 0.8em;
            color: #6b7280;
            word-break: break-all;
            max-width: 200px;
            display: inline-block;
        }
        .nav-links {
            margin-bottom: 20px;
        }
        .nav-links a {
            display: inline-block;
            padding: 10px 15px;
            background: #3b82f6;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-right: 10px;
        }
        .nav-links a:hover { background: #2563eb; }
    </style>
</head>
<body>
<div class="container">
    <h1>🔧 Управління токенами та коментарями</h1>

    <div class="nav-links">
        <a href="token-generator.php">➕ Генерувати токен</a>
        <a href="../db/test.php">🔍 Тест бази даних</a>
        <a href="logout.php" style="background: #ef4444;">🚪 Вийти</a>
    </div>

    <?php if ($message): ?>
        <div class="message <?php echo $messageType; ?>">
            <?php echo htmlspecialchars($message); ?>
        </div>
    <?php endif; ?>

    <!-- Statistics -->
    <h2>📊 Статистика за проєктами</h2>
    <div class="stats-grid">
        <?php foreach ($projectStats as $stat): ?>
            <div class="stat-card">
                <h3><?php echo htmlspecialchars($stat['project_id']); ?></h3>
                <div class="stat-value"><?php echo $stat['total_tokens']; ?></div>
                <p>Токенів всього | Використано: <?php echo $stat['used_tokens']; ?> | Коментарі: <?php echo $stat['total_comments']; ?></p>
            </div>
        <?php endforeach; ?>
    </div>

    <!-- Tokens Table -->
    <h2>🎫 Всі токени</h2>
    <table>
        <thead>
        <tr>
            <th>ID</th>
            <th>Проєкт</th>
            <th>Токен</th>
            <th>Клієнт</th>
            <th>Телефон</th>
            <th>Стан</th>
            <th>Створено</th>
            <th>Використано</th>
            <th>Коментарі</th>
            <th>Дії</th>
        </tr>
        </thead>
        <tbody>
        <?php foreach ($tokens as $token): ?>
            <tr>
                <td><?php echo $token['id']; ?></td>
                <td><?php echo htmlspecialchars($token['project_id']); ?></td>
                <td>
                    <span class="token-link"><?php echo htmlspecialchars($token['token']); ?></span>
                </td>
                <td><?php echo htmlspecialchars($token['customer_name'] ?? '-'); ?></td>
                <td><?php echo htmlspecialchars($token['customer_phone'] ?? '-'); ?></td>
                <td>
                    <?php if ($token['is_used']): ?>
                        <span class="badge badge-used">Використаний</span>
                    <?php else: ?>
                        <span class="badge badge-unused">Не використаний</span>
                    <?php endif; ?>
                </td>
                <td><?php echo date('d.m.Y H:i', strtotime($token['created_at'])); ?></td>
                <td><?php echo $token['used_at'] ? date('d.m.Y H:i', strtotime($token['used_at'])) : '-'; ?></td>
                <td><?php echo $token['comment_count']; ?></td>
                <td class="actions">
                    <?php if ($token['is_used']): ?>
                        <form method="POST" style="display: inline;" onsubmit="return confirm('Ви справді хочете скинути цей токен?');">
                            <input type="hidden" name="action" value="reset_token">
                            <input type="hidden" name="token_id" value="<?php echo $token['id']; ?>">
                            <button type="submit" class="btn btn-reset">🔄 Скинути</button>
                        </form>
                    <?php endif; ?>
                    <form method="POST" style="display: inline;" onsubmit="return confirm('Ви справді хочете видалити цей токен?');">
                        <input type="hidden" name="action" value="delete_token">
                        <input type="hidden" name="token_id" value="<?php echo $token['id']; ?>">
                        <button type="submit" class="btn btn-delete">🗑️ Видалити</button>
                    </form>
                </td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>

    <!-- Comments Table -->
    <h2>💬 Всі коментарі</h2>
    <table>
        <thead>
        <tr>
            <th>ID</th>
            <th>Проєкт</th>
            <th>Клієнт</th>
            <th>Оцінка</th>
            <th>Коментар</th>
            <th>Стан</th>
            <th>Створено</th>
            <th>Дії</th>
        </tr>
        </thead>
        <tbody>
        <?php foreach ($comments as $comment): ?>
            <tr>
                <td><?php echo $comment['id']; ?></td>
                <td><?php echo htmlspecialchars($comment['project_id']); ?></td>
                <td><?php echo htmlspecialchars($comment['customer_name']); ?></td>
                <td><?php echo str_repeat('⭐', $comment['rating']); ?></td>
                <td style="max-width: 300px;"><?php echo htmlspecialchars(substr($comment['comment_text'], 0, 100)) . (strlen($comment['comment_text']) > 100 ? '...' : ''); ?></td>
                <td>
                    <?php if ($comment['is_approved']): ?>
                        <span class="badge badge-approved">Схвалений</span>
                    <?php else: ?>
                        <span class="badge badge-pending">Очікує</span>
                    <?php endif; ?>
                </td>
                <td><?php echo date('d.m.Y H:i', strtotime($comment['created_at'])); ?></td>
                <td class="actions">
                    <?php if (!$comment['is_approved']): ?>
                        <form method="POST" style="display: inline;">
                            <input type="hidden" name="action" value="approve_comment">
                            <input type="hidden" name="comment_id" value="<?php echo $comment['id']; ?>">
                            <button type="submit" class="btn btn-approve">✓ Схвалити</button>
                        </form>
                    <?php else: ?>
                        <form method="POST" style="display: inline;">
                            <input type="hidden" name="action" value="unapprove_comment">
                            <input type="hidden" name="comment_id" value="<?php echo $comment['id']; ?>">
                            <button type="submit" class="btn btn-reset">✗ Скасувати</button>
                        </form>
                    <?php endif; ?>
                    <form method="POST" style="display: inline;" onsubmit="return confirm('Ви справді хочете видалити цей коментар?');">
                        <input type="hidden" name="action" value="delete_comment">
                        <input type="hidden" name="comment_id" value="<?php echo $comment['id']; ?>">
                        <button type="submit" class="btn btn-delete">🗑️ Видалити</button>
                    </form>
                </td>
            </tr>
        <?php endforeach; ?>
        </tbody>
    </table>

    <!-- Danger Zone -->
<!--    <div class="danger-zone">-->
<!--        <h3>⚠️ Небезпечна зона</h3>-->
<!--        <p style="margin-bottom: 15px;">Ці дії видалять всі дані для обраного проєкту. Ця операція незворотна!</p>-->
<!---->
<!--        <form method="POST" style="display: inline-block; margin-right: 20px;" onsubmit="return confirm('Ви СПРАВДІ хочете видалити ВСІ ТОКЕНИ для цього проєкту? Ця дія незворотна!');">-->
<!--            <input type="hidden" name="action" value="delete_project_tokens">-->
<!--            <label>Проєкт:-->
<!--                <select name="project_id" required style="padding: 5px; margin: 0 10px;">-->
<!--                    <option value="">Оберіть проєкт</option>-->
<!--                    --><?php //foreach ($projectStats as $stat): ?>
<!--                        <option value="--><?php //echo htmlspecialchars($stat['project_id']); ?><!--">-->
<!--                            --><?php //echo htmlspecialchars($stat['project_id']); ?>
<!--                        </option>-->
<!--                    --><?php //endforeach; ?>
<!--                </select>-->
<!--            </label>-->
<!--            <button type="submit" class="btn btn-danger">🗑️ Видалити всі токени</button>-->
<!--        </form>-->
<!---->
<!--        <form method="POST" style="display: inline-block;" onsubmit="return confirm('Ви СПРАВДІ хочете видалити ВСІ КОМЕНТАРІ для цього проєкту? Ця дія незворотна!');">-->
<!--            <input type="hidden" name="action" value="delete_project_comments">-->
<!--            <label>Проєкт:-->
<!--                <select name="project_id" required style="padding: 5px; margin: 0 10px;">-->
<!--                    <option value="">Оберіть проєкт</option>-->
<!--                    --><?php //foreach ($projectStats as $stat): ?>
<!--                        <option value="--><?php //echo htmlspecialchars($stat['project_id']); ?><!--">-->
<!--                            --><?php //echo htmlspecialchars($stat['project_id']); ?>
<!--                        </option>-->
<!--                    --><?php //endforeach; ?>
<!--                </select>-->
<!--            </label>-->
<!--            <button type="submit" class="btn btn-danger">🗑️ Видалити всі коментарі</button>-->
<!--        </form>-->
<!--    </div>-->
</div>
</body>
</html>