<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('X-Content-Type-Options: nosniff');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
    || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https');

session_name('happy_admin_session');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => $https,
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();

if ($method === 'GET') {
    echo json_encode(['authenticated' => !empty($_SESSION['happy_admin_authenticated'])]);
    exit;
}

if ($method !== 'POST') {
    header('Allow: GET, POST');
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed.']);
    exit;
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host = $_SERVER['HTTP_HOST'] ?? '';
if ($origin !== '' && $host !== '') {
    $originHost = parse_url($origin, PHP_URL_HOST);
    if (!is_string($originHost) || strcasecmp($originHost, preg_replace('/:\\d+$/', '', $host)) !== 0) {
        http_response_code(403);
        echo json_encode(['error' => 'Request origin rejected.']);
        exit;
    }
}

$payload = json_decode(file_get_contents('php://input') ?: '', true);
$action = is_array($payload) ? ($payload['action'] ?? '') : '';

if ($action === 'logout') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', [
            'expires' => time() - 42000,
            'path' => $params['path'],
            'secure' => $params['secure'],
            'httponly' => true,
            'samesite' => 'Strict',
        ]);
    }
    session_destroy();
    echo json_encode(['authenticated' => false]);
    exit;
}

if ($action !== 'login') {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid authentication action.']);
    exit;
}

$password = getenv('HAPPY_ADMIN_PASSWORD');
if (!is_string($password) || strlen($password) < 14) {
    http_response_code(503);
    echo json_encode(['error' => 'Admin login is not configured securely. Set HAPPY_ADMIN_PASSWORD to a strong secret of at least 14 characters.']);
    exit;
}

$attemptDirectory = sys_get_temp_dir() . '/happy-machinery-auth';
if (!is_dir($attemptDirectory) && !@mkdir($attemptDirectory, 0700, true) && !is_dir($attemptDirectory)) {
    http_response_code(503);
    echo json_encode(['error' => 'Authentication service is temporarily unavailable.']);
    exit;
}
$client = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$attemptKey = hash('sha256', $client);
$attemptFile = $attemptDirectory . '/' . $attemptKey . '.json';
$attempts = [];
if (is_file($attemptFile)) {
    $stored = json_decode((string)@file_get_contents($attemptFile), true);
    if (is_array($stored)) $attempts = $stored;
}
$now = time();
$attempts = array_values(array_filter($attempts, static fn($time) => is_int($time) && $time > $now - 900));
if (count($attempts) >= 8) {
    http_response_code(429);
    header('Retry-After: 900');
    echo json_encode(['error' => 'Too many login attempts. Please try again in 15 minutes.']);
    exit;
}

$submitted = is_array($payload) && is_string($payload['password'] ?? null) ? $payload['password'] : '';
if (!hash_equals($password, $submitted)) {
    $attempts[] = $now;
    @file_put_contents($attemptFile, json_encode($attempts), LOCK_EX);
    http_response_code(401);
    echo json_encode(['error' => 'Invalid password.']);
    exit;
}

@unlink($attemptFile);
session_regenerate_id(true);
$_SESSION['happy_admin_authenticated'] = true;
$_SESSION['happy_admin_authenticated_at'] = $now;
echo json_encode(['authenticated' => true]);
