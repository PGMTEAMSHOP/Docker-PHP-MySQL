<?php
// api/verify.php
require_once 'db.php';

// Allow CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// Auto-migration check: ensure users table has auto_key_enabled column
if (DB_AUTO_MIGRATE) {
try {
    $checkAutoKey = $conn->query("SHOW COLUMNS FROM users LIKE 'auto_key_enabled'")->fetch();
    if (!$checkAutoKey) {
        $conn->exec("ALTER TABLE users ADD COLUMN auto_key_enabled TINYINT(1) NOT NULL DEFAULT 1");
    }
} catch (PDOException $e) {}
}

$keyString = trim($_GET['key'] ?? '');
$hwid = trim($_GET['hwid'] ?? '');
$scriptName = trim($_GET['scriptName'] ?? '');

if (empty($keyString) || empty($hwid)) {
    echo json_encode(["success" => false, "message" => "Missing key or hwid"]);
    exit();
}

$BAN_WEBHOOK_URL = 'https://discord.com/api/webhooks/1502299159636607077/BlthtguetrSlFLxZRa6AjaCZZga10U0PHkqh2u5DWXzi_BzwhQyZNvAC5gMlrK3lfiz6';

function sendBanWebhook($userId, $key, $hwid1, $hwid2, $reason) {
    global $BAN_WEBHOOK_URL;
    $payload = [
        "embeds" => [[
            "title" => "⚠️ เเจ้งเตือนการถูกเเบนจากระบบเเชร์คีย์!",
            "description" => "**คุณ : ** <@$userId> **ถูกเเบนจากระบบกดคีย์เนื่องจากละเมิดข้อกำหนด!**\n\n** คีย์ที่พบการเเเชร์ ⤵︎**\n```\n$key\n```\n** หมายเลข HWID เครื่องเเรกที่ใช้งาน ⤵︎**\n```\n$hwid1\n```\n** หมายเลข HWID เครื่องสองที่ใช้งาน ⤵︎**\n```\n$hwid2\n```\n** รายละเอียดการเเบน ⤵︎**\n```\n$reason\n```\n** หากโดนเเบนจากการสลับเครื่องโดยไม่ได้ตั้งใจสามารถติดต่อเเอดมินให้ปลดเเบนได้ฟรี เเต่หากโดนเเบนจากการเเชร์คีย์ต้องจ่าย 99 บาทเพื่อปลด!**",
            "color" => 16711680,
            "footer" => [
                "text" => "© 2026 Osx Hub. All rights reserved.",
                "icon_url" => "https://images-ext-1.discordapp.net/external/h1eCRwitXe3Ug4yX6RRkiTYQKoTOizDhxnh8xo0Ko6g/https/i.postimg.cc/59SJZPXV/logo1.png"
            ]
        ]]
    ];

    $ch = curl_init($BAN_WEBHOOK_URL);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_exec($ch);
    curl_close($ch);
}

