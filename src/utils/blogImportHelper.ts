/**
 * Happy Machinery — Blog Import & Miniexcavator Image Auto-Detection Helper
 * 
 * Auto-detects blog content pasted with links from img.miniexcavator.org (and general image URLs),
 * extracts Article Title, sets Featured Cover Image, converts images into rich editor figures
 * with captions and SEO alt tags, and registers them in the Media Library gallery.
 */

import { cleanHtmlTable, isTsvTable, convertTsvToTableHtml, isMarkdownTable, convertMarkdownTableToHtml } from './tablePasteHelper.ts';

export interface DetectedImage {
  url: string;
  alt: string;
  caption: string;
  href?: string;
}

export interface ProcessedBlogResult {
  detected: boolean;
  hasMiniexcavatorLinks: boolean;
  isFullBlogImport: boolean;
  title?: string;
  coverImage?: {
    url: string;
    alt: string;
    href?: string;
  };
  remainingImages: DetectedImage[];
  allImages: DetectedImage[];
  cleanedHtml: string;
}

/**
 * Check if a URL belongs to img.miniexcavator.org or related subdomain
 */
export function isMiniexcavatorUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return /img\.miniexcavator\.org/i.test(url) || /miniexcavator\.org\/.*?\.(webp|png|jpe?g|gif|svg)/i.test(url);
}

/**
 * Check if a string is an image URL (including webp, png, jpg, miniexcavator, unsplash, cdn, uploads, etc.)
 */
export function isImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (isMiniexcavatorUrl(trimmed)) return true;
  if (/^data:image\//i.test(trimmed)) return true;
  if (/\.(webp|png|jpe?g|gif|svg|avif|bmp|ico)(\?.*)?$/i.test(trimmed)) return true;
  if (/images\.unsplash\.com/i.test(trimmed)) return true;
  if (/googleusercontent\.com/i.test(trimmed)) return true;
  if (/cloudinary\.com/i.test(trimmed)) return true;
  if (/imgur\.com/i.test(trimmed)) return true;
  if (/blob\.core\.windows\.net/i.test(trimmed)) return true;
  if (/images\.pexels\.com/i.test(trimmed)) return true;
  if (/cdn\.pixabay\.com/i.test(trimmed)) return true;
  if (/upload\.wikimedia\.org/i.test(trimmed)) return true;
  if (/wp-content\/uploads/i.test(trimmed)) return true;
  if (/(?:\/|^)(?:images|storage|media|uploads|assets)\/.*\.(webp|png|jpe?g|gif|svg|avif)/i.test(trimmed)) return true;
  if (/https?:\/\/[^\s<>]+\/(?:[^\s<>]+\/)*(?:image|photo|picture|upload|gallery|media)[^\s<>]*/i.test(trimmed)) return true;
  return false;
}

export interface ExtractedImageInfo {
  url: string;
  alt: string;
  caption?: string;
  href?: string;
}

/**
 * Extract the first image link found anywhere in an article (Markdown, HTML, or raw image link)
 * Guaranteed to find the earliest appearing image link in the content.
 */
