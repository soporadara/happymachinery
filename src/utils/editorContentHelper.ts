/**
 * Happy Machinery — Article Content Normalizer & Formatter
 * Converts raw markdown/string arrays into semantic HTML for Tiptap WYSIWYG
 * Matches Rafelblog's clean editorial UX with pretty headings and rendered images
 */

import { isTsvTable, convertTsvToTableHtml, isMarkdownTable, convertMarkdownTableToHtml } from './tablePasteHelper.ts'

export function renderInlineMarkdownToHtml(text: string): string {
  if (!text) return ''
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, linkText, url) => {
      const isInternal = url.startsWith('/') || url.startsWith('#') || url.includes('happymachinery.com')
      if (isInternal) {
        return `<a href="${url}">${linkText}</a>`
      }
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${linkText}</a>`
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

export function isStandaloneHeading(line: string): boolean {
  if (!line || typeof line !== 'string') return false
  if (line.includes('\t')) return false
  if (/^<(?:\/)?(?:table|thead|tbody|tr|th|td)/i.test(line.trim())) return false
  if (line.trim().startsWith('|')) return false

  const clean = line
    .trim()
    .replace(/^<p(?:\s+[^>]*)?>\s*/i, '')
    .replace(/\s*<\/p>$/i, '')
    .replace(/^<(?:strong|b)(?:\s+[^>]*)?>\s*/i, '')
    .replace(/\s*<\/(?:strong|b)>$/i, '')
    .replace(/^\*\*|^\__|^\*|^\_/, '')
    .replace(/\*\*$|\__$|\*$|\_$/, '')
    .replace(/<[^>]+>/g, '')
    .trim()

  if (clean.length < 3 || clean.length > 95) return false
  if (clean.includes('\n')) return false
  if (/^(https?:|\[|!|-|•|\||>)/i.test(clean)) return false
  if (/^(key takeaway|note:|warning:|caution:|tip:|pro tip:)/i.test(clean)) return false
  if (/[:;,]$/.test(clean)) return false
  if (/\.$/.test(clean) && !/^\d+\./.test(clean)) return false
  if (!/^[A-Z0-9"']/.test(clean)) return false
  if (clean.split(/\s+/).length > 14) return false
  return true
}

export const slugifyHeading = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export interface HeadingMatch {
  level: number
  text: string
  id: string
}

export function getHeadingMatch(line: string, fallbackSuffix: number = 0): HeadingMatch | null {
  const trimmed = line.trim()
  if (!trimmed) return null

  // 1. Markdown: # Heading, ## Heading, ### Heading, #### Heading
  const md = trimmed.match(/^(#{1,6})\s+(.*)$/)
  if (md) {
    const text = md[2].trim()
    return { level: md[1].length === 1 ? 2 : md[1].length, text, id: slugifyHeading(text) || `section-${fallbackSuffix}` }
  }

  // 2. HTML: <h1>Heading</h1> or <h2 class="...">Heading</h2> etc.
  const html = trimmed.match(/^<h([1-6])(?:\s+[^>]*)?>(.*?)<\/h\1>$/i)
  if (html) {
    const text = html[2].replace(/<[^>]+>/g, '').trim()
    return { level: parseInt(html[1], 10), text, id: slugifyHeading(text) || `section-${fallbackSuffix}` }
  }

  // 3. Prefix markers: h1: Heading, h2: Heading etc.
  const marker = trimmed.match(/^h([1-6]):\s+(.*)$/i)
  if (marker) {
    const text = marker[2].trim()
    return { level: parseInt(marker[1], 10), text, id: slugifyHeading(text) || `section-${fallbackSuffix}` }
  }

  // Strip wrapping HTML tags (<p>, <strong>, <b>, <span>) and markdown (** / __)
  const stripped = trimmed
    .replace(/^<p(?:\s+[^>]*)?>\s*/i, '')
    .replace(/\s*<\/p>$/i, '')
    .replace(/^<(?:strong|b)(?:\s+[^>]*)?>\s*/i, '')
    .replace(/\s*<\/(?:strong|b)>$/i, '')
    .replace(/^\*\*|^\__|^\*|^\_/, '')
    .replace(/\*\*$|\__$|\*$|\_$/, '')
    .replace(/<[^>]+>/g, '')
    .trim()

  // 4. Numbered FAQ questions: "1. What is..." or "2. What tasks..."
  if (/^\d+\.\s+[A-Z].*\?$/.test(stripped)) {
    return { level: 3, text: stripped, id: slugifyHeading(stripped) || `section-${fallbackSuffix}` }
  }

  // 5. Numbered sections: "1. Heading Title..." or "1. Understand Heaped..."
  if (/^\d+\.\s+[A-Z]/.test(stripped) && stripped.length <= 100 && !stripped.includes('\n')) {
    return { level: 2, text: stripped, id: slugifyHeading(stripped) || `section-${fallbackSuffix}` }
  }

  // 6. Standalone section titles in imported articles (e.g., "Drum Surface and Drum Edges", "Vibration System Components", "Conclusion")
  if (isStandaloneHeading(stripped)) {
    return { level: 2, text: stripped, id: slugifyHeading(stripped) || `section-${fallbackSuffix}` }
  }

  return null
}

/**
 * Splits raw content (string, HTML, markdown, or mixed string array)
 * into discrete standalone block elements (paragraphs, figures, headings, lists, tables).
 * Guarantees that figures, headings, and paragraphs are never fused together.
 */
export function splitContentIntoBlocks(content: string | string[] | any): string[] {
  if (!content) return []

  let rawStrings: string[] = []
  if (Array.isArray(content)) {
    rawStrings = content.map((p) => String(p || '')).filter(Boolean)
  } else if (typeof content === 'string') {
    rawStrings = [content]
  } else {
    return []
  }

  const result: string[] = []

  for (const str of rawStrings) {
    const trimmed = str.trim()
    if (!trimmed) continue

    // Normalize block boundaries by inserting double newlines after closing tags
    const normalized = trimmed
      .replace(/<\/figure>/gi, '</figure>\n\n')
      .replace(/<\/p>/gi, '</p>\n\n')
      .replace(/<\/h([1-6])>/gi, '</h$1>\n\n')
      .replace(/<\/div>/gi, '</div>\n\n')
      .replace(/<\/blockquote>/gi, '</blockquote>\n\n')
      .replace(/<\/ul>/gi, '</ul>\n\n')
      .replace(/<\/ol>/gi, '</ol>\n\n')
      .replace(/<\/table>/gi, '</table>\n\n')
      .replace(/<hr\s*\/?>/gi, '\n\n<hr />\n\n')

    // Split on double newlines
    const chunks = normalized
      .split(/\n\s*\n/)
      .map((c) => c.trim())
      .filter(Boolean)

    for (const chunk of chunks) {
      if (chunk.includes('</figure>') && !chunk.endsWith('</figure>')) {
        const parts = chunk.split(/<\/figure>/i)
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i].trim()
          if (!part) continue
          if (i < parts.length - 1) {
            result.push(`${part}</figure>`)
          } else {
            result.push(part)
          }
        }
      } else {
        result.push(chunk)
      }
    }
  }

  return result
}


/**
 * Converts post content (string array, raw text, or mixed HTML) into 
 * standard semantic HTML that TiptapEditor natively parses into rich nodes.
 */
export function convertContentToHtml(content: string | string[] | any): string {
  if (!content) return ''
  let paragraphs: string[] = []

  if (Array.isArray(content)) {
    paragraphs = content.map(p => String(p || ''))
  } else if (typeof content === 'string') {
    const trimmed = content.trim()
    // If it's ProseMirror JSON string, pass through untouched
    if (trimmed.startsWith('{') && trimmed.includes('"type":"doc"')) {
      return content
    }
    // If it's already full HTML, normalize images and headings inside paragraphs
    if (trimmed.includes('</p>') || trimmed.includes('</h2>') || trimmed.includes('<h3') || trimmed.includes('<figure') || trimmed.includes('</div>')) {
      const normalizedHtml = trimmed
        .replace(
          /<p>\s*(https?:\/\/[^\s<>]+\.(?:webp|png|jpe?g|gif|svg)(?:\?[^\s<>]*)?)\s*<\/p>/gi,
          '<img src="$1" alt="Jobsite Media Illustration" />'
        )
        .replace(
          /<p>\s*(https?:\/\/img\.miniexcavator\.org\/[^\s<>]+)\s*<\/p>/gi,
          '<img src="$1" alt="Machinery Media Asset" />'
        )
        // Convert any <p> or <p><strong> that is a standalone heading into <h2>
        .replace(/<p(?:\s+[^>]*)?>\s*(?:<(?:strong|b)(?:\s+[^>]*)?>)?(.*?)(?:<\/(?:strong|b)>)?\s*<\/p>/gi, (match, inner) => {
          const cleanText = inner.replace(/<[^>]+>/g, '').trim()
          if (isStandaloneHeading(cleanText) || (/^\d+\.\s+[A-Z]/.test(cleanText) && cleanText.length <= 100)) {
            return `<h2>${cleanText}</h2>`
          }
          return match
        })
      return normalizedHtml
    }

    // Split text into paragraphs, ensuring headings are separated into their own blocks while keeping tables intact
    const lines = trimmed.split('\n')
    const rebuilt: string[] = []
    let inTable = false
    let tableBuffer: string[] = []

    for (let k = 0; k < lines.length; k++) {
      const line = lines[k]
      const trimmedLine = line.trim()
      const isTableLine = trimmedLine.includes('\t') || (trimmedLine.startsWith('|') && trimmedLine.includes('|'))

      if (isTableLine) {
        inTable = true
        tableBuffer.push(trimmedLine)
        continue
      } else if (inTable) {
        rebuilt.push(`\n\n${tableBuffer.join('\n')}\n\n`)
        tableBuffer = []
        inTable = false
      }

      if (isStandaloneHeading(trimmedLine) || /^#{1,6}\s+/.test(trimmedLine) || /^\d+\.\s+[A-Z]/.test(trimmedLine)) {
        rebuilt.push(`\n\n${trimmedLine}\n\n`)
      } else {
        rebuilt.push(line)
      }
    }
    if (tableBuffer.length > 0) {
      rebuilt.push(`\n\n${tableBuffer.join('\n')}\n\n`)
    }

    paragraphs = rebuilt.join('\n').split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
  } else {
    return ''
  }

  const out: string[] = []
  let prevHeading = ''

  for (let i = 0; i < paragraphs.length; i++) {
    const raw = String(paragraphs[i] || '').trim()
    if (!raw) continue

    // 0. Markdown linked image: [![alt](imgUrl)](linkUrl)
    const mdLinkedImg = raw.match(/^\[!\[(.*?)\]\((https?:\/\/[^\s)]+|\/images\/[^\s)]+)\)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)$/i);
    if (mdLinkedImg) {
      const [, cap, imgUrl, linkUrl] = mdLinkedImg;
      const isInternal = linkUrl.startsWith('/') || linkUrl.startsWith('#') || linkUrl.includes('happymachinery.com');
      const target = isInternal ? '_self' : '_blank';
      const rel = isInternal ? '' : ' rel="noopener noreferrer"';
      const alt = cap || (prevHeading ? `${prevHeading} - Equipment Visual` : 'Machinery Media Asset');
      if (cap) {
        out.push(`<figure class="article-image-figure text-center my-6" data-alignment="center" data-caption="${cap}" data-href="${linkUrl}" data-link-target="${target}"><a href="${linkUrl}" target="${target}"${rel} class="blog-body-image-link"><img src="${imgUrl}" alt="${alt}" data-alignment="center" data-caption="${cap}" class="blog-body-image rounded-2xl shadow-md mx-auto block max-w-full cursor-pointer hover:opacity-95" /></a><figcaption class="blog-body-image-caption text-xs text-center text-slate-500 dark:text-slate-400 mt-2 font-medium italic">${cap}</figcaption></figure>`);
      } else {
        out.push(`<a href="${linkUrl}" target="${target}"${rel} class="blog-body-image-link"><img src="${imgUrl}" alt="${alt}" class="cursor-pointer hover:opacity-95" /></a>`);
      }
      continue;
    }

    // 1. Miniexcavator or direct image URL (e.g. https://...webp or img.miniexcavator.org)
    const miniexcavatorImgMatch = raw.match(/^(?:<p>)?\s*(https?:\/\/(?:img\.miniexcavator\.org\/[^\s<>]+|[^\s<>]+\.(?:webp|png|jpe?g|gif|svg)(?:\?[^\s<>]*)?))\s*(?:<\/p>)?$/i)
    if (miniexcavatorImgMatch) {
      const alt = prevHeading ? `${prevHeading} - Equipment Visual` : 'Machinery Media Asset'
      out.push(`<img src="${miniexcavatorImgMatch[1]}" alt="${alt}" />`)
      continue
    }

    // 2. Markdown link containing miniexcavator / image: [text/url](url)
    const mdLinkImg = raw.match(/^\[(.*?)\]\((https?:\/\/(?:img\.miniexcavator\.org\/[^\s)]+|[^\s)]+\.(?:webp|png|jpe?g|gif|svg)(?:\?[^\s)]*)?))\)$/i)
    if (mdLinkImg) {
      const text = mdLinkImg[1].trim()
      const isUrlText = text.startsWith('http://') || text.startsWith('https://')
      const caption = isUrlText ? '' : text
      const alt = caption || (prevHeading ? `${prevHeading} - Equipment Visual` : 'Machinery Media Asset')
      if (caption) {
        out.push(`<figure class="article-image-figure text-center my-6" data-alignment="center" data-caption="${caption}"><img src="${mdLinkImg[2]}" alt="${alt}" data-alignment="center" data-caption="${caption}" class="blog-body-image rounded-2xl shadow-md mx-auto block max-w-full" /><figcaption class="blog-body-image-caption text-xs text-center text-slate-500 dark:text-slate-400 mt-2 font-medium italic">${caption}</figcaption></figure>`)
      } else {
        out.push(`<img src="${mdLinkImg[2]}" alt="${alt}" />`)
      }
      continue
    }

    // 3. Markdown image: ![alt](url)
    const mdImg = raw.match(/^!\[(.*?)\]\((.*?)\)$/)
    if (mdImg) {
      const cap = mdImg[1] || ''
      if (cap) {
        out.push(`<figure class="article-image-figure text-center my-6" data-alignment="center" data-caption="${cap}"><img src="${mdImg[2]}" alt="${cap}" data-alignment="center" data-caption="${cap}" class="blog-body-image rounded-2xl shadow-md mx-auto block max-w-full" /><figcaption class="blog-body-image-caption text-xs text-center text-slate-500 dark:text-slate-400 mt-2 font-medium italic">${cap}</figcaption></figure>`)
      } else {
        out.push(`<img src="${mdImg[2]}" alt="${prevHeading || 'Jobsite Media Illustration'}" />`)
      }
      continue
    }

    // 4. Markdown heading: #, ##, ###, ####
    const mdHeading = raw.match(/^(#{1,6})\s+(.*)$/)
    if (mdHeading) {
      const lvl = mdHeading[1].length
      prevHeading = mdHeading[2].trim()
      out.push(`<h${lvl}>${renderInlineMarkdownToHtml(prevHeading)}</h${lvl}>`)
      continue
    }

    // 4. HTML headings: <h1> to <h6>
    if (/^<h[1-6](?:\s+[^>]*)?>/i.test(raw)) {
      const textMatch = raw.match(/^<h[1-6][^>]*>(.*?)<\/h[1-6]>/i)
      if (textMatch) prevHeading = textMatch[1].replace(/<[^>]+>/g, '').trim()
      out.push(raw)
      continue
    }

    // 5. Numbered FAQ questions: "1. What is..." or "2. What tasks..."
    if (/^\d+\.\s+[A-Z].*\?$/.test(raw)) {
      prevHeading = raw
      out.push(`<h3>${renderInlineMarkdownToHtml(raw)}</h3>`)
      continue
    }

    // 6. Standalone section titles in imported articles (e.g. "Drum Surface and Drum Edges", "Vibration System Components")
    if (isStandaloneHeading(raw)) {
      const cleanH = raw
        .replace(/^<p(?:\s+[^>]*)?>\s*/i, '')
        .replace(/\s*<\/p>$/i, '')
        .replace(/^<(?:strong|b)(?:\s+[^>]*)?>\s*/i, '')
        .replace(/\s*<\/(?:strong|b)>$/i, '')
        .replace(/^\*\*|^\__|^\*|^\_/, '')
        .replace(/\*\*$|\__$|\*$|\_$/, '')
        .replace(/<[^>]+>/g, '')
        .trim()
      prevHeading = cleanH
      out.push(`<h2>${cleanH}</h2>`)
      continue
    }

    // 7. Bullet list items: - item or • item
    if (/^[-•*]\s+/m.test(raw)) {
      const items = raw.split('\n').map(l => l.trim()).filter(Boolean)
      out.push(`<ul>${items.map(it => `<li>${renderInlineMarkdownToHtml(it.replace(/^[-•*]\s+/, ''))}</li>`).join('')}</ul>`)
      continue
    }

    // 8. Numbered list items
    if (/^\d+\.\s+/m.test(raw) && !raw.endsWith('?')) {
      const items = raw.split('\n').map(l => l.trim()).filter(Boolean)
      out.push(`<ol>${items.map(it => `<li>${renderInlineMarkdownToHtml(it.replace(/^\d+\.\s+/, ''))}</li>`).join('')}</ol>`)
      continue
    }

    // 8.5. Tables: TSV Table or Markdown Table
    if (isTsvTable(raw)) {
      const tsvRes = convertTsvToTableHtml(raw)
      if (tsvRes) {
        out.push(tsvRes.html)
        continue
      }
    }

    if (isMarkdownTable(raw)) {
      const mdRes = convertMarkdownTableToHtml(raw)
      if (mdRes) {
        out.push(mdRes.html)
        continue
      }
    }

    // 9. Already an HTML block (tables, div, blockquote, etc.)
    if (raw.startsWith('<') && (raw.endsWith('>') || raw.includes('</'))) {
      out.push(raw)
      continue
    }

    // 10. Standard paragraph with inline formatting
    out.push(`<p>${renderInlineMarkdownToHtml(raw)}</p>`)
  }

  return out.join('\n\n')
}
