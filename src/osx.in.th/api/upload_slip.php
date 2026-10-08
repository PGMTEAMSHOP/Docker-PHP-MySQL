<?php
// api/upload_slip.php
require_once 'db.php';

if (!isset($_SESSION['user_id'])) {
    respond('error', 'กรุณาเข้าสู่ระบบก่อนทำรายการ');
}

$userId = $_SESSION['user_id'];

// Auto-expire old pending PromptPay transactions older than 5 minutes for this user
try {
    $conn->prepare("UPDATE topup_transactions SET status = 'rejected' WHERE user_id = ? AND method = 'PromptPay QR' AND status = 'pending' AND created_at < DATE_SUB(NOW(), INTERVAL 5 MINUTE)")->execute([$userId]);
} catch (Exception $ignored) {}

// Check if user has any pending transactions
$stmtPending = $conn->prepare("SELECT COUNT(*) as pending_count FROM topup_transactions WHERE user_id = ? AND status = 'pending'");
$stmtPending->execute([$userId]);
$pendingCount = (int)$stmtPending->fetch()['pending_count'];

if ($pendingCount > 0) {
    respond('error', 'คุณมียอดเติมเงินค้างตรวจสอบอยู่ ไม่สามารถอัปโหลดสลิปใหม่ได้');
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond('error', 'Invalid request method');
}

if (!isset($_FILES['slip'])) {
    respond('error', 'ไม่พบไฟล์ที่อัปโหลด');
}

$file = $_FILES['slip'];
$maxSize = 5 * 1024 * 1024; // 5MB
$allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'img', 'jfif'];
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

if (!in_array($ext, $allowedExtensions)) {
    respond('error', 'รูปแบบไฟล์ไม่ถูกต้อง รองรับเฉพาะ JPG, JPEG, PNG, WEBP, IMG, JFIF');
}

if ($file['size'] > $maxSize) {
    respond('error', 'ขนาดไฟล์ต้องไม่เกิน 5MB');
}

$uploadDir = __DIR__ . '/../public/uploads/slips/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$filename = 'slip_' . $userId . '_' . time() . '.' . $ext;
$targetPath = $uploadDir . $filename;

if (move_uploaded_file($file['tmp_name'], $targetPath)) {
    $publicPath = '/uploads/slips/' . $filename;
    respond('success', 'อัปโหลดสลิปเรียบร้อยแล้ว', ['url' => $publicPath]);
} else {
    respond('error', 'ไม่สามารถบันทึกไฟล์สลิปได้');
}
