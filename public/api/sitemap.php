<?php
declare(strict_types=1);

header('Content-Type: application/xml; charset=utf-8');
header('Cache-Control: public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400');
header('X-Robots-Tag: noindex');

$storageFile = dirname(__DIR__, 2) . '/happy-machinery-storage/content.json';
if (!file_exists($storageFile)) {
    $storageFile = dirname(__DIR__, 2) . '/.admin-data/content.json';
}

$blogPosts = [];
if (file_exists($storageFile)) {
    $raw = @file_get_contents($storageFile);
    if ($raw) {
        $data = @json_decode($raw, true);
        if (is_array($data) && !empty($data['blog-posts']) && is_array($data['blog-posts'])) {
            $blogPosts = $data['blog-posts'];
        }
    }
}

function xmlEscape(string $str): string {
    return htmlspecialchars($str, ENT_XML1 | ENT_QUOTES, 'UTF-8');
}

function slugify(string $text): string {
    $text = preg_replace('~[^\pL\d]+~u', '-', $text);
    $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
    $text = preg_replace('~[^-\w]+~', '', $text);
    $text = trim($text, '-');
    $text = preg_replace('~-+~', '-', $text);
    $text = strtolower($text);
    return empty($text) ? 'post' : $text;
}

$today = date('Y-m-d');

