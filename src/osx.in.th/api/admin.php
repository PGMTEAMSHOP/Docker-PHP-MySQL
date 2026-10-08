<?php
// api/admin.php
require_once 'db.php';

// Protection check: Ensure user is logged in as administrator
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    respond('error', 'Unauthorized. Administrators only.');
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

// Parse JSON request body
$input = json_decode(file_get_contents('php://input'), true);

if ($action === 'stats') {
    try {
        // Total sales this month
        $stmt = $conn->query("SELECT SUM(price) as total FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)");
        $sales = $stmt->fetch();
        $totalSales = $sales['total'] ? (float)$sales['total'] : 0.00;

        // Total scripts
        $stmt = $conn->query("SELECT COUNT(*) as total FROM scripts");
        $scripts = $stmt->fetch();
        $totalScripts = (int)$scripts['total'];

        // Pending top-ups
        $stmt = $conn->query("SELECT COUNT(*) as total FROM topup_transactions WHERE status = 'pending'");
        $pending = $stmt->fetch();
        $totalPending = (int)$pending['total'];

        // Total users
        $stmt = $conn->query("SELECT COUNT(*) as total FROM users");
        $users = $stmt->fetch();
        $totalUsers = (int)$users['total'];

        // Recent orders
        $stmt = $conn->query("
            SELECT u.username as user, s.name as script, o.price, o.created_at
            FROM orders o
            JOIN users u ON o.user_id = u.id
            JOIN scripts s ON o.script_id = s.id
            ORDER BY o.id DESC LIMIT 5
        ");
        $recentOrders = $stmt->fetchAll();
        foreach ($recentOrders as &$o) {
            $o['price'] = (float)$o['price'];
            $o['time'] = date('H:i น.', strtotime($o['created_at']));
        }

        respond('success', 'Admin stats fetched', [
            'total_sales' => $totalSales,
            'total_scripts' => $totalScripts,
            'total_pending' => $totalPending,
            'total_users' => $totalUsers,
            'recent_orders' => $recentOrders
        ]);
    } catch (PDOException $e) {
        respond('error', $e->getMessage());
    }
}

elseif ($action === 'pending_topups') {
    try {
        // Auto-migrate: add reference and slip_url columns if missing
        if (DB_AUTO_MIGRATE) {
        try {
            $conn->exec("ALTER TABLE topup_transactions ADD COLUMN IF NOT EXISTS reference TEXT NULL");
            $conn->exec("ALTER TABLE topup_transactions ADD COLUMN IF NOT EXISTS slip_url TEXT NULL");
            $conn->exec("UPDATE topup_transactions SET status = 'rejected' WHERE status = 'pending' AND method = 'PromptPay QR' AND created_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE)");
        } catch (Exception $ignored) {}
        }

        $stmt = $conn->query("
            SELECT t.id, u.username as user, t.amount, t.method, t.status,
                   t.reference, t.slip_url
            FROM topup_transactions t
            JOIN users u ON t.user_id = u.id
            WHERE t.status = 'pending'
            ORDER BY t.id DESC
        ");
        $pending = $stmt->fetchAll();
        foreach ($pending as &$p) {
            $p['amount'] = (float)$p['amount'];
        }
        respond('success', 'Pending top-ups fetched', $pending);
    } catch (PDOException $e) {
        respond('error', $e->getMessage());
    }
}

elseif ($action === 'approve_topup') {
    $id = isset($input['id']) ? (int)$input['id'] : 0;
    $amount = isset($input['amount']) ? (float)$input['amount'] : 0.00;
    if ($id <= 0) {
        respond('error', 'ID ไม่ถูกต้อง');
    }
    if ($amount <= 0) {
        respond('error', 'กรุณาระบุจำนวนเงินที่ต้องการอนุมัติ');
    }

    try {
        $conn->beginTransaction();

        // Get transaction details
        $stmt = $conn->prepare("SELECT user_id, status FROM topup_transactions WHERE id = ?");
        $stmt->execute([$id]);
        $tx = $stmt->fetch();

        if (!$tx) {
            respond('error', 'ไม่พบรายการโอนเงินนี้');
        }

        if ($tx['status'] !== 'pending') {
            respond('error', 'รายการนี้ผ่านการดำเนินการไปแล้ว');
        }

        // Calculate bonus based on approved amount from settings
        $t1_min = (float)get_site_setting($conn, 'topup_tier1_min', '200');
        $t1_rate = (float)get_site_setting($conn, 'topup_tier1_rate', '10');
        $t2_min = (float)get_site_setting($conn, 'topup_tier2_min', '500');
        $t2_rate = (float)get_site_setting($conn, 'topup_tier2_rate', '15');
        $t3_min = (float)get_site_setting($conn, 'topup_tier3_min', '1000');
        $t3_rate = (float)get_site_setting($conn, 'topup_tier3_rate', '20');

        $bonus = 0.00;
        if ($amount >= $t3_min && $t3_min > 0) {
            $bonus = floor($amount * ($t3_rate / 100));
        } elseif ($amount >= $t2_min && $t2_min > 0) {
            $bonus = floor($amount * ($t2_rate / 100));
        } elseif ($amount >= $t1_min && $t1_min > 0) {
            $bonus = floor($amount * ($t1_rate / 100));
        }

        $totalAdd = $amount + $bonus;

        // Add balance to user
        $stmt = $conn->prepare("UPDATE users SET balance = balance + ?, total_deposited = total_deposited + ? WHERE id = ?");
        $stmt->execute([$totalAdd, $amount, $tx['user_id']]);

        // Update transaction status, amount and bonus
        $stmt = $conn->prepare("UPDATE topup_transactions SET amount = ?, bonus = ?, status = 'approved' WHERE id = ?");
        $stmt->execute([$amount, $bonus, $id]);

        $conn->commit();
        respond('success', "อนุมัติยอดโอนเรียบร้อย! เพิ่มเงินเข้าระบบ ฿" . number_format($totalAdd, 2));
    } catch (Exception $e) {
        $conn->rollBack();
        respond('error', 'เกิดข้อผิดพลาด: ' . $e->getMessage());
    }
}

elseif ($action === 'reject_topup') {
    $id = isset($input['id']) ? (int)$input['id'] : 0;
    if ($id <= 0) {
        respond('error', 'ID ไม่ถูกต้อง');
    }

    try {
        $stmt = $conn->prepare("UPDATE topup_transactions SET status = 'rejected' WHERE id = ? AND status = 'pending'");
        $stmt->execute([$id]);
        respond('success', 'ปฏิเสธรายการโอนเงินนี้แล้ว');
    } catch (PDOException $e) {
        respond('error', $e->getMessage());
    }
}

elseif ($action === 'add_script') {
    // Auto-migration check for youtube_url column
    if (DB_AUTO_MIGRATE) {
    try {
        $checkYoutube = $conn->query("SHOW COLUMNS FROM scripts LIKE 'youtube_url'")->fetch();
        if (!$checkYoutube) {
            $conn->exec("ALTER TABLE scripts ADD COLUMN youtube_url VARCHAR(255) NULL");
        }
    } catch (PDOException $e) {
        // fail silently
    }
    }

    $name = isset($input['name']) ? trim($input['name']) : '';
    $category_id = isset($input['category_id']) ? (int)$input['category_id'] : 0;
    $price = isset($input['price']) ? (float)$input['price'] : 0.00;
    $emoji = isset($input['emoji']) ? trim($input['emoji']) : '';
    $desc = isset($input['description']) ? trim($input['description']) : '';
    $image_url = isset($input['image_url']) ? trim($input['image_url']) : '';
    $youtube_url = isset($input['youtube_url']) ? trim($input['youtube_url']) : '';
    $features = isset($input['features']) ? trim($input['features']) : '';
    $plansInput = isset($input['plans']) ? trim($input['plans']) : '';
    $script_file = isset($input['script_file']) ? trim($input['script_file']) : '';
    $status = isset($input['status']) ? trim($input['status']) : 'undetected';
    $banner_url = isset($input['banner_url']) ? trim($input['banner_url']) : '';
    $place_ids = isset($input['place_ids']) ? trim($input['place_ids']) : '';
    $platform = isset($input['platform']) ? trim($input['platform']) : 'Windows 10 & 11';
    $delivery_type = isset($input['delivery_type']) ? trim($input['delivery_type']) : '';
    if (empty($delivery_type) || $delivery_type === 'script_key') {
        $fileLower = strtolower($script_file);
        if (strpos($fileLower, '.exe') !== false || strpos($fileLower, '.zip') !== false || strpos($fileLower, '.rar') !== false || strpos($fileLower, '.msi') !== false) {
            $delivery_type = 'program';
        } else {
            $delivery_type = 'script';
        }
    }

    if (empty($name) || $category_id <= 0 || $price < 0) {
        respond('error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
    }
    // Use default emoji if not provided
    if (empty($emoji)) $emoji = '📦';

    // Parse features or set default
    if (empty($features)) {
        $features = "Auto Farm,Auto Quest,ESP,Aimbot";
    }

    // Parse plans or set default
    $plansJson = '[]';
    if (!empty($plansInput)) {
        $plansJson = $plansInput;
    } else if ($price > 0) {
        $plans = [
            ['name' => '1 วัน', 'price' => $price],
            ['name' => '7 วัน', 'price' => round($price * 3.5)],
            ['name' => '30 วัน', 'price' => round($price * 9.5)]
        ];
        $plansJson = json_encode($plans);
    }

    try {
        $stmt = $conn->prepare("INSERT INTO scripts (name, category, emoji, description, price, plans, features, category_id, image_url, youtube_url, script_file, status, banner_url, place_ids, platform, type, delivery_type) VALUES (?, 'roblox', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$name, $emoji, $desc, $price, $plansJson, $features, $category_id, $image_url, $youtube_url, $script_file, $status, $banner_url, $place_ids, $platform, $type, $delivery_type]);
        respond('success', 'เพิ่มสคริปต์ใหม่สำเร็จ!');
    } catch (PDOException $e) {
        respond('error', 'เกิดข้อผิดพลาด: ' . $e->getMessage());
    }
}

elseif ($action === 'delete_script') {
    $id = isset($input['id']) ? (int)$input['id'] : (isset($_GET['id']) ? (int)$_GET['id'] : 0);
    if ($id <= 0) {
        respond('error', 'ID ไม่ถูกต้อง');
    }

    try {
        $stmt = $conn->prepare("DELETE FROM scripts WHERE id = ?");
        $stmt->execute([$id]);
        respond('success', 'ลบสคริปต์ออกจากระบบเรียบร้อย');
    } catch (PDOException $e) {
        respond('error', $e->getMessage());
    }
}

elseif ($action === 'gen_key') {
    $scriptName = isset($input['script_name']) ? trim($input['script_name']) : '';
    $duration = isset($input['duration']) ? trim($input['duration']) : '30 วัน';

    if (empty($scriptName)) {
        respond('error', 'กรุณาเลือกสคริปต์');
    }

    try {
        // Fetch script id
        $stmt = $conn->prepare("SELECT id FROM scripts WHERE name = ?");
        $stmt->execute([$scriptName]);
        $script = $stmt->fetch();
        if (!$script) {
            respond('error', 'ไม่พบสคริปต์นี้ในระบบ');
        }

        // Generate key code
        $chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        $keyCode = 'OSX-';
        for ($i = 0; $i < 4; $i++) {
            for ($j = 0; $j < 4; $j++) {
                $keyCode .= $chars[rand(0, strlen($chars) - 1)];
            }
            if ($i < 3) $keyCode .= '-';
        }

        $stmt = $conn->prepare("INSERT INTO keys_store (script_id, key_code, duration, status) VALUES (?, ?, ?, 'active')");
        $stmt->execute([$script['id'], $keyCode, $duration]);

        respond('success', 'สร้างคีย์สำเร็จ', ['key_code' => $keyCode]);
    } catch (PDOException $e) {
        respond('error', $e->getMessage());
    }
}

elseif ($action === 'categories') {
    try {
        $stmt = $conn->query("SELECT * FROM categories ORDER BY id ASC");
        $categories = $stmt->fetchAll();
        respond('success', 'Categories fetched', $categories);
    } catch (PDOException $e) {
        respond('error', $e->getMessage());
    }
}

elseif ($action === 'add_category') {
    $name = isset($input['name']) ? trim($input['name']) : '';
    $name_en = isset($input['name_en']) ? trim($input['name_en']) : '';
    $image_url = isset($input['image_url']) ? trim($input['image_url']) : '';
    $parent_id = isset($input['parent_id']) && $input['parent_id'] !== '' ? (int)$input['parent_id'] : null;

    if (empty($name) || empty($image_url)) {
        respond('error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
    }

    try {
        $stmt = $conn->prepare("INSERT INTO categories (name, name_en, image_url, parent_id) VALUES (?, ?, ?, ?)");
        $stmt->execute([$name, $name_en !== '' ? $name_en : null, $image_url, $parent_id]);
        respond('success', 'เพิ่มหมวดหมู่สำเร็จ!');
    } catch (PDOException $e) {
        respond('error', 'เกิดข้อผิดพลาด: ' . $e->getMessage());
    }
}

elseif ($action === 'delete_category') {
    $id = isset($input['id']) ? (int)$input['id'] : (isset($_GET['id']) ? (int)$_GET['id'] : 0);
    if ($id <= 0) {
        respond('error', 'ID ไม่ถูกต้อง');
    }

    try {
        $stmt = $conn->prepare("DELETE FROM categories WHERE id = ?");
        $stmt->execute([$id]);
        respond('success', 'ลบหมวดหมู่เรียบร้อยแล้ว');
    } catch (PDOException $e) {
        respond('error', $e->getMessage());
    }
}

elseif ($action === 'edit_category') {
    $id = isset($input['id']) ? (int)$input['id'] : 0;
    $name = isset($input['name']) ? trim($input['name']) : '';
    $name_en = isset($input['name_en']) ? trim($input['name_en']) : '';
    $image_url = isset($input['image_url']) ? trim($input['image_url']) : '';
    $parent_id = isset($input['parent_id']) && $input['parent_id'] !== '' ? (int)$input['parent_id'] : null;

    if ($id <= 0 || empty($name) || empty($image_url)) {
        respond('error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
    }

    try {
        $stmt = $conn->prepare("UPDATE categories SET name = ?, name_en = ?, image_url = ?, parent_id = ? WHERE id = ?");
        $stmt->execute([$name, $name_en !== '' ? $name_en : null, $image_url, $parent_id, $id]);
        respond('success', 'แก้ไขหมวดหมู่สำเร็จ!');
    } catch (PDOException $e) {
        respond('error', 'เกิดข้อผิดพลาด: ' . $e->getMessage());
    }
}

elseif ($action === 'edit_script') {
    $id = isset($input['id']) ? (int)$input['id'] : 0;
    $name = isset($input['name']) ? trim($input['name']) : '';
    $category_id = isset($input['category_id']) ? (int)$input['category_id'] : 0;
    $price = isset($input['price']) ? (float)$input['price'] : 0.00;
    $desc = isset($input['description']) ? trim($input['description']) : '';
    $image_url = isset($input['image_url']) ? trim($input['image_url']) : '';
    $youtube_url = isset($input['youtube_url']) ? trim($input['youtube_url']) : '';
    $features = isset($input['features']) ? trim($input['features']) : '';
    $plansInput = isset($input['plans']) ? trim($input['plans']) : '';
    $script_file = isset($input['script_file']) ? trim($input['script_file']) : '';
    $status = isset($input['status']) ? trim($input['status']) : 'undetected';
    $banner_url = isset($input['banner_url']) ? trim($input['banner_url']) : '';
    $place_ids = isset($input['place_ids']) ? trim($input['place_ids']) : '';
    $platform = isset($input['platform']) ? trim($input['platform']) : 'Windows 10 & 11';
    $delivery_type = isset($input['delivery_type']) ? trim($input['delivery_type']) : '';
    if (empty($delivery_type) || $delivery_type === 'script_key') {
        $fileLower = strtolower($script_file);
        if (strpos($fileLower, '.exe') !== false || strpos($fileLower, '.zip') !== false || strpos($fileLower, '.rar') !== false || strpos($fileLower, '.msi') !== false) {
            $delivery_type = 'program';
        } else {
            $delivery_type = 'script';
        }
    }

    if ($id <= 0 || empty($name) || $category_id <= 0 || $price < 0) {
        respond('error', 'กรุณากรอกข้อมูลให้ครบถ้วน');
    }

    try {
        $stmt = $conn->prepare("UPDATE scripts SET name = ?, category_id = ?, price = ?, image_url = ?, youtube_url = ?, features = ?, plans = ?, description = ?, script_file = ?, status = ?, banner_url = ?, place_ids = ?, platform = ?, type = ?, delivery_type = ? WHERE id = ?");
        $stmt->execute([$name, $category_id, $price, $image_url, $youtube_url, $features, $plansInput, $desc, $script_file, $status, $banner_url, $place_ids, $platform, $type, $delivery_type, $id]);
        respond('success', 'แก้ไขสคริปต์สำเร็จ!');
    } catch (PDOException $e) {
        respond('error', 'เกิดข้อผิดพลาด: ' . $e->getMessage());
    }
}

elseif ($action === 'get_settings') {
    try {
        $settings = [
            'osxpay_api_key' => get_site_setting($conn, 'osxpay_api_key', 'kb_your_api_key_here'),
            'osxpay_wallet_phone' => get_site_setting($conn, 'osxpay_wallet_phone', ''),
            'promptpay_number' => get_site_setting($conn, 'promptpay_number', get_site_setting($conn, 'bank_account_number', '217-8-18873-1')),
            'promptpay_name' => get_site_setting($conn, 'promptpay_name', get_site_setting($conn, 'bank_account_name', 'นายวัชรพัฐ นะราวัฒน์')),
            'bank_name' => get_site_setting($conn, 'bank_name', 'ธนาคารกสิกรไทย'),
            'bank_account_number' => get_site_setting($conn, 'bank_account_number', '217-8-18873-1'),
            'bank_account_name' => get_site_setting($conn, 'bank_account_name', 'นายวัชรพัฐ นะราวัฒน์'),
            'truewallet_name' => get_site_setting($conn, 'truewallet_name', 'นายวัชรพัฐ นะราวัฒน์'),
            'promptpay_enabled' => get_site_setting($conn, 'promptpay_enabled', '1'),
            'truewallet_enabled' => get_site_setting($conn, 'truewallet_enabled', '1'),
            'slip_enabled' => get_site_setting($conn, 'slip_enabled', '1'),
            'promptpay_maintenance_enabled' => get_site_setting($conn, 'promptpay_maintenance_enabled', '1'),
            'promptpay_maintenance_start' => get_site_setting($conn, 'promptpay_maintenance_start', '23:30'),
            'promptpay_maintenance_end' => get_site_setting($conn, 'promptpay_maintenance_end', '02:30'),
            'topup_fee_percent' => get_site_setting($conn, 'topup_fee_percent', '0'),
            'fee_promptpay_percent' => get_site_setting($conn, 'fee_promptpay_percent', get_site_setting($conn, 'topup_fee_percent', '0')),
            'fee_truewallet_percent' => get_site_setting($conn, 'fee_truewallet_percent', get_site_setting($conn, 'topup_fee_percent', '0')),
            'fee_slip_percent' => get_site_setting($conn, 'fee_slip_percent', get_site_setting($conn, 'topup_fee_percent', '0')),
            'promptpay_decimal_min' => get_site_setting($conn, 'promptpay_decimal_min', '1'),
            'promptpay_decimal_max' => get_site_setting($conn, 'promptpay_decimal_max', '99'),
            'topup_tier1_min' => get_site_setting($conn, 'topup_tier1_min', '200'),
            'topup_tier1_rate' => get_site_setting($conn, 'topup_tier1_rate', '10'),
            'topup_tier2_min' => get_site_setting($conn, 'topup_tier2_min', '500'),
            'topup_tier2_rate' => get_site_setting($conn, 'topup_tier2_rate', '15'),
            'topup_tier3_min' => get_site_setting($conn, 'topup_tier3_min', '1000'),
            'topup_tier3_rate' => get_site_setting($conn, 'topup_tier3_rate', '20'),
            'discord_order_webhook_url' => get_site_setting($conn, 'discord_order_webhook_url', ''),
            'discord_ticket_url' => get_site_setting($conn, 'discord_ticket_url', 'https://discord.gg/BXM5WEkD3J'),
        ];
        respond('success', 'Settings fetched', $settings);
    } catch (Exception $e) {
        respond('error', $e->getMessage());
    }
}

elseif ($action === 'save_settings') {
    try {
        $stmt = $conn->prepare("INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)");
        
        if (isset($input['osxpay_api_key'])) {
            $stmt->execute(['osxpay_api_key', trim($input['osxpay_api_key'])]);
        }
        if (isset($input['osxpay_wallet_phone'])) {
            $stmt->execute(['osxpay_wallet_phone', trim($input['osxpay_wallet_phone'])]);
        }
        if (isset($input['promptpay_number'])) {
            $stmt->execute(['promptpay_number', trim($input['promptpay_number'])]);
        }
        if (isset($input['promptpay_name'])) {
            $stmt->execute(['promptpay_name', trim($input['promptpay_name'])]);
        }
        if (isset($input['bank_name'])) {
            $stmt->execute(['bank_name', trim($input['bank_name'])]);
        }
        if (isset($input['bank_account_number'])) {
            $stmt->execute(['bank_account_number', trim($input['bank_account_number'])]);
        }
        if (isset($input['bank_account_name'])) {
            $stmt->execute(['bank_account_name', trim($input['bank_account_name'])]);
        }
        if (isset($input['truewallet_name'])) {
            $stmt->execute(['truewallet_name', trim($input['truewallet_name'])]);
        }
        if (isset($input['promptpay_enabled'])) {
            $stmt->execute(['promptpay_enabled', trim($input['promptpay_enabled'])]);
        }
        if (isset($input['truewallet_enabled'])) {
            $stmt->execute(['truewallet_enabled', trim($input['truewallet_enabled'])]);
        }
        if (isset($input['slip_enabled'])) {
            $stmt->execute(['slip_enabled', trim($input['slip_enabled'])]);
        }
        if (isset($input['promptpay_maintenance_enabled'])) {
            $stmt->execute(['promptpay_maintenance_enabled', trim($input['promptpay_maintenance_enabled'])]);
        }
        if (isset($input['promptpay_maintenance_start'])) {
            $stmt->execute(['promptpay_maintenance_start', trim($input['promptpay_maintenance_start'])]);
        }
        if (isset($input['promptpay_maintenance_end'])) {
            $stmt->execute(['promptpay_maintenance_end', trim($input['promptpay_maintenance_end'])]);
        }
        if (isset($input['topup_fee_percent'])) {
            $stmt->execute(['topup_fee_percent', trim($input['topup_fee_percent'])]);
        }
        if (isset($input['fee_promptpay_percent'])) {
            $stmt->execute(['fee_promptpay_percent', trim($input['fee_promptpay_percent'])]);
        }
        if (isset($input['fee_truewallet_percent'])) {
            $stmt->execute(['fee_truewallet_percent', trim($input['fee_truewallet_percent'])]);
        }
        if (isset($input['fee_slip_percent'])) {
            $stmt->execute(['fee_slip_percent', trim($input['fee_slip_percent'])]);
        }
        if (isset($input['promptpay_decimal_min'])) {
            $stmt->execute(['promptpay_decimal_min', trim($input['promptpay_decimal_min'])]);
        }
        if (isset($input['promptpay_decimal_max'])) {
            $stmt->execute(['promptpay_decimal_max', trim($input['promptpay_decimal_max'])]);
        }
        if (isset($input['topup_tier1_min'])) {
            $stmt->execute(['topup_tier1_min', trim($input['topup_tier1_min'])]);
        }
        if (isset($input['topup_tier1_rate'])) {
            $stmt->execute(['topup_tier1_rate', trim($input['topup_tier1_rate'])]);
        }
        if (isset($input['topup_tier2_min'])) {
            $stmt->execute(['topup_tier2_min', trim($input['topup_tier2_min'])]);
        }
        if (isset($input['topup_tier2_rate'])) {
            $stmt->execute(['topup_tier2_rate', trim($input['topup_tier2_rate'])]);
        }
        if (isset($input['topup_tier3_min'])) {
            $stmt->execute(['topup_tier3_min', trim($input['topup_tier3_min'])]);
        }
        if (isset($input['topup_tier3_rate'])) {
            $stmt->execute(['topup_tier3_rate', trim($input['topup_tier3_rate'])]);
        }
        if (isset($input['discord_order_webhook_url'])) {
            $stmt->execute(['discord_order_webhook_url', trim($input['discord_order_webhook_url'])]);
        }
        if (isset($input['discord_ticket_url'])) {
            $stmt->execute(['discord_ticket_url', trim($input['discord_ticket_url'])]);
        }
        
        respond('success', 'บันทึกการตั้งค่าระบบเรียบร้อยแล้ว!');
    } catch (PDOException $e) {
        respond('error', 'เกิดข้อผิดพลาด: ' . $e->getMessage());
    }
}

elseif ($action === 'list_images') {
    try {
        $imgDir = __DIR__ . '/../public/img/';
        $images = [];
        if (file_exists($imgDir)) {
            $files = scandir($imgDir);
            foreach ($files as $file) {
                if (in_array(strtolower(pathinfo($file, PATHINFO_EXTENSION)), ['png', 'jpg', 'jpeg', 'webp', 'gif'])) {
                    $images[] = $file;
                }
            }
        }
        respond('success', 'Images listed', $images);
    } catch (Exception $e) {
        respond('error', $e->getMessage());
    }
}

elseif ($action === 'users_list') {
    try {
        $search = isset($_GET['search']) ? '%' . trim($_GET['search']) . '%' : '%';
        $stmt = $conn->prepare("SELECT id, username, email, balance, role, created_at FROM users WHERE username LIKE ? OR email LIKE ? ORDER BY id DESC");
        $stmt->execute([$search, $search]);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        respond('success', 'Users fetched', $users);
    } catch (Exception $e) {
        respond('error', $e->getMessage());
    }
}

elseif ($action === 'edit_user') {
    try {
        $targetUserId = (int)$input['user_id'];
        $balance = (float)$input['balance'];
        $role = trim($input['role']);
        
        if ($targetUserId <= 0 || !in_array($role, ['user', 'admin'])) {
            respond('error', 'ข้อมูลผู้ใช้ไม่ถูกต้อง');
        }
        
        $stmt = $conn->prepare("UPDATE users SET balance = ?, role = ? WHERE id = ?");
        $stmt->execute([$balance, $role, $targetUserId]);
        respond('success', 'แก้ไขข้อมูลผู้ใช้สำเร็จ!');
    } catch (Exception $e) {
        respond('error', $e->getMessage());
    }
}

elseif ($action === 'delete_user') {
    try {
        $targetUserId = (int)$_GET['user_id'];
        if ($targetUserId === (int)$_SESSION['user_id']) {
            respond('error', 'ไม่สามารถลบบัญชีของตัวเองได้');
        }
        $stmt = $conn->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$targetUserId]);
        respond('success', 'ลบผู้ใช้สำเร็จ!');
    } catch (Exception $e) {
        respond('error', $e->getMessage());
    }
}

elseif ($action === 'keys_list') {
    try {
        $search = isset($_GET['search']) ? '%' . trim($_GET['search']) . '%' : '%';
        $stmt = $conn->prepare("
            SELECT k.id, k.key_code, k.duration, k.status, k.used_at, s.name as script_name, u.username as owner_name, u.user_key 
            FROM keys_store k
            LEFT JOIN scripts s ON k.script_id = s.id
            LEFT JOIN users u ON k.owner_id = u.id
            WHERE k.key_code LIKE ? OR u.username LIKE ? OR s.name LIKE ? OR u.user_key LIKE ?
            ORDER BY k.id DESC
        ");
        $stmt->execute([$search, $search, $search, $search]);
        $keys = $stmt->fetchAll(PDO::FETCH_ASSOC);
        respond('success', 'Keys fetched', $keys);
    } catch (Exception $e) {
        respond('error', $e->getMessage());
    }
}

elseif ($action === 'revoke_key') {
    try {
        $keyId = (int)$_GET['key_id'];
        $stmt = $conn->prepare("DELETE FROM keys_store WHERE id = ?");
        $stmt->execute([$keyId]);
        respond('success', 'ยกเลิกสิทธิ์และคีย์สำเร็จ!');
    } catch (Exception $e) {
        respond('error', $e->getMessage());
    }
}

elseif ($action === 'all_topups') {
    try {
        $stmt = $conn->query("
            SELECT t.id, t.amount, t.bonus, t.status, t.slip_url, t.created_at, u.username, t.method
            FROM topup_transactions t 
            LEFT JOIN users u ON t.user_id = u.id 
            WHERE t.method != 'Redeem Code'
            ORDER BY t.id DESC
        ");
        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        respond('success', 'Topups fetched', $logs);
    } catch (Exception $e) {
        respond('error', $e->getMessage());
    }
}

elseif ($action === 'list_discount_codes') {
    try {
        $stmt = $conn->query("SELECT * FROM discount_codes ORDER BY id DESC");
        $codes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        respond('success', 'Discount codes fetched', $codes);
    } catch (Exception $e) {
        respond('error', $e->getMessage());
    }
}

elseif ($action === 'create_discount_code') {
    try {
        $code = trim($input['code']);
        $type = trim($input['type']);
        $value = (float)$input['value'];
        $minPurchase = (float)$input['min_purchase'];
        $maxUses = (int)$input['max_uses'];
        $expiresAt = !empty($input['expires_at']) ? trim($input['expires_at']) : null;
        
        if (empty($code) || !in_array($type, ['percent', 'amount']) || $value <= 0) {
            respond('error', 'กรุณากรอกข้อมูลโค้ดส่วนลดให้ถูกต้องครบถ้วน');
        }
        
        $stmt = $conn->prepare("INSERT INTO discount_codes (code, type, value, min_purchase, max_uses, expires_at, status) VALUES (?, ?, ?, ?, ?, ?, 'active')");
        $stmt->execute([$code, $type, $value, $minPurchase, $maxUses, $expiresAt]);
        respond('success', 'สร้างโค้ดส่วนลดสำเร็จ!');
    } catch (Exception $e) {
        respond('error', 'เกิดข้อผิดพลาด: ' . $e->getMessage());
    }
}

elseif ($action === 'delete_discount_code') {
    try {
        $id = (int)$_GET['id'];
        $stmt = $conn->prepare("DELETE FROM discount_codes WHERE id = ?");
        $stmt->execute([$id]);
        respond('success', 'ลบโค้ดส่วนลดสำเร็จ!');
    } catch (Exception $e) {
        respond('error', $e->getMessage());
    }
}

elseif ($action === 'list_redeem_codes') {
    try {
        $stmt = $conn->query("SELECT * FROM redeem_codes ORDER BY id DESC");
        $codes = $stmt->fetchAll(PDO::FETCH_ASSOC);
        respond('success', 'Redeem codes fetched', $codes);
    } catch (Exception $e) {
        respond('error', $e->getMessage());
    }
}

elseif ($action === 'create_redeem_code') {
    try {
        $code = trim($input['code']);
        $rewardType = trim($input['reward_type']);
        $rewardValue = (float)$input['reward_value'];
        $duration = isset($input['duration']) ? trim($input['duration']) : null;
        $maxUses = (int)$input['max_uses'];
        $expiresAt = !empty($input['expires_at']) ? trim($input['expires_at']) : null;
        
        if (empty($code) || !in_array($rewardType, ['balance', 'script']) || $rewardValue <= 0) {
            respond('error', 'กรุณากรอกข้อมูลโค้ดของขวัญให้ถูกต้องครบถ้วน');
        }
        
        $stmt = $conn->prepare("INSERT INTO redeem_codes (code, reward_type, reward_value, duration, max_uses, expires_at, status) VALUES (?, ?, ?, ?, ?, ?, 'active')");
        $stmt->execute([$code, $rewardType, $rewardValue, $duration, $maxUses, $expiresAt]);
        respond('success', 'สร้างโค้ดรางวัลสำเร็จ!');
    } catch (Exception $e) {
        respond('error', 'เกิดข้อผิดพลาด: ' . $e->getMessage());
    }
}

elseif ($action === 'delete_redeem_code') {
    try {
        $id = (int)$_GET['id'];
        $stmt = $conn->prepare("DELETE FROM redeem_codes WHERE id = ?");
        $stmt->execute([$id]);
        respond('success', 'ลบโค้ดรางวัลสำเร็จ!');
    } catch (Exception $e) {
        respond('error', $e->getMessage());
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// STOCK MANAGEMENT (ระบบจัดการสต็อกสินค้า)
// ─────────────────────────────────────────────────────────────────────────────
elseif ($action === 'list_stocks') {
    try {
        $productId = isset($_GET['product_id']) ? (int)$_GET['product_id'] : 0;
        
        $sql = "
            SELECT ps.id, ps.product_id, ps.content, ps.status, ps.order_id, ps.claimed_by, ps.claimed_at, ps.created_at,
                   s.name as product_name, s.image_url as product_image, s.delivery_type,
                   u.username as buyer_username
            FROM product_stocks ps
            JOIN scripts s ON ps.product_id = s.id
            LEFT JOIN users u ON ps.claimed_by = u.id
        ";
        $params = [];
        if ($productId > 0) {
            $sql .= " WHERE ps.product_id = ?";
            $params[] = $productId;
        }
        $sql .= " ORDER BY ps.id DESC";

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        $stocks = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Calculate summary counts per product
        $stmtSummary = $conn->query("
            SELECT s.id as product_id, s.name as product_name, s.delivery_type,
                   SUM(CASE WHEN ps.status = 'available' THEN 1 ELSE 0 END) as available_count,
                   SUM(CASE WHEN ps.status = 'sold' THEN 1 ELSE 0 END) as sold_count,
                   COUNT(ps.id) as total_count
            FROM scripts s
            LEFT JOIN product_stocks ps ON s.id = ps.product_id
            GROUP BY s.id, s.name, s.delivery_type
            ORDER BY s.id DESC
        ");
        $summary = $stmtSummary->fetchAll(PDO::FETCH_ASSOC);

        respond('success', 'Stocks fetched', [
            'stocks' => $stocks,
            'summary' => $summary
        ]);
    } catch (Exception $e) {
        respond('error', $e->getMessage());
    }
}

elseif ($action === 'add_bulk_stock') {
    try {
        $productId = isset($input['product_id']) ? (int)$input['product_id'] : 0;
        $itemsText = isset($input['items_text']) ? (string)$input['items_text'] : '';

        if ($productId <= 0) {
            respond('error', 'กรุณาเลือกสินค้าที่ต้องการเติมสต็อก');
        }

        // Split lines by newline
        $lines = preg_split('/\r\n|\r|\n/', $itemsText);
        $validItems = [];
        foreach ($lines as $line) {
            $trimmed = trim($line);
            if (!empty($trimmed)) {
                $validItems[] = $trimmed;
            }
        }

        if (count($validItems) === 0) {
            respond('error', 'กรุณากรอกข้อมูลสต็อกอย่างน้อย 1 รายการ (1 บรรทัด = 1 ชิ้น)');
        }

        $conn->beginTransaction();
        $stmt = $conn->prepare("INSERT INTO product_stocks (product_id, content, status) VALUES (?, ?, 'available')");
        $addedCount = 0;
        foreach ($validItems as $itemContent) {
            $stmt->execute([$productId, $itemContent]);
            $addedCount++;
        }
        $conn->commit();

        respond('success', "เติมสต็อกสำเร็จจำนวน {$addedCount} ชิ้น!", ['added_count' => $addedCount]);
    } catch (Exception $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        respond('error', 'เกิดข้อผิดพลาดในการเติมสต็อก: ' . $e->getMessage());
    }
}

elseif ($action === 'delete_stock') {
    try {
        $id = isset($input['id']) ? (int)$input['id'] : (isset($_GET['id']) ? (int)$_GET['id'] : 0);
        if ($id <= 0) {
            respond('error', 'ID ไม่ถูกต้อง');
        }

        $stmt = $conn->prepare("DELETE FROM product_stocks WHERE id = ?");
        $stmt->execute([$id]);
        respond('success', 'ลบสต็อกชิ้นนี้สำเร็จ!');
    } catch (Exception $e) {
        respond('error', $e->getMessage());
    }
}

elseif ($action === 'clear_sold_stocks') {
    try {
        $productId = isset($input['product_id']) ? (int)$input['product_id'] : (isset($_GET['product_id']) ? (int)$_GET['product_id'] : 0);
        if ($productId > 0) {
            $stmt = $conn->prepare("DELETE FROM product_stocks WHERE product_id = ? AND status = 'sold'");
            $stmt->execute([$productId]);
        } else {
            $stmt = $conn->query("DELETE FROM product_stocks WHERE status = 'sold'");
        }
        respond('success', 'ล้างสต็อกที่ขายแล้วเรียบร้อย');
    } catch (Exception $e) {
        respond('error', $e->getMessage());
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDERS & TICKET CLAIMS (รายการคำสั่งซื้อและเคลมสินค้า)
// ─────────────────────────────────────────────────────────────────────────────
elseif ($action === 'list_orders') {
    try {
        $search = isset($_GET['search']) ? trim($_GET['search']) : '';
        $status = isset($_GET['status']) ? trim($_GET['status']) : '';
        $deliveryType = isset($_GET['delivery_type']) ? trim($_GET['delivery_type']) : '';

        $sql = "
            SELECT o.id, o.user_id, o.script_id, o.key_id, o.price, o.claim_code, 
                   o.delivery_type, o.status, o.stock_data, o.claimed_at, o.admin_note, o.created_at,
                   s.name as product_name, s.image_url as product_image,
                   u.username, u.email, u.discord_id, u.nickname
            FROM orders o
            JOIN scripts s ON o.script_id = s.id
            JOIN users u ON o.user_id = u.id
            WHERE 1=1
        ";
        $params = [];

        if (!empty($search)) {
            $sql .= " AND (o.claim_code LIKE ? OR u.username LIKE ? OR u.discord_id LIKE ? OR u.nickname LIKE ? OR s.name LIKE ?)";
            $searchTerm = "%{$search}%";
            $params = array_merge($params, [$searchTerm, $searchTerm, $searchTerm, $searchTerm, $searchTerm]);
        }

        if (!empty($status) && $status !== 'all') {
            $sql .= " AND o.status = ?";
            $params[] = $status;
        }

        if (!empty($deliveryType) && $deliveryType !== 'all') {
            $sql .= " AND o.delivery_type = ?";
            $params[] = $deliveryType;
        }

        $sql .= " ORDER BY o.id DESC LIMIT 200";

        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($orders as &$o) {
            $o['id'] = (int)$o['id'];
            $o['price'] = (float)$o['price'];
            $o['date'] = date('d/m/Y H:i น.', strtotime($o['created_at']));
            $o['claimed_date'] = !empty($o['claimed_at']) ? date('d/m/Y H:i น.', strtotime($o['claimed_at'])) : null;
        }

        respond('success', 'Orders fetched', $orders);
    } catch (Exception $e) {
        respond('error', $e->getMessage());
    }
}

elseif ($action === 'mark_order_claimed') {
    try {
        $orderId = isset($input['order_id']) ? (int)$input['order_id'] : 0;
        $status = isset($input['status']) ? trim($input['status']) : 'completed';
        $adminNote = isset($input['admin_note']) ? trim($input['admin_note']) : null;

        if ($orderId <= 0) {
            respond('error', 'ID คำสั่งซื้อไม่ถูกต้อง');
        }

        $stmt = $conn->prepare("UPDATE orders SET status = ?, claimed_at = CURRENT_TIMESTAMP, admin_note = ? WHERE id = ?");
        $stmt->execute([$status, $adminNote, $orderId]);

        respond('success', 'อัปเดตสถานะการส่งมอบสินค้าเรียบร้อยแล้ว!');
    } catch (Exception $e) {
        respond('error', $e->getMessage());
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ANNOUNCEMENTS MANAGEMENT (จัดการประกาศข่าวสาร)
// ─────────────────────────────────────────────────────────────────────────────
elseif ($action === 'list_announcements') {
    try {
        $stmt = $conn->query("SELECT * FROM announcements ORDER BY id DESC");
        $list = $stmt->fetchAll(PDO::FETCH_ASSOC);
        respond('success', 'Announcements fetched', $list);
    } catch (Exception $e) {
        respond('error', $e->getMessage());
    }
}

elseif ($action === 'add_announcement') {
    try {
        $title = isset($input['title']) ? trim($input['title']) : '';
        $content = isset($input['content']) ? trim($input['content']) : '';
        $type = isset($input['type']) ? trim($input['type']) : 'info';
        $is_banner = isset($input['is_banner']) ? (int)$input['is_banner'] : 1;
        $is_popup = isset($input['is_popup']) ? (int)$input['is_popup'] : 0;
        $image_url = isset($input['image_url']) ? trim($input['image_url']) : null;
        $is_active = isset($input['is_active']) ? (int)$input['is_active'] : 1;
        $banner_link = isset($input['banner_link']) ? trim($input['banner_link']) : null;

        if (empty($title)) {
            respond('error', 'กรุณาระบุหัวข้อประกาศ');
        }

        $stmt = $conn->prepare("
            INSERT INTO announcements (title, content, type, is_banner, is_popup, image_url, is_active, banner_link)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$title, $content, $type, $is_banner, $is_popup, $image_url, $is_active, $banner_link]);

        respond('success', 'เพิ่มประกาศข่าวสารเรียบร้อยแล้ว');
    } catch (Exception $e) {
        respond('error', $e->getMessage());
    }
}

elseif ($action === 'edit_announcement') {
    try {
        $id = isset($input['id']) ? (int)$input['id'] : 0;
        $title = isset($input['title']) ? trim($input['title']) : '';
        $content = isset($input['content']) ? trim($input['content']) : '';
        $type = isset($input['type']) ? trim($input['type']) : 'info';
        $is_banner = isset($input['is_banner']) ? (int)$input['is_banner'] : 1;
        $is_popup = isset($input['is_popup']) ? (int)$input['is_popup'] : 0;
        $image_url = isset($input['image_url']) ? trim($input['image_url']) : null;
        $is_active = isset($input['is_active']) ? (int)$input['is_active'] : 1;
        $banner_link = isset($input['banner_link']) ? trim($input['banner_link']) : null;

        if ($id <= 0 || empty($title)) {
            respond('error', 'ข้อมูลไม่ถูกต้อง');
        }

        $stmt = $conn->prepare("
            UPDATE announcements
            SET title = ?, content = ?, type = ?, is_banner = ?, is_popup = ?, image_url = ?, is_active = ?, banner_link = ?
            WHERE id = ?
        ");
        $stmt->execute([$title, $content, $type, $is_banner, $is_popup, $image_url, $is_active, $banner_link, $id]);

        respond('success', 'แก้ไขประกาศข่าวสารเรียบร้อยแล้ว');
    } catch (Exception $e) {
        respond('error', $e->getMessage());
    }
}

elseif ($action === 'delete_announcement') {
    try {
        $id = isset($input['id']) ? (int)$input['id'] : (isset($_GET['id']) ? (int)$_GET['id'] : 0);
        if ($id <= 0) respond('error', 'ID ไม่ถูกต้อง');

        $stmt = $conn->prepare("DELETE FROM announcements WHERE id = ?");
        $stmt->execute([$id]);

        respond('success', 'ลบประกาศข่าวสารเรียบร้อยแล้ว');
    } catch (Exception $e) {
        respond('error', $e->getMessage());
    }
}



else {
    respond('error', 'Invalid action');
}

