import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { DEFAULT_COMMENTS, DEFAULT_POSTS, BlogComment, BlogPost } from './adminData'
import { readPersistentContent } from '../data/persistentStorage'
import { readSharedContent } from '../data/sharedContentStorage'
import SocialShareButtons from '../components/SocialShareButtons'
import { getBlogPostPath, getBlogPostSlug } from '../data/blogUrls'
import './Blog.css'

export function renderMarkdownToReact(text: string, key: string | number) {
  const line = text.trim()

  // Support HTML headers
  const h1Html = line.match(/^<h1>(.*?)<\/h1>$/i)
  if (h1Html) return <h2 key={key} className="blog-body-h2">{h1Html[1]}</h2>

  const h2Html = line.match(/^<h2>(.*?)<\/h2>$/i)
  if (h2Html) return <h3 key={key} className="blog-body-h3">{h2Html[1]}</h3>

  const h3Html = line.match(/^<h3>(.*?)<\/h3>$/i)
  if (h3Html) return <h4 key={key} className="blog-body-h4">{h3Html[1]}</h4>

  const h4Html = line.match(/^<h4>(.*?)<\/h4>$/i)
  if (h4Html) return <h5 key={key} className="blog-body-h5">{h4Html[1]}</h5>

  // Support plain text header markers
  if (line.toLowerCase().startsWith('h1: ')) {
    return <h2 key={key} className="blog-body-h2">{line.slice(4)}</h2>
  }
  if (line.toLowerCase().startsWith('h2: ')) {
    return <h3 key={key} className="blog-body-h3">{line.slice(4)}</h3>
  }
  if (line.toLowerCase().startsWith('h3: ')) {
    return <h4 key={key} className="blog-body-h4">{line.slice(4)}</h4>
  }
  if (line.toLowerCase().startsWith('h4: ')) {
    return <h5 key={key} className="blog-body-h5">{line.slice(4)}</h5>
  }

  // 1. Heading 1: "# Text" -> Map to h2 for single-H1 SEO compliance
  if (line.startsWith('# ')) {
    return <h2 key={key} className="blog-body-h2">{line.slice(2)}</h2>
  }
  // 2. Heading 2: "## Text" -> Map to h3
  if (line.startsWith('## ')) {
    return <h3 key={key} className="blog-body-h3">{line.slice(3)}</h3>
  }
  // 3. Heading 3: "### Text" -> Map to h4
  if (line.startsWith('### ')) {
    return <h4 key={key} className="blog-body-h4">{line.slice(4)}</h4>
  }
  // 4. Heading 4: "#### Text" -> Map to h5
  if (line.startsWith('#### ')) {
    return <h5 key={key} className="blog-body-h5">{line.slice(5)}</h5>
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

  // Simple Markdown links: [text](url)
  const linkRegex = /\[(.*?)\]\((.*?)\)/g
  const parts: (string | React.ReactNode)[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = linkRegex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.substring(lastIndex, match.index))
    }
    const [, linkText, linkUrl] = match
    const isInternal = linkUrl.startsWith('/') || linkUrl.includes('happymachinery.com')
    if (isInternal) {
      parts.push(
        <Link key={`${key}-${match.index}`} to={linkUrl} className="blog-body-link">
          {linkText}
        </Link>
      )
    } else {
      parts.push(
        <a key={`${key}-${match.index}`} href={linkUrl} target="_blank" rel="noopener noreferrer" className="blog-body-link external">
          {linkText}
        </a>
      )
    }
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < line.length) {
    parts.push(line.substring(lastIndex))
  }

  return (
    <p key={key} className="blog-body-p">
      {parts.length > 0 ? parts : line}
    </p>
  )
}

