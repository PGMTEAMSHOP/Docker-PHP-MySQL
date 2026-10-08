<?php
// api/db.php
header("Content-Type: application/json; charset=UTF-8");

// Set default timezone to Thailand (GMT+7)
date_default_timezone_set('Asia/Bangkok');

// Session configuration
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Discord OAuth2 Credentials
define('DISCORD_CLIENT_ID', '1485220201221066944');
define('DISCORD_CLIENT_SECRET', 'g4AMn_ClEzcxPYMscUPWjhWrQYDaa2zb');
define('DISCORD_REDIRECT_URI', 'https://osx.in.th/api/discord-callback.php');

// Cloudflare Turnstile Credentials
if (!defined('TURNSTILE_SECRET_KEY')) {
    define('TURNSTILE_SECRET_KEY', '0x4AAAAAAENCu6C0OiqltpWDZemsDrazAdc');
}

$host = getenv('DB_HOST') ?: 'mysql';
$db_name = getenv('DB_NAME') ?: "osxhub_db";
$username = getenv('DB_USER') ?: "root";
$password = getenv('DB_PASS') !== false ? getenv('DB_PASS') : "root";

$port = getenv('DB_PORT') ?: '3306';
define('DB_AUTO_MIGRATE', getenv('DB_AUTO_MIGRATE') === false || filter_var(getenv('DB_AUTO_MIGRATE'), FILTER_VALIDATE_BOOLEAN));

