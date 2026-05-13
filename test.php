<?php
$dbDir = __DIR__;
$dbFile = $dbDir . '/var/www/ukstav.sk/db/ukstav.db';

// Ensure directory is writable
if (!is_writable($dbDir)) {
    chmod($dbDir, 0755);
}

try {
    $db = new PDO('sqlite:' . $dbFile);
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $db->exec("
        CREATE TABLE IF NOT EXISTS tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token TEXT UNIQUE NOT NULL,
            project_id TEXT NOT NULL,
            customer_name TEXT,
            customer_email TEXT,
            customer_phone TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            used_at DATETIME,
            is_used INTEGER DEFAULT 0
        )
    ");

    $db->exec("
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            token_id INTEGER NOT NULL,
            project_id TEXT NOT NULL,
            customer_name TEXT NOT NULL,
            rating INTEGER NOT NULL,
            comment_text TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            is_approved INTEGER DEFAULT 1,
            FOREIGN KEY (token_id) REFERENCES tokens(id)
        )
    ");

    if (file_exists($dbFile)) {
        chmod($dbFile, 0666);
    }

    echo "Database initialized successfully!\n";
    echo "Database location: " . $dbFile . "\n";
    echo "Permissions set: 666 (read/write for all)\n";

} catch (PDOException $e) {
    die("Database error: " . $e->getMessage());
}
?>