import { useState, useEffect } from 'react'
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

  // 4.5. Raw Image URL Auto-detection
  if (/^(https?:\/\/|\/images\/)[^\s]+$/i.test(line) && /\.(png|jpg|jpeg|webp|gif|svg)/i.test(line)) {
    return (
      <div key={key} className="blog-body-image-container">
        <img src={line} alt="Jobsite Media" className="blog-body-image" />
      </div>
    )
  }

  // 5. Image: "![Alt Text](url)"
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

  // 5.5. Handle raw HTML links: <a href="url" target="_blank" rel="nofollow" title="title">Link Text</a>
  const htmlLinkRegex = /<a\s+([^>]*?)href="([^"]*)"([^>]*?)>(.*?)<\/a>/gi
  if (htmlLinkRegex.test(line)) {
    htmlLinkRegex.lastIndex = 0
    const htmlParts = []
    let currentHtmlIdx = 0
    let htmlMatch

    while ((htmlMatch = htmlLinkRegex.exec(line)) !== null) {
      const matchIndex = htmlMatch.index
      const [fullMatch, attrBefore, url, attrAfter, linkText] = htmlMatch
      const attrs = (attrBefore + ' ' + attrAfter).trim()

      if (matchIndex > currentHtmlIdx) {
        htmlParts.push(line.slice(currentHtmlIdx, matchIndex))
      }

      const targetMatch = attrs.match(/target="([^"]*)"/i)
      const relMatch = attrs.match(/rel="([^"]*)"/i)
      const titleMatch = attrs.match(/title="([^"]*)"/i)

      const target = targetMatch ? targetMatch[1] : undefined
      const rel = relMatch ? relMatch[1] : undefined
      const title = titleMatch ? titleMatch[1] : undefined

      if (url.startsWith('/') || url.startsWith('#')) {
        htmlParts.push(
          <Link key={matchIndex} to={url} title={title} className="blog-body-link-internal">
            {linkText}
          </Link>
        )
      } else {
        htmlParts.push(
          <a
            key={matchIndex}
            href={url}
            target={target || '_blank'}
            rel={rel || 'noopener noreferrer'}
            title={title}
            className="blog-body-link-external"
          >
            {linkText} {target !== '_self' && '↗'}
          </a>
        )
      }

      currentHtmlIdx = matchIndex + fullMatch.length
    }

    if (currentHtmlIdx < line.length) {
      htmlParts.push(line.slice(currentHtmlIdx))
    }

    return (
      <p key={key} className="blog-body-p">
        {htmlParts}
      </p>
    )
  }

  // 6. Handle inline links: "[Link Text](url)"
  const parts = []
  let currentIndex = 0
  const linkRegex = /\[(.*?)\]\((.*?)\)/g
  let match

  while ((match = linkRegex.exec(line)) !== null) {
    const matchIndex = match.index
    const [fullMatch, linkText, url] = match

    // Add preceding text
    if (matchIndex > currentIndex) {
      parts.push(line.slice(currentIndex, matchIndex))
    }

    // Check if internal or external link
    if (url.startsWith('/') || url.startsWith('#')) {
      parts.push(
        <Link key={matchIndex} to={url} className="blog-body-link-internal">
          {linkText}
        </Link>
      )
    } else {
      parts.push(
        <a key={matchIndex} href={url} target="_blank" rel="noopener noreferrer" className="blog-body-link-external">
          {linkText} ↗
        </a>
      )
    }

    currentIndex = matchIndex + fullMatch.length
  }

  if (currentIndex < line.length) {
    parts.push(line.slice(currentIndex))
  }

  // Standalone Heading Heuristic: Short lines starting with uppercase, no punctuation at the end, and no links parsed
  const isHeadingHeuristic = currentIndex === 0 && line.length > 5 && line.length < 85 && /^[A-Z0-9]/.test(line) && !/[.,;:!?]$/.test(line)
  if (isHeadingHeuristic) {
    return <h3 key={key} className="blog-body-h3">{line}</h3>
  }

  return (
    <p key={key} className="blog-body-p">
      {parts.length > 0 ? parts : line}
    </p>
  )
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
  const isAdmin = localStorage.getItem('happy-admin-auth') === 'true'
  const [posts, setPosts] = useState<BlogPost[]>(() => {
    const saved = localStorage.getItem('happy-machinery-blog-posts')
    return saved ? JSON.parse(saved) : DEFAULT_POSTS
  })

  // Derived selectedPost from URL search parameters (Single Source of Truth)
  const postId = searchParams.get('post')
  const selectedPost = slug
    ? posts.find((post) => getBlogPostSlug(post) === slug) || null
    : postId
      ? posts.find((post) => post.id === Number(postId)) || null
      : null

  const setSelectedPost = (post: BlogPost | null) => {
    if (post) {
      navigate(getBlogPostPath(post))
    } else {
      navigate('/blog')
    }
  }

  // Keep old shared links working, then replace them with the canonical slug URL.
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
    const shareUrl = `${SITE_URL}${getBlogPostPath(selectedPost)}`
    const imageUrl = selectedPost.image.startsWith('http') ? selectedPost.image : `${SITE_URL}${selectedPost.image}`
    const postTitle = `${selectedPost.title} | Happy Machinery`

    document.title = postTitle

    const setMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector)
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attribute, key)
        document.head.appendChild(element)
      }
      element.content = content
    }

    setMeta('meta[name="description"]', 'name', 'description', selectedPost.excerpt)
    setMeta('meta[property="og:title"]', 'property', 'og:title', postTitle)
    setMeta('meta[property="og:description"]', 'property', 'og:description', selectedPost.excerpt)
    setMeta('meta[property="og:image"]', 'property', 'og:image', imageUrl)
    setMeta('meta[property="og:url"]', 'property', 'og:url', shareUrl)
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', postTitle)
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', selectedPost.excerpt)
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', imageUrl)

    const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (canonical) {
      canonical.href = shareUrl
    }

    return () => {
      document.title = originalTitle

      const restoreMeta = (selector: string, content: string) => {
        const element = document.head.querySelector<HTMLMetaElement>(selector)
        if (element) {
          element.content = content
        }
      }

      restoreMeta('meta[name="description"]', originalDesc)
      restoreMeta('meta[property="og:title"]', originalOgTitle)
      restoreMeta('meta[property="og:description"]', originalOgDesc)
      restoreMeta('meta[property="og:image"]', originalOgImage)
      restoreMeta('meta[property="og:url"]', originalOgUrl)
      restoreMeta('meta[name="twitter:title"]', originalOgTitle)
      restoreMeta('meta[name="twitter:description"]', originalOgDesc)
      restoreMeta('meta[name="twitter:image"]', originalOgImage)

      const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
      if (canonical) {
        canonical.href = originalCanonical
      }
    }
  }, [selectedPost])

  const getArticleUrl = () => {
    if (!selectedPost) return ''
    const base = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'https://happymachinery.com'
      : window.location.origin
    return `${base}${getBlogPostPath(selectedPost)}`
  }

  const getSocialArticleUrl = () => `${getArticleUrl()}?share=3`

  const printArticle = () => {
    window.print()
  }

  const downloadPDF = () => {
    window.print()
  }
  useEffect(() => {
    const handleStorageChange = async () => {
      try {
        const saved = await readSharedContent<BlogPost[]>('blog-posts')
        if (saved) {
          setPosts(saved)
          return
        }
      } catch (error) {
        console.error('Could not load the shared article database.', error)
      }

      try {
        const saved = await readPersistentContent<BlogPost[]>('blog-posts')
        if (saved) {
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

  useEffect(() => {
    setCommentSubmitted(false)
    setCommentName('')
    setCommentText('')
  }, [selectedPost?.id])

  const handleCommentSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedPost || !commentName.trim() || !commentText.trim()) return
    const newComment: BlogComment = {
      id: Date.now(), postId: selectedPost.id, postTitle: selectedPost.title,
      author: commentName.trim(), text: commentText.trim(),
      date: new Date().toISOString().slice(0, 10), status: 'Approved'
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
    const updatedComments = comments.map((comment) => comment.id === commentId ? {
      ...comment, replies: [...(comment.replies || []), { id: Date.now(), author: 'Happy Machinery', text: replyText.trim(), date: new Date().toISOString().slice(0, 10), isSeller: true }]
    } : comment)
    setComments(updatedComments)
    localStorage.setItem('happy-machinery-comments', JSON.stringify(updatedComments))
    window.dispatchEvent(new Event('comments-updated'))
    setReplyingTo(null)
    setReplyText('')
    setReplyName('')
  }

  const handleLikeComment = (commentId: number) => {
    const alreadyLiked = likedComments.includes(commentId)
    const nextLiked = alreadyLiked ? likedComments.filter((id) => id !== commentId) : [...likedComments, commentId]
    const updatedComments = comments.map((comment) => comment.id === commentId ? {
      ...comment, likes: Math.max(0, (comment.likes || 0) + (alreadyLiked ? -1 : 1))
    } : comment)
    setLikedComments(nextLiked)
    setComments(updatedComments)
    localStorage.setItem('happy-machinery-liked-comments', JSON.stringify(nextLiked))
    localStorage.setItem('happy-machinery-comments', JSON.stringify(updatedComments))
    window.dispatchEvent(new Event('comments-updated'))
  }

  const handleCustomerReply = (commentId: number) => {
    if (!replyName.trim() || !replyText.trim()) return
    const updatedComments = comments.map((comment) => comment.id === commentId ? {
      ...comment, replies: [...(comment.replies || []), { id: Date.now(), author: replyName.trim(), text: replyText.trim(), date: new Date().toISOString().slice(0, 10) }]
    } : comment)
    setComments(updatedComments)
    localStorage.setItem('happy-machinery-comments', JSON.stringify(updatedComments))
    window.dispatchEvent(new Event('comments-updated'))
    setReplyingTo(null)
    setReplyName('')
    setReplyText('')
  }

  // Extract unique categories dynamically
  const categories = ['All', ...Array.from(new Set(posts.map((p) => p.category)))]

  // Filter posts based on Category AND Search Query
  const filteredPosts = posts.filter((post) => {
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory
    const query = searchQuery.trim().toLowerCase()
    const matchesSearch = !query ||
      post.title.toLowerCase().includes(query) ||
      post.excerpt.toLowerCase().includes(query) ||
      post.category.toLowerCase().includes(query)
    return matchesCategory && matchesSearch
  })

  // Recent posts list for sidebar
  const recentPosts = posts.slice(0, 7)

  // Category counts for popular categories sidebar
  const categoryCounts = categories
    .filter((cat) => cat !== 'All')
    .map((cat) => ({
      name: cat,
      count: posts.filter((p) => p.category === cat).length
    }))

  return (
    <div className="page blog-page">
      <div className="page-hero">
        <p className="eyebrow">Insights & Guides</p>
        <h1>Machinery Knowledge Center</h1>
        <p>News, equipment insights, and machine walkthroughs from The Power Loader.</p>
      </div>

      {/* Category Filter Pills */}
      <div className="blog-category-filter">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`filter-pill ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Content Layout with Sidebar */}
      <div className="blog-main-layout">
        {/* Left Column: Primary Blog Cards Grid */}
        <div className="blog-primary-content">
          {searchQuery.trim() && (
            <div className="blog-search-banner">
              <span>Showing search results for "<strong>{searchQuery}</strong>" ({filteredPosts.length} found)</span>
              <button onClick={() => setSearchQuery('')}>Clear Search &times;</button>
            </div>
          )}

          <div className="blog-posts-grid">
            {filteredPosts.map((post) => (
              <article key={post.id} className="blog-post-card" onClick={() => setSelectedPost(post)}>
                <div className="blog-image-wrapper">
                  <img src={post.image} alt={post.title} />
                  <span className="blog-category-badge">{post.category}</span>
                </div>
                <div className="blog-card-content">
                  <div className="blog-card-meta-row">
                    <span className="blog-category-kicker">{post.category.toUpperCase()}</span>
                    <span className="blog-date">{post.date.toUpperCase()}</span>
                  </div>
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                  <div className="blog-card-footer">
                    <span className="read-more-btn">READ ARTICLE &rarr;</span>
                  </div>
                </div>
              </article>
            ))}

            {filteredPosts.length === 0 && (
              <div className="no-blog-results">
                <h3>No Articles Found</h3>
                <p>We couldn't find any articles matching your query. Try searching for another keyword or select a different category.</p>
                <button className="btn-reset-filter" onClick={() => { setActiveCategory('All'); setSearchQuery('') }}>
                  Reset Search & Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Column */}
        <aside className="blog-sidebar">
          {/* Search Box Widget */}
          <div className="sidebar-widget search-widget">
            <form onSubmit={(e) => e.preventDefault()} className="sidebar-search-form">
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="search-submit-btn">SEARCH</button>
            </form>
          </div>

          {/* Recent Posts Widget */}
          <div className="sidebar-widget recent-posts-widget">
            <div className="widget-header">
              <h3>RECENT POSTS</h3>
              <span className="widget-count-badge">{recentPosts.length}</span>
            </div>
            <div className="recent-posts-list">
              {recentPosts.map((post) => (
                <div key={post.id} className="recent-post-item" onClick={() => setSelectedPost(post)}>
                  <div className="recent-post-thumb">
                    <img src={post.image} alt={post.title} />
                  </div>
                  <div className="recent-post-info">
                    <h4 className="recent-post-title">{post.title}</h4>
                    <span className="recent-post-date">{post.date.toUpperCase()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Categories Widget */}
          <div className="sidebar-widget categories-widget">
            <div className="widget-header">
              <h3>POPULAR CATEGORIES</h3>
            </div>
            <div className="categories-list">
              {categoryCounts.map((item) => (
                <div
                  key={item.name}
                  className={`category-item-row ${activeCategory === item.name ? 'active' : ''}`}
                  onClick={() => setActiveCategory(activeCategory === item.name ? 'All' : item.name)}
                >
                  <span className="cat-name">{item.name}</span>
                  <span className="cat-count-badge">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Article Detail Modal */}
      {selectedPost && (
        <div className="blog-modal-overlay" onClick={() => setSelectedPost(null)}>
          <div className="blog-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="blog-modal-close" onClick={() => setSelectedPost(null)} aria-label="Close article">
              &times;
            </button>
            <div className="blog-modal-hero">
              <img src={selectedPost.image} alt={selectedPost.title} />
              <span className="blog-modal-category">{selectedPost.category}</span>
            </div>
            <div className="blog-modal-body">
              <div className="blog-post-meta">
                <span>{selectedPost.date}</span>
                <span className="separator">&bull;</span>
                <span>{selectedPost.readTime}</span>
              </div>
              <h1 className="blog-modal-title">{selectedPost.title}</h1>

              <div className="blog-share-bar">
                <div className="blog-share-provider">
                  <span className="provider-label">NEWS PROVIDED BY</span>
                  <span className="provider-name">{selectedPost.author}</span>
                  <span className="provider-date">{selectedPost.date}, 08:00 GMT</span>
                </div>
                <div className="blog-share-actions">
                  <span className="share-label">SHARE THIS ARTICLE</span>
                  <div className="share-buttons">
                    <SocialShareButtons
                      url={getSocialArticleUrl()}
                      title={`Read "${selectedPost.title}" on Happy Machinery`}
                      image={selectedPost.image}
                    />
                    <button className="share-btn print" onClick={printArticle} title="Print Article" aria-label="Print Article">
                      <svg viewBox="0 0 24 24" width="18" height="18"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
                    </button>
                    <button className="share-btn pdf" onClick={downloadPDF} title="Download PDF" aria-label="Download/Save PDF">
                      <svg viewBox="0 0 24 24" width="18" height="18"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3.5h-3v1.5h2.5V11H17v1.5h-1.5V7h5v1.5zM9 9.5h1v-1H9v1zm5.5 3h1v-3h-1v3zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z"/></svg>
                    </button>
                  </div>
                </div>
              </div>
              <div className="blog-modal-text">
                {selectedPost.content.map((paragraph, idx) => renderMarkdownToReact(paragraph, idx))}
              </div>
              {selectedPost.keyTakeaways && selectedPost.keyTakeaways.length > 0 && (
                <div className="blog-takeaways-box">
                  <h3>Key Takeaways</h3>
                  <ul>
                    {selectedPost.keyTakeaways.map((item, idx) => (
                      <li key={idx}>✓ {item}</li>
                    ))}
                  </ul>
                </div>
              )}
              <section className="blog-comments" aria-labelledby="blog-comments-title">
                <div className="blog-comments-heading">
                  <div><span>Join the conversation</span><h2 id="blog-comments-title">Comments</h2></div>
                  <b>{comments.filter((comment) => comment.postId === selectedPost.id && comment.status === "Approved").length}</b>
                </div>
                <div className="blog-comments-list">
                  {comments.filter((comment) => comment.postId === selectedPost.id && comment.status === "Approved").map((comment) => (
                    <article className="blog-comment" key={comment.id}>
                      <div className="blog-comment-avatar" aria-hidden="true">{comment.author.charAt(0).toUpperCase()}</div>
                      <div className="blog-comment-content">
                        <div className="blog-comment-meta"><strong>{comment.author}</strong><time>{comment.date}</time></div>
                        <p>{comment.text}</p>
                        {comment.reply && (<div className="blog-comment-reply"><div><strong>Happy Machinery</strong><span>Seller</span><time>{comment.reply.date}</time></div><p>{comment.reply.text}</p></div>)}
                        {(comment.replies || []).map((reply) => (<div className="blog-comment-reply facebook-reply" key={reply.id}><div className="reply-avatar">{reply.author.charAt(0).toUpperCase()}</div><div><div><strong>{reply.author}</strong>{reply.isSeller && <span>Seller</span>}</div><p>{reply.text}</p><small>{reply.date}</small></div></div>))}
                        <div className="facebook-comment-actions">
                          <button type="button" className={likedComments.includes(comment.id) ? "liked" : ""} onClick={() => handleLikeComment(comment.id)}>👍 Like{(comment.likes || 0) > 0 ? <> · {comment.likes}</> : null}</button>
                          <button type="button" onClick={() => { setReplyingTo(comment.id); setReplyText(""); setReplyName("") }}>↩ Reply</button>
                          {(comment.replies?.length || 0) > 0 && <span>{comment.replies?.length} {comment.replies?.length === 1 ? "reply" : "replies"}</span>}
                        </div>
                        {replyingTo === comment.id && (<div className="facebook-reply-form">
                          {!isAdmin && <input value={replyName} onChange={(event) => setReplyName(event.target.value)} maxLength={60} placeholder="Your name" autoFocus />}
                          <textarea value={replyText} onChange={(event) => setReplyText(event.target.value)} rows={2} maxLength={1000} placeholder={isAdmin ? "Reply as Happy Machinery..." : "Write a reply..."} autoFocus={isAdmin} />
                          <div><button type="button" className="reply-cancel" onClick={() => { setReplyingTo(null); setReplyText(""); setReplyName("") }}>Cancel</button><button type="button" className="reply-publish" onClick={() => isAdmin ? handleSellerReply(comment.id) : handleCustomerReply(comment.id)}>Reply</button></div>
                        </div>)}
                      </div>
                    </article>
                  ))}
                  {comments.filter((comment) => comment.postId === selectedPost.id && comment.status === "Approved").length === 0 && (
                    <p className="blog-comments-empty">No published comments yet. Be the first to share your thoughts.</p>
                  )}
                </div>
                <form className="blog-comment-form" onSubmit={handleCommentSubmit}>
                  <h3>Leave a comment</h3>
                  <p>Your comment will appear immediately after you submit it.</p>
                  {commentSubmitted && <div className="blog-comment-success" role="status">Thank you! Your comment is now published.</div>}
                  <label htmlFor="comment-name">Your name</label>
                  <input id="comment-name" value={commentName} onChange={(event) => setCommentName(event.target.value)} maxLength={60} autoComplete="name" required placeholder="Enter your name" />
                  <label htmlFor="comment-message">Comment</label>
                  <textarea id="comment-message" value={commentText} onChange={(event) => setCommentText(event.target.value)} maxLength={1000} rows={5} required placeholder="What did you find helpful?" />
                  <div className="blog-comment-form-footer"><span>{commentText.length}/1000</span><button type="submit">Submit comment <span aria-hidden="true">→</span></button></div>
                </form>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