try {
    $conn = new PDO("mysql:host=" . $host . ";port=" . $port . ";dbname=" . $db_name . ";charset=utf8mb4", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $exception) {
    echo json_encode([
        "status" => "error",
        "message" => "Database connection error: " . $exception->getMessage()
    ]);
    exit();
}

// Helper to respond with JSON and exit
function respond($status, $message, $data = null) {
    $response = ["status" => $status, "message" => $message];
    if ($data !== null) {
        $response["data"] = $data;
    }
    echo json_encode($response);
    exit();
}

// Auto-migration: Create site_settings table if not exists
if (DB_AUTO_MIGRATE) {
try {
    $conn->exec("CREATE TABLE IF NOT EXISTS site_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Add script_file column to scripts table
    $checkScriptFile = $conn->query("SHOW COLUMNS FROM scripts LIKE 'script_file'")->fetch();
    if (!$checkScriptFile) {
        $conn->exec("ALTER TABLE scripts ADD COLUMN script_file VARCHAR(255) NULL DEFAULT NULL");
    }

    // Add hwid column to keys_store
    $checkHwid = $conn->query("SHOW COLUMNS FROM keys_store LIKE 'hwid'")->fetch();
    if (!$checkHwid) {
        $conn->exec("ALTER TABLE keys_store ADD COLUMN hwid VARCHAR(255) NULL DEFAULT NULL");
    }

    // Add is_banned and ban_reason columns to users
    $checkBanned = $conn->query("SHOW COLUMNS FROM users LIKE 'is_banned'")->fetch();
    if (!$checkBanned) {
        $conn->exec("ALTER TABLE users ADD COLUMN is_banned TINYINT(1) NOT NULL DEFAULT 0");
        $conn->exec("ALTER TABLE users ADD COLUMN ban_reason TEXT NULL DEFAULT NULL");
        $conn->exec("ALTER TABLE users ADD COLUMN last_hwid_reset TIMESTAMP NULL DEFAULT NULL");
    }

    // Add status column to scripts table
    $checkStatus = $conn->query("SHOW COLUMNS FROM scripts LIKE 'status'")->fetch();
    if (!$checkStatus) {
        $conn->exec("ALTER TABLE scripts ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'undetected'");
    }

    // Add banner_url column to scripts table
    $checkBannerUrl = $conn->query("SHOW COLUMNS FROM scripts LIKE 'banner_url'")->fetch();
    if (!$checkBannerUrl) {
        $conn->exec("ALTER TABLE scripts ADD COLUMN banner_url VARCHAR(255) NULL DEFAULT NULL");
    }

    // Add place_ids column to scripts table
    $checkPlaceIds = $conn->query("SHOW COLUMNS FROM scripts LIKE 'place_ids'")->fetch();
    if (!$checkPlaceIds) {
        $conn->exec("ALTER TABLE scripts ADD COLUMN place_ids TEXT NULL DEFAULT NULL");
    }

    // Create discount_codes table
    $conn->exec("CREATE TABLE IF NOT EXISTS discount_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        type VARCHAR(20) NOT NULL DEFAULT 'percent',
        value DECIMAL(10,2) NOT NULL,
        min_purchase DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        max_uses INT NOT NULL DEFAULT 0,
        used_count INT NOT NULL DEFAULT 0,
        expires_at DATETIME NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // Create discount_code_usages table to track per-user limit
    $conn->exec("CREATE TABLE IF NOT EXISTS discount_code_usages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        discount_code_id INT NOT NULL,
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_code (user_id, discount_code_id)
    )");

    // Create redeem_codes table
    $conn->exec("CREATE TABLE IF NOT EXISTS redeem_codes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        reward_type VARCHAR(20) NOT NULL DEFAULT 'balance',
        reward_value DECIMAL(10,2) NOT NULL,
        duration VARCHAR(50) NULL,
        max_uses INT NOT NULL DEFAULT 1,
        used_count INT NOT NULL DEFAULT 0,
        expires_at DATETIME NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // Create redeem_code_usages table to enforce 1ID/1Code limits
    $conn->exec("CREATE TABLE IF NOT EXISTS redeem_code_usages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        redeem_code_id INT NOT NULL,
        redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_redeem (user_id, redeem_code_id)
    )");

    // Add platform column to scripts table
    $checkPlatform = $conn->query("SHOW COLUMNS FROM scripts LIKE 'platform'")->fetch();
    if (!$checkPlatform) {
        $conn->exec("ALTER TABLE scripts ADD COLUMN platform VARCHAR(100) NOT NULL DEFAULT 'Windows 10 & 11'");
    }

    // Add type column to scripts table
    $checkType = $conn->query("SHOW COLUMNS FROM scripts LIKE 'type'")->fetch();
    if (!$checkType) {
        $conn->exec("ALTER TABLE scripts ADD COLUMN type VARCHAR(100) NOT NULL DEFAULT 'Script'");
    }

    // Add discord_id column to users table
    $checkDiscordId = $conn->query("SHOW COLUMNS FROM users LIKE 'discord_id'")->fetch();
    if (!$checkDiscordId) {
        $conn->exec("ALTER TABLE users ADD COLUMN discord_id VARCHAR(50) NULL DEFAULT NULL UNIQUE");
    }

    // Add nickname column to users table
    $checkNickname = $conn->query("SHOW COLUMNS FROM users LIKE 'nickname'")->fetch();
    if (!$checkNickname) {
        $conn->exec("ALTER TABLE users ADD COLUMN nickname VARCHAR(100) NULL DEFAULT NULL");
    }

    // Add avatar_url column to users table
    $checkAvatar = $conn->query("SHOW COLUMNS FROM users LIKE 'avatar_url'")->fetch();
    if (!$checkAvatar) {
        $conn->exec("ALTER TABLE users ADD COLUMN avatar_url TEXT NULL DEFAULT NULL");
    }

    // Make email column nullable in users table to prevent 1364 default value error when users login via Discord
    try {
        $checkEmail = $conn->query("SHOW COLUMNS FROM users LIKE 'email'")->fetch();
        if ($checkEmail && strtoupper($checkEmail['Null']) === 'NO') {
            $conn->exec("ALTER TABLE users MODIFY COLUMN email VARCHAR(100) NULL DEFAULT NULL");
        }
    } catch (PDOException $e) {
        // Ignore if error
    }

    // Add total_deposited column to users table
    $checkTotalDep = $conn->query("SHOW COLUMNS FROM users LIKE 'total_deposited'")->fetch();
    if (!$checkTotalDep) {
        $conn->exec("ALTER TABLE users ADD COLUMN total_deposited DECIMAL(10,2) NOT NULL DEFAULT 0.00");
    }

    // Add auto_key_enabled column to users table (1 = ON, 0 = OFF)
    $checkAutoKey = $conn->query("SHOW COLUMNS FROM users LIKE 'auto_key_enabled'")->fetch();
    if (!$checkAutoKey) {
        $conn->exec("ALTER TABLE users ADD COLUMN auto_key_enabled TINYINT(1) NOT NULL DEFAULT 1");
    }

    // Auto-fix existing keys that contain special characters
    // 1. Fix user_key in users table
    $stmtUsers = $conn->query("SELECT id, user_key FROM users WHERE user_key REGEXP '[^a-zA-Z0-9-]'");
    $usersToFix = $stmtUsers->fetchAll();
    if ($usersToFix) {
        $updateUser = $conn->prepare("UPDATE users SET user_key = ? WHERE id = ?");
        foreach ($usersToFix as $u) {
            // Remove any characters that are NOT alphanumeric or the dash '-'
            $cleanKey = preg_replace('/[^a-zA-Z0-9-]/', '', $u['user_key']);
            // If the key became too short, generate a fresh secure one
            if (strlen($cleanKey) < 15) {
                $cleanKey = generate_user_key();
            }
            $updateUser->execute([$cleanKey, $u['id']]);
        }
    }

    // 2. Fix key_code in keys_store table
    $stmtKeys = $conn->query("SELECT id, key_code FROM keys_store WHERE key_code REGEXP '[^a-zA-Z0-9-]'");
    $keysToFix = $stmtKeys->fetchAll();
    if ($keysToFix) {
        $updateKey = $conn->prepare("UPDATE keys_store SET key_code = ? WHERE id = ?");
        foreach ($keysToFix as $k) {
            $cleanKey = preg_replace('/[^a-zA-Z0-9-]/', '', $k['key_code']);
            if (strlen($cleanKey) < 15) {
                $cleanKey = generate_user_key();
            }
            // Avoid duplicate key code errors
            try {
                $updateKey->execute([$cleanKey, $k['id']]);
            } catch (Exception $ex) {
                $updateKey->execute([generate_user_key(), $k['id']]);
            }
        }
    }
    // Auto-migrate: product_stocks table
    $conn->exec("CREATE TABLE IF NOT EXISTS product_stocks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        content TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'available',
        order_id INT NULL DEFAULT NULL,
        claimed_by INT NULL DEFAULT NULL,
        claimed_at DATETIME NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_product_status (product_id, status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    // Add delivery_type column to scripts table
    $checkDelivery = $conn->query("SHOW COLUMNS FROM scripts LIKE 'delivery_type'")->fetch();
    if (!$checkDelivery) {
        $conn->exec("ALTER TABLE scripts ADD COLUMN delivery_type VARCHAR(50) NOT NULL DEFAULT 'script_key'");
    }
    // Auto-update any existing executable products to delivery_type = 'program'
    $conn->exec("UPDATE scripts SET delivery_type = 'program' WHERE (type = 'EXE' OR script_file LIKE '%.exe%' OR script_file LIKE '%.zip%' OR script_file LIKE '%.rar%') AND delivery_type != 'program'");
    $conn->exec("UPDATE scripts SET delivery_type = 'script' WHERE delivery_type = 'script_key'");

    // Add requires_key column to scripts table (1 = requires license key, 0 = direct/no key)
    $checkReqKey = $conn->query("SHOW COLUMNS FROM scripts LIKE 'requires_key'")->fetch();
    if (!$checkReqKey) {
        $conn->exec("ALTER TABLE scripts ADD COLUMN requires_key TINYINT(1) NOT NULL DEFAULT 1");
    }

    // Add claim_code and order tracking columns to orders table
    $checkClaimCode = $conn->query("SHOW COLUMNS FROM orders LIKE 'claim_code'")->fetch();
    if (!$checkClaimCode) {
        $conn->exec("ALTER TABLE orders ADD COLUMN claim_code VARCHAR(50) NULL DEFAULT NULL");
        $conn->exec("ALTER TABLE orders ADD COLUMN delivery_type VARCHAR(50) NOT NULL DEFAULT 'instant'");
        $conn->exec("ALTER TABLE orders ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'completed'");
        $conn->exec("ALTER TABLE orders ADD COLUMN stock_data TEXT NULL DEFAULT NULL");
        $conn->exec("ALTER TABLE orders ADD COLUMN claimed_at DATETIME NULL DEFAULT NULL");
        $conn->exec("ALTER TABLE orders ADD COLUMN admin_note TEXT NULL DEFAULT NULL");
    }

    // Auto-migrate: announcements table
    $conn->exec("CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'info',
        is_banner TINYINT(1) NOT NULL DEFAULT 1,
        is_popup TINYINT(1) NOT NULL DEFAULT 0,
        image_url TEXT NULL DEFAULT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        banner_link VARCHAR(255) NULL DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $checkIsPopup = $conn->query("SHOW COLUMNS FROM announcements LIKE 'is_popup'")->fetch();
    if (!$checkIsPopup) {
        $conn->exec("ALTER TABLE announcements ADD COLUMN is_popup TINYINT(1) NOT NULL DEFAULT 0");
    }

    $checkImageUrl = $conn->query("SHOW COLUMNS FROM announcements LIKE 'image_url'")->fetch();
    if (!$checkImageUrl) {
        $conn->exec("ALTER TABLE announcements ADD COLUMN image_url TEXT NULL DEFAULT NULL");
    }

    // Auto-fix: If active announcements exist but none have is_popup = 1, enable is_popup = 1
    $checkAnyPopup = $conn->query("SELECT COUNT(*) as cnt FROM announcements WHERE is_popup = 1")->fetch();
    if ($checkAnyPopup && (int)$checkAnyPopup['cnt'] === 0) {
        $conn->exec("UPDATE announcements SET is_popup = 1 WHERE is_active = 1");
    }

    // Auto-migrate: changelogs table
    $conn->exec("CREATE TABLE IF NOT EXISTS changelogs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        version VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        script_id INT NULL DEFAULT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'update',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_script (script_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
} catch (Exception $e) {}
}

// Helper to get site settings
function get_site_setting($conn, $key, $default = '') {
    try {
        $stmt = $conn->prepare("SELECT setting_value FROM site_settings WHERE setting_key = ?");
        $stmt->execute([$key]);
        $row = $stmt->fetch();
        return $row ? $row['setting_value'] : $default;
    } catch (Exception $e) {
        return $default;
    }
}

// Helper to send Discord Webhook
function send_discord_webhook($webhookUrl, $embed) {
    if (empty($webhookUrl)) return false;
    try {
        $payload = json_encode([
            "username" => "OSX HUB Notification",
            "avatar_url" => "https://osx.in.th/img/NewLogo88%20(3).png",
            "embeds" => [$embed]
        ]);

        $ch = curl_init($webhookUrl);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
        curl_setopt($ch, CURLOPT_HEADER, 0);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        $result = curl_exec($ch);
        curl_close($ch);
        return true;
    } catch (Exception $e) {
        return false;
    }
}

function generate_user_key() {
    $prefix = 'OSXHUB-';
    // Use only alphanumeric characters to prevent any URL encoding/decoding and HttpGet parameter separation issues
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    $keyLength = 18;
    $key = '';
    for ($i = 0; $i < $keyLength; $i++) {
        $key .= $chars[random_int(0, strlen($chars) - 1)];
    }
    return $prefix . $key;
}
