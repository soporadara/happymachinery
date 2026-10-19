<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');

$allowedKeys = [
    'blog-posts',
    'media-library',
    'products',
    'cart-activity',
    'admin-users',
    'security-logs',
    'banned-ips',
    'failed-logins',
    'security-settings',
    'analytics-events',
    'site-settings',
    'site-pages'
];

$storageDirectory = dirname(__DIR__, 2) . '/happy-machinery-storage';
$storageFile = $storageDirectory . '/content.json';

if (!is_dir($storageDirectory) && !mkdir($storageDirectory, 0755, true) && !is_dir($storageDirectory)) {
    http_response_code(500);
    echo json_encode(['error' => 'The server storage directory is not writable.']);
    exit;
}

$readDatabase = static function () use ($storageFile): array {
    if (!is_file($storageFile)) {
        return [];
    }

    $contents = file_get_contents($storageFile);
    if ($contents === false || $contents === '') {
        return [];
    }

    $decoded = json_decode($contents, true);
    return is_array($decoded) ? $decoded : [];
};

$getClientIp = static function (): string {
    // Only trust REMOTE_ADDR directly or valid reverse proxy
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    if (!empty($_SERVER['HTTP_CF_CONNECTING_IP'])) {
        $ip = $_SERVER['HTTP_CF_CONNECTING_IP'];
    }
    return filter_var($ip, FILTER_VALIDATE_IP) ? $ip : '127.0.0.1';
};

$clientIp = $getClientIp();
$database = $readDatabase();

// Check if IP is banned
$bannedIps = $database['banned-ips'] ?? [];
if (is_array($bannedIps)) {
    $now = time();
    foreach ($bannedIps as $ban) {
        if (!empty($ban['active']) && !empty($ban['ip']) && $ban['ip'] === $clientIp) {
            // Check expiry
            if (!empty($ban['expiresAt'])) {
                $expiresTime = strtotime($ban['expiresAt']);
                if ($expiresTime && $expiresTime < $now) {
                    continue; // Ban expired
                }
            }
            http_response_code(403);
            echo json_encode(['error' => 'Access denied by Happy Machinery Shield security policy.']);
            exit;
        }
    }
}

$action = $_GET['action'] ?? '';

// Action: check-ip status
if ($action === 'check-ip') {
    echo json_encode(['ip' => $clientIp, 'banned' => false]);
    exit;
}

$key = $_GET['key'] ?? '';

if (!in_array($key, $allowedKeys, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid content key.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (!array_key_exists($key, $database)) {
        http_response_code(404);
        echo json_encode(['error' => 'Content has not been initialized.']);
        exit;
    }

    echo json_encode(['value' => $database[$key]], JSON_UNESCAPED_SLASHES);
    exit;
}

if (!in_array($_SERVER['REQUEST_METHOD'], ['PUT', 'POST'], true)) {
    http_response_code(405);
    header('Allow: GET, PUT, POST');
    echo json_encode(['error' => 'Method not allowed.']);
    exit;
}

$input = file_get_contents('php://input');
$payload = json_decode($input ?: '', true);
if (!is_array($payload) || !array_key_exists('value', $payload)) {
    http_response_code(422);
    echo json_encode(['error' => 'A valid content value is required.']);
    exit;
}

$lockFile = $storageDirectory . '/content.lock';
$lockHandle = fopen($lockFile, 'c');
if ($lockHandle === false || !flock($lockHandle, LOCK_EX)) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not lock the content database.']);
    exit;
}

$database = $readDatabase();

// Max record limits per key for performance
$limits = [
    'analytics-events' => 5000,
    'security-logs' => 1000,
    'failed-logins' => 500,
    'cart-activity' => 500
];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $existing = isset($database[$key]) && is_array($database[$key]) ? $database[$key] : [];
    array_unshift($existing, $payload['value']);
    $limit = $limits[$key] ?? 1000;
    $database[$key] = array_slice($existing, 0, $limit);
} else {
    $database[$key] = $payload['value'];
}

$encoded = json_encode($database, JSON_UNESCAPED_SLASHES);
$saved = $encoded !== false && file_put_contents($storageFile, $encoded, LOCK_EX) !== false;

flock($lockHandle, LOCK_UN);
fclose($lockHandle);

if (!$saved) {
    http_response_code(500);
    echo json_encode(['error' => 'Could not save content on the server.']);
    exit;
}

echo json_encode(['saved' => true]);
