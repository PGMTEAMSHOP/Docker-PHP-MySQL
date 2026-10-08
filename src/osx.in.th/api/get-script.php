<?php
// api/get-script.php
require_once 'db.php';

// Allow CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: text/plain; charset=UTF-8");

$keyString = trim($_GET['key'] ?? '');
$hwid = trim($_GET['hwid'] ?? '');
$scriptName = trim($_GET['scriptName'] ?? '');
$safeScriptName = !empty($scriptName) ? (str_ends_with($scriptName, '.lua') ? $scriptName : $scriptName . '.lua') : '';

if (empty($keyString) || empty($hwid)) {
    http_response_code(400);
    echo "Access Denied: Missing parameters";
    exit();
}

try {
    // Re-use logic to verify key and HWID before serving the script
    
    // 1. Check if the keyString belongs to a user (Account Key system)
    $stmt = $conn->prepare('SELECT id, username, is_banned, ban_reason FROM users WHERE user_key = ?');
    $stmt->execute([$keyString]);
    $user = $stmt->fetch();

    $verified = false;
    $message = "Access Denied";

    if ($user) {
        if ($user['is_banned']) {
            http_response_code(401);
            echo "Access Denied: You are banned";
            exit();
        }

        $placeId = isset($_GET['placeId']) ? trim($_GET['placeId']) : '';
        $script = null;

        if (!empty($placeId)) {
            $stmt = $conn->prepare("SELECT id, name, status, script_file, price FROM scripts WHERE FIND_IN_SET(?, REPLACE(place_ids, ' ', '')) > 0 LIMIT 1");
            $stmt->execute([$placeId]);
            $script = $stmt->fetch();
        }

        if (!$script) {
            $stmt = $conn->prepare('SELECT id, name, status, script_file, price FROM scripts WHERE script_file = ? OR script_file = ? LIMIT 1');
            $stmt->execute([$scriptName, $safeScriptName]);
            $script = $stmt->fetch();
        }

        if (!$script) {
            $scriptName = 'Universal.lua';
            $verified = true;
        }

        if ($script) {
            $scriptName = $script['script_file'];
            if ($script['status'] === 'detected') {
                http_response_code(403);
                echo "ไม่สามารถใช้งานได้เพราะสคริปต์ไม่ปลอดภัย";
                exit();
            } elseif ($script['status'] === 'updating') {
                http_response_code(403);
                echo "ไม่สามารถใช้งานได้เนื่องจากกำลังอัพเดตเเก้ไข";
                exit();
            }
            $scriptId = $script['id'];

            if ($script['script_file'] === 'Universal.lua' || $script['script_file'] === 'Universal') {
                $verified = true;
            } else {
                $stmt = $conn->prepare('SELECT id, key_code, duration, status, used_at, hwid FROM keys_store WHERE owner_id = ? AND script_id = ? ORDER BY id DESC');
                $stmt->execute([$user['id'], $scriptId]);
                $keyInfo = $stmt->fetch();

                if ($keyInfo) {
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
                        http_response_code(401);
                        echo "Access Denied: License expired";
                        exit();
                    } else

                    if (empty($keyInfo['hwid']) || $keyInfo['hwid'] === $hwid) {
                        $verified = true;
                    } else {
                        http_response_code(401);
                        echo "Access Denied: HWID mismatch";
                        exit();
                    }
                } elseif (isset($script['price']) && (int)$script['price'] === 0) {
                    // Free script: allowed for all account holders
                    $verified = true;
                } else {
                    // User does not own the specific script -> Reject access (no fallback!)
                    http_response_code(403);
                    echo "Access Denied: You have not purchased this script";
                    exit();
                }
            }
        }
    } else {
        // 2. Fallback: Check if it's a legacy license key code directly in keys_store
        $stmt = $conn->prepare('SELECT k.id, k.hwid, k.owner_id, s.script_file, s.status as script_status FROM keys_store k JOIN scripts s ON k.script_id = s.id WHERE k.key_code = ?');
        $stmt->execute([$keyString]);
        $keyInfo = $stmt->fetch();

        if ($keyInfo) {
            $scriptName = $keyInfo['script_file'];
            if ($keyInfo['script_status'] === 'detected') {
                http_response_code(403);
                echo "ไม่สามารถใช้งานได้เพราะสคริปต์ไม่ปลอดภัย";
                exit();
            } elseif ($keyInfo['script_status'] === 'updating') {
                http_response_code(403);
                echo "ไม่สามารถใช้งานได้เนื่องจากกำลังอัพเดตเเก้ไข";
                exit();
            }
            if (!empty($keyInfo['owner_id'])) {
                $ownerStmt = $conn->prepare('SELECT is_banned FROM users WHERE id = ?');
                $ownerStmt->execute([$keyInfo['owner_id']]);
                $owner = $ownerStmt->fetch();
                if ($owner && $owner['is_banned']) {
                    http_response_code(401);
                    echo "Access Denied: User is banned";
                    exit();
                }
            }

            if (empty($keyInfo['hwid']) || $keyInfo['hwid'] === $hwid) {
                $verified = true;
            } else {
                http_response_code(401);
                echo "Access Denied: HWID mismatch";
                exit();
            }
        }
    }

    if (!$verified) {
        http_response_code(401);
        echo "Access Denied: Invalid key or unauthorized access";
        exit();
    }

    // Serve script
    $safeScriptName = basename($scriptName);
    if (!str_ends_with($safeScriptName, '.lua')) {
        $safeScriptName .= '.lua';
    }
    
    $scriptPath = __DIR__ . '/scripts/' . $safeScriptName;

    if (file_exists($scriptPath)) {
        echo file_get_contents($scriptPath);
    } else {
        http_response_code(404);
        echo "Script Not Found";
    }
} catch (Exception $e) {
    http_response_code(500);
    echo "Internal Server Error: " . $e->getMessage();
}
