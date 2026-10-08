<?php
// api/scripts.php
require_once 'db.php';

$action = isset($_GET['action']) ? $_GET['action'] : '';

// Parse JSON request body
$input = json_decode(file_get_contents('php://input'), true);

// 1. Auto-migration check: ensure categories table and new product columns exist
if (DB_AUTO_MIGRATE) {
try {
    // Create categories table
    $conn->exec("CREATE TABLE IF NOT EXISTS `categories` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `name` VARCHAR(100) NOT NULL,
        `image_url` TEXT NOT NULL,
        `parent_id` INT NULL,
        FOREIGN KEY (`parent_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Check and add columns to scripts table
    $checkPlans = $conn->query("SHOW COLUMNS FROM scripts LIKE 'plans'")->fetch();
    if (!$checkPlans) {
        $conn->exec("ALTER TABLE scripts ADD COLUMN price INT NOT NULL DEFAULT 39");
        $conn->exec("ALTER TABLE scripts ADD COLUMN plans TEXT NULL");
    }

    $checkCatId = $conn->query("SHOW COLUMNS FROM scripts LIKE 'category_id'")->fetch();
    if (!$checkCatId) {
        $conn->exec("ALTER TABLE scripts ADD COLUMN category_id INT NULL");
        $conn->exec("ALTER TABLE scripts ADD COLUMN image_url TEXT NULL");
    }

    // Check and add name_en to categories table
    $checkCatEn = $conn->query("SHOW COLUMNS FROM categories LIKE 'name_en'")->fetch();
    if (!$checkCatEn) {
        $conn->exec("ALTER TABLE categories ADD COLUMN name_en VARCHAR(100) NULL AFTER name");
        $conn->exec("UPDATE categories SET name_en = 'Free Scripts' WHERE name = 'รวมสคริปต์ฟรี' AND (name_en IS NULL OR name_en = '')");
        $conn->exec("UPDATE categories SET name_en = 'Rental Scripts' WHERE name = 'รวมสคริปต์เช่า' AND (name_en IS NULL OR name_en = '')");
        $conn->exec("UPDATE categories SET name_en = 'ROBLOX' WHERE name = 'ROBLOX' AND (name_en IS NULL OR name_en = '')");
        $conn->exec("UPDATE categories SET name_en = 'ROBLOX EXECUTOR' WHERE name = 'ROBLOX EXECUTOR' AND (name_en IS NULL OR name_en = '')");
    }
} catch (PDOException $e) {
    // Fail silently
}
}

if ($action === 'list') {
    try {
        $stmt = $conn->query("SELECT * FROM scripts ORDER BY id DESC");
        $scripts = $stmt->fetchAll();

        $stmtCats = $conn->query("SELECT * FROM categories ORDER BY id ASC");
        $categories = $stmtCats->fetchAll();

        // Format outputs to match JSON frontend requirements
        foreach ($scripts as &$s) {
            $s['id'] = (int)$s['id'];
            $s['price'] = (int)$s['price'];
            $s['category_id'] = (int)$s['category_id'];
            $fileLower = !empty($s['script_file']) ? strtolower($s['script_file']) : '';
            $isExe = (strpos($fileLower, '.exe') !== false || strpos($fileLower, '.zip') !== false || strpos($fileLower, '.rar') !== false || strpos($fileLower, '.msi') !== false);
            $isLua = (substr($fileLower, -4) === '.lua');
            if ($s['delivery_type'] === 'program' || ($isExe && !$isLua)) {
                $s['delivery_type'] = 'program';
            } elseif (empty($s['delivery_type']) || $s['delivery_type'] === 'script_key') {
                $s['delivery_type'] = 'script';
            }

            // Fetch stock depending on delivery type
            if ($s['delivery_type'] === 'stock_ticket' || $s['delivery_type'] === 'stock_item') {
                $stmtStock = $conn->prepare("SELECT COUNT(*) as qty FROM product_stocks WHERE product_id = ? AND status = 'available'");
                $stmtStock->execute([$s['id']]);
                $stockInfo = $stmtStock->fetch();
                $s['stock'] = (int)$stockInfo['qty'];
            } else {
                // Regular script key licenses
                $stmtStock = $conn->prepare("SELECT COUNT(*) as qty FROM keys_store WHERE script_id = ? AND status = 'active'");
                $stmtStock->execute([$s['id']]);
                $stockInfo = $stmtStock->fetch();
                $s['stock'] = (int)$stockInfo['qty'];
                if ($s['stock'] === 0) {
                    $s['stock'] = 99; // Default infinite representation for digital scripts
                }
            }

            $s['features'] = array_map('trim', explode(',', $s['features']));
            $s['badges'] = []; // Can be empty or parsed from name/categories
            if (strpos(strtolower($s['name']), 'auto farm') !== false) {
                $s['badges'][] = 'new';
            }
            if (strpos(strtolower($s['name']), 'pro') !== false || strpos(strtolower($s['name']), 'aimbot') !== false) {
                $s['badges'][] = 'hot';
            }
            
            // Decrypt or set default plans (เช่า 30 วัน & ถาวร)
            if (!empty($s['plans'])) {
                $s['plans'] = json_decode($s['plans'], true);
            } else {
                $s['plans'] = [
                    ['name' => '30 วัน (เช่า)', 'price' => $s['price']],
                    ['name' => 'ถาวร (ตลอดชีพ)', 'price' => $s['price'] * 3]
                ];
            }
        }

        $stmtUsers = $conn->query("SELECT COUNT(*) as total FROM users");
        $totalUsers = (int)$stmtUsers->fetch()['total'];

        $stmtSold = $conn->query("SELECT COUNT(*) as total FROM orders");
        $totalSold = (int)$stmtSold->fetch()['total'];

        respond('success', 'Data fetched', [
            'scripts' => $scripts,
            'categories' => $categories,
            'stats' => [
                'total_users' => $totalUsers,
                'total_sold' => $totalSold
            ]
        ]);
    } catch (PDOException $e) {
        respond('error', 'Database query error: ' . $e->getMessage());
    }
}

elseif ($action === 'buy') {
    if (!isset($_SESSION['user_id'])) {
        respond('error', 'กรุณาเข้าสู่ระบบก่อนซื้อสินค้า');
    }

    $userId = $_SESSION['user_id'];
    $scriptId = isset($input['script_id']) ? (int)$input['script_id'] : 0;
    $planName = isset($input['plan_name']) ? trim($input['plan_name']) : '';
    $price = isset($input['price']) ? (float)$input['price'] : 0.00;
    $discountCode = isset($input['discount_code']) ? trim($input['discount_code']) : '';

    if ($scriptId <= 0 || empty($planName) || $price < 0) {
        respond('error', 'ข้อมูลการสั่งซื้อไม่ถูกต้อง');
    }

    // 1. Fetch script and user details
    $stmt = $conn->prepare("SELECT * FROM scripts WHERE id = ?");
    $stmt->execute([$scriptId]);
    $script = $stmt->fetch();
    if (!$script) {
        respond('error', 'ไม่พบสินค้าที่เลือก');
    }

    $deliveryType = !empty($script['delivery_type']) ? $script['delivery_type'] : 'script_key';

    // Check active license for this user and script
    if ($deliveryType === 'script_key' || $deliveryType === 'script' || $deliveryType === 'program') {
        $stmt = $conn->prepare("SELECT duration, used_at FROM keys_store WHERE owner_id = ? AND script_id = ?");
        $stmt->execute([$userId, $scriptId]);
        $existingKeys = $stmt->fetchAll();

        foreach ($existingKeys as $k) {
            $usedTime = strtotime($k['used_at']);
            $plan = $k['duration'];
            
            $isPermanent = (strpos($plan, 'ถาวร') !== false || strpos($plan, 'ตลอดชีพ') !== false);
            if ($isPermanent) {
                respond('error', 'คุณมีสิทธิ์การใช้งานแบบถาวรสำหรับสคริปต์นี้อยู่แล้ว ไม่สามารถซื้อซ้ำได้');
            }

            if (strpos($plan, '1 วัน') !== false) {
                $expTime = $usedTime + 86400;
            } elseif (strpos($plan, '7 วัน') !== false) {
                $expTime = $usedTime + 86400 * 7;
            } elseif (strpos($plan, '30 วัน') !== false) {
                $expTime = $usedTime + 86400 * 30;
            } else {
                $expTime = null;
            }

            if ($expTime === null || time() < $expTime) {
                respond('error', 'คุณยังมีสิทธิ์การใช้งานสคริปต์นี้อยู่และยังไม่หมดอายุ สามารถซื้อใหม่ได้เมื่อสิทธิ์เดิมหมดอายุแล้วเท่านั้น');
            }
        }
    }

    // Process discount code if sent
    $finalPrice = $price;
    $discountUsedId = null;

    if (!empty($discountCode)) {
        $stmt = $conn->prepare("SELECT * FROM discount_codes WHERE code = ? AND status = 'active' LIMIT 1");
        $stmt->execute([$discountCode]);
        $dc = $stmt->fetch();
        if (!$dc) {
            respond('error', 'โค้ดส่วนลดไม่ถูกต้อง หรือไม่ได้เปิดใช้งาน');
        }
        if (!empty($dc['expires_at']) && time() > strtotime($dc['expires_at'])) {
            respond('error', 'โค้ดส่วนลดนี้หมดอายุการใช้งานแล้ว');
        }
        if ($dc['max_uses'] > 0 && $dc['used_count'] >= $dc['max_uses']) {
            respond('error', 'โค้ดส่วนลดนี้มีผู้ใช้ครบกำหนดสิทธิ์แล้ว');
        }
        if ($price < $dc['min_purchase']) {
            respond('error', 'ยอดสั่งซื้อไม่ถึงขั้นต่ำ ฿' . number_format($dc['min_purchase'], 2));
        }

        // Check if user already used this code
        $stmt = $conn->prepare("SELECT COUNT(*) as cnt FROM discount_code_usages WHERE user_id = ? AND discount_code_id = ?");
        $stmt->execute([$userId, $dc['id']]);
        $usage = $stmt->fetch();
        if ($usage && $usage['cnt'] > 0) {
            respond('error', 'คุณเคยใช้งานโค้ดส่วนลดนี้ไปแล้ว จำกัดสิทธิ์ 1 ครั้งต่อบัญชีเท่านั้น');
        }

        if ($dc['type'] === 'percent') {
            $discountVal = $price * ($dc['value'] / 100);
        } else {
            $discountVal = (float)$dc['value'];
        }
        $finalPrice = max(0.00, $price - $discountVal);
        $discountUsedId = $dc['id'];
    }

    $stmt = $conn->prepare("SELECT id, username, discord_id, nickname, balance FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    if (!$user || $user['balance'] < $finalPrice) {
        respond('error', 'ยอดเงินคงเหลือไม่เพียงพอ กรุณาเติมเงิน');
    }

    $discordWebhookUrl = get_site_setting($conn, 'discord_order_webhook_url');
    $discordTicketUrl = get_site_setting($conn, 'discord_ticket_url', 'https://discord.gg/BXM5WEkD3J');

    try {
        $conn->beginTransaction();

        $claimCode = 'OSX-CLAIM-' . strtoupper(bin2hex(random_bytes(3))); // e.g. OSX-CLAIM-A8F43B
        $stockContent = null;
        $orderStatus = 'completed';
        $keyId = null;

        if ($deliveryType === 'stock_ticket' || $deliveryType === 'stock_item') {
            // Fetch an available stock item with FOR UPDATE lock
            $stmtStockItem = $conn->prepare("SELECT id, content FROM product_stocks WHERE product_id = ? AND status = 'available' LIMIT 1 FOR UPDATE");
            $stmtStockItem->execute([$scriptId]);
            $stockItem = $stmtStockItem->fetch();

            if (!$stockItem) {
                $conn->rollBack();
                respond('error', 'ขออภัย สินค้ารายการนี้หมดสต็อกชั่วคราว กรุณารอแอดมินเติมสินค้า');
            }

            $stockContent = $stockItem['content'];
            $orderStatus = ($deliveryType === 'stock_ticket') ? 'pending_claim' : 'completed';

            // Deduct user balance
            $stmt = $conn->prepare("UPDATE users SET balance = balance - ? WHERE id = ?");
            $stmt->execute([$finalPrice, $userId]);

            // Create Order History record
            $stmt = $conn->prepare("INSERT INTO orders (user_id, script_id, key_id, price, claim_code, delivery_type, status, stock_data) VALUES (?, ?, NULL, ?, ?, ?, ?, ?)");
            $stmt->execute([$userId, $scriptId, $finalPrice, $claimCode, $deliveryType, $orderStatus, $stockContent]);
            $orderId = $conn->lastInsertId();

            // Mark stock item as sold
            $stmtUpdateStock = $conn->prepare("UPDATE product_stocks SET status = 'sold', order_id = ?, claimed_by = ?, claimed_at = CURRENT_TIMESTAMP WHERE id = ?");
            $stmtUpdateStock->execute([$orderId, $userId, $stockItem['id']]);
        } else {
            // Script or Program Delivery (Linked to user's Account Key)
            $internalKeyCode = 'OSX-ACC-' . strtoupper(bin2hex(random_bytes(8)));
            $stmt = $conn->prepare("INSERT INTO keys_store (script_id, key_code, status, owner_id, used_at, duration) VALUES (?, ?, 'used', ?, CURRENT_TIMESTAMP, ?)");
            $stmt->execute([$scriptId, $internalKeyCode, $userId, $planName]);
            $keyId = $conn->lastInsertId();

            // Deduct user balance
            $stmt = $conn->prepare("UPDATE users SET balance = balance - ? WHERE id = ?");
            $stmt->execute([$finalPrice, $userId]);

            // Create Order History record
            $stockData = !empty($script['script_file']) ? $script['script_file'] : 'account_license';
            $stmt = $conn->prepare("INSERT INTO orders (user_id, script_id, key_id, price, claim_code, delivery_type, status, stock_data) VALUES (?, ?, ?, ?, ?, ?, 'completed', ?)");
            $stmt->execute([$userId, $scriptId, $keyId, $finalPrice, $claimCode, $deliveryType, $stockData]);
            $orderId = $conn->lastInsertId();
        }

        // Update discount code usage
        if ($discountUsedId) {
            $stmt = $conn->prepare("UPDATE discount_codes SET used_count = used_count + 1 WHERE id = ?");
            $stmt->execute([$discountUsedId]);

            $stmt = $conn->prepare("INSERT INTO discount_code_usages (user_id, discount_code_id) VALUES (?, ?)");
            $stmt->execute([$userId, $discountUsedId]);
        }

        $conn->commit();

        // Send Discord Webhook notification
        if (!empty($discordWebhookUrl)) {
            $buyerDisplay = $user['username'];
            if (!empty($user['discord_id'])) {
                $buyerDisplay .= " (Discord: <@{$user['discord_id']}> / `{$user['discord_id']}`)";
            }
            if (!empty($user['nickname'])) {
                $buyerDisplay .= " [{$user['nickname']}]";
            }

            $embedTitle = ($deliveryType === 'stock_ticket') 
                ? "🎫 คำสั่งซื้อใหม่ — รอเคลมรับสินค้าใน Discord Ticket!" 
                : "🛒 คำสั่งซื้อสินค้าใหม่สำเร็จ!";

            $embedColor = ($deliveryType === 'stock_ticket') ? 0x06b6d4 : 0x10b981;

            $embed = [
                "title" => $embedTitle,
                "description" => "มีรายการสั่งซื้อสินค้าผ่านเว็บไซต์ https://osx.in.th",
                "color" => $embedColor,
                "fields" => [
                    ["name" => "👤 ลูกค้า", "value" => $buyerDisplay, "inline" => true],
                    ["name" => "📦 สินค้า", "value" => $script['name'], "inline" => true],
                    ["name" => "💰 ราคา", "value" => "฿" . number_format($finalPrice, 2), "inline" => true],
                    ["name" => "🎟️ รหัส Claim Code", "value" => "`{$claimCode}`", "inline" => true],
                    ["name" => "📦 แพ็กเกจ / รูปแบบ", "value" => $planName . ($deliveryType === 'stock_ticket' ? ' (รับใน Ticket)' : ''), "inline" => true],
                    ["name" => "🕒 เวลา", "value" => date('d/m/Y H:i:s น.'), "inline" => true],
                ],
                "footer" => [
                    "text" => "OSX HUB Notification System",
                    "icon_url" => "https://osx.in.th/img/NewLogo88%20(3).png"
                ],
                "timestamp" => date('c')
            ];

            if ($deliveryType === 'stock_ticket') {
                $embed["fields"][] = [
                    "name" => "ℹ️ การส่งมอบ",
                    "value" => "ลูกค้านำรหัส `{$claimCode}` มาเปิด Ticket เพื่อรับสินค้า ตรวจสอบได้ที่หลังบ้านแอดมิน",
                    "inline" => false
                ];
            }

            send_discord_webhook($discordWebhookUrl, $embed);
        }

        $fileLower = !empty($script['script_file']) ? strtolower($script['script_file']) : '';
        $isExe = (strpos($fileLower, '.exe') !== false || strpos($fileLower, '.zip') !== false || strpos($fileLower, '.rar') !== false || strpos($fileLower, '.msi') !== false);
        $isLua = (substr($fileLower, -4) === '.lua');
        $isProgram = ($deliveryType === 'program' || ($isExe && !$isLua));

        respond('success', 'สั่งซื้อสำเร็จ!', [
            'claim_code' => $claimCode,
            'delivery_type' => $isProgram ? 'program' : $deliveryType,
            'download_url' => ($isProgram && !empty($script['script_file'])) ? $script['script_file'] : null,
            'status' => $orderStatus,
            'stock_data' => $stockContent ?: (isset($stockData) ? $stockData : null),
            'script' => $script['name'],
            'plan' => $planName,
            'price' => $finalPrice,
            'discord_ticket_url' => $discordTicketUrl
        ]);
    } catch (Exception $e) {
        $conn->rollBack();
        respond('error', 'เกิดข้อผิดพลาดในการทำรายการ: ' . $e->getMessage());
    }
}

elseif ($action === 'validate_discount') {
    $code = isset($_GET['code']) ? trim($_GET['code']) : '';
    $price = isset($_GET['price']) ? (float)$_GET['price'] : 0.00;
    
    if (empty($code)) {
        respond('error', 'กรุณาระบุโค้ดส่วนลด');
    }
    
    try {
        $stmt = $conn->prepare("SELECT * FROM discount_codes WHERE code = ? AND status = 'active' LIMIT 1");
        $stmt->execute([$code]);
        $dc = $stmt->fetch();
        if (!$dc) {
            respond('error', 'โค้ดส่วนลดไม่ถูกต้อง หรือไม่ได้เปิดใช้งาน');
        }
        
        if (!empty($dc['expires_at']) && time() > strtotime($dc['expires_at'])) {
            respond('error', 'โค้ดส่วนลดนี้หมดอายุการใช้งานแล้ว');
        }
        
        if ($dc['max_uses'] > 0 && $dc['used_count'] >= $dc['max_uses']) {
            respond('error', 'โค้ดส่วนลดนี้มีผู้ใช้ครบกำหนดสิทธิ์แล้ว');
        }
        
        if ($price < $dc['min_purchase']) {
            respond('error', 'ยอดสั่งซื้อไม่ถึงขั้นต่ำ ฿' . number_format($dc['min_purchase'], 2));
        }

        // Check if user already used this code
        if (isset($_SESSION['user_id'])) {
            $stmt = $conn->prepare("SELECT COUNT(*) as cnt FROM discount_code_usages WHERE user_id = ? AND discount_code_id = ?");
            $stmt->execute([$_SESSION['user_id'], $dc['id']]);
            $usage = $stmt->fetch();
            if ($usage && $usage['cnt'] > 0) {
                respond('error', 'คุณเคยใช้งานโค้ดส่วนลดนี้ไปแล้ว จำกัดสิทธิ์ 1 ครั้งต่อบัญชีเท่านั้น');
            }
        }
        
        if ($dc['type'] === 'percent') {
            $discountVal = $price * ($dc['value'] / 100);
        } else {
            $discountVal = (float)$dc['value'];
        }
        
        $finalPrice = max(0.00, $price - $discountVal);
        
        respond('success', 'ใช้โค้ดส่วนลดสำเร็จ!', [
            'code' => $dc['code'],
            'type' => $dc['type'],
            'value' => (float)$dc['value'],
            'discount_amount' => $discountVal,
            'final_price' => $finalPrice
        ]);
    } catch (PDOException $e) {
        respond('error', $e->getMessage());
    }
}

elseif ($action === 'user_keys') {
    if (!isset($_SESSION['user_id'])) {
        respond('error', 'Not logged in');
    }

    $userId = $_SESSION['user_id'];
    try {
        $stmt = $conn->prepare("
            SELECT k.key_code as code, s.name as script, s.delivery_type, s.script_file as download_url, k.duration as plan, k.used_at, k.status, s.status as script_status, s.image_url as script_image
            FROM keys_store k
            JOIN scripts s ON k.script_id = s.id
            WHERE k.owner_id = ?
            ORDER BY k.id DESC
        ");
        $stmt->execute([$userId]);
        $keys = $stmt->fetchAll();

        foreach ($keys as &$k) {
            $k['delivery_type'] = !empty($k['delivery_type']) ? $k['delivery_type'] : 'script';
            $fileLower = !empty($k['download_url']) ? strtolower($k['download_url']) : '';
            $isExe = (strpos($fileLower, '.exe') !== false || strpos($fileLower, '.zip') !== false || strpos($fileLower, '.rar') !== false || strpos($fileLower, '.msi') !== false);
            $isLua = (substr($fileLower, -4) === '.lua');

            if ($k['delivery_type'] === 'program' || ($isExe && !$isLua)) {
                $k['delivery_type'] = 'program';
            } else {
                $k['download_url'] = null;
            }
            // Determine expiration text dynamically based on purchase date and plan
            $usedTime = strtotime($k['used_at']);
            $plan = $k['plan'];
            if (strpos($plan, '1 วัน') !== false) {
                $expTime = $usedTime + 86400;
            } elseif (strpos($plan, '7 วัน') !== false) {
                $expTime = $usedTime + 86400 * 7;
            } elseif (strpos($plan, '30 วัน') !== false) {
                $expTime = $usedTime + 86400 * 30;
            } else {
                $expTime = null; // Permanent
            }

            if ($expTime) {
                $k['expires_timestamp'] = $expTime;
                $k['expires'] = date('d/m/Y H:i', $expTime);
                if (time() > $expTime) {
                    $k['status'] = 'expired';
                } else {
                    $k['status'] = 'active';
                }
            } else {
                $k['expires_timestamp'] = null;
                $k['expires'] = 'ถาวร';
                $k['status'] = 'active';
            }
        }
        unset($k); // Prevent reference leakage

        // Fetch Universal script status to show on UI
        $stmtUniv = $conn->prepare("SELECT status, image_url FROM scripts WHERE script_file = 'Universal.lua' OR script_file = 'Universal' LIMIT 1");
        $stmtUniv->execute();
        $univScript = $stmtUniv->fetch();
        $univStatus = $univScript ? $univScript['status'] : 'undetected';
        $univImage = $univScript ? $univScript['image_url'] : null;

        // Add Universal.lua as a free lifetime script for everyone
        $hasUniversal = false;
        foreach ($keys as $item) {
            if ($item['script'] === 'Universal' || $item['script'] === 'Universal.lua') {
                $hasUniversal = true;
                break;
            }
        }

        if (!$hasUniversal) {
            $keys[] = [
                'code' => 'OSXHUB-GIFT-FREE',
                'script' => 'Universal',
                'plan' => 'ถาวร (ของแถมประจำบัญชี)',
                'used_at' => date('Y-m-d H:i:s'),
                'status' => 'active',
                'script_status' => $univStatus,
                'script_image' => $univImage,
                'expires_timestamp' => null,
                'expires' => 'ถาวร'
            ];
        }

        respond('success', 'User keys fetched', $keys);
    } catch (PDOException $e) {
        respond('error', $e->getMessage());
    }
}

elseif ($action === 'user_history') {
    if (!isset($_SESSION['user_id'])) {
        respond('error', 'Not logged in');
    }

    $userId = $_SESSION['user_id'];
    $discordTicketUrl = get_site_setting($conn, 'discord_ticket_url', 'https://discord.gg/BXM5WEkD3J');
    try {
        $stmt = $conn->prepare("
            SELECT o.id, s.name as script, s.image_url as script_image, s.script_file as download_url, o.price, 
                   o.claim_code, o.delivery_type, o.status, o.stock_data, o.created_at, o.claimed_at
            FROM orders o
            JOIN scripts s ON o.script_id = s.id
            WHERE o.user_id = ?
            ORDER BY o.id DESC
        ");
        $stmt->execute([$userId]);
        $history = $stmt->fetchAll();

        foreach ($history as &$h) {
            $h['id'] = (int)$h['id'];
            $h['price'] = (float)$h['price'];
            $h['date'] = date('d/m/Y H:i น.', strtotime($h['created_at']));
            $h['claimed_date'] = !empty($h['claimed_at']) ? date('d/m/Y H:i น.', strtotime($h['claimed_at'])) : null;
            $h['claim_code'] = !empty($h['claim_code']) ? $h['claim_code'] : 'OSX-ORD-' . $h['id'];
            $h['delivery_type'] = !empty($h['delivery_type']) ? $h['delivery_type'] : 'instant';
            $fileLower = !empty($h['download_url']) ? strtolower($h['download_url']) : '';
            $isExe = (strpos($fileLower, '.exe') !== false || strpos($fileLower, '.zip') !== false || strpos($fileLower, '.rar') !== false || strpos($fileLower, '.msi') !== false);
            $isLua = (substr($fileLower, -4) === '.lua');

            if ($h['delivery_type'] === 'program' || ($isExe && !$isLua)) {
                $h['delivery_type'] = 'program';
            } else {
                $h['download_url'] = null;
            }
            $h['status'] = !empty($h['status']) ? $h['status'] : 'completed';
            $h['discord_ticket_url'] = $discordTicketUrl;
        }
        respond('success', 'History fetched', $history);
    } catch (PDOException $e) {
        respond('error', $e->getMessage());
    }
}

else {
    respond('error', 'Invalid action');
}
