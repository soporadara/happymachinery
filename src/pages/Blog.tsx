import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { DEFAULT_COMMENTS, DEFAULT_POSTS, BlogComment, BlogReply, BlogPost } from './adminData'
import { readPersistentContent } from '../data/persistentStorage'
import { readSharedContent, appendSharedContent } from '../data/sharedContentStorage'
import { getStoredSession } from '../data/cmsAuth'
import { getBlogPostPath, getBlogPostSlug } from '../data/blogUrls'
import { getRealBlogViews, recordRealBlogView } from '../data/blogViews'
import './Blog.css'

export const slugifyHeading = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function isStandaloneHeading(line: string): boolean {
  const trimmed = line.trim()
  if (trimmed.length < 3 || trimmed.length > 75) return false
  if (trimmed.includes('\n')) return false
  if (
    trimmed.startsWith('http') ||
    trimmed.startsWith('[') ||
    trimmed.startsWith('!') ||
    trimmed.startsWith('-') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('•') ||
    trimmed.startsWith('|') ||
    trimmed.startsWith('>')
  ) return false
  if (
    trimmed.toLowerCase().startsWith('key takeaway') ||
    trimmed.toLowerCase().startsWith('note:') ||
    trimmed.toLowerCase().startsWith('warning:') ||
    trimmed.toLowerCase().startsWith('caution:')
  ) return false
  if (trimmed.endsWith(':') || trimmed.endsWith('.') || trimmed.endsWith(',') || trimmed.endsWith(';')) return false
  return /^[A-Z0-9]/.test(trimmed)
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
    return { level: md[1].length, text, id: slugifyHeading(text) || `section-${fallbackSuffix}` }
  }

  // 2. HTML: <h1>Heading</h1> etc.
  const html = trimmed.match(/^<h([1-6])>(.*?)<\/h\1>$/i)
  if (html) {
    const text = html[2].trim()
    return { level: parseInt(html[1], 10), text, id: slugifyHeading(text) || `section-${fallbackSuffix}` }
  }

  // 3. Prefix markers: h1: Heading, h2: Heading etc.
  const marker = trimmed.match(/^h([1-6]):\s+(.*)$/i)
  if (marker) {
    const text = marker[2].trim()
    return { level: parseInt(marker[1], 10), text, id: slugifyHeading(text) || `section-${fallbackSuffix}` }
  }

  // 4. Numbered sections: "1. Heading Title..." or "1. Understand Heaped..."
  if (/^\d+\.\s+[A-Z]/.test(trimmed) && trimmed.length <= 100 && !trimmed.includes('\n')) {
    return { level: 2, text: trimmed, id: slugifyHeading(trimmed) || `section-${fallbackSuffix}` }
  }

  // 5. Standalone section titles in imported articles (e.g., "Purpose of Stabilizing Legs", "Conclusion", "Frequently Asked Questions")
  if (isStandaloneHeading(trimmed)) {
    return { level: 2, text: trimmed, id: slugifyHeading(trimmed) || `section-${fallbackSuffix}` }
  }

  return null
}

