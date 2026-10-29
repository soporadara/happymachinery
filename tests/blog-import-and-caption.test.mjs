import test from 'node:test';
import assert from 'node:assert/strict';

// Since the project is built into dist or we can test the helper logic directly
// Let's create tests for the exact regex and parsing logic of blogImportHelper

function isMiniexcavatorUrl(url) {
  if (!url || typeof url !== 'string') return false;
  return /img\.miniexcavator\.org/i.test(url) || /miniexcavator\.org\/.*?\.(webp|png|jpe?g|gif|svg)/i.test(url);
}

function parseImageLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const mdImg = trimmed.match(/^!\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/i);
  if (mdImg && (isMiniexcavatorUrl(mdImg[2]) || /\.(webp|png|jpe?g|gif|svg)/i.test(mdImg[2]))) {
    return { url: mdImg[2].trim(), alt: mdImg[1].trim(), caption: mdImg[1].trim() };
  }

  const mdLink = trimmed.match(/^\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/i);
  if (mdLink && (isMiniexcavatorUrl(mdLink[2]) || /\.(webp|png|jpe?g|gif|svg)/i.test(mdLink[2]))) {
    const text = mdLink[1].trim();
    const isUrlText = text.startsWith('http://') || text.startsWith('https://');
    const label = isUrlText ? '' : text;
    return { url: mdLink[2].trim(), alt: label, caption: label };
  }

  const plainUrl = trimmed.match(/^(https?:\/\/[^\s<>]+\.(?:webp|png|jpe?g|gif|svg)(?:\?[^\s<>]*)?)$/i) ||
                   (isMiniexcavatorUrl(trimmed) ? trimmed.match(/^(https?:\/\/[^\s<>]+)$/i) : null);
  if (plainUrl) {
    return { url: plainUrl[1].trim(), alt: '', caption: '' };
  }

  return null;
}

test('isMiniexcavatorUrl correctly detects img.miniexcavator.org URLs', () => {
  const url = 'https://img.miniexcavator.org/ebay/Blog/class7/1stOct/RollingSpeed-03.webp';
  assert.equal(isMiniexcavatorUrl(url), true);
  assert.equal(isMiniexcavatorUrl('https://example.com/image.png'), false);
});

test('parseImageLine parses markdown link with img.miniexcavator.org', () => {
  const line = '[https://img.miniexcavator.org/ebay/Blog/class7/1stOct/RollingSpeed-03.webp](https://img.miniexcavator.org/ebay/Blog/class7/1stOct/RollingSpeed-03.webp)';
  const parsed = parseImageLine(line);
  assert.ok(parsed);
  assert.equal(parsed.url, 'https://img.miniexcavator.org/ebay/Blog/class7/1stOct/RollingSpeed-03.webp');
});

test('Public blog HTML image parsing extracts src, alt, and caption', () => {
  const line = '<figure class="article-image-figure" data-alignment="center" data-caption="Typhon Fury 15 asphalt road roller performing consistent roller pas"><img src="https://img.miniexcavator.org/ebay/Blog/class7/1stOct/RollingSpeed-03.webp" alt="Typhon Fury 15 asphalt road roller performing consistent roller pas" /><figcaption class="blog-body-image-caption">Typhon Fury 15 asphalt road roller performing consistent roller pas</figcaption></figure>';
  
  const srcMatch = line.match(/src=["']([^"']+)["']/i);
  const altMatch = line.match(/alt=["']([^"']*)["']/i);
  const capMatch = line.match(/<figcaption[^>]*>(.*?)<\/figcaption>/i) || line.match(/data-caption=["']([^"']*)["']/i);

  assert.equal(srcMatch[1], 'https://img.miniexcavator.org/ebay/Blog/class7/1stOct/RollingSpeed-03.webp');
  assert.equal(altMatch[1], 'Typhon Fury 15 asphalt road roller performing consistent roller pas');
  assert.equal(capMatch[1], 'Typhon Fury 15 asphalt road roller performing consistent roller pas');
});

test('Legacy data-caption img tags correctly yield caption for public blog', () => {
  const line = '<img src="https://img.miniexcavator.org/ebay/Blog/class7/1stOct/RollingSpeed-03.webp" alt="Typhon Fury 15" data-caption="Typhon Fury 15 asphalt road roller" data-alignment="center" />';
  
  const srcMatch = line.match(/src=["']([^"']+)["']/i);
  const altMatch = line.match(/alt=["']([^"']*)["']/i);
  const capMatch = line.match(/<figcaption[^>]*>(.*?)<\/figcaption>/i) || line.match(/data-caption=["']([^"']*)["']/i);

  assert.equal(srcMatch[1], 'https://img.miniexcavator.org/ebay/Blog/class7/1stOct/RollingSpeed-03.webp');
  assert.equal(altMatch[1], 'Typhon Fury 15');
  assert.equal(capMatch[1], 'Typhon Fury 15 asphalt road roller');
});

test('Markdown linked image [![Alt](imgUrl)](linkUrl) correctly parsed with href', () => {
  const line = '[![Hydraulic Excavator](https://img.miniexcavator.org/ebay/Blog/class7/1stOct/RollingSpeed-03.webp)](/store/excavators)';
  const mdLinkedImg = line.match(/^\[!\[(.*?)\]\((https?:\/\/[^\s)]+|\/images\/[^\s)]+)\)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)$/i);
  
  assert.ok(mdLinkedImg);
  assert.equal(mdLinkedImg[1], 'Hydraulic Excavator');
  assert.equal(mdLinkedImg[2], 'https://img.miniexcavator.org/ebay/Blog/class7/1stOct/RollingSpeed-03.webp');
  assert.equal(mdLinkedImg[3], '/store/excavators');
});

test('HTML linked image in figure extracts href, caption, and target', () => {
  const line = '<figure class="article-image-figure text-center" data-alignment="center" data-caption="View our machines" data-href="/store"><a href="/store" class="blog-body-image-link"><img src="https://img.miniexcavator.org/ebay/Blog/class7/1stOct/RollingSpeed-03.webp" alt="Machinery" /></a><figcaption class="blog-body-image-caption">View our machines</figcaption></figure>';
  
  const hrefMatch = line.match(/data-href=["']([^"']+)["']/i) || line.match(/<a\s+[^>]*href=["']([^"']+)["']/i);
  const isInternal = hrefMatch[1].startsWith('/') || hrefMatch[1].includes('happymachinery.com');

  assert.equal(hrefMatch[1], '/store');
  assert.equal(isInternal, true);
});

test('External image link is correctly marked with external target and rel', () => {
  const line = '<figure class="article-image-figure" data-href="https://miniexcavator.org/dealers" data-link-target="_blank"><a href="https://miniexcavator.org/dealers" target="_blank" rel="noopener noreferrer"><img src="https://img.miniexcavator.org/ebay/Blog/class7/1stOct/RollingSpeed-03.webp" alt="Dealers" /></a></figure>';
  
  const hrefMatch = line.match(/data-href=["']([^"']+)["']/i);
  const targetMatch = line.match(/data-link-target=["']([^"']+)["']/i);
  const isInternal = hrefMatch[1].startsWith('/') || hrefMatch[1].includes('happymachinery.com');

  assert.equal(hrefMatch[1], 'https://miniexcavator.org/dealers');
  assert.equal(targetMatch[1], '_blank');
  assert.equal(isInternal, false);
});

test('Blog author avatar renders official favicon instead of generic letter icon', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const blogTsx = fs.readFileSync(path.resolve('src/pages/Blog.tsx'), 'utf8');
  const blogCss = fs.readFileSync(path.resolve('src/pages/Blog.css'), 'utf8');

  assert.ok(
    blogTsx.includes('https://lh3.googleusercontent.com/-UDuMZS2bji_GLgC69Z9-vrD4uLHxcqGQIYEHW3O85aWYN4nXhiAMjnQikFFbyOhUnfl'),
    'Blog.tsx author avatar must render official googleusercontent favicon'
  );
  assert.ok(blogTsx.includes('className="raf-author-favicon"'), 'Blog.tsx must assign raf-author-favicon class');
  assert.ok(blogCss.includes('.raf-author-favicon'), 'Blog.css must style raf-author-favicon');
});

test('Blog headings hide # symbol and apply 130px scroll clearance below header', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const blogTsx = fs.readFileSync(path.resolve('src/pages/Blog.tsx'), 'utf8');
  const blogCss = fs.readFileSync(path.resolve('src/pages/Blog.css'), 'utf8');

  // Verify '#' anchor link was removed from JSX
  assert.ok(
    !blogTsx.includes('className="blog-heading-anchor-link"'),
    'Blog.tsx must not render blog-heading-anchor-link with # symbol'
  );
  // Verify heading still assigns id for Table of Contents
  assert.ok(
    blogTsx.includes('id={heading.id}'),
    'Blog.tsx must preserve id={heading.id} for table of contents navigation'
  );
  // Verify CSS scroll-margin-top is set to 130px to clear fixed header
  assert.ok(
    blogCss.includes('scroll-margin-top: 130px;'),
    'Blog.css must set scroll-margin-top to 130px so headings are never obscured by fixed header'
  );
  // Verify JS offset is 130
  assert.ok(
    blogTsx.includes('const headerOffset = 130'),
    'Blog.tsx must use 130 headerOffset for smooth scroll calculation'
  );
});

test('Featured cover image alt description is persisted and restored correctly', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const adminTsx = fs.readFileSync(path.resolve('src/pages/AdminDashboard.tsx'), 'utf8');
  const adminData = fs.readFileSync(path.resolve('src/pages/adminData.ts'), 'utf8');
  const blogTsx = fs.readFileSync(path.resolve('src/pages/Blog.tsx'), 'utf8');

  // Verify BlogPost interface has imageAlt
  assert.ok(adminData.includes('imageAlt?: string'), 'BlogPost interface must support imageAlt');

  // Verify AdminDashboard preserves alt when opening an article for editing
  assert.ok(
    adminTsx.includes('setEditorCoverAlt(post.imageAlt ||'),
    'openEditArticle must populate editorCoverAlt from post.imageAlt'
  );

  // Verify AdminDashboard saves imageAlt when updating/creating an article
  assert.ok(
    adminTsx.includes('imageAlt: editorCoverAlt.trim()'),
    'AdminDashboard must save editorCoverAlt to article payload'
  );

  // Verify Blog.tsx renders imageAlt for hero cover image
  assert.ok(
    blogTsx.includes('selectedPost.imageAlt'),
    'Blog.tsx must render selectedPost.imageAlt on the hero cover image'
  );
});

test('Standalone headings like Drum Surface and Drum Edges are detected as h2 headings and for On This Page', async () => {
  const { isStandaloneHeading, convertContentToHtml, getHeadingMatch } = await import('../src/utils/editorContentHelper.ts');
  const { detectHeadingInBlock } = await import('../src/utils/blogImportHelper.ts');
  const fs = await import('node:fs');
  const path = await import('node:path');
  const blogTsx = fs.readFileSync(path.resolve('src/pages/Blog.tsx'), 'utf8');

  // Verify Blog.tsx uses getHeadingMatch for rendering and table of contents
  assert.ok(blogTsx.includes('getHeadingMatch'), 'Blog.tsx must use getHeadingMatch');

  const heading1 = 'Drum Surface and Drum Edges';
  const heading2 = 'Vibration System Components';

  // 1. isStandaloneHeading tests
  assert.strictEqual(isStandaloneHeading(heading1), true);
  assert.strictEqual(isStandaloneHeading(heading2), true);
  assert.strictEqual(isStandaloneHeading('<p><strong>Drum Surface and Drum Edges</strong></p>'), true);
  assert.strictEqual(isStandaloneHeading('**Vibration System Components**'), true);

  // 2. detectHeadingInBlock tests
  const detected1 = detectHeadingInBlock(heading1);
  assert.ok(detected1 !== null);
  assert.strictEqual(detected1.level, 2);
  assert.strictEqual(detected1.text, heading1);

  const detected2 = detectHeadingInBlock('<p><strong>Vibration System Components</strong></p>');
  assert.ok(detected2 !== null);
  assert.strictEqual(detected2.level, 2);
  assert.strictEqual(detected2.text, heading2);

  // 3. convertContentToHtml converts standalone heading into <h2>
  const rawPasted = `Drum Surface and Drum Edges\nThe drum is the working heart of a road roller...\n\nVibration System Components\nThe vibration system is what gives...`;
  const html = convertContentToHtml(rawPasted);
  assert.ok(html.includes('<h2>Drum Surface and Drum Edges</h2>'), 'Must convert to <h2>Drum Surface and Drum Edges</h2>');
  assert.ok(html.includes('<h2>Vibration System Components</h2>'), 'Must convert to <h2>Vibration System Components</h2>');

  // 4. getHeadingMatch in Blog.tsx extracts heading for On This Page
  const match1 = getHeadingMatch(heading1, 1);
  assert.ok(match1 !== null);
  assert.strictEqual(match1.text, heading1);
  assert.strictEqual(match1.level, 2);

  const matchFromParagraph = getHeadingMatch('<p><strong>Drum Surface and Drum Edges</strong></p>', 1);
  assert.ok(matchFromParagraph !== null);
  assert.strictEqual(matchFromParagraph.text, heading1);
});

test('splitContentIntoBlocks prevents figure truncation and AdminDashboard implements full preview stage', async () => {
  const { splitContentIntoBlocks } = await import('../src/utils/editorContentHelper.ts');
  const fs = await import('node:fs');
  const path = await import('node:path');
  const adminTsx = fs.readFileSync(path.resolve('src/pages/AdminDashboard.tsx'), 'utf8');
  const adminCss = fs.readFileSync(path.resolve('src/pages/AdminDashboard.css'), 'utf8');
  const blogTsx = fs.readFileSync(path.resolve('src/pages/Blog.tsx'), 'utf8');

  // Test multi-block string where figure and text are concatenated without double newlines
  const fusedContent = '<figure class="cms-editor-figure"><img src="https://img.miniexcavator.org/roller.webp" alt="RoadRoller 02" /><figcaption>RoadRoller 02</figcaption></figure><h2>Drum Bearings & Seals</h2><p>Protect the bearing and inspect seals regularly.</p>';
  const blocks = splitContentIntoBlocks(fusedContent);

  assert.strictEqual(blocks.length, 3, 'Must split into 3 distinct blocks (figure, h2, paragraph)');
  assert.ok(blocks[0].includes('RoadRoller 02'));
  assert.ok(blocks[1].includes('Drum Bearings & Seals'));
  assert.ok(blocks[2].includes('Protect the bearing'));

  // Verify AdminDashboard has the full preview stage UI
  assert.ok(adminTsx.includes('cms-full-preview-stage'), 'AdminDashboard must contain cms-full-preview-stage');
  assert.ok(adminTsx.includes('previewDevice'), 'AdminDashboard must support previewDevice switcher state');
  assert.ok(adminTsx.includes('cms-preview-device-switch'), 'AdminDashboard must render desktop/tablet/mobile device switcher');
  assert.ok(adminTsx.includes('cms-preview-btn-back'), 'AdminDashboard must render Back to Editor button');
  assert.ok(adminTsx.includes('splitContentIntoBlocks(editorContent)'), 'AdminDashboard must render all blocks via splitContentIntoBlocks');

  // Verify AdminDashboard.css includes preview stage styles
  assert.ok(adminCss.includes('.cms-full-preview-stage'), 'AdminDashboard.css must style .cms-full-preview-stage');
  assert.ok(adminCss.includes('.cms-preview-frame'), 'AdminDashboard.css must style .cms-preview-frame');
  assert.ok(adminCss.includes('.cms-preview-split-grid'), 'AdminDashboard.css must style .cms-preview-split-grid');
  assert.ok(adminCss.includes('.cms-preview-toc-box'), 'AdminDashboard.css must style .cms-preview-toc-box');

  // Verify Blog.tsx uses splitContentIntoBlocks so public reader also renders all blocks
  assert.ok(blogTsx.includes('splitContentIntoBlocks'), 'Blog.tsx must use splitContentIntoBlocks');
});

test('Collapsed sidebar displays rich flyout sub-menus and clean group dividers', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const adminTsx = fs.readFileSync(path.resolve('src/pages/AdminDashboard.tsx'), 'utf8');
  const adminCss = fs.readFileSync(path.resolve('src/pages/AdminDashboard.css'), 'utf8');

  // Verify AdminDashboard handles collapsedFlyout state and flyout markup
  assert.ok(adminTsx.includes('collapsedFlyout'), 'AdminDashboard must have collapsedFlyout state');
  assert.ok(adminTsx.includes('cms-collapsed-flyout-menu'), 'AdminDashboard must render cms-collapsed-flyout-menu');
  assert.ok(adminTsx.includes('cms-flyout-item'), 'AdminDashboard must render cms-flyout-item for sub-navigation');
  assert.ok(adminTsx.includes('Articles & Content'), 'Articles flyout must display section title');
  assert.ok(adminTsx.includes('Equipment & Products'), 'Products flyout must display section title');

  // Verify AdminDashboard.css contains styles for the flyout dropdowns and clean dividers
  assert.ok(adminCss.includes('.cms-collapsed-flyout-menu'), 'CSS must define .cms-collapsed-flyout-menu');
  assert.ok(adminCss.includes('.cms-flyout-arrow'), 'CSS must define .cms-flyout-arrow');
  assert.ok(adminCss.includes('.cms-flyout-item'), 'CSS must style .cms-flyout-item');
  assert.ok(adminCss.includes('.cms-sidebar.collapsed .cms-nav-group-title'), 'CSS must format group titles as clean dividers in collapsed mode');
});