echo '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
echo '<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>' . "\n";
?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
>
  <url>
    <loc>https://happymachinery.com/</loc>
    <lastmod><?= $today ?></lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>https://happymachinery.com/images/hero-v900-three-colors.png</image:loc>
      <image:title>TYPHON STOMP V900 Three Colors Lineup</image:title>
    </image:image>
    <image:image>
      <image:loc>https://happymachinery.com/images/why-choose-v900-jobsite.png</image:loc>
      <image:title>TYPHON STOMP V900 Jobsite Operations</image:title>
    </image:image>
    <image:image>
      <image:loc>https://happymachinery.com/images/v900-promo.webp</image:loc>
      <image:title>Happy Machinery TYPHON Fleet</image:title>
    </image:image>
  </url>
  <url>
    <loc>https://happymachinery.com/store</loc>
    <lastmod><?= $today ?></lastmod>
    <changefreq>daily</changefreq>
    <priority>0.95</priority>
    <image:image>
      <image:loc>https://happymachinery.com/images/v900-promo.webp</image:loc>
      <image:title>Official TYPHON Machinery Catalog</image:title>
    </image:image>
  </url>
  <url>
    <loc>https://happymachinery.com/blog</loc>
    <lastmod><?= $today ?></lastmod>
    <changefreq>daily</changefreq>
    <priority>0.95</priority>
    <image:image>
      <image:loc>https://happymachinery.com/images/why-choose-v900-jobsite.png</image:loc>
      <image:title>Commercial Machinery &amp; Contractor Resource Blog</image:title>
    </image:image>
  </url>
  <url>
    <loc>https://happymachinery.com/about</loc>
    <lastmod><?= $today ?></lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
    <image:image>
      <image:loc>https://happymachinery.com/images/about-team-1.png</image:loc>
      <image:title>Happy Machinery Team &amp; Facilities</image:title>
    </image:image>
  </url>
  <url>
    <loc>https://happymachinery.com/contact</loc>
    <lastmod><?= $today ?></lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.80</priority>
    <image:image>
      <image:loc>https://happymachinery.com/images/v900-promo.webp</image:loc>
      <image:title>Direct Sales &amp; Technical Service</image:title>
    </image:image>
  </url>
  <url>
    <loc>https://happymachinery.com/faq</loc>
    <lastmod><?= $today ?></lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.70</priority>
  </url>
  <url>
    <loc>https://happymachinery.com/terms-of-service</loc>
    <lastmod><?= $today ?></lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.50</priority>
  </url>
  <url>
    <loc>https://happymachinery.com/privacy-policy</loc>
    <lastmod><?= $today ?></lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.50</priority>
  </url>

  <!-- Machinery Products -->
  <url>
    <loc>https://happymachinery.com/product/typhon-stomp-v900-mini-track-loader-kubota-d1105-red</loc>
    <lastmod><?= $today ?></lastmod>
    <changefreq>daily</changefreq>
    <priority>0.90</priority>
    <image:image>
      <image:loc>https://happymachinery.com/images/loader-red.png</image:loc>
      <image:title>TYPHON STOMP V900 – Crimson Red</image:title>
    </image:image>
    <image:image>
      <image:loc>https://happymachinery.com/images/fork-red.jpg</image:loc>
      <image:title>Crimson Red V900 with Pallet Fork Attachment</image:title>
    </image:image>
  </url>
  <url>
    <loc>https://happymachinery.com/product/typhon-stomp-v900-mini-track-loader-kubota-d1105</loc>
    <lastmod><?= $today ?></lastmod>
    <changefreq>daily</changefreq>
    <priority>0.90</priority>
    <image:image>
      <image:loc>https://happymachinery.com/images/loader-yellow.png</image:loc>
      <image:title>TYPHON STOMP V900 – Industrial Yellow</image:title>
    </image:image>
    <image:image>
      <image:loc>https://happymachinery.com/images/fork-yellow.jpg</image:loc>
      <image:title>Industrial Yellow V900 with Pallet Fork Attachment</image:title>
    </image:image>
  </url>
  <url>
    <loc>https://happymachinery.com/product/typhon-stomp-v900-mini-track-loader-kubota-d1105-blue</loc>
    <lastmod><?= $today ?></lastmod>
    <changefreq>daily</changefreq>
    <priority>0.90</priority>
    <image:image>
      <image:loc>https://happymachinery.com/images/loader-blue.png</image:loc>
      <image:title>TYPHON STOMP V900 – Cobalt Blue</image:title>
    </image:image>
    <image:image>
      <image:loc>https://happymachinery.com/images/fork-blue.jpg</image:loc>
      <image:title>Cobalt Blue V900 with Pallet Fork Attachment</image:title>
    </image:image>
  </url>
  <url>
    <loc>https://happymachinery.com/product/typh-5005m-pallet-fork</loc>
    <lastmod><?= $today ?></lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
    <image:image>
      <image:loc>https://happymachinery.com/images/fork-yellow.jpg</image:loc>
      <image:title>TYPH-5005M Heavy Duty Adjustable Pallet Fork Attachment</image:title>
    </image:image>
  </url>

  <!-- Dynamic Blog Posts from Database -->
<?php
$seenSlugs = [];
foreach ($blogPosts as $post):
    $title = $post['title'] ?? '';
    if (empty($title)) continue;
    $slug = !empty($post['slug']) ? trim($post['slug']) : slugify($title);
    if (isset($seenSlugs[$slug])) continue;
    $seenSlugs[$slug] = true;

    $postDate = $today;
    if (!empty($post['date'])) {
        $ts = strtotime($post['date']);
        if ($ts !== false) {
            $postDate = date('Y-m-d', $ts);
        }
    }

    $img = $post['image'] ?? '/images/why-choose-v900-jobsite.png';
    if (!preg_match('#^https?://#i', $img)) {
        $img = 'https://happymachinery.com' . (strpos($img, '/') === 0 ? $img : '/' . $img);
    }
?>
  <url>
    <loc>https://happymachinery.com/blog/<?= xmlEscape($slug) ?></loc>
    <lastmod><?= $postDate ?></lastmod>
    <changefreq>daily</changefreq>
    <priority>0.90</priority>
    <image:image>
      <image:loc><?= xmlEscape($img) ?></image:loc>
      <image:title><?= xmlEscape($title) ?></image:title>
    </image:image>
  </url>
<?php endforeach; ?>
</urlset>
