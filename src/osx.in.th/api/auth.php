<?php
// api/auth.php
require_once 'db.php';

/**
 * Verify Cloudflare Turnstile token via siteverify API
 * @param string $token - Token received from frontend
 * @return bool - true if valid, false otherwise
 */
function verifyTurnstile($token) {
    if (empty($token)) return false;

    $url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    $data = [
        'secret' => TURNSTILE_SECRET_KEY,
        'response' => $token,
    ];

    // Add client IP if available
    if (!empty($_SERVER['REMOTE_ADDR'])) {
        $data['remoteip'] = $_SERVER['REMOTE_ADDR'];
    }

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    $response = curl_exec($ch);
    curl_close($ch);

    if (!$response) return false;

    $result = json_decode($response, true);
    return isset($result['success']) && $result['success'] === true;
}

// Auto-migration check: ensure users table has user_key column
if (DB_AUTO_MIGRATE) {
try {
    $checkUserKey = $conn->query("SHOW COLUMNS FROM users LIKE 'user_key'")->fetch();
    if (!$checkUserKey) {
        $conn->exec("ALTER TABLE users ADD COLUMN user_key VARCHAR(64) NULL DEFAULT NULL UNIQUE");
    }
} catch (PDOException $e) {
    // Fail silently
}
}

function generateUserKey() {
    return generate_user_key();
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

// Parse JSON request body
$input = json_decode(file_get_contents('php://input'), true);

if ($action === 'register') {
    $username = isset($input['username']) ? trim($input['username']) : '';
    $email = isset($input['email']) ? trim($input['email']) : '';
    $password = isset($input['password']) ? trim($input['password']) : '';

    // Turnstile CAPTCHA disabled
    // $turnstileToken = isset($input['cf_turnstile_token']) ? $input['cf_turnstile_token'] : '';
    // if (!verifyTurnstile($turnstileToken)) {
    //     respond('error', 'กรุณายืนยัน CAPTCHA ให้ถูกต้อง');
    // }

    if (empty($username) || empty($email) || empty($password)) {
        respond('error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
    }

    if (preg_match('/\s/', $username)) {
        respond('error', 'ชื่อผู้ใช้ต้องไม่มีช่องว่างหรือเว้นวรรค');
    }

    if (!preg_match('/^[a-zA-Z0-9_-]+$/', $username)) {
        respond('error', 'ชื่อผู้ใช้ต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข ตัวขีดล่าง (_) หรือตัวขีดกลาง (-) เท่านั้น (ห้ามใช้ภาษาไทยหรืออักขระพิเศษ)');
    }

    if (strlen($username) < 3 || strlen($username) > 30) {
        respond('error', 'ชื่อผู้ใช้ต้องมีความยาว 3 ถึง 30 ตัวอักษร');
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        respond('error', 'รูปแบบอีเมลไม่ถูกต้อง');
    }

    if (strlen($password) < 6) {
        respond('error', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
    }

    // Check if user already exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $email]);
    if ($stmt->fetch()) {
        respond('error', 'ชื่อผู้ใช้หรืออีเมลนี้มีอยู่ในระบบแล้ว');
    }

    // Hash password and insert with generated user key
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $user_key = generateUserKey();
    try {
        $stmt = $conn->prepare("INSERT INTO users (username, password, email, user_key) VALUES (?, ?, ?, ?)");
        $stmt->execute([$username, $hashedPassword, $email, $user_key]);
        respond('success', 'สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ');
    } catch (PDOException $e) {
        respond('error', 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' . $e->getMessage());
    }
}

elseif ($action === 'login') {
    $username = isset($input['username']) ? trim($input['username']) : '';
    $password = isset($input['password']) ? trim($input['password']) : '';

    if (empty($username) || empty($password)) {
        respond('error', 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
    }

    // Turnstile CAPTCHA disabled
    // $turnstileToken = isset($input['cf_turnstile_token']) ? $input['cf_turnstile_token'] : '';
    // if (!verifyTurnstile($turnstileToken)) {
    //     respond('error', 'กรุณายืนยัน CAPTCHA ให้ถูกต้อง');
    // }

    $stmt = $conn->prepare("SELECT * FROM users WHERE username = ? OR email = ?");
    $stmt->execute([$username, $username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password'])) {
        // Log user in by saving user id and details in session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role'] = $user['role'];

        // Lazy-generate user key if empty
        if (empty($user['user_key'])) {
            $newKey = generateUserKey();
            try {
                $stmtUpdate = $conn->prepare("UPDATE users SET user_key = ? WHERE id = ?");
                $stmtUpdate->execute([$newKey, $user['id']]);
                $user['user_key'] = $newKey;
            } catch (PDOException $ex) {}
        }

        // Clean user data for response
        unset($user['password']);
        respond('success', 'เข้าสู่ระบบสำเร็จ!', $user);
    } else {
        respond('error', 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }
}

elseif ($action === 'status') {
    if (isset($_SESSION['user_id'])) {
        $stmt = $conn->prepare("SELECT id, username, email, balance, role, discord_id, user_key, nickname, avatar_url, total_deposited, auto_key_enabled FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $user = $stmt->fetch();
        if ($user) {
            // Lazy-generate user key if empty
            if (empty($user['user_key'])) {
                $newKey = generateUserKey();
                try {
                    $stmtUpdate = $conn->prepare("UPDATE users SET user_key = ? WHERE id = ?");
                    $stmtUpdate->execute([$newKey, $user['id']]);
                    $user['user_key'] = $newKey;
                } catch (PDOException $ex) {}
            }
            $user['auto_key_enabled'] = isset($user['auto_key_enabled']) ? (int)$user['auto_key_enabled'] : 1;
            respond('success', 'User session active', $user);
        }
    }
    respond('error', 'Not logged in');
}

elseif ($action === 'logout') {
    session_destroy();
    respond('success', 'ออกจากระบบเรียบร้อยแล้ว');
}

elseif ($action === 'toggle_auto_key') {
    if (!isset($_SESSION['user_id'])) {
        respond('error', 'กรุณาเข้าสู่ระบบก่อน');
    }
    $userId = $_SESSION['user_id'];
    $enabled = isset($input['enabled']) ? ((bool)$input['enabled'] ? 1 : 0) : 1;

    try {
        $stmt = $conn->prepare("UPDATE users SET auto_key_enabled = ? WHERE id = ?");
        $stmt->execute([$enabled, $userId]);
        respond('success', 'บันทึกการตั้งค่า Auto Key เรียบร้อยแล้ว', ['auto_key_enabled' => $enabled]);
    } catch (PDOException $e) {
        respond('error', 'ไม่สามารถบันทึกข้อมูลได้: ' . $e->getMessage());
    }
}

elseif ($action === 'update_profile') {
    if (!isset($_SESSION['user_id'])) {
        respond('error', 'กรุณาเข้าสู่ระบบก่อน');
    }

    $userId = $_SESSION['user_id'];
    $username = isset($input['username']) ? trim($input['username']) : '';
    $email = isset($input['email']) ? trim($input['email']) : '';
    $discord_id = isset($input['discord_id']) ? trim($input['discord_id']) : '';
    $nickname = isset($input['nickname']) ? trim($input['nickname']) : null;
    $avatar_url = isset($input['avatar_url']) ? trim($input['avatar_url']) : null;

    if (empty($username) || empty($email)) {
        respond('error', 'กรุณากรอกชื่อผู้ใช้และอีเมล');
    }

    // Check unique constraints
    $stmt = $conn->prepare("SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?");
    $stmt->execute([$username, $email, $userId]);
    if ($stmt->fetch()) {
        respond('error', 'ชื่อผู้ใช้หรืออีเมลนี้มีผู้อื่นใช้งานแล้ว');
    }

    try {
        if (!empty($new_password)) {
            if (strlen($new_password) < 6) {
                respond('error', 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
            }
            $hashedPassword = password_hash($new_password, PASSWORD_DEFAULT);
            $stmt = $conn->prepare("UPDATE users SET username = ?, email = ?, discord_id = ?, nickname = ?, avatar_url = ?, password = ? WHERE id = ?");
            $stmt->execute([$username, $email, $discord_id, $nickname, $avatar_url, $hashedPassword, $userId]);
        } else {
            $stmt = $conn->prepare("UPDATE users SET username = ?, email = ?, discord_id = ?, nickname = ?, avatar_url = ? WHERE id = ?");
            $stmt->execute([$username, $email, $discord_id, $nickname, $avatar_url, $userId]);
        }
        
        $_SESSION['username'] = $username;
        respond('success', 'บันทึกการเปลี่ยนแปลงสำเร็จ!');
    } catch (PDOException $e) {
        respond('error', 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล: ' . $e->getMessage());
    }
}

else {
    respond('error', 'Invalid action');
}
