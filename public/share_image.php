<?php
declare(strict_types=1);

$type = $_GET['type'] ?? '';
$id = (int)($_GET['id'] ?? 0);

if ($type !== 'product' || $id <= 0) {
    http_response_code(400);
    exit;
}

$storageFile = dirname(__DIR__) . '/happy-machinery-storage/content.json';
$database = is_file($storageFile)
    ? (json_decode((string)file_get_contents($storageFile), true) ?: [])
    : [];

$imageUrl = '';
foreach (($database['products'] ?? []) as $product) {
    if ((int)($product['id'] ?? 0) === $id) {
        $imageUrl = (string)($product['image'] ?? '');
        break;
    }
}

$fallbacks = [
    901 => '/images/loader-red.png',
    902 => '/images/loader-yellow.png',
    903 => '/images/loader-blue.png',
];
$imageUrl = $imageUrl ?: ($fallbacks[$id] ?? '');

if ($imageUrl === '') {
    http_response_code(404);
    exit;
}

if (str_starts_with($imageUrl, '/')) {
    $localPath = __DIR__ . $imageUrl;
    if (!is_file($localPath)) {
        http_response_code(404);
        exit;
    }
    $imageData = file_get_contents($localPath);
} elseif (preg_match('#^https?://#i', $imageUrl)) {
    $context = stream_context_create([
        'http' => [
            'timeout' => 15,
            'follow_location' => 1,
            'user_agent' => 'HappyMachinerySocialPreview/1.0',
        ],
    ]);
    $imageData = @file_get_contents($imageUrl, false, $context);
} else {
    http_response_code(400);
    exit;
}

if ($imageData === false || $imageData === '') {
    http_response_code(502);
    exit;
}

$imageInfo = @getimagesizefromstring($imageData);
$contentType = is_array($imageInfo) && isset($imageInfo['mime'])
    ? $imageInfo['mime']
    : 'image/jpeg';

header('Content-Type: ' . $contentType);
header('Content-Length: ' . strlen($imageData));
header('Cache-Control: public, max-age=604800');
echo $imageData;
