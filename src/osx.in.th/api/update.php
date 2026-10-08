<?php
// keysystem/update.php
// MultiRBX - Software Update Check API Endpoint
// Powered By OSXHUB

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

// =========================================================================
// MultiRBX Version Configuration
// แก้ไขเลขเวอร์ชันล่าสุด ลิงก์ดาวน์โหลด และรายละเอียดการอัปเดตที่นี่
// =========================================================================

$latestVersion = "3.1.1"; // เลขเวอร์ชันล่าสุดบนเซิร์ฟเวอร์ (v3.1.1)
$releaseDate   = "2026-10-07";
$downloadUrl   = "https://osx.in.th/downloads/MultiRBX_Setup_v3.1.1.exe";
$mandatory     = false; // กำหนดเป็น true หากต้องการบังคับอัปเดต (ไม่อนุญาตให้กดข้าม)

$changelog = "🚀 สิ่งใหม่ใน MultiRBX v3.1.1 Update:\n" .
             "• แก้ไขปัญหาระบบตรวจจับหน้าต่าง Roblox ไม่ครบ (ตรวจเจอครบทุก 18+ จอ จากเดิมที่ค้างแค่ 10 จอ)\n" .
             "• แก้ไขปัญหา Anti-AFK หลุดหรือหยุดทำงานเมื่อเปิดหลายหน้าต่าง (ปรับปรุง Win32 Background Message & AttachThreadInput)\n" .
             "• ปรับปรุงระบบจัดเรียงหน้าต่าง (Arrange Windows) ไม่มั่ว ไม่ซ้อนทับ รองรับโหมด Grid อัตโนมัติและแก้ข้อจำกัดขนาดหน้าต่างของ Roblox\n" .
             "• ปรับปรุงความเสถียรและความแม่นยำของระบบตรวจจับกระบวนการทำงานในพื้นหลัง";

// อ่านเวอร์ชันที่ส่งมาจากโปรแกรม (ถ้ามี)
$clientVersion = trim($_GET['currentVersion'] ?? $_GET['version'] ?? '');

$response = [
    "success"        => true,
    "latest_version" => $latestVersion,
    "release_date"   => $releaseDate,
    "title"          => "MultiRBX Update v" . $latestVersion,
    "changelog"      => $changelog,
    "download_url"   => $downloadUrl,
    "mandatory"      => $mandatory,
    "client_version" => $clientVersion
];

echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
