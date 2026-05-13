<?php
session_start();

if (!isset($_SESSION['initiated'])) {
    session_regenerate_id(true);
    $_SESSION['initiated'] = true;
}

// Credentials (password is hashed)
define('ADMIN_USERNAME', 'anatoly');
define('ADMIN_PASSWORD_HASH', '$2y$10$DDkHGZUIP5hT6lemrCl0xOiJK4UVRInHlII7TsTkyS.cQO9DQEdHu');

function isLoggedIn() {
    return isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
}

// Verify login credentials
function verifyLogin($username, $password) {
    // Rate limiting: prevent brute force
    if (!isset($_SESSION['login_attempts'])) {
        $_SESSION['login_attempts'] = 0;
        $_SESSION['last_attempt'] = time();
    }

    // Reset attempts after 15 minutes
    if (time() - $_SESSION['last_attempt'] > 900) {
        $_SESSION['login_attempts'] = 0;
    }

    // Block after 5 failed attempts
    if ($_SESSION['login_attempts'] >= 5) {
        return false;
    }

    if ($username === ADMIN_USERNAME && password_verify($password, ADMIN_PASSWORD_HASH)) {
        $_SESSION['admin_logged_in'] = true;
        $_SESSION['admin_username'] = $username;
        $_SESSION['login_time'] = time();
        $_SESSION['login_attempts'] = 0;
        session_regenerate_id(true);
        return true;
    }

    $_SESSION['login_attempts']++;
    $_SESSION['last_attempt'] = time();
    return false;
}

// Logout
function logout() {
    session_destroy();
    header('Location: login.php');
    exit;
}

// Require login
function requireLogin() {
    if (!isLoggedIn()) {
        header('Location: login.php');
        exit;
    }

    // Auto-logout after 2 hours
    if (isset($_SESSION['login_time']) && (time() - $_SESSION['login_time']) > 7200) {
        logout();
    }

    $_SESSION['login_time'] = time();
}
?>