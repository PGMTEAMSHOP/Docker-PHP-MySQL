<?php
// api/executor_status.php

header("Content-Type: application/json; charset=UTF-8");

$cacheFile = 'cache_executor_status.json';
$cacheTime = 300; // 5 minutes in seconds

// If cache file is fresh, return it
if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $cacheTime) {
    $cachedData = file_get_contents($cacheFile);
    if (!empty($cachedData)) {
        echo $cachedData;
        exit();
    }
}

// Fetch new data from WEAO API
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://weao.xyz/api/status/exploits");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "User-Agent: WEAO-3PService"
]);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_TIMEOUT, 15);
$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_code === 200 && !empty($response)) {
    // Save to cache
    file_put_contents($cacheFile, $response);
    echo $response;
    exit();
} else {
    // If external request fails, fallback to cache if available even if stale
    if (file_exists($cacheFile)) {
        $cachedData = file_get_contents($cacheFile);
        if (!empty($cachedData)) {
            echo $cachedData;
            exit();
        }
    }
    
    echo json_encode([
        "status" => "error",
        "message" => "ไม่สามารถดึงข้อมูลสถานะได้ในขณะนี้"
    ]);
    exit();
}
