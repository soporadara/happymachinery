/**
 * Happy Machinery — Article Content Normalizer & Formatter
 * Converts raw markdown/string arrays into semantic HTML for Tiptap WYSIWYG
 * Matches Rafelblog's clean editorial UX with pretty headings and rendered images
 */

export function renderInlineMarkdownToHtml(text: string): string {
  if (!text) return ''
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
}

export function isStandaloneHeading(line: string): boolean {
  const trimmed = line.trim()
  if (trimmed.length < 3 || trimmed.length > 85) return false
  if (trimmed.includes('\n')) return false
  if (/^(https?:|\[|!|-|\*|•|\||>)/i.test(trimmed)) return false
  if (/^(key takeaway|note:|warning:|caution:)/i.test(trimmed)) return false
  if (/[:;,]$/.test(trimmed)) return false
  // Avoid sentence ending in period unless it is a numbered section
  if (/\.$/.test(trimmed) && !/^\d+\./.test(trimmed)) return false
  return /^[A-Z0-9]/.test(trimmed)
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
    // If it's already full HTML
    if (trimmed.includes('</p>') || trimmed.includes('</h2>') || trimmed.includes('<img')) {
      return trimmed.replace(
        /<p>\s*(https?:\/\/[^\s<>]+\.(?:webp|png|jpe?g|gif|svg)(?:\?[^\s<>]*)?)\s*<\/p>/gi,
        '<img src="$1" alt="Jobsite Media Illustration" />'
      )
    }
    paragraphs = trimmed.split(/\n\s*\n/)
  } else {
    return ''
  }

  const out: string[] = []
  let prevHeading = ''

  for (let i = 0; i < paragraphs.length; i++) {
    const raw = String(paragraphs[i] || '').trim()
    if (!raw) continue

    // 1. Direct image URL (e.g. https://...webp) or image wrapped in <p>...</p>
    const directImgMatch = raw.match(/^(?:<p>)?\s*(https?:\/\/[^\s<>]+\.(?:webp|png|jpe?g|gif|svg)(?:\?[^\s<>]*)?)\s*(?:<\/p>)?$/i)
    if (directImgMatch) {
      const alt = prevHeading ? `${prevHeading} - Equipment Visual` : 'Jobsite Media Illustration'
      out.push(`<img src="${directImgMatch[1]}" alt="${alt}" />`)
      continue
    }

    // 2. Markdown image: ![alt](url)
    const mdImg = raw.match(/^!\[(.*?)\]\((.*?)\)$/)
    if (mdImg) {
      out.push(`<img src="${mdImg[2]}" alt="${mdImg[1] || 'Jobsite Media Illustration'}" />`)
      continue
    }

    // 3. Markdown heading: #, ##, ###, ####
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

    // 6. Standalone section titles in imported articles (e.g. "Comparing Lifting and Working Functions")
    if (isStandaloneHeading(raw)) {
      prevHeading = raw
      out.push(`<h2>${renderInlineMarkdownToHtml(raw)}</h2>`)
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