test('Blog cover images maintain responsive 16:9 landscape aspect ratio across reader and CMS', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const blogCss = fs.readFileSync(path.resolve('src/pages/Blog.css'), 'utf8');
  const adminCss = fs.readFileSync(path.resolve('src/pages/AdminDashboard.css'), 'utf8');
  const adminTsx = fs.readFileSync(path.resolve('src/pages/AdminDashboard.tsx'), 'utf8');

  // Verify Blog.css enforces 16:9 landscape ratio and object-fit cover
  assert.ok(blogCss.includes('aspect-ratio: 16 / 9'), 'Blog.css must enforce 16 / 9 aspect ratio on hero image box');
  assert.ok(blogCss.includes('.raf-hero-image-box'), 'Blog.css must style .raf-hero-image-box');
  assert.ok(blogCss.includes('.raf-hero-image'), 'Blog.css must style .raf-hero-image');
  assert.ok(blogCss.includes('object-fit: cover'), 'Blog.css must style .raf-hero-image with object-fit: cover');
  assert.ok(blogCss.includes('object-position: center'), 'Blog.css must center hero image');

  // Verify desktop article container is comfortably bounded to 1400px (prevents 1500px+ ballooning)
  assert.ok(blogCss.includes('max-width: 1400px'), 'Blog.css must bound desktop article container to 1400px');

  // Verify AdminDashboard.css styles preview stage with 16:9 landscape
  assert.ok(adminCss.includes('.cms-preview-paper .raf-hero-image-box'), 'AdminDashboard.css must style preview hero image box');
  assert.ok(adminCss.includes('.cms-cover-preview-wrapper'), 'AdminDashboard.css must style cover preview thumbnail');

  // Verify AdminDashboard.tsx preview stage uses 16 / 9 aspect ratio
  assert.ok(adminTsx.includes("aspectRatio: '16 / 9'"), 'AdminDashboard.tsx preview must use 16 / 9 aspect ratio');
});

test('All blog posts contain filled seoTitle, metaDescription, imageAlt, and excerpt', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const adminDataTs = fs.readFileSync(path.resolve('src/pages/adminData.ts'), 'utf8');
  const contentJson = JSON.parse(fs.readFileSync(path.resolve('happy-machinery-storage/content.json'), 'utf8'));
  const blogTsx = fs.readFileSync(path.resolve('src/pages/Blog.tsx'), 'utf8');
  const adminTsx = fs.readFileSync(path.resolve('src/pages/AdminDashboard.tsx'), 'utf8');
  const sharePreviewPhp = fs.readFileSync(path.resolve('public/share_preview.php'), 'utf8');

  // Verify Blog.tsx and share_preview.php read dynamic seoTitle & metaDescription
  assert.ok(blogTsx.includes('selectedPost as any).seoTitle'), 'Blog.tsx must read seoTitle dynamically');
  assert.ok(blogTsx.includes('selectedPost as any).metaDescription'), 'Blog.tsx must read metaDescription dynamically');
  assert.ok(sharePreviewPhp.includes("$post['seoTitle']"), 'share_preview.php must support seoTitle');
  assert.ok(sharePreviewPhp.includes("$post['metaDescription']"), 'share_preview.php must support metaDescription');

  // Verify AdminDashboard persists seoTitle and metaDescription
  assert.ok(adminTsx.includes('seoTitle: editorSeoTitle.trim()'), 'AdminDashboard must save seoTitle');
  assert.ok(adminTsx.includes('metaDescription: editorSeoDesc.trim()'), 'AdminDashboard must save metaDescription');
  assert.ok(adminTsx.includes('setEditorSeoTitle((post as any).seoTitle || post.title)'), 'AdminDashboard must populate seoTitle in editor');

  // Verify all posts in content.json have filled SEO fields
  const posts = contentJson['blog-posts'] || [];
  assert.ok(posts.length > 0, 'content.json must contain blog posts');

  for (const post of posts) {
    assert.ok(post.seoTitle && post.seoTitle.length > 10, `Post #${post.id} must have non-empty seoTitle`);
    assert.ok(post.metaDescription && post.metaDescription.length > 30, `Post #${post.id} must have non-empty metaDescription`);
    assert.ok(post.imageAlt && post.imageAlt.length > 5, `Post #${post.id} must have non-empty imageAlt`);
    assert.ok(post.excerpt && post.excerpt.length > 20, `Post #${post.id} must have non-empty excerpt`);
    assert.ok(post.slug && post.slug !== 'None', `Post #${post.id} must have valid slug`);
  }

  // Verify adminData.ts DEFAULT_POSTS has seoTitle, metaDescription, and imageAlt
  assert.ok(adminDataTs.includes('seoTitle?: string'), 'adminData.ts BlogPost interface must declare seoTitle');
  assert.ok(adminDataTs.includes('metaDescription?: string'), 'adminData.ts BlogPost interface must declare metaDescription');
  assert.ok(adminDataTs.includes('Maximizing Skid Steer Efficiency & Safety | Happy Machinery'), 'adminData.ts must include default seoTitle');
});

