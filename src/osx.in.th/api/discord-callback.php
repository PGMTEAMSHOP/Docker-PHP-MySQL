<?php
// api/discord-callback.php
require_once 'db.php';

if (!isset($_GET['code'])) {
    die('Missing Authorization Code');
}

$code = $_GET['code'];

// 1. Exchange OAuth code for access token
$tokenUrl = 'https://discord.com/api/oauth2/token';
$postData = [
    'client_id' => DISCORD_CLIENT_ID,
    'client_secret' => DISCORD_CLIENT_SECRET,
    'grant_type' => 'authorization_code',
    'code' => $code,
    'redirect_uri' => DISCORD_REDIRECT_URI,
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $tokenUrl);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
$response = curl_exec($ch);
curl_close($ch);

$tokenData = json_decode($response, true);

if (!isset($tokenData['access_token'])) {
    die('Failed to retrieve access token: ' . htmlspecialchars($response));
}

$accessToken = $tokenData['access_token'];

// 2. Fetch User Profile Info from Discord API
$userUrl = 'https://discord.com/api/v10/users/@me';
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $userUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $accessToken
]);
$profileResponse = curl_exec($ch);
curl_close($ch);

$profileData = json_decode($profileResponse, true);

if (!isset($profileData['id'])) {
    die('Failed to retrieve user profile: ' . htmlspecialchars($profileResponse));
}

$discordId = $profileData['id'];
$discordUsername = $profileData['username'];
$discordEmail = !empty($profileData['email']) ? trim($profileData['email']) : null;
$discordGlobalName = !empty($profileData['global_name']) ? trim($profileData['global_name']) : $discordUsername;

$discordAvatar = null;
if (!empty($profileData['avatar'])) {
    $ext = (strpos($profileData['avatar'], 'a_') === 0) ? 'gif' : 'png';
    $discordAvatar = "https://cdn.discordapp.com/avatars/{$discordId}/{$profileData['avatar']}.{$ext}";
}

// 3. Find or Create User in database
try {
    // 3.1 Check if an account is already linked to this discord_id
    $stmt = $conn->prepare("SELECT id, username, email, is_banned, ban_reason, nickname, avatar_url FROM users WHERE discord_id = ?");
    $stmt->execute([$discordId]);
    $user = $stmt->fetch();

    if ($user) {
        // User exists, log them in
        if ($user['is_banned']) {
            die('บัญชีของคุณถูกระงับการใช้งานชั่วคราว/ถาวร เหตุผล: ' . htmlspecialchars($user['ban_reason']));
        }

        // Sync avatar or nickname if empty
        if ((empty($user['avatar_url']) && $discordAvatar) || (empty($user['nickname']) && $discordGlobalName)) {
            $newAvatar = !empty($user['avatar_url']) ? $user['avatar_url'] : $discordAvatar;
            $newNickname = !empty($user['nickname']) ? $user['nickname'] : $discordGlobalName;
            $upStmt = $conn->prepare("UPDATE users SET avatar_url = ?, nickname = ? WHERE id = ?");
            $upStmt->execute([$newAvatar, $newNickname, $user['id']]);
        }

        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
    } else {
        // 3.2 Check if user already registered with this email on the site
        $userLinked = false;
        if (!empty($discordEmail)) {
            $stmtEmail = $conn->prepare("SELECT id, username, discord_id, is_banned, ban_reason, nickname, avatar_url FROM users WHERE email = ?");
            $stmtEmail->execute([$discordEmail]);
            $existingEmailUser = $stmtEmail->fetch();

            if ($existingEmailUser && empty($existingEmailUser['discord_id'])) {
                if ($existingEmailUser['is_banned']) {
                    die('บัญชีของคุณถูกระงับการใช้งานชั่วคราว/ถาวร เหตุผล: ' . htmlspecialchars($existingEmailUser['ban_reason']));
                }

                $newNickname = !empty($existingEmailUser['nickname']) ? $existingEmailUser['nickname'] : $discordGlobalName;
                $newAvatar = !empty($existingEmailUser['avatar_url']) ? $existingEmailUser['avatar_url'] : $discordAvatar;

                $linkStmt = $conn->prepare("UPDATE users SET discord_id = ?, nickname = ?, avatar_url = ? WHERE id = ?");
                $linkStmt->execute([$discordId, $newNickname, $newAvatar, $existingEmailUser['id']]);

                $_SESSION['user_id'] = $existingEmailUser['id'];
                $_SESSION['username'] = $existingEmailUser['username'];
                $userLinked = true;
            }
        }

        // 3.3 Create new user if not linked
        if (!$userLinked) {
            $cleanUsername = preg_replace('/[^a-zA-Z0-9_-]/', '', $discordUsername);
            if (strlen($cleanUsername) < 3) {
                $cleanUsername = 'user_' . substr($discordId, -6);
            }

            $finalUsername = $cleanUsername;
            $checkStmt = $conn->prepare("SELECT id FROM users WHERE username = ?");
            $checkStmt->execute([$finalUsername]);
            if ($checkStmt->fetch()) {
                $finalUsername = $cleanUsername . '_' . rand(1000, 9999);
            }

            // Determine email to insert
            $finalEmail = null;
            if (!empty($discordEmail)) {
                $checkEmail = $conn->prepare("SELECT id FROM users WHERE email = ?");
                $checkEmail->execute([$discordEmail]);
                if (!$checkEmail->fetch()) {
                    $finalEmail = $discordEmail;
                }
            }

            // If email is still empty (or duplicated by another discord user), generate a unique fallback email
            if (empty($finalEmail)) {
                $finalEmail = $finalUsername . '_' . substr($discordId, -4) . '@discord.osx.in.th';
            }

            // Generate a random secure user_key (คีย์รันสคริปต์)
            $userKey = generate_user_key();

            // Create a random secure password hash
            $randomPass = password_hash(bin2hex(random_bytes(24)), PASSWORD_DEFAULT);

            // Insert new user with email included
            $insertStmt = $conn->prepare("INSERT INTO users (username, password, email, user_key, discord_id, nickname, avatar_url, balance) VALUES (?, ?, ?, ?, ?, ?, ?, 0.00)");
            $insertStmt->execute([
                $finalUsername,
                $randomPass,
                $finalEmail,
                $userKey,
                $discordId,
                $discordGlobalName,
                $discordAvatar
            ]);
            $newUserId = $conn->lastInsertId();

            $_SESSION['user_id'] = $newUserId;
            $_SESSION['username'] = $finalUsername;
        }
    }

    // Redirect to profile page
    header('Location: /profile');
    exit();
} catch (Exception $e) {
    die('Database error: ' . $e->getMessage());
}
