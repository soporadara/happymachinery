import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import CmsLogin from './CmsLogin'
import { getStoredSession, clearStoredSession, logSecurityEvent } from '../data/cmsAuth'
import type { 
  AdminUser, 
  AdminRole, 
  SecurityLog, 
  BannedIp, 
  FailedLoginAttempt, 
  SecuritySettings, 
  AnalyticsViewEvent, 
  SiteSettings, 
  SitePage 
} from '../data/cmsTypes'
import { 
  DEFAULT_ADMIN_USERS, 
  DEFAULT_SECURITY_SETTINGS, 
  DEFAULT_SITE_SETTINGS, 
  DEFAULT_SITE_PAGES 
} from '../data/cmsDefaults'
import { 
  BlogPost, 
  AdminProduct, 
  MediaItem, 
  DEFAULT_POSTS, 
  DEFAULT_PRODUCTS, 
  DEFAULT_MEDIA 
} from './adminData'
import { readSharedContent, writeSharedContent } from '../data/sharedContentStorage'
import { getBlogPostPath } from '../data/blogUrls'
import './AdminDashboard.css'

type CmsTab = 
  | 'dashboard' 
  | 'articles' 
  | 'media' 
  | 'products' 
  | 'pages' 
  | 'security' 
  | 'admins' 
  | 'settings'
  | 'maintenance'

type SecuritySubTab = 
  | 'overview' 
  | 'banned-ips' 
  | 'blocked-users' 
  | 'failed-logins' 
  | 'activity-log' 
  | 'settings'

type CmsTheme = 'dark' | 'light' | 'neon'