export function renderInlineMarkdown(text: string, keyPrefix: string): React.ReactNode {
  if (!text) return null

  // Match:
  // 1. links: [text](url)
  // 2. bold: **text** or __text__
  // 3. underline: <u>text</u>
  // 4. strikethrough: ~~text~~
  // 5. italic: *text* or _text_
  // 6. inline code: `code`
  const tokenRegex = /(\[(?:[^\]]+)\]\((?:[^)]+)\))|(?:\*\*([^*]+)\*\*)|(?:__([^_]+)__)|(?:<u>(.*?)<\/u>)|(?:~~([^~]+)~~)|(?:\*([^*]+)\*)|(?:_([^_]+)_)|(?:`([^`]+)`)/gi

  const elements: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.substring(lastIndex, match.index))
    }

    const fullMatch = match[0]
    const idx = match.index

    if (fullMatch.startsWith('[') && fullMatch.includes('](')) {
      const linkMatch = fullMatch.match(/^\[(.*?)\]\((.*?)\)$/)
      if (linkMatch) {
        const [, linkText, linkUrl] = linkMatch
        const isInternal = linkUrl.startsWith('/') || linkUrl.includes('happymachinery.com')
        if (isInternal) {
          elements.push(
            <Link key={`${keyPrefix}-link-${idx}`} to={linkUrl} className="blog-body-link">
              {linkText}
            </Link>
          )
        } else {
          elements.push(
            <a key={`${keyPrefix}-link-${idx}`} href={linkUrl} target="_blank" rel="noopener noreferrer" className="blog-body-link external">
              {linkText}
            </a>
          )
        }
      }
    } else if (match[2] !== undefined || match[3] !== undefined) {
      const boldText = match[2] !== undefined ? match[2] : match[3]
      elements.push(
        <strong key={`${keyPrefix}-bold-${idx}`} className="blog-body-strong">
          {boldText}
        </strong>
      )
    } else if (match[4] !== undefined) {
      elements.push(
        <u key={`${keyPrefix}-u-${idx}`} className="blog-body-u">
          {match[4]}
        </u>
      )
    } else if (match[5] !== undefined) {
      elements.push(
        <del key={`${keyPrefix}-del-${idx}`} className="blog-body-del">
          {match[5]}
        </del>
      )
    } else if (match[6] !== undefined || match[7] !== undefined) {
      const italicText = match[6] !== undefined ? match[6] : match[7]
      elements.push(
        <em key={`${keyPrefix}-em-${idx}`} className="blog-body-em">
          {italicText}
        </em>
      )
    } else if (match[8] !== undefined) {
      elements.push(
        <code key={`${keyPrefix}-code-${idx}`} className="blog-body-code">
          {match[8]}
        </code>
      )
    }

    lastIndex = match.index + fullMatch.length
  }

  if (lastIndex < text.length) {
    elements.push(text.substring(lastIndex))
  }

  return elements.length > 0 ? elements : text
}

export function renderMarkdownToReact(text: string, key: string | number) {
  const line = text.trim()
  if (!line) return null

  // Heading check with Anchor link ID & Clickable Anchor
  const heading = getHeadingMatch(line, typeof key === 'number' ? key : 0)
  if (heading) {
    const Tag = (heading.level === 1 ? 'h2' : heading.level === 2 ? 'h2' : heading.level === 3 ? 'h3' : 'h4') as 'h2' | 'h3' | 'h4'
    return (
      <Tag
        key={key}
        id={heading.id}
        className={`blog-body-${Tag} blog-section-anchor`}
      >
        <span className="blog-heading-text">{renderInlineMarkdown(heading.text, `${key}-ht`)}</span>
        <a
          href={`#${heading.id}`}
          className="blog-heading-anchor-link"
          title={`Link to section: ${heading.text}`}
          aria-label={`Link to section: ${heading.text}`}
          onClick={(e) => {
            e.preventDefault()
            const container = document.querySelector('.raf-primary-column')
            const el = document.getElementById(heading.id)
            if (container && el) {
              const containerRect = container.getBoundingClientRect()
              const targetRect = el.getBoundingClientRect()
              const relativeTop = targetRect.top - containerRect.top + container.scrollTop - 20
              container.scrollTo({ top: Math.max(0, relativeTop), behavior: 'smooth' })
            } else if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
            if (window.history.pushState) {
              window.history.pushState(null, '', `#${heading.id}`)
            } else {
              window.location.hash = heading.id
            }
          }}
        >
          #
        </a>
      </Tag>
    )
  }

  // Key takeaway callout box in body
  if (line.toLowerCase().startsWith('key takeaway:')) {
    const takeawayText = line.replace(/^key takeaway:\s*/i, '')
    return (
      <div key={key} className="blog-body-takeaway-inline">
        <span className="blog-takeaway-inline-badge">KEY TAKEAWAY</span>
        <p className="blog-takeaway-inline-text">{takeawayText}</p>
      </div>
    )
  }

  // 5. Video detection: [Watch Video...](url) or direct YouTube/Vimeo
  const vidLinkMatch = line.match(/^\[(.*?)\]\((https?:\/\/[^\s]+)\)$/)
  const testUrl = vidLinkMatch ? vidLinkMatch[2] : line
  if (/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/)|vimeo\.com)/i.test(testUrl)) {
    let embedUrl = ''
    const ytMatch = testUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/)
    if (ytMatch && ytMatch[1]) {
      embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`
    } else {
      const vimeoMatch = testUrl.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)/)
      if (vimeoMatch && vimeoMatch[1]) {
        embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`
      }
    }
    if (embedUrl) {
      return (
        <div key={key} className="blog-body-video-container">
          <iframe
            src={embedUrl}
            title="Jobsite Equipment Video"
            className="blog-body-video-iframe"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      )
    }
  }

  // 6. Markdown Table: | Col1 | Col2 |
  if (line.startsWith('|') && line.includes('\n')) {
    const tableLines = line.split('\n').map((l) => l.trim()).filter(Boolean)
    if (tableLines.length >= 2) {
      const parseRow = (rowStr: string) =>
        rowStr.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
      const headers = parseRow(tableLines[0])
      const rows = tableLines.slice(2).map(parseRow)
      return (
        <div key={key} className="blog-body-table-wrapper">
          <table className="blog-body-table">
            <thead>
              <tr>
                {headers.map((h, hIdx) => (
                  <th key={hIdx}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    }
  }

  // 7. Bullet Lists: - item or • item
  if (/^[-•*]\s+/m.test(line)) {
    const listItems = line.split('\n').map((l) => l.trim()).filter(Boolean)
    return (
      <ul key={key} className="blog-body-ul">
        {listItems.map((item, iIdx) => (
          <li key={iIdx} className="blog-body-li">
            {renderInlineMarkdown(item.replace(/^[-•*]\s+/, ''), `${key}-ul-${iIdx}`)}
          </li>
        ))}
      </ul>
    )
  }

  // 8. Numbered Lists: 1. item
  if (/^\d+\.\s+/m.test(line)) {
    const listItems = line.split('\n').map((l) => l.trim()).filter(Boolean)
    return (
      <ol key={key} className="blog-body-ol">
        {listItems.map((item, iIdx) => (
          <li key={iIdx} className="blog-body-li">
            {renderInlineMarkdown(item.replace(/^\d+\.\s+/, ''), `${key}-ol-${iIdx}`)}
          </li>
        ))}
      </ol>
    )
  }

  // Raw Image URL Auto-detection
  if (/^(https?:\/\/|\/images\/)[^\s]+$/i.test(line) && /\.(png|jpg|jpeg|webp|gif|svg)/i.test(line)) {
    return (
      <div key={key} className="blog-body-image-container">
        <img src={line} alt="Jobsite Media" className="blog-body-image" />
      </div>
    )
  }

  // Image: "![Alt Text](url)"
  const imgRegex = /^!\[(.*?)\]\((.*?)\)$/
  const imgMatch = line.match(imgRegex)
  if (imgMatch) {
    const [, alt, url] = imgMatch
    return (
      <div key={key} className="blog-body-image-container">
        <img src={url} alt={alt} className="blog-body-image" />
        {alt && <span className="blog-body-image-caption">{alt}</span>}
      </div>
    )
  }

  // Rich HTML block pass-through (for Tiptap / Gutenberg rich blocks)
  if (line.startsWith('<') && (line.endsWith('>') || line.includes('</'))) {
    return (
      <div
        key={key}
        className="blog-body-html-block"
        dangerouslySetInnerHTML={{ __html: line }}
      />
    )
  }

  return (
    <p key={key} className="blog-body-p">
      {renderInlineMarkdown(line, `${key}-p`)}
    </p>
  )
}

// Real views helper for any post
export const getPostViews = (post: BlogPost): number => {
  return getRealBlogViews(post.id, (post as any).views)
}

export default function Blog() {
  const navigate = useNavigate()
  const { slug } = useParams<{ slug?: string }>()
  const [searchParams] = useSearchParams()
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [comments, setComments] = useState<BlogComment[]>(() => {
    const saved = localStorage.getItem('happy-machinery-comments')
    return saved ? JSON.parse(saved) : DEFAULT_COMMENTS
  })
  const [commentName, setCommentName] = useState('')
  const [commentEmail, setCommentEmail] = useState('')
  const [commentText, setCommentText] = useState('')
  const [commentSubmitted, setCommentSubmitted] = useState(false)
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyName, setReplyName] = useState('')
  const [replyEmail, setReplyEmail] = useState('')
  const [replyText, setReplyText] = useState('')
  const [replyToUser, setReplyToUser] = useState<string>('')
  const [isReplyingAsAdmin, setIsReplyingAsAdmin] = useState(false)
  const [likedComments, setLikedComments] = useState<number[]>(() => {
    const saved = localStorage.getItem('happy-machinery-liked-comments')
    return saved ? JSON.parse(saved) : []
  })
  const [copiedLink, setCopiedLink] = useState(false)
  const [activeTocId, setActiveTocId] = useState<string>('')

  const isAdmin = localStorage.getItem('happy-admin-auth') === 'true'

  const [posts, setPosts] = useState<BlogPost[]>(() => {
    const saved = localStorage.getItem('happy-machinery-blog-posts')
    return saved ? JSON.parse(saved) : DEFAULT_POSTS
  })

  // Derived selectedPost from URL search parameters or slug
  const postId = searchParams.get('post')
  const selectedPost = slug
    ? posts.find((post) => getBlogPostSlug(post) === slug) || null
    : postId
      ? posts.find((post) => post.id === Number(postId)) || null
      : null

  const setSelectedPost = (post: BlogPost | null) => {
    if (post) {
      navigate(getBlogPostPath(post))
      window.scrollTo({ top: 0, behavior: 'smooth' })
      const primaryCol = document.querySelector('.raf-primary-column')
      if (primaryCol) {
        primaryCol.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } else {
      navigate('/blog')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Canonical redirect for old ?post=ID links
  useEffect(() => {
    if (!slug && postId && selectedPost) {
      navigate(getBlogPostPath(selectedPost), { replace: true })
    }
  }, [navigate, postId, selectedPost, slug])

  // Record authentic view count on article visit
  useEffect(() => {
    if (selectedPost?.id) {
      recordRealBlogView(selectedPost.id)
    }
  }, [selectedPost?.id])

  // Dynamic SEO Meta Tags for selected article
  useEffect(() => {
    if (!selectedPost) return

    const originalTitle = document.title
    const originalDesc = document.head.querySelector<HTMLMetaElement>('meta[name="description"]')?.content || ''
    const originalOgTitle = document.head.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.content || ''
    const originalOgDesc = document.head.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.content || ''
    const originalOgImage = document.head.querySelector<HTMLMetaElement>('meta[property="og:image"]')?.content || ''
    const originalOgUrl = document.head.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.content || ''
    const originalCanonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href || ''

    const SITE_URL = 'https://happymachinery.com'
    const articleUrl = `${SITE_URL}${getBlogPostPath(selectedPost)}`
    const seoTitle = `${selectedPost.title} | Happy Machinery`
    const seoDesc = selectedPost.excerpt.slice(0, 160)
    const seoImage = selectedPost.image.startsWith('http') ? selectedPost.image : `${SITE_URL}${selectedPost.image}`

    document.title = seoTitle

    const setMeta = (selector: string, attr: string, key: string, value: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(selector)
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        document.head.appendChild(el)
      }
      el.content = value
    }

    setMeta('meta[name="description"]', 'name', 'description', seoDesc)
    setMeta('meta[property="og:title"]', 'property', 'og:title', seoTitle)
    setMeta('meta[property="og:description"]', 'property', 'og:description', seoDesc)
    setMeta('meta[property="og:image"]', 'property', 'og:image', seoImage)
    setMeta('meta[property="og:url"]', 'property', 'og:url', articleUrl)
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', seoTitle)
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', seoDesc)
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', seoImage)

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = articleUrl

    return () => {
      document.title = originalTitle
      const restoreMeta = (selector: string, value: string) => {
        const el = document.head.querySelector<HTMLMetaElement>(selector)
        if (el) el.content = value
      }
      restoreMeta('meta[name="description"]', originalDesc)
      restoreMeta('meta[property="og:title"]', originalOgTitle)
      restoreMeta('meta[property="og:description"]', originalOgDesc)
      restoreMeta('meta[property="og:image"]', originalOgImage)
      restoreMeta('meta[property="og:url"]', originalOgUrl)
      restoreMeta('meta[name="twitter:title"]', originalOgTitle)
      restoreMeta('meta[name="twitter:description"]', originalOgDesc)
      restoreMeta('meta[name="twitter:image"]', originalOgImage)

      const c = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
      if (c) c.href = originalCanonical
    }
  }, [selectedPost])


  // Sync posts from shared backend storage
  useEffect(() => {
    const handleStorageChange = async () => {
      try {
        const saved = await readSharedContent<BlogPost[]>('blog-posts')
        if (saved && Array.isArray(saved) && saved.length > 0) {
          setPosts(saved)
          return
        }
      } catch (error) {
        console.error('Could not load the shared article database.', error)
      }

      try {
        const saved = await readPersistentContent<BlogPost[]>('blog-posts')
        if (saved && Array.isArray(saved) && saved.length > 0) {
          setPosts(saved)
          return
        }
      } catch (error) {
        console.error('Could not load the offline article database.', error)
      }

      const localCopy = localStorage.getItem('happy-machinery-blog-posts')
      setPosts(localCopy ? JSON.parse(localCopy) : DEFAULT_POSTS)
    }

    void handleStorageChange()
    window.addEventListener('blog-updated', handleStorageChange)
    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('blog-updated', handleStorageChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const [commentError, setCommentError] = useState('')
  const [replyError, setReplyError] = useState('')

  // Sync comments
  useEffect(() => {
    const syncComments = async () => {
      try {
        const saved = await readSharedContent<BlogComment[]>('comments')
        if (saved && Array.isArray(saved)) {
          setComments(saved)
          try { localStorage.setItem('happy-machinery-comments', JSON.stringify(saved)) } catch {}
          return
        }
      } catch {}
      const saved = localStorage.getItem('happy-machinery-comments')
      if (saved) {
        try { setComments(JSON.parse(saved)) } catch {}
      }
    }
    void syncComments()
    window.addEventListener('comments-updated', syncComments)
    window.addEventListener('storage', syncComments)
    return () => {
      window.removeEventListener('comments-updated', syncComments)
      window.removeEventListener('storage', syncComments)
    }
  }, [])


  // Reset form when post changes
  useEffect(() => {
    setCommentSubmitted(false)
    setCommentName('')
    setCommentEmail('')
    setCommentText('')
    setReplyingTo(null)
    setReplyName('')
    setReplyEmail('')
    setReplyText('')
    setReplyToUser('')
  }, [selectedPost?.id])

  const handleCommentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedPost || !commentName.trim() || !commentEmail.trim() || !commentText.trim()) {
      setCommentError('Please fill out all required fields.')
      return
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(commentEmail.trim())) {
      setCommentError('Please enter a valid email address.')
      return
    }

    setCommentError('')
    const newComment: BlogComment = {
      id: Date.now(),
      postId: selectedPost.id,
      postTitle: selectedPost.title,
      author: commentName.trim(),
      email: commentEmail.trim(),
      text: commentText.trim(),
      date: new Date().toISOString().slice(0, 10),
      status: isAdmin ? 'Approved' : 'Pending',
      likes: 0,
      replies: []
    }
    const updatedComments = [newComment, ...comments]
    setComments(updatedComments)
    try { localStorage.setItem('happy-machinery-comments', JSON.stringify(updatedComments)) } catch {}
    void appendSharedContent('comments', newComment).catch(() => {})
    window.dispatchEvent(new Event('comments-updated'))
    setCommentName('')
    setCommentEmail('')
    setCommentText('')
    setCommentSubmitted(true)
  }

  const handleLikeComment = (commentId: number) => {
    const alreadyLiked = likedComments.includes(commentId)
    const nextLiked = alreadyLiked
      ? likedComments.filter((id) => id !== commentId)
      : [...likedComments, commentId]
    const updatedComments = comments.map((comment) =>
      comment.id === commentId
        ? { ...comment, likes: Math.max(0, (comment.likes || 0) + (alreadyLiked ? -1 : 1)) }
        : comment
    )
    setLikedComments(nextLiked)
    setComments(updatedComments)
    localStorage.setItem('happy-machinery-liked-comments', JSON.stringify(nextLiked))
    localStorage.setItem('happy-machinery-comments', JSON.stringify(updatedComments))
    window.dispatchEvent(new Event('comments-updated'))
  }

  const handleReplySubmit = (commentId: number) => {
    if (!replyText.trim()) return

    let authorName = replyName.trim()
    let authorEmail = replyEmail.trim()
    const isSeller = isReplyingAsAdmin || (isAdmin && !replyName.trim())

    if (isSeller) {
      authorName = 'Happy Machinery Support'
      authorEmail = 'support@happymachinery.com'
    } else {
      if (!authorName) {
        setReplyError('Please enter your name.')
        return
      }
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!authorEmail || !emailPattern.test(authorEmail)) {
        setReplyError('Please enter a valid email address.')
        return
      }
    }

    setReplyError('')
    const newReply: BlogReply = {
      id: Date.now(),
      author: authorName,
      email: authorEmail,
      text: replyText.trim(),
      date: new Date().toISOString().slice(0, 10),
      isSeller: Boolean(isSeller),
      replyToAuthor: replyToUser || undefined
    }

    const updatedComments = comments.map((comment) =>
      comment.id === commentId
        ? {
            ...comment,
            replies: [...(comment.replies || []), newReply]
          }
        : comment
    )
    setComments(updatedComments)
    try { localStorage.setItem('happy-machinery-comments', JSON.stringify(updatedComments)) } catch {}
    void appendSharedContent('comments', updatedComments).catch(() => {})
    window.dispatchEvent(new Event('comments-updated'))

    setReplyingTo(null)
    setReplyToUser('')
    setReplyName('')
    setReplyEmail('')
    setReplyText('')
  }

  // Extract unique categories dynamically
  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(posts.filter((p) => isAdmin || p.status !== 'Draft').map((p) => p.category)))]
  }, [posts, isAdmin])

  // Filter posts based on Category and Search Query (excluding drafts for public visitors)
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      if (!isAdmin && post.status === 'Draft') return false
      const matchesCategory = activeCategory === 'All' || post.category === activeCategory
      const query = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !query ||
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query) ||
        post.category.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [posts, activeCategory, searchQuery, isAdmin])

  // Popular posts sorted by view count (excluding drafts for public visitors)
  const popularPosts = useMemo(() => {
    return posts
      .filter((p) => isAdmin || p.status !== 'Draft')
      .sort((a, b) => getPostViews(b) - getPostViews(a))
      .slice(0, 5)
  }, [posts, isAdmin])

  // Category counts for popular categories sidebar
  const categoryCounts = useMemo(() => {
    return categories
      .filter((cat) => cat !== 'All')
      .map((cat) => ({
        name: cat,
        count: posts.filter((p) => p.category === cat && (isAdmin || p.status !== 'Draft')).length
      }))
  }, [categories, posts, isAdmin])


  // Table of Contents for "On This Page" widget (Extracts real sections from article)
  const tocItems = useMemo(() => {
    if (!selectedPost) return []
    const items: { id: string; text: string; num: number; level: number }[] = []
    let counter = 1
    const seenIds = new Set<string>()

    selectedPost.content.forEach((line, idx) => {
      const h = getHeadingMatch(line, idx)
      if (h && h.text.length > 2) {
        if (h.text.toLowerCase() === selectedPost.title.toLowerCase()) return

        let finalId = h.id
        if (seenIds.has(finalId)) {
          finalId = `${finalId}-${idx}`
        }
        seenIds.add(finalId)

        items.push({
          id: finalId,
          text: h.text,
          num: counter++,
          level: h.level
        })
      }
    })

    if (selectedPost.keyTakeaways && selectedPost.keyTakeaways.length > 0) {
      items.push({
        id: 'key-takeaways',
        text: 'Key Takeaways & Jobsite Essentials',
        num: counter++,
        level: 2
      })
    }

    items.push({
      id: 'discussion-comments',
      text: 'Comments & Discussion',
      num: counter++,
      level: 2
    })

    return items
  }, [selectedPost])

  // Series Playlist guides in current category (Matching Image 2)
  const seriesPlaylist = useMemo(() => {
    if (!selectedPost) return []
    const sameCat = posts.filter((p) => p.category === selectedPost.category)
    return sameCat.slice(0, 5)
  }, [posts, selectedPost])

  // Suggested Guides (for bottom of article)
  const suggestedPosts = useMemo(() => {
    if (!selectedPost) return []
    const pool = posts.filter((p) => p.id !== selectedPost.id)
    const sameCat = pool.filter((p) => p.category === selectedPost.category)
    const others = pool.filter((p) => p.category !== selectedPost.category)
    return [...sameCat, ...others].slice(0, 3)
  }, [posts, selectedPost])

  const handleScrollToToc = (id: string) => {
    setActiveTocId(id)
    const target = document.getElementById(id)
    if (target) {
      const primaryCol = document.querySelector('.raf-primary-column') as HTMLElement | null
      const isPrimaryScrollable = primaryCol && primaryCol.scrollHeight > primaryCol.clientHeight && window.getComputedStyle(primaryCol).overflowY === 'auto'
      if (isPrimaryScrollable && primaryCol) {
        const colRect = primaryCol.getBoundingClientRect()
        const targetRect = target.getBoundingClientRect()
        const topOffset = targetRect.top - colRect.top + primaryCol.scrollTop - 24
        primaryCol.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' })
      } else {
        const headerOffset = 96
        const elementPosition = target.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset
        window.scrollTo({ top: Math.max(0, offsetPosition), behavior: 'smooth' })
      }
    }
    if (window.history.pushState) {
      window.history.pushState(null, '', `#${id}`)
    } else {
      window.location.hash = id
    }
  }

  // Scroll to hash on page load or post change
  useEffect(() => {
    if (!selectedPost) return
    const rawHash = window.location.hash.replace('#', '')
    const primaryCol = document.querySelector('.raf-primary-column') as HTMLElement | null
    if (rawHash) {
      const timer = setTimeout(() => {
        const el = document.getElementById(rawHash)
        if (el) {
          const isPrimaryScrollable = primaryCol && primaryCol.scrollHeight > primaryCol.clientHeight && window.getComputedStyle(primaryCol).overflowY === 'auto'
          if (isPrimaryScrollable && primaryCol) {
            const colRect = primaryCol.getBoundingClientRect()
            const targetRect = el.getBoundingClientRect()
            const topOffset = targetRect.top - colRect.top + primaryCol.scrollTop - 24
            primaryCol.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' })
          } else {
            const headerOffset = 96
            const elementPosition = el.getBoundingClientRect().top
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset
            window.scrollTo({ top: Math.max(0, offsetPosition), behavior: 'smooth' })
          }
          setActiveTocId(rawHash)
        }
      }, 150)
      return () => clearTimeout(timer)
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' })
      if (primaryCol) {
        primaryCol.scrollTo({ top: 0, behavior: 'instant' })
      }
    }
  }, [selectedPost])

  // Listen to hash changes in browser
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '')
      if (hash) {
        const el = document.getElementById(hash)
        if (el) {
          const primaryCol = document.querySelector('.raf-primary-column') as HTMLElement | null
          const isPrimaryScrollable = primaryCol && primaryCol.scrollHeight > primaryCol.clientHeight && window.getComputedStyle(primaryCol).overflowY === 'auto'
          if (isPrimaryScrollable && primaryCol) {
            const colRect = primaryCol.getBoundingClientRect()
            const targetRect = el.getBoundingClientRect()
            const topOffset = targetRect.top - colRect.top + primaryCol.scrollTop - 24
            primaryCol.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' })
          } else {
            const headerOffset = 96
            const elementPosition = el.getBoundingClientRect().top
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset
            window.scrollTo({ top: Math.max(0, offsetPosition), behavior: 'smooth' })
          }
          setActiveTocId(hash)
        }
      }
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Scroll-Spy: Highlight active section in "On This Page" as user scrolls
  useEffect(() => {
    if (!selectedPost || tocItems.length === 0) return

    const handleScroll = () => {
      let currentActive = tocItems[0]?.id || ''

      for (const item of tocItems) {
        const el = document.getElementById(item.id)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= 160) {
            currentActive = item.id
          } else {
            break
          }
        }
      }

      if (currentActive) {
        setActiveTocId(currentActive)
      }
    }

    const primaryCol = document.querySelector('.raf-primary-column')

    window.addEventListener('scroll', handleScroll, { passive: true })
    if (primaryCol) {
      primaryCol.addEventListener('scroll', handleScroll, { passive: true })
    }
    handleScroll()
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (primaryCol) {
        primaryCol.removeEventListener('scroll', handleScroll)
      }
    }
  }, [selectedPost, tocItems])

  // Format date helper e.g. "Oct 15"
  const formatShortDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch {
      return dateStr
    }
  }

  // Format full date e.g. "October 15, 2026"
  const formatFullDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  // ============================================================================
  // VIEW A: SINGLE ARTICLE READING PAGE (MATCHING RAFVEX SCREENSHOT 1 & 2)
  // ============================================================================
  // Forward scroll to window when reaching the end of article column or sidebar so the page scrolls to footer
  const handleDualColumnWheel = (e: React.WheelEvent<HTMLElement>) => {
    const target = e.currentTarget
    if (!target) return
    const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 3
    const isAtTop = target.scrollTop <= 1

    if (e.deltaY > 0 && isAtBottom) {
      window.scrollBy({ top: e.deltaY, behavior: 'auto' })
    } else if (e.deltaY < 0 && isAtTop && window.scrollY > 0) {
      window.scrollBy({ top: e.deltaY, behavior: 'auto' })
    }
  }

  if (selectedPost) {
    const isDraft = selectedPost.status === 'Draft'
    const adminSession = getStoredSession()
    const isAdmin = !!adminSession

    if (isDraft && !isAdmin) {
      return (
        <div className="raf-article-view-wrapper" style={{ padding: '80px 20px', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ maxWidth: '520px', width: '100%', background: '#ffffff', padding: '40px 30px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', textAlign: 'center' }}>
            <div style={{ fontSize: '44px', marginBottom: '16px' }}>📝</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 750, color: '#0f172a', marginBottom: '10px' }}>Guide Under Editorial Review</h2>
            <p style={{ color: '#64748b', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '24px' }}>
              This machinery equipment guide is currently undergoing engineering editorial review and will be published once finalized.
            </p>
            <Link to="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 22px', background: '#0066ff', color: '#ffffff', borderRadius: '10px', textDecoration: 'none', fontWeight: 650, fontSize: '0.9rem' }}>
              &larr; Browse Published Guides
            </Link>
          </div>
        </div>
      )
    }

    const approvedComments = comments.filter(
      (c) => c.postId === selectedPost.id && c.status === 'Approved'
    )

    return (
      <div className="raf-article-view-wrapper">
        <div className="raf-article-container">
          {/* Admin Draft Banner */}
          {isDraft && (
            <div style={{
              background: '#fffbeb',
              border: '1px solid #f59e0b',
              color: '#92400e',
              padding: '12px 18px',
              borderRadius: '10px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', fontWeight: 650 }}>
                <span>⚠️ DRAFT PREVIEW MODE:</span>
                <span style={{ fontWeight: 400 }}>This article is currently an unpublished draft and hidden from public visitors.</span>
              </div>
              <Link to="/ourcmskiuq" style={{ color: '#b45309', fontWeight: 700, fontSize: '0.82rem', textDecoration: 'underline' }}>
                Open in CMS Editor &rarr;
              </Link>
            </div>
          )}

          {/* Breadcrumb Navigation */}
          <nav className="raf-breadcrumb" aria-label="Breadcrumb">
            <Link to="/" className="raf-bc-link">Home</Link>
            <span className="raf-bc-sep">&rsaquo;</span>
            <Link to="/blog" className="raf-bc-link">Machinery Guides</Link>
            <span className="raf-bc-sep">&rsaquo;</span>
            <span className="raf-bc-link" onClick={() => { setActiveCategory(selectedPost.category); navigate('/blog') }}>
              {selectedPost.category}
            </span>
            <span className="raf-bc-sep">&rsaquo;</span>
            <span className="raf-bc-current">{selectedPost.title}</span>
          </nav>

          {/* Main Content Layout: Two-Column Dual-Scroll Layout (Matching Reference Images 1 & 2) */}
          <div className="raf-main-grid-layout">
            {/* Primary Column: Independently scrollable, fixed on screen */}
            <main className="raf-primary-column" onWheel={handleDualColumnWheel}>
              {/* Top Bar: Category Pill */}
              <div className="raf-meta-top-row">
                <div className="raf-category-pill">
                  <span className="raf-pill-dot" />
                  <span className="raf-pill-text">{selectedPost.category.toUpperCase()}</span>
                </div>
              </div>

              {/* Article Main Headline */}
              <h1 className="raf-article-headline">{selectedPost.title}</h1>

              {/* Excerpt with Red Vertical Line */}
              <p className="raf-article-excerpt-bar">{selectedPost.excerpt}</p>

              {/* Featured Cover Image */}
              <div className="raf-hero-image-box">
                <img
                  src={selectedPost.image}
                  alt={selectedPost.title}
                  className="raf-hero-image"
                  loading="eager"
                />
              </div>

              {/* Author & Published Info Bar */}
              <div className="raf-author-row">
                <div className="raf-author-avatar">
                  {selectedPost.author?.charAt(0).toUpperCase() || 'H'}
                </div>
                <div className="raf-author-details">
                  <span className="raf-author-name">{selectedPost.author || 'Happy Machinery Editorial'}</span>
                  <span className="raf-publish-date">Published {formatFullDate(selectedPost.date)} &bull; {selectedPost.readTime}</span>
                </div>
              </div>

              {/* Rich Body Content */}
              <article className="raf-body-content">
                {selectedPost.content.map((paragraph, idx) => {
                  if (idx === 0 && paragraph.trim().toLowerCase() === selectedPost.title.trim().toLowerCase()) return null
                  return renderMarkdownToReact(paragraph, idx)
                })}
              </article>

              {/* Key Takeaways Box */}
              {selectedPost.keyTakeaways && selectedPost.keyTakeaways.length > 0 && (
                <div id="key-takeaways" className="raf-takeaways-card">
                  <div className="raf-takeaways-header">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <h3>Key Takeaways & Jobsite Essentials</h3>
                  </div>
                  <ul className="raf-takeaways-list">
                    {selectedPost.keyTakeaways.map((item, idx) => (
                      <li key={idx}>
                        <span className="raf-check-icon">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Discussion / Comments Section */}
              <section id="discussion-comments" className="raf-comments-section" aria-labelledby="raf-discussion-heading">
                {/* Empty Comments Card (Matching Screenshot 2) */}
                {approvedComments.length === 0 ? (
                  <div className="raf-no-comments-box">
                    <div className="raf-no-comments-icon">
                      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </div>
                    <h3 className="raf-no-comments-title">No comments yet</h3>
                    <p className="raf-no-comments-desc">
                      Be the first to share your thoughts, ask a technical question, or provide feedback on this guide!
                    </p>
                  </div>
                ) : (
                  <div className="raf-comments-list-box">
                    <div className="raf-comments-header-row">
                      <h3 id="raf-discussion-heading">Comments & Discussion ({approvedComments.length})</h3>
                      <a href="#leave-comment-form" className="raf-jump-comment-link">+ Add Comment</a>
                    </div>
                    {approvedComments.map((comment) => (
                      <article className="raf-comment-card" key={comment.id}>
                        <div className="raf-comment-avatar">
                          {comment.author.charAt(0).toUpperCase()}
                        </div>
                        <div className="raf-comment-content">
                          <div className="raf-comment-meta">
                            <strong>{comment.author}</strong>
                            <time>{comment.date}</time>
                          </div>
                          <p className="raf-comment-body-text">{comment.text}</p>

                          {/* Backward compatibility for legacy single reply */}
                          {comment.reply && (
                            <div className="raf-seller-reply is-official-support">
                              <div className="raf-reply-meta">
                                <div className="raf-reply-author-info">
                                  <span className="raf-reply-mini-avatar">H</span>
                                  <strong>Happy Machinery</strong>
                                  <span className="raf-seller-tag">✓ Support</span>
                                </div>
                                <small className="raf-reply-date">{comment.reply.date}</small>
                              </div>
                              <p className="raf-reply-text">{comment.reply.text}</p>
                            </div>
                          )}

                          {/* Threaded multi-user replies */}
                          {(comment.replies || []).map((reply) => (
                            <div
                              className={`raf-seller-reply ${reply.isSeller ? 'is-official-support' : 'is-user-reply'}`}
                              key={reply.id}
                            >
                              <div className="raf-reply-meta">
                                <div className="raf-reply-author-info">
                                  <span className={`raf-reply-mini-avatar ${reply.isSeller ? 'seller' : ''}`}>
                                    {reply.author.charAt(0).toUpperCase()}
                                  </span>
                                  <strong>{reply.author}</strong>
                                  {reply.isSeller && (
                                    <span className="raf-seller-tag">✓ Support</span>
                                  )}
                                  {reply.replyToAuthor && (
                                    <span className="raf-reply-target-tag">
                                      @{reply.replyToAuthor}
                                    </span>
                                  )}
                                </div>
                                <small className="raf-reply-date">{reply.date}</small>
                              </div>
                              <p className="raf-reply-text">{reply.text}</p>
                              <div className="raf-subreply-action">
                                <button
                                  type="button"
                                  className="raf-subreply-btn"
                                  onClick={() => {
                                    setReplyingTo(comment.id)
                                    setReplyToUser(reply.author)
                                    setReplyText('')
                                    setReplyName('')
                                    setReplyEmail('')
                                  }}
                                >
                                  ↩ Reply to {reply.author}
                                </button>
                              </div>
                            </div>
                          ))}

                          <div className="raf-comment-actions-row">
                            <button
                              type="button"
                              className={`raf-like-btn ${likedComments.includes(comment.id) ? 'liked' : ''}`}
                              onClick={() => handleLikeComment(comment.id)}
                            >
                              👍 Helpful {comment.likes ? `(${comment.likes})` : ''}
                            </button>
                            <button
                              type="button"
                              className="raf-reply-btn"
                              onClick={() => {
                                setReplyingTo(comment.id)
                                setReplyToUser(comment.author)
                                setReplyText('')
                                setReplyName('')
                                setReplyEmail('')
                              }}
                            >
                              ↩ Reply
                            </button>
                          </div>

                          {/* Inline Reply Form (Available to Both Support & All Site Visitors) */}
                          {replyingTo === comment.id && (
                            <div className="raf-reply-form-inline">
                              <div className="raf-reply-form-header">
                                <span>
                                  Replying to <strong>@{replyToUser || comment.author}</strong>
                                </span>
                                <button
                                  type="button"
                                  className="raf-reply-close-btn"
                                  onClick={() => {
                                    setReplyingTo(null)
                                    setReplyToUser('')
                                  }}
                                  aria-label="Close reply form"
                                >
                                  ✕
                                </button>
                              </div>

                              {isAdmin && (
                                <label className="raf-reply-admin-toggle">
                                  <input
                                    type="checkbox"
                                    checked={isReplyingAsAdmin}
                                    onChange={(e) => setIsReplyingAsAdmin(e.target.checked)}
                                  />
                                  <span>Post officially as <strong>Happy Machinery (Seller Support)</strong></span>
                                </label>
                              )}

                              {!isReplyingAsAdmin && (
                                <div className="raf-reply-inputs-row">
                                  <input
                                    type="text"
                                    value={replyName}
                                    onChange={(e) => setReplyName(e.target.value)}
                                    placeholder="Your Name *"
                                    maxLength={60}
                                    required
                                    className="raf-form-input raf-reply-input"
                                  />
                                  <input
                                    type="email"
                                    value={replyEmail}
                                    onChange={(e) => setReplyEmail(e.target.value)}
                                    placeholder="Your Email * (never published)"
                                    maxLength={80}
                                    required
                                    className="raf-form-input raf-reply-input"
                                  />
                                </div>
                              )}

                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows={3}
                                placeholder={
                                  isReplyingAsAdmin
                                    ? 'Write official seller support response...'
                                    : `Write your reply to ${replyToUser || comment.author}...`
                                }
                                maxLength={1000}
                                className="raf-form-textarea raf-reply-textarea"
                              />

                              {replyError && (
                                <div style={{ color: '#dc2626', fontSize: '0.82rem', marginBottom: '8px' }}>
                                  {replyError}
                                </div>
                              )}

                              <div className="raf-reply-form-btns">
                                <button
                                  type="button"
                                  className="raf-btn-cancel"
                                  onClick={() => {
                                    setReplyingTo(null)
                                    setReplyToUser('')
                                    setReplyName('')
                                    setReplyEmail('')
                                    setReplyText('')
                                  }}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  className="raf-btn-submit-reply"
                                  onClick={() => handleReplySubmit(comment.id)}
                                >
                                  Post Reply &rarr;
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {/* Comment Submission Form (Name, Email, Message) */}
                <form id="leave-comment-form" className="raf-new-comment-form" onSubmit={handleCommentSubmit}>
                  <div className="raf-comment-form-heading">
                    <h4>Leave a Comment</h4>
                    <p>Your technical questions, jobsite feedback, and machinery questions are welcome.</p>
                  </div>

                  {commentSubmitted && (
                    <div className="raf-comment-success-alert">
                      ✓ Thank you! Your comment has been posted successfully and is now visible.
                    </div>
                  )}

                  {commentError && (
                    <div style={{ color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.88rem' }}>
                      {commentError}
                    </div>
                  )}

                  <div className="raf-form-grid-2col">
                    <div className="raf-form-field">
                      <label htmlFor="comment-name" className="raf-field-label">
                        Name or Company <span className="raf-req-star">*</span>
                      </label>
                      <input
                        id="comment-name"
                        type="text"
                        value={commentName}
                        onChange={(e) => setCommentName(e.target.value)}
                        placeholder="Your name or company"
                        required
                        maxLength={60}
                        className="raf-form-input"
                      />
                    </div>
                    <div className="raf-form-field">
                      <label htmlFor="comment-email" className="raf-field-label">
                        Email Address <span className="raf-req-star">*</span> <span className="raf-field-hint">(never published)</span>
                      </label>
                      <input
                        id="comment-email"
                        type="email"
                        value={commentEmail}
                        onChange={(e) => setCommentEmail(e.target.value)}
                        placeholder="yourname@example.com"
                        required
                        maxLength={80}
                        className="raf-form-input"
                      />
                    </div>
                  </div>

                  <div className="raf-form-field">
                    <label htmlFor="comment-message" className="raf-field-label">
                      Comment or Question <span className="raf-req-star">*</span>
                    </label>
                    <textarea
                      id="comment-message"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="What did you find most useful or have questions about?"
                      required
                      rows={4}
                      maxLength={1000}
                      className="raf-form-textarea"
                    />
                  </div>

                  <div className="raf-form-footer">
                    <span className="raf-form-char-count">{commentText.length}/1000</span>
                    <button type="submit" className="raf-submit-btn">
                      Post Comment &rarr;
                    </button>
                  </div>
                </form>
              </section>

              {/* Suggested / Related Articles Section (Matching User Request) */}
              {suggestedPosts.length > 0 && (
                <section id="suggested-articles" className="raf-suggested-section">
                  <div className="raf-suggested-header">
                    <div className="raf-suggested-title-wrap">
                      <span className="raf-suggested-badge">EXPLORE MORE</span>
                      <h3 className="raf-suggested-heading">Suggested Jobsite & Machinery Guides</h3>
                    </div>
                    <Link to="/blog" className="raf-suggested-view-all">
                      View All Articles &rarr;
                    </Link>
                  </div>

                  <div className="raf-suggested-grid">
                    {suggestedPosts.map((guide) => (
                      <article
                        key={guide.id}
                        className="raf-suggested-card"
                        onClick={() => {
                          setSelectedPost(guide)
                          navigate(getBlogPostPath(guide))
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                      >
                        <div className="raf-suggested-img-wrap">
                          <img src={guide.image} alt={guide.title} className="raf-suggested-img" loading="lazy" />
                          <span className="raf-suggested-cat">{guide.category}</span>
                        </div>
                        <div className="raf-suggested-body">
                          <span className="raf-suggested-meta">{formatShortDate(guide.date)} &bull; {guide.readTime || '5 min read'}</span>
                          <h4 className="raf-suggested-title">{guide.title}</h4>
                          <p className="raf-suggested-excerpt">{guide.excerpt}</p>
                          <span className="raf-suggested-read-link">Read Guide &rarr;</span>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </main>

            {/* Right Sticky Sidebar: Fixed on screen, independently scrollable (Matching Image 1 & 2) */}
            <aside className="raf-sidebar-column custom-sidebar-scroll" onWheel={handleDualColumnWheel}>
              {/* Widget: Quick Share (Positioned at Top of Sidebar above 'On This Page') */}
              <div className="raf-sidebar-card raf-quick-share-card">
                <div className="raf-quick-share-header">
                  <span className="raf-quick-share-label">SHARE THIS ARTICLE</span>
                  {copiedLink && <span className="raf-copied-pill">✓ Link Copied!</span>}
                </div>
                <div className="raf-quick-share-grid">
                  {/* Facebook */}
                  <button
                    type="button"
                    className="raf-share-icon-btn fb-btn"
                    title="Share on Facebook"
                    aria-label="Share on Facebook"
                    onClick={() => {
                      const url = encodeURIComponent(window.location.href)
                      window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=620,height=580')
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.026 4.388 11.02 10.125 11.927v-8.436H7.078v-3.491h3.047V9.414c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.93-1.956 1.885v2.264h3.328l-.532 3.491h-2.796V24C19.612 23.093 24 18.099 24 12.073z"/>
                    </svg>
                  </button>

                  {/* X (Twitter) */}
                  <button
                    type="button"
                    className="raf-share-icon-btn x-btn"
                    title="Share on X"
                    aria-label="Share on X"
                    onClick={() => {
                      const url = encodeURIComponent(window.location.href)
                      const text = encodeURIComponent(selectedPost.title)
                      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank', 'width=620,height=580')
                    }}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </button>

                  {/* LinkedIn */}
                  <button
                    type="button"
                    className="raf-share-icon-btn in-btn"
                    title="Share on LinkedIn"
                    aria-label="Share on LinkedIn"
                    onClick={() => {
                      const url = encodeURIComponent(window.location.href)
                      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'width=620,height=580')
                    }}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.31a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z"/>
                    </svg>
                  </button>

                  {/* Reddit */}
                  <button
                    type="button"
                    className="raf-share-icon-btn reddit-btn"
                    title="Share on Reddit"
                    aria-label="Share on Reddit"
                    onClick={() => {
                      const url = encodeURIComponent(window.location.href)
                      const title = encodeURIComponent(selectedPost.title)
                      window.open(`https://www.reddit.com/submit?url=${url}&title=${title}`, '_blank', 'width=700,height=600')
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M24 12a2.8 2.8 0 0 0-4.77-2 13.5 13.5 0 0 0-6.52-2.08l1.1-5.16 3.58.76a2 2 0 1 0 .22-1.06l-4.1-.87a.54.54 0 0 0-.64.42l-1.25 5.88A13.7 13.7 0 0 0 4.74 10 2.8 2.8 0 1 0-1.33 2.48A5.4 5.4 0 0 0 0 15c0 3.94 5.37 7.13 12 7.13S24 18.94 24 15a5.3 5.3 0 0 0-1.34-3.51A2.8 2.8 0 0 0 24 12zM7 13.8a1.75 1.75 0 1 1 3.5 0 1.75 1.75 0 0 1-3.5 0zm9.7 4.55c-1.31 1.31-3.81 1.42-4.7 1.42-.88 0-3.38-.11-4.69-1.42a.54.54 0 0 1 .76-.76c.83.83 2.62 1.1 3.93 1.1s3.1-.27 3.93-1.1a.54.54 0 0 1 .76.76zm-1.45-2.8a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5z"/>
                    </svg>
                  </button>

                  {/* Instagram (IG) */}
                  <button
                    type="button"
                    className="raf-share-icon-btn ig-btn"
                    title="Copy Link and Open Instagram"
                    aria-label="Copy Link and Open Instagram"
                    onClick={() => {
                      void navigator.clipboard.writeText(window.location.href)
                      setCopiedLink(true)
                      setTimeout(() => setCopiedLink(false), 2200)
                      window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer')
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </button>

                  {/* Copy Link */}
                  <button
                    type="button"
                    className={`raf-share-icon-btn link-btn ${copiedLink ? 'copied' : ''}`}
                    title={copiedLink ? 'Link Copied!' : 'Copy Article Link'}
                    aria-label="Copy Article Link"
                    onClick={() => {
                      void navigator.clipboard.writeText(window.location.href)
                      setCopiedLink(true)
                      setTimeout(() => setCopiedLink(false), 2200)
                    }}
                  >
                    {copiedLink ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Widget 2: On This Page / Table of Contents */}
              {tocItems.length > 0 && (
                <div className="raf-sidebar-card raf-toc-card">
                  <div className="raf-sidebar-card-header">
                    <div className="raf-card-title-left">
                      <span className="raf-book-icon">📖</span>
                      <h3>On This Page</h3>
                    </div>
                    <span className="raf-toc-count-badge">{tocItems.length} sections</span>
                  </div>
                  <nav className="raf-toc-nav" aria-label="Table of Contents">
                    <ul className="raf-toc-list">
                      {tocItems.map((item) => (
                        <li key={item.id} className="raf-toc-item">
                          <button
                            type="button"
                            className={`raf-toc-link ${activeTocId === item.id ? 'active' : ''}`}
                            onClick={() => handleScrollToToc(item.id)}
                            title={item.text}
                          >
                            <span className="raf-toc-num">{item.num}.</span>
                            <span className="raf-toc-text">{item.text}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              )}

              {/* Widget 3: Series Cluster Playlist (Matching Image 2) */}
              {seriesPlaylist.length > 0 && (
                <div className="raf-sidebar-card raf-playlist-card">
                  <div className="raf-sidebar-card-header">
                    <div className="raf-card-title-left">
                      <span className="raf-play-icon">▶</span>
                      <h3>SERIES: MACHINERY PLAYLIST</h3>
                    </div>
                    <span className="raf-playlist-count-badge">{seriesPlaylist.length} Guides</span>
                  </div>
                  <div className="raf-playlist-list">
                    {seriesPlaylist.map((p) => {
                      const isCurrent = p.id === selectedPost.id
                      return (
                        <div
                          key={p.id}
                          className={`raf-playlist-item ${isCurrent ? 'active' : ''}`}
                          onClick={() => {
                            if (!isCurrent) {
                              setSelectedPost(p)
                              navigate(getBlogPostPath(p))
                              window.scrollTo({ top: 0, behavior: 'smooth' })
                            }
                          }}
                        >
                          <div className="raf-playlist-item-content">
                            <span className="raf-playlist-title">{p.title}</span>
                            {isCurrent && (
                              <span className="raf-playlist-reading-pill">
                                <span className="blue-dot" /> Currently Reading
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Widget 4: Popular Articles (Matching Image 1) */}
              <div className="raf-sidebar-card">
                <div className="raf-sidebar-card-header">
                  <div className="raf-card-title-left">
                    <span className="raf-flame-icon">🔥</span>
                    <h3>Popular Articles</h3>
                  </div>
                  <button
                    type="button"
                    className="raf-view-all-link"
                    onClick={() => {
                      setActiveCategory('All')
                      setSearchQuery('')
                      navigate('/blog')
                    }}
                  >
                    VIEW ALL &rarr;
                  </button>
                </div>

                <div className="raf-popular-list">
                  {popularPosts.map((post, idx) => (
                    <div
                      key={post.id}
                      className="raf-popular-item"
                      onClick={() => {
                        setSelectedPost(post)
                        navigate(getBlogPostPath(post))
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                    >
                      <div className="raf-popular-item-left">
                        <span className={`raf-rank-badge rank-${idx + 1}`}>
                          {`0${idx + 1}`}
                        </span>
                        <div className="raf-popular-item-info">
                          <span className="raf-item-kicker">{post.category.toUpperCase()}</span>
                          <h4 className="raf-item-title">{post.title}</h4>
                          <span className="raf-item-meta">
                            {formatShortDate(post.date)} &bull; {post.readTime || '5 min read'}
                          </span>
                        </div>
                      </div>
                      <div className="raf-popular-item-thumb">
                        <img src={post.image} alt={post.title} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Widget 5: Key Categories (Matching Image 1) */}
              <div className="raf-sidebar-card">
                <div className="raf-sidebar-card-header">
                  <div className="raf-card-title-left">
                    <span className="raf-folder-icon">📁</span>
                    <h3>KEY CATEGORIES</h3>
                  </div>
                  <button
                    type="button"
                    className="raf-view-all-link"
                    onClick={() => {
                      setActiveCategory('All')
                      navigate('/blog')
                    }}
                  >
                    All &rarr;
                  </button>
                </div>

                <div className="raf-categories-list">
                  {categoryCounts.map((cat) => (
                    <div
                      key={cat.name}
                      className={`raf-category-row ${activeCategory === cat.name ? 'active' : ''}`}
                      onClick={() => {
                        setActiveCategory(cat.name)
                        navigate('/blog')
                      }}
                    >
                      <span className="raf-cat-name">{cat.name}</span>
                      <span className="raf-cat-count">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Widget 6: Topics & Tags (Matching Image 1) */}
              <div className="raf-sidebar-card">
                <div className="raf-sidebar-card-header">
                  <div className="raf-card-title-left">
                    <span className="raf-tag-icon">🏷️</span>
                    <h3>TOPICS & TAGS</h3>
                  </div>
                  <span className="raf-tags-count-text">8 tags</span>
                </div>
                <div className="raf-tags-cloud">
                  {['#Productivity', '#Troubleshooting', '#Maintenance', '#Safety', '#Hydraulics', '#EquipmentGuide', '#SkidSteer', '#JobsiteOps'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className="raf-tag-pill"
                      onClick={() => {
                        setActiveCategory('All')
                        setSearchQuery(tag.replace('#', ''))
                        navigate('/blog')
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

            </aside>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // VIEW B: MAIN BLOG LISTING PAGE (/blog) WITH MATCHING RAFVEX DESIGN
  // ============================================================================
  const featuredPost = filteredPosts[0] || posts[0]
  const regularPosts = filteredPosts.length > 1 ? filteredPosts.slice(1) : filteredPosts

  return (
    <div className="raf-blog-index-wrapper">
      <div className="raf-blog-container">
        {/* Editorial Header */}
        <header className="raf-index-hero">
          <span className="raf-hero-eyebrow">HAPPY MACHINERY EDITORIAL & KNOWLEDGE</span>
          <h1 className="raf-hero-title">Heavy Machinery & Jobsite Insights</h1>
          <p className="raf-hero-desc">
            Technical equipment breakdowns, skid steer comparisons, hydraulic maintenance, and expert field advice.
          </p>

          {/* Quick Search */}
          <div className="raf-hero-search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search machinery guides, hydraulics, skid steers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="raf-hero-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="raf-search-clear-btn"
                onClick={() => setSearchQuery('')}
              >
                &times;
              </button>
            )}
          </div>
        </header>

        {/* Category Pills Bar */}
        <div className="raf-category-pills-bar">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`raf-filter-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              <span className="raf-pill-bullet" />
              <span>{cat}</span>
            </button>
          ))}
        </div>

        {/* Featured Story Spotlight (When not filtering heavily) */}
        {!searchQuery.trim() && activeCategory === 'All' && featuredPost && (
          <div className="raf-featured-spotlight-card" onClick={() => setSelectedPost(featuredPost)}>
            <div className="raf-featured-thumb-col">
              <img src={featuredPost.image} alt={featuredPost.title} />
              <span className="raf-featured-tag">FEATURED STORY</span>
            </div>
            <div className="raf-featured-content-col">
              <div className="raf-featured-meta">
                <span className="raf-featured-cat">{featuredPost.category.toUpperCase()}</span>
                <span>&bull;</span>
                <span>{formatFullDate(featuredPost.date)}</span>
                <span>&bull;</span>
                <span>{featuredPost.readTime}</span>
              </div>
              <h2 className="raf-featured-headline">{featuredPost.title}</h2>
              <p className="raf-featured-excerpt">{featuredPost.excerpt}</p>
              <div className="raf-featured-footer">
                <span className="raf-read-link">Read Full Guide &rarr;</span>
              </div>
            </div>
          </div>
        )}

        {/* Full-Width Grid of Articles (No Sidebar on Front Page - 3 Blogs per Row) */}
        <div className="raf-front-articles-container">
          {searchQuery.trim() && (
            <div className="raf-search-banner">
              <span>Showing search results for "<strong>{searchQuery}</strong>" ({filteredPosts.length} guides found)</span>
              <button onClick={() => setSearchQuery('')}>Clear Search &times;</button>
            </div>
          )}

          <div className="raf-posts-grid">
            {(activeCategory === 'All' && !searchQuery.trim() ? regularPosts : filteredPosts).map((post) => (
              <article
                key={post.id}
                className="raf-post-card"
                onClick={() => {
                  setSelectedPost(post)
                  navigate(getBlogPostPath(post))
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              >
                <div className="raf-card-image-box">
                  <img src={post.image} alt={post.title} loading="lazy" />
                  <span className="raf-floating-cat-tag">{post.category}</span>
                </div>
                <div className="raf-card-body">
                  <span className="raf-card-kicker">{post.category.toUpperCase()}</span>
                  <h3 className="raf-card-title">{post.title}</h3>
                  <p className="raf-card-excerpt">{post.excerpt}</p>
                  <div className="raf-card-footer">
                    <span className="raf-card-date">{formatShortDate(post.date)}</span>
                    <span className="raf-card-read-time">{post.readTime || '5 min read'}</span>
                  </div>
                </div>
              </article>
            ))}

            {filteredPosts.length === 0 && (
              <div className="raf-no-results-box">
                <h3>No Guides Found</h3>
                <p>We couldn't find any articles matching your search query. Try another keyword or browse all categories.</p>
                <button
                  className="raf-btn-reset-filters"
                  onClick={() => {
                    setActiveCategory('All')
                    setSearchQuery('')
                  }}
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
