<?php
// api/announcements.php
require_once 'db.php';

$action = isset($_GET['action']) ? $_GET['action'] : 'banner';

if ($action === 'banner') {
    try {
        $stmt = $conn->query("
            SELECT id, title, content, type, is_banner, is_popup, image_url, banner_link, created_at
            FROM announcements
            WHERE is_banner = 1 AND is_active = 1
            ORDER BY id DESC
        ");
        $announcements = $stmt->fetchAll();
        respond('success', 'Banner announcements fetched', $announcements);
    } catch (PDOException $e) {
        respond('error', $e->getMessage());
    }
}

elseif ($action === 'popup') {
    try {
        $stmt = $conn->query("
            SELECT id, title, content, type, is_banner, is_popup, image_url, banner_link, created_at
            FROM announcements
            WHERE is_popup = 1 AND is_active = 1
            ORDER BY id DESC
        ");
        $announcements = $stmt->fetchAll();
        respond('success', 'Popup announcements fetched', $announcements);
    } catch (PDOException $e) {
        respond('error', $e->getMessage());
    }
}

elseif ($action === 'announcements') {
    try {
        $stmt = $conn->query("
            SELECT id, title, content, type, is_banner, is_popup, image_url, banner_link, created_at
            FROM announcements
            WHERE is_active = 1
            ORDER BY id DESC
        ");
        $announcements = $stmt->fetchAll();
        respond('success', 'Announcements fetched', $announcements);
    } catch (PDOException $e) {
        respond('error', $e->getMessage());
    }
}



else {
    respond('error', 'Invalid action');
}