// Deterministic helper to get a view count for any post
export const getPostViews = (post: BlogPost): number => {
  return ((post.id * 173) % 430) + 120
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
  const [commentText, setCommentText] = useState('')
  const [commentSubmitted, setCommentSubmitted] = useState(false)
  const [replyingTo, setReplyingTo] = useState<number | null>(null)
  const [replyText, setReplyText] = useState('')
  const [replyName, setReplyName] = useState('')
  const [likedComments, setLikedComments] = useState<number[]>(() => {
    const saved = localStorage.getItem('happy-machinery-liked-comments')
    return saved ? JSON.parse(saved) : []
  })
  const [bookmarkedPosts, setBookmarkedPosts] = useState<number[]>(() => {
    const saved = localStorage.getItem('happy-bookmarked-posts')
    return saved ? JSON.parse(saved) : []
  })
  const [showShareModal, setShowShareModal] = useState(false)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterSuccess, setNewsletterSuccess] = useState(false)
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
    } else {
      navigate('/blog')
    }
  }

  // Canonical redirect for old ?post=ID links
  useEffect(() => {
    if (!slug && postId && selectedPost) {
      navigate(getBlogPostPath(selectedPost), { replace: true })
    }
  }, [navigate, postId, selectedPost, slug])

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

  // Sync comments
  useEffect(() => {
    const syncComments = () => {
      const saved = localStorage.getItem('happy-machinery-comments')
      setComments(saved ? JSON.parse(saved) : DEFAULT_COMMENTS)
    }
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
    setCommentText('')
  }, [selectedPost?.id])

  const toggleBookmark = (id: number) => {
    const updated = bookmarkedPosts.includes(id)
      ? bookmarkedPosts.filter((item) => item !== id)
      : [...bookmarkedPosts, id]
    setBookmarkedPosts(updated)
    localStorage.setItem('happy-bookmarked-posts', JSON.stringify(updated))
  }

  const handleShareClick = () => {
    if (navigator.share && selectedPost) {
      navigator.share({
        title: selectedPost.title,
        text: selectedPost.excerpt,
        url: window.location.href
      }).catch(() => setShowShareModal(true))
    } else {
      setShowShareModal(true)
    }
  }

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newsletterEmail.trim()) return
    setNewsletterSuccess(true)
    setNewsletterEmail('')
    setTimeout(() => setNewsletterSuccess(false), 4500)
  }

  const handleCommentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedPost || !commentName.trim() || !commentText.trim()) return
    const newComment: BlogComment = {
      id: Date.now(),
      postId: selectedPost.id,
      postTitle: selectedPost.title,
      author: commentName.trim(),
      text: commentText.trim(),
      date: new Date().toISOString().slice(0, 10),
      status: 'Approved'
    }
    const updatedComments = [newComment, ...comments]
    setComments(updatedComments)
    localStorage.setItem('happy-machinery-comments', JSON.stringify(updatedComments))
    window.dispatchEvent(new Event('comments-updated'))
    setCommentName('')
    setCommentText('')
    setCommentSubmitted(true)
  }

  const handleSellerReply = (commentId: number) => {
    if (!replyText.trim()) return
    const updatedComments = comments.map((comment) =>
      comment.id === commentId
        ? {
            ...comment,
            replies: [
              ...(comment.replies || []),
              {
                id: Date.now(),
                author: 'Happy Machinery',
                text: replyText.trim(),
                date: new Date().toISOString().slice(0, 10),
                isSeller: true
              }
            ]
          }
        : comment
    )
    setComments(updatedComments)
    localStorage.setItem('happy-machinery-comments', JSON.stringify(updatedComments))
    window.dispatchEvent(new Event('comments-updated'))
    setReplyingTo(null)
    setReplyText('')
    setReplyName('')
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

  const handleCustomerReply = (commentId: number) => {
    if (!replyName.trim() || !replyText.trim()) return
    const updatedComments = comments.map((comment) =>
      comment.id === commentId
        ? {
            ...comment,
            replies: [
              ...(comment.replies || []),
              {
                id: Date.now(),
                author: replyName.trim(),
                text: replyText.trim(),
                date: new Date().toISOString().slice(0, 10)
              }
            ]
          }
        : comment
    )
    setComments(updatedComments)
    localStorage.setItem('happy-machinery-comments', JSON.stringify(updatedComments))
    window.dispatchEvent(new Event('comments-updated'))
    setReplyingTo(null)
    setReplyName('')
    setReplyText('')
  }

  // Extract unique categories dynamically
  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(posts.map((p) => p.category)))]
  }, [posts])

  // Filter posts based on Category and Search Query
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory = activeCategory === 'All' || post.category === activeCategory
      const query = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !query ||
        post.title.toLowerCase().includes(query) ||
        post.excerpt.toLowerCase().includes(query) ||
        post.category.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [posts, activeCategory, searchQuery])

  // Popular posts sorted by view count
  const popularPosts = useMemo(() => {
    return [...posts]
      .sort((a, b) => getPostViews(b) - getPostViews(a))
      .slice(0, 5)
  }, [posts])

  // Category counts for popular categories sidebar
  const categoryCounts = useMemo(() => {
    return categories
      .filter((cat) => cat !== 'All')
      .map((cat) => ({
        name: cat,
        count: posts.filter((p) => p.category === cat).length
      }))
  }, [categories, posts])

  // Related Stories for the bottom of article reading page (4 items)
  const relatedStories = useMemo(() => {
    if (!selectedPost) return []
    const sameCat = posts.filter((p) => p.id !== selectedPost.id && p.category === selectedPost.category)
    if (sameCat.length >= 4) return sameCat.slice(0, 4)
    const others = posts.filter((p) => p.id !== selectedPost.id && p.category !== selectedPost.category)
    return [...sameCat, ...others].slice(0, 4)
  }, [posts, selectedPost])

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
  if (selectedPost) {
    const isBookmarked = bookmarkedPosts.includes(selectedPost.id)
    const approvedComments = comments.filter(
      (c) => c.postId === selectedPost.id && c.status === 'Approved'
    )

    return (
      <div className="raf-article-view-wrapper">
        {/* Share Modal Dialog */}
        {showShareModal && (
          <div className="raf-modal-backdrop" onClick={() => setShowShareModal(false)}>
            <div className="raf-share-modal" onClick={(e) => e.stopPropagation()}>
              <div className="raf-share-modal-header">
                <h3>Share this Guide</h3>
                <button className="raf-share-close" onClick={() => setShowShareModal(false)}>
                  &times;
                </button>
              </div>
              <p className="raf-share-subtitle">Share with your team, jobsite contractors, or network.</p>
              <div className="raf-share-icons-grid">
                <SocialShareButtons
                  url={window.location.href}
                  title={selectedPost.title}
                  image={selectedPost.image}
                />
              </div>
              <div className="raf-copy-url-row">
                <input
                  type="text"
                  readOnly
                  value={window.location.href}
                  className="raf-copy-url-input"
                />
                <button
                  type="button"
                  className="raf-copy-url-btn"
                  onClick={() => {
                    void navigator.clipboard.writeText(window.location.href)
                    alert('Article URL copied to clipboard!')
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="raf-article-container">
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

          {/* Top Bar: Category Pill & Actions (Read, Save, Share) */}
          <div className="raf-meta-top-row">
            <div className="raf-category-pill">
              <span className="raf-pill-dot" />
              <span className="raf-pill-text">{selectedPost.category.toUpperCase()}</span>
            </div>

            <div className="raf-actions-group">
              <span className="raf-badge-read">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                {selectedPost.readTime || '5 min read'}
              </span>

              <button
                type="button"
                className={`raf-action-btn ${isBookmarked ? 'active' : ''}`}
                onClick={() => toggleBookmark(selectedPost.id)}
                title={isBookmarked ? 'Remove from saved' : 'Save article'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
                <span>{isBookmarked ? 'Saved' : 'Save'}</span>
              </button>

              <button
                type="button"
                className="raf-action-btn"
                onClick={handleShareClick}
                title="Share article"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                <span>Share &rsaquo;</span>
              </button>
            </div>
          </div>

          {/* Article Main Headline */}
          <h1 className="raf-article-headline">{selectedPost.title}</h1>

          {/* Excerpt with Red Vertical Line */}
          <p className="raf-article-excerpt-bar">{selectedPost.excerpt}</p>

          {/* Main 2-Column Content Layout */}
          <div className="raf-main-grid-layout">
            {/* Left Column: Article Body & Comments */}
            <main className="raf-primary-column">
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
                {selectedPost.content.map((paragraph, idx) => renderMarkdownToReact(paragraph, idx))}
              </article>

              {/* Key Takeaways Box */}
              {selectedPost.keyTakeaways && selectedPost.keyTakeaways.length > 0 && (
                <div className="raf-takeaways-card">
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
              <section className="raf-comments-section" aria-labelledby="raf-discussion-heading">
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
                          <p>{comment.text}</p>

                          {comment.reply && (
                            <div className="raf-seller-reply">
                              <strong>Happy Machinery (Seller Support)</strong>
                              <p>{comment.reply.text}</p>
                              <small>{comment.reply.date}</small>
                            </div>
                          )}

                          {(comment.replies || []).map((reply) => (
                            <div className="raf-seller-reply customer-reply" key={reply.id}>
                              <strong>{reply.author} {reply.isSeller && <span className="raf-seller-tag">Support</span>}</strong>
                              <p>{reply.text}</p>
                              <small>{reply.date}</small>
                            </div>
                          ))}

                          <div className="raf-comment-actions-row">
                            <button
                              type="button"
                              className={`raf-like-btn ${likedComments.includes(comment.id) ? 'liked' : ''}`}
                              onClick={() => handleLikeComment(comment.id)}
                            >
                              👍 Like {comment.likes ? `(${comment.likes})` : ''}
                            </button>
                            <button
                              type="button"
                              className="raf-reply-btn"
                              onClick={() => {
                                setReplyingTo(comment.id)
                                setReplyText('')
                                setReplyName('')
                              }}
                            >
                              ↩ Reply
                            </button>
                          </div>

                          {replyingTo === comment.id && (
                            <div className="raf-reply-form-inline">
                              {!isAdmin && (
                                <input
                                  value={replyName}
                                  onChange={(e) => setReplyName(e.target.value)}
                                  placeholder="Your name"
                                  maxLength={60}
                                  className="raf-form-input"
                                />
                              )}
                              <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows={2}
                                placeholder={isAdmin ? 'Reply as Happy Machinery support...' : 'Write your reply...'}
                                className="raf-form-textarea"
                              />
                              <div className="raf-reply-form-btns">
                                <button
                                  type="button"
                                  className="raf-btn-cancel"
                                  onClick={() => setReplyingTo(null)}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  className="raf-btn-submit-reply"
                                  onClick={() => isAdmin ? handleSellerReply(comment.id) : handleCustomerReply(comment.id)}
                                >
                                  Submit Reply
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {/* Comment Submission Form */}
                <form className="raf-new-comment-form" onSubmit={handleCommentSubmit}>
                  <h4>Leave a Comment</h4>
                  <p>Your technical questions and jobsite feedback are welcome.</p>

                  {commentSubmitted && (
                    <div className="raf-comment-success-alert">
                      ✓ Thank you! Your comment has been posted successfully.
                    </div>
                  )}

                  <div className="raf-form-row">
                    <input
                      value={commentName}
                      onChange={(e) => setCommentName(e.target.value)}
                      placeholder="Your name or company"
                      required
                      maxLength={60}
                      className="raf-form-input"
                    />
                  </div>
                  <div className="raf-form-row">
                    <textarea
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
                    <span>{commentText.length}/1000</span>
                    <button type="submit" className="raf-submit-btn">
                      Post Comment &rarr;
                    </button>
                  </div>
                </form>
              </section>
            </main>

            {/* Right Sticky Sidebar */}
            <aside className="raf-sidebar-column">
              {/* Widget 1: Popular Articles (Matching Screenshot 1) */}
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
                      onClick={() => setSelectedPost(post)}
                    >
                      <div className="raf-popular-item-left">
                        <span className={`raf-rank-badge rank-${idx + 1}`}>
                          {`0${idx + 1}`}
                        </span>
                        <div className="raf-popular-item-info">
                          <span className="raf-item-kicker">{post.category.toUpperCase()}</span>
                          <h4 className="raf-item-title">{post.title}</h4>
                          <span className="raf-item-meta">
                            👁 {getPostViews(post)} views &bull; {formatShortDate(post.date)}
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

              {/* Widget 2: Key Categories (Matching Screenshot 1) */}
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

              {/* Widget 3: Stay Ahead Newsletter (Matching Screenshot 2) */}
              <div className="raf-newsletter-card">
                <h3 className="raf-nl-title">Stay Ahead in Machinery</h3>
                <p className="raf-nl-desc">
                  Get our weekly digest of verified equipment breakdowns, machinery guides, and maintenance tips.
                </p>

                {newsletterSuccess ? (
                  <div className="raf-nl-success">
                    ✓ You're in! Check your inbox for equipment updates.
                  </div>
                ) : (
                  <form onSubmit={handleNewsletterSubmit} className="raf-nl-form">
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="Enter your work email"
                      required
                      className="raf-nl-input"
                    />
                    <button type="submit" className="raf-nl-submit-btn">
                      JOIN THE INNER CIRCLE
                    </button>
                  </form>
                )}

                <span className="raf-nl-footnote">Weekly edition. Zero spam.</span>
              </div>
            </aside>
          </div>

          {/* ====================================================================
              Bottom Section: MORE TO EXPLORE / Related Stories (Screenshot 2)
              ==================================================================== */}
          {relatedStories.length > 0 && (
            <section className="raf-related-stories-section">
              <div className="raf-related-header">
                <div>
                  <span className="raf-related-eyebrow">MORE TO EXPLORE</span>
                  <h2 className="raf-related-title">Related Stories</h2>
                </div>
                <button
                  type="button"
                  className="raf-view-category-link"
                  onClick={() => {
                    setActiveCategory(selectedPost.category)
                    navigate('/blog')
                  }}
                >
                  View Category &rarr;
                </button>
              </div>

              <div className="raf-related-grid">
                {relatedStories.map((post) => (
                  <article
                    key={post.id}
                    className="raf-related-card"
                    onClick={() => setSelectedPost(post)}
                  >
                    <div className="raf-related-thumb-wrapper">
                      <img src={post.image} alt={post.title} />
                      <span className="raf-floating-cat-tag">{post.category}</span>
                    </div>
                    <div className="raf-related-card-content">
                      <h3 className="raf-related-card-title">{post.title}</h3>
                      <p className="raf-related-card-snippet">{post.excerpt}</p>
                      <div className="raf-related-card-footer">
                        <span>{formatShortDate(post.date)}</span>
                        <span>{post.readTime || '5 min read'}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
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
                <span className="raf-views-badge">👁 {getPostViews(featuredPost)} views</span>
              </div>
            </div>
          </div>
        )}

        {/* Main 2-Column Content Layout */}
        <div className="raf-main-grid-layout">
          {/* Left Column: Posts Grid */}
          <div className="raf-primary-column">
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
                  onClick={() => setSelectedPost(post)}
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

          {/* Right Column: Sticky Sidebar */}
          <aside className="raf-sidebar-column">
            {/* Widget 1: Popular Articles */}
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
                    onClick={() => setSelectedPost(post)}
                  >
                    <div className="raf-popular-item-left">
                      <span className={`raf-rank-badge rank-${idx + 1}`}>
                        {`0${idx + 1}`}
                      </span>
                      <div className="raf-popular-item-info">
                        <span className="raf-item-kicker">{post.category.toUpperCase()}</span>
                        <h4 className="raf-item-title">{post.title}</h4>
                        <span className="raf-item-meta">
                          👁 {getPostViews(post)} views &bull; {formatShortDate(post.date)}
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

            {/* Widget 2: Key Categories */}
            <div className="raf-sidebar-card">
              <div className="raf-sidebar-card-header">
                <div className="raf-card-title-left">
                  <span className="raf-folder-icon">📁</span>
                  <h3>KEY CATEGORIES</h3>
                </div>
                <button
                  type="button"
                  className="raf-view-all-link"
                  onClick={() => setActiveCategory('All')}
                >
                  All &rarr;
                </button>
              </div>

              <div className="raf-categories-list">
                {categoryCounts.map((cat) => (
                  <div
                    key={cat.name}
                    className={`raf-category-row ${activeCategory === cat.name ? 'active' : ''}`}
                    onClick={() => setActiveCategory(cat.name)}
                  >
                    <span className="raf-cat-name">{cat.name}</span>
                    <span className="raf-cat-count">{cat.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 3: Newsletter Widget */}
            <div className="raf-newsletter-card">
              <h3 className="raf-nl-title">Stay Ahead in Machinery</h3>
              <p className="raf-nl-desc">
                Get our weekly digest of verified equipment breakdowns, machinery guides, and maintenance tips.
              </p>

              {newsletterSuccess ? (
                <div className="raf-nl-success">
                  ✓ You're in! Check your inbox for equipment updates.
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="raf-nl-form">
                  <input
                    type="email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your work email"
                    required
                    className="raf-nl-input"
                  />
                  <button type="submit" className="raf-nl-submit-btn">
                    JOIN THE INNER CIRCLE
                  </button>
                </form>
              )}

              <span className="raf-nl-footnote">Weekly edition. Zero spam.</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