test('Blog article reader has large scroll screen, independent primary scroll column, header clearance, and smooth native scrolling', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const blogCss = fs.readFileSync(path.resolve('src/pages/Blog.css'), 'utf8');
  const blogTsx = fs.readFileSync(path.resolve('src/pages/Blog.tsx'), 'utf8');

  // 1. Verify desktop primary column has independent scroll and max-height
  assert.ok(
    blogCss.includes('max-height: calc(100vh - 140px);'),
    'Blog.css must give desktop columns max-height for large viewport scrollability'
  );
  assert.ok(
    blogCss.includes('overflow-y: auto;'),
    'Blog.css must enable overflow-y: auto on columns'
  );
  assert.ok(
    blogCss.includes('padding-top: 116px;'),
    'Blog.css must give >=116px top clearance so header never overlaps breadcrumbs'
  );

  // 2. Verify large container utilizes wide displays
  assert.ok(
    blogCss.includes('.raf-article-view-wrapper .raf-article-container {\n    max-width: 100%;'),
    'Blog.css must allow article container to fill large screens'
  );

  // 3. Verify no jittery wheel hijacking in Blog.tsx
  assert.ok(
    !blogTsx.includes('handleDualColumnWheel'),
    'Blog.tsx must not hijack onWheel with handleDualColumnWheel to ensure smooth native trackpad scroll'
  );
});

test('First image as link is always detected as cover image even without full blog headings', async () => {
  const { processPastedBlog, isImageUrl } = await import('../src/utils/blogImportHelper.ts');

  // Test 1: Unsplash image link
  const unsplashUrl = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800';
  assert.ok(isImageUrl(unsplashUrl), 'isImageUrl must detect unsplash.com URLs');

  // Test 2: Text containing image link without # heading or table
  const pastedText = `Check out our new equipment fleet:\n${unsplashUrl}\nThis machine operates at high efficiency.`;
  const res = processPastedBlog(pastedText);

  assert.strictEqual(res.detected, true, 'Must detect as content import');
  assert.ok(res.coverImage, 'coverImage must ALWAYS be populated from the first image');
  assert.strictEqual(res.coverImage.url, unsplashUrl);

  // Test 3: Markdown image without heading
  const mdSnippet = `![Heavy Duty Excavator](https://img.miniexcavator.org/t18.webp)\nPowerful Kubota engine.`;
  const res2 = processPastedBlog(mdSnippet);
  assert.ok(res2.coverImage, 'coverImage must be extracted from markdown image');
  assert.strictEqual(res2.coverImage.url, 'https://img.miniexcavator.org/t18.webp');
});

test('YouTube links auto-convert to responsive video embeds across any paragraph or section', async () => {
  const { getYoutubeVideoId } = await import('../src/utils/blogImportHelper.ts');
  const { convertContentToHtml } = await import('../src/utils/editorContentHelper.ts');
  const { processPastedBlog } = await import('../src/utils/blogImportHelper.ts');

  // 1. Test YouTube video ID extraction from all URL shapes
  assert.strictEqual(getYoutubeVideoId('https://www.youtube.com/watch?v=eqOfmtTJD1A'), 'eqOfmtTJD1A');
  assert.strictEqual(getYoutubeVideoId('https://youtu.be/eqOfmtTJD1A'), 'eqOfmtTJD1A');
  assert.strictEqual(getYoutubeVideoId('https://www.youtube.com/shorts/eqOfmtTJD1A'), 'eqOfmtTJD1A');
  assert.strictEqual(getYoutubeVideoId('[Watch Video](https://www.youtube.com/watch?v=eqOfmtTJD1A)'), 'eqOfmtTJD1A');

  // 2. Test convertContentToHtml auto-converts YouTube link in paragraph
  const textWithYoutube = 'Here is the demonstration:\nhttps://www.youtube.com/watch?v=eqOfmtTJD1A\nEnd of section.';
  const html = convertContentToHtml(textWithYoutube);

  assert.ok(html.includes('data-youtube-video=""'), 'Must contain data-youtube-video wrapper');
  assert.ok(html.includes('https://www.youtube-nocookie.com/embed/eqOfmtTJD1A'), 'Must embed iframe with video ID');
  assert.ok(html.includes('article-youtube-iframe'), 'Must have article-youtube-iframe class');

  // 3. Test processPastedBlog auto-converts YouTube link
  const blogWithVideo = '# Video Showcase\nWatch our machine in action:\nhttps://youtu.be/eqOfmtTJD1A\nGreat jobsite reliability.';
  const blogRes = processPastedBlog(blogWithVideo);
  assert.ok(blogRes.cleanedHtml.includes('data-youtube-video=""'), 'processPastedBlog must convert YouTube link into video embed');
  assert.ok(blogRes.cleanedHtml.includes('embed/eqOfmtTJD1A'), 'Must have embed URL');
});

