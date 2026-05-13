<?php
function getDB() {
    $dbFile = __DIR__ . '/ukstav.db'; // /var/www/ukstav.sk/db

    if (!file_exists($dbFile)) {
        throw new Exception('Database file not found. Run init-database.php first.' . __DIR__);
    }

    try {
        $db = new PDO('sqlite:' . $dbFile);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $db;
    } catch (PDOException $e) {
        throw new Exception('Database connection failed: ' . $e->getMessage());
    }
}
?>
