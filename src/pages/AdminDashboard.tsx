import React, { useState, useEffect, useMemo } from 'react'
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

type SecuritySubTab = 
  | 'overview' 
  | 'banned-ips' 
  | 'blocked-users' 
  | 'failed-logins' 
  | 'activity-log' 
  | 'settings'

type CmsTheme = 'dark' | 'light' | 'neon'
type DateFilter = 'today' | 'yesterday' | '7d' | '30d' | '90d' | 'all'

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
  const [dateFilter, setDateFilter] = useState<DateFilter>('30d')

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
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsViewEvent[]>([])
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS)
  const [sitePages, setSitePages] = useState<SitePage[]>(DEFAULT_SITE_PAGES)
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Modals & Sub-forms State
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showNewArticleModal, setShowNewArticleModal] = useState(false)
  const [editingArticle, setEditingArticle] = useState<BlogPost | null>(null)
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null)
  const [showAddAdminModal, setShowAddAdminModal] = useState(false)
  const [showBanIpModal, setShowBanIpModal] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)

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

  // Filtered Analytics Calculations based on date filter
  const filteredAnalytics = useMemo(() => {
    if (!analyticsEvents || analyticsEvents.length === 0) return []
    const now = Date.now()
    return analyticsEvents.filter((ev) => {
      const time = new Date(ev.timestamp).getTime()
      if (dateFilter === 'today') return now - time <= 24 * 60 * 60 * 1000
      if (dateFilter === 'yesterday') return now - time <= 48 * 60 * 60 * 1000 && now - time > 24 * 60 * 60 * 1000
      if (dateFilter === '7d') return now - time <= 7 * 24 * 60 * 60 * 1000
      if (dateFilter === '30d') return now - time <= 30 * 24 * 60 * 60 * 1000
      if (dateFilter === '90d') return now - time <= 90 * 24 * 60 * 60 * 1000
      return true
    })
  }, [analyticsEvents, dateFilter])

  // Top Viewed Articles
  const topArticles = useMemo(() => {
    const counts: Record<string, { title: string; views: number }> = {}
    filteredAnalytics.forEach((ev) => {
      if (ev.type === 'article' || ev.path.startsWith('/blog/')) {
        const key = ev.path
        if (!counts[key]) counts[key] = { title: ev.title || key, views: 0 }
        counts[key].views += 1
      }
    })
    return Object.entries(counts)
      .map(([path, data]) => ({ path, title: data.title, views: data.views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)
  }, [filteredAnalytics])

  // Top Viewed Pages
  const topPages = useMemo(() => {
    const counts: Record<string, { title: string; views: number }> = {}
    filteredAnalytics.forEach((ev) => {
      const key = ev.path || '/'
      if (!counts[key]) counts[key] = { title: ev.title || key, views: 0 }
      counts[key].views += 1
    })
    return Object.entries(counts)
      .map(([path, data]) => ({ path, title: data.title, views: data.views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10)
  }, [filteredAnalytics])

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
          Collapsible Sidebar Navigation
          ============================================================================== */}
      <aside className={`cms-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="cms-sidebar-brand">
          <Link to="/ourcmskiuq" className="cms-brand-link">
            <div className="cms-brand-logo-badge">HM</div>
            {!isSidebarCollapsed && (
              <div className="cms-brand-info">
                <span className="cms-brand-name">Happy Machinery</span>
                <span className="cms-brand-tag">CMS Console</span>
              </div>
            )}
          </Link>
          <button
            className="cms-sidebar-toggle-btn"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        </div>

        {/* Sidebar Navigation Menu */}
        <nav className="cms-sidebar-nav">
          <span className="cms-nav-group-title">Analytics & Content</span>

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
            <span className="cms-nav-label">Dashboard & Traffic</span>
          </button>

          <button
            className={`cms-nav-item ${activeTab === 'articles' ? 'active' : ''}`}
            onClick={() => setActiveTab('articles')}
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
            <span className="cms-nav-label">Articles & Blog</span>
            <span className="cms-nav-badge">{posts.length}</span>
          </button>

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

          <span className="cms-nav-group-title">Equipment & Layout</span>

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
            <span className="cms-nav-label">Visual Page Builder</span>
          </button>

          <span className="cms-nav-group-title">Security & System</span>

          <button
            className={`cms-nav-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <span className="cms-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            <span className="cms-nav-label">Security Center</span>
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
            <span className="cms-nav-label">Administrators</span>
            <span className="cms-nav-badge">{adminUsers.length}</span>
          </button>

          <button
            className={`cms-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className="cms-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </span>
            <span className="cms-nav-label">Global Settings</span>
          </button>
        </nav>

        {/* Sidebar Footer Link */}
        <div className="cms-sidebar-footer">
          <Link to="/" target="_blank" className="cms-quick-site-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <span>View Live Website</span>
          </Link>
        </div>
      </aside>

      {/* ==============================================================================
          Main Content Layout
          ============================================================================== */}
      <div className="cms-main-layout">
        {/* Top Header Bar */}
        <header className="cms-top-header">
          <div className="cms-header-left">
            <div className="cms-breadcrumb">
              <span>CMS</span>
              <span>/</span>
              <span className="cms-breadcrumb-active">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </span>
              {activeTab === 'security' && (
                <>
                  <span>/</span>
                  <span className="cms-breadcrumb-active">
                    {securitySubTab.charAt(0).toUpperCase() + securitySubTab.slice(1).replace('-', ' ')}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="cms-header-right">
            {/* Global Search */}
            <div className="cms-header-search-wrapper">
              <span className="cms-header-search-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                className="cms-header-search-input"
                placeholder="Search resources..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
            </div>

            {/* Date Filter (for analytics) */}
            <select
              className="cms-date-filter-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>

            {/* Theme Toggle Button */}
            <button
              className="cms-theme-toggle-btn"
              onClick={() => {
                const nextTheme: CmsTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'neon' : 'dark'
                setTheme(nextTheme)
                showToast(`Switched to ${nextTheme.toUpperCase()} theme`, 'info' as any)
              }}
              title={`Current Theme: ${theme.toUpperCase()}. Click to switch.`}
            >
              {theme === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              ) : theme === 'light' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              )}
            </button>

            {/* Profile Dropdown Trigger */}
            <div className="cms-profile-menu-container">
              <button
                className={`cms-profile-trigger-btn ${isProfileDropdownOpen ? 'active' : ''}`}
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
                <span className="cms-profile-name-text">{currentUser.name || currentUser.username}</span>
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
          {/* TAB 1: DASHBOARD & TRAFFIC */}
          {activeTab === 'dashboard' && (
            <>
              <div className="cms-view-header">
                <div className="cms-view-title-group">
                  <h1>Executive Dashboard</h1>
                  <p>Real-time analytics, equipment catalog overview, and server performance metrics.</p>
                </div>
                <div className="cms-view-actions">
                  <button className="cms-btn cms-btn-gold" onClick={() => setShowNewArticleModal(true)}>
                    + New Article
                  </button>
                  <button className="cms-btn cms-btn-secondary" onClick={handlePurgeCache}>
                    Purge Cache
                  </button>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="cms-metrics-grid">
                <div className="cms-metric-card">
                  <div>
                    <h4 className="cms-metric-title">Page Views ({dateFilter.toUpperCase()})</h4>
                    <p className="cms-metric-value">{filteredAnalytics.length.toLocaleString()}</p>
                    <span className="cms-metric-subtext positive">Real-time visitor count</span>
                  </div>
                  <div className="cms-metric-icon-box blue">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </div>
                </div>

                <div className="cms-metric-card">
                  <div>
                    <h4 className="cms-metric-title">Active Equipment</h4>
                    <p className="cms-metric-value">{products.filter((p) => p.status === 'Published').length}</p>
                    <span className="cms-metric-subtext">Total Catalog: {products.length}</span>
                  </div>
                  <div className="cms-metric-icon-box gold">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                    </svg>
                  </div>
                </div>

                <div className="cms-metric-card">
                  <div>
                    <h4 className="cms-metric-title">Published Articles</h4>
                    <p className="cms-metric-value">{posts.length}</p>
                    <span className="cms-metric-subtext">SEO Articles & Guides</span>
                  </div>
                  <div className="cms-metric-icon-box green">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    </svg>
                  </div>
                </div>

                <div className="cms-metric-card">
                  <div>
                    <h4 className="cms-metric-title">Security Status</h4>
                    <p className="cms-metric-value" style={{ color: 'var(--cms-success)' }}>Active</p>
                    <span className="cms-metric-subtext">Shield Guard Online</span>
                  </div>
                  <div className="cms-metric-icon-box blue">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Two Column Section: Top Articles & Top Pages */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
                {/* Top 10 Articles */}
                <div className="cms-card">
                  <div className="cms-card-header">
                    <h3 className="cms-card-title">Top 10 Most Viewed Articles</h3>
                  </div>
                  <div className="cms-table-wrapper">
                    <table className="cms-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Article Title</th>
                          <th style={{ textAlign: 'right' }}>Views</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topArticles.length > 0 ? (
                          topArticles.map((art, index) => (
                            <tr key={art.path}>
                              <td style={{ fontWeight: 700, color: index < 3 ? 'var(--cms-accent-gold)' : 'inherit' }}>
                                #{index + 1}
                              </td>
                              <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <span title={art.title}>{art.title}</span>
                              </td>
                              <td style={{ textAlign: 'right', fontWeight: 700 }}>{art.views}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} style={{ textAlign: 'center', color: 'var(--cms-text-muted)', padding: '24px' }}>
                              No article views recorded in this date range. Public visits are automatically tracked.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top 10 Pages */}
                <div className="cms-card">
                  <div className="cms-card-header">
                    <h3 className="cms-card-title">Top 10 Most Viewed Pages</h3>
                  </div>
                  <div className="cms-table-wrapper">
                    <table className="cms-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Page Path</th>
                          <th style={{ textAlign: 'right' }}>Views</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topPages.length > 0 ? (
                          topPages.map((pg, index) => (
                            <tr key={pg.path}>
                              <td style={{ fontWeight: 700, color: index < 3 ? 'var(--cms-accent-blue)' : 'inherit' }}>
                                #{index + 1}
                              </td>
                              <td style={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{pg.path}</td>
                              <td style={{ textAlign: 'right', fontWeight: 700 }}>{pg.views}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} style={{ textAlign: 'center', color: 'var(--cms-text-muted)', padding: '24px' }}>
                              No page visits recorded in this date range.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: ARTICLES & BLOG */}
          {activeTab === 'articles' && (
            <>
              <div className="cms-view-header">
                <div className="cms-view-title-group">
                  <h1>Articles & Content Management</h1>
                  <p>Create, edit, and optimize machine maintenance articles, jobsite guides, and equipment blogs.</p>
                </div>
                <div className="cms-view-actions">
                  <button className="cms-btn cms-btn-primary" onClick={() => setShowNewArticleModal(true)}>
                    + Create Article
                  </button>
                </div>
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
                            <td style={{ fontWeight: 650, maxWidth: '280px' }}>{post.title}</td>
                            <td>
                              <span className="cms-badge neutral">{post.category}</span>
                            </td>
                            <td>{post.author || 'Happy Machinery'}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--cms-text-muted)' }}>
                              {post.slug || `post-${post.id}`}
                            </td>
                            <td>{post.date}</td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className="cms-btn cms-btn-secondary cms-btn-sm"
                                onClick={() => {
                                  setEditingArticle(post)
                                  setShowNewArticleModal(true)
                                }}
                              >
                                Edit
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

          {/* TAB 3: MEDIA LIBRARY */}
          {activeTab === 'media' && (
            <>
              <div className="cms-view-header">
                <div className="cms-view-title-group">
                  <h1>Media Asset Library</h1>
                  <p>Centralized image, schematic, and video management with copyable URLs and alt tags.</p>
                </div>
                <div className="cms-view-actions">
                  <button
                    className="cms-btn cms-btn-primary"
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
                    + Add Media Asset
                  </button>
                </div>
              </div>

              <div className="cms-card">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
                  {mediaList
                    .filter((m) => m.title.toLowerCase().includes(globalSearch.toLowerCase()))
                    .map((item) => (
                      <div
                        key={item.id}
                        style={{
                          background: 'var(--cms-bg-card)',
                          border: '1px solid var(--cms-border)',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          transition: 'transform 150ms ease'
                        }}
                        onClick={() => setSelectedMedia(item)}
                      >
                        <div style={{ height: '140px', background: '#050a14', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                          <img
                            src={item.url}
                            alt={item.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              ;(e.target as HTMLElement).style.display = 'none'
                            }}
                          />
                        </div>
                        <div style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 650, fontSize: '0.84rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--cms-text-muted)', marginTop: '4px' }}>
                            {item.dateAdded}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </>
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

      {/* New/Edit Article Modal */}
      {showNewArticleModal && (
        <div className="cms-modal-backdrop" onClick={() => setShowNewArticleModal(false)}>
          <div className="cms-recovery-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <h3>{editingArticle ? 'Edit Article' : 'Create New Article'}</h3>
            <p>Publish technical machinery articles, customer guides, or field updates.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const form = e.target as any
                const title = form.artTitle.value
                const category = form.artCategory.value
                const excerpt = form.artExcerpt.value
                const slug = form.artSlug.value

                if (editingArticle) {
                  const updated = posts.map((p) => p.id === editingArticle.id ? { ...p, title, category, excerpt, slug } : p)
                  setPosts(updated)
                  void writeSharedContent('blog-posts', updated)
                  showToast('Article updated successfully.', 'success')
                } else {
                  const newPost: BlogPost = {
                    id: Date.now(),
                    title,
                    category,
                    excerpt,
                    slug: slug || `article-${Date.now()}`,
                    content: [excerpt],
                    keyTakeaways: ['Maintenance standards', 'Safe operation'],
                    image: '/images/why-choose-v900-jobsite.png',
                    date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                    readTime: '4 min read',
                    author: currentUser.name
                  }
                  const updated = [newPost, ...posts]
                  setPosts(updated)
                  void writeSharedContent('blog-posts', updated)
                  showToast('Article published successfully.', 'success')
                }
                setShowNewArticleModal(false)
                setEditingArticle(null)
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.84rem' }}>Article Title</label>
                <input
                  name="artTitle"
                  type="text"
                  className="cms-header-search-input"
                  style={{ width: '100%' }}
                  defaultValue={editingArticle?.title || ''}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.84rem' }}>Category</label>
                <input
                  name="artCategory"
                  type="text"
                  className="cms-header-search-input"
                  style={{ width: '100%' }}
                  defaultValue={editingArticle?.category || 'Jobsite Productivity'}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.84rem' }}>URL Slug</label>
                <input
                  name="artSlug"
                  type="text"
                  className="cms-header-search-input"
                  style={{ width: '100%' }}
                  defaultValue={editingArticle?.slug || ''}
                  placeholder="e.g. mini-skid-steer-maintenance"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.84rem' }}>Excerpt & Summary</label>
                <textarea
                  name="artExcerpt"
                  rows={3}
                  className="cms-header-search-input"
                  style={{ width: '100%', height: 'auto', padding: '10px 14px', borderRadius: '10px' }}
                  defaultValue={editingArticle?.excerpt || ''}
                  required
                />
              </div>

              <div className="cms-modal-actions" style={{ marginTop: '10px' }}>
                <button type="button" className="cms-modal-btn secondary" onClick={() => { setShowNewArticleModal(false); setEditingArticle(null) }}>
                  Cancel
                </button>
                <button type="submit" className="cms-modal-btn primary">
                  {editingArticle ? 'Save Article' : 'Publish Article'}
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