test('extractFirstImageFromArticle accurately extracts first image link from any format', async () => {
  const { extractFirstImageFromArticle, isImageUrl, hasImageLink } = await import('../src/utils/blogImportHelper.ts');
  const fs = await import('node:fs');
  const path = await import('node:path');
  const adminTsx = fs.readFileSync(path.resolve('src/pages/AdminDashboard.tsx'), 'utf8');

  // 1. Plain Unsplash URL
  const unsplash = 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=1200';
  const res1 = extractFirstImageFromArticle(`Check out this machinery:\n${unsplash}\nWorks efficiently.`);
  assert.ok(res1, 'Must extract plain image URL');
  assert.strictEqual(res1.url, unsplash);

  // 2. Markdown image
  const mdImg = '![Heavy Excavator](https://img.miniexcavator.org/excavator-v900.webp)';
  const res2 = extractFirstImageFromArticle(`Some intro text\n\n${mdImg}\n\nConclusion.`);
  assert.ok(res2, 'Must extract markdown image');
  assert.strictEqual(res2.url, 'https://img.miniexcavator.org/excavator-v900.webp');
  assert.strictEqual(res2.alt, 'Heavy Excavator');

  // 3. Markdown linked image [![Alt](imgUrl)](linkUrl)
  const mdLinked = '[![Typhon Matador](https://img.miniexcavator.org/matador.webp)](https://happymachinery.com/product/matador)';
  const res3 = extractFirstImageFromArticle(`Overview paragraph\n${mdLinked}\nFeatures.`);
  assert.ok(res3, 'Must extract markdown linked image');
  assert.strictEqual(res3.url, 'https://img.miniexcavator.org/matador.webp');
  assert.strictEqual(res3.alt, 'Typhon Matador');
  assert.strictEqual(res3.href, 'https://happymachinery.com/product/matador');

  // 4. HTML <figure> and <img>
  const htmlImg = '<p>Intro</p><figure class="article-image-figure"><img src="/images/why-choose-v900-jobsite.png" alt="Jobsite Excavator" /><figcaption>Jobsite Excavator</figcaption></figure>';
  const res4 = extractFirstImageFromArticle(htmlImg);
  assert.ok(res4, 'Must extract HTML figure image');
  assert.strictEqual(res4.url, '/images/why-choose-v900-jobsite.png');
  assert.strictEqual(res4.alt, 'Jobsite Excavator');

  // 5. Earliest appearing image is strictly chosen
  const multiImages = `
    Introduction section with no images.
    Here is our primary machine:
    ![First Image](https://img.miniexcavator.org/first.webp)
    And here is our secondary machine:
    https://images.unsplash.com/photo-second-123.jpg
  `;
  const res5 = extractFirstImageFromArticle(multiImages);
  assert.ok(res5);
  assert.strictEqual(res5.url, 'https://img.miniexcavator.org/first.webp');
  assert.strictEqual(res5.alt, 'First Image');

  // 6. Verify hasImageLink helper
  assert.strictEqual(hasImageLink('Just plain text without images'), false);
  assert.strictEqual(hasImageLink('Text with https://img.miniexcavator.org/test.webp inside'), true);

  // 7. Verify AdminDashboard wires reactive auto-detection and Auto-detect button
  assert.ok(adminTsx.includes('extractFirstImageFromArticle(editorContent)'), 'AdminDashboard must use extractFirstImageFromArticle');
  assert.ok(adminTsx.includes('cms-cover-autodetect-btn'), 'AdminDashboard must have Auto-detect button');
  assert.ok(adminTsx.includes('Auto-insert 1st image'), 'AdminDashboard must have Auto-insert 1st image action');
  assert.ok(adminTsx.includes('userExplicitlyClearedCoverRef'), 'AdminDashboard must track manual clear state');
});

