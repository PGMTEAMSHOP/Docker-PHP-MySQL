<?php
// api/loader.php

$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? '';

// ตรวจสอบว่าคำขอส่งมาจาก Roblox หรือโปรแกรมรันสคริปต์ (Executor) หรือไม่
// ปกติ Roblox จะส่ง User-Agent ที่มีคำว่า Roblox เช่น Roblox/Linux, Roblox/WinInet
$isRoblox = (stripos($userAgent, 'Roblox') !== false) || 
            isset($_SERVER['HTTP_X_ROBLOX_USER_AGENT']) ||
            isset($_SERVER['HTTP_SYN_USER_AGENT']) || 
            isset($_SERVER['HTTP_EXECUTOR']);

if (!$isRoblox) {
    // หากเข้าใช้งานผ่าน Browser ทั่วไป ให้ปฏิเสธการเข้าถึงทันที (ไม่ให้เห็นโค้ด Lua)
    header("HTTP/1.1 403 Forbidden");
    echo "Access Denied: Unauthorized client.";
    exit();
}

header("Content-Type: text/plain; charset=UTF-8");
$loaderPath = __DIR__ . '/scripts/loader.lua';
if (file_exists($loaderPath)) {
    echo file_get_contents($loaderPath);
} else {
    http_response_code(404);
    echo "Loader Not Found";
}
