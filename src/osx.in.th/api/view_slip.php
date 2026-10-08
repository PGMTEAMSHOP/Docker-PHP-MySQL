<?php
// api/view_slip.php
require_once 'db.php';

// Protection: only administrators can view slips
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    http_response_code(403);
    exit('Unauthorized. Administrators only.');
}

$file = isset($_GET['file']) ? basename($_GET['file']) : '';

if (empty($file)) {
    http_response_code(400);
    exit('Bad Request');
}

$filePath = __DIR__ . '/../public/uploads/slips/' . $file;

if (!file_exists($filePath)) {
    http_response_code(404);
    exit('File not found');
}

$ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
$mimeType = 'image/jpeg';
if ($ext === 'png') {
    $mimeType = 'image/png';
} elseif ($ext === 'webp') {
    $mimeType = 'image/webp';
} elseif ($ext === 'gif') {
    $mimeType = 'image/gif';
}

header('Content-Type: ' . $mimeType);
header('Content-Length: ' . filesize($filePath));
readfile($filePath);
exit();