export function extractFirstImageFromArticle(content: string): ExtractedImageInfo | null {
  if (!content || typeof content !== 'string') return null;
  const trimmed = content.trim();
  if (!trimmed) return null;

  interface FoundCandidate {
    url: string;
    alt: string;
    caption?: string;
    href?: string;
    index: number;
  }

  const candidates: FoundCandidate[] = [];

  // 1. HTML <figure> with <img src="...">
  const figureRegex = /<figure[\s>][\s\S]*?<img\s+[^>]*src=["']([^"']+)["'][^>]*>[\s\S]*?<\/figure>/gi;
  for (const match of trimmed.matchAll(figureRegex)) {
    const fullFig = match[0];
    const src = match[1]?.trim();
    if (src && isImageUrl(src)) {
      const altMatch = fullFig.match(/alt=["']([^"']*)["']/i);
      const capMatch = fullFig.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i) || fullFig.match(/data-caption=["']([^"']*)["']/i);
      const hrefMatch = fullFig.match(/href=["']([^"']+)["']/i) || fullFig.match(/data-href=["']([^"']+)["']/i);
      const alt = altMatch ? altMatch[1].trim() : '';
      const cap = capMatch ? capMatch[1].replace(/<[^>]+>/g, '').trim() : '';
      candidates.push({
        url: src,
        alt: alt || cap || cleanImageTitle(src),
        caption: cap || alt,
        href: hrefMatch ? hrefMatch[1].trim() : undefined,
        index: match.index ?? 0,
      });
    }
  }

  // 2. HTML <img> tags (including inside <p>, <a>, etc.)
  const imgTagRegex = /<img\s+([^>]*?)>/gi;
  for (const match of trimmed.matchAll(imgTagRegex)) {
    const attrs = match[1];
    const srcMatch = attrs.match(/src=["']([^"']+)["']/i);
    const src = srcMatch ? srcMatch[1].trim() : '';
    if (src && isImageUrl(src)) {
      const altMatch = attrs.match(/alt=["']([^"']*)["']/i);
      const capMatch = attrs.match(/data-caption=["']([^"']*)["']/i);
      const hrefMatch = attrs.match(/data-href=["']([^"']+)["']/i);
      const alt = altMatch ? altMatch[1].trim() : '';
      const cap = capMatch ? capMatch[1].trim() : '';
      candidates.push({
        url: src,
        alt: alt || cap || cleanImageTitle(src),
        caption: cap || alt,
        href: hrefMatch ? hrefMatch[1].trim() : undefined,
        index: match.index ?? 0,
      });
    }
  }

  // 3. Markdown linked image: [![Alt](imgUrl)](linkUrl)
  const mdLinkedRegex = /\[!\[(.*?)\]\(([^\s)]+)\)\]\(([^\s)]+)\)/g;
  for (const match of trimmed.matchAll(mdLinkedRegex)) {
    const alt = match[1].trim();
    const imgUrl = match[2].trim();
    const linkUrl = match[3].trim();
    if (isImageUrl(imgUrl)) {
      candidates.push({
        url: imgUrl,
        alt: alt || cleanImageTitle(imgUrl),
        caption: alt,
        href: linkUrl,
        index: match.index ?? 0,
      });
    }
  }

  // 4. Markdown standard image: ![Alt](imgUrl)
  const mdImgRegex = /!\[(.*?)\]\(([^\s)]+)\)/g;
  for (const match of trimmed.matchAll(mdImgRegex)) {
    const alt = match[1].trim();
    const imgUrl = match[2].trim();
    if (isImageUrl(imgUrl)) {
      candidates.push({
        url: imgUrl,
        alt: alt || cleanImageTitle(imgUrl),
        caption: alt,
        index: match.index ?? 0,
      });
    }
  }

  // 5. HTML <a> tag pointing to an image link: <a href="imgUrl">...</a>
  const aLinkRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of trimmed.matchAll(aLinkRegex)) {
    const href = match[1].trim();
    if (isImageUrl(href)) {
      const text = match[2].replace(/<[^>]+>/g, '').trim();
      const isUrlText = text.startsWith('http://') || text.startsWith('https://');
      const label = isUrlText ? '' : text;
      candidates.push({
        url: href,
        alt: label || cleanImageTitle(href),
        caption: label,
        href,
        index: match.index ?? 0,
      });
    }
  }

  // 6. Markdown link where URL is an image link: [text](imgUrl)
  const mdLinkRegex = /\[(.*?)\]\(([^\s)]+)\)/g;
  for (const match of trimmed.matchAll(mdLinkRegex)) {
    const text = match[1].trim();
    const imgUrl = match[2].trim();
    if (isImageUrl(imgUrl)) {
      const isUrlText = text.startsWith('http://') || text.startsWith('https://');
      const label = isUrlText ? '' : text;
      candidates.push({
        url: imgUrl,
        alt: label || cleanImageTitle(imgUrl),
        caption: label,
        index: match.index ?? 0,
      });
    }
  }

  // 7. Standalone or in-line URLs that are image links
  const urlRegex = /(?:https?:\/\/[^\s<>"')]+|\/(?:images|storage|media|uploads|assets)\/[^\s<>"')]+)/gi;
  for (const match of trimmed.matchAll(urlRegex)) {
    const rawUrl = match[0].replace(/[.,;:)]+$/, '');
    if (isImageUrl(rawUrl)) {
      candidates.push({
        url: rawUrl,
        alt: cleanImageTitle(rawUrl),
        index: match.index ?? 0,
      });
    }
  }

  if (candidates.length === 0) return null;

  // Sort by appearance index so the earliest image link in the content is selected
  candidates.sort((a, b) => a.index - b.index);

  const best = candidates[0];
  return {
    url: best.url,
    alt: best.alt,
    caption: best.caption,
    href: best.href,
  };
}

/**
 * Check if article content has any image link
 */
export function hasImageLink(content: string): boolean {
  return extractFirstImageFromArticle(content) !== null;
}

/**
 * Extract 11-character video ID from YouTube watch, share, embed, shorts, or markdown/HTML link
 */
