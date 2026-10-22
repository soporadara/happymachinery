import React, { useState, useMemo, useEffect } from 'react'
import type { BlogPost } from '../pages/adminData'
import { getBlogPostPath } from '../data/blogUrls'
import { getRealBlogViews, setRealBlogViews } from '../data/blogViews'
import './TopBlogsManager.css'

interface TopBlogsManagerProps {
  posts: BlogPost[]
  onEditArticle: (post: BlogPost) => void
  onOpenNewArticle: () => void
  onNavigateToCategories: () => void
  onNavigateToList: () => void
  trashCount?: number
  onNavigateToTrash?: () => void
  showToast: (message: string, type?: 'success' | 'error' | 'warning') => void
}

export const getArticleViews = (post: BlogPost): number => {
  if (typeof (post as any).views === 'number' && (post as any).views > 0) {
    return (post as any).views
  }
  return getRealBlogViews(post.id)
}

export default function TopBlogsManager({
  posts,
  onEditArticle,
  onOpenNewArticle,
  onNavigateToCategories,
  onNavigateToList,
  trashCount = 0,
  onNavigateToTrash,
  showToast
}: TopBlogsManagerProps) {
  const [rankLimit, setRankLimit] = useState<number>(20)
  const [customInput, setCustomInput] = useState<string>('20')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [viewsTick, setViewsTick] = useState(0)
  const [editingViewsPostId, setEditingViewsPostId] = useState<number | null>(null)
  const [editingViewsValue, setEditingViewsValue] = useState<string>('')

  // Sync real-time blog views updates
  useEffect(() => {
    const handleViewsUpdate = () => {
      setViewsTick((t) => t + 1)
    }
    window.addEventListener('blog-views-updated', handleViewsUpdate)
    window.addEventListener('storage', handleViewsUpdate)
    return () => {
      window.removeEventListener('blog-views-updated', handleViewsUpdate)
      window.removeEventListener('storage', handleViewsUpdate)
    }
  }, [])

  const handleSaveCustomViews = (postId: number) => {
    const num = parseInt(editingViewsValue, 10)
    if (!isNaN(num) && num >= 0) {
      setRealBlogViews(postId, num)
      setViewsTick((t) => t + 1)
      showToast(`Updated real views to ${num.toLocaleString()}`, 'success')
    }
    setEditingViewsPostId(null)
  }

  // Categories list
  const categoriesList = useMemo(() => {
    const set = new Set<string>()
    posts.forEach((p) => {
      if (p.category) set.add(p.category)
    })
    return ['All', ...Array.from(set)]
  }, [posts])

  // Ranked posts (sorted descending by views)
  const allRankedPosts = useMemo(() => {
    return [...posts].sort((a, b) => getArticleViews(b) - getArticleViews(a))
  }, [posts, viewsTick])

  // Filtered and limited posts
  const displayedPosts = useMemo(() => {
    let result = allRankedPosts

    if (selectedCategory !== 'All') {
      result = result.filter((p) => p.category === selectedCategory)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.author && p.author.toLowerCase().includes(q))
      )
    }

    return result.slice(0, rankLimit)
  }, [allRankedPosts, selectedCategory, searchQuery, rankLimit])

  // Aggregate Metrics
  const totalViews = useMemo(() => {
    return displayedPosts.reduce((acc, p) => acc + getArticleViews(p), 0)
  }, [displayedPosts])

  const avgViews = useMemo(() => {
    if (displayedPosts.length === 0) return 0
    return Math.round(totalViews / displayedPosts.length)
  }, [totalViews, displayedPosts])

  const topPost = displayedPosts[0] || null
  const maxViews = topPost ? getArticleViews(topPost) : 1

  // Set rank limit helpers
  const handleSetPresetLimit = (n: number) => {
    setRankLimit(n)
    setCustomInput(String(n))
  }

  const handleCustomLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setCustomInput(val)
    const num = parseInt(val, 10)
    if (!isNaN(num) && num > 0) {
      setRankLimit(num)
    }
  }

  // Export Report as PDF
  const handleExportPdfReport = () => {
    const origin = window.location.origin
    const currentDate = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })

    const printWindow = window.open('', '_blank', 'width=1000,height=800')
    if (!printWindow) {
      showToast('Please enable popups in your browser to export the PDF report.', 'warning')
      return
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Happy Machinery - Top Blogs Performance Report</title>
          <style>
            @page {
              size: landscape;
              margin: 12mm 15mm;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              margin: 0;
              padding: 24px;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .report-header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 18px;
              margin-bottom: 24px;
            }
            .brand-col h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 800;
              color: #0f172a;
              letter-spacing: -0.02em;
            }
            .brand-col p {
              margin: 6px 0 0;
              font-size: 13px;
              color: #64748b;
            }
            .meta-col {
              text-align: right;
              font-size: 12px;
              line-height: 1.6;
              color: #475569;
            }
            .meta-col strong {
              color: #0f172a;
            }
            .summary-cards {
              display: flex;
              gap: 16px;
              margin-bottom: 24px;
            }
            .sum-card {
              flex: 1;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              padding: 14px 18px;
            }
            .sum-card-label {
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: #64748b;
            }
            .sum-card-val {
              font-size: 22px;
              font-weight: 800;
              color: #0f172a;
              margin-top: 4px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 12px;
            }
            th {
              background: #f1f5f9;
              padding: 10px 12px;
              text-align: left;
              font-weight: 700;
              color: #334155;
              border-bottom: 2px solid #cbd5e1;
              text-transform: uppercase;
              font-size: 11px;
              letter-spacing: 0.04em;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #e2e8f0;
              vertical-align: middle;
            }
            tr:nth-child(even) {
              background: #fcfcfd;
            }
            .rank-badge {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              width: 28px;
              height: 28px;
              border-radius: 50%;
              font-weight: 800;
              font-size: 12px;
              background: #e2e8f0;
              color: #334155;
            }
            .rank-1 { background: #fef3c7; color: #b45309; border: 1px solid #f59e0b; }
            .rank-2 { background: #f1f5f9; color: #475569; border: 1px solid #94a3b8; }
            .rank-3 { background: #ffedd5; color: #c2410c; border: 1px solid #f97316; }
            .thumb-box {
              width: 90px;
              height: 51px;
              border-radius: 6px;
              overflow: hidden;
              background: #0f172a;
            }
            .thumb-box img {
              width: 100%;
              height: 100%;
              object-fit: cover;
              display: block;
            }
            .title-info strong {
              display: block;
              font-size: 13px;
              color: #0f172a;
              margin-bottom: 3px;
              line-height: 1.3;
            }
            .title-info span {
              font-size: 11px;
              color: #64748b;
            }
            .category-tag {
              display: inline-block;
              padding: 3px 8px;
              background: #f1f5f9;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 600;
              color: #334155;
            }
            .url-link {
              color: #2563eb;
              text-decoration: none;
              font-size: 11px;
              word-break: break-all;
            }
            .views-pill {
              display: inline-block;
              padding: 5px 12px;
              background: #eff6ff;
              color: #1d4ed8;
              border: 1px solid #bfdbfe;
              border-radius: 6px;
              font-weight: 800;
              font-size: 13px;
            }
            .report-footer {
              margin-top: 30px;
              text-align: center;
              font-size: 11px;
              color: #94a3b8;
              border-top: 1px solid #e2e8f0;
              padding-top: 14px;
            }
          </style>
        </head>
        <body>
          <div class="report-header">
            <div class="brand-col">
              <h1>HAPPY MACHINERY &bull; BLOG PERFORMANCE & AUDIENCE REPORT</h1>
              <p>Top Performing Articles Ranked by Traffic & Reader Views</p>
            </div>
            <div class="meta-col">
              <div>Date Generated: <strong>${currentDate}</strong></div>
              <div>Ranked Scope: <strong>Top ${displayedPosts.length} Articles</strong></div>
              <div>Category Filter: <strong>${selectedCategory}</strong></div>
            </div>
          </div>

          <div class="summary-cards">
            <div class="sum-card">
              <div class="sum-card-label">Ranked Articles</div>
              <div class="sum-card-val">${displayedPosts.length}</div>
            </div>
            <div class="sum-card">
              <div class="sum-card-label">Total Views Analyzed</div>
              <div class="sum-card-val">${totalViews.toLocaleString()}</div>
            </div>
            <div class="sum-card">
              <div class="sum-card-label">Average Views / Post</div>
              <div class="sum-card-val">${avgViews.toLocaleString()}</div>
            </div>
            <div class="sum-card">
              <div class="sum-card-label">#1 Leading Article</div>
              <div class="sum-card-val" style="font-size: 14px; color: #b45309;">${topPost ? topPost.title.slice(0, 45) + '...' : 'N/A'}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 50px; text-align: center;">Rank</th>
                <th style="width: 100px;">Main Image</th>
                <th>Article Title & Date</th>
                <th style="width: 150px;">Category</th>
                <th style="width: 240px;">Public URL Link</th>
                <th style="width: 100px; text-align: right;">Total Views</th>
              </tr>
            </thead>
            <tbody>
              ${displayedPosts
                .map((post, idx) => {
                  const url = `${origin}${getBlogPostPath(post)}`
                  const views = getArticleViews(post)
                  const rankClass = idx === 0 ? 'rank-1' : idx === 1 ? 'rank-2' : idx === 2 ? 'rank-3' : ''
                  return `
                  <tr>
                    <td style="text-align: center;">
                      <span class="rank-badge ${rankClass}">#${idx + 1}</span>
                    </td>
                    <td>
                      <div class="thumb-box">
                        <img src="${post.image}" alt="${post.title}" onerror="this.src='/images/why-choose-v900-jobsite.png'" />
                      </div>
                    </td>
                    <td class="title-info">
                      <strong>${post.title}</strong>
                      <span>Published ${post.date} &bull; ${post.author || 'Happy Machinery Editorial'}</span>
                    </td>
                    <td>
                      <span class="category-tag">${post.category}</span>
                    </td>
                    <td>
                      <a href="${url}" target="_blank" class="url-link">${url}</a>
                    </td>
                    <td style="text-align: right;">
                      <span class="views-pill">${views.toLocaleString()}</span>
                    </td>
                  </tr>
                `
                })
                .join('')}
            </tbody>
          </table>

          <div class="report-footer">
            Happy Machinery CMS Intelligence System &bull; Confidential Internal Content Performance Document
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 400);
            }
          </script>
        </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
    showToast('Exporting Top Blogs PDF Report...', 'success')
  }

  return (
    <div className="top-blogs-manager">
      {/* View Header */}
      <div className="cms-view-header">
        <div className="cms-view-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1>Top Blogs Ranking & Performance</h1>
            <span className="top-blogs-badge-pill">🔥 POPULARITY RANK</span>
            <span className="top-blogs-real-views-pill" title="Live real reader view tracking active">
              <span className="top-blogs-pulse-dot" /> REAL VIEWS ACTIVE
            </span>
          </div>
          <p>
            Monitor which articles generate the highest reader views, customize rank limits, and export PDF intelligence reports.
          </p>
        </div>
        <div className="cms-view-actions">
          <button
            type="button"
            className="cms-btn cms-btn-outline top-blogs-refresh-btn"
            onClick={() => {
              setViewsTick((t) => t + 1)
              showToast('Live real views refreshed', 'success')
            }}
            title="Refresh real-time visitor view counts"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M23 4v6h-6" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
            <span>Refresh Views</span>
          </button>
          <button
            type="button"
            className="cms-btn cms-btn-primary top-blogs-export-btn"
            onClick={handleExportPdfReport}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>Export Report as PDF</span>
          </button>
        </div>
      </div>

      {/* Subnav Navigation */}
      <div className="cms-articles-subnav">
        <button type="button" className="cms-subnav-btn" onClick={onNavigateToList}>
          All Articles ({posts.length})
        </button>
        <button type="button" className="cms-subnav-btn" onClick={onOpenNewArticle}>
          New Article
        </button>
        <button type="button" className="cms-subnav-btn" onClick={onNavigateToCategories}>
          Categories & Slugs
        </button>
        <button type="button" className="cms-subnav-btn active">
          🔥 Top Blogs Ranking
        </button>
        {trashCount > 0 && onNavigateToTrash && (
          <button
            type="button"
            className="cms-subnav-btn"
            onClick={onNavigateToTrash}
            style={{ color: 'var(--cms-warning)', marginLeft: 'auto' }}
          >
            Trash ({trashCount})
          </button>
        )}
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="top-blogs-kpi-grid">
        <div className="top-blogs-kpi-card highlight-card">
          <div className="top-blogs-kpi-content">
            <span className="top-blogs-kpi-label">🥇 #1 Highest Ranked Blog</span>
            <strong className="top-blogs-kpi-title">{topPost ? topPost.title : 'No articles'}</strong>
            <div className="top-blogs-kpi-meta">
              <span className="top-blogs-kpi-tag">{topPost?.category || 'General'}</span>
              <span className="top-blogs-kpi-views-highlight">{topPost ? getArticleViews(topPost).toLocaleString() : 0} views</span>
            </div>
          </div>
          {topPost && (
            <div className="top-blogs-kpi-thumb">
              <img src={topPost.image} alt={topPost.title} />
            </div>
          )}
        </div>

        <div className="top-blogs-kpi-card">
          <div className="top-blogs-kpi-icon-wrap blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
          <div>
            <span className="top-blogs-kpi-label">Total Views Analyzed</span>
            <div className="top-blogs-kpi-num">{totalViews.toLocaleString()}</div>
            <span className="top-blogs-kpi-sub">Across top {displayedPosts.length} ranked guides</span>
          </div>
        </div>

        <div className="top-blogs-kpi-card">
          <div className="top-blogs-kpi-icon-wrap amber">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <span className="top-blogs-kpi-label">Average Views / Post</span>
            <div className="top-blogs-kpi-num">{avgViews.toLocaleString()}</div>
            <span className="top-blogs-kpi-sub">Engagement benchmark</span>
          </div>
        </div>

        <div className="top-blogs-kpi-card">
          <div className="top-blogs-kpi-icon-wrap emerald">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div>
            <span className="top-blogs-kpi-label">Top Publication Ratio</span>
            <div className="top-blogs-kpi-num">{allRankedPosts.length}</div>
            <span className="top-blogs-kpi-sub">Total published articles</span>
          </div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="top-blogs-control-card">
        <div className="top-blogs-limit-row">
          <span className="top-blogs-control-label">Show Top Ranks:</span>
          <div className="top-blogs-preset-group">
            {[10, 20, 30, 50].map((num) => (
              <button
                key={num}
                type="button"
                className={`top-blogs-preset-btn ${rankLimit === num ? 'active' : ''}`}
                onClick={() => handleSetPresetLimit(num)}
              >
                Top {num}
              </button>
            ))}
            <button
              type="button"
              className={`top-blogs-preset-btn ${rankLimit === allRankedPosts.length ? 'active' : ''}`}
              onClick={() => handleSetPresetLimit(allRankedPosts.length)}
            >
              All ({allRankedPosts.length})
            </button>
          </div>

          <div className="top-blogs-custom-limit">
            <span>Custom Amount:</span>
            <input
              type="number"
              min="1"
              max={allRankedPosts.length}
              value={customInput}
              onChange={handleCustomLimitChange}
              placeholder="e.g. 15"
            />
          </div>
        </div>

        <div className="top-blogs-search-row">
          <div className="top-blogs-search-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search ranked blog titles, authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className="top-blogs-clear-btn" onClick={() => setSearchQuery('')}>
                ✕
              </button>
            )}
          </div>

          <div className="top-blogs-cat-filter">
            <span>Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Ranked Articles Table Card */}
      <div className="cms-card top-blogs-table-card">
        <div className="cms-card-header" style={{ marginBottom: '14px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#fff' }}>
              Blog Rank Table ({displayedPosts.length} Articles)
            </h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--cms-text-muted)' }}>
              Sorted in descending order by audience views. Landscape 16:9 thumbnails and direct public URLs.
            </span>
          </div>
          <button
            type="button"
            className="top-blogs-quick-pdf"
            onClick={handleExportPdfReport}
          >
            🖨️ Print / Save PDF
          </button>
        </div>

        <div className="cms-table-wrapper">
          <table className="cms-table top-blogs-table">
            <thead>
              <tr>
                <th style={{ width: '80px', textAlign: 'center' }}>Rank</th>
                <th style={{ width: '130px' }}>Main Image (16:9)</th>
                <th>Article Title & Details</th>
                <th style={{ width: '170px' }}>Category</th>
                <th style={{ width: '220px' }}>Public Link</th>
                <th style={{ width: '160px', textAlign: 'right' }}>Views</th>
                <th style={{ width: '120px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedPosts.map((post, idx) => {
                const views = getArticleViews(post)
                const pct = Math.max(12, Math.round((views / maxViews) * 100))
                const path = getBlogPostPath(post)
                const fullUrl = `${window.location.origin}${path}`

                return (
                  <tr key={post.id} className="top-blogs-row">
                    {/* Rank Badge */}
                    <td style={{ textAlign: 'center' }}>
                      {idx === 0 && <span className="top-rank-medal gold" title="Rank #1">🥇 #1</span>}
                      {idx === 1 && <span className="top-rank-medal silver" title="Rank #2">🥈 #2</span>}
                      {idx === 2 && <span className="top-rank-medal bronze" title="Rank #3">🥉 #3</span>}
                      {idx > 2 && <span className="top-rank-pill">#{idx + 1}</span>}
                    </td>

                    {/* Main Image Thumbnail (16:9 Landscape) */}
                    <td>
                      <div className="top-blogs-thumb-wrapper">
                        <img
                          src={post.image}
                          alt={post.title}
                          loading="lazy"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src = '/images/why-choose-v900-jobsite.png'
                          }}
                        />
                      </div>
                    </td>

                    {/* Title & Details */}
                    <td>
                      <div className="top-blogs-title-col">
                        <strong className="top-blogs-item-title">{post.title}</strong>
                        <div className="top-blogs-item-sub">
                          <span>{post.date}</span>
                          <span className="dot">&bull;</span>
                          <span>{post.readTime || '5 min read'}</span>
                          <span className="dot">&bull;</span>
                          <span>By {post.author || 'Happy Machinery Editorial'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td>
                      <span className="top-blogs-cat-pill">{post.category}</span>
                    </td>

                    {/* Public URL Link */}
                    <td>
                      <a
                        href={path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="top-blogs-url-link"
                        title={fullUrl}
                      >
                        <span className="top-blogs-url-text">{path}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    </td>

                    {/* Views & Bar */}
                    <td style={{ textAlign: 'right' }}>
                      {editingViewsPostId === post.id ? (
                        <div className="top-blogs-views-edit-wrap">
                          <input
                            type="number"
                            value={editingViewsValue}
                            onChange={(e) => setEditingViewsValue(e.target.value)}
                            className="top-blogs-views-inline-input"
                            autoFocus
                            min={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveCustomViews(post.id)
                              if (e.key === 'Escape') setEditingViewsPostId(null)
                            }}
                          />
                          <button
                            type="button"
                            className="top-blogs-views-save-btn"
                            onClick={() => handleSaveCustomViews(post.id)}
                            title="Save views"
                          >
                            ✓
                          </button>
                          <button
                            type="button"
                            className="top-blogs-views-cancel-btn"
                            onClick={() => setEditingViewsPostId(null)}
                            title="Cancel"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="top-blogs-views-col">
                          <div className="top-blogs-views-count-row">
                            <span
                              className="top-blogs-views-count"
                              title="Real tracked views (Click to calibrate)"
                              onClick={() => {
                                setEditingViewsPostId(post.id)
                                setEditingViewsValue(String(views))
                              }}
                            >
                              {views.toLocaleString()} <span className="views-label">views</span>
                            </span>
                            <button
                              type="button"
                              className="top-blogs-views-edit-icon"
                              onClick={() => {
                                setEditingViewsPostId(post.id)
                                setEditingViewsValue(String(views))
                              }}
                              title="Calibrate real views"
                            >
                              ✎
                            </button>
                          </div>
                          <div className="top-blogs-bar-bg" title={`${pct}% of #1 article`}>
                            <div className="top-blogs-bar-fill" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )}
                    </td>

                    {/* CMS Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div className="top-blogs-action-row">
                        <button
                          type="button"
                          className="top-blogs-btn-edit"
                          onClick={() => onEditArticle(post)}
                          title="Edit this article in CMS editor"
                        >
                          ✎ Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {displayedPosts.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--cms-text-muted)' }}>
                    No blog articles found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