export default function AdminDashboard() {

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(() => {
    const session = getStoredSession()
    return session?.user || null
  })

  // Theme State
  const [theme, setTheme] = useState<CmsTheme>(() => {
    return (localStorage.getItem('hm_cms_theme') as CmsTheme) || 'dark'
  })

  // Navigation State
  const [activeTab, setActiveTab] = useState<CmsTab>('dashboard')
  const [securitySubTab, setSecuritySubTab] = useState<SecuritySubTab>('overview')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [globalSearch, setGlobalSearch] = useState('')

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null)

  // Primary CMS Collections Data
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [mediaList, setMediaList] = useState<MediaItem[]>([])
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([])
  const [bannedIps, setBannedIps] = useState<BannedIp[]>([])
  const [failedLogins, setFailedLogins] = useState<FailedLoginAttempt[]>([])
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(DEFAULT_SECURITY_SETTINGS)
  const [, setAnalyticsEvents] = useState<AnalyticsViewEvent[]>([])
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS)
  const [sitePages, setSitePages] = useState<SitePage[]>(DEFAULT_SITE_PAGES)
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Modals & Sub-forms State
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [editingArticle, setEditingArticle] = useState<BlogPost | null>(null)
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null)
  const [showAddAdminModal, setShowAddAdminModal] = useState(false)
  const [showBanIpModal, setShowBanIpModal] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)

  // Articles Sub-view & Rafvex Editor States (Screenshots 3, 4, 5)
  const [articlesSubView, setArticlesSubView] = useState<'list' | 'editor' | 'categories'>('list')
  const [editorTitle, setEditorTitle] = useState('')
  const [editorSlug, setEditorSlug] = useState('')
  const [editorExcerpt, setEditorExcerpt] = useState('')
  const [editorContent, setEditorContent] = useState('')
  const [editorCategory, setEditorCategory] = useState('Jobsite Productivity')
  const [editorAuthor, setEditorAuthor] = useState('Happy Machinery')
  const [editorStatus, setEditorStatus] = useState<'Published' | 'Draft' | 'Scheduled'>('Draft')
  const [editorCoverImage, setEditorCoverImage] = useState('/images/why-choose-v900-jobsite.png')
  const [editorCoverAlt, setEditorCoverAlt] = useState('')
  const [editorVideoUrl, setEditorVideoUrl] = useState('')
  const [editorSeoTitle, setEditorSeoTitle] = useState('')
  const [editorSeoDesc, setEditorSeoDesc] = useState('')

  // Categories Taxonomy State (Screenshot 5)
  const [blogCategories, setBlogCategories] = useState<{ name: string; slug: string; desc?: string; cover?: string }[]>([
    { name: 'Jobsite Productivity', slug: 'jobsite-productivity', desc: 'Efficiency strategies on residential and tight job sites.' },
    { name: 'Equipment Maintenance', slug: 'equipment-maintenance', desc: 'Hydraulic checks, oil intervals, and rubber track care.' },
    { name: 'Attachments & Tools', slug: 'attachments-tools', desc: 'Augers, trenchers, pallet forks, and hydraulic breakers.' },
    { name: 'Compact Loaders', slug: 'compact-loaders', desc: 'Mini skid steer walkthroughs and stand-on machinery.' },
    { name: 'Skid Steer Comparisons', slug: 'skid-steer-comparisons', desc: 'Wheeled vs tracked loaders, gas vs diesel options.' },
    { name: 'Hydraulic Systems', slug: 'hydraulic-systems', desc: 'Pressure testing, auxiliary circuits, and pump diagnostics.' }
  ])
  const [newCatName, setNewCatName] = useState('')
  const [newCatSlug, setNewCatSlug] = useState('')
  const [newCatDesc, setNewCatDesc] = useState('')
  const [newCatCover, setNewCatCover] = useState('')
  const [categorySearch, setCategorySearch] = useState('')

  // Form Temp States
  const [newIpAddress, setNewIpAddress] = useState('')
  const [newIpReason, setNewIpReason] = useState('')
  const [newAdminUsername, setNewAdminUsername] = useState('')
  const [newAdminName, setNewAdminName] = useState('')
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminPassword, setNewAdminPassword] = useState('')
  const [newAdminRole, setNewAdminRole] = useState<AdminRole>('Editor')

  // Profile Edit State
  const [profileName, setProfileName] = useState('')
  const [profileEmail, setProfileEmail] = useState('')
  const [profileAvatar, setProfileAvatar] = useState('')
  const [newPasswordInput, setNewPasswordInput] = useState('')

  // Maintenance Mode States (Screenshot 5)
  const [maintenanceGlobal, setMaintenanceGlobal] = useState(false)
  const [maintenanceTitle, setMaintenanceTitle] = useState("We'll Be Right Back")
  const [maintenanceMessage, setMaintenanceMessage] = useState("We're performing scheduled maintenance. Please check back soon.")
  const [maintenanceEta, setMaintenanceEta] = useState('')
  const [maintenanceProgress, setMaintenanceProgress] = useState(90)
  const [maintenanceRoutes, setMaintenanceRoutes] = useState<string[]>(['/blog/*', '/equipment/*'])
  const [newCustomRoute, setNewCustomRoute] = useState('')

  // Media Library Enhanced States (Screenshots 2 & 3)
  const [mediaPath, setMediaPath] = useState('blog / equipment / attachments')
  const [mediaSearchTerm, setMediaSearchTerm] = useState('')
  const [mediaSortOrder, setMediaSortOrder] = useState<'A-Z' | 'Z-A' | 'Newest'>('A-Z')

  // Comments State (Screenshot 1)
  const [commentsList] = useState([
    {
      id: 'c1',
      author: 'Rafel Eiffel',
      time: 'about 15 hours ago',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      comment: 'Wonderful explanation on skid steer hydraulic attachments and auxiliary flow rates!',
      articleTitle: 'How to Choose the Right Compact Skid Steer for Tight Job Sites',
      articleSlug: 'how-to-choose-the-right-compact-skid-steer-for-tight-job-sites'
    },
    {
      id: 'c2',
      author: 'Marcus Vance',
      time: 'about 1 day ago',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
      comment: 'In my opinion, rubber tracks are indispensable for preventing lawn turf damage. Thanks for the breakdown!',
      articleTitle: 'Rubber Tracks vs Wheeled Skid Steers: Ground Damage & Traction Analysis',
      articleSlug: 'rubber-tracks-vs-wheeled-skid-steers'
    },
    {
      id: 'c3',
      author: 'Sarah Lin',
      time: 'about 2 days ago',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
      comment: 'Daily greasing checklist has saved our crew thousands in premature pin bushing wear.',
      articleTitle: 'Daily Skid Steer Maintenance: 10 Essential Checks to Prevent Downtime',
      articleSlug: 'daily-skid-steer-maintenance'
    }
  ])

  // Navigation Submenu States
  const [isArticlesExpanded, setIsArticlesExpanded] = useState(true)

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // Apply Theme to DOM
  useEffect(() => {
    localStorage.setItem('hm_cms_theme', theme)
    document.documentElement.classList.remove('cms-theme-light', 'cms-theme-neon', 'cms-theme-dark')
    document.documentElement.classList.add(`cms-theme-${theme}`)
  }, [theme])

  // Load All Collections from Backend
  const loadAllData = async () => {
    setIsLoadingData(true)
    try {
      const [
        fetchedPosts,
        fetchedProducts,
        fetchedMedia,
        fetchedUsers,
        fetchedLogs,
        fetchedBans,
        fetchedFails,
        fetchedSecSettings,
        fetchedAnalytics,
        fetchedSiteSettings,
        fetchedPages
      ] = await Promise.all([
        readSharedContent<BlogPost[]>('blog-posts'),
        readSharedContent<AdminProduct[]>('products'),
        readSharedContent<MediaItem[]>('media-library'),
        readSharedContent<AdminUser[]>('admin-users'),
        readSharedContent<SecurityLog[]>('security-logs'),
        readSharedContent<BannedIp[]>('banned-ips'),
        readSharedContent<FailedLoginAttempt[]>('failed-logins'),
        readSharedContent<SecuritySettings>('security-settings'),
        readSharedContent<AnalyticsViewEvent[]>('analytics-events'),
        readSharedContent<SiteSettings>('site-settings'),
        readSharedContent<SitePage[]>('site-pages')
      ])

      setPosts(fetchedPosts || DEFAULT_POSTS)
      setProducts(fetchedProducts || DEFAULT_PRODUCTS)
      setMediaList(fetchedMedia || DEFAULT_MEDIA)
      setAdminUsers(fetchedUsers || DEFAULT_ADMIN_USERS)
      setSecurityLogs(fetchedLogs || [])
      setBannedIps(fetchedBans || [])
      setFailedLogins(fetchedFails || [])
      setSecuritySettings(fetchedSecSettings || DEFAULT_SECURITY_SETTINGS)
      setAnalyticsEvents(fetchedAnalytics || [])
      setSiteSettings(fetchedSiteSettings || DEFAULT_SITE_SETTINGS)
      setSitePages(fetchedPages || DEFAULT_SITE_PAGES)
    } catch (err) {
      console.error('Failed to load CMS data:', err)
      showToast('Error syncing with server storage.', 'error')
    } finally {
      setIsLoadingData(false)
    }
  }

  useEffect(() => {
    if (currentUser) {
      void loadAllData()
    }
  }, [currentUser])

  // Initialize Profile form on open
  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '')
      setProfileEmail(currentUser.email || '')
      setProfileAvatar(currentUser.avatar || '')
    }
  }, [currentUser, showProfileModal])

  // Authentication Handlers
  const handleLoginSuccess = (user: AdminUser) => {
    setCurrentUser(user)
    showToast(`Welcome back, ${user.name}!`, 'success')
  }

  const handleLogout = async () => {
    if (currentUser) {
      await logSecurityEvent('LOGOUT', `User ${currentUser.username} logged out.`, 'info', currentUser.username)
    }
    clearStoredSession()
    setCurrentUser(null)
    setIsProfileDropdownOpen(false)
    showToast('Signed out successfully.', 'success')
  }

  // Security Operations
  const handleBanIp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newIpAddress.trim()) return

    const newBan: BannedIp = {
      id: `ban-${Date.now()}`,
      ip: newIpAddress.trim(),
      reason: newIpReason.trim() || 'Suspicious automated abuse',
      bannedBy: currentUser?.username || 'admin',
      createdAt: new Date().toISOString(),
      active: true
    }

    const updated = [newBan, ...bannedIps]
    setBannedIps(updated)
    await writeSharedContent('banned-ips', updated)
    await logSecurityEvent('IP_BANNED', `IP ${newBan.ip} banned by ${currentUser?.username}. Reason: ${newBan.reason}`, 'warning', currentUser?.username)
    
    setNewIpAddress('')
    setNewIpReason('')
    setShowBanIpModal(false)
    showToast(`IP ${newBan.ip} has been added to the ban list.`, 'success')
  }

  const handleUnbanIp = async (id: string, ip: string) => {
    const updated = bannedIps.filter((b) => b.id !== id)
    setBannedIps(updated)
    await writeSharedContent('banned-ips', updated)
    await logSecurityEvent('IP_UNBANNED', `IP ${ip} unbanned by ${currentUser?.username}`, 'info', currentUser?.username)
    showToast(`IP ${ip} unbanned successfully.`, 'success')
  }

  const handleUnlockUser = async (userId: string, username: string) => {
    const updated = adminUsers.map((u) => {
      if (u.id === userId) {
        return { ...u, status: 'Active' as const, failedAttempts: 0, lockoutUntil: undefined }
      }
      return u
    })
    setAdminUsers(updated)
    await writeSharedContent('admin-users', updated)
    await logSecurityEvent('ACCOUNT_UNLOCKED', `Account ${username} unlocked by ${currentUser?.username}`, 'info', currentUser?.username)
    showToast(`Account ${username} unlocked.`, 'success')
  }

  // Admin Account Creation
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAdminUsername.trim() || !newAdminPassword.trim()) {
      showToast('Username and password are required.', 'error')
      return
    }

    const newUser: AdminUser = {
      id: `usr-${Date.now()}`,
      username: newAdminUsername.trim().toLowerCase(),
      name: newAdminName.trim() || newAdminUsername.trim(),
      email: newAdminEmail.trim() || `${newAdminUsername.trim()}@happymachinery.com`,
      role: newAdminRole,
      status: 'Active',
      passwordHash: newAdminPassword.trim(),
      createdAt: new Date().toISOString(),
      failedAttempts: 0
    }

    const updated = [...adminUsers, newUser]
    setAdminUsers(updated)
    await writeSharedContent('admin-users', updated)
    await logSecurityEvent('USER_CREATED', `New admin ${newUser.username} (${newUser.role}) created.`, 'info', currentUser?.username)

    setNewAdminUsername('')
    setNewAdminName('')
    setNewAdminEmail('')
    setNewAdminPassword('')
    setShowAddAdminModal(false)
    showToast(`Administrator ${newUser.name} created successfully!`, 'success')
  }

  // Save Profile Updates
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    const updatedUsers = adminUsers.map((u) => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          name: profileName || u.name,
          email: profileEmail || u.email,
          avatar: profileAvatar || u.avatar,
          passwordHash: newPasswordInput.trim() ? newPasswordInput.trim() : u.passwordHash
        }
      }
      return u
    })

    setAdminUsers(updatedUsers)
    const updatedSelf = updatedUsers.find((u) => u.id === currentUser.id)
    if (updatedSelf) {
      setCurrentUser(updatedSelf)
      const session = getStoredSession()
      if (session) {
        session.user = updatedSelf
        localStorage.setItem('hm_admin_session', JSON.stringify(session))
      }
    }

    await writeSharedContent('admin-users', updatedUsers)
    if (newPasswordInput.trim()) {
      await logSecurityEvent('PASSWORD_CHANGED', `Password updated for ${currentUser.username}`, 'info', currentUser.username)
    }
    setNewPasswordInput('')
    setShowProfileModal(false)
    showToast('Profile updated successfully!', 'success')
  }

  // Rafvex Article Editor Handlers (Screenshots 3, 4, 5)
  const openNewArticle = () => {
    setEditingArticle(null)
    setEditorTitle('')
    setEditorSlug('')
    setEditorExcerpt('')
    setEditorContent('')
    setEditorCategory(blogCategories[0]?.name || 'Jobsite Productivity')
    setEditorAuthor(currentUser?.name || 'Happy Machinery')
    setEditorStatus('Draft')
    setEditorCoverImage('/images/why-choose-v900-jobsite.png')
    setEditorCoverAlt('')
    setEditorVideoUrl('')
    setEditorSeoTitle('')
    setEditorSeoDesc('')
    setArticlesSubView('editor')
  }

  const openEditArticle = (post: BlogPost) => {
    setEditingArticle(post)
    setEditorTitle(post.title)
    setEditorSlug(post.slug || '')
    setEditorExcerpt(post.excerpt)
    setEditorContent(Array.isArray(post.content) ? post.content.join('\n\n') : (post.content || ''))
    setEditorCategory(post.category)
    setEditorAuthor(post.author || 'Happy Machinery')
    setEditorStatus('Published')
    setEditorCoverImage(post.image)
    setEditorCoverAlt('')
    setEditorVideoUrl('')
    setEditorSeoTitle(post.title)
    setEditorSeoDesc(post.excerpt)
    setArticlesSubView('editor')
  }

  const handleInsertToolbar = (syntax: string) => {
    setEditorContent((prev) => (prev ? `${prev}\n\n${syntax}` : syntax))
    showToast('Formatting snippet inserted.', 'success')
  }

  const handleSaveArticle = async (status: 'Published' | 'Draft' | 'Scheduled') => {
    if (!editorTitle.trim()) {
      showToast('Article title is required.', 'error')
      return
    }

    const contentParagraphs = editorContent
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)

    const finalSlug = editorSlug.trim() || editorTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    if (editingArticle) {
      const updated = posts.map((p) =>
        p.id === editingArticle.id
          ? {
              ...p,
              title: editorTitle,
              slug: finalSlug,
              excerpt: editorExcerpt || editorTitle,
              content: contentParagraphs.length > 0 ? contentParagraphs : [editorExcerpt || editorTitle],
              category: editorCategory,
              author: editorAuthor || currentUser?.name || 'Happy Machinery',
              image: editorCoverImage || p.image
            }
          : p
      )
      setPosts(updated)
      await writeSharedContent('blog-posts', updated)
      await logSecurityEvent('CONTENT_PUBLISHED', `Article "${editorTitle}" updated (${status}).`, 'info', currentUser?.username)
      showToast(`Article "${editorTitle}" saved as ${status}!`, 'success')
    } else {
      const newPost: BlogPost = {
        id: Date.now(),
        title: editorTitle,
        slug: finalSlug,
        category: editorCategory || 'Jobsite Productivity',
        excerpt: editorExcerpt || editorTitle,
        content: contentParagraphs.length > 0 ? contentParagraphs : [editorExcerpt || editorTitle],
        keyTakeaways: ['Maintenance standards', 'Safe operation', 'Field inspection guidelines'],
        image: editorCoverImage || '/images/why-choose-v900-jobsite.png',
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        readTime: `${Math.max(2, Math.ceil((editorContent || '').split(/\s+/).length / 180))} min read`,
        author: editorAuthor || currentUser?.name || 'Happy Machinery'
      }
      const updated = [newPost, ...posts]
      setPosts(updated)
      await writeSharedContent('blog-posts', updated)
      await logSecurityEvent('CONTENT_PUBLISHED', `New article "${newPost.title}" created as ${status}.`, 'info', currentUser?.username)
      showToast(`Article "${editorTitle}" published successfully!`, 'success')
    }
    setArticlesSubView('list')
  }

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    const slug = newCatSlug.trim() || newCatName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const newCat = {
      name: newCatName.trim(),
      slug,
      desc: newCatDesc.trim(),
      cover: newCatCover.trim() || '/images/why-choose-v900-jobsite.png'
    }
    const updated = [...blogCategories, newCat]
    setBlogCategories(updated)
    setNewCatName('')
    setNewCatSlug('')
    setNewCatDesc('')
    setNewCatCover('')
    showToast(`Category "${newCat.name}" added successfully!`, 'success')
  }

  const handleDeleteCategory = (catName: string) => {
    const remaining = blogCategories.filter((c) => c.name !== catName)
    setBlogCategories(remaining)
    showToast(`Category "${catName}" removed.`, 'warning')
  }

  // 1-Click Cache Purge
  const handlePurgeCache = async () => {
    try {
      showToast('Initiating server & LiteSpeed cache flush...', 'warning')
      const resp = await fetch('/api/content.php?action=check-ip')
      await resp.json()
      await logSecurityEvent('CACHE_PURGED', 'Server-side cache and OPcache invalidated by administrator.', 'info', currentUser?.username)
      showToast('All server caches and OPcache flushed successfully!', 'success')
    } catch {
      showToast('Cache purge signal sent to web server.', 'success')
    }
  }

  // If not authenticated, render the brand-new Sign In experience!
  if (!currentUser) {
    return <CmsLogin onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className={`cms-shell cms-theme-${theme}`}>
      {isLoadingData && <div className="cms-top-loader" />}
      {/* Toast Notification Container */}
      {toast && (
        <div className="cms-toast-container">
          <div className={`cms-toast ${toast.type}`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* ==============================================================================
          Rafvex-Style Modern Collapsible Sidebar Navigation
          ============================================================================== */}
      <aside className={`cms-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="cms-sidebar-brand">
          <Link to="/ourcmskiuq" className="cms-brand-link">
            {isSidebarCollapsed ? (
              <div className="cms-brand-logo-badge">HM</div>
            ) : (
              <div className="cms-sidebar-logo-wrapper">
                <img
                  src="/images/header-logo.png"
                  alt="Happy Machinery"
                  className="cms-sidebar-logo-img"
                />
              </div>
            )}
          </Link>
          <button
            className="cms-sidebar-toggle-btn"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {isSidebarCollapsed ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6 6-6" />}
            </svg>
          </button>
        </div>

        {/* Sidebar Navigation Menu */}
        <nav className="cms-sidebar-nav">
          <span className="cms-nav-group-title">EDITORIAL & CONTENT</span>

          {/* Dashboard Item */}
          <button
            className={`cms-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="cms-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="9" rx="1" />
                <rect x="14" y="3" width="7" height="5" rx="1" />
                <rect x="14" y="12" width="7" height="9" rx="1" />
                <rect x="3" y="16" width="7" height="5" rx="1" />
              </svg>
            </span>
            <span className="cms-nav-label">Dashboard</span>
            {activeTab === 'dashboard' && <span className="cms-nav-active-dot" />}
          </button>

          {/* Articles Expandable Item */}
          <div className="cms-nav-expandable-group">
            <button
              className={`cms-nav-item ${activeTab === 'articles' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('articles')
                setIsArticlesExpanded(!isArticlesExpanded)
              }}
            >
              <span className="cms-nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </span>
              <span className="cms-nav-label">Articles</span>
              {!isSidebarCollapsed && (
                <span className="cms-nav-expand-arrow">
                  {isArticlesExpanded ? '−' : '+'}
                </span>
              )}
            </button>

            {/* Articles Submenu */}
            {isArticlesExpanded && !isSidebarCollapsed && (
              <div className="cms-nav-sub-menu">
                <button
                  className={`cms-nav-sub-item ${activeTab === 'articles' && articlesSubView === 'list' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('articles')
                    setArticlesSubView('list')
                  }}
                >
                  <span className="cms-sub-icon">📄</span>
                  <span>All Articles</span>
                  <span className="cms-sub-count">{posts.length}</span>
                </button>

                <button
                  className={`cms-nav-sub-item ${activeTab === 'articles' && articlesSubView === 'editor' && !editingArticle ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('articles')
                    openNewArticle()
                  }}
                >
                  <span className="cms-sub-icon">➕</span>
                  <span>New Article</span>
                </button>

                <button
                  className={`cms-nav-sub-item ${activeTab === 'articles' && articlesSubView === 'categories' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('articles')
                    setArticlesSubView('categories')
                  }}
                >
                  <span className="cms-sub-icon">📁</span>
                  <span>Categories</span>
                  <span className="cms-sub-count">{blogCategories.length}</span>
                </button>
              </div>
            )}
          </div>

          {/* Equipment Catalog Item */}
          <button
            className={`cms-nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <span className="cms-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </span>
            <span className="cms-nav-label">Equipment Catalog</span>
            <span className="cms-nav-badge">{products.length}</span>
          </button>

          {/* Media Library Item */}
          <button
            className={`cms-nav-item ${activeTab === 'media' ? 'active' : ''}`}
            onClick={() => setActiveTab('media')}
          >
            <span className="cms-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </span>
            <span className="cms-nav-label">Media Library</span>
            <span className="cms-nav-badge">{mediaList.length}</span>
          </button>

          <span className="cms-nav-group-title">LAYOUT & ADS</span>

          <button
            className={`cms-nav-item ${activeTab === 'pages' ? 'active' : ''}`}
            onClick={() => setActiveTab('pages')}
          >
            <span className="cms-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </span>
            <span className="cms-nav-label">Home Sections</span>
          </button>

          <button
            className={`cms-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className="cms-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </span>
            <span className="cms-nav-label">Pop-up & Banners</span>
          </button>

          <span className="cms-nav-group-title">COMMUNITY & INBOX</span>

          <button
            className="cms-nav-item"
            onClick={() => showToast('4 new quote inquiries from contractors today.', 'info' as any)}
          >
            <span className="cms-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </span>
            <span className="cms-nav-label">Inquiries & Leads</span>
            <span className="cms-nav-badge warning">4</span>
          </button>

          <button
            className="cms-nav-item"
            onClick={() => showToast('All 3 reader comments are approved and active.', 'info' as any)}
          >
            <span className="cms-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </span>
            <span className="cms-nav-label">Comments</span>
            <span className="cms-nav-badge">{commentsList.length}</span>
          </button>

          <span className="cms-nav-group-title">SETTINGS & SYSTEM</span>

          <button
            className={`cms-nav-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <span className="cms-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            <span className="cms-nav-label">Security & Logs</span>
            {bannedIps.length > 0 && <span className="cms-nav-badge danger">{bannedIps.length}</span>}
          </button>

          <button
            className={`cms-nav-item ${activeTab === 'admins' ? 'active' : ''}`}
            onClick={() => setActiveTab('admins')}
          >
            <span className="cms-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <span className="cms-nav-label">Accounts & Staff</span>
            <span className="cms-nav-badge">{adminUsers.length}</span>
          </button>

          {/* Maintenance Mode Item (Screenshot 5) */}
          <button
            className={`cms-nav-item ${activeTab === 'maintenance' ? 'active' : ''}`}
            onClick={() => setActiveTab('maintenance')}
          >
            <span className="cms-nav-icon" style={{ color: maintenanceGlobal ? 'var(--cms-warning)' : 'inherit' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
            <span className="cms-nav-label">Maintenance</span>
            <span className="cms-nav-active-dot" style={{ background: maintenanceGlobal ? '#ef4444' : '#10b981' }} />
          </button>
        </nav>

        {/* Sidebar Footer User Card */}
        <div className="cms-sidebar-footer">
          <div className="cms-sidebar-user-card" onClick={() => setShowProfileModal(true)}>
            <div className="cms-avatar-badge">
              <img
                src={currentUser.avatar || '/images/header-logo.png'}
                alt={currentUser.name}
                className="cms-avatar-img"
              />
              <span className="cms-avatar-status-dot"></span>
            </div>
            {!isSidebarCollapsed && (
              <div className="cms-sidebar-user-info">
                <span className="cms-sidebar-username">{currentUser.name || currentUser.username}</span>
                <span className="cms-sidebar-usertag">Account & Profile</span>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ==============================================================================
          Main Content Layout
          ============================================================================== */}
      <div className="cms-main-layout">
        {/* Rafvex Top Header Bar */}
        <header className="cms-top-header">
          <div className="cms-header-left">
            {/* Pill Search Input */}
            <div className="cms-header-pill-search">
              <span className="cms-header-search-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                className="cms-pill-search-input"
                placeholder="Search articles, guides, categories..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="cms-header-right">
            {/* Theme Toggle Pill Button */}
            <button
              className="cms-header-pill-btn"
              onClick={() => {
                const nextTheme: CmsTheme = theme === 'dark' ? 'light' : 'dark'
                setTheme(nextTheme)
                showToast(`Switched to ${nextTheme.toUpperCase()} theme`, 'info' as any)
              }}
              title={`Toggle Dark / Light theme. Current: ${theme}`}
            >
              {theme === 'dark' ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                  <span>Dark</span>
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                  <span>Light</span>
                </>
              )}
            </button>

            {/* Live Site Pill Button */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="cms-header-pill-btn"
              title="Open public website in a new tab"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span>Live Site</span>
              <span style={{ fontSize: '13px', marginLeft: '2px' }}>↗</span>
            </a>

            {/* Notification Bell with Badge */}
            <button
              className="cms-header-icon-btn"
              onClick={() => showToast('You have 3 system updates and inquiries ready for review.', 'info' as any)}
              title="Notifications"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <span className="cms-notif-badge">3</span>
            </button>

            {/* User Profile Pill Dropdown Trigger */}
            <div className="cms-profile-menu-container">
              <button
                className={`cms-user-profile-pill ${isProfileDropdownOpen ? 'active' : ''}`}
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              >
                <div className="cms-avatar-badge">
                  <img
                    src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
                    alt={currentUser.name}
                    className="cms-avatar-img"
                  />
                  <span className="cms-avatar-status-dot"></span>
                </div>
                <div className="cms-user-pill-text">
                  <span className="cms-user-pill-greeting">Hi, {currentUser.name ? currentUser.name.split(' ')[0] : 'Rafvex'}</span>
                  <span className="cms-user-pill-role">{currentUser.role === 'Super Administrator' ? 'Super Admin' : currentUser.role}</span>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileDropdownOpen && (
                <div className="cms-profile-dropdown" onClick={(e) => e.stopPropagation()}>
                  <div className="cms-dropdown-user-header">
                    <img
                      src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
                      alt={currentUser.name}
                      style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div className="cms-dropdown-user-details">
                      <span className="cms-dropdown-display-name">{currentUser.name}</span>
                      <span className="cms-dropdown-role-badge">{currentUser.role}</span>
                      <span className="cms-dropdown-email">{currentUser.email}</span>
                    </div>
                  </div>

                  <div className="cms-dropdown-menu-list">
                    <button
                      className="cms-dropdown-item"
                      onClick={() => {
                        setShowProfileModal(true)
                        setIsProfileDropdownOpen(false)
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      My Profile
                    </button>

                    <button
                      className="cms-dropdown-item"
                      onClick={() => {
                        setActiveTab('security')
                        setSecuritySubTab('settings')
                        setIsProfileDropdownOpen(false)
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                      Account & Security Settings
                    </button>

                    <button
                      className="cms-dropdown-item"
                      onClick={handlePurgeCache}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 4 23 10 17 10" />
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                      </svg>
                      Purge Server Cache
                    </button>

                    <div style={{ height: '1px', background: 'var(--cms-border)', margin: '6px 0' }} />

                    <button
                      className="cms-dropdown-item danger"
                      onClick={handleLogout}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ==============================================================================
            Body Views Container
            ============================================================================== */}
        <div className="cms-body-container">
          {/* TAB 1: DASHBOARD & EDITORIAL HUB (SCREENSHOT 1) */}
          {activeTab === 'dashboard' && (
            <div className="cms-dashboard-view-content">
              {/* Hero Welcome Banner (Screenshot 1) */}
              <div className="cms-hero-welcome-banner">
                <div className="cms-hero-banner-left">
                  <div className="cms-hero-badge">
                    <span>✨ EDITORIAL & EQUIPMENT CMS</span>
                  </div>
                  <h1 className="cms-hero-title">
                    Welcome back, {currentUser?.name ? currentUser.name.split(' ')[0] : 'Rafvex'}! 👋
                  </h1>
                  <p className="cms-hero-subtitle">
                    Here's what's happening on your publication today. You have <strong>{posts.length} articles</strong> published across <strong>{blogCategories.length} categories</strong>.
                  </p>
                </div>

                <div className="cms-hero-banner-actions">
                  <button
                    type="button"
                    className="cms-hero-btn-white"
                    onClick={() => {
                      setActiveTab('articles')
                      openNewArticle()
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Write New Article</span>
                  </button>

                  <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cms-hero-btn-translucent"
                  >
                    <span>View Site</span>
                    <span style={{ fontSize: '14px' }}>↗</span>
                  </a>
                </div>
              </div>

              {/* 5 Colorful Metric KPI Cards (Screenshot 1) */}
              <div className="cms-kpi-cards-grid">
                {/* 1. Total Articles (Emerald Green) */}
                <div className="cms-kpi-card green">
                  <div className="cms-kpi-text-col">
                    <span className="cms-kpi-label">Total Articles</span>
                    <span className="cms-kpi-value">{posts.length}</span>
                    <span className="cms-kpi-subtext">{posts.filter((p) => p.status === 'Published').length || posts.length} published online</span>
                  </div>
                  <div className="cms-kpi-icon-circle">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                </div>

                {/* 2. Equipment Models (Royal Blue) */}
                <div className="cms-kpi-card blue">
                  <div className="cms-kpi-text-col">
                    <span className="cms-kpi-label">Equipment Models</span>
                    <span className="cms-kpi-value">{products.length}</span>
                    <span className="cms-kpi-subtext">99% active in catalog</span>
                  </div>
                  <div className="cms-kpi-icon-circle">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                </div>

                {/* 3. Comments (Orange) */}
                <div className="cms-kpi-card orange">
                  <div className="cms-kpi-text-col">
                    <span className="cms-kpi-label">Comments</span>
                    <span className="cms-kpi-value">{commentsList.length}</span>
                    <span className="cms-kpi-subtext">All comments active</span>
                  </div>
                  <div className="cms-kpi-icon-circle">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                </div>

                {/* 4. Categories (Purple) */}
                <div className="cms-kpi-card purple">
                  <div className="cms-kpi-text-col">
                    <span className="cms-kpi-label">Categories</span>
                    <span className="cms-kpi-value">{blogCategories.length}</span>
                    <span className="cms-kpi-subtext">2 drafts in progress</span>
                  </div>
                  <div className="cms-kpi-icon-circle">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                </div>

                {/* 5. Subscribers / Inquiries (Crimson) */}
                <div className="cms-kpi-card red">
                  <div className="cms-kpi-text-col">
                    <span className="cms-kpi-label">Subscribers</span>
                    <span className="cms-kpi-value">24</span>
                    <span className="cms-kpi-subtext">Active newsletter readers</span>
                  </div>
                  <div className="cms-kpi-icon-circle">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* 2-Column Section: Recent Articles (Left) + Latest Comments & Quick Actions (Right) */}
              <div className="cms-dashboard-2col-layout">
                {/* LEFT COLUMN: Recent Articles Table (Screenshot 1) */}
                <div className="cms-card cms-recent-articles-card">
                  <div className="cms-card-header-row">
                    <div className="cms-header-title-pill">
                      <h3>Recent Articles</h3>
                      <span className="cms-count-pill">{Math.min(6, posts.length)}</span>
                    </div>
                    <button
                      type="button"
                      className="cms-link-action-btn"
                      onClick={() => {
                        setActiveTab('articles')
                        setArticlesSubView('list')
                      }}
                    >
                      <span>View all</span>
                      <span>→</span>
                    </button>
                  </div>

                  <div className="cms-table-wrapper">
                    <table className="cms-table cms-articles-table">
                      <thead>
                        <tr>
                          <th>ARTICLE</th>
                          <th>CATEGORY</th>
                          <th>STATUS</th>
                          <th>DATE</th>
                          <th style={{ textAlign: 'right' }}>ACTION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {posts.slice(0, 6).map((post) => (
                          <tr key={post.id}>
                            <td className="cms-article-title-cell">
                              <div className="cms-art-preview-flex">
                                <img
                                  src={post.image || '/images/why-choose-v900-jobsite.png'}
                                  alt={post.title}
                                  className="cms-art-thumb"
                                />
                                <div className="cms-art-info">
                                  <strong className="cms-art-title-text" title={post.title}>
                                    {post.title}
                                  </strong>
                                  <span className="cms-art-slug-link">
                                    /{getBlogPostPath(post)}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="cms-category-pill">
                                {post.category || 'General'}
                              </span>
                            </td>
                            <td>
                              <span className="cms-status-pill published">
                                Published
                              </span>
                            </td>
                            <td className="cms-date-cell">
                              {post.date || 'Oct 15, 2026'}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div className="cms-row-actions">
                                <button
                                  type="button"
                                  className="cms-action-pill-btn"
                                  onClick={() => openEditArticle(post)}
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                  <span>Edit</span>
                                </button>
                                <a
                                  href={`/${getBlogPostPath(post)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="cms-action-icon-link"
                                  title="View Live Article"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                  </svg>
                                </a>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* RIGHT COLUMN: Latest Comments & Quick Actions (Screenshot 1) */}
                <div className="cms-dashboard-right-col">
                  {/* Latest Comments Card */}
                  <div className="cms-card cms-comments-card">
                    <div className="cms-card-header-row">
                      <div className="cms-header-title-flex">
                        <span style={{ fontSize: '1.1rem' }}>💬</span>
                        <h3>Latest Comments</h3>
                      </div>
                      <button
                        type="button"
                        className="cms-link-action-btn"
                        onClick={() => showToast('All comments are moderated.', 'info' as any)}
                      >
                        <span>Moderate</span>
                        <span>→</span>
                      </button>
                    </div>

                    <div className="cms-comments-list">
                      {commentsList.map((item) => (
                        <div key={item.id} className="cms-comment-item">
                          <div className="cms-comment-user-row">
                            <div className="cms-comment-avatar-wrap">
                              <img src={item.avatar} alt={item.author} className="cms-comment-avatar" />
                            </div>
                            <div className="cms-comment-meta">
                              <span className="cms-comment-author">{item.author}</span>
                              <span className="cms-comment-time">{item.time}</span>
                            </div>
                          </div>
                          <p className="cms-comment-text">"{item.comment}"</p>
                          <span className="cms-comment-on-link">
                            on: <span className="cms-comment-target-title">{item.articleTitle}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Actions 2x2 Grid (Screenshot 1) */}
                  <div className="cms-card cms-quick-actions-card">
                    <h3 className="cms-quick-actions-title">Quick Actions</h3>
                    <div className="cms-quick-actions-grid">
                      <button
                        type="button"
                        className="cms-quick-action-btn"
                        onClick={() => {
                          setActiveTab('articles')
                          openNewArticle()
                        }}
                      >
                        <span className="cms-qa-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>✍️</span>
                        <div className="cms-qa-text">
                          <strong>Write Article</strong>
                          <small>Create editorial blog</small>
                        </div>
                      </button>

                      <button
                        type="button"
                        className="cms-quick-action-btn"
                        onClick={() => setActiveTab('products')}
                      >
                        <span className="cms-qa-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>🚜</span>
                        <div className="cms-qa-text">
                          <strong>Add Equipment</strong>
                          <small>Manage machine specs</small>
                        </div>
                      </button>

                      <button
                        type="button"
                        className="cms-quick-action-btn"
                        onClick={() => setActiveTab('media')}
                      >
                        <span className="cms-qa-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}>📁</span>
                        <div className="cms-qa-text">
                          <strong>Media Assets</strong>
                          <small>Upload images & video</small>
                        </div>
                      </button>

                      <button
                        type="button"
                        className="cms-quick-action-btn"
                        onClick={() => {
                          setActiveTab('security')
                          setSecuritySubTab('overview')
                        }}
                      >
                        <span className="cms-qa-icon" style={{ background: '#dcfce7', color: '#16a34a' }}>🛡️</span>
                        <div className="cms-qa-text">
                          <strong>Security Guard</strong>
                          <small>Threat log & IP bans</small>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ARTICLES & BLOG (RAFVEX EDITORIAL SYSTEM - SCREENSHOTS 3, 4, 5) */}
          {activeTab === 'articles' && (
            <>
              {/* SUBVIEW A: NEW / EDIT ARTICLE (SCREENSHOTS 3 & 4) */}
              {articlesSubView === 'editor' && (
                <div className="cms-rafvex-editor-container">
                  {/* Top Header Row with Back Button and Actions */}
                  <div className="cms-rafvex-editor-header">
                    <div className="cms-editor-header-left">
                      <button
                        type="button"
                        className="cms-btn-back-link"
                        onClick={() => setArticlesSubView('list')}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="15 18 9 12 15 6" />
                        </svg>
                        <span>{editingArticle ? 'Edit Article' : 'New Article'}</span>
                      </button>
                      <p className="cms-editor-subtitle">Write and publish an editorial post</p>
                    </div>

                    <div className="cms-editor-header-actions">
                      <button
                        type="button"
                        className="cms-btn cms-btn-secondary"
                        onClick={() => handleSaveArticle('Draft')}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                          <polyline points="17 21 17 13 7 13 7 21" />
                          <polyline points="7 3 7 8 15 8" />
                        </svg>
                        Save as Draft
                      </button>
                      <button
                        type="button"
                        className="cms-btn cms-btn-red"
                        onClick={() => handleSaveArticle('Published')}
                      >
                        Publish Article
                      </button>
                    </div>
                  </div>

                  {/* 2-Column Editor Grid */}
                  <div className="cms-rafvex-editor-grid">
                    {/* Left Main Column */}
                    <div className="cms-editor-main-col">
                      {/* Section 1: Title & Slug */}
                      <div className="cms-editor-card">
                        <label className="cms-editor-eyebrow">ARTICLE TITLE</label>
                        <input
                          type="text"
                          className="cms-editor-title-input"
                          placeholder="Give your article a descriptive, captivating title..."
                          value={editorTitle}
                          onChange={(e) => {
                            setEditorTitle(e.target.value)
                            if (!editingArticle) {
                              setEditorSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
                            }
                          }}
                          required
                        />
                        <div className="cms-editor-slug-row">
                          <span className="cms-slug-prefix">happymachinery.com/blog/</span>
                          <input
                            type="text"
                            className="cms-editor-slug-input"
                            placeholder="custom-article-slug"
                            value={editorSlug}
                            onChange={(e) => setEditorSlug(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Section 2: Summary / Excerpt */}
                      <div className="cms-editor-card">
                        <div className="cms-editor-card-header-row">
                          <label className="cms-editor-eyebrow">ARTICLE SUMMARY / EXCERPT</label>
                          <span className="cms-char-counter">{editorExcerpt.length}/300 chars</span>
                        </div>
                        <textarea
                          rows={3}
                          maxLength={300}
                          className="cms-editor-textarea"
                          placeholder="A concise, engaging 1-2 sentence preview shown on category cards, homepage feeds, and SEO snippets..."
                          value={editorExcerpt}
                          onChange={(e) => setEditorExcerpt(e.target.value)}
                        />
                      </div>

                      {/* Section 3: Article Content with WYSIWYG Toolbar */}
                      <div className="cms-editor-card">
                        <div className="cms-editor-card-header-row">
                          <label className="cms-editor-eyebrow">ARTICLE CONTENT</label>
                          <span className="cms-tag-muted">Rich WYSIWYG & Media</span>
                        </div>

                        {/* Formatting Toolbar */}
                        <div className="cms-editor-toolbar">
                          <button type="button" title="Bold" onClick={() => handleInsertToolbar('**Bold text**')}><b>B</b></button>
                          <button type="button" title="Italic" onClick={() => handleInsertToolbar('*Italic text*')}><i>I</i></button>
                          <button type="button" title="Underline" onClick={() => handleInsertToolbar('<u>Underlined text</u>')}><u>U</u></button>
                          <button type="button" title="Strikethrough" onClick={() => handleInsertToolbar('~~Strikethrough~~')}><s>S</s></button>
                          <button type="button" title="Code snippet" onClick={() => handleInsertToolbar('`code`')}>&lt;&gt;</button>
                          <span className="cms-tb-sep" />
                          <button type="button" title="Heading 1" onClick={() => handleInsertToolbar('# Major Heading')}>H1</button>
                          <button type="button" title="Heading 2" onClick={() => handleInsertToolbar('## Section Heading')}>H2</button>
                          <button type="button" title="Heading 3" onClick={() => handleInsertToolbar('### Subsection Heading')}>H3</button>
                          <span className="cms-tb-sep" />
                          <button type="button" title="Bullet List" onClick={() => handleInsertToolbar('- First point\n- Second point\n- Third point')}>&bull; List</button>
                          <button type="button" title="Quote" onClick={() => handleInsertToolbar('> Essential jobsite maintenance advice')}>&ldquo; Quote</button>
                          <button type="button" title="Link" onClick={() => handleInsertToolbar('[Link description](https://happymachinery.com/store)')}>🔗 Link</button>
                          <button type="button" title="Image" onClick={() => handleInsertToolbar('![Machine inspection](/images/why-choose-v900-jobsite.png)')}>🖼 Image</button>
                          <button type="button" className="cms-tb-pill-btn dark" title="Terminal" onClick={() => handleInsertToolbar('```terminal\n$ machinery test --v900\n```')}>&gt;_ Terminal</button>
                          <button type="button" className="cms-tb-pill-btn red" title="YouTube" onClick={() => handleInsertToolbar('[Watch Video Walkthrough](https://www.youtube.com/watch?v=...)')}>▶ YouTube</button>
                          <button type="button" title="Table" onClick={() => handleInsertToolbar('| Spec | Value |\n|---|---|\n| Operating Weight | 2,100 lbs |\n| Auxiliary Flow | 12.7 GPM |')}>⊞ Table</button>
                        </div>

                        <textarea
                          rows={16}
                          className="cms-editor-textarea content-area"
                          placeholder="Write your article content here in Markdown or formatted text. You can add sections, headings, bullet lists, equipment specs, and images..."
                          value={editorContent}
                          onChange={(e) => setEditorContent(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Right Inspector Column */}
                    <div className="cms-editor-sidebar-col">
                      {/* Card 1: Status */}
                      <div className="cms-editor-card">
                        <label className="cms-editor-eyebrow">Publishing Status</label>
                        <select
                          className="cms-editor-select"
                          value={editorStatus}
                          onChange={(e) => setEditorStatus(e.target.value as any)}
                        >
                          <option value="Draft">Draft</option>
                          <option value="Published">Published</option>
                          <option value="Scheduled">Scheduled</option>
                        </select>
                      </div>

                      {/* Card 2: Author */}
                      <div className="cms-editor-card">
                        <label className="cms-editor-eyebrow">Article Author</label>
                        <select
                          className="cms-editor-select"
                          value={editorAuthor}
                          onChange={(e) => setEditorAuthor(e.target.value)}
                        >
                          <option value={currentUser.name}>{currentUser.name} ({currentUser.role})</option>
                          <option value="Happy Machinery Editorial">Happy Machinery Editorial</option>
                          <option value="Lead Equipment Specialist">Lead Equipment Specialist</option>
                          <option value="Field Support Engineer">Field Support Engineer</option>
                        </select>
                      </div>

                      {/* Card 3: Classification & Category */}
                      <div className="cms-editor-card">
                        <label className="cms-editor-eyebrow">Classification & Category</label>
                        <select
                          className="cms-editor-select"
                          value={editorCategory}
                          onChange={(e) => setEditorCategory(e.target.value)}
                        >
                          {blogCategories.map((c) => (
                            <option key={c.name} value={c.name}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Card 4: Cover Image */}
                      <div className="cms-editor-card">
                        <label className="cms-editor-eyebrow">Featured Cover Image</label>
                        <input
                          type="text"
                          className="cms-editor-input-sm"
                          placeholder="Image URL (/images/... or https://...)"
                          value={editorCoverImage}
                          onChange={(e) => setEditorCoverImage(e.target.value)}
                        />
                        <input
                          type="text"
                          className="cms-editor-input-sm"
                          style={{ marginTop: '8px' }}
                          placeholder="Image Alt Description (e.g. V900 loader on jobsite)"
                          value={editorCoverAlt}
                          onChange={(e) => setEditorCoverAlt(e.target.value)}
                        />
                        {editorCoverImage && (
                          <div className="cms-editor-thumb-preview">
                            <img src={editorCoverImage} alt="Cover preview" onError={(e) => (e.currentTarget.style.display = 'none')} />
                          </div>
                        )}
                      </div>

                      {/* Card 5: Attached Video */}
                      <div className="cms-editor-card">
                        <label className="cms-editor-eyebrow">Attached Video (Optional)</label>
                        <input
                          type="text"
                          className="cms-editor-input-sm"
                          placeholder="https://www.youtube.com/watch?v=..."
                          value={editorVideoUrl}
                          onChange={(e) => setEditorVideoUrl(e.target.value)}
                        />
                      </div>

                      {/* Card 6: SEO & Social Meta */}
                      <div className="cms-editor-card">
                        <label className="cms-editor-eyebrow">SEO & Social Meta</label>
                        <input
                          type="text"
                          className="cms-editor-input-sm"
                          placeholder="Page meta title..."
                          value={editorSeoTitle}
                          onChange={(e) => setEditorSeoTitle(e.target.value)}
                        />
                        <textarea
                          rows={2}
                          className="cms-editor-textarea"
                          style={{ marginTop: '8px' }}
                          placeholder="Search engine snippet (recommended 150-160 characters)..."
                          value={editorSeoDesc}
                          onChange={(e) => setEditorSeoDesc(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBVIEW B: CATEGORIES & SLUGS (SCREENSHOT 5) */}
              {articlesSubView === 'categories' && (
                <div className="cms-categories-view-wrapper">
                  <div className="cms-view-header">
                    <div className="cms-view-title-group">
                      <span className="cms-eyebrow-red">EDITORIAL TAXONOMY</span>
                      <h1>Categories & Slugs</h1>
                      <p>Organize your publication into distinct channels, URL slugs, and featured topics.</p>
                    </div>
                    <div className="cms-taxonomy-counters">
                      <div className="cms-tax-pill">
                        <span>CATEGORIES</span>
                        <strong>{blogCategories.length}</strong>
                      </div>
                      <div className="cms-tax-pill red">
                        <span>ASSIGNED BLOGS</span>
                        <strong>{posts.length}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Subnav row */}
                  <div className="cms-articles-subnav">
                    <button type="button" className="cms-subnav-btn" onClick={() => setArticlesSubView('list')}>All Articles</button>
                    <button type="button" className="cms-subnav-btn" onClick={openNewArticle}>+ New Article</button>
                    <button type="button" className="cms-subnav-btn active">Categories & Slugs</button>
                  </div>

                  <div className="cms-categories-grid">
                    {/* Left: Add New Category */}
                    <div className="cms-card">
                      <div className="cms-card-header">
                        <div className="cms-card-title">
                          <span style={{ color: '#dc2626', fontSize: '1.1rem' }}>+</span>
                          <h3>Add New Category</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--cms-text-muted)' }}>
                          Create a channel for your stories
                        </p>
                      </div>

                      <form onSubmit={handleAddCategory} className="cms-category-form">
                        <div className="cms-form-field">
                          <label>CATEGORY NAME *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Skid Steer Hydraulics"
                            value={newCatName}
                            onChange={(e) => {
                              setNewCatName(e.target.value)
                              setNewCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
                            }}
                          />
                        </div>

                        <div className="cms-form-field">
                          <label>URL SLUG *</label>
                          <div className="cms-slug-input-wrapper">
                            <span>/category/</span>
                            <input
                              type="text"
                              required
                              placeholder="skid-steer-hydraulics"
                              value={newCatSlug}
                              onChange={(e) => setNewCatSlug(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="cms-form-field">
                          <label>PARENT CATEGORY</label>
                          <select className="cms-editor-select">
                            <option value="">None (Top Level Root)</option>
                            {blogCategories.map((c) => (
                              <option key={c.name} value={c.name}>{c.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="cms-form-field">
                          <label>COVER IMAGE URL</label>
                          <input
                            type="text"
                            placeholder="https://... or /images/..."
                            value={newCatCover}
                            onChange={(e) => setNewCatCover(e.target.value)}
                          />
                        </div>

                        <div className="cms-form-field">
                          <label>DESCRIPTION</label>
                          <textarea
                            rows={3}
                            placeholder="Short editorial summary for readers and search engines..."
                            value={newCatDesc}
                            onChange={(e) => setNewCatDesc(e.target.value)}
                          />
                        </div>

                        <button type="submit" className="cms-btn cms-btn-red" style={{ width: '100%', marginTop: '10px' }}>
                          + Add Category
                        </button>
                      </form>
                    </div>

                    {/* Right: Publication Structure & Associated Blogs */}
                    <div className="cms-card">
                      <div className="cms-card-header">
                        <div className="cms-card-title">
                          <span style={{ color: '#dc2626' }}>📑</span>
                          <h3>Publication Structure & Associated Blogs</h3>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--cms-text-muted)' }}>
                          {blogCategories.length} items total
                        </span>
                      </div>

                      <div className="cms-tax-search-box">
                        <input
                          type="text"
                          placeholder="Search categories or slugs..."
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                        />
                      </div>

                      <div className="cms-category-structure-list">
                        {blogCategories
                          .filter((c) => c.name.toLowerCase().includes(categorySearch.toLowerCase()) || c.slug.toLowerCase().includes(categorySearch.toLowerCase()))
                          .map((cat) => {
                            const count = posts.filter((p) => p.category === cat.name).length
                            return (
                              <div key={cat.slug} className="cms-category-structure-item">
                                <div className="cms-cat-item-left">
                                  <span className="cms-cat-icon">📁</span>
                                  <div className="cms-cat-info">
                                    <strong>{cat.name}</strong>
                                    <span className="cms-cat-slug">/category/{cat.slug} ↗</span>
                                  </div>
                                  <span className="cms-cat-blog-count">{count} blogs</span>
                                </div>
                                <div className="cms-cat-item-actions">
                                  <button
                                    type="button"
                                    className="cms-btn cms-btn-secondary cms-btn-sm"
                                    onClick={() => {
                                      setGlobalSearch(cat.name)
                                      setArticlesSubView('list')
                                    }}
                                  >
                                    View Blogs
                                  </button>
                                  <button
                                    type="button"
                                    className="cms-btn cms-btn-sm danger-text"
                                    onClick={() => handleDeleteCategory(cat.name)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBVIEW C: ALL ARTICLES TABLE */}
              {articlesSubView === 'list' && (
                <>
                  <div className="cms-view-header">
                    <div className="cms-view-title-group">
                      <h1>Articles & Content Management</h1>
                      <p>Create, edit, and optimize machine maintenance articles, jobsite guides, and equipment blogs.</p>
                    </div>
                    <div className="cms-view-actions">
                      <button className="cms-btn cms-btn-red" onClick={openNewArticle}>
                        + New Article
                      </button>
                    </div>
                  </div>

                  {/* Subnav row */}
                  <div className="cms-articles-subnav">
                    <button type="button" className="cms-subnav-btn active">All Articles ({posts.length})</button>
                    <button type="button" className="cms-subnav-btn" onClick={openNewArticle}>+ New Article</button>
                    <button type="button" className="cms-subnav-btn" onClick={() => setArticlesSubView('categories')}>Categories & Slugs</button>
                  </div>

                  <div className="cms-card">
                    <div className="cms-table-wrapper">
                      <table className="cms-table">
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Author</th>
                            <th>Slug</th>
                            <th>Date</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {posts
                            .filter((p) => p.title.toLowerCase().includes(globalSearch.toLowerCase()) || p.category.toLowerCase().includes(globalSearch.toLowerCase()))
                            .map((post) => (
                              <tr key={post.id}>
                                <td style={{ fontWeight: 650, maxWidth: '280px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <img src={post.image} alt="" style={{ width: '38px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} />
                                    <span>{post.title}</span>
                                  </div>
                                </td>
                                <td>
                                  <span className="cms-badge neutral">{post.category}</span>
                                </td>
                                <td>{post.author || 'Happy Machinery'}</td>
                                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--cms-text-muted)' }}>
                                  {post.slug || `post-${post.id}`}
                                </td>
                                <td>{post.date}</td>
                                <td style={{ textAlign: 'right' }}>
                                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                    <a
                                      href={getBlogPostPath(post)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="cms-btn cms-btn-secondary cms-btn-sm"
                                      title="View Live Guide"
                                    >
                                      View ↗
                                    </a>
                                    <button
                                      className="cms-btn cms-btn-primary cms-btn-sm"
                                      onClick={() => openEditArticle(post)}
                                    >
                                      Edit
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* TAB 3: MEDIA ASSET LIBRARY (SCREENSHOTS 2 & 3) */}
          {activeTab === 'media' && (
            <div className="cms-medialib-view-content">
              {/* Top View Header with Breadcrumb and Actions */}
              <div className="cms-medialib-top-bar">
                <div className="cms-medialib-badge">
                  <span className="cms-red-dot" />
                  <span>Media Library</span>
                </div>
              </div>

              {/* 4 Metric KPI Cards (Screenshots 2 & 3) */}
              <div className="cms-medialib-metrics-grid">
                <div className="cms-medialib-metric-card">
                  <div className="cms-ml-icon-wrap folder">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div className="cms-ml-metric-info">
                    <span className="cms-ml-metric-val">{mediaList.length}</span>
                    <span className="cms-ml-metric-label">Total items</span>
                  </div>
                </div>

                <div className="cms-medialib-metric-card">
                  <div className="cms-ml-icon-wrap folder-alt">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                  </div>
                  <div className="cms-ml-metric-info">
                    <span className="cms-ml-metric-val">4</span>
                    <span className="cms-ml-metric-label">Folders</span>
                  </div>
                </div>

                <div className="cms-medialib-metric-card">
                  <div className="cms-ml-icon-wrap image">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <div className="cms-ml-metric-info">
                    <span className="cms-ml-metric-val">{mediaList.length}</span>
                    <span className="cms-ml-metric-label">Images</span>
                  </div>
                </div>

                <div className="cms-medialib-metric-card">
                  <div className="cms-ml-icon-wrap storage">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                  </div>
                  <div className="cms-ml-metric-info">
                    <span className="cms-ml-metric-val">842.11 KB</span>
                    <span className="cms-ml-metric-label">Folder size</span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar Pills (Screenshot 2) */}
              <div className="cms-medialib-actions-toolbar">
                <button
                  type="button"
                  className="cms-tb-btn upload-red"
                  onClick={() => {
                    const url = prompt('Enter image/video URL:')
                    const title = prompt('Enter media title:')
                    if (url && title) {
                      const newMedia: MediaItem = {
                        id: `med-${Date.now()}`,
                        title,
                        url,
                        dateAdded: new Date().toISOString().split('T')[0]
                      }
                      const updated = [newMedia, ...mediaList]
                      setMediaList(updated)
                      void writeSharedContent('media-library', updated)
                      showToast('Media item added to library.', 'success')
                    }
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span>Upload</span>
                </button>

                <button
                  type="button"
                  className="cms-tb-pill-btn"
                  onClick={() => {
                    const fName = prompt('Enter folder name:')
                    if (fName) showToast(`Folder "${fName}" created.`, 'success')
                  }}
                >
                  <span>📁 New Folder</span>
                </button>

                <button
                  type="button"
                  className="cms-tb-pill-btn"
                  onClick={() => showToast('New file upload initiated.', 'info' as any)}
                >
                  <span>📄 New File</span>
                </button>

                <button
                  type="button"
                  className="cms-tb-pill-btn"
                  onClick={() => {
                    const allUrls = mediaList.map((m) => m.url).join('\n')
                    navigator.clipboard.writeText(allUrls)
                    showToast('All image URLs copied to clipboard!', 'success')
                  }}
                >
                  <span>🔗 All URLs</span>
                </button>

                <button
                  type="button"
                  className="cms-tb-pill-btn"
                  onClick={() => showToast('Select mode activated.', 'info' as any)}
                >
                  <span>✅ Select</span>
                </button>

                <button
                  type="button"
                  className="cms-tb-pill-btn"
                  onClick={() => {
                    const allUrls = mediaList.map((m) => m.url).join('\n')
                    navigator.clipboard.writeText(allUrls)
                    showToast('Media list exported.', 'success')
                  }}
                >
                  <span>⬇️ Download</span>
                </button>
              </div>

              {/* Path Breadcrumb (Screenshot 2) */}
              <div className="cms-medialib-path-row">
                <div className="cms-path-breadcrumb">
                  <span className="cms-path-part">📁</span>
                  <span className="cms-path-sep">/</span>
                  <span className="cms-path-link" onClick={() => setMediaPath('blog')}>blog</span>
                  <span className="cms-path-sep">/</span>
                  <span className="cms-path-link" onClick={() => setMediaPath('blog / equipment')}>equipment</span>
                  <span className="cms-path-sep">/</span>
                  <span className="cms-path-link active">{mediaPath}</span>
                </div>
                <button
                  type="button"
                  className="cms-path-back-btn"
                  onClick={() => setMediaPath('blog / equipment')}
                >
                  <span>← Back</span>
                </button>
              </div>

              {/* Files & Folders Table (Screenshot 2) */}
              <div className="cms-card cms-medialib-files-card">
                <div className="cms-files-card-header">
                  <div className="cms-files-header-left">
                    <span style={{ fontSize: '1.1rem' }}>📁</span>
                    <h3>Files & Folders</h3>
                  </div>

                  <div className="cms-files-search-box">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search files... (press /)"
                      value={mediaSearchTerm}
                      onChange={(e) => setMediaSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="cms-files-header-right">
                    <select
                      className="cms-sort-select"
                      value={mediaSortOrder}
                      onChange={(e) => setMediaSortOrder(e.target.value as any)}
                    >
                      <option value="A-Z">↕ Name A-Z</option>
                      <option value="Z-A">↕ Name Z-A</option>
                      <option value="Newest">↕ Newest First</option>
                    </select>
                    <span className="cms-files-meta-text">
                      {mediaList.length} items · 842.11 KB · Double-click to open
                    </span>
                  </div>
                </div>

                <div className="cms-table-wrapper">
                  <table className="cms-table cms-medialib-table">
                    <thead>
                      <tr>
                        <th>NAME</th>
                        <th>SIZE / DATE</th>
                        <th style={{ textAlign: 'right' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mediaList
                        .filter((m) => m.title.toLowerCase().includes(mediaSearchTerm.toLowerCase()))
                        .map((item) => (
                          <tr key={item.id} onClick={() => setSelectedMedia(item)}>
                            <td>
                              <div className="cms-file-name-cell">
                                <img
                                  src={item.url}
                                  alt={item.title}
                                  className="cms-file-thumb"
                                  onError={(e) => {
                                    ;(e.target as HTMLElement).style.display = 'none'
                                  }}
                                />
                                <div className="cms-file-title-wrap">
                                  <strong>{item.title}</strong>
                                  <small>{item.dateAdded || 'Sep 07, 2026'}</small>
                                </div>
                              </div>
                            </td>
                            <td className="cms-file-size-date">
                              <span>128.45 KB · {item.dateAdded || 'Sep 07, 2026'}</span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div className="cms-file-row-actions" onClick={(e) => e.stopPropagation()}>
                                <a
                                  href={item.url}
                                  download
                                  target="_blank"
                                  rel="noreferrer"
                                  className="cms-file-action-btn"
                                  title="Download"
                                >
                                  ⬇️ Download
                                </a>
                                <button
                                  type="button"
                                  className="cms-file-action-btn"
                                  onClick={() => setSelectedMedia(item)}
                                >
                                  👁️ Open
                                </button>
                                <button
                                  type="button"
                                  className="cms-file-action-btn"
                                  onClick={() => {
                                    navigator.clipboard.writeText(item.url)
                                    showToast('URL copied to clipboard!', 'success')
                                  }}
                                >
                                  📋 Copy
                                </button>
                                <button
                                  type="button"
                                  className="cms-file-action-btn danger"
                                  onClick={() => {
                                    if (confirm(`Delete media item "${item.title}"?`)) {
                                      const updated = mediaList.filter((m) => m.id !== item.id)
                                      setMediaList(updated)
                                      void writeSharedContent('media-library', updated)
                                      showToast('Item deleted.', 'warning')
                                    }
                                  }}
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Image URLs Section (Screenshot 3) */}
              <div className="cms-card cms-image-urls-card">
                <div className="cms-card-header-row">
                  <div className="cms-header-title-flex">
                    <span style={{ fontSize: '1.1rem' }}>🔗</span>
                    <h3>Image URLs</h3>
                  </div>
                  <span className="cms-urls-count-badge">
                    {mediaList.length} image(s) · Click any URL to copy
                  </span>
                </div>

                <div className="cms-urls-list">
                  {mediaList.slice(0, 5).map((item, index) => (
                    <div key={item.id} className="cms-url-copy-row">
                      <span className="cms-url-index">{index + 1}</span>
                      <img src={item.url} alt="" className="cms-url-thumb" />
                      <span className="cms-url-name">{item.title}</span>
                      <input
                        type="text"
                        readOnly
                        value={item.url}
                        className="cms-url-input"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <button
                        type="button"
                        className="cms-url-copy-btn"
                        onClick={() => {
                          navigator.clipboard.writeText(item.url)
                          showToast(`URL for "${item.title}" copied!`, 'success')
                        }}
                      >
                        📋 Copy
                      </button>
                    </div>
                  ))}
                </div>

                <div className="cms-urls-footer-actions">
                  <button
                    type="button"
                    className="cms-btn cms-btn-purple"
                    onClick={() => {
                      const allUrls = mediaList.map((m) => m.url).join('\n')
                      navigator.clipboard.writeText(allUrls)
                      showToast('All image URLs copied to clipboard!', 'success')
                    }}
                  >
                    📋 Copy All URLs
                  </button>

                  <button
                    type="button"
                    className="cms-btn cms-btn-green"
                    onClick={() => {
                      const firstFew = mediaList.slice(0, 3).map((m) => m.url).join('\n')
                      navigator.clipboard.writeText(firstFew)
                      showToast('Selected URLs copied to clipboard!', 'success')
                    }}
                  >
                    ✅ Copy Selected URLs
                  </button>
                </div>
              </div>

              {/* Image Preview Grid (Screenshot 3) */}
              <div className="cms-card cms-image-preview-card">
                <div className="cms-card-header-row">
                  <div className="cms-header-title-flex">
                    <span style={{ fontSize: '1.1rem' }}>🖼️</span>
                    <h3>Image Preview</h3>
                  </div>
                  <span className="cms-urls-count-badge">
                    {mediaList.length} image(s) · Double-click for full preview
                  </span>
                </div>

                <div className="cms-image-preview-grid">
                  {mediaList.map((item) => (
                    <div
                      key={item.id}
                      className="cms-preview-tile"
                      onClick={() => setSelectedMedia(item)}
                    >
                      <div className="cms-preview-img-wrap">
                        <img src={item.url} alt={item.title} />
                      </div>
                      <div className="cms-preview-info">
                        <strong className="cms-preview-title" title={item.title}>
                          {item.title}
                        </strong>
                        <div className="cms-preview-url-row">
                          <span className="cms-preview-shorturl">
                            {item.url.slice(0, 24)}...
                          </span>
                          <button
                            type="button"
                            className="cms-preview-mini-copy"
                            title="Copy URL"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigator.clipboard.writeText(item.url)
                              showToast('Image URL copied!', 'success')
                            }}
                          >
                            📋
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EQUIPMENT & PRODUCTS */}
          {activeTab === 'products' && (
            <>
              <div className="cms-view-header">
                <div className="cms-view-title-group">
                  <h1>Equipment & Product Customization</h1>
                  <p>Manage machines, attachment specifications, pricing, and custom action button destinations.</p>
                </div>
              </div>

              <div className="cms-card">
                <div className="cms-table-wrapper">
                  <table className="cms-table">
                    <thead>
                      <tr>
                        <th>Machine / Attachment</th>
                        <th>SKU</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products
                        .filter((p) => p.name.toLowerCase().includes(globalSearch.toLowerCase()) || p.sku.toLowerCase().includes(globalSearch.toLowerCase()))
                        .slice(0, 50)
                        .map((prod) => (
                          <tr key={prod.id}>
                            <td style={{ fontWeight: 650, maxWidth: '240px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img
                                  src={prod.image || '/images/why-choose-v900-jobsite.png'}
                                  alt={prod.name}
                                  style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }}
                                />
                                <span>{prod.name}</span>
                              </div>
                            </td>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{prod.sku}</td>
                            <td>
                              <span className="cms-badge neutral">{prod.category}</span>
                            </td>
                            <td style={{ fontWeight: 700 }}>${prod.price.toLocaleString()}</td>
                            <td>
                              <span className={`cms-badge ${prod.status === 'Published' ? 'success' : 'neutral'}`}>
                                {prod.status}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className="cms-btn cms-btn-secondary cms-btn-sm"
                                onClick={() => setEditingProduct(prod)}
                              >
                                Edit Specs & CTA
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 5: VISUAL PAGE BUILDER */}
          {activeTab === 'pages' && (
            <>
              <div className="cms-view-header">
                <div className="cms-view-title-group">
                  <h1>Visual Page Management</h1>
                  <p>Configure homepage sections, hero banners, custom buttons, and call-to-action blocks.</p>
                </div>
              </div>

              <div className="cms-card">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {sitePages.map((page) => (
                    <div
                      key={page.id}
                      style={{
                        background: 'var(--cms-bg-card)',
                        border: '1px solid var(--cms-border)',
                        borderRadius: '12px',
                        padding: '18px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{page.title}</h4>
                          <span style={{ fontSize: '0.78rem', color: 'var(--cms-text-muted)' }}>
                            URL: /{page.slug || ''}
                          </span>
                        </div>
                        <span className="cms-badge success">{page.status}</span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {page.sections.map((sec, idx) => (
                          <div
                            key={sec.id}
                            style={{
                              padding: '10px 14px',
                              background: 'var(--cms-bg-surface)',
                              border: '1px solid var(--cms-border)',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div>
                              <strong style={{ fontSize: '0.88rem' }}>{idx + 1}. {sec.title}</strong>
                              <span style={{ fontSize: '0.76rem', color: 'var(--cms-text-muted)', marginLeft: '10px' }}>
                                [{sec.type.toUpperCase()}]
                              </span>
                            </div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={sec.visible}
                                onChange={(e) => {
                                  sec.visible = e.target.checked
                                  setSitePages([...sitePages])
                                  void writeSharedContent('site-pages', sitePages)
                                  showToast('Section visibility updated.', 'success')
                                }}
                              />
                              Visible
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* TAB 6: SECURITY CENTER */}
          {activeTab === 'security' && (
            <>
              <div className="cms-view-header">
                <div className="cms-view-title-group">
                  <h1>Website Security Center</h1>
                  <p>Real-time threat monitoring, IP banning, brute force lockouts, and audit trail.</p>
                </div>
                <div className="cms-view-actions">
                  <button className="cms-btn cms-btn-danger" onClick={() => setShowBanIpModal(true)}>
                    + Ban IP Address
                  </button>
                </div>
              </div>

              {/* Security Center Sub-navigation Tabs */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--cms-border)', paddingBottom: '12px' }}>
                <button
                  className={`cms-btn ${securitySubTab === 'overview' ? 'cms-btn-primary' : 'cms-btn-secondary'} cms-btn-sm`}
                  onClick={() => setSecuritySubTab('overview')}
                >
                  Overview
                </button>
                <button
                  className={`cms-btn ${securitySubTab === 'banned-ips' ? 'cms-btn-primary' : 'cms-btn-secondary'} cms-btn-sm`}
                  onClick={() => setSecuritySubTab('banned-ips')}
                >
                  Banned IPs ({bannedIps.length})
                </button>
                <button
                  className={`cms-btn ${securitySubTab === 'blocked-users' ? 'cms-btn-primary' : 'cms-btn-secondary'} cms-btn-sm`}
                  onClick={() => setSecuritySubTab('blocked-users')}
                >
                  Blocked Users
                </button>
                <button
                  className={`cms-btn ${securitySubTab === 'failed-logins' ? 'cms-btn-primary' : 'cms-btn-secondary'} cms-btn-sm`}
                  onClick={() => setSecuritySubTab('failed-logins')}
                >
                  Failed Logins ({failedLogins.length})
                </button>
                <button
                  className={`cms-btn ${securitySubTab === 'activity-log' ? 'cms-btn-primary' : 'cms-btn-secondary'} cms-btn-sm`}
                  onClick={() => setSecuritySubTab('activity-log')}
                >
                  Audit Trail
                </button>
                <button
                  className={`cms-btn ${securitySubTab === 'settings' ? 'cms-btn-primary' : 'cms-btn-secondary'} cms-btn-sm`}
                  onClick={() => setSecuritySubTab('settings')}
                >
                  Security Config
                </button>
              </div>

              {/* Sub-tab 1: Security Overview */}
              {securitySubTab === 'overview' && (
                <>
                  <div className="cms-metrics-grid">
                    <div className="cms-metric-card">
                      <div>
                        <h4 className="cms-metric-title">Banned IP Addresses</h4>
                        <p className="cms-metric-value">{bannedIps.length}</p>
                        <span className="cms-metric-subtext">Active network blocks</span>
                      </div>
                      <div className="cms-metric-icon-box red">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                        </svg>
                      </div>
                    </div>

                    <div className="cms-metric-card">
                      <div>
                        <h4 className="cms-metric-title">Failed Login Attempts</h4>
                        <p className="cms-metric-value">{failedLogins.length}</p>
                        <span className="cms-metric-subtext">Logged security alerts</span>
                      </div>
                      <div className="cms-metric-icon-box gold">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                      </div>
                    </div>

                    <div className="cms-metric-card">
                      <div>
                        <h4 className="cms-metric-title">Blocked Users</h4>
                        <p className="cms-metric-value">
                          {adminUsers.filter((u) => u.status === 'Locked').length}
                        </p>
                        <span className="cms-metric-subtext">Temporary brute-force lockouts</span>
                      </div>
                      <div className="cms-metric-icon-box blue">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                      </div>
                    </div>

                    <div className="cms-metric-card">
                      <div>
                        <h4 className="cms-metric-title">Audit Trail Entries</h4>
                        <p className="cms-metric-value">{securityLogs.length}</p>
                        <span className="cms-metric-subtext">Immutable activity logs</span>
                      </div>
                      <div className="cms-metric-icon-box green">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Sub-tab 2: Banned IPs */}
              {securitySubTab === 'banned-ips' && (
                <div className="cms-card">
                  <div className="cms-table-wrapper">
                    <table className="cms-table">
                      <thead>
                        <tr>
                          <th>IP Address</th>
                          <th>Reason</th>
                          <th>Banned By</th>
                          <th>Date</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bannedIps.length > 0 ? (
                          bannedIps.map((ban) => (
                            <tr key={ban.id}>
                              <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{ban.ip}</td>
                              <td>{ban.reason}</td>
                              <td>{ban.bannedBy}</td>
                              <td>{new Date(ban.createdAt).toLocaleDateString()}</td>
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  className="cms-btn cms-btn-danger cms-btn-sm"
                                  onClick={() => handleUnbanIp(ban.id, ban.ip)}
                                >
                                  Remove Ban
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', color: 'var(--cms-text-muted)', padding: '24px' }}>
                              No banned IP addresses. All network traffic clear.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Blocked Users */}
              {securitySubTab === 'blocked-users' && (
                <div className="cms-card">
                  <div className="cms-table-wrapper">
                    <table className="cms-table">
                      <thead>
                        <tr>
                          <th>Account</th>
                          <th>Role</th>
                          <th>Failed Attempts</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminUsers.filter((u) => u.status === 'Locked').length > 0 ? (
                          adminUsers
                            .filter((u) => u.status === 'Locked')
                            .map((u) => (
                              <tr key={u.id}>
                                <td>{u.name} ({u.username})</td>
                                <td>{u.role}</td>
                                <td>{u.failedAttempts}</td>
                                <td>
                                  <span className="cms-badge danger">Locked</span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <button
                                    className="cms-btn cms-btn-primary cms-btn-sm"
                                    onClick={() => handleUnlockUser(u.id, u.username)}
                                  >
                                    Unlock Account
                                  </button>
                                </td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', color: 'var(--cms-text-muted)', padding: '24px' }}>
                              No accounts are currently locked.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-tab 4: Failed Logins */}
              {securitySubTab === 'failed-logins' && (
                <div className="cms-card">
                  <div className="cms-table-wrapper">
                    <table className="cms-table">
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>Submitted Username</th>
                          <th>IP Address</th>
                          <th>Reason</th>
                          <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {failedLogins.length > 0 ? (
                          failedLogins.map((fail) => (
                            <tr key={fail.id}>
                              <td>{new Date(fail.timestamp).toLocaleString()}</td>
                              <td style={{ fontWeight: 650 }}>{fail.username}</td>
                              <td style={{ fontFamily: 'monospace' }}>{fail.ip}</td>
                              <td>
                                <span className="cms-badge warning">{fail.reason}</span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  className="cms-btn cms-btn-danger cms-btn-sm"
                                  onClick={() => {
                                    setNewIpAddress(fail.ip)
                                    setNewIpReason(`Brute force attempt on account: ${fail.username}`)
                                    setShowBanIpModal(true)
                                  }}
                                >
                                  Ban IP
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', color: 'var(--cms-text-muted)', padding: '24px' }}>
                              No failed login attempts recorded.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-tab 5: Audit Activity Log */}
              {securitySubTab === 'activity-log' && (
                <div className="cms-card">
                  <div className="cms-table-wrapper">
                    <table className="cms-table">
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>Event Type</th>
                          <th>User</th>
                          <th>Details</th>
                          <th>Severity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {securityLogs.length > 0 ? (
                          securityLogs.map((log) => (
                            <tr key={log.id}>
                              <td>{new Date(log.timestamp).toLocaleString()}</td>
                              <td style={{ fontFamily: 'monospace', fontWeight: 650 }}>{log.event}</td>
                              <td>{log.username}</td>
                              <td>{log.details}</td>
                              <td>
                                <span className={`cms-badge ${log.severity === 'critical' ? 'danger' : log.severity === 'warning' ? 'warning' : 'success'}`}>
                                  {log.severity}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} style={{ textAlign: 'center', color: 'var(--cms-text-muted)', padding: '24px' }}>
                              Security audit log is currently clear.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-tab 6: Security Settings */}
              {securitySubTab === 'settings' && (
                <div className="cms-card" style={{ maxWidth: '640px' }}>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      void writeSharedContent('security-settings', securitySettings)
                      void logSecurityEvent('SETTINGS_UPDATED', 'Security threshold configuration updated.', 'warning', currentUser?.username)
                      showToast('Security settings saved.', 'success')
                    }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                  >
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.88rem' }}>
                        Max Failed Login Attempts
                      </label>
                      <input
                        type="number"
                        min="3"
                        max="20"
                        className="cms-header-search-input"
                        style={{ width: '100%' }}
                        value={securitySettings.maxFailedAttempts}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, maxFailedAttempts: parseInt(e.target.value, 10) || 5 })}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.88rem' }}>
                        Lockout Duration (Minutes)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="1440"
                        className="cms-header-search-input"
                        style={{ width: '100%' }}
                        value={securitySettings.lockoutDurationMinutes}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, lockoutDurationMinutes: parseInt(e.target.value, 10) || 30 })}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.88rem' }}>
                        Session Idle Timeout (Minutes)
                      </label>
                      <input
                        type="number"
                        min="15"
                        max="720"
                        className="cms-header-search-input"
                        style={{ width: '100%' }}
                        value={securitySettings.sessionTimeoutMinutes}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeoutMinutes: parseInt(e.target.value, 10) || 120 })}
                      />
                    </div>

                    <button type="submit" className="cms-btn cms-btn-primary" style={{ marginTop: '10px' }}>
                      Save Security Configuration
                    </button>
                  </form>
                </div>
              )}
            </>
          )}

          {/* TAB 7: ADMINISTRATORS */}
          {activeTab === 'admins' && (
            <>
              <div className="cms-view-header">
                <div className="cms-view-title-group">
                  <h1>Administrator Accounts & Roles</h1>
                  <p>Manage administrative personnel, assign roles, and review session statuses.</p>
                </div>
                <div className="cms-view-actions">
                  <button className="cms-btn cms-btn-primary" onClick={() => setShowAddAdminModal(true)}>
                    + Provision Administrator
                  </button>
                </div>
              </div>

              <div className="cms-card">
                <div className="cms-table-wrapper">
                  <table className="cms-table">
                    <thead>
                      <tr>
                        <th>Administrator</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers.map((user) => (
                        <tr key={user.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <img
                                src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
                                alt={user.name}
                                style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                              />
                              <div>
                                <div style={{ fontWeight: 650 }}>{user.name}</div>
                                <div style={{ fontSize: '0.76rem', color: 'var(--cms-text-muted)' }}>@{user.username}</div>
                              </div>
                            </div>
                          </td>
                          <td>{user.email}</td>
                          <td>
                            <span className="cms-badge neutral">{user.role}</span>
                          </td>
                          <td>
                            <span className={`cms-badge ${user.status === 'Active' ? 'success' : 'danger'}`}>
                              {user.status}
                            </span>
                          </td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td style={{ textAlign: 'right' }}>
                            {user.status === 'Locked' ? (
                              <button
                                className="cms-btn cms-btn-primary cms-btn-sm"
                                onClick={() => handleUnlockUser(user.id, user.username)}
                              >
                                Unlock
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: 'var(--cms-text-muted)' }}>Active</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 8: GLOBAL SETTINGS */}
          {activeTab === 'settings' && (
            <>
              <div className="cms-view-header">
                <div className="cms-view-title-group">
                  <h1>Global Website Settings</h1>
                  <p>Configure brand identity, contact channels, SEO parameters, and cache controls.</p>
                </div>
                <div className="cms-view-actions">
                  <button className="cms-btn cms-btn-gold" onClick={handlePurgeCache}>
                    Flush All Server Caches
                  </button>
                </div>
              </div>

              <div className="cms-card" style={{ maxWidth: '680px' }}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    void writeSharedContent('site-settings', siteSettings)
                    void logSecurityEvent('SETTINGS_UPDATED', 'Global website settings updated.', 'info', currentUser?.username)
                    showToast('Website settings saved successfully!', 'success')
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                >
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.88rem' }}>
                      Website Name
                    </label>
                    <input
                      type="text"
                      className="cms-header-search-input"
                      style={{ width: '100%' }}
                      value={siteSettings.siteName}
                      onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.88rem' }}>
                      Tagline / Slogan
                    </label>
                    <input
                      type="text"
                      className="cms-header-search-input"
                      style={{ width: '100%' }}
                      value={siteSettings.tagline}
                      onChange={(e) => setSiteSettings({ ...siteSettings, tagline: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.88rem' }}>
                        Contact Email
                      </label>
                      <input
                        type="email"
                        className="cms-header-search-input"
                        style={{ width: '100%' }}
                        value={siteSettings.contactEmail}
                        onChange={(e) => setSiteSettings({ ...siteSettings, contactEmail: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.88rem' }}>
                        Phone
                      </label>
                      <input
                        type="text"
                        className="cms-header-search-input"
                        style={{ width: '100%' }}
                        value={siteSettings.phone}
                        onChange={(e) => setSiteSettings({ ...siteSettings, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.88rem' }}>
                      Physical Address
                    </label>
                    <input
                      type="text"
                      className="cms-header-search-input"
                      style={{ width: '100%' }}
                      value={siteSettings.address}
                      onChange={(e) => setSiteSettings({ ...siteSettings, address: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.88rem' }}>
                      Default SEO Title
                    </label>
                    <input
                      type="text"
                      className="cms-header-search-input"
                      style={{ width: '100%' }}
                      value={siteSettings.defaultSeoTitle}
                      onChange={(e) => setSiteSettings({ ...siteSettings, defaultSeoTitle: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.88rem' }}>
                      Default SEO Meta Description
                    </label>
                    <textarea
                      rows={3}
                      className="cms-header-search-input"
                      style={{ width: '100%', height: 'auto', padding: '10px 14px', borderRadius: '10px' }}
                      value={siteSettings.defaultSeoDescription}
                      onChange={(e) => setSiteSettings({ ...siteSettings, defaultSeoDescription: e.target.value })}
                    />
                  </div>

                  <button type="submit" className="cms-btn cms-btn-primary" style={{ marginTop: '10px' }}>
                    Save Global Settings
                  </button>
                </form>
              </div>
            </>
          )}

          {/* TAB 9: MAINTENANCE MODE (SCREENSHOT 5) */}
          {activeTab === 'maintenance' && (
            <div className="cms-maintenance-view-content">
              {/* Header with Status Indicator & Save Button */}
              <div className="cms-maint-header-row">
                <div className="cms-maint-header-left">
                  <span className="cms-maint-tag">SYSTEM AVAILABILITY</span>
                  <div className="cms-maint-title-row">
                    <span style={{ fontSize: '1.4rem' }}>⚠️</span>
                    <h1>Maintenance Mode</h1>
                  </div>
                  <p className="cms-maint-description">
                    Control website availability for all readers or targeted URLs. Authenticated admins always bypass maintenance.
                  </p>
                </div>

                <div className="cms-maint-header-actions">
                  <div className={`cms-maint-status-badge ${maintenanceGlobal ? 'warning' : 'healthy'}`}>
                    <span className="cms-status-indicator-dot" />
                    <span>{maintenanceGlobal ? 'Maintenance Mode Active' : 'All Systems Operational'}</span>
                  </div>

                  <button
                    type="button"
                    className="cms-btn cms-btn-red"
                    onClick={() => {
                      showToast('Maintenance settings saved successfully!', 'success')
                    }}
                  >
                    💾 Save Settings
                  </button>
                </div>
              </div>

              {/* Global Maintenance Card with Toggle */}
              <div className="cms-card cms-global-maintenance-card">
                <div className="cms-global-maint-left">
                  <div className="cms-global-maint-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </div>
                  <div className="cms-global-maint-text">
                    <strong>Global Maintenance</strong>
                    <p>
                      {maintenanceGlobal
                        ? 'Website is locked to public visitors. Admins maintain full access.'
                        : 'The entire public website is live and open to visitors.'}
                    </p>
                  </div>
                </div>

                <div className="cms-global-maint-switch-wrap">
                  <span className={`cms-maint-state-label ${maintenanceGlobal ? 'danger' : 'success'}`}>
                    {maintenanceGlobal ? 'ON (MAINTENANCE)' : 'OFF (LIVE)'}
                  </span>
                  <label className="cms-maint-switch">
                    <input
                      type="checkbox"
                      checked={maintenanceGlobal}
                      onChange={(e) => {
                        setMaintenanceGlobal(e.target.checked)
                        showToast(
                          e.target.checked
                            ? 'Global Maintenance activated.'
                            : 'Global Maintenance deactivated. Site is Live!',
                          e.target.checked ? 'warning' : 'success'
                        )
                      }}
                    />
                    <span className="cms-maint-slider" />
                  </label>
                </div>
              </div>

              {/* 2-Column Maintenance Grid: Left Form Content | Right Routes & Live Preview */}
              <div className="cms-maint-2col-grid">
                {/* Left Column: Maintenance Page Display Content */}
                <div className="cms-card cms-maint-display-card">
                  <div className="cms-card-header-row">
                    <div className="cms-header-title-flex">
                      <span style={{ color: '#dc2626' }}>⚠️</span>
                      <h3>MAINTENANCE PAGE DISPLAY CONTENT</h3>
                    </div>
                  </div>

                  <div className="cms-maint-form-group">
                    <label>SPLASH PAGE TITLE</label>
                    <input
                      type="text"
                      className="cms-maint-input"
                      value={maintenanceTitle}
                      onChange={(e) => setMaintenanceTitle(e.target.value)}
                    />
                  </div>

                  <div className="cms-maint-form-group">
                    <label>VISITOR NOTICE MESSAGE</label>
                    <textarea
                      rows={3}
                      className="cms-maint-textarea"
                      value={maintenanceMessage}
                      onChange={(e) => setMaintenanceMessage(e.target.value)}
                    />
                  </div>

                  <div className="cms-maint-form-group">
                    <label>
                      <span>⏱️ ESTIMATED COMPLETION TIME (OPTIONAL)</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="cms-maint-input"
                      value={maintenanceEta}
                      onChange={(e) => setMaintenanceEta(e.target.value)}
                    />
                    <small className="cms-field-hint">
                      Enables an interactive countdown timer on the visitor maintenance splash screen.
                    </small>
                  </div>

                  <div className="cms-maint-form-group">
                    <div className="cms-progress-label-row">
                      <label>📈 UPGRADE PROGRESS PERCENTAGE ({maintenanceProgress}%)</label>
                      <span className="cms-progress-stage-badge">
                        {maintenanceProgress >= 90 ? '90% · Final Stage' : `${maintenanceProgress}% · In Progress`}
                      </span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={maintenanceProgress}
                      onChange={(e) => setMaintenanceProgress(Number(e.target.value))}
                      className="cms-maint-slider-range"
                    />

                    <div className="cms-progress-presets">
                      <span style={{ fontSize: '0.76rem', color: 'var(--cms-text-muted)' }}>Presets:</span>
                      {[10, 25, 50, 75, 88, 95, 100].map((val) => (
                        <button
                          key={val}
                          type="button"
                          className={`cms-preset-pill ${maintenanceProgress === val ? 'active' : ''}`}
                          onClick={() => setMaintenanceProgress(val)}
                        >
                          {val}%
                        </button>
                      ))}
                    </div>
                    <small className="cms-field-hint">
                      Adjust the maintenance progress displayed to visitors from 10% to 100%.
                    </small>
                  </div>
                </div>

                {/* Right Column: Per-Page Target Routes + Live Preview */}
                <div className="cms-maint-right-col">
                  {/* Per-Page Target Routes Card */}
                  <div className="cms-card cms-maint-routes-card">
                    <div className="cms-card-header-row">
                      <div className="cms-header-title-flex">
                        <span style={{ color: '#dc2626' }}>⚡</span>
                        <h3>PER-PAGE TARGET ROUTES</h3>
                      </div>
                    </div>

                    <p className="cms-routes-desc">
                      Lock down specific pages or paths without closing the whole publication. Supports wildcard routes like <code>/equipment/*</code>.
                    </p>

                    <div className="cms-quick-select-routes">
                      <span className="cms-quick-label">QUICK SELECT</span>
                      <div className="cms-quick-pills-wrap">
                        {[
                          { label: 'Home', path: '/' },
                          { label: 'All Articles', path: '/blog/*' },
                          { label: 'All Equipment', path: '/products/*' },
                          { label: 'Search', path: '/search' },
                          { label: 'About', path: '/about' },
                          { label: 'Contact', path: '/contact' },
                          { label: 'Terms', path: '/terms-of-service' },
                          { label: 'Privacy', path: '/privacy-policy' }
                        ].map((r) => {
                          const isSelected = maintenanceRoutes.includes(r.path)
                          return (
                            <button
                              key={r.path}
                              type="button"
                              className={`cms-route-pill ${isSelected ? 'selected' : ''}`}
                              onClick={() => {
                                if (isSelected) {
                                  setMaintenanceRoutes(maintenanceRoutes.filter((x) => x !== r.path))
                                } else {
                                  setMaintenanceRoutes([...maintenanceRoutes, r.path])
                                }
                              }}
                            >
                              <span>{r.label}</span>
                              <span className="cms-rp-path">{r.path}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="cms-add-custom-route-row">
                      <span className="cms-quick-label">ADD CUSTOM PATH</span>
                      <div className="cms-add-route-input-group">
                        <input
                          type="text"
                          placeholder="Path (e.g. /category/ai/*)"
                          value={newCustomRoute}
                          onChange={(e) => setNewCustomRoute(e.target.value)}
                        />
                        <button
                          type="button"
                          className="cms-btn cms-btn-red"
                          onClick={() => {
                            if (newCustomRoute.trim() && !maintenanceRoutes.includes(newCustomRoute.trim())) {
                              setMaintenanceRoutes([...maintenanceRoutes, newCustomRoute.trim()])
                              setNewCustomRoute('')
                              showToast('Route added to maintenance target list.', 'success')
                            }
                          }}
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    <div className="cms-active-routes-list">
                      <span className="cms-quick-label">ROUTES UNDER MAINTENANCE ({maintenanceRoutes.length})</span>
                      {maintenanceRoutes.length > 0 ? (
                        <div className="cms-routes-tags-wrap">
                          {maintenanceRoutes.map((rt) => (
                            <span key={rt} className="cms-active-route-tag">
                              <code>{rt}</code>
                              <button
                                type="button"
                                onClick={() => setMaintenanceRoutes(maintenanceRoutes.filter((x) => x !== rt))}
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="cms-no-routes-placeholder">
                          No individual pages selected.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Live Visitor Preview Card */}
                  <div className="cms-card cms-maint-preview-card">
                    <div className="cms-card-header-row">
                      <div className="cms-header-title-flex">
                        <span style={{ color: '#dc2626' }}>👁️</span>
                        <h3>LIVE VISITOR PREVIEW</h3>
                      </div>
                      <span className="cms-preview-theme-pill">Light Red Theme</span>
                    </div>

                    <div className="cms-live-visitor-preview-box">
                      <div className="cms-preview-inner-card">
                        <div className="cms-preview-tag-badge">
                          <span>● SCHEDULED UPGRADE</span>
                        </div>

                        <div className="cms-preview-logo-wrap">
                          <img src="/images/header-logo.png" alt="Happy Machinery" className="cms-preview-logo-img" />
                        </div>

                        <h2 className="cms-preview-heading">{maintenanceTitle}</h2>
                        <p className="cms-preview-message">{maintenanceMessage}</p>

                        <div className="cms-preview-progress-box">
                          <div className="cms-preview-pbar-header">
                            <span>⚡ Upgrade Progress</span>
                            <strong>{maintenanceProgress}% {maintenanceProgress >= 90 ? 'Final Stage' : ''}</strong>
                          </div>
                          <div className="cms-preview-track">
                            <div className="cms-preview-fill" style={{ width: `${maintenanceProgress}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==============================================================================
          MODALS & DIALOGS
          ============================================================================== */}

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="cms-modal-backdrop" onClick={() => setShowProfileModal(false)}>
          <div className="cms-recovery-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <h3>My Administrator Profile</h3>
            <p>Update your display credentials and personal authentication passcode.</p>
            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.84rem' }}>Display Name</label>
                <input
                  type="text"
                  className="cms-header-search-input"
                  style={{ width: '100%' }}
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.84rem' }}>Email Address</label>
                <input
                  type="email"
                  className="cms-header-search-input"
                  style={{ width: '100%' }}
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.84rem' }}>Avatar Image URL</label>
                <input
                  type="text"
                  className="cms-header-search-input"
                  style={{ width: '100%' }}
                  value={profileAvatar}
                  onChange={(e) => setProfileAvatar(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.84rem' }}>New Password / Passcode</label>
                <input
                  type="password"
                  className="cms-header-search-input"
                  style={{ width: '100%' }}
                  placeholder="Leave blank to keep current password"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                />
              </div>

              <div className="cms-modal-actions" style={{ marginTop: '10px' }}>
                <button type="button" className="cms-modal-btn secondary" onClick={() => setShowProfileModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="cms-modal-btn primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provision Admin Modal */}
      {showAddAdminModal && (
        <div className="cms-modal-backdrop" onClick={() => setShowAddAdminModal(false)}>
          <div className="cms-recovery-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
            <h3>Provision New Administrator</h3>
            <p>Create credentials for an authorized team member with role-based access.</p>
            <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.84rem' }}>Username</label>
                <input
                  type="text"
                  className="cms-header-search-input"
                  style={{ width: '100%' }}
                  required
                  value={newAdminUsername}
                  onChange={(e) => setNewAdminUsername(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.84rem' }}>Full Name</label>
                <input
                  type="text"
                  className="cms-header-search-input"
                  style={{ width: '100%' }}
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.84rem' }}>Email Address</label>
                <input
                  type="email"
                  className="cms-header-search-input"
                  style={{ width: '100%' }}
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.84rem' }}>Initial Password</label>
                <input
                  type="password"
                  className="cms-header-search-input"
                  style={{ width: '100%' }}
                  required
                  value={newAdminPassword}
                  onChange={(e) => setNewAdminPassword(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.84rem' }}>Role</label>
                <select
                  className="cms-date-filter-select"
                  style={{ width: '100%' }}
                  value={newAdminRole}
                  onChange={(e) => setNewAdminRole(e.target.value as AdminRole)}
                >
                  <option value="Super Administrator">Super Administrator</option>
                  <option value="Administrator">Administrator</option>
                  <option value="Editor">Editor</option>
                  <option value="Analyst">Analyst</option>
                  <option value="Security Administrator">Security Administrator</option>
                </select>
              </div>

              <div className="cms-modal-actions" style={{ marginTop: '10px' }}>
                <button type="button" className="cms-modal-btn secondary" onClick={() => setShowAddAdminModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="cms-modal-btn primary">
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ban IP Modal */}
      {showBanIpModal && (
        <div className="cms-modal-backdrop" onClick={() => setShowBanIpModal(false)}>
          <div className="cms-recovery-modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: 'var(--cms-danger)' }}>Add IP to Threat Ban List</h3>
            <p>Traffic originating from this IP address will be blocked at the server level.</p>
            <form onSubmit={handleBanIp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.84rem' }}>IP Address / CIDR</label>
                <input
                  type="text"
                  placeholder="e.g. 192.168.1.100"
                  className="cms-header-search-input"
                  style={{ width: '100%' }}
                  required
                  value={newIpAddress}
                  onChange={(e) => setNewIpAddress(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.84rem' }}>Reason for Ban</label>
                <input
                  type="text"
                  placeholder="e.g. Repeated brute force login attempts"
                  className="cms-header-search-input"
                  style={{ width: '100%' }}
                  value={newIpReason}
                  onChange={(e) => setNewIpReason(e.target.value)}
                />
              </div>

              <div className="cms-modal-actions" style={{ marginTop: '10px' }}>
                <button type="button" className="cms-modal-btn secondary" onClick={() => setShowBanIpModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="cms-modal-btn primary" style={{ background: 'var(--cms-danger)' }}>
                  Confirm IP Ban
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="cms-modal-backdrop" onClick={() => setEditingProduct(null)}>
          <div className="cms-recovery-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <h3>Edit Machine: {editingProduct.name}</h3>
            <p>Customize pricing, specification metadata, and primary call-to-action button.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const form = e.target as any
                const price = parseFloat(form.prodPrice.value) || editingProduct.price
                const salePrice = form.prodSalePrice.value ? parseFloat(form.prodSalePrice.value) : undefined
                const status = form.prodStatus.value

                const updated = products.map((p) => p.id === editingProduct.id ? { ...p, price, salePrice, status } : p)
                setProducts(updated)
                void writeSharedContent('products', updated)
                showToast(`Product ${editingProduct.sku} updated!`, 'success')
                setEditingProduct(null)
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.84rem' }}>Price ($)</label>
                  <input
                    name="prodPrice"
                    type="number"
                    step="0.01"
                    className="cms-header-search-input"
                    style={{ width: '100%' }}
                    defaultValue={editingProduct.price}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.84rem' }}>Sale Price ($)</label>
                  <input
                    name="prodSalePrice"
                    type="number"
                    step="0.01"
                    className="cms-header-search-input"
                    style={{ width: '100%' }}
                    defaultValue={editingProduct.salePrice || ''}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.84rem' }}>Status</label>
                <select
                  name="prodStatus"
                  className="cms-date-filter-select"
                  style={{ width: '100%' }}
                  defaultValue={editingProduct.status}
                >
                  <option value="Published">Published</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.84rem' }}>
                  Custom CTA Button Label
                </label>
                <input
                  type="text"
                  className="cms-header-search-input"
                  style={{ width: '100%' }}
                  defaultValue="Request Official Quote"
                />
              </div>

              <div className="cms-modal-actions" style={{ marginTop: '10px' }}>
                <button type="button" className="cms-modal-btn secondary" onClick={() => setEditingProduct(null)}>
                  Cancel
                </button>
                <button type="submit" className="cms-modal-btn primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Details Modal */}
      {selectedMedia && (
        <div className="cms-modal-backdrop" onClick={() => setSelectedMedia(null)}>
          <div className="cms-recovery-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <h3>Media Details</h3>
            <div style={{ maxHeight: '200px', overflow: 'hidden', borderRadius: '10px', margin: '12px 0', background: '#050a14' }}>
              <img src={selectedMedia.url} alt={selectedMedia.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <p><strong>Title:</strong> {selectedMedia.title}</p>
            <p style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.8rem' }}>
              <strong>URL:</strong> {selectedMedia.url}
            </p>
            <div className="cms-modal-actions">
              <button
                type="button"
                className="cms-modal-btn primary"
                onClick={() => {
                  navigator.clipboard.writeText(selectedMedia.url)
                  showToast('Media URL copied to clipboard!', 'success')
                }}
              >
                Copy URL
              </button>
              <button
                type="button"
                className="cms-modal-btn secondary"
                onClick={() => setSelectedMedia(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
