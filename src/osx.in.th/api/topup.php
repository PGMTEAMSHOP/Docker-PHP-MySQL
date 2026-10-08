<?php
// api/topup.php
require_once 'db.php';

// Helper to send request to OSXPAY / pay.osx.in.th API
function send_osxpay_request($conn, $url, $data = [], $isMultipart = false) {
    $apiKey = get_site_setting($conn, 'osxpay_api_key', 'kb_your_api_key_here');
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);

    if ($isMultipart) {
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'x-api-key: ' . $apiKey
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    } else {
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'x-api-key: ' . $apiKey
        ]);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }
    
    $response = curl_exec($ch);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        return ['success' => false, 'message' => 'CURL Error: ' . $error];
    }
    
    $json = json_decode($response, true);
    return is_array($json) ? $json : ['success' => false, 'message' => 'Invalid server response: ' . $response];
}

// EMVCo PromptPay QR Code generator helper
function format_emvco_field($tag, $value) {
    $len = str_pad(strlen($value), 2, '0', STR_PAD_LEFT);
    return $tag . $len . $value;
}

function generate_promptpay_payload($target, $amount = null) {
    $cleanTarget = preg_replace('/[^0-9]/', '', $target);
    $targetTag = '01';
    if (strlen($cleanTarget) === 10 && substr($cleanTarget, 0, 1) === '0') {
        $formattedTarget = '0066' . substr($cleanTarget, 1);
        $targetTag = '01';
    } elseif (strlen($cleanTarget) === 13) {
        $formattedTarget = $cleanTarget;
        $targetTag = '02';
    } else {
        $formattedTarget = $cleanTarget;
    }

    $sub00 = format_emvco_field('00', 'A000000677010111');
    $subTarget = format_emvco_field($targetTag, $formattedTarget);
    $tag29 = format_emvco_field('29', $sub00 . $subTarget);

    $payload = format_emvco_field('00', '01');
    $payload .= format_emvco_field('01', $amount ? '12' : '11');
    $payload .= $tag29;
    $payload .= format_emvco_field('53', '764');
    if ($amount !== null && (float)$amount > 0) {
        $payload .= format_emvco_field('54', number_format((float)$amount, 2, '.', ''));
    }
    $payload .= format_emvco_field('58', 'TH');
    $payload .= '6304';

    // CRC16-CCITT calculation
    $crc = 0xFFFF;
    for ($i = 0; $i < strlen($payload); $i++) {
        $c = ord($payload[$i]);
        $crc ^= ($c << 8);
        for ($j = 0; $j < 8; $j++) {
            if ($crc & 0x8000) {
                $crc = (($crc << 1) ^ 0x1021) & 0xFFFF;
            } else {
                $crc = ($crc << 1) & 0xFFFF;
            }
        }
    }
    $crcHex = strtoupper(str_pad(dechex($crc), 4, '0', STR_PAD_LEFT));
    return $payload . $crcHex;
}

// Calculate topup bonus helper
function calculate_topup_bonus($conn, $amount) {
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
    return $bonus;
}

// Calculate topup fee deduction, net credit, and bonus by channel
function calculate_topup_net($conn, $grossAmount, $channel = 'promptpay') {
    $feeKey = 'fee_' . $channel . '_percent';
    $feeRate = (float)get_site_setting($conn, $feeKey, get_site_setting($conn, 'topup_fee_percent', '0'));
    $feeAmount = ($grossAmount * $feeRate) / 100;
    $netBase = max(0, $grossAmount - $feeAmount);
    $bonus = calculate_topup_bonus($conn, $netBase);
    $totalCredit = $netBase + $bonus;

    return [
        'gross' => (float)$grossAmount,
        'channel' => $channel,
        'fee_rate' => (float)$feeRate,
        'fee_amount' => (float)number_format($feeAmount, 2, '.', ''),
        'net_amount' => (float)number_format($netBase, 2, '.', ''),
        'bonus' => (float)$bonus,
        'total_credit' => (float)number_format($totalCredit, 2, '.', '')
    ];
}

