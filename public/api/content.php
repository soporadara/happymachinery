<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store, no-cache, must-revalidate');

$allowedKeys = ['blog-posts', 'media-library', 'products', 'cart-activity'];
$key = $_GET['key'] ?? '';

if (!in_array($key, $allowedKeys, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid content key.']);
    exit;
}

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

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $database = $readDatabase();
    if (!array_key_exists($key, $database)) {
        http_response_code(404);
        echo json_encode(['error' => 'Content has not been initialized.']);
        exit;
    }

    echo json_encode(['value' => $database[$key]], JSON_UNESCAPED_SLASHES);
    exit;
}

// All content mutations require a server-validated administrator session.
session_name('happy_admin_session');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'),
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();
if ($_SERVER['REQUEST_METHOD'] === 'PUT' || ($_SERVER['REQUEST_METHOD'] === 'POST' && $key !== 'cart-activity')) {
if (empty($_SESSION['happy_admin_authenticated'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Administrator authentication is required.']);
    exit;
}
}

if (!in_array($_SERVER['REQUEST_METHOD'], ['PUT', 'POST'], true)) {
    http_response_code(405);
    header('Allow: GET, PUT, POST');
    echo json_encode(['error' => 'Method not allowed.']);
    exit;
}

$input = file_get_contents('php://input');
$payload = json_decode($input ?: '', true);
if (!is_array($payload) || !array_key_exists('value', $payload) || !is_array($payload['value'])) {
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
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $existing = isset($database[$key]) && is_array($database[$key]) ? $database[$key] : [];
    array_unshift($existing, $payload['value']);
    $database[$key] = array_slice($existing, 0, 500);
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