export function getYoutubeVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  let target = trimmed;
  const mdMatch = trimmed.match(/^\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/i);
  if (mdMatch) target = mdMatch[2];
  const aMatch = trimmed.match(/^<a\s+[^>]*href=["'](https?:\/\/[^"']+)["']/i);
  if (aMatch) target = aMatch[1];
  const iframeMatch = trimmed.match(/<iframe\s+[^>]*src=["'](https?:\/\/[^"']+)["']/i);
  if (iframeMatch) target = iframeMatch[1];

  const match = target.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
  return match ? match[1] : null;
}

/**
 * Clean title text of markdown symbols, HTML tags, and trailing colons
 */
export function cleanTitleText(text: string): string {
  if (!text) return '';
  return text
    .replace(/^#+\s*/, '')
    .replace(/^<h[1-6][^>]*>(.*?)<\/h[1-6]>$/i, '$1')
    .replace(/^title:\s*/i, '')
    .replace(/^h[1-6]:\s*/i, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .trim();
}

/**
 * Clean filename into a legible equipment asset title
 */
export function cleanImageTitle(url: string): string {
  try {
    const filename = url.split('/').pop()?.split('?')[0] || '';
    const withoutExt = filename.replace(/\.[^/.]+$/, '');
    const readable = withoutExt.replace(/[-_]+/g, ' ').trim();
    if (readable.length > 2) {
      // Capitalize words
      return readable.replace(/\b\w/g, (c) => c.toUpperCase());
    }
  } catch {}
  return 'Machinery Media Asset';
}

/**
 * Escape HTML special chars
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Check if a text line is a standalone section heading
 */
export function isStandaloneHeading(line: string): boolean {
  if (!line || typeof line !== 'string') return false;
  if (line.includes('\t')) return false;
  if (/^<(?:\/)?(?:table|thead|tbody|tr|th|td)/i.test(line.trim())) return false;
  if (line.trim().startsWith('|')) return false;

  const clean = line
    .trim()
    .replace(/^<p(?:\s+[^>]*)?>\s*/i, '')
    .replace(/\s*<\/p>$/i, '')
    .replace(/^<(?:strong|b)(?:\s+[^>]*)?>\s*/i, '')
    .replace(/\s*<\/(?:strong|b)>$/i, '')
    .replace(/^\*\*|^\__|^\*|^\_/, '')
    .replace(/\*\*$|\__$|\*$|\_$/, '')
    .replace(/<[^>]+>/g, '')
    .trim();

  if (clean.length < 3 || clean.length > 95) return false;
  if (clean.includes('\n')) return false;

  // Reject links, lists, blockquotes, images
  if (/^(https?:|\[|!|-|•|\||>)/i.test(clean)) return false;

  // Reject callout prefixes
  if (/^(key takeaway|note:|warning:|caution:|tip:|pro tip:)/i.test(clean)) return false;

  // Reject trailing colons, semicolons, commas
  if (/[:;,]$/.test(clean)) return false;

  // Reject sentences ending in period UNLESS it is numbered like "1. Title"
  if (/\.$/.test(clean) && !/^\d+\./.test(clean)) return false;

  // Must start with capital letter, number, or quotation
  if (!/^[A-Z0-9"']/.test(clean)) return false;

  // If it's a long sentence of more than 14 words, treat as paragraph
  if (clean.split(/\s+/).length > 14) return false;

  return true;
}

/**
 * Detect if a raw block is a heading (markdown, html, numbered, or standalone)
 */
export function detectHeadingInBlock(block: string): { level: number; text: string } | null {
  const trimmed = block.trim();
  if (!trimmed) return null;
  if (trimmed.includes('\t') || (trimmed.startsWith('|') && trimmed.includes('|')) || /^<(?:\/)?(?:table|thead|tbody|tr|th|td)/i.test(trimmed)) {
    return null;
  }

  // 1. Markdown headings: #, ##, ###, ####
  const mdHead = trimmed.match(/^(#{1,6})\s+(.+)$/);
  if (mdHead) {
    const lvl = mdHead[1].length === 1 ? 2 : mdHead[1].length;
    return { level: lvl, text: cleanTitleText(mdHead[2]) };
  }

  // 2. Prefix markers: h1: ..., h2: ..., h3: ...
  const prefix = trimmed.match(/^h([1-6]):\s+(.+)$/i);
  if (prefix) {
    return { level: parseInt(prefix[1], 10), text: cleanTitleText(prefix[2]) };
  }

  // 3. HTML headings: <h1>...</h1> through <h6>...</h6>
  const htmlHead = trimmed.match(/^<h([1-6])(?:\s+[^>]*)?>(.*?)<\/h\1>$/i);
  if (htmlHead) {
    return { level: parseInt(htmlHead[1], 10), text: cleanTitleText(htmlHead[2]) };
  }

  // Strip wrapping tags like <p>, <strong>, <b>, <span>, or markdown **
  const stripped = trimmed
    .replace(/^<p(?:\s+[^>]*)?>\s*/i, '')
    .replace(/\s*<\/p>$/i, '')
    .replace(/^<(?:strong|b)(?:\s+[^>]*)?>\s*/i, '')
    .replace(/\s*<\/(?:strong|b)>$/i, '')
    .replace(/^\*\*|^\__|^\*|^\_/, '')
    .replace(/\*\*$|\__$|\*$|\_$/, '')
    .replace(/<[^>]+>/g, '')
    .trim();

  // 4. Numbered FAQ questions: "1. What is..." or "2. Why does..."
  if (/^\d+\.\s+[A-Z].*\?$/.test(stripped)) {
    return { level: 3, text: cleanTitleText(stripped) };
  }

  // 5. Numbered sections: "1. Drum Surface and Drum Edges" or "1. Understand Heaped..."
  if (/^\d+\.\s+[A-Z]/.test(stripped) && stripped.length <= 100 && !stripped.includes('\n')) {
    return { level: 2, text: cleanTitleText(stripped) };
  }

  // 6. Standalone section titles: "Drum Surface and Drum Edges", "Vibration System Components", etc.
  if (isStandaloneHeading(stripped)) {
    return { level: 2, text: cleanTitleText(stripped) };
  }

  return null;
}

/**
 * Detect and extract single image link pattern in a line:
 * - [![Alt](imgUrl)](linkUrl) - Linked Image
 * - [https://img.miniexcavator.org/...](https://img.miniexcavator.org/...)
 * - [Caption / Alt](https://img.miniexcavator.org/...)
 * - ![Caption / Alt](https://img.miniexcavator.org/...)
 * - <a href="linkUrl"><img src="imgUrl" ... /></a>
 * - <img src="..." />
 * - Plain https://img.miniexcavator.org/...
 */
export function parseImageLine(line: string): { url: string; alt: string; caption: string; href?: string } | null {
  if (!line || typeof line !== 'string') return null;
  let trimmed = line.trim();
  if (!trimmed) return null;

  // Strip wrapping <p> or <div> tag if it wraps an image or link
  trimmed = trimmed.replace(/^<(?:p|div)(?:\s+[^>]*)?>\s*/i, '').replace(/\s*<\/(?:p|div)>$/i, '').trim();
  if (!trimmed) return null;

  // 0. HTML <figure> tag: <figure><img src="..." alt="..."><figcaption>...</figcaption></figure>
  if (/<figure[\s>]/i.test(trimmed) && /<img[\s>]/i.test(trimmed)) {
    const srcMatch = trimmed.match(/<img\s+[^>]*src=["'](https?:\/\/[^"']+)["']/i);
    if (srcMatch && (isMiniexcavatorUrl(srcMatch[1]) || isImageUrl(srcMatch[1]))) {
      const altMatch = trimmed.match(/<img\s+[^>]*alt=["']([^"']*)["']/i);
      const capMatch = trimmed.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/i);
      const alt = altMatch ? altMatch[1].trim() : '';
      const caption = capMatch ? capMatch[1].replace(/<[^>]+>/g, '').trim() : '';
      return {
        url: srcMatch[1].trim(),
        alt: alt || caption || cleanImageTitle(srcMatch[1]),
        caption: caption || alt,
      };
    }
  }

  // 1. Markdown Linked Image: [![Alt](imgUrl)](linkUrl)
  const mdLinkedImg = trimmed.match(/^\[!\[(.*?)\]\((https?:\/\/[^\s)]+|\/images\/[^\s)]+)\)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)$/i);
  if (mdLinkedImg) {
    const text = mdLinkedImg[1].trim();
    return {
      url: mdLinkedImg[2].trim(),
      alt: text || cleanImageTitle(mdLinkedImg[2]),
      caption: text,
      href: mdLinkedImg[3].trim(),
    };
  }

  // 2. Markdown image: ![Alt](url)
  const mdImg = trimmed.match(/^!\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/i);
  if (mdImg && (isMiniexcavatorUrl(mdImg[2]) || isImageUrl(mdImg[2]))) {
    const text = mdImg[1].trim();
    return {
      url: mdImg[2].trim(),
      alt: text || cleanImageTitle(mdImg[2]),
      caption: text,
    };
  }

  // 3. Markdown link: [text](url) - common in copied blog drafts
  const mdLink = trimmed.match(/^\[(.*?)\]\((https?:\/\/[^\s)]+)\)$/i);
  if (mdLink && (isMiniexcavatorUrl(mdLink[2]) || isImageUrl(mdLink[2]))) {
    const text = mdLink[1].trim();
    const isUrlText = text.startsWith('http://') || text.startsWith('https://');
    const label = isUrlText ? '' : text;
    return {
      url: mdLink[2].trim(),
      alt: label || cleanImageTitle(mdLink[2]),
      caption: label,
    };
  }

  // 4. HTML linked image: <a href="linkUrl"><img src="imgUrl" alt="alt" data-caption="caption" /></a>
  const htmlLinkedImg = trimmed.match(/^<a\s+[^>]*href=["'](https?:\/\/[^"']+|\/[^"']+)["'][^>]*>[\s\S]*?<img\s+[^>]*src=["'](https?:\/\/[^"']+)["'][^>]*>[\s\S]*?<\/a>$/i);
  if (htmlLinkedImg) {
    const href = htmlLinkedImg[1].trim();
    const url = htmlLinkedImg[2].trim();
    const altMatch = trimmed.match(/alt=["']([^"']*)["']/i);
    const capMatch = trimmed.match(/data-caption=["']([^"']*)["']/i);
    const alt = altMatch ? altMatch[1].trim() : '';
    const caption = capMatch ? capMatch[1].trim() : '';
    return {
      url,
      alt: alt || caption || cleanImageTitle(url),
      caption: caption || alt,
      href,
    };
  }

  // 5. HTML <a> tag: <a href="url">text</a>
  const htmlLink = trimmed.match(/^<a\s+[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>(.*?)<\/a>$/i);
  if (htmlLink && (isMiniexcavatorUrl(htmlLink[1]) || isImageUrl(htmlLink[1]))) {
    const text = htmlLink[2].replace(/<[^>]+>/g, '').trim();
    const isUrlText = text.startsWith('http://') || text.startsWith('https://');
    const label = isUrlText ? '' : text;
    return {
      url: htmlLink[1].trim(),
      alt: label || cleanImageTitle(htmlLink[1]),
      caption: label,
    };
  }

  // 6. HTML <img> tag: <img src="url" alt="alt" data-caption="caption" data-href="href" />
  if (/^<img\s+/i.test(trimmed)) {
    const srcMatch = trimmed.match(/src=["'](https?:\/\/[^"']+)["']/i);
    if (srcMatch && (isMiniexcavatorUrl(srcMatch[1]) || isImageUrl(srcMatch[1]))) {
      const altMatch = trimmed.match(/alt=["']([^"']*)["']/i);
      const capMatch = trimmed.match(/data-caption=["']([^"']*)["']/i);
      const hrefMatch = trimmed.match(/data-href=["']([^"']+)["']/i);
      const alt = altMatch ? altMatch[1].trim() : '';
      const caption = capMatch ? capMatch[1].trim() : '';
      return {
        url: srcMatch[1].trim(),
        alt: alt || caption || cleanImageTitle(srcMatch[1]),
        caption: caption || alt,
        href: hrefMatch ? hrefMatch[1].trim() : undefined,
      };
    }
  }

  // 7. Plain URL on standalone line: https://img.miniexcavator.org/..., Unsplash, WebP, JPG, CDN
  if (isImageUrl(trimmed) && /^https?:\/\//i.test(trimmed)) {
    return {
      url: trimmed,
      alt: cleanImageTitle(trimmed),
      caption: '',
    };
  }

  return null;
}

/**
 * Check whether a line looks like an image caption underneath an image:
 * e.g. "Typhon Fury 15 asphalt road roller performing consistent roller pas"
 */
function isLikelyCaptionLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (trimmed.length > 200) return false; // captions are concise
  if (trimmed.startsWith('#')) return false; // not heading
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return false; // not url
  if (/^<h[1-6]/i.test(trimmed)) return false;
  if (/^<img/i.test(trimmed)) return false;
  if (/^<div/i.test(trimmed)) return false;
  if (/^<table/i.test(trimmed)) return false;
  if (/^[-*•]\s+/.test(trimmed)) return false; // not list
  if (/^\d+\.\s+/.test(trimmed)) return false; // not numbered list
  return true;
}

/**
 * Build rich HTML figure representation for an image with caption, SEO alt, and optional link (internal/external)
 */
export function buildImageFigureHtml(img: { url: string; alt?: string; caption?: string; href?: string }, alignment: string = 'center'): string {
  const alignClass = alignment === 'left' ? 'text-left mr-auto' : alignment === 'right' ? 'text-right ml-auto' : alignment === 'full' ? 'w-full' : 'text-center mx-auto';
  const cap = img.caption ? img.caption.trim() : '';
  const alt = img.alt ? img.alt.trim() : (cap || cleanImageTitle(img.url));
  const href = img.href ? img.href.trim() : '';
  const isInternal = href.startsWith('/') || href.includes('happymachinery.com');
  const target = isInternal ? '_self' : '_blank';
  const rel = isInternal ? '' : 'rel="noopener noreferrer"';

  const imgHtml = `<img src="${escapeHtml(img.url)}" alt="${escapeHtml(alt)}" data-alignment="${alignment}" data-caption="${escapeHtml(cap)}" ${href ? `data-href="${escapeHtml(href)}"` : ''} class="blog-body-image rounded-2xl shadow-md mx-auto block max-w-full ${href ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''}" />`;

  const imageBody = href
    ? `<a href="${escapeHtml(href)}" target="${target}" ${rel} class="blog-body-image-link block w-full">${imgHtml}</a>`
    : imgHtml;

  return `<figure class="article-image-figure my-6 ${alignClass}" data-alignment="${alignment}" data-caption="${escapeHtml(cap)}" ${href ? `data-href="${escapeHtml(href)}"` : ''}>` +
    imageBody +
    (cap ? `<figcaption class="blog-body-image-caption text-xs text-center text-slate-500 dark:text-slate-400 mt-2 font-medium italic">${escapeHtml(cap)}</figcaption>` : '') +
    `</figure>`;
}

/**
 * Master parser for pasted blog content
 */
export function processPastedBlog(content: string, _options?: { currentTitle?: string }): ProcessedBlogResult {
  if (!content || typeof content !== 'string') {
    return {
      detected: false,
      hasMiniexcavatorLinks: false,
      isFullBlogImport: false,
      remainingImages: [],
      allImages: [],
      cleanedHtml: '',
    };
  }

  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const hasMiniexcavator = /img\.miniexcavator\.org/i.test(normalized);

  // Clean Google Docs container wrappers
  const cleanedGdocs = normalized
    .replace(/<meta[^>]*>/gi, '')
    .replace(/<b\s+id=["']docs-internal-guid-[^>]*>/gi, '')
    .replace(/<\/b>\s*$/gi, '');

  // Protect HTML tables so they are not fragmented by block splitting
  const tablePlaceholders: string[] = [];
  const protectedTables = cleanedGdocs.replace(/<table[\s\S]*?<\/table>/gi, (match) => {
    const placeholder = `__HM_HTML_TABLE_BLOCK_${tablePlaceholders.length}__`;
    tablePlaceholders.push(match);
    return `\n\n${placeholder}\n\n`;
  });

  // Split into raw lines / paragraphs
  let rawBlocks: string[] = [];
  if (protectedTables.includes('</p>') || protectedTables.includes('</div>') || protectedTables.includes('</h1>') || protectedTables.includes('</h2>') || protectedTables.includes('__HM_HTML_TABLE_BLOCK_')) {
    // Split HTML blocks
    rawBlocks = protectedTables
      .replace(/<\/p>/gi, '</p>\n')
      .replace(/<\/h([1-6])>/gi, '</h$1>\n')
      .replace(/<\/div>/gi, '</div>\n')
      .replace(/<\/figure>/gi, '</figure>\n')
      .replace(/<\/li>/gi, '</li>\n')
      .replace(/<\/ul>/gi, '</ul>\n')
      .replace(/<\/ol>/gi, '</ol>\n')
      .replace(/<\/blockquote>/gi, '</blockquote>\n')
      .split('\n')
      .map(b => b.trim())
      .filter(Boolean);
  } else {
    const lines = protectedTables.split('\n').map(l => l.trim()).filter(Boolean);
    let tableBuffer: string[] = [];

    for (let k = 0; k < lines.length; k++) {
      const line = lines[k];
      const isTableLine = line.includes('\t') || (line.startsWith('|') && line.includes('|'));

      if (isTableLine) {
        tableBuffer.push(line);
      } else {
        if (tableBuffer.length > 0) {
          rawBlocks.push(tableBuffer.join('\n'));
          tableBuffer = [];
        }
        rawBlocks.push(line);
      }
    }
    if (tableBuffer.length > 0) {
      rawBlocks.push(tableBuffer.join('\n'));
    }
  }

  // Restore protected HTML tables and filter orphaned wrapper tags
  rawBlocks = rawBlocks
    .map((b) => {
      if (b.startsWith('__HM_HTML_TABLE_BLOCK_')) {
        const idx = parseInt(b.replace('__HM_HTML_TABLE_BLOCK_', '').replace('__', ''), 10);
        return tablePlaceholders[idx] || b;
      }
      return b;
    })
    .filter(b => b !== '<div>' && b !== '</div>' && !/^<div\s+id=["']docs-internal-guid-[^>]*>$/i.test(b) && b.length > 0);

  if (rawBlocks.length === 0) {
    return {
      detected: false,
      hasMiniexcavatorLinks: false,
      isFullBlogImport: false,
      remainingImages: [],
      allImages: [],
      cleanedHtml: '',
    };
  }

  // 1. Detect if this is a full blog import (has heading or multiple blocks with images)
  let foundTitle = '';
  let titleIndex = -1;

  for (let i = 0; i < Math.min(rawBlocks.length, 5); i++) {
    const block = rawBlocks[i];
    // Markdown heading: # Title or ## Title
    const mdHead = block.match(/^(#{1,3})\s+(.+)$/);
    if (mdHead) {
      foundTitle = cleanTitleText(mdHead[2]);
      titleIndex = i;
      break;
    }
    // HTML heading: <h1>Title</h1> or <h2>Title</h2>
    const htmlHead = block.match(/^<h[1-3][^>]*>(.*?)<\/h[1-3]>$/i);
    if (htmlHead) {
      foundTitle = cleanTitleText(htmlHead[1]);
      titleIndex = i;
      break;
    }
    // Explicit title prefix: "Title: ..."
    const prefixTitle = block.match(/^(?:article\s+)?title:\s*(.+)$/i);
    if (prefixTitle) {
      foundTitle = cleanTitleText(prefixTitle[1]);
      titleIndex = i;
      break;
    }
  }

  // If no explicit heading marker, check if the very first block looks like a standalone title
  // (e.g. short string, no URLs, no image tag, followed by an image or paragraph)
  if (!foundTitle && rawBlocks.length >= 2) {
    const first = rawBlocks[0];
    const strippedFirst = first.replace(/<[^>]+>/g, '').trim();
    if (
      strippedFirst.length > 5 &&
      strippedFirst.length < 140 &&
      !strippedFirst.startsWith('http') &&
      !strippedFirst.includes('<img') &&
      !strippedFirst.includes('miniexcavator.org') &&
      !strippedFirst.endsWith('.') &&
      !strippedFirst.endsWith(':')
    ) {
      // Check if subsequent block is an image or paragraph
      foundTitle = cleanTitleText(first);
      titleIndex = 0;
    }
  }

  // Check if content has embedded tables or YouTube
  const hasTable = rawBlocks.some(b => /<table[\s>]/i.test(b) || isTsvTable(b) || isMarkdownTable(b));
  const hasYoutube = rawBlocks.some(b => Boolean(getYoutubeVideoId(b)));

  // Check if we should consider this a full blog import
  const isFullBlog = Boolean(foundTitle) || (rawBlocks.length >= 3 && hasMiniexcavator) || (rawBlocks.length >= 2 && hasTable);

  // 2. Scan and extract all images, pairing them with captions
  const detectedImages: Array<DetectedImage & { blockIndex: number; consumedNextIndex?: number }> = [];
  const processedBlockIndices = new Set<number>();

  if (titleIndex >= 0 && isFullBlog) {
    processedBlockIndices.add(titleIndex); // Remove title from body
  }

  for (let i = 0; i < rawBlocks.length; i++) {
    if (processedBlockIndices.has(i)) continue;
    const block = rawBlocks[i];

    const parsed = parseImageLine(block);
    if (parsed) {
      let finalCaption = parsed.caption;
      let consumedIdx: number | undefined;

      // If caption is empty, check if the NEXT block is a caption line
      if (!finalCaption && i + 1 < rawBlocks.length) {
        const nextBlock = rawBlocks[i + 1];
        if (!processedBlockIndices.has(i + 1) && !parseImageLine(nextBlock) && isLikelyCaptionLine(nextBlock)) {
          finalCaption = nextBlock.replace(/<[^>]+>/g, '').trim();
          consumedIdx = i + 1;
          processedBlockIndices.add(i + 1);
        }
      }

      detectedImages.push({
        url: parsed.url,
        alt: parsed.alt || finalCaption || cleanImageTitle(parsed.url),
        caption: finalCaption,
        blockIndex: i,
        consumedNextIndex: consumedIdx,
      });

      processedBlockIndices.add(i);
    }
  }

  const detected = hasMiniexcavator || (isFullBlog && (detectedImages.length > 0 || hasTable || rawBlocks.length >= 2)) || detectedImages.length > 0 || hasTable || hasYoutube;

  if (!detected && detectedImages.length === 0 && !hasTable && !hasYoutube) {
    return {
      detected: false,
      hasMiniexcavatorLinks: false,
      isFullBlogImport: false,
      remainingImages: [],
      allImages: [],
      cleanedHtml: content,
    };
  }

  // 3. Separate First Image (Cover Image) vs Remaining Body Images
  let coverImage: { url: string; alt: string } | undefined;
  const remainingImages: DetectedImage[] = [];

  if (detectedImages.length > 0) {
    // The FIRST image is ALWAYS auto-filled to Featured Cover Image!
    const firstImg = detectedImages[0];
    coverImage = {
      url: firstImg.url,
      alt: firstImg.alt || firstImg.caption || foundTitle || cleanImageTitle(firstImg.url),
    };

    if (isFullBlog) {
      // Mark as processed so it's not duplicated in content body if full blog import
      processedBlockIndices.add(firstImg.blockIndex);
      if (firstImg.consumedNextIndex !== undefined) {
        processedBlockIndices.add(firstImg.consumedNextIndex);
      }

      // Remaining images stay in the body
      for (let k = 1; k < detectedImages.length; k++) {
        remainingImages.push({
          url: detectedImages[k].url,
          alt: detectedImages[k].alt,
          caption: detectedImages[k].caption,
        });
      }
    } else {
      // Keep all images in body too if not a full blog layout
      for (let k = 0; k < detectedImages.length; k++) {
        remainingImages.push({
          url: detectedImages[k].url,
          alt: detectedImages[k].alt,
          caption: detectedImages[k].caption,
        });
      }
    }
  }

  // Fallback: If no block matched single-line image parser, check full content with extractFirstImageFromArticle
  if (!coverImage) {
    const fallback = extractFirstImageFromArticle(content);
    if (fallback) {
      coverImage = {
        url: fallback.url,
        alt: fallback.alt || foundTitle || cleanImageTitle(fallback.url),
      };
    }
  }

  // 4. Construct the clean HTML body
  const bodyOut: string[] = [];

  for (let i = 0; i < rawBlocks.length; i++) {
    // If block was the first title, or first image, or consumed caption, SKIP IT!
    if (isFullBlog && i === titleIndex) continue;
    if (isFullBlog && coverImage && detectedImages[0]?.blockIndex === i) continue;
    if (isFullBlog && coverImage && detectedImages[0]?.consumedNextIndex === i) continue;

    // Check if this block is one of the remaining images
    const matchingImg = detectedImages.find(img => img.blockIndex === i);
    if (matchingImg) {
      // Replace link with rich CustomImage / figure HTML
      bodyOut.push(buildImageFigureHtml(matchingImg, 'center'));
      continue;
    }

    // If this block was a consumed caption of an image, skip
    if (detectedImages.some(img => img.consumedNextIndex === i)) {
      continue;
    }

    const block = rawBlocks[i].trim();
    if (!block) continue;

    // Check if block is an HTML Table
    if (/<table[\s>]/i.test(block)) {
      const cleaned = cleanHtmlTable(block);
      bodyOut.push(cleaned ? cleaned.html : block);
      continue;
    }

    // Check if block is a TSV Table
    if (isTsvTable(block)) {
      const tsvRes = convertTsvToTableHtml(block);
      if (tsvRes) {
        bodyOut.push(tsvRes.html);
        continue;
      }
    }

    // Check if block is a Markdown Table
    if (isMarkdownTable(block)) {
      const mdRes = convertMarkdownTableToHtml(block);
      if (mdRes) {
        bodyOut.push(mdRes.html);
        continue;
      }
    }

    // Check if block is a YouTube video link (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/... or markdown link)
    const ytId = getYoutubeVideoId(block);
    if (ytId) {
      bodyOut.push(
        `<div data-youtube-video="" class="article-youtube-wrapper my-8 w-full max-w-4xl mx-auto"><iframe class="article-youtube-iframe w-full aspect-video rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800" src="https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
      );
      continue;
    }

    // Check if block is a heading (markdown, html, numbered, or standalone)
    const headingMatch = detectHeadingInBlock(block);
    if (headingMatch) {
      bodyOut.push(`<h${headingMatch.level}>${escapeHtml(headingMatch.text)}</h${headingMatch.level}>`);
      continue;
    }

    // Pass through existing HTML blocks
    if (block.startsWith('<') && (block.endsWith('>') || block.includes('</'))) {
      bodyOut.push(block);
      continue;
    }

    // Standard text paragraph
    bodyOut.push(`<p>${escapeHtml(block)}</p>`);
  }

  return {
    detected: true,
    hasMiniexcavatorLinks: hasMiniexcavator,
    isFullBlogImport: isFullBlog,
    title: foundTitle || undefined,
    coverImage,
    remainingImages,
    allImages: detectedImages.map(d => ({ url: d.url, alt: d.alt, caption: d.caption })),
    cleanedHtml: bodyOut.join('\n\n'),
  };
}