try {
    // 1. Check if the keyString belongs to a user (Account Key system)
    $stmt = $conn->prepare('SELECT id, username, is_banned, ban_reason, user_key, auto_key_enabled FROM users WHERE user_key = ?');
    $stmt->execute([$keyString]);
    $user = $stmt->fetch();

    if ($user) {
        $autoKeyAllowed = isset($user['auto_key_enabled']) ? ((int)$user['auto_key_enabled'] === 1) : true;

        if ($user['is_banned']) {
            echo json_encode(["success" => false, "message" => "Access denied: You are banned for: " . ($user['ban_reason'] ?? 'No reason provided')]);
            exit();
        }

        $placeId = isset($_GET['placeId']) ? trim($_GET['placeId']) : '';

        // If both scriptName and placeId are empty (Fallback for Roblox in-game Universal loader)
        if (empty($scriptName) && empty($placeId)) {
            echo json_encode(["success" => true, "message" => "License verified (Universal Fallback - No Game Script)", "auto_key" => $autoKeyAllowed, "username" => $user['username']]);
            exit();
        }

        // Clean the script name
        $safeScriptName = str_ends_with($scriptName, '.lua') ? $scriptName : $scriptName . '.lua';

        $script = null;

        if (!empty($placeId)) {
            $stmt = $conn->prepare("SELECT id, name, status, script_file, price FROM scripts WHERE FIND_IN_SET(?, REPLACE(place_ids, ' ', '')) > 0 LIMIT 1");
            $stmt->execute([$placeId]);
            $script = $stmt->fetch();
        }
        
        if (!$script && !empty($scriptName)) {
            $stmt = $conn->prepare("SELECT id, name, status, script_file, price FROM scripts WHERE name = ? OR script_file = ? OR script_file = ? LIMIT 1");
            $stmt->execute([$scriptName, $scriptName, $safeScriptName]);
            $script = $stmt->fetch();
        }

        if (!$script) {
            // Universal Fallback for any game not specifically configured in scripts table
            echo json_encode(["success" => true, "message" => "License verified (Universal Fallback - No Game Script)", "auto_key" => $autoKeyAllowed, "username" => $user['username']]);
            exit();
        }

        $scriptName = $script['script_file'];

        if ($script['status'] === 'detected') {
            echo json_encode(["success" => false, "message" => "ไม่สามารถใช้งานได้เพราะสคริปต์ไม่ปลอดภัย"]);
            exit();
        } elseif ($script['status'] === 'updating') {
            echo json_encode(["success" => false, "message" => "ไม่สามารถใช้งานได้เนื่องจากกำลังอัพเดตเเก้ไข"]);
            exit();
        }

        if ($script['script_file'] === 'Universal.lua' || $script['script_file'] === 'Universal') {
            echo json_encode(["success" => true, "message" => "License verified (Universal Gift)", "auto_key" => $autoKeyAllowed, "username" => $user['username']]);
            exit();
        }

        $scriptId = $script['id'];

        // Fetch active or used keys belonging to this owner for this script
        $stmt = $conn->prepare('SELECT id, key_code, duration, status, used_at, hwid FROM keys_store WHERE owner_id = ? AND script_id = ? ORDER BY id DESC');
        $stmt->execute([$user['id'], $scriptId]);
        $keyInfo = $stmt->fetch();

        // Check if this script is free (price = 0)
        $isFree = isset($script['price']) && (int)$script['price'] === 0;

        if (!$keyInfo && $isFree) {
            // Auto grant free license for this registered user
            $keyCode = 'OSX-FREE-' . strtoupper(bin2hex(random_bytes(6)));
            try {
                $stmtInsert = $conn->prepare("INSERT INTO keys_store (script_id, key_code, status, owner_id, used_at, duration, hwid) VALUES (?, ?, 'used', ?, CURRENT_TIMESTAMP, 'ถาวร (ตลอดชีพ)', ?)");
                $stmtInsert->execute([$scriptId, $keyCode, $user['id'], $hwid]);
            } catch (Exception $e) {}
            echo json_encode(["success" => true, "message" => "License verified (Free Script Activated)", "auto_key" => $autoKeyAllowed, "username" => $user['username']]);
            exit();
        }

        if (!$keyInfo) {
            echo json_encode(["success" => false, "message" => "คุณยังไม่ได้ซื้อสิทธิ์การใช้งานสำหรับสคริปต์นี้: " . $script['name']]);
            exit();
        }

        // Check expiration based on duration & purchase/use date
        $usedTime = strtotime($keyInfo['used_at']);
        $now = time();
        $expTime = null;
        $plan = $keyInfo['duration'];

        if (str_contains($plan, '1 วัน')) {
            $expTime = $usedTime + 86400;
        } else if (str_contains($plan, '7 วัน')) {
            $expTime = $usedTime + 86400 * 7;
        } else if (str_contains($plan, '30 วัน')) {
            $expTime = $usedTime + 86400 * 30;
        }

        if ($expTime !== null && $now > $expTime) {
            echo json_encode(["success" => false, "message" => "สิทธิ์การใช้งานของคุณหมดอายุแล้วสำหรับสคริปต์นี้: " . $script['name']]);
            exit();
        }

        // HWID Lock Verification
        if (empty($keyInfo['hwid']) || $keyInfo['hwid'] !== $hwid) {
            // First run or HWID changed: Link/Update HWID in keys_store automatically
            $updateStmt = $conn->prepare('UPDATE keys_store SET hwid = ? WHERE id = ?');
            $updateStmt->execute([$hwid, $keyInfo['id']]);
            echo json_encode(["success" => true, "message" => "License verified (HWID auto-updated)", "auto_key" => $autoKeyAllowed, "username" => $user['username']]);
            exit();
        } else {
            echo json_encode(["success" => true, "message" => "License verified", "auto_key" => $autoKeyAllowed, "username" => $user['username']]);
            exit();
        }
    }

    // 2. Fallback: Check if it's a legacy license key code directly in keys_store
    $stmt = $conn->prepare('SELECT k.id, k.key_code, k.duration, k.status, k.used_at, k.hwid, k.owner_id, s.name as script_name, s.status as script_status ' .
        'FROM keys_store k JOIN scripts s ON k.script_id = s.id WHERE k.key_code = ?');
    $stmt->execute([$keyString]);
    $keyInfo = $stmt->fetch();

    if ($keyInfo) {
        // ตรวจสอบว่าคีย์นี้เป็นของ Product MultiRBX หรือไม่
        if (!empty($scriptName)) {
            $target = strtolower($scriptName);
            $keyScript = strtolower($keyInfo['script_name']);
            if ($keyScript !== $target && $keyScript !== $target . '.lua' && !str_contains($keyScript, $target)) {
                echo json_encode(["success" => false, "message" => "คีย์นี้ไม่ใช่สิทธิ์การใช้งานสำหรับ " . $scriptName . " (สิทธิ์ที่คุณมีคือ: " . $keyInfo['script_name'] . ")"]);
                exit();
            }
        }

        if ($keyInfo['script_status'] === 'detected') {
            echo json_encode(["success" => false, "message" => "ไม่สามารถใช้งานได้เพราะสคริปต์ไม่ปลอดภัย"]);
            exit();
        } elseif ($keyInfo['script_status'] === 'updating') {
            echo json_encode(["success" => false, "message" => "ไม่สามารถใช้งานได้เนื่องจากกำลังอัพเดตเเก้ไข"]);
            exit();
        }
        $legacyAutoKey = true;
        $ownerUsername = null;
        if (!empty($keyInfo['owner_id'])) {
            $ownerStmt = $conn->prepare('SELECT username, is_banned, ban_reason, auto_key_enabled FROM users WHERE id = ?');
            $ownerStmt->execute([$keyInfo['owner_id']]);
            $owner = $ownerStmt->fetch();
            if ($owner) {
                $ownerUsername = $owner['username'] ?? null;
                if ($owner['is_banned']) {
                    echo json_encode(["success" => false, "message" => "Access denied: User is banned"]);
                    exit();
                }
                $legacyAutoKey = isset($owner['auto_key_enabled']) ? ((int)$owner['auto_key_enabled'] === 1) : true;
            }
        }

        // Check HWID
        if (empty($keyInfo['hwid']) || $keyInfo['hwid'] !== $hwid) {
            $updateStmt = $conn->prepare('UPDATE keys_store SET hwid = ? WHERE id = ?');
            $updateStmt->execute([$hwid, $keyInfo['id']]);
            echo json_encode(["success" => true, "message" => "Key verified (HWID auto-updated)", "auto_key" => $legacyAutoKey, "username" => $ownerUsername]);
            exit();
        } else {
            echo json_encode(["success" => true, "message" => "Key verified", "auto_key" => $legacyAutoKey, "username" => $ownerUsername]);
            exit();
        }
    }

    echo json_encode(["success" => false, "message" => "Invalid Account Key or License Key"]);
} catch (Exception $e) {
    echo json_encode(["success" => false, "message" => "Internal server validation error: " . $e->getMessage()]);
}