// Time window checker (handles crossing midnight e.g. 23:30 to 02:30)
function is_in_time_window($startTime, $endTime) {
    $now = date('H:i');
    if ($startTime <= $endTime) {
        return ($now >= $startTime && $now <= $endTime);
    } else {
        return ($now >= $startTime || $now <= $endTime);
    }
}

$action = isset($_GET['action']) ? $_GET['action'] : '';
$input = json_decode(file_get_contents('php://input'), true);

// Auto-migrate: ensure columns exist
if (DB_AUTO_MIGRATE) {
try {
    $conn->exec("ALTER TABLE topup_transactions ADD COLUMN IF NOT EXISTS reference TEXT NULL");
    $conn->exec("ALTER TABLE topup_transactions ADD COLUMN IF NOT EXISTS slip_url TEXT NULL");
} catch (Exception $ignored) {}
}

// -------------------------------------------------------------
// 1. PROMPTPAY: Create Random Decimal QR Code
// -------------------------------------------------------------
if ($action === 'promptpay_create') {
    if (!isset($_SESSION['user_id'])) {
        respond('error', 'กรุณาเข้าสู่ระบบก่อนทำรายการ');
    }

    // Check if PromptPay channel is enabled
    $isPromptPayEnabled = get_site_setting($conn, 'promptpay_enabled', '1');
    if ($isPromptPayEnabled !== '1') {
        respond('error', 'ช่องทางชำระเงิน PromptPay ปิดปรับปรุงอยู่ในขณะนี้ กรุณาเลือกชำระเงินช่องทางอื่น');
    }

    // Check Maintenance Window (e.g. 23:30 - 02:30)
    $maintEnabled = get_site_setting($conn, 'promptpay_maintenance_enabled', '1');
    if ($maintEnabled === '1') {
        $mStart = get_site_setting($conn, 'promptpay_maintenance_start', '23:30');
        $mEnd = get_site_setting($conn, 'promptpay_maintenance_end', '02:30');
        if (is_in_time_window($mStart, $mEnd)) {
            respond('error', "ระบบ PromptPay สุ่มทศนิยมปิดปรับปรุงชั่วคราวช่วงเวลา $mStart - $mEnd น. (ช่วงธนาคารปิดประมวลผล) กรุณาใช้ระบบเช็คสลิป (Slip Verify) หรือรอหลังเวลา $mEnd น.");
        }
    }

    $userId = $_SESSION['user_id'];
    $rawAmount = isset($input['amount']) ? (float)$input['amount'] : 0.00;

    if ($rawAmount < 1.00) {
        respond('error', 'ยอดเงินขั้นต่ำในการเติมเงินคือ 1 บาท');
    }

    $promptpayTarget = get_site_setting($conn, 'promptpay_number', '');
    if (empty($promptpayTarget)) {
        $promptpayTarget = get_site_setting($conn, 'bank_account_number', '0812345678');
    }
    $promptpayName = get_site_setting($conn, 'promptpay_name', '');
    if (empty($promptpayName)) {
        $promptpayName = get_site_setting($conn, 'bank_account_name', 'ร้านค้า OSX.IN.TH');
    }

    // 1. Auto-expire old pending PromptPay transactions older than 5 minutes for this user
    try {
        $stmtClean = $conn->prepare("UPDATE topup_transactions SET status = 'rejected' WHERE user_id = ? AND method = 'PromptPay QR' AND status = 'pending' AND created_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE)");
        $stmtClean->execute([$userId]);
    } catch (Exception $ignored) {}

    // 2. Check if user already has an active pending PromptPay QR created within the last 5 minutes (300 seconds)
    try {
        $stmtCheck = $conn->prepare("
            SELECT id, amount, reference, created_at
            FROM topup_transactions
            WHERE user_id = ?
              AND method = 'PromptPay QR'
              AND status = 'pending'
              AND TIMESTAMPDIFF(SECOND, created_at, NOW()) < 300
            ORDER BY id DESC
            LIMIT 1
        ");
        $stmtCheck->execute([$userId]);
        $existingTx = $stmtCheck->fetch();

        if ($existingTx) {
            $exactAmount = number_format((float)$existingTx['amount'], 2, '.', '');
            $baseAmount = floor((float)$exactAmount);
            $orderRef = $existingTx['reference'];
            $txId = (int)$existingTx['id'];

            $createdAtTime = strtotime($existingTx['created_at']);
            $elapsed = time() - $createdAtTime;
            $expiresIn = max(1, 300 - $elapsed);

            $qrPayload = generate_promptpay_payload($promptpayTarget, (float)$exactAmount);

            respond('success', 'สร้างคิวอาร์โค้ดพร้อมเพย์สำเร็จ', [
                'id' => $txId,
                'amount' => (float)$exactAmount,
                'base_amount' => $baseAmount,
                'qr_payload' => $qrPayload,
                'promptpay_number' => $promptpayTarget,
                'promptpay_name' => $promptpayName,
                'reference' => $orderRef,
                'expires_in' => $expiresIn
            ]);
        }
    } catch (Exception $ignored) {}

    // 3. Randomize 2-digit decimal based on admin config range if no active pending transaction exists
    $decMin = (int)get_site_setting($conn, 'promptpay_decimal_min', '1');
    $decMax = (int)get_site_setting($conn, 'promptpay_decimal_max', '99');
    if ($decMin < 1) $decMin = 1;
    if ($decMax > 99) $decMax = 99;
    if ($decMin > $decMax) { $decMin = 1; $decMax = 99; }

    $randDecimal = mt_rand($decMin, $decMax) / 100;
    $exactAmount = number_format(floor($rawAmount) + $randDecimal, 2, '.', '');
    $baseAmount = floor($rawAmount);

    $qrPayload = generate_promptpay_payload($promptpayTarget, (float)$exactAmount);
    $orderRef = 'PP-' . time() . '-' . mt_rand(1000, 9999);

    try {
        $stmt = $conn->prepare("INSERT INTO topup_transactions (user_id, amount, bonus, method, status, reference) VALUES (?, ?, 0, 'PromptPay QR', 'pending', ?)");
        $stmt->execute([$userId, $exactAmount, $orderRef]);
        $txId = $conn->lastInsertId();

        respond('success', 'สร้างคิวอาร์โค้ดพร้อมเพย์สำเร็จ', [
            'id' => $txId,
            'amount' => (float)$exactAmount,
            'base_amount' => $baseAmount,
            'qr_payload' => $qrPayload,
            'promptpay_number' => $promptpayTarget,
            'promptpay_name' => $promptpayName,
            'reference' => $orderRef,
            'expires_in' => 300 // 5 minutes
        ]);
    } catch (PDOException $e) {
        respond('error', 'เกิดข้อผิดพลาดในการสร้างรายการ: ' . $e->getMessage());
    }
}

// -------------------------------------------------------------
// 1.1 PROMPTPAY: Verify Amount via OSXPAY verify API
// -------------------------------------------------------------
elseif ($action === 'promptpay_verify') {
    if (!isset($_SESSION['user_id'])) {
        respond('error', 'กรุณาเข้าสู่ระบบก่อนทำรายการ');
    }

    $userId = $_SESSION['user_id'];
    $amount = isset($input['amount']) ? (float)$input['amount'] : 0.00;
    $txId = isset($input['id']) ? (int)$input['id'] : 0;

    if ($amount <= 0) {
        respond('error', 'ยอดเงินไม่ถูกต้อง');
    }

    // Call OSXPAY verify API: POST https://pay.osx.in.th/api/verify {"amount": exactAmount}
    $response = send_osxpay_request($conn, 'https://pay.osx.in.th/api/verify', [
        'amount' => $amount
    ]);

    // OSXPAY returns { success: true, found: true, data: {...} } when paid
    // and { success: true, found: false, message: "ไม่พบรายการ..." } when not paid yet
    if ($response && isset($response['success']) && $response['success'] === true && isset($response['found']) && $response['found'] === true) {
        $calc = calculate_topup_net($conn, $amount);

        try {
            $conn->beginTransaction();

            // 1. Credit User Balance & Total Deposited
            $stmt = $conn->prepare("UPDATE users SET balance = balance + ?, total_deposited = total_deposited + ? WHERE id = ?");
            $stmt->execute([$calc['total_credit'], $calc['gross'], $userId]);

            // 2. Mark Transaction Approved
            if ($txId > 0) {
                $stmt = $conn->prepare("UPDATE topup_transactions SET status = 'approved', bonus = ? WHERE id = ? AND user_id = ?");
                $stmt->execute([$calc['bonus'], $txId, $userId]);
            } else {
                $stmt = $conn->prepare("INSERT INTO topup_transactions (user_id, amount, bonus, method, status, reference) VALUES (?, ?, ?, 'PromptPay QR', 'approved', 'PP-AUTO')");
                $stmt->execute([$userId, $calc['gross'], $calc['bonus']]);
            }

            $conn->commit();

            respond('success', '✅ ได้รับยอดเงินเรียบร้อยแล้ว! เครดิตเข้าบัญชีของคุณแล้ว', [
                'amount' => $calc['gross'],
                'fee_rate' => $calc['fee_rate'],
                'fee_amount' => $calc['fee_amount'],
                'net_amount' => $calc['net_amount'],
                'bonus' => $calc['bonus'],
                'total' => $calc['total_credit']
            ]);
        } catch (Exception $e) {
            $conn->rollBack();
            respond('error', 'เกิดข้อผิดพลาดในการบันทึกยอดเงิน: ' . $e->getMessage());
        }
    } else {
        $errMsg = isset($response['message']) ? $response['message'] : 'ยังไม่พบยอดโอนเงินตามยอดที่ระบุ';
        respond('pending', $errMsg);
    }
}

// -------------------------------------------------------------
// 2. TRUEWALLET: Redeem Voucher URL via OSXPAY
// -------------------------------------------------------------
elseif ($action === 'wallet_redeem') {
    if (!isset($_SESSION['user_id'])) {
        respond('error', 'กรุณาเข้าสู่ระบบก่อนทำรายการ');
    }

    $isWalletEnabled = get_site_setting($conn, 'truewallet_enabled', '1');
    if ($isWalletEnabled !== '1') {
        respond('error', 'ช่องทางชำระเงิน TrueMoney Wallet ปิดปรับปรุงอยู่ในขณะนี้ กรุณาเลือกชำระเงินช่องทางอื่น');
    }

    $userId = $_SESSION['user_id'];
    $voucherUrl = isset($input['voucher_url']) ? trim($input['voucher_url']) : '';

    if (empty($voucherUrl)) {
        respond('error', 'กรุณากรอกลิงก์ซองของขวัญ TrueMoney Wallet');
    }

    if (strpos($voucherUrl, 'gift.truemoney.com') === false) {
        respond('error', 'รูปแบบลิงก์ซองของขวัญไม่ถูกต้อง (ต้องขึ้นต้นด้วย gift.truemoney.com)');
    }

    $walletPhone = get_site_setting($conn, 'osxpay_wallet_phone', '');
    if (empty($walletPhone)) {
        respond('error', 'ระบบยังไม่ได้ตั้งค่าเบอร์โทรศัพท์ TrueMoney Wallet สำหรับรับเงิน กรุณาติดต่อแอดมิน');
    }

    // Call OSXPAY Redeem API: POST https://pay.osx.in.th/api/truewallet/redeem
    $response = send_osxpay_request($conn, 'https://pay.osx.in.th/api/truewallet/redeem', [
        'voucher_url' => $voucherUrl,
        'phone' => $walletPhone
    ]);

    if ($response && isset($response['success']) && $response['success'] === true) {
        $redeemedAmount = (float)$response['amount'];
        if ($redeemedAmount <= 0) {
            respond('error', 'ยอดเงินในซองของขวัญไม่ถูกต้อง');
        }

        $calc = calculate_topup_net($conn, $redeemedAmount, 'truewallet');

        try {
            $conn->beginTransaction();

            // 1. Credit User Balance & Total Deposited
            $stmt = $conn->prepare("UPDATE users SET balance = balance + ?, total_deposited = total_deposited + ? WHERE id = ?");
            $stmt->execute([$calc['total_credit'], $calc['gross'], $userId]);

            // 2. Record Approved Transaction
            $stmt = $conn->prepare("INSERT INTO topup_transactions (user_id, amount, bonus, method, status, reference) VALUES (?, ?, ?, 'TrueMoney Gift', 'approved', ?)");
            $stmt->execute([$userId, $calc['gross'], $calc['bonus'], $voucherUrl]);

            $conn->commit();

            respond('success', '🎉 เปิดรับซองของขวัญสำเร็จ! เครดิตเข้าบัญชีของคุณแล้ว', [
                'amount' => $calc['gross'],
                'fee_rate' => $calc['fee_rate'],
                'fee_amount' => $calc['fee_amount'],
                'net_amount' => $calc['net_amount'],
                'bonus' => $calc['bonus'],
                'total' => $calc['total_credit']
            ]);
        } catch (Exception $e) {
            $conn->rollBack();
            respond('error', 'เกิดข้อผิดพลาดในการปรับปรุงยอดเงิน: ' . $e->getMessage());
        }
    } else {
        $errMsg = isset($response['message']) ? $response['message'] : 'ลิงก์ซองของขวัญถูกใช้งานแล้ว หรือเกิดข้อผิดพลาดในการเคลม';
        respond('error', $errMsg);
    }
}

// -------------------------------------------------------------
// 3. SLIP VERIFY: Verify QR code embedded in Bank Slip
// -------------------------------------------------------------
elseif ($action === 'check_slip') {
    if (!isset($_SESSION['user_id'])) {
        respond('error', 'กรุณาเข้าสู่ระบบก่อนทำรายการ');
    }

    $isSlipEnabled = get_site_setting($conn, 'slip_enabled', '1');
    if ($isSlipEnabled !== '1') {
        respond('error', 'ช่องทางตรวจสอบสลิป (Slip Verify) ปิดปรับปรุงอยู่ในขณะนี้ กรุณาเลือกชำระเงินช่องทางอื่น');
    }

    $userId = $_SESSION['user_id'];
    $qrcodeText = isset($input['qrcode_text']) ? trim($input['qrcode_text']) : '';
    $slipUrl = isset($input['slip_url']) ? trim($input['slip_url']) : '';

    if (empty($qrcodeText)) {
        respond('error', 'ไม่พบข้อมูล QR Code ภายในรูปภาพสลิป กรุณาตรวจสอบรูปภาพให้ชัดเจน');
    }

    // Anti-replay: Check if this slip QR was already used
    $stmtCheck = $conn->prepare("SELECT id FROM topup_transactions WHERE reference = ? AND status = 'approved' LIMIT 1");
    $stmtCheck->execute([$qrcodeText]);
    if ($stmtCheck->fetch()) {
        respond('error', 'สลิปนี้ถูกใช้งานเติมเงินไปแล้ว ไม่สามารถใช้งานซ้ำได้');
    }

    // Call OSXPAY check-slip API: POST https://pay.osx.in.th/api/check-slip (qrcode_text, provider=byshop)
    $postFields = [
        'qrcode_text' => $qrcodeText,
        'provider' => 'byshop'
    ];

    $response = send_osxpay_request($conn, 'https://pay.osx.in.th/api/check-slip', $postFields, true);

    if ($response && isset($response['success']) && $response['success'] === true) {
        $slipAmount = 0.00;
        if (isset($response['data']['amount'])) {
            $slipAmount = (float)$response['data']['amount'];
        } elseif (isset($response['amount'])) {
            $slipAmount = (float)$response['amount'];
        }

        if ($slipAmount <= 0) {
            respond('error', 'ไม่สามารถตรวจสอบยอดเงินจากสลิปได้');
        }

        $calc = calculate_topup_net($conn, $slipAmount, 'slip');

        try {
            $conn->beginTransaction();

            // 1. Credit User Balance & Total Deposited
            $stmt = $conn->prepare("UPDATE users SET balance = balance + ?, total_deposited = total_deposited + ? WHERE id = ?");
            $stmt->execute([$calc['total_credit'], $calc['gross'], $userId]);

            // 2. Record Approved Transaction
            $stmt = $conn->prepare("INSERT INTO topup_transactions (user_id, amount, bonus, method, status, reference, slip_url) VALUES (?, ?, ?, 'Slip Verify', 'approved', ?, ?)");
            $stmt->execute([$userId, $calc['gross'], $calc['bonus'], $qrcodeText, $slipUrl]);

            $conn->commit();

            respond('success', '🎉 ตรวจสอบสลิปถูกต้องสำเร็จ! ยอดเงินเข้าบัญชีของคุณเรียบร้อยแล้ว', [
                'amount' => $calc['gross'],
                'fee_rate' => $calc['fee_rate'],
                'fee_amount' => $calc['fee_amount'],
                'net_amount' => $calc['net_amount'],
                'bonus' => $calc['bonus'],
                'total' => $calc['total_credit'],
                'slip_data' => $response['data'] ?? null
            ]);
        } catch (Exception $e) {
            $conn->rollBack();
            respond('error', 'เกิดข้อผิดพลาดในการบันทึกยอดเงิน: ' . $e->getMessage());
        }
    } else {
        $errMsg = isset($response['message']) ? $response['message'] : 'สลิปไม่ถูกต้อง หรือไม่พบข้อมูลการโอนเงิน';
        respond('error', $errMsg);
    }
}

// -------------------------------------------------------------
// 4. HISTORY: Fetch Topup Transactions
// -------------------------------------------------------------
elseif ($action === 'history') {
    if (!isset($_SESSION['user_id'])) {
        respond('error', 'Not logged in');
    }

    $userId = $_SESSION['user_id'];

    try {
        // Auto-expire old pending PromptPay transactions > 5 minutes
        try {
            $conn->exec("UPDATE topup_transactions SET status = 'rejected' WHERE status = 'pending' AND method = 'PromptPay QR' AND created_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE)");
        } catch (Exception $ignored) {}

        $stmt = $conn->prepare("SELECT id, amount, bonus, method, status, created_at, reference FROM topup_transactions WHERE user_id = ? ORDER BY id DESC LIMIT 5");
        $stmt->execute([$userId]);
        $txs = $stmt->fetchAll();

        foreach ($txs as &$t) {
            $t['amount'] = (float)$t['amount'];
            $t['bonus'] = (float)$t['bonus'];
            $t['date'] = date('d/m/Y H:i', strtotime($t['created_at']));
        }

        respond('success', 'Top-up transactions fetched', $txs);
    } catch (PDOException $e) {
        respond('error', $e->getMessage());
    }
}

// -------------------------------------------------------------
// 5. REDEEM GIFT CODE
// -------------------------------------------------------------
elseif ($action === 'redeem_code') {
    if (!isset($_SESSION['user_id'])) {
        respond('error', 'กรุณาเข้าสู่ระบบก่อนทำรายการ');
    }

    $userId = $_SESSION['user_id'];
    $code = isset($input['code']) ? trim($input['code']) : '';

    if (empty($code)) {
        respond('error', 'กรุณาระบุโค้ดรางวัล');
    }

    try {
        $stmt = $conn->prepare("SELECT * FROM redeem_codes WHERE code = ? AND status = 'active' LIMIT 1");
        $stmt->execute([$code]);
        $rc = $stmt->fetch();
        if (!$rc) {
            respond('error', 'โค้ดของรางวัลไม่ถูกต้อง หรือไม่ได้เปิดใช้งาน');
        }

        if (!empty($rc['expires_at']) && time() > strtotime($rc['expires_at'])) {
            respond('error', 'โค้ดของรางวัลนี้หมดอายุการใช้งานแล้ว');
        }

        if ($rc['max_uses'] > 0 && $rc['used_count'] >= $rc['max_uses']) {
            respond('error', 'โค้ดของรางวัลนี้มีผู้ใช้ครบกำหนดสิทธิ์แล้ว');
        }

        // Check if user already redeemed this code
        $stmt = $conn->prepare("SELECT COUNT(*) as cnt FROM redeem_code_usages WHERE user_id = ? AND redeem_code_id = ?");
        $stmt->execute([$userId, $rc['id']]);
        $usage = $stmt->fetch();
        if ($usage && $usage['cnt'] > 0) {
            respond('error', 'คุณเคยเปิดใช้งานรหัสโค้ดรางวัลนี้ไปแล้ว จำกัดสิทธิ์ 1 ครั้งต่อบัญชีเท่านั้น');
        }

        $conn->beginTransaction();

        $message = '';
        if ($rc['reward_type'] === 'balance') {
            $amount = (float)$rc['reward_value'];
            $stmt = $conn->prepare("UPDATE users SET balance = balance + ? WHERE id = ?");
            $stmt->execute([$amount, $userId]);

            $stmt = $conn->prepare("INSERT INTO topup_transactions (user_id, amount, bonus, method, status, reference) VALUES (?, ?, 0.00, 'Redeem Code', 'approved', ?)");
            $stmt->execute([$userId, $amount, $rc['code']]);

            $message = "ยินดีด้วย! คุณได้รับเครดิตฟรี ฿" . number_format($amount, 2) . " เรียบร้อยแล้ว";
        } elseif ($rc['reward_type'] === 'script') {
            $scriptId = (int)$rc['reward_value'];
            $duration = !empty($rc['duration']) ? $rc['duration'] : 'ถาวร (ตลอดชีพ)';

            $stmt = $conn->prepare("SELECT name FROM scripts WHERE id = ?");
            $stmt->execute([$scriptId]);
            $script = $stmt->fetch();
            if (!$script) {
                throw new Exception('ไม่พบสคริปต์รางวัลในระบบ');
            }

            $stmt = $conn->prepare("SELECT id FROM keys_store WHERE owner_id = ? AND script_id = ? AND status = 'used'");
            $stmt->execute([$userId, $scriptId]);
            $existing = $stmt->fetch();
            if ($existing) {
                throw new Exception('คุณมีสิทธิ์สคริปต์นี้ในระบบอยู่แล้ว ไม่สามารถเปิดรับซ้ำได้');
            }

            $keyCode = 'OSX-RED-' . strtoupper(bin2hex(random_bytes(8)));
            $stmt = $conn->prepare("INSERT INTO keys_store (script_id, key_code, status, owner_id, used_at, duration) VALUES (?, ?, 'used', ?, CURRENT_TIMESTAMP, ?)");
            $stmt->execute([$scriptId, $keyCode, $userId, $duration]);

            $stmt = $conn->prepare("INSERT INTO orders (user_id, script_id, key_id, price) VALUES (?, ?, ?, 0.00)");
            $stmt->execute([$userId, $scriptId, $conn->lastInsertId(), 0.00]);

            $message = "ยินดีด้วย! คุณได้รับสิทธิ์การใช้งานสคริปต์ \"" . $script['name'] . "\" (" . $duration . ") ฟรีเรียบร้อยแล้ว";
        } else {
            throw new Exception('ประเภทรางวัลไม่ถูกต้อง');
        }

        $stmt = $conn->prepare("INSERT INTO redeem_code_usages (user_id, redeem_code_id) VALUES (?, ?)");
        $stmt->execute([$userId, $rc['id']]);

        $stmt = $conn->prepare("UPDATE redeem_codes SET used_count = used_count + 1 WHERE id = ?");
        $stmt->execute([$rc['id']]);

        $conn->commit();
        respond('success', $message);
    } catch (Exception $e) {
        $conn->rollBack();
        respond('error', 'เกิดข้อผิดพลาด: ' . $e->getMessage());
    }
}

// -------------------------------------------------------------
// 6. PUBLIC SETTINGS
// -------------------------------------------------------------
elseif ($action === 'get_public_settings') {
    try {
        $maintEnabled = get_site_setting($conn, 'promptpay_maintenance_enabled', '1');
        $mStart = get_site_setting($conn, 'promptpay_maintenance_start', '23:30');
        $mEnd = get_site_setting($conn, 'promptpay_maintenance_end', '02:30');
        $isPpInMaint = ($maintEnabled === '1') && is_in_time_window($mStart, $mEnd);

        $settings = [
            'promptpay_number' => get_site_setting($conn, 'promptpay_number', get_site_setting($conn, 'bank_account_number', '217-8-18873-1')),
            'promptpay_name' => get_site_setting($conn, 'promptpay_name', get_site_setting($conn, 'bank_account_name', 'นายวัชรพัฐ นะราวัฒน์')),
            'bank_name' => get_site_setting($conn, 'bank_name', 'ธนาคารกสิกรไทย'),
            'bank_account_number' => get_site_setting($conn, 'bank_account_number', '217-8-18873-1'),
            'bank_account_name' => get_site_setting($conn, 'bank_account_name', 'นายวัชรพัฐ นะราวัฒน์'),
            'truewallet_name' => get_site_setting($conn, 'truewallet_name', 'นายวัชรพัฐ นะราวัฒน์'),
            'truewallet_phone' => get_site_setting($conn, 'osxpay_wallet_phone', ''),
            'promptpay_enabled' => get_site_setting($conn, 'promptpay_enabled', '1'),
            'truewallet_enabled' => get_site_setting($conn, 'truewallet_enabled', '1'),
            'slip_enabled' => get_site_setting($conn, 'slip_enabled', '1'),
            'promptpay_maintenance_enabled' => $maintEnabled,
            'promptpay_maintenance_start' => $mStart,
            'promptpay_maintenance_end' => $mEnd,
            'is_promptpay_in_maintenance' => $isPpInMaint,
            'topup_fee_percent' => (float)get_site_setting($conn, 'topup_fee_percent', '0'),
            'fee_promptpay_percent' => (float)get_site_setting($conn, 'fee_promptpay_percent', get_site_setting($conn, 'topup_fee_percent', '0')),
            'fee_truewallet_percent' => (float)get_site_setting($conn, 'fee_truewallet_percent', get_site_setting($conn, 'topup_fee_percent', '0')),
            'fee_slip_percent' => (float)get_site_setting($conn, 'fee_slip_percent', get_site_setting($conn, 'topup_fee_percent', '0')),
            'promptpay_decimal_min' => (int)get_site_setting($conn, 'promptpay_decimal_min', '1'),
            'promptpay_decimal_max' => (int)get_site_setting($conn, 'promptpay_decimal_max', '99'),
            'topup_tier1_min' => (float)get_site_setting($conn, 'topup_tier1_min', '200'),
            'topup_tier1_rate' => (float)get_site_setting($conn, 'topup_tier1_rate', '10'),
            'topup_tier2_min' => (float)get_site_setting($conn, 'topup_tier2_min', '500'),
            'topup_tier2_rate' => (float)get_site_setting($conn, 'topup_tier2_rate', '15'),
            'topup_tier3_min' => (float)get_site_setting($conn, 'topup_tier3_min', '1000'),
            'topup_tier3_rate' => (float)get_site_setting($conn, 'topup_tier3_rate', '20'),
        ];
        respond('success', 'Public settings fetched', $settings);
    } catch (Exception $e) {
        respond('error', $e->getMessage());
    }
}

else {
    respond('error', 'Invalid action');
}

