<?php
declare(strict_types=1);

// share_preview.php - Dynamic Open Graph preview generator for SEO crawler crawlers
$type = $_GET['type'] ?? '';
$id = (int)($_GET['id'] ?? 0);
$slug = preg_replace('/[^a-z0-9-]/', '', strtolower((string)($_GET['slug'] ?? '')));
$shareVersion = preg_replace('/[^a-zA-Z0-9_-]/', '', (string)($_GET['share'] ?? ''));

// Site-wide Defaults
$title = "Skid Steer V900 by TYPHON | Happy Machinery";
$desc = "Explore the Skid Steer V900 by TYPHON at Happy Machinery. View V900 specifications, attachments, performance videos, nationwide delivery, and request pricing.";
$image = "https://happymachinery.com/images/why-choose-v900-jobsite.png";
$url = "https://happymachinery.com/";
$productPaths = [
    901 => 'typhon-stomp-v900-mini-track-loader-kubota-d1105-red',
    902 => 'typhon-stomp-v900-mini-track-loader-kubota-d1105',
    903 => 'typhon-stomp-v900-mini-track-loader-kubota-d1105-blue',
];

// Location of the persistent storage
$storageFile = dirname(__DIR__) . '/happy-machinery-storage/content.json';
$database = [];
if (is_file($storageFile)) {
    $database = json_decode((string)file_get_contents($storageFile), true) ?: [];
}

// 1. Process Blog Previews
if ($type === 'blog' && ($id > 0 || $slug !== '')) {
    $posts = $database['blog-posts'] ?? [];
    
    // Fallback default blog posts if database is empty/not initialized
    if (empty($posts)) {
        $posts = [
            [
                'id' => 1,
                'title' => 'How to Choose the Right Mini Track Loader for Your Jobsite',
                'excerpt' => 'Operating weight, hydraulic flow, track contact length, and attachment compatibility are critical parameters to consider before purchasing.',
                'image' => '/images/why-choose-v900-jobsite.png'
            ],
            [
                'id' => 2,
                'title' => 'Stand-On Track Loaders vs. Wheeled Skid Steers',
                'excerpt' => 'Understand ground pressure dynamics, grading capabilities, and track durability differences under residential and industrial soil conditions.',
                'image' => '/images/fork-red-jobsite.png'
            ],
            [
                'id' => 3,
                'title' => 'Daily Preventive Maintenance Checklist for Track Loaders',
                'excerpt' => 'Keep your machinery running through every shift. Essential checks for hydraulic fluid, track tension, and grease points that save thousands.',
                'image' => '/images/fork-blue-jobsite.png'
            ]
        ];
    }

    foreach ($posts as $post) {
        $postSlug = $post['slug'] ?? strtolower(trim((string)preg_replace('/[^a-z0-9]+/i', '-', $post['title']), '-'));
        if (($id > 0 && (int)$post['id'] === $id) || ($slug !== '' && $postSlug === $slug)) {
            $title = !empty($post['seoTitle']) ? $post['seoTitle'] : ($post['title'] . " | Happy Machinery Blog");
            $desc = !empty($post['metaDescription']) ? $post['metaDescription'] : $post['excerpt'];
            $imageAlt = !empty($post['imageAlt']) ? $post['imageAlt'] : (!empty($post['alt']) ? $post['alt'] : $post['title']);
            $imagePath = $post['image'];
            $image = strpos($imagePath, 'http') === 0 ? $imagePath : "https://happymachinery.com" . $imagePath;
            if ($id === 1784947777428) {
                $image = "https://happymachinery.com/images/blog/compact-excavator-work-all-day.webp";
            }
            $url = "https://happymachinery.com/blog/" . rawurlencode($postSlug);
            if ($shareVersion !== '') {
                $url .= "?share=" . rawurlencode($shareVersion);
            }
            break;
        }
    }
}

// 2. Process Product Previews
elseif ($type === 'product' && $id > 0) {
    $products = $database['products'] ?? [];
    $found = false;

    foreach ($products as $prod) {
        if ((int)$prod['id'] === $id) {
            $title = $prod['name'] . " | Happy Machinery";
            $desc = $prod['description'] ?? $prod['fullDesc'] ?? 'View product details, specifications, availability, and delivery information from Happy Machinery.';
            $image = "https://happymachinery.com/share_image.php?type=product&id=" . $id . "&v=1";
            $url = "https://happymachinery.com/product/" . ($productPaths[$id] ?? $id);
            if ($shareVersion !== '') {
                $url .= "?share=" . rawurlencode($shareVersion);
            }
            $found = true;
            break;
        }
    }

    // Default V900 Models Fallbacks
    if (!$found) {
        if ($id === 901) {
            $title = "Skid Steer V900 (Red Edition) | Happy Machinery";
            $desc = "Bold Crimson Red utility package with Kubota D1105 engine.";
            $image = "https://happymachinery.com/images/loader-red.png";
            $url = "https://happymachinery.com/product/" . $productPaths[901];
        } elseif ($id === 902) {
            $title = "Skid Steer V900 (Yellow Edition) | Happy Machinery";
            $desc = "Industrial Yellow finish with Kubota D1105 engine.";
            $image = "https://happymachinery.com/images/loader-yellow.png";
            $url = "https://happymachinery.com/product/" . $productPaths[902];
        } elseif ($id === 903) {
            $title = "Skid Steer V900 (Blue Edition) | Happy Machinery";
            $desc = "Cobalt Blue utility package with Kubota D1105 engine.";
            $image = "https://happymachinery.com/images/loader-blue.png";
            $url = "https://happymachinery.com/product/" . $productPaths[903];
        }

        if ($found && $shareVersion !== '') {
            $url .= "?share=" . rawurlencode($shareVersion);
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title><?= htmlspecialchars($title) ?></title>
    <meta name="description" content="<?= htmlspecialchars($desc) ?>">
    <meta property="og:type" content="<?= $type === 'blog' ? 'article' : 'website' ?>">
    <meta property="og:site_name" content="Happy Machinery">
    <meta property="og:title" content="<?= htmlspecialchars($title) ?>">
    <meta property="og:description" content="<?= htmlspecialchars($desc) ?>">
    <meta property="og:url" content="<?= htmlspecialchars($url) ?>">
    <meta property="og:image" content="<?= htmlspecialchars($image) ?>">
    <?php if (!empty($imageAlt)): ?>
    <meta property="og:image:alt" content="<?= htmlspecialchars($imageAlt) ?>">
    <?php endif; ?>
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="<?= htmlspecialchars($title) ?>">
    <meta name="twitter:description" content="<?= htmlspecialchars($desc) ?>">
    <meta name="twitter:image" content="<?= htmlspecialchars($image) ?>">
    <?php if (!empty($imageAlt)): ?>
    <meta name="twitter:image:alt" content="<?= htmlspecialchars($imageAlt) ?>">
    <?php endif; ?>
    <meta http-equiv="refresh" content="0;url=<?= htmlspecialchars($url) ?>">
</head>
<body>
    <p>Redirecting to item... <a href="<?= htmlspecialchars($url) ?>">Click here if not redirected automatically</a>.</p>
</body>
</html>