test('YouTube video embed ID works with youtube-nocookie and Google Docs image imports seamlessly', async () => {
  const { getYoutubeVideoId, parseImageLine, processPastedBlog } = await import('../src/utils/blogImportHelper.ts');

  // 1. YouTube nocookie embed parsing
  assert.strictEqual(
    getYoutubeVideoId('https://www.youtube-nocookie.com/embed/eqOfmtTJD1A?rel=0&modestbranding=1'),
    'eqOfmtTJD1A',
    'Must parse video ID from youtube-nocookie.com embed with query params'
  );
  assert.strictEqual(
    getYoutubeVideoId('https://youtube-nocookie.com/embed/eqOfmtTJD1A'),
    'eqOfmtTJD1A'
  );
  assert.strictEqual(
    getYoutubeVideoId('https://m.youtube.com/watch?v=eqOfmtTJD1A'),
    'eqOfmtTJD1A'
  );
  assert.strictEqual(
    getYoutubeVideoId('eqOfmtTJD1A'),
    'eqOfmtTJD1A'
  );

  // 2. Google Docs HTML copied image line with nested spans and an anchor
  const gdocsHtml = '<p class="c1"><span class="c2"><a class="c3" href="https://img.miniexcavator.org/ebay/Website%20upload/Typhon%20Matador%20V900%20(7).webp">HEAVY COMPACT EXCAVATORS GUIDE: 2.7-TON TO 4-TON CLASS</a></span></p>';
  const parsedImg = parseImageLine(gdocsHtml);
  assert.ok(parsedImg, 'parseImageLine must parse Google Docs nested link');
  assert.strictEqual(parsedImg.url, 'https://img.miniexcavator.org/ebay/Website%20upload/Typhon%20Matador%20V900%20(7).webp');
  assert.strictEqual(parsedImg.alt, 'HEAVY COMPACT EXCAVATORS GUIDE: 2.7-TON TO 4-TON CLASS');

  // 3. Full article copied from Google Docs with Title, Image, Paragraph, and YouTube link
  const fullArticle = `
    <p class="title"><span>The Downtime Cost Equation</span></p>
    <p class="c1"><span class="c2"><a class="c3" href="https://img.miniexcavator.org/ebay/Website%20upload/Typhon%20Matador%20V900%20(7).webp">HEAVY COMPACT EXCAVATORS GUIDE: 2.7-TON TO 4-TON CLASS</a></span></p>
    <p class="body"><span>Compact excavators in the 2.7-ton to 4-ton class represent the sweet spot for utility contractors, landscapers, and residential excavators.</span></p>
    <p class="video"><span>https://www.youtube.com/watch?v=eqOfmtTJD1A</span></p>
    <p class="conclusion"><span>From a fleet management perspective, protected engineering is a total cost of ownership win.</span></p>
  `;

  const res = processPastedBlog(fullArticle);
  assert.strictEqual(res.detected, true);
  assert.ok(res.coverImage, 'Must detect cover image');
  assert.strictEqual(res.coverImage.url, 'https://img.miniexcavator.org/ebay/Website%20upload/Typhon%20Matador%20V900%20(7).webp');
  assert.strictEqual(res.coverImage.alt, 'HEAVY COMPACT EXCAVATORS GUIDE: 2.7-TON TO 4-TON CLASS');

  // Cover image must NOT be duplicated in the body
  assert.ok(!res.cleanedHtml.includes('<h2>HEAVY COMPACT EXCAVATORS GUIDE'), 'Cover image must not be converted to h2 or duplicated in body');
  
  // First body paragraph must be preserved and NOT swallowed as caption
  assert.ok(res.cleanedHtml.includes('Compact excavators in the 2.7-ton to 4-ton class represent the sweet spot'), 'First body paragraph must be preserved');

  // YouTube video must be converted to playable embed
  assert.ok(res.cleanedHtml.includes('data-youtube-video=""'), 'Must contain YouTube embed wrapper');
  assert.ok(res.cleanedHtml.includes('embed/eqOfmtTJD1A'), 'Must have YouTube embed src');
});



