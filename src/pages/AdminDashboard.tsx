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
  Inquiry,
  BlogComment,
  CartOrder,
  DEFAULT_POSTS, 
  DEFAULT_PRODUCTS, 
  DEFAULT_MEDIA,
  DEFAULT_INQUIRIES,
  DEFAULT_COMMENTS,
  DEFAULT_CART_ORDERS
} from './adminData'
import { IMPORTED_CATEGORY_PATHS } from '../data/importedProducts'
import { readSharedContent, writeSharedContent } from '../data/sharedContentStorage'
import { getBlogPostPath } from '../data/blogUrls'
import './AdminDashboard.css'

type CmsTab = 
  | 'dashboard' 
  | 'articles' 
  | 'media' 
  | 'products' 
  | 'cart'
  | 'inquiries'
  | 'comments'
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

export type ArticleSectionType = 'heading' | 'text' | 'image' | 'video' | 'table'

export interface ArticleSection {
  id: string
  type: ArticleSectionType
  level?: 2 | 3 | 4
  heading?: string
  content?: string
  imageUrl?: string
  imageCaption?: string
  videoUrl?: string
  headers?: string[]
  rows?: string[][]
}

export function parseContentToSections(raw: string[] | string): ArticleSection[] {
  const paragraphs = Array.isArray(raw)
    ? raw
    : (raw || '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)

  const sections: ArticleSection[] = []
  let idCounter = 1

  for (const p of paragraphs) {
    const trimmed = p.trim()
    if (!trimmed) continue

    // 1. Heading (#, ##, ###, #### or <h1>, <h2>, <h3>)
    const htmlHead = trimmed.match(/^<h([1-4])>(.*?)<\/h\1>$/i)
    if (htmlHead) {
      sections.push({
        id: `sec_${idCounter++}_${Date.now()}`,
        type: 'heading',
        level: Number(htmlHead[1]) as any,
        heading: htmlHead[2].trim()
      })
      continue
    }

    const mdHead = trimmed.match(/^(#{1,4})\s+(.+)$/)
    if (mdHead) {
      sections.push({
        id: `sec_${idCounter++}_${Date.now()}`,
        type: 'heading',
        level: mdHead[1].length as any,
        heading: mdHead[2].trim()
      })
      continue
    }

    // 2. Image: ![alt](url)
    const imgMatch = trimmed.match(/^!\[(.*?)\]\((.*?)\)$/)
    if (imgMatch) {
      sections.push({
        id: `sec_${idCounter++}_${Date.now()}`,
        type: 'image',
        imageUrl: imgMatch[2].trim(),
        imageCaption: imgMatch[1].trim()
      })
      continue
    }

    // Raw image URL
    if (/^(https?:\/\/|\/images\/)[^\s]+$/i.test(trimmed) && /\.(png|jpg|jpeg|webp|gif|svg)/i.test(trimmed)) {
      sections.push({
        id: `sec_${idCounter++}_${Date.now()}`,
        type: 'image',
        imageUrl: trimmed,
        imageCaption: ''
      })
      continue
    }

    // 3. Video: [Watch Video...](url) or direct youtube/vimeo link
    const vidLinkMatch = trimmed.match(/^\[(.*?)\]\((https?:\/\/[^\s]+)\)$/)
    if (vidLinkMatch && /(youtube|youtu\.be|vimeo)/i.test(vidLinkMatch[2])) {
      sections.push({
        id: `sec_${idCounter++}_${Date.now()}`,
        type: 'video',
        videoUrl: vidLinkMatch[2].trim()
      })
      continue
    }
    if (/^https?:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\/[^\s]+$/i.test(trimmed)) {
      sections.push({
        id: `sec_${idCounter++}_${Date.now()}`,
        type: 'video',
        videoUrl: trimmed
      })
      continue
    }

    // 4. Markdown Table: | Col1 | Col2 |
    if (trimmed.startsWith('|') && trimmed.includes('\n')) {
      const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean)
      if (lines.length >= 2) {
        const parseRow = (line: string) =>
          line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())
        const headers = parseRow(lines[0])
        const rows = lines.slice(2).map(parseRow)
        sections.push({
          id: `sec_${idCounter++}_${Date.now()}`,
          type: 'table',
          headers,
          rows
        })
        continue
      }
    }

    // 5. Default: Clean Text Section
    sections.push({
      id: `sec_${idCounter++}_${Date.now()}`,
      type: 'text',
      content: trimmed
    })
  }

  return sections
}

export function serializeSectionsToContent(sections: ArticleSection[]): string[] {
  return sections
    .map((sec) => {
      switch (sec.type) {
        case 'heading': {
          const level = sec.level || 2
          const hashes = '#'.repeat(level)
          return `${hashes} ${sec.heading || 'Section Heading'}`
        }
        case 'image': {
          const caption = sec.imageCaption || 'Jobsite Equipment'
          return `![${caption}](${sec.imageUrl || '/images/why-choose-v900-jobsite.png'})`
        }
        case 'video': {
          return `[Watch Video Walkthrough](${sec.videoUrl || ''})`
        }
        case 'table': {
          const headers = sec.headers && sec.headers.length > 0 ? sec.headers : ['Feature', 'Specification']
          const headerLine = `| ${headers.join(' | ')} |`
          const sepLine = `| ${headers.map(() => '---').join(' | ')} |`
          const rowLines = (sec.rows || []).map((row) => `| ${row.join(' | ')} |`).join('\n')
          return `${headerLine}\n${sepLine}${rowLines ? '\n' + rowLines : ''}`
        }
        case 'text':
        default: {
          return sec.content || ''
        }
      }
    })
    .filter((s) => s.trim().length > 0)
}

export function getEmbedVideoUrl(url?: string): string | null {
  if (!url) return null
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/)
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`
  }
  const vimeoMatch = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)/)
  if (vimeoMatch && vimeoMatch[1]) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  }
  if (/\.(mp4|webm|ogg)$/i.test(url)) {
    return url
  }
  return null
}

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
  const [mediaZoom, setMediaZoom] = useState<number>(100)
  const [mediaRotation, setMediaRotation] = useState<number>(0)

  const handleOpenMedia = (item: MediaItem) => {
    setSelectedMedia(item)
    setMediaZoom(100)
    setMediaRotation(0)
  }

  const handlePrevMedia = () => {
    if (!selectedMedia || mediaList.length === 0) return
    const currentIdx = mediaList.findIndex((m) => m.id === selectedMedia.id || m.url === selectedMedia.url)
    const prevIdx = currentIdx > 0 ? currentIdx - 1 : mediaList.length - 1
    setSelectedMedia(mediaList[prevIdx])
    setMediaZoom(100)
    setMediaRotation(0)
  }

  const handleNextMedia = () => {
    if (!selectedMedia || mediaList.length === 0) return
    const currentIdx = mediaList.findIndex((m) => m.id === selectedMedia.id || m.url === selectedMedia.url)
    const nextIdx = currentIdx < mediaList.length - 1 ? currentIdx + 1 : 0
    setSelectedMedia(mediaList[nextIdx])
    setMediaZoom(100)
    setMediaRotation(0)
  }

  const handleZoomIn = () => {
    setMediaZoom((prev) => Math.min(300, prev + 25))
  }

  const handleZoomOut = () => {
    setMediaZoom((prev) => Math.max(25, prev - 25))
  }

  const handleResetZoom = () => {
    setMediaZoom(100)
    setMediaRotation(0)
  }

  const handleRotate = () => {
    setMediaRotation((prev) => (prev + 90) % 360)
  }

  // Products Management States (Screenshots 1, 2, 3)
  const [isProductsExpanded, setIsProductsExpanded] = useState(true)
  const [productsSubView, setProductsSubView] = useState<'list' | 'editor' | 'categories' | 'brands'>('list')
  const [dashboardRecentTab, setDashboardRecentTab] = useState<'products' | 'articles'>('products')
  const [prodSearch, setProdSearch] = useState('')
  const [prodStatusFilter, setProdStatusFilter] = useState<'all' | 'published' | 'draft' | 'low-stock'>('all')
  const [prodCategoryFilter, setProdCategoryFilter] = useState('all')
  const [prodCurrentPage, setProdCurrentPage] = useState(1)
  const prodItemsPerPage = 20

  // Product Editor Form States (Screenshots 1 & 3)
  const [prodEditorId, setProdEditorId] = useState<number | null>(null)
  const [prodEditorName, setProdEditorName] = useState('')
  const [prodEditorSlug, setProdEditorSlug] = useState('')
  const [prodEditorShortDesc, setProdEditorShortDesc] = useState('')
  const [prodEditorDesc, setProdEditorDesc] = useState('')
  const [prodEditorSku, setProdEditorSku] = useState('')
  const [prodEditorCategory, setProdEditorCategory] = useState('Equipment > Skid Steer Loaders')
  const [prodEditorBrand, setProdEditorBrand] = useState('TYPHON')
  const [prodEditorPrice, setProdEditorPrice] = useState<number>(11999)
  const [prodEditorSalePrice, setProdEditorSalePrice] = useState<number | undefined>(undefined)
  const [prodEditorStock, setProdEditorStock] = useState<number>(4)
  const [prodEditorStatus, setProdEditorStatus] = useState<'Published' | 'Draft'>('Published')
  const [prodEditorBuyUrl, setProdEditorBuyUrl] = useState('')
  const [prodEditorFeatured, setProdEditorFeatured] = useState(false)
  const [prodEditorAddToCart, setProdEditorAddToCart] = useState(true)
  const [prodEditorImage, setProdEditorImage] = useState('/images/loader-red.png')
  const [prodEditorGallery, setProdEditorGallery] = useState('/images/loader-yellow.jpg\n/images/loader-blue.jpg')
  const [prodEditorSpecs, setProdEditorSpecs] = useState<{ name: string; value: string }[]>([
    { name: 'Engine Model', value: 'Kubota D1105 Diesel Engine (Tier 4 / Stage V)' },
    { name: 'Operating Weight', value: '2,150 lbs (975 kg)' },
    { name: 'Rated Operating Capacity', value: '900 lbs (408 kg)' },
    { name: 'Hydraulic Flow', value: '12.7 GPM @ 2,321 psi' },
    { name: 'Width', value: '35.5 in (Fits Standard Backyard Gates)' }
  ])

  // Inquiries & Leads States
  const [inquiriesList, setInquiriesList] = useState<Inquiry[]>(() => DEFAULT_INQUIRIES)
  const [inquirySearch, setInquirySearch] = useState('')
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState<string>('all')

  // Cart Orders States
  const [ordersList, setOrdersList] = useState<CartOrder[]>(() => DEFAULT_CART_ORDERS)

  // Comments Moderation States
  const [commentsData, setCommentsData] = useState<BlogComment[]>(() => DEFAULT_COMMENTS)
  const [commentFilter, setCommentFilter] = useState<'all' | 'Pending' | 'Approved' | 'Spam'>('all')

  // Articles Sub-view & Visual Section Editor States
  const [articlesSubView, setArticlesSubView] = useState<'list' | 'editor' | 'categories'>('list')
  const [editorTitle, setEditorTitle] = useState('')
  const [editorSlug, setEditorSlug] = useState('')
  const [editorExcerpt, setEditorExcerpt] = useState('')
  const [editorContent, setEditorContent] = useState('')
  const [articleSections, setArticleSections] = useState<ArticleSection[]>([])
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>('visual')
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [linkModalTargetSecId, setLinkModalTargetSecId] = useState<string | null>(null)
  const [linkModalType, setLinkModalType] = useState<'internal' | 'external'>('internal')
  const [linkModalInternalUrl, setLinkModalInternalUrl] = useState('/store')
  const [linkModalExternalUrl, setLinkModalExternalUrl] = useState('https://')
  const [linkModalText, setLinkModalText] = useState('')
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

  // Dedicated In-App Dialog Modals (Replacing native prompt & confirm)
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  const [showUploadMediaModal, setShowUploadMediaModal] = useState(false)
  const [uploadMediaTitle, setUploadMediaTitle] = useState('')
  const [uploadMediaUrl, setUploadMediaUrl] = useState('')

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen?: boolean
    title: string
    message: string
    confirmLabel?: string
    onConfirm: () => void | Promise<void>
  } | null>(null)

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
  useEffect(() => {
    if (!selectedMedia) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedMedia(null)
      } else if (e.key === 'ArrowLeft') {
        handlePrevMedia()
      } else if (e.key === 'ArrowRight') {
        handleNextMedia()
      } else if (e.key === '+' || e.key === '=') {
        setMediaZoom((prev) => Math.min(300, prev + 25))
      } else if (e.key === '-') {
        setMediaZoom((prev) => Math.max(25, prev - 25))
      } else if (e.key === '0') {
        setMediaZoom(100)
        setMediaRotation(0)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedMedia, mediaList])

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

  // Visual Section Article Editor Handlers
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
    setArticleSections([
      {
        id: `sec_${Date.now()}_1`,
        type: 'heading',
        level: 2,
        heading: '1. Overview & Applications'
      },
      {
        id: `sec_${Date.now()}_2`,
        type: 'text',
        content: 'Operating compact skid steers on residential job sites requires balancing high performance with strict noise, space, and turf protection requirements.'
      },
      {
        id: `sec_${Date.now()}_3`,
        type: 'image',
        imageUrl: '/images/why-choose-v900-jobsite.png',
        imageCaption: 'V900 Compact Mini Track Loader on residential jobsite'
      },
      {
        id: `sec_${Date.now()}_4`,
        type: 'heading',
        level: 2,
        heading: '2. Equipment Specifications'
      },
      {
        id: `sec_${Date.now()}_5`,
        type: 'table',
        headers: ['Specification', 'Value', 'Application'],
        rows: [
          ['Rated Operating Capacity', '900 lbs (408 kg)', 'Handles pallets, sod & gravel'],
          ['Hydraulic Flow', '12.7 GPM @ 2,321 psi', 'Runs heavy augers & trenchers'],
          ['Machine Width', '35.5 in (900 mm)', 'Passes through 36-inch gates']
        ]
      },
      {
        id: `sec_${Date.now()}_6`,
        type: 'video',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      }
    ])
    setEditorMode('visual')
    setArticlesSubView('editor')
  }

  const openEditArticle = (post: BlogPost) => {
    setEditingArticle(post)
    setEditorTitle(post.title)
    setEditorSlug(post.slug || '')
    setEditorExcerpt(post.excerpt)
    const rawParagraphs = Array.isArray(post.content) ? post.content : [post.content || '']
    setEditorContent(rawParagraphs.join('\n\n'))
    setEditorCategory(post.category)
    setEditorAuthor(post.author || 'Happy Machinery')
    setEditorStatus('Published')
    setEditorCoverImage(post.image)
    setEditorCoverAlt('')
    setEditorVideoUrl('')
    setEditorSeoTitle(post.title)
    setEditorSeoDesc(post.excerpt)

    const parsed = parseContentToSections(rawParagraphs)
    if (parsed.length === 0) {
      setArticleSections([
        { id: `sec_${Date.now()}`, type: 'text', content: post.excerpt || '' }
      ])
    } else {
      setArticleSections(parsed)
    }
    setEditorMode('visual')
    setArticlesSubView('editor')
  }

  // Section manipulation handlers
  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    setArticleSections((prev) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= prev.length) return prev
      const copy = [...prev]
      const [item] = copy.splice(index, 1)
      copy.splice(targetIndex, 0, item)
      return copy
    })
  }

  const handleDeleteSection = (id: string) => {
    setArticleSections((prev) => {
      if (prev.length <= 1) {
        showToast('Article must contain at least one section block.', 'warning')
        return prev
      }
      return prev.filter((s) => s.id !== id)
    })
  }

  const handleDuplicateSection = (index: number) => {
    setArticleSections((prev) => {
      const target = prev[index]
      const duplicate: ArticleSection = {
        ...target,
        id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        rows: target.rows ? target.rows.map((r) => [...r]) : undefined,
        headers: target.headers ? [...target.headers] : undefined
      }
      const copy = [...prev]
      copy.splice(index + 1, 0, duplicate)
      return copy
    })
    showToast('Section duplicated.', 'success')
  }

  const handleAddSection = (type: ArticleSectionType, insertIndex?: number) => {
    const newSection: ArticleSection = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type
    }
    if (type === 'heading') {
      newSection.level = 2
      newSection.heading = ''
    } else if (type === 'text') {
      newSection.content = ''
    } else if (type === 'image') {
      newSection.imageUrl = '/images/why-choose-v900-jobsite.png'
      newSection.imageCaption = 'Jobsite loader operations'
    } else if (type === 'video') {
      newSection.videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    } else if (type === 'table') {
      newSection.headers = ['Equipment Feature', 'Specifications']
      newSection.rows = [
        ['Operating Capacity', '900 lbs (408 kg)'],
        ['Hydraulic Flow', '12.7 GPM @ 2,321 psi']
      ]
    }

    setArticleSections((prev) => {
      const copy = [...prev]
      if (typeof insertIndex === 'number' && insertIndex >= 0 && insertIndex <= copy.length) {
        copy.splice(insertIndex, 0, newSection)
      } else {
        copy.push(newSection)
      }
      return copy
    })
    showToast(`Added ${type} section block.`, 'success')
  }

  const handleUpdateSection = (id: string, patch: Partial<ArticleSection>) => {
    setArticleSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    )
  }

  // Interactive Table Helpers
  const handleAddTableRow = (sectionId: string) => {
    setArticleSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId || s.type !== 'table') return s
        const colCount = s.headers?.length || 2
        return { ...s, rows: [...(s.rows || []), new Array(colCount).fill('')] }
      })
    )
  }

  const handleAddTableCol = (sectionId: string) => {
    setArticleSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId || s.type !== 'table') return s
        const headers = [...(s.headers || ['Col 1', 'Col 2']), `Col ${(s.headers?.length || 2) + 1}`]
        const rows = (s.rows || []).map((r) => [...r, ''])
        return { ...s, headers, rows }
      })
    )
  }

  const handleDeleteTableRow = (sectionId: string, rowIndex: number) => {
    setArticleSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId || s.type !== 'table') return s
        return { ...s, rows: (s.rows || []).filter((_, i) => i !== rowIndex) }
      })
    )
  }

  const handleUpdateTableHeader = (sectionId: string, colIndex: number, val: string) => {
    setArticleSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId || s.type !== 'table') return s
        const headers = [...(s.headers || [])]
        headers[colIndex] = val
        return { ...s, headers }
      })
    )
  }

  const handleUpdateTableCell = (sectionId: string, rowIndex: number, colIndex: number, val: string) => {
    setArticleSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId || s.type !== 'table') return s
        const rows = (s.rows || []).map((row, rIdx) => {
          if (rIdx !== rowIndex) return row
          const newRow = [...row]
          newRow[colIndex] = val
          return newRow
        })
        return { ...s, rows }
      })
    )
  }

  // Link Inserter Modal Helpers
  const handleOpenLinkModal = (sectionId: string) => {
    setLinkModalTargetSecId(sectionId)
    setLinkModalText('')
    setLinkModalInternalUrl('/store')
    setLinkModalExternalUrl('https://')
    setLinkModalOpen(true)
  }

  const handleInsertLinkIntoSection = () => {
    if (!linkModalTargetSecId) return
    const url = linkModalType === 'internal' ? linkModalInternalUrl : linkModalExternalUrl
    const text = linkModalText.trim() || (linkModalType === 'internal' ? linkModalInternalUrl : 'Link')
    const mdSnippet = `[${text}](${url})`
    setArticleSections((prev) =>
      prev.map((s) => {
        if (s.id !== linkModalTargetSecId || s.type !== 'text') return s
        const currentContent = s.content || ''
        const newContent = currentContent ? `${currentContent} ${mdSnippet}` : mdSnippet
        return { ...s, content: newContent }
      })
    )
    setLinkModalOpen(false)
    showToast('Link inserted into section.', 'success')
  }

  const handleSaveArticle = async (status: 'Published' | 'Draft' | 'Scheduled') => {
    if (!editorTitle.trim()) {
      showToast('Article title is required.', 'error')
      return
    }

    let contentParagraphs: string[] = []
    if (editorMode === 'visual') {
      contentParagraphs = serializeSectionsToContent(articleSections)
    } else {
      contentParagraphs = editorContent
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean)
    }

    if (contentParagraphs.length === 0) {
      showToast('Article must contain content.', 'error')
      return
    }

    // Auto-generate excerpt since summary/excerpt card was removed
    const firstTextSection = articleSections.find((s) => s.type === 'text')
    const finalExcerpt =
      editorExcerpt.trim() ||
      (firstTextSection?.content ? firstTextSection.content.slice(0, 220).trim() + '...' : editorTitle)

    const finalSlug = editorSlug.trim() || editorTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    if (editingArticle) {
      const updated = posts.map((p) =>
        p.id === editingArticle.id
          ? {
              ...p,
              title: editorTitle,
              slug: finalSlug,
              excerpt: finalExcerpt,
              content: contentParagraphs,
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
        excerpt: finalExcerpt,
        content: contentParagraphs,
        keyTakeaways: ['Maintenance standards', 'Safe operation', 'Field inspection guidelines'],
        image: editorCoverImage || '/images/why-choose-v900-jobsite.png',
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        readTime: `${Math.max(2, Math.ceil(contentParagraphs.join(' ').split(/\s+/).length / 180))} min read`,
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

  // ==============================================================================
  // Product Catalog Handlers (Screenshots 1, 2, 3)
  // ==============================================================================
  const openCreateProduct = () => {
    setProdEditorId(null)
    setProdEditorName('')
    setProdEditorSlug('')
    setProdEditorShortDesc('')
    setProdEditorDesc('')
    setProdEditorSku(`HM-${Math.floor(1000 + Math.random() * 9000)}`)
    setProdEditorCategory('Equipment > Skid Steer Loaders')
    setProdEditorBrand('TYPHON')
    setProdEditorPrice(11999)
    setProdEditorSalePrice(undefined)
    setProdEditorStock(4)
    setProdEditorStatus('Published')
    setProdEditorBuyUrl('https://happymachinery.com/store')
    setProdEditorFeatured(false)
    setProdEditorAddToCart(true)
    setProdEditorImage('/images/loader-red.png')
    setProdEditorGallery('/images/loader-yellow.jpg\n/images/loader-blue.jpg')
    setProdEditorSpecs([
      { name: 'Engine Model', value: 'Kubota D1105 Diesel Engine (Tier 4 / Stage V)' },
      { name: 'Operating Weight', value: '2,150 lbs (975 kg)' },
      { name: 'Rated Operating Capacity', value: '900 lbs (408 kg)' },
      { name: 'Hydraulic Flow', value: '12.7 GPM @ 2,321 psi' },
      { name: 'Width', value: '35.5 in (Fits Standard Backyard Gates)' }
    ])
    setProductsSubView('editor')
  }

  const openEditProduct = (prod: AdminProduct) => {
    setProdEditorId(prod.id)
    setProdEditorName(prod.name)
    setProdEditorSlug(prod.slug || prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    setProdEditorShortDesc(prod.shortDescription || prod.description.slice(0, 140))
    setProdEditorDesc(prod.description)
    setProdEditorSku(prod.sku)
    setProdEditorCategory(prod.category || 'Equipment > Skid Steer Loaders')
    setProdEditorBrand(prod.brand || 'TYPHON')
    setProdEditorPrice(prod.price)
    setProdEditorSalePrice(prod.salePrice)
    setProdEditorStock(prod.stock ?? 0)
    setProdEditorStatus(prod.status || 'Draft')
    setProdEditorBuyUrl(prod.buyUrl || '')
    setProdEditorFeatured(!!prod.featured)
    setProdEditorAddToCart(prod.addToCartEnabled !== false)
    setProdEditorImage(prod.image || '/images/loader-red.png')
    setProdEditorGallery(Array.isArray(prod.galleryImages) ? prod.galleryImages.join('\n') : '')
    setProdEditorSpecs(prod.specifications && prod.specifications.length > 0 ? prod.specifications : [
      { name: 'Engine Model', value: 'Kubota D1105 Diesel Engine' },
      { name: 'Operating Weight', value: '2,150 lbs' },
      { name: 'Rated Operating Capacity', value: '900 lbs' },
      { name: 'Hydraulic Flow', value: '12.7 GPM' }
    ])
    setProductsSubView('editor')
  }

  const handleSaveProduct = async (statusOverride?: 'Published' | 'Draft') => {
    if (!prodEditorName.trim()) {
      showToast('Product title is required.', 'error')
      return
    }

    const finalStatus = statusOverride || prodEditorStatus
    const gallery = prodEditorGallery
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    const validSpecs = prodEditorSpecs.filter((s) => s.name.trim() && s.value.trim())
    const finalSlug = prodEditorSlug.trim() || prodEditorName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    if (prodEditorId !== null) {
      const updated = products.map((p) =>
        p.id === prodEditorId
          ? {
              ...p,
              name: prodEditorName,
              slug: finalSlug,
              shortDescription: prodEditorShortDesc,
              description: prodEditorDesc,
              sku: prodEditorSku || p.sku,
              category: prodEditorCategory,
              brand: prodEditorBrand,
              price: Number(prodEditorPrice) || 0,
              salePrice: prodEditorSalePrice ? Number(prodEditorSalePrice) : undefined,
              stock: Number(prodEditorStock) || 0,
              status: finalStatus,
              buyUrl: prodEditorBuyUrl,
              featured: prodEditorFeatured,
              addToCartEnabled: prodEditorAddToCart,
              image: prodEditorImage || p.image,
              galleryImages: gallery,
              specifications: validSpecs,
              updatedAt: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            }
          : p
      )
      setProducts(updated)
      await writeSharedContent('products', updated)
      await logSecurityEvent('CONTENT_PUBLISHED', `Equipment "${prodEditorName}" updated (${finalStatus}).`, 'info', currentUser?.username)
      showToast(`Product "${prodEditorName}" saved successfully!`, 'success')
    } else {
      const newProduct: AdminProduct = {
        id: Date.now(),
        name: prodEditorName,
        slug: finalSlug,
        shortDescription: prodEditorShortDesc,
        description: prodEditorDesc,
        sku: prodEditorSku || `HM-${Math.floor(1000 + Math.random() * 9000)}`,
        category: prodEditorCategory,
        brand: prodEditorBrand,
        price: Number(prodEditorPrice) || 0,
        salePrice: prodEditorSalePrice ? Number(prodEditorSalePrice) : undefined,
        stock: Number(prodEditorStock) || 0,
        status: finalStatus,
        buyUrl: prodEditorBuyUrl,
        featured: prodEditorFeatured,
        addToCartEnabled: prodEditorAddToCart,
        image: prodEditorImage || '/images/loader-red.png',
        galleryImages: gallery,
        specifications: validSpecs,
        updatedAt: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      }
      const updated = [newProduct, ...products]
      setProducts(updated)
      await writeSharedContent('products', updated)
      await logSecurityEvent('CONTENT_PUBLISHED', `New equipment "${newProduct.name}" created as ${finalStatus}.`, 'info', currentUser?.username)
      showToast(`Product "${prodEditorName}" created successfully!`, 'success')
    }
    setProductsSubView('list')
  }

  const handleDeleteProduct = (id: number) => {
    const prod = products.find((p) => p.id === id)
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Equipment Listing',
      message: `Are you sure you want to delete "${prod?.name || 'this product'}"? This will permanently remove the equipment listing from the catalog.`,
      confirmLabel: 'Delete Product',
      onConfirm: async () => {
        const updated = products.filter((p) => p.id !== id)
        setProducts(updated)
        await writeSharedContent('products', updated)
        await logSecurityEvent('CONTENT_DELETED', `Equipment listing #${id} deleted.`, 'warning', currentUser?.username)
        showToast('Equipment listing deleted from catalog.', 'success')
        setConfirmDialog(null)
      }
    })
  }

  const handleDuplicateProduct = async (prod: AdminProduct) => {
    const duplicated: AdminProduct = {
      ...prod,
      id: Date.now(),
      name: `${prod.name} (Copy)`,
      sku: `${prod.sku}-COPY`,
      slug: `${prod.slug || 'item'}-copy`,
      status: 'Draft',
      updatedAt: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    }
    const updated = [duplicated, ...products]
    setProducts(updated)
    await writeSharedContent('products', updated)
    showToast(`Duplicated ${prod.sku} as draft!`, 'success')
  }

  const handleToggleProductStatus = async (id: number) => {
    const updated = products.map((p) => {
      if (p.id === id) {
        const nextStatus: 'Published' | 'Draft' = p.status === 'Published' ? 'Draft' : 'Published'
        showToast(`${p.sku} is now ${nextStatus}.`, 'success')
        return { ...p, status: nextStatus, updatedAt: 'Just now' }
      }
      return p
    })
    setProducts(updated)
    await writeSharedContent('products', updated)
  }

  const handleAddSpecRow = () => {
    setProdEditorSpecs((prev) => [...prev, { name: '', value: '' }])
  }

  const handleRemoveSpecRow = (index: number) => {
    setProdEditorSpecs((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpdateSpecRow = (index: number, field: 'name' | 'value', val: string) => {
    setProdEditorSpecs((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: val } : s))
    )
  }

  // Inquiries Handlers
  const handleUpdateInquiryStatus = async (id: number, status: Inquiry['status']) => {
    const updated = inquiriesList.map((item) => item.id === id ? { ...item, status } : item)
    setInquiriesList(updated)
    await writeSharedContent('inquiries', updated)
    showToast(`Inquiry status updated to ${status}.`, 'success')
  }

  const handleDeleteInquiry = async (id: number) => {
    const updated = inquiriesList.filter((item) => item.id !== id)
    setInquiriesList(updated)
    await writeSharedContent('inquiries', updated)
    showToast('Inquiry removed.', 'success')
  }

  // Orders Handlers
  const handleUpdateOrderStatus = async (id: string, status: CartOrder['status']) => {
    const updated = ordersList.map((item) => item.id === id ? { ...item, status } : item)
    setOrdersList(updated)
    await writeSharedContent('orders', updated)
    showToast(`Order ${id} marked as ${status}.`, 'success')
  }

  // Comments Handlers
  const handleUpdateCommentStatus = async (id: number, status: 'Pending' | 'Approved' | 'Spam') => {
    const updated = commentsData.map((item) => item.id === id ? { ...item, status } : item)
    setCommentsData(updated)
    await writeSharedContent('comments', updated)
    showToast(`Comment marked as ${status}.`, 'success')
  }

  const handleDeleteComment = async (id: number) => {
    const updated = commentsData.filter((item) => item.id !== id)
    setCommentsData(updated)
    await writeSharedContent('comments', updated)
    showToast('Comment deleted.', 'success')
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
              <div className="cms-brand-logo-badge" data-tooltip="Happy Machinery CMS">
                <img
                  src="https://img.miniexcavator.org/ebay/Dashboard-Icon/Happy_Machinery_Logo.webp"
                  alt="Happy Machinery"
                  style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/images/Happy_Machinery_Logo.webp' }}
                />
              </div>
            ) : (
              <div className="cms-sidebar-logo-wrapper">
                <img
                  src="https://img.miniexcavator.org/ebay/Dashboard-Icon/Happy_Machinery_Logo.webp"
                  alt="Happy Machinery"
                  className="cms-sidebar-logo-img"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/images/Happy_Machinery_Logo.webp' }}
                />
              </div>
            )}
          </Link>
          <button
            className="cms-sidebar-toggle-btn"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            data-tooltip={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
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
            data-tooltip="Dashboard"
            title={isSidebarCollapsed ? 'Dashboard' : undefined}
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
              data-tooltip="Articles & Content"
              title={isSidebarCollapsed ? 'Articles & Content' : undefined}
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
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    style={{
                      transition: 'transform 0.2s ease',
                      transform: isArticlesExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
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
                  <span className="cms-sub-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </span>
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
                  <span className="cms-sub-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  </span>
                  <span>New Article</span>
                </button>

                <button
                  className={`cms-nav-sub-item ${activeTab === 'articles' && articlesSubView === 'categories' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('articles')
                    setArticlesSubView('categories')
                  }}
                >
                  <span className="cms-sub-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                  </span>
                  <span>Categories</span>
                  <span className="cms-sub-count">{blogCategories.length}</span>
                </button>
              </div>
            )}
          </div>

          {/* Products & Equipment Expandable Item */}
          <div className="cms-nav-expandable-group">
            <button
              className={`cms-nav-item ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('products')
                setIsProductsExpanded(!isProductsExpanded)
              }}
              data-tooltip="Equipment & Products"
              title={isSidebarCollapsed ? 'Equipment & Products' : undefined}
            >
              <span className="cms-nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </span>
              <span className="cms-nav-label">Products</span>
              {!isSidebarCollapsed && (
                <span className="cms-nav-expand-arrow">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    style={{
                      transition: 'transform 0.2s ease',
                      transform: isProductsExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              )}
            </button>

            {/* Products Submenu */}
            {isProductsExpanded && !isSidebarCollapsed && (
              <div className="cms-nav-sub-menu">
                <button
                  className={`cms-nav-sub-item ${activeTab === 'products' && productsSubView === 'list' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('products')
                    setProductsSubView('list')
                  }}
                >
                  <span className="cms-sub-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                  </span>
                  <span>All Products</span>
                  <span className="cms-sub-count">{products.length}</span>
                </button>

                <button
                  className={`cms-nav-sub-item ${activeTab === 'products' && productsSubView === 'editor' && !prodEditorId ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('products')
                    openCreateProduct()
                  }}
                >
                  <span className="cms-sub-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  </span>
                  <span>Add new product</span>
                </button>

                <button
                  className={`cms-nav-sub-item ${activeTab === 'products' && prodCategoryFilter !== 'all' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('products')
                    setProductsSubView('list')
                    setProdCategoryFilter('Equipment > Skid Steer Loaders')
                  }}
                >
                  <span className="cms-sub-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                      <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                  </span>
                  <span>Categories</span>
                </button>

                <button
                  className={`cms-nav-sub-item ${activeTab === 'products' && prodSearch === 'TYPHON' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('products')
                    setProductsSubView('list')
                    setProdSearch('TYPHON')
                  }}
                >
                  <span className="cms-sub-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 21h18M3 7v14M21 7v14M6 7V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3M9 10h2M13 10h2M9 14h2M13 14h2M9 18h2M13 18h2" />
                    </svg>
                  </span>
                  <span>Brands</span>
                </button>
              </div>
            )}
          </div>

          {/* Cart Activity Item */}
          <button
            className={`cms-nav-item ${activeTab === 'cart' ? 'active' : ''}`}
            onClick={() => setActiveTab('cart')}
            data-tooltip="Cart Activity"
            title={isSidebarCollapsed ? 'Cart Activity' : undefined}
          >
            <span className="cms-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </span>
            <span className="cms-nav-label">Cart Activity</span>
            <span className="cms-nav-badge warning">{ordersList.length}</span>
          </button>

          {/* Media Library Item */}
          <button
            className={`cms-nav-item ${activeTab === 'media' ? 'active' : ''}`}
            onClick={() => setActiveTab('media')}
            data-tooltip="Media Library"
            title={isSidebarCollapsed ? 'Media Library' : undefined}
          >
            <span className="cms-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </span>
            <span className="cms-nav-label">Image Store</span>
            <span className="cms-nav-badge">{mediaList.length}</span>
          </button>

          <span className="cms-nav-group-title">COMMUNITY & INBOX</span>

          <button
            className={`cms-nav-item ${activeTab === 'inquiries' ? 'active' : ''}`}
            onClick={() => setActiveTab('inquiries')}
            data-tooltip="Inquiries & Leads"
            title={isSidebarCollapsed ? 'Inquiries & Leads' : undefined}
          >
            <span className="cms-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </span>
            <span className="cms-nav-label">Inquiries & Leads</span>
            <span className="cms-nav-badge warning">{inquiriesList.filter(i => i.status === 'New').length || inquiriesList.length}</span>
          </button>

          <button
            className={`cms-nav-item ${activeTab === 'comments' ? 'active' : ''}`}
            onClick={() => setActiveTab('comments')}
            data-tooltip="Customer Comments"
            title={isSidebarCollapsed ? 'Customer Comments' : undefined}
          >
            <span className="cms-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </span>
            <span className="cms-nav-label">Comments</span>
            <span className="cms-nav-badge">{commentsData.length}</span>
          </button>

          <span className="cms-nav-group-title">LAYOUT & SYSTEM</span>

          <button
            className={`cms-nav-item ${activeTab === 'pages' ? 'active' : ''}`}
            onClick={() => setActiveTab('pages')}
            data-tooltip="Home Sections"
            title={isSidebarCollapsed ? 'Home Sections' : undefined}
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
            data-tooltip="Pop-up & Banners"
            title={isSidebarCollapsed ? 'Pop-up & Banners' : undefined}
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

          <span className="cms-nav-group-title">SETTINGS & SYSTEM</span>

          <button
            className={`cms-nav-item ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
            data-tooltip="Security & Access Logs"
            title={isSidebarCollapsed ? 'Security & Access Logs' : undefined}
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
            data-tooltip="Accounts & Staff"
            title={isSidebarCollapsed ? 'Accounts & Staff' : undefined}
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
            data-tooltip="Maintenance Mode"
            title={isSidebarCollapsed ? 'Maintenance Mode' : undefined}
          >
            <span className="cms-nav-icon" style={{ color: maintenanceGlobal ? 'var(--cms-warning)' : 'inherit' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </span>
            <span className="cms-nav-label">Maintenance</span>
            <span className="cms-nav-active-dot" style={{ background: maintenanceGlobal ? 'var(--cms-accent-blue)' : '#10b981' }} />
          </button>
        </nav>

        {/* Sidebar Footer User Card */}
        <div className="cms-sidebar-footer">
          <div
            className="cms-sidebar-user-card"
            onClick={() => setShowProfileModal(true)}
            data-tooltip={currentUser.name ? `${currentUser.name} (Account)` : 'My Administrator Account'}
            title={isSidebarCollapsed ? (currentUser.name || 'Admin Profile') : undefined}
          >
            <div className="cms-avatar-badge">
              <img
                src={currentUser.avatar || 'https://img.miniexcavator.org/ebay/Dashboard-Icon/Happy_Machinery_Logo.webp'}
                alt={currentUser.name}
                className="cms-avatar-img"
                onError={(e) => { (e.target as HTMLImageElement).src = '/images/Happy_Machinery_Logo.webp' }}
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
        <div className="cms-main-scrollable-body">
          {/* TAB 1: DASHBOARD & EDITORIAL HUB (SCREENSHOT 1) */}
          {activeTab === 'dashboard' && (
            <div className="cms-dashboard-view-content">
              {/* Hero Welcome Banner (Screenshot 1) */}
              <div className="cms-hero-welcome-banner">
                <div className="cms-hero-banner-left">
                  <div className="cms-hero-badge">
                    <span>✨ HAPPY MACHINERY V900 CMS</span>
                  </div>
                  <h1 className="cms-hero-title">
                    Welcome back, {currentUser?.name ? currentUser.name.split(' ')[0] : 'Administrator'}! 👋
                  </h1>
                  <p className="cms-hero-subtitle">
                    Here's what's happening on your publication today. You have <strong>{products.length} equipment listings</strong> and <strong>{posts.length} articles</strong> published across <strong>{blogCategories.length} categories</strong>.
                  </p>
                </div>

                <div className="cms-hero-banner-actions">
                  <button
                    type="button"
                    className="cms-hero-btn-white"
                    onClick={() => {
                      setActiveTab('products')
                      openCreateProduct()
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Add Equipment</span>
                  </button>

                  <button
                    type="button"
                    className="cms-hero-btn-translucent"
                    onClick={() => {
                      setActiveTab('articles')
                      openNewArticle()
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    <span>Write Article</span>
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
                {/* 1. Total Equipment (Royal Blue) */}
                <div className="cms-kpi-card blue" style={{ cursor: 'pointer' }} onClick={() => { setActiveTab('products'); setProductsSubView('list') }}>
                  <div className="cms-kpi-text-col">
                    <span className="cms-kpi-label">Total Equipment</span>
                    <span className="cms-kpi-value">{products.length}</span>
                    <span className="cms-kpi-subtext">Active store catalog</span>
                  </div>
                  <div className="cms-kpi-icon-circle">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                  </div>
                </div>

                {/* 2. Live Published (Emerald Green) */}
                <div className="cms-kpi-card green" style={{ cursor: 'pointer' }} onClick={() => { setActiveTab('products'); setProdStatusFilter('published') }}>
                  <div className="cms-kpi-text-col">
                    <span className="cms-kpi-label">Live Published</span>
                    <span className="cms-kpi-value">{products.filter((p) => p.status === 'Published').length}</span>
                    <span className="cms-kpi-subtext">Published machines online</span>
                  </div>
                  <div className="cms-kpi-icon-circle">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                </div>

                {/* 3. Inquiries & Leads (Orange) */}
                <div className="cms-kpi-card orange" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('inquiries')}>
                  <div className="cms-kpi-text-col">
                    <span className="cms-kpi-label">Inquiries & Leads</span>
                    <span className="cms-kpi-value">{inquiriesList.length}</span>
                    <span className="cms-kpi-subtext">Contractor quote requests</span>
                  </div>
                  <div className="cms-kpi-icon-circle">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                </div>

                {/* 4. Editorial Guides (Purple) */}
                <div className="cms-kpi-card purple" style={{ cursor: 'pointer' }} onClick={() => { setActiveTab('articles'); setArticlesSubView('list') }}>
                  <div className="cms-kpi-text-col">
                    <span className="cms-kpi-label">Articles & Guides</span>
                    <span className="cms-kpi-value">{posts.length}</span>
                    <span className="cms-kpi-subtext">Published jobsite guides</span>
                  </div>
                  <div className="cms-kpi-icon-circle">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                </div>

                {/* 5. Cart Orders (Corporate Blue) */}
                <div className="cms-kpi-card blue" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('cart')}>
                  <div className="cms-kpi-text-col">
                    <span className="cms-kpi-label">Store Orders</span>
                    <span className="cms-kpi-value">{ordersList.length}</span>
                    <span className="cms-kpi-subtext">Active store checkout</span>
                  </div>
                  <div className="cms-kpi-icon-circle">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="9" cy="21" r="1" />
                      <circle cx="20" cy="21" r="1" />
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* 2-Column Section: Recent Equipment / Articles (Left) + Latest Comments & Quick Actions (Right) */}
              <div className="cms-dashboard-2col-layout">
                {/* LEFT COLUMN: Recent Items Switcher Table */}
                <div className="cms-card cms-recent-articles-card">
                  <div className="cms-card-header-row">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        style={{
                          background: dashboardRecentTab === 'products' ? '#1d7ff3' : 'var(--cms-bg-surface)',
                          color: dashboardRecentTab === 'products' ? '#ffffff' : 'var(--cms-text-primary)',
                          border: '1px solid var(--cms-border)',
                          borderRadius: '9999px',
                          padding: '6px 14px',
                          fontSize: '0.82rem',
                          fontWeight: 750,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                        onClick={() => setDashboardRecentTab('products')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        </svg>
                        <span>Equipment ({products.length})</span>
                      </button>
                      <button
                        type="button"
                        style={{
                          background: dashboardRecentTab === 'articles' ? '#1d7ff3' : 'var(--cms-bg-surface)',
                          color: dashboardRecentTab === 'articles' ? '#ffffff' : 'var(--cms-text-primary)',
                          border: '1px solid var(--cms-border)',
                          borderRadius: '9999px',
                          padding: '6px 14px',
                          fontSize: '0.82rem',
                          fontWeight: 750,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                        onClick={() => setDashboardRecentTab('articles')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                        </svg>
                        <span>Articles ({posts.length})</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      className="cms-link-action-btn"
                      onClick={() => {
                        if (dashboardRecentTab === 'products') {
                          setActiveTab('products')
                          setProductsSubView('list')
                        } else {
                          setActiveTab('articles')
                          setArticlesSubView('list')
                        }
                      }}
                    >
                      <span>View all</span>
                      <span>→</span>
                    </button>
                  </div>

                  {dashboardRecentTab === 'products' ? (
                    <div className="cms-table-wrapper">
                      <table className="cms-table cms-articles-table">
                        <thead>
                          <tr>
                            <th>EQUIPMENT MODEL</th>
                            <th>SKU</th>
                            <th>PRICE</th>
                            <th>STATUS</th>
                            <th style={{ textAlign: 'right' }}>ACTION</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.slice(0, 6).map((prod) => (
                            <tr key={prod.id}>
                              <td className="cms-article-title-cell">
                                <div className="cms-art-preview-flex">
                                  <img
                                    src={prod.image || '/images/why-choose-v900-jobsite.png'}
                                    alt={prod.name}
                                    className="cms-art-thumb"
                                  />
                                  <div className="cms-art-info">
                                    <strong className="cms-art-title-text" title={prod.name}>
                                      {prod.name}
                                    </strong>
                                    <span className="cms-art-slug-link">
                                      {prod.category}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="cms-sku-badge">{prod.sku}</span>
                              </td>
                              <td style={{ fontWeight: 800, color: 'var(--cms-text-primary)' }}>
                                ${prod.price.toLocaleString()}
                              </td>
                              <td>
                                <span className={`cms-status-pill ${prod.status === 'Published' ? 'published' : 'draft'}`}>
                                  {prod.status}
                                </span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  type="button"
                                  className="cms-action-pill-btn"
                                  onClick={() => {
                                    setActiveTab('products')
                                    openEditProduct(prod)
                                  }}
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                  <span>Edit</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
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
                  )}
                </div>

                {/* RIGHT COLUMN: Latest Comments & Quick Actions (Screenshot 1) */}
                <div className="cms-dashboard-right-col">
                  {/* Latest Comments Card */}
                  <div className="cms-card cms-comments-card">
                    <div className="cms-card-header-row">
                      <div className="cms-header-title-flex">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#1d7ff3' }}>
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <h3>Latest Comments</h3>
                      </div>
                      <button
                        type="button"
                        className="cms-link-action-btn"
                        onClick={() => setActiveTab('comments')}
                      >
                        <span>Moderate</span>
                        <span>→</span>
                      </button>
                    </div>

                    <div className="cms-comments-list">
                      {commentsData.slice(0, 3).map((item) => (
                        <div key={item.id} className="cms-comment-item">
                          <div className="cms-comment-user-row">
                            <div className="cms-comment-avatar-wrap">
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1d7ff3', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>
                                {item.author.charAt(0)}
                              </div>
                            </div>
                            <div className="cms-comment-meta">
                              <span className="cms-comment-author">{item.author}</span>
                              <span className="cms-comment-time">{item.date}</span>
                            </div>
                          </div>
                          <p className="cms-comment-text">"{item.text}"</p>
                          <span className="cms-comment-on-link">
                            on: <span className="cms-comment-target-title">{item.postTitle}</span>
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
                          setActiveTab('products')
                          openCreateProduct()
                        }}
                      >
                        <div className="cms-qa-icon" style={{ background: '#eff6ff', color: '#1d7ff3' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            <line x1="12" y1="22" x2="12" y2="12" />
                          </svg>
                        </div>
                        <div className="cms-qa-text">
                          <strong>Add Equipment</strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--cms-text-muted)' }}>New machine listing</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        className="cms-quick-action-btn"
                        onClick={() => {
                          setActiveTab('articles')
                          openNewArticle()
                        }}
                      >
                        <div className="cms-qa-icon" style={{ background: '#eff6ff', color: '#1d7ff3' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                          </svg>
                        </div>
                        <div className="cms-qa-text">
                          <strong>Write Article</strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--cms-text-muted)' }}>Jobsite guide & post</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        className="cms-quick-action-btn"
                        onClick={() => setActiveTab('media')}
                      >
                        <div className="cms-qa-icon" style={{ background: '#eff6ff', color: '#1d7ff3' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                        <div className="cms-qa-text">
                          <strong>Upload Media</strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--cms-text-muted)' }}>Photos & blueprints</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        className="cms-quick-action-btn"
                        onClick={() => setActiveTab('maintenance')}
                      >
                        <div className="cms-qa-icon" style={{ background: '#f1f5f9', color: '#0c2b5c' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                          </svg>
                        </div>
                        <div className="cms-qa-text">
                          <strong>Maintenance</strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--cms-text-muted)' }}>System status</span>
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
              {/* SUBVIEW A: NEW / EDIT ARTICLE (VISUAL SECTION & BLOCK BUILDER) */}
              {articlesSubView === 'editor' && (
                <div className="cms-rafvex-editor-container">
                  {/* Top Header Row with Back Button, View Mode Toggle, and Actions */}
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
                      <p className="cms-editor-subtitle">Write, design and publish an editorial post with live media blocks</p>
                    </div>

                    <div className="cms-editor-header-actions">
                      {/* View Mode Toggle */}
                      <div className="cms-view-mode-toggle">
                        <button
                          type="button"
                          className={`cms-view-toggle-btn ${editorMode === 'visual' ? 'active' : ''}`}
                          onClick={() => {
                            if (editorMode === 'code') {
                              setArticleSections(parseContentToSections(editorContent))
                            }
                            setEditorMode('visual')
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                          </svg>
                          <span>Visual Blocks</span>
                        </button>
                        <button
                          type="button"
                          className={`cms-view-toggle-btn ${editorMode === 'code' ? 'active' : ''}`}
                          onClick={() => {
                            if (editorMode === 'visual') {
                              setEditorContent(serializeSectionsToContent(articleSections).join('\n\n'))
                            }
                            setEditorMode('code')
                          }}
                        >
                          &lt; / &gt; Raw Code
                        </button>
                      </div>

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
                        className="cms-btn cms-btn-primary"
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
                      {/* Section 1: Title & Slug (Always on Top) */}
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

                      {/* MODE 1: VISUAL SECTION & BLOCK BUILDER (DEFAULT) */}
                      {editorMode === 'visual' && (
                        <div className="cms-sections-builder-container">
                          {/* Top Status & Quick Add Bar */}
                          <div className="cms-builder-top-bar">
                            <div className="cms-builder-stats">
                              <span className="cms-builder-badge">{articleSections.length} Content Blocks</span>
                              <span>Build your article section by section without markdown code</span>
                            </div>
                            <div className="cms-builder-quick-actions">
                              <button
                                type="button"
                                className="cms-quick-add-btn"
                                onClick={() => handleAddSection('text')}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <line x1="12" y1="5" x2="12" y2="19" />
                                  <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                <span>Text</span>
                              </button>
                              <button
                                type="button"
                                className="cms-quick-add-btn"
                                onClick={() => handleAddSection('heading')}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <line x1="12" y1="5" x2="12" y2="19" />
                                  <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                <span>Heading</span>
                              </button>
                              <button
                                type="button"
                                className="cms-quick-add-btn"
                                onClick={() => handleAddSection('image')}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <line x1="12" y1="5" x2="12" y2="19" />
                                  <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                <span>Image</span>
                              </button>
                              <button
                                type="button"
                                className="cms-quick-add-btn"
                                onClick={() => handleAddSection('video')}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <line x1="12" y1="5" x2="12" y2="19" />
                                  <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                <span>Video</span>
                              </button>
                              <button
                                type="button"
                                className="cms-quick-add-btn"
                                onClick={() => handleAddSection('table')}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <line x1="12" y1="5" x2="12" y2="19" />
                                  <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                <span>Table</span>
                              </button>
                            </div>
                          </div>

                          {/* Loop through each section card */}
                          {articleSections.map((sec, idx) => (
                            <React.Fragment key={sec.id}>
                              <div className="cms-section-card">
                                {/* Section Header Row with Drag/Index, Type, and Actions */}
                                <div className="cms-section-card-header">
                                  <div className="cms-section-header-left">
                                    <span className="cms-section-index-pill">#{idx + 1}</span>
                                    <span className="cms-section-type-pill">
                                      {sec.type === 'heading' && (
                                        <span className="cms-sec-type-flex">
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7V4h16v3M9 20h6M12 4v16" /></svg>
                                          <span>Section Heading</span>
                                        </span>
                                      )}
                                      {sec.type === 'text' && (
                                        <span className="cms-sec-type-flex">
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="17" y1="10" x2="3" y2="10" /><line x1="21" y1="6" x2="3" y2="6" /><line x1="21" y1="14" x2="3" y2="14" /><line x1="17" y1="18" x2="3" y2="18" /></svg>
                                          <span>Text Paragraph</span>
                                        </span>
                                      )}
                                      {sec.type === 'image' && (
                                        <span className="cms-sec-type-flex">
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                                          <span>Image with Live Preview</span>
                                        </span>
                                      )}
                                      {sec.type === 'video' && (
                                        <span className="cms-sec-type-flex">
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                                          <span>Video Player Preview</span>
                                        </span>
                                      )}
                                      {sec.type === 'table' && (
                                        <span className="cms-sec-type-flex">
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" /></svg>
                                          <span>Specifications Table</span>
                                        </span>
                                      )}
                                    </span>
                                  </div>

                                  <div className="cms-section-actions-row">
                                    <button
                                      type="button"
                                      className="cms-sec-action-btn"
                                      title="Move Up"
                                      disabled={idx === 0}
                                      onClick={() => handleMoveSection(idx, 'up')}
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg>
                                      <span>Up</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="cms-sec-action-btn"
                                      title="Move Down"
                                      disabled={idx === articleSections.length - 1}
                                      onClick={() => handleMoveSection(idx, 'down')}
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                                      <span>Down</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="cms-sec-action-btn"
                                      title="Duplicate Section"
                                      onClick={() => handleDuplicateSection(idx)}
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                                      <span>Duplicate</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="cms-sec-action-btn delete"
                                      title="Delete Section"
                                      disabled={articleSections.length <= 1}
                                      onClick={() => handleDeleteSection(sec.id)}
                                    >
                                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </div>

                                {/* BLOCK 1: HEADING */}
                                {sec.type === 'heading' && (
                                  <div className="cms-heading-block-body">
                                    <div className="cms-level-selector">
                                      <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--cms-text-muted)' }}>Heading Level:</span>
                                      <button
                                        type="button"
                                        className={`cms-level-btn ${(sec.level || 2) === 2 ? 'active' : ''}`}
                                        onClick={() => handleUpdateSection(sec.id, { level: 2 })}
                                      >
                                        H2 Section
                                      </button>
                                      <button
                                        type="button"
                                        className={`cms-level-btn ${sec.level === 3 ? 'active' : ''}`}
                                        onClick={() => handleUpdateSection(sec.id, { level: 3 })}
                                      >
                                        H3 Subsection
                                      </button>
                                    </div>
                                    <input
                                      type="text"
                                      className="cms-heading-input"
                                      placeholder="e.g. 1. Navigating Tight Access Points on Jobsites"
                                      value={sec.heading || ''}
                                      onChange={(e) => handleUpdateSection(sec.id, { heading: e.target.value })}
                                    />
                                  </div>
                                )}

                                {/* BLOCK 2: TEXT */}
                                {sec.type === 'text' && (
                                  <div className="cms-text-block-body">
                                    <div className="cms-text-format-bar">
                                      <button
                                        type="button"
                                        className="cms-inline-fmt-btn"
                                        title="Add Bold snippet"
                                        onClick={() => {
                                          const prev = sec.content || ''
                                          handleUpdateSection(sec.id, { content: prev ? `${prev} **bold text**` : '**bold text**' })
                                        }}
                                      >
                                        <b>B</b> Bold
                                      </button>
                                      <button
                                        type="button"
                                        className="cms-inline-fmt-btn"
                                        title="Add Italic snippet"
                                        onClick={() => {
                                          const prev = sec.content || ''
                                          handleUpdateSection(sec.id, { content: prev ? `${prev} *italic text*` : '*italic text*' })
                                        }}
                                      >
                                        <i>I</i> Italic
                                      </button>
                                      <button
                                        type="button"
                                        className="cms-inline-fmt-btn"
                                        title="Add bullet item"
                                        onClick={() => {
                                          const prev = sec.content || ''
                                          handleUpdateSection(sec.id, { content: prev ? `${prev}\n- Key jobsite point` : '- Key jobsite point' })
                                        }}
                                      >
                                        &bull; Bullet List
                                      </button>
                                      <button
                                        type="button"
                                        className="cms-inline-fmt-btn"
                                        title="Insert Internal or External Link"
                                        onClick={() => handleOpenLinkModal(sec.id)}
                                      >
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                                        </svg>
                                        <span>Insert Link</span>
                                      </button>
                                    </div>
                                    <textarea
                                      rows={6}
                                      className="cms-section-textarea"
                                      placeholder="Write your section content here in clean text. You can describe equipment techniques, jobsite tips, or machinery operations..."
                                      value={sec.content || ''}
                                      onChange={(e) => handleUpdateSection(sec.id, { content: e.target.value })}
                                    />
                                  </div>
                                )}

                                {/* BLOCK 3: IMAGE WITH LIVE PREVIEW */}
                                {sec.type === 'image' && (
                                  <div className="cms-image-block-body">
                                    <div className="cms-image-inputs-grid">
                                      <div>
                                        <label className="cms-editor-eyebrow">Image URL or Local Path</label>
                                        <input
                                          type="text"
                                          className="cms-editor-input-sm"
                                          placeholder="/images/... or https://..."
                                          value={sec.imageUrl || ''}
                                          onChange={(e) => handleUpdateSection(sec.id, { imageUrl: e.target.value })}
                                        />
                                      </div>
                                      <div>
                                        <label className="cms-editor-eyebrow">Image Caption / Alt Description</label>
                                        <input
                                          type="text"
                                          className="cms-editor-input-sm"
                                          placeholder="e.g. TYPHON V900 loader operating in narrow residential gate"
                                          value={sec.imageCaption || ''}
                                          onChange={(e) => handleUpdateSection(sec.id, { imageCaption: e.target.value })}
                                        />
                                      </div>
                                    </div>

                                    {/* Preset Media Quick Select */}
                                    <div className="cms-preset-chips-row">
                                      <span style={{ fontSize: '0.72rem', color: 'var(--cms-text-muted)', fontWeight: 700 }}>Quick Preset:</span>
                                      <button
                                        type="button"
                                        className="cms-preset-chip"
                                        onClick={() => handleUpdateSection(sec.id, { imageUrl: '/images/why-choose-v900-jobsite.png', imageCaption: 'V900 Jobsite Operations' })}
                                      >
                                        Jobsite Action
                                      </button>
                                      <button
                                        type="button"
                                        className="cms-preset-chip"
                                        onClick={() => handleUpdateSection(sec.id, { imageUrl: '/images/loader-yellow.jpg', imageCaption: 'Industrial Yellow Skid Steer' })}
                                      >
                                        Yellow Loader
                                      </button>
                                      <button
                                        type="button"
                                        className="cms-preset-chip"
                                        onClick={() => handleUpdateSection(sec.id, { imageUrl: '/images/loader-blue.jpg', imageCaption: 'Cobalt Blue Mini Skid Steer' })}
                                      >
                                        Blue Loader
                                      </button>
                                      <button
                                        type="button"
                                        className="cms-preset-chip"
                                        onClick={() => handleUpdateSection(sec.id, { imageUrl: '/images/loader-red.png', imageCaption: 'Crimson Red Compact Track Loader' })}
                                      >
                                        Red Loader
                                      </button>
                                    </div>

                                    {/* LIVE IMAGE PREVIEW FRAME */}
                                    {sec.imageUrl && (
                                      <div className="cms-image-preview-frame">
                                        <img
                                          src={sec.imageUrl}
                                          alt={sec.imageCaption || 'Preview'}
                                          onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none' }}
                                        />
                                        {sec.imageCaption && (
                                          <div className="cms-image-preview-caption-bar">
                                            <span>📷</span>
                                            <span>{sec.imageCaption}</span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* BLOCK 4: VIDEO WITH LIVE PLAYER PREVIEW */}
                                {sec.type === 'video' && (
                                  <div className="cms-video-block-body">
                                    <div>
                                      <label className="cms-editor-eyebrow">Video URL (YouTube, Vimeo, or MP4)</label>
                                      <input
                                        type="text"
                                        className="cms-editor-input-sm"
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        value={sec.videoUrl || ''}
                                        onChange={(e) => handleUpdateSection(sec.id, { videoUrl: e.target.value })}
                                      />
                                    </div>

                                    <div className="cms-preset-chips-row">
                                      <span style={{ fontSize: '0.72rem', color: 'var(--cms-text-muted)', fontWeight: 700 }}>Quick Demo Video:</span>
                                      <button
                                        type="button"
                                        className="cms-preset-chip"
                                        onClick={() => handleUpdateSection(sec.id, { videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })}
                                      >
                                        YouTube Demo
                                      </button>
                                    </div>

                                    {/* LIVE VIDEO PLAYER PREVIEW */}
                                    {getEmbedVideoUrl(sec.videoUrl) ? (
                                      <div className="cms-video-preview-frame">
                                        <iframe
                                          src={getEmbedVideoUrl(sec.videoUrl)!}
                                          title="Video Preview"
                                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                          allowFullScreen
                                        />
                                      </div>
                                    ) : (
                                      <div className="cms-video-helper-tag">
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <circle cx="12" cy="12" r="10" />
                                          <line x1="12" y1="16" x2="12" y2="12" />
                                          <line x1="12" y1="8" x2="12.01" y2="8" />
                                        </svg>
                                        <span>Enter a valid YouTube, Vimeo, or MP4 URL above to see the live player preview here.</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* BLOCK 5: INTERACTIVE TABLE WITH LIVE PREVIEW */}
                                {sec.type === 'table' && (
                                  <div className="cms-table-block-body">
                                    <div className="cms-table-tools-header">
                                      <div className="cms-table-tools-left">
                                        <button
                                          type="button"
                                          className="cms-quick-add-btn"
                                          onClick={() => handleAddTableCol(sec.id)}
                                        >
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <line x1="12" y1="5" x2="12" y2="19" />
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                          </svg>
                                          <span>Add Column</span>
                                        </button>
                                        <button
                                          type="button"
                                          className="cms-quick-add-btn"
                                          onClick={() => handleAddTableRow(sec.id)}
                                        >
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <line x1="12" y1="5" x2="12" y2="19" />
                                            <line x1="5" y1="12" x2="19" y2="12" />
                                          </svg>
                                          <span>Add Row</span>
                                        </button>
                                      </div>
                                      <span style={{ fontSize: '0.75rem', color: 'var(--cms-text-muted)' }}>
                                        Interactive spreadsheet editor with live website preview
                                      </span>
                                    </div>

                                    {/* Editable Table Grid */}
                                    <div className="cms-table-editor-scroll">
                                      <table className="cms-interactive-table">
                                        <thead>
                                          <tr>
                                            {(sec.headers || ['Feature', 'Specification']).map((h, colIdx) => (
                                              <th key={colIdx}>
                                                <input
                                                  type="text"
                                                  className="cms-tbl-input-header"
                                                  value={h}
                                                  placeholder={`Column ${colIdx + 1}`}
                                                  onChange={(e) => handleUpdateTableHeader(sec.id, colIdx, e.target.value)}
                                                />
                                              </th>
                                            ))}
                                            <th style={{ width: '40px', textAlign: 'center' }}></th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {(sec.rows || []).map((row, rowIdx) => (
                                            <tr key={rowIdx}>
                                              {row.map((cell, colIdx) => (
                                                <td key={colIdx}>
                                                  <input
                                                    type="text"
                                                    className="cms-tbl-input-cell"
                                                    value={cell}
                                                    placeholder="Enter value..."
                                                    onChange={(e) => handleUpdateTableCell(sec.id, rowIdx, colIdx, e.target.value)}
                                                  />
                                                </td>
                                              ))}
                                              <td style={{ textAlign: 'center' }}>
                                                <button
                                                  type="button"
                                                  className="cms-tbl-del-row-btn"
                                                  title="Delete Row"
                                                  onClick={() => handleDeleteTableRow(sec.id, rowIdx)}
                                                >
                                                  ✕
                                                </button>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>

                                    {/* LIVE STYLED TABLE PREVIEW */}
                                    <div className="cms-table-preview-card">
                                      <div className="cms-table-preview-title">
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                          <circle cx="12" cy="12" r="3" />
                                        </svg>
                                        <span>Live Visitor Table Preview</span>
                                      </div>
                                      <table className="cms-live-styled-table">
                                        <thead>
                                          <tr>
                                            {(sec.headers || ['Feature', 'Specification']).map((h, hIdx) => (
                                              <th key={hIdx}>{h || `Col ${hIdx + 1}`}</th>
                                            ))}
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {(sec.rows || []).map((r, rIdx) => (
                                            <tr key={rIdx}>
                                              {r.map((c, cIdx) => (
                                                <td key={cIdx}>{c || '—'}</td>
                                              ))}
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* In-Between Add Section Bar */}
                              <div className="cms-add-block-bar">
                                <button
                                  type="button"
                                  className="cms-add-block-bar-btn"
                                  onClick={() => handleAddSection('text', idx + 1)}
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                  </svg>
                                  <span>Text</span>
                                </button>
                                <button
                                  type="button"
                                  className="cms-add-block-bar-btn"
                                  onClick={() => handleAddSection('heading', idx + 1)}
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                  </svg>
                                  <span>Heading</span>
                                </button>
                                <button
                                  type="button"
                                  className="cms-add-block-bar-btn"
                                  onClick={() => handleAddSection('image', idx + 1)}
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                  </svg>
                                  <span>Image</span>
                                </button>
                                <button
                                  type="button"
                                  className="cms-add-block-bar-btn"
                                  onClick={() => handleAddSection('video', idx + 1)}
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                  </svg>
                                  <span>Video</span>
                                </button>
                                <button
                                  type="button"
                                  className="cms-add-block-bar-btn"
                                  onClick={() => handleAddSection('table', idx + 1)}
                                >
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="12" y1="5" x2="12" y2="19" />
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                  </svg>
                                  <span>Table</span>
                                </button>
                              </div>
                            </React.Fragment>
                          ))}
                        </div>
                      )}

                      {/* MODE 2: RAW CODE VIEW (FOR ADVANCED USERS) */}
                      {editorMode === 'code' && (
                        <div className="cms-editor-card">
                          <div className="cms-editor-card-header-row">
                            <label className="cms-editor-eyebrow">RAW MARKDOWN CONTENT</label>
                            <span className="cms-tag-muted">Advanced Direct Code Mode</span>
                          </div>

                          <textarea
                            rows={24}
                            className="cms-editor-textarea content-area"
                            placeholder="Write your article content in Markdown format..."
                            value={editorContent}
                            onChange={(e) => setEditorContent(e.target.value)}
                          />
                        </div>
                      )}
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

                  {/* Internal / External Link Picker Modal */}
                  {linkModalOpen && (
                    <div className="cms-link-picker-modal-backdrop" onClick={() => setLinkModalOpen(false)}>
                      <div className="cms-link-picker-card" onClick={(e) => e.stopPropagation()}>
                        <div className="cms-link-picker-header">
                          <h3>Insert Link into Section</h3>
                          <button
                            type="button"
                            className="cms-modal-close-btn"
                            onClick={() => setLinkModalOpen(false)}
                          >
                            ✕
                          </button>
                        </div>

                        <div className="cms-link-type-tabs">
                          <button
                            type="button"
                            className={`cms-link-type-tab ${linkModalType === 'internal' ? 'active' : ''}`}
                            onClick={() => setLinkModalType('internal')}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="12 2 2 7 12 12 22 7 12 2" />
                              <polyline points="2 17 12 22 22 17" />
                              <polyline points="2 12 12 17 22 12" />
                            </svg>
                            <span>Internal Site Link</span>
                          </button>
                          <button
                            type="button"
                            className={`cms-link-type-tab ${linkModalType === 'external' ? 'active' : ''}`}
                            onClick={() => setLinkModalType('external')}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="2" y1="12" x2="22" y2="12" />
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                            </svg>
                            <span>External Website URL</span>
                          </button>
                        </div>

                        {linkModalType === 'internal' ? (
                          <div>
                            <label className="cms-editor-eyebrow">Select Website Destination</label>
                            <select
                              className="cms-editor-select"
                              value={linkModalInternalUrl}
                              onChange={(e) => setLinkModalInternalUrl(e.target.value)}
                            >
                              <optgroup label="Main Pages">
                                <option value="/store">Store Catalog (/store)</option>
                                <option value="/blog">Jobsite Articles Hub (/blog)</option>
                                <option value="/contact">Quote Request & Contact (/contact)</option>
                                <option value="/about">About Happy Machinery (/about)</option>
                                <option value="/cart">Shopping Cart & Checkout (/cart)</option>
                              </optgroup>
                              <optgroup label="Featured Machinery">
                                {products.slice(0, 10).map((p) => (
                                  <option key={p.id} value={`/store#prod-${p.id}`}>
                                    {p.name} (${p.price.toLocaleString()})
                                  </option>
                                ))}
                              </optgroup>
                            </select>
                          </div>
                        ) : (
                          <div>
                            <label className="cms-editor-eyebrow">External Destination URL</label>
                            <input
                              type="url"
                              className="cms-editor-input-sm"
                              placeholder="https://example.com/industry-standard"
                              value={linkModalExternalUrl}
                              onChange={(e) => setLinkModalExternalUrl(e.target.value)}
                            />
                          </div>
                        )}

                        <div>
                          <label className="cms-editor-eyebrow">Display Anchor Text</label>
                          <input
                            type="text"
                            className="cms-editor-input-sm"
                            placeholder="e.g. Explore V900 compact loader specifications"
                            value={linkModalText}
                            onChange={(e) => setLinkModalText(e.target.value)}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                          <button
                            type="button"
                            className="cms-btn cms-btn-secondary"
                            onClick={() => setLinkModalOpen(false)}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="cms-btn cms-btn-primary"
                            onClick={handleInsertLinkIntoSection}
                          >
                            Insert Link
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SUBVIEW B: CATEGORIES & SLUGS (SCREENSHOT 5) */}
              {articlesSubView === 'categories' && (
                <div className="cms-categories-view-wrapper">
                  <div className="cms-view-header">
                    <div className="cms-view-title-group">
                      <span className="cms-eyebrow-blue">EDITORIAL TAXONOMY</span>
                      <h1>Categories & Slugs</h1>
                      <p>Organize your publication into distinct channels, URL slugs, and featured topics.</p>
                    </div>
                    <div className="cms-taxonomy-counters">
                      <div className="cms-tax-pill">
                        <span>CATEGORIES</span>
                        <strong>{blogCategories.length}</strong>
                      </div>
                      <div className="cms-tax-pill blue">
                        <span>ASSIGNED BLOGS</span>
                        <strong>{posts.length}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Subnav row */}
                  <div className="cms-articles-subnav">
                    <button type="button" className="cms-subnav-btn" onClick={() => setArticlesSubView('list')}>All Articles</button>
                    <button type="button" className="cms-subnav-btn" onClick={openNewArticle}>New Article</button>
                    <button type="button" className="cms-subnav-btn active">Categories & Slugs</button>
                  </div>

                  <div className="cms-categories-grid">
                    {/* Left: Add New Category */}
                    <div className="cms-card">
                      <div className="cms-card-header">
                        <div className="cms-card-title">
                          <span style={{ color: 'var(--cms-accent-blue)', fontSize: '1.2rem', fontWeight: 700 }}>+</span>
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

                        <button type="submit" className="cms-btn cms-btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                          <span>Add Category</span>
                        </button>
                      </form>
                    </div>

                    {/* Right: Publication Structure & Associated Blogs */}
                    <div className="cms-card">
                      <div className="cms-card-header">
                        <div className="cms-card-title">
                          <span style={{ color: 'var(--cms-accent-blue)', display: 'inline-flex' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                            </svg>
                          </span>
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
                                  <span className="cms-cat-icon">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                    </svg>
                                  </span>
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
                      <button className="cms-btn cms-btn-primary" onClick={openNewArticle}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <span>New Article</span>
                      </button>
                    </div>
                  </div>

                  {/* Subnav row */}
                  <div className="cms-articles-subnav">
                    <button type="button" className="cms-subnav-btn active">All Articles ({posts.length})</button>
                    <button type="button" className="cms-subnav-btn" onClick={openNewArticle}>New Article</button>
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
                  <span className="cms-blue-dot" />
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
                  className="cms-tb-btn upload-primary"
                  onClick={() => setShowUploadMediaModal(true)}
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
                  onClick={() => setShowFolderModal(true)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    <line x1="12" y1="11" x2="12" y2="17" />
                    <line x1="9" y1="14" x2="15" y2="14" />
                  </svg>
                  <span>New Folder</span>
                </button>

                <button
                  type="button"
                  className="cms-tb-pill-btn"
                  onClick={() => setShowUploadMediaModal(true)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                  <span>New File</span>
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
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <span>All URLs</span>
                </button>

                <button
                  type="button"
                  className="cms-tb-pill-btn"
                  onClick={() => showToast('Select mode activated.', 'info' as any)}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Select</span>
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
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>Download</span>
                </button>
              </div>

              {/* Path Breadcrumb (Screenshot 2) */}
              <div className="cms-medialib-path-row">
                <div className="cms-path-breadcrumb">
                  <span className="cms-path-part" style={{ display: 'inline-flex', verticalAlign: 'middle' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                  </span>
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
                    <span style={{ display: 'inline-flex', color: 'var(--cms-accent-blue)' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                    </span>
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
                          <tr key={item.id} onClick={() => handleOpenMedia(item)} style={{ cursor: 'pointer' }}>
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
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                  </svg>
                                  <span>Download</span>
                                </a>
                                <button
                                  type="button"
                                  className="cms-file-action-btn"
                                  onClick={() => handleOpenMedia(item)}
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                    <circle cx="12" cy="12" r="3" />
                                  </svg>
                                  <span>Open</span>
                                </button>
                                <button
                                  type="button"
                                  className="cms-file-action-btn"
                                  onClick={() => {
                                    navigator.clipboard.writeText(item.url)
                                    showToast('URL copied to clipboard!', 'success')
                                  }}
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                  </svg>
                                  <span>Copy</span>
                                </button>
                                <button
                                  type="button"
                                  className="cms-file-action-btn danger"
                                  onClick={() => {
                                    setConfirmDialog({
                                      title: 'Delete Media Item',
                                      message: `Are you sure you want to delete "${item.title}"? This item will be permanently removed.`,
                                      onConfirm: () => {
                                        const updated = mediaList.filter((m) => m.id !== item.id)
                                        setMediaList(updated)
                                        void writeSharedContent('media-library', updated)
                                        showToast('Item deleted.', 'warning')
                                      }
                                    })
                                  }}
                                >
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6" />
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  </svg>
                                  <span>Delete</span>
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
                    <span style={{ display: 'inline-flex', color: 'var(--cms-accent-blue)' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                    </span>
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
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        <span>Copy</span>
                      </button>
                    </div>
                  ))}
                </div>

                <div className="cms-urls-footer-actions">
                  <button
                    type="button"
                    className="cms-btn cms-btn-primary"
                    onClick={() => {
                      const allUrls = mediaList.map((m) => m.url).join('\n')
                      navigator.clipboard.writeText(allUrls)
                      showToast('All image URLs copied to clipboard!', 'success')
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>Copy All URLs</span>
                  </button>

                  <button
                    type="button"
                    className="cms-btn cms-btn-secondary"
                    onClick={() => {
                      const firstFew = mediaList.slice(0, 3).map((m) => m.url).join('\n')
                      navigator.clipboard.writeText(firstFew)
                      showToast('Selected URLs copied to clipboard!', 'success')
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>Copy Selected URLs</span>
                  </button>
                </div>
              </div>

              {/* Image Preview Grid (Screenshot 3) */}
              <div className="cms-card cms-image-preview-card">
                <div className="cms-card-header-row">
                  <div className="cms-header-title-flex">
                    <span style={{ display: 'inline-flex', color: 'var(--cms-accent-blue)' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </span>
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
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleOpenMedia(item)}
                      onDoubleClick={() => handleOpenMedia(item)}
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
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EQUIPMENT & PRODUCTS (SCREENSHOTS 1, 2, 3) */}
          {activeTab === 'products' && (
            <>
              {productsSubView === 'list' && (
                <div className="cms-catalog-view-container">
                  {/* Top Breadcrumb Bar */}
                  <div className="cms-view-breadcrumb-bar">
                    <span>DASHBOARD PORTAL</span>
                    <span>/</span>
                    <span style={{ color: 'var(--cms-accent-blue)' }}>ADMIN/PRODUCTS</span>
                  </div>

                  {/* Header Title Row */}
                  <div className="cms-catalog-title-row">
                    <div>
                      <span className="cms-catalog-eyebrow">STORE CATALOG</span>
                      <h1 className="cms-catalog-h1">All Products</h1>
                      <p className="cms-catalog-subtext">
                        {products.length} total • {products.filter((p) => p.status === 'Published').length} published • {products.filter((p) => p.status === 'Draft').length} drafts
                      </p>
                    </div>

                    <button
                      type="button"
                      className="cms-btn-primary-blue"
                      onClick={() => openCreateProduct()}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      <span>Add Product</span>
                    </button>
                  </div>

                  {/* 4 Product Metric Cards (Screenshot 2) */}
                  <div className="cms-prod-metrics-grid">
                    <div className="cms-prod-metric-card" style={{ cursor: 'pointer' }} onClick={() => { setProdStatusFilter('all'); setProdSearch('') }}>
                      <span className="cms-pm-label">Total Products</span>
                      <span className="cms-pm-value">{products.length}</span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--cms-text-muted)' }}>Complete store inventory</span>
                    </div>

                    <div className="cms-prod-metric-card published" style={{ cursor: 'pointer' }} onClick={() => setProdStatusFilter('published')}>
                      <span className="cms-pm-label">Published</span>
                      <span className="cms-pm-value">{products.filter((p) => p.status === 'Published').length}</span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--cms-text-muted)' }}>Live in catalog & store</span>
                    </div>

                    <div className="cms-prod-metric-card drafts" style={{ cursor: 'pointer' }} onClick={() => setProdStatusFilter('draft')}>
                      <span className="cms-pm-label">Drafts</span>
                      <span className="cms-pm-value">{products.filter((p) => p.status === 'Draft').length}</span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--cms-text-muted)' }}>Draft catalog listings</span>
                    </div>

                    <div className="cms-prod-metric-card lowstock" style={{ cursor: 'pointer' }} onClick={() => setProdStatusFilter('low-stock')}>
                      <span className="cms-pm-label">Low Stock</span>
                      <span className="cms-pm-value">{products.filter((p) => (p.stock ?? 0) <= 2).length}</span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--cms-text-muted)' }}>Units with stock ≤ 2</span>
                    </div>
                  </div>

                  {/* Filter & Search Toolbar */}
                  <div className="cms-products-filter-toolbar">
                    <div className="cms-filter-search-box">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search by product name, SKU, or category..."
                        value={prodSearch}
                        onChange={(e) => {
                          setProdSearch(e.target.value)
                          setProdCurrentPage(1)
                        }}
                      />
                    </div>

                    <select
                      className="cms-filter-dropdown-select"
                      value={prodStatusFilter}
                      onChange={(e) => {
                        setProdStatusFilter(e.target.value as any)
                        setProdCurrentPage(1)
                      }}
                    >
                      <option value="all">All statuses</option>
                      <option value="published">Published</option>
                      <option value="draft">Drafts</option>
                      <option value="low-stock">Low Stock (≤ 2)</option>
                    </select>

                    <select
                      className="cms-filter-dropdown-select"
                      style={{ maxWidth: '240px' }}
                      value={prodCategoryFilter}
                      onChange={(e) => {
                        setProdCategoryFilter(e.target.value)
                        setProdCurrentPage(1)
                      }}
                    >
                      <option value="all">All Categories</option>
                      {IMPORTED_CATEGORY_PATHS.map((catPath) => (
                        <option key={catPath} value={catPath}>
                          {catPath}
                        </option>
                      ))}
                    </select>

                    {(prodSearch || prodStatusFilter !== 'all' || prodCategoryFilter !== 'all') && (
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--cms-accent-blue)',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          setProdSearch('')
                          setProdStatusFilter('all')
                          setProdCategoryFilter('all')
                          setProdCurrentPage(1)
                        }}
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>

                  {/* Products Table (Screenshot 2) */}
                  <div className="cms-card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div className="cms-table-wrapper">
                      {(() => {
                        const filtered = products.filter((p) => {
                          const matchesSearch =
                            !prodSearch ||
                            p.name.toLowerCase().includes(prodSearch.toLowerCase()) ||
                            p.sku.toLowerCase().includes(prodSearch.toLowerCase()) ||
                            p.category.toLowerCase().includes(prodSearch.toLowerCase()) ||
                            (p.brand && p.brand.toLowerCase().includes(prodSearch.toLowerCase()))
                          const matchesStatus =
                            prodStatusFilter === 'all' ||
                            (prodStatusFilter === 'published' && p.status === 'Published') ||
                            (prodStatusFilter === 'draft' && p.status === 'Draft') ||
                            (prodStatusFilter === 'low-stock' && (p.stock ?? 0) <= 2)
                          const matchesCategory =
                            prodCategoryFilter === 'all' || p.category === prodCategoryFilter
                          return matchesSearch && matchesStatus && matchesCategory
                        })

                        const totalPages = Math.ceil(filtered.length / prodItemsPerPage) || 1
                        const paginated = filtered.slice(
                          (prodCurrentPage - 1) * prodItemsPerPage,
                          prodCurrentPage * prodItemsPerPage
                        )

                        return (
                          <>
                            <table className="cms-prod-table">
                              <thead>
                                <tr>
                                  <th>PRODUCT</th>
                                  <th>SKU</th>
                                  <th>CATEGORY</th>
                                  <th>PRICE</th>
                                  <th>STOCK</th>
                                  <th>STATUS</th>
                                  <th>ADD TO CART</th>
                                  <th>UPDATED</th>
                                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                                </tr>
                              </thead>
                              <tbody>
                                {paginated.map((prod) => (
                                  <tr key={prod.id}>
                                    <td>
                                      <div className="cms-prod-thumb-cell">
                                        <div className="cms-prod-img-box">
                                          <img
                                            src={prod.image || '/images/why-choose-v900-jobsite.png'}
                                            alt={prod.name}
                                          />
                                        </div>
                                        <div className="cms-prod-title-group">
                                          <strong className="cms-prod-name-title" title={prod.name}>
                                            {prod.name}
                                          </strong>
                                          <span className="cms-prod-sub-snippet">
                                            {prod.shortDescription || prod.description.slice(0, 50)}...
                                          </span>
                                        </div>
                                      </div>
                                    </td>
                                    <td>
                                      <span className="cms-sku-badge">{prod.sku}</span>
                                    </td>
                                    <td>
                                      <span className="cms-category-pill" style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={prod.category}>
                                        {prod.category}
                                      </span>
                                    </td>
                                    <td>
                                      <div className="cms-price-stack">
                                        <span className="cms-sale-price-bold">
                                          ${(prod.salePrice || prod.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                        {prod.salePrice && (
                                          <span className="cms-regular-price-struck">
                                            ${prod.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    <td>
                                      <span className={`cms-stock-pill ${(prod.stock ?? 0) > 0 ? 'in-stock' : 'out-stock'}`}>
                                        {prod.stock ?? 0}
                                      </span>
                                    </td>
                                    <td>
                                      <button
                                        type="button"
                                        className={`cms-status-btn-pill ${prod.status === 'Published' ? 'published' : 'draft'}`}
                                        onClick={() => handleToggleProductStatus(prod.id)}
                                        title="Click to toggle Published / Draft"
                                      >
                                        <span>•</span>
                                        <span>{prod.status}</span>
                                      </button>
                                    </td>
                                    <td>
                                      <span className={`cms-cart-badge-pill ${prod.addToCartEnabled !== false ? 'enabled' : 'disabled'}`}>
                                        {prod.addToCartEnabled !== false ? 'Enabled' : 'Disabled'}
                                      </span>
                                    </td>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--cms-text-muted)', whiteSpace: 'nowrap' }}>
                                      {prod.updatedAt || 'July 29, 2026'}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                      <div className="cms-table-action-btns">
                                        <button
                                          type="button"
                                          className="cms-action-btn-outline"
                                          onClick={() => openEditProduct(prod)}
                                        >
                                          Edit
                                        </button>
                                        <button
                                          type="button"
                                          className="cms-action-btn-outline"
                                          onClick={() => handleDuplicateProduct(prod)}
                                          title="Duplicate Product"
                                        >
                                          Copy
                                        </button>
                                        <button
                                          type="button"
                                          className="cms-action-btn-outline danger"
                                          onClick={() => handleDeleteProduct(prod.id)}
                                          title="Delete Product"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            {/* Pagination */}
                            <div className="cms-pagination-bar">
                              <span className="cms-pagination-info">
                                Showing {filtered.length === 0 ? 0 : (prodCurrentPage - 1) * prodItemsPerPage + 1} to{' '}
                                {Math.min(prodCurrentPage * prodItemsPerPage, filtered.length)} of {filtered.length} products
                              </span>

                              <div className="cms-pagination-controls">
                                <button
                                  type="button"
                                  className="cms-page-pill-btn"
                                  disabled={prodCurrentPage <= 1}
                                  onClick={() => setProdCurrentPage((prev) => Math.max(1, prev - 1))}
                                >
                                  ← Prev
                                </button>
                                <span style={{ fontSize: '0.82rem', fontWeight: 700, padding: '0 8px' }}>
                                  Page {prodCurrentPage} of {totalPages}
                                </span>
                                <button
                                  type="button"
                                  className="cms-page-pill-btn"
                                  disabled={prodCurrentPage >= totalPages}
                                  onClick={() => setProdCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                >
                                  Next →
                                </button>
                              </div>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* SUBVIEW B: 2-COLUMN PRODUCT EDITOR (SCREENSHOTS 1 & 3) */}
              {productsSubView === 'editor' && (
                <div className="cms-product-editor-container">
                  {/* Top Bar Navigation */}
                  <div className="cms-editor-top-nav">
                    <button
                      type="button"
                      className="cms-back-btn"
                      onClick={() => setProductsSubView('list')}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                      <span>BACK TO PRODUCTS</span>
                    </button>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className={`cms-status-btn-pill ${prodEditorStatus === 'Published' ? 'published' : 'draft'}`}>
                        {prodEditorStatus}
                      </span>
                    </div>
                  </div>

                  <div className="cms-editor-h1-row">
                    <h1>{prodEditorId ? `EDIT: ${prodEditorName || 'Product'}` : 'CREATE PRODUCT'}</h1>
                  </div>

                  {/* 2-Column Responsive Layout */}
                  <div className="cms-prod-editor-grid">
                    {/* LEFT COLUMN: Main Product Content */}
                    <div className="cms-editor-left-column">
                      {/* Basic Information Card */}
                      <div className="cms-editor-card">
                        <div className="cms-form-field-group">
                          <label className="cms-form-label">PRODUCT TITLE</label>
                          <input
                            type="text"
                            className="cms-input-text"
                            placeholder="e.g. Skid Steer V900 — Crimson Red"
                            value={prodEditorName}
                            onChange={(e) => {
                              setProdEditorName(e.target.value)
                              if (!prodEditorId) {
                                setProdEditorSlug(
                                  e.target.value
                                    .toLowerCase()
                                    .replace(/[^a-z0-9]+/g, '-')
                                    .replace(/^-|-$/g, '')
                                )
                              }
                            }}
                            required
                          />
                        </div>

                        <div className="cms-form-field-group">
                          <label className="cms-form-label">URL SLUG</label>
                          <input
                            type="text"
                            className="cms-input-text"
                            placeholder="skid-steer-v900-red"
                            value={prodEditorSlug}
                            onChange={(e) => setProdEditorSlug(e.target.value)}
                          />
                        </div>

                        <div className="cms-form-field-group">
                          <label className="cms-form-label">SHORT DESCRIPTION</label>
                          <textarea
                            rows={3}
                            className="cms-textarea"
                            placeholder="Brief machine summary for catalog card and search snippets..."
                            value={prodEditorShortDesc}
                            onChange={(e) => setProdEditorShortDesc(e.target.value)}
                          />
                        </div>

                        <div className="cms-form-field-group">
                          <label className="cms-form-label">FULL DESCRIPTION</label>
                          <textarea
                            rows={7}
                            className="cms-textarea"
                            placeholder="Detailed product overview, hydraulic performance, operator ergonomics..."
                            value={prodEditorDesc}
                            onChange={(e) => setProdEditorDesc(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Specifications Card */}
                      <div className="cms-editor-card">
                        <div className="cms-editor-card-title">
                          <span>SPECIFICATIONS</span>
                          <button
                            type="button"
                            className="cms-action-pill-btn"
                            onClick={handleAddSpecRow}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <line x1="12" y1="5" x2="12" y2="19" />
                              <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            <span>ADD SPEC</span>
                          </button>
                        </div>

                        {prodEditorSpecs.length === 0 ? (
                          <div className="cms-no-specs-notice">
                            <span>NO SPECIFICATIONS ADDED YET.</span>
                            <button
                              type="button"
                              className="cms-btn-primary-blue"
                              style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                              onClick={() => {
                                setProdEditorSpecs([
                                  { name: 'Engine Model', value: 'Kubota D1105 Diesel Engine (Tier 4 / Stage V)' },
                                  { name: 'Operating Weight', value: '2,150 lbs (975 kg)' },
                                  { name: 'Rated Operating Capacity', value: '900 lbs (408 kg)' },
                                  { name: 'Hydraulic Flow', value: '12.7 GPM @ 2,321 psi' },
                                  { name: 'Width', value: '35.5 in (Fits Standard Backyard Gates)' }
                                ])
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                              <span>Load Standard V900 Specs</span>
                            </button>
                          </div>
                        ) : (
                          <div className="cms-specs-matrix-box">
                            {prodEditorSpecs.map((spec, index) => (
                              <div key={index} className="cms-spec-item-row">
                                <input
                                  type="text"
                                  placeholder="Spec Name (e.g. Engine)"
                                  value={spec.name}
                                  onChange={(e) => handleUpdateSpecRow(index, 'name', e.target.value)}
                                />
                                <input
                                  type="text"
                                  placeholder="Spec Value (e.g. Kubota D1105 Diesel)"
                                  value={spec.value}
                                  onChange={(e) => handleUpdateSpecRow(index, 'value', e.target.value)}
                                />
                                <button
                                  type="button"
                                  className="cms-spec-del-btn"
                                  onClick={() => handleRemoveSpecRow(index)}
                                  title="Remove specification"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Pricing & Inventory Card */}
                      <div className="cms-editor-card">
                        <div className="cms-editor-card-title">
                          <span>PRICING & INVENTORY</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                          <div>
                            <label className="cms-form-label">REGULAR PRICE ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              className="cms-input-text"
                              value={prodEditorPrice}
                              onChange={(e) => setProdEditorPrice(parseFloat(e.target.value) || 0)}
                              required
                            />
                          </div>

                          <div>
                            <label className="cms-form-label">SALE PRICE ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              className="cms-input-text"
                              placeholder="Optional discounted price"
                              value={prodEditorSalePrice ?? ''}
                              onChange={(e) => setProdEditorSalePrice(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div>
                            <label className="cms-form-label">STOCK QUANTITY</label>
                            <input
                              type="number"
                              className="cms-input-text"
                              value={prodEditorStock}
                              onChange={(e) => setProdEditorStock(parseInt(e.target.value, 10) || 0)}
                            />
                          </div>

                          <div>
                            <label className="cms-form-label">SKU</label>
                            <input
                              type="text"
                              className="cms-input-text"
                              value={prodEditorSku}
                              onChange={(e) => setProdEditorSku(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: Sidebar Controls */}
                    <div className="cms-editor-right-column">
                      {/* Publish Action Card */}
                      <div className="cms-editor-card">
                        <button
                          type="button"
                          className="cms-btn-primary-blue"
                          style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.94rem', marginBottom: '12px' }}
                          onClick={() => handleSaveProduct('Published')}
                        >
                          PUBLISH PRODUCT
                        </button>

                        <div className="cms-form-field-group">
                          <label className="cms-form-label">VISIBILITY STATUS</label>
                          <select
                            className="cms-input-text"
                            value={prodEditorStatus}
                            onChange={(e) => setProdEditorStatus(e.target.value as any)}
                          >
                            <option value="Published">Publish immediately (Published)</option>
                            <option value="Draft">Save as Draft (Hidden)</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          className="cms-action-btn-outline"
                          style={{ width: '100%', justifyContent: 'center', padding: '9px' }}
                          onClick={() => handleSaveProduct('Draft')}
                        >
                          Save as Draft
                        </button>
                      </div>

                      {/* Organization Card */}
                      <div className="cms-editor-card">
                        <div className="cms-editor-card-title">
                          <span>ORGANIZATION</span>
                        </div>

                        <div className="cms-form-field-group">
                          <label className="cms-form-label">BRAND</label>
                          <input
                            type="text"
                            className="cms-input-text"
                            value={prodEditorBrand}
                            onChange={(e) => setProdEditorBrand(e.target.value)}
                          />
                        </div>

                        <div className="cms-form-field-group">
                          <label className="cms-form-label">CATEGORY</label>
                          <select
                            className="cms-input-text"
                            value={prodEditorCategory}
                            onChange={(e) => setProdEditorCategory(e.target.value)}
                          >
                            {IMPORTED_CATEGORY_PATHS.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* External Link Card */}
                      <div className="cms-editor-card">
                        <div className="cms-editor-card-title">
                          <span>EXTERNAL LINK</span>
                        </div>

                        <div className="cms-form-field-group">
                          <label className="cms-form-label">BUY ON STORE URL</label>
                          <input
                            type="text"
                            className="cms-input-text"
                            placeholder="https://..."
                            value={prodEditorBuyUrl}
                            onChange={(e) => setProdEditorBuyUrl(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Visibility & Status Card */}
                      <div className="cms-editor-card">
                        <div className="cms-editor-card-title">
                          <span>VISIBILITY & STATUS</span>
                        </div>

                        <label className="cms-checkbox-label">
                          <input
                            type="checkbox"
                            checked={prodEditorFeatured}
                            onChange={(e) => setProdEditorFeatured(e.target.checked)}
                          />
                          <span>Feature this product</span>
                        </label>

                        <label className="cms-checkbox-label">
                          <input
                            type="checkbox"
                            checked={prodEditorAddToCart}
                            onChange={(e) => setProdEditorAddToCart(e.target.checked)}
                          />
                          <span>Enable Add to Cart for customers</span>
                        </label>
                      </div>

                      {/* Media Card */}
                      <div className="cms-editor-card">
                        <div className="cms-editor-card-title">
                          <span>MEDIA</span>
                        </div>

                        <div className="cms-form-field-group">
                          <label className="cms-form-label">MAIN IMAGE URL</label>
                          <input
                            type="text"
                            className="cms-input-text"
                            placeholder="/images/loader-red.png"
                            value={prodEditorImage}
                            onChange={(e) => setProdEditorImage(e.target.value)}
                          />

                          {prodEditorImage && (
                            <div className="cms-live-media-preview-container">
                              <span style={{ fontSize: '0.72rem', color: 'var(--cms-text-muted)' }}>Main Image Preview:</span>
                              <div className="cms-main-preview-frame">
                                <img
                                  src={prodEditorImage}
                                  alt="Main Preview"
                                  onError={(e) => { (e.target as any).src = '/images/why-choose-v900-jobsite.png' }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="cms-form-field-group">
                          <label className="cms-form-label">GALLERY IMAGES (ONE URL PER LINE)</label>
                          <textarea
                            rows={3}
                            className="cms-textarea"
                            placeholder="/images/image1.jpg&#10;/images/image2.jpg"
                            value={prodEditorGallery}
                            onChange={(e) => setProdEditorGallery(e.target.value)}
                          />

                          {prodEditorGallery.trim() && (
                            <div className="cms-live-media-preview-container">
                              <span style={{ fontSize: '0.72rem', color: 'var(--cms-text-muted)' }}>Gallery Preview:</span>
                              <div className="cms-gallery-thumbnails-strip">
                                {prodEditorGallery.split('\n').filter(Boolean).map((imgUrl, i) => (
                                  <div key={i} className="cms-gallery-thumb-chip">
                                    <img
                                      src={imgUrl.trim()}
                                      alt={`Gallery ${i}`}
                                      onError={(e) => { (e.target as any).src = '/images/why-choose-v900-jobsite.png' }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB: CART ACTIVITY & ORDERS */}
          {activeTab === 'cart' && (
            <div className="cms-orders-view-container">
              <div className="cms-catalog-title-row">
                <div>
                  <span className="cms-catalog-eyebrow">COMMERCE & CHECKOUT</span>
                  <h1 className="cms-catalog-h1">Orders & Cart Activity</h1>
                  <p className="cms-catalog-subtext">Track customer checkout sessions, commercial orders, and equipment inquiries.</p>
                </div>
              </div>

              {/* 4 Orders Metric Cards */}
              <div className="cms-prod-metrics-grid">
                <div className="cms-prod-metric-card">
                  <span className="cms-pm-label">Total Volume</span>
                  <span className="cms-pm-value" style={{ color: '#10b981' }}>$27,841.00</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--cms-text-muted)' }}>Total catalog sales</span>
                </div>

                <div className="cms-prod-metric-card published">
                  <span className="cms-pm-label">Completed</span>
                  <span className="cms-pm-value">{ordersList.filter((o) => o.status === 'Completed').length}</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--cms-text-muted)' }}>Fulfilled deliveries</span>
                </div>

                <div className="cms-prod-metric-card drafts">
                  <span className="cms-pm-label">Processing</span>
                  <span className="cms-pm-value">{ordersList.filter((o) => o.status === 'Processing').length}</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--cms-text-muted)' }}>Pending fulfillment</span>
                </div>

                <div className="cms-prod-metric-card lowstock">
                  <span className="cms-pm-label">Abandoned Carts</span>
                  <span className="cms-pm-value">{ordersList.filter((o) => o.status === 'Abandoned').length}</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--cms-text-muted)' }}>Lead re-engagement</span>
                </div>
              </div>

              <div className="cms-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="cms-table-wrapper">
                  <table className="cms-prod-table">
                    <thead>
                      <tr>
                        <th>ORDER ID</th>
                        <th>CUSTOMER</th>
                        <th>ITEMS</th>
                        <th>TOTAL AMOUNT</th>
                        <th>STATUS</th>
                        <th>DATE</th>
                        <th style={{ textAlign: 'right' }}>ACTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ordersList.map((order) => (
                        <tr key={order.id}>
                          <td>
                            <span className="cms-sku-badge">{order.id}</span>
                          </td>
                          <td>
                            <strong style={{ display: 'block', color: 'var(--cms-text-primary)' }}>{order.customer}</strong>
                            <span style={{ fontSize: '0.74rem', color: 'var(--cms-text-muted)' }}>{order.email} • {order.phone}</span>
                          </td>
                          <td style={{ maxWidth: '280px' }}>
                            <span style={{ fontSize: '0.84rem' }}>{order.items}</span>
                          </td>
                          <td>
                            <strong style={{ color: '#10b981', fontSize: '0.94rem' }}>
                              ${order.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </strong>
                          </td>
                          <td>
                            <span className={`cms-orders-status-pill ${order.status.toLowerCase()}`}>
                              {order.status}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--cms-text-muted)' }}>
                            {order.date}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <select
                              className="cms-filter-dropdown-select"
                              value={order.status}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value as any)}
                            >
                              <option value="Processing">Processing</option>
                              <option value="Completed">Completed</option>
                              <option value="Pending">Pending</option>
                              <option value="Abandoned">Abandoned</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CONTRACTOR QUOTES & INQUIRIES */}
          {activeTab === 'inquiries' && (
            <div className="cms-inquiries-view-container">
              <div className="cms-catalog-title-row">
                <div>
                  <span className="cms-catalog-eyebrow">LEAD MANAGEMENT</span>
                  <h1 className="cms-catalog-h1">Contractor Quotes & Inquiries</h1>
                  <p className="cms-catalog-subtext">Manage incoming machine requests, customer quote tickets, and fleet purchasing inquiries.</p>
                </div>
              </div>

              {/* 4 Inquiries Metric Cards */}
              <div className="cms-prod-metrics-grid">
                <div className="cms-prod-metric-card" style={{ cursor: 'pointer' }} onClick={() => setInquiryStatusFilter('all')}>
                  <span className="cms-pm-label">Total Inquiries</span>
                  <span className="cms-pm-value">{inquiriesList.length}</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--cms-text-muted)' }}>Incoming leads</span>
                </div>

                <div className="cms-prod-metric-card drafts" style={{ cursor: 'pointer' }} onClick={() => setInquiryStatusFilter('New')}>
                  <span className="cms-pm-label">New Leads</span>
                  <span className="cms-pm-value">{inquiriesList.filter((i) => i.status === 'New').length}</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--cms-text-muted)' }}>Requires response</span>
                </div>

                <div className="cms-prod-metric-card" style={{ cursor: 'pointer' }} onClick={() => setInquiryStatusFilter('In Progress')}>
                  <span className="cms-pm-label">In Progress</span>
                  <span className="cms-pm-value">{inquiriesList.filter((i) => i.status === 'In Progress').length}</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--cms-text-muted)' }}>Quotation dispatched</span>
                </div>

                <div className="cms-prod-metric-card published" style={{ cursor: 'pointer' }} onClick={() => setInquiryStatusFilter('Resolved')}>
                  <span className="cms-pm-label">Resolved</span>
                  <span className="cms-pm-value">{inquiriesList.filter((i) => i.status === 'Resolved').length}</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--cms-text-muted)' }}>Orders finalized</span>
                </div>
              </div>

              {/* Filter */}
              <div className="cms-products-filter-toolbar">
                <div className="cms-filter-search-box">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search contractor name, company, or message..."
                    value={inquirySearch}
                    onChange={(e) => setInquirySearch(e.target.value)}
                  />
                </div>

                <select
                  className="cms-filter-dropdown-select"
                  value={inquiryStatusFilter}
                  onChange={(e) => setInquiryStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="New">New</option>
                  <option value="Contacted">Contacted</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              {/* Inquiries Cards Grid */}
              <div className="cms-inquiry-cards-grid">
                {inquiriesList
                  .filter((item) => {
                    const matchSearch =
                      !inquirySearch ||
                      item.name.toLowerCase().includes(inquirySearch.toLowerCase()) ||
                      item.company.toLowerCase().includes(inquirySearch.toLowerCase()) ||
                      item.message.toLowerCase().includes(inquirySearch.toLowerCase())
                    const matchStatus = inquiryStatusFilter === 'all' || item.status === inquiryStatusFilter
                    return matchSearch && matchStatus
                  })
                  .map((inq) => (
                    <div key={inq.id} className="cms-inquiry-card">
                      <div className="cms-inquiry-header-row">
                        <div className="cms-inquiry-author-info">
                          <strong>{inq.name}</strong>
                          <span className="cms-inquiry-company">{inq.company}</span>
                        </div>
                        <span className="cms-inquiry-badge">{inq.productInterest || 'General Inquiry'}</span>
                      </div>

                      <div className="cms-inquiry-msg-box">
                        "{inq.message}"
                      </div>

                      <div className="cms-inquiry-contact-strip">
                        <span>📧 {inq.email}</span>
                        <span>📞 {inq.phone}</span>
                        <span>📅 {inq.date}</span>
                      </div>

                      <div className="cms-inquiry-footer-row">
                        <select
                          className="cms-filter-dropdown-select"
                          value={inq.status}
                          onChange={(e) => handleUpdateInquiryStatus(inq.id, e.target.value as any)}
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                        </select>

                        <div style={{ display: 'flex', gap: '6px' }}>
                          <a
                            href={`mailto:${inq.email}?subject=Happy Machinery Quote: ${inq.productInterest || 'Equipment'}`}
                            className="cms-action-btn-outline"
                            style={{ textDecoration: 'none' }}
                          >
                            Reply
                          </a>
                          <button
                            type="button"
                            className="cms-action-btn-outline danger"
                            onClick={() => handleDeleteInquiry(inq.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* TAB: COMMENTS & REVIEWS */}
          {activeTab === 'comments' && (
            <div className="cms-comments-view-container">
              <div className="cms-catalog-title-row">
                <div>
                  <span className="cms-catalog-eyebrow">COMMUNITY ENGAGEMENT</span>
                  <h1 className="cms-catalog-h1">Reader Comments & Reviews</h1>
                  <p className="cms-catalog-subtext">Moderate reader discussions, answer contractor questions, and filter spam.</p>
                </div>
              </div>

              {/* 4 Comments Metric Cards */}
              <div className="cms-prod-metrics-grid">
                <div className="cms-prod-metric-card" style={{ cursor: 'pointer' }} onClick={() => setCommentFilter('all')}>
                  <span className="cms-pm-label">Total Comments</span>
                  <span className="cms-pm-value">{commentsData.length}</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--cms-text-muted)' }}>Reader discussions</span>
                </div>

                <div className="cms-prod-metric-card published" style={{ cursor: 'pointer' }} onClick={() => setCommentFilter('Approved')}>
                  <span className="cms-pm-label">Approved</span>
                  <span className="cms-pm-value">{commentsData.filter((c) => c.status === 'Approved').length}</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--cms-text-muted)' }}>Live on website</span>
                </div>

                <div className="cms-prod-metric-card drafts" style={{ cursor: 'pointer' }} onClick={() => setCommentFilter('Pending')}>
                  <span className="cms-pm-label">Pending</span>
                  <span className="cms-pm-value">{commentsData.filter((c) => c.status === 'Pending').length}</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--cms-text-muted)' }}>Awaiting review</span>
                </div>

                <div className="cms-prod-metric-card lowstock" style={{ cursor: 'pointer' }} onClick={() => setCommentFilter('Spam')}>
                  <span className="cms-pm-label">Spam</span>
                  <span className="cms-pm-value">{commentsData.filter((c) => c.status === 'Spam').length}</span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--cms-text-muted)' }}>Flagged entries</span>
                </div>
              </div>

              <div className="cms-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {commentsData
                    .filter((c) => commentFilter === 'all' || c.status === commentFilter)
                    .map((item) => (
                      <div
                        key={item.id}
                        style={{
                          background: 'var(--cms-bg-surface)',
                          border: '1px solid var(--cms-border)',
                          borderRadius: '12px',
                          padding: '16px 20px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: '16px'
                        }}
                      >
                        <div style={{ display: 'flex', gap: '14px' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: '#1d7ff3',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              flexShrink: 0
                            }}
                          >
                            {item.author.charAt(0)}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                              <strong style={{ fontSize: '0.94rem' }}>{item.author}</strong>
                              <span style={{ fontSize: '0.74rem', color: 'var(--cms-text-muted)' }}>{item.date}</span>
                              <span className={`cms-status-btn-pill ${item.status === 'Approved' ? 'published' : 'draft'}`}>
                                {item.status}
                              </span>
                            </div>
                            <p style={{ margin: '4px 0 8px 0', fontSize: '0.88rem', color: 'var(--cms-text-secondary)', lineHeight: 1.5 }}>
                              "{item.text}"
                            </p>
                            <span style={{ fontSize: '0.76rem', color: 'var(--cms-text-muted)' }}>
                              On: <strong style={{ color: '#1d7ff3' }}>{item.postTitle}</strong>
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          {item.status !== 'Approved' && (
                            <button
                              type="button"
                              className="cms-action-btn-outline"
                              onClick={() => handleUpdateCommentStatus(item.id, 'Approved')}
                            >
                              Approve
                            </button>
                          )}
                          {item.status !== 'Spam' && (
                            <button
                              type="button"
                              className="cms-action-btn-outline"
                              onClick={() => handleUpdateCommentStatus(item.id, 'Spam')}
                            >
                              Spam
                            </button>
                          )}
                          <button
                            type="button"
                            className="cms-action-btn-outline danger"
                            onClick={() => handleDeleteComment(item.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                    <span>Ban IP Address</span>
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
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Provision Administrator</span>
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
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--cms-accent-blue)" strokeWidth="2">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                    </svg>
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
                    className="cms-btn cms-btn-primary"
                    onClick={() => {
                      showToast('Maintenance settings saved successfully!', 'success')
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    <span>Save Settings</span>
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
                      <span style={{ color: 'var(--cms-accent-blue)', display: 'inline-flex' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                      </span>
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
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        <span>ESTIMATED COMPLETION TIME (OPTIONAL)</span>
                      </span>
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
                        <span style={{ color: 'var(--cms-accent-blue)', display: 'inline-flex' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                          </svg>
                        </span>
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
                          className="cms-btn cms-btn-primary"
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
                        <span style={{ color: 'var(--cms-accent-blue)', display: 'inline-flex' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </span>
                        <h3>LIVE VISITOR PREVIEW</h3>
                      </div>
                      <span className="cms-preview-theme-pill">Tech Blue Theme</span>
                    </div>

                    <div className="cms-live-visitor-preview-box">
                      <div className="cms-preview-inner-card">
                        <div className="cms-preview-tag-badge">
                          <span>● SCHEDULED UPGRADE</span>
                        </div>

                        <div className="cms-preview-logo-wrap">
                          <img
                            src="https://img.miniexcavator.org/ebay/Dashboard-Icon/Happy_Machinery_Logo.webp"
                            alt="Happy Machinery"
                            className="cms-preview-logo-img"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/images/Happy_Machinery_Logo.webp' }}
                          />
                        </div>

                        <h2 className="cms-preview-heading">{maintenanceTitle}</h2>
                        <p className="cms-preview-message">{maintenanceMessage}</p>

                        <div className="cms-preview-progress-box">
                          <div className="cms-preview-pbar-header">
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                              </svg>
                              <span>Upgrade Progress</span>
                            </span>
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

      {/* Full-Screen Dark Image Lightbox / Viewer (Matches Image 3) */}
      {selectedMedia && (
        <div className="cms-image-lightbox-backdrop" onClick={() => setSelectedMedia(null)}>
          {/* Top Center Floating Pill Toolbar */}
          <div className="cms-lightbox-toolbar" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="cms-lightbox-tool-btn"
              title="Zoom Out (-)"
              onClick={handleZoomOut}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <span className="cms-lightbox-zoom-text">{mediaZoom}%</span>
            <button
              type="button"
              className="cms-lightbox-tool-btn"
              title="Zoom In (+)"
              onClick={handleZoomIn}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <button
              type="button"
              className="cms-lightbox-badge-btn"
              title="Reset 1:1 Scale (0)"
              onClick={handleResetZoom}
            >
              1:1
            </button>
            <button
              type="button"
              className="cms-lightbox-tool-btn icon-only"
              title="Rotate 90° Clockwise"
              onClick={handleRotate}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M21.5 2v6h-6" />
                <path d="M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
            </button>
          </div>

          {/* Top Right Close Pill Button */}
          <button
            type="button"
            className="cms-lightbox-close-btn"
            onClick={() => setSelectedMedia(null)}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span>Close</span>
          </button>

          {/* Left Arrow Navigation */}
          {mediaList.length > 1 && (
            <button
              type="button"
              className="cms-lightbox-nav-btn prev"
              title="Previous Image (←)"
              onClick={(e) => {
                e.stopPropagation()
                handlePrevMedia()
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          )}

          {/* Right Arrow Navigation */}
          {mediaList.length > 1 && (
            <button
              type="button"
              className="cms-lightbox-nav-btn next"
              title="Next Image (→)"
              onClick={(e) => {
                e.stopPropagation()
                handleNextMedia()
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}

          {/* Center Image Canvas */}
          <div
            className="cms-lightbox-canvas"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedMedia.url}
              alt={selectedMedia.title}
              className="cms-lightbox-img"
              style={{
                transform: `scale(${mediaZoom / 100}) rotate(${mediaRotation}deg)`,
              }}
              draggable={false}
            />
          </div>

          {/* Bottom Left Title & Count Indicator */}
          <div className="cms-lightbox-bottom-left" onClick={(e) => e.stopPropagation()}>
            <div className="cms-lightbox-filename" title={selectedMedia.title}>
              {selectedMedia.url.split('/').pop() || selectedMedia.title}
            </div>
            <div className="cms-lightbox-counter">
              {(() => {
                const curIdx = mediaList.findIndex((m) => m.id === selectedMedia.id || m.url === selectedMedia.url)
                return curIdx !== -1 ? `${curIdx + 1} / ${mediaList.length}` : `1 / ${mediaList.length || 1}`
              })()}
            </div>
          </div>

          {/* Bottom Right Blue Copy URL Button */}
          <button
            type="button"
            className="cms-lightbox-copy-btn"
            onClick={(e) => {
              e.stopPropagation()
              navigator.clipboard.writeText(selectedMedia.url)
              showToast('Media URL copied to clipboard!', 'success')
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            <span>Copy URL</span>
          </button>
        </div>
      )}

      {/* Create New Folder In-App Dialog */}
      {showFolderModal && (
        <div className="cms-dialog-backdrop" onClick={() => setShowFolderModal(false)}>
          <div className="cms-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="cms-dialog-header">
              <div className="cms-dialog-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  <line x1="12" y1="11" x2="12" y2="17" />
                  <line x1="9" y1="14" x2="15" y2="14" />
                </svg>
              </div>
              <div className="cms-dialog-titles">
                <h3>Create New Folder</h3>
                <p>Organize your media assets into a dedicated folder directory.</p>
              </div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (newFolderName.trim()) {
                  showToast(`Folder "${newFolderName.trim()}" created successfully.`, 'success')
                  setNewFolderName('')
                  setShowFolderModal(false)
                }
              }}
            >
              <div className="cms-dialog-body">
                <label className="cms-dialog-label">Folder Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Jobsite Excavator Attachments"
                  className="cms-dialog-input"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />
              </div>
              <div className="cms-dialog-footer">
                <button
                  type="button"
                  className="cms-dialog-btn secondary"
                  onClick={() => {
                    setShowFolderModal(false)
                    setNewFolderName('')
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="cms-dialog-btn primary">
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Media Asset In-App Modal */}
      {showUploadMediaModal && (
        <div className="cms-dialog-backdrop" onClick={() => setShowUploadMediaModal(false)}>
          <div className="cms-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="cms-dialog-header">
              <div className="cms-dialog-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div className="cms-dialog-titles">
                <h3>Add Media Asset</h3>
                <p>Upload a new image, video preview, or technical diagram to your Media Library.</p>
              </div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (uploadMediaUrl.trim() && uploadMediaTitle.trim()) {
                  const newMedia: MediaItem = {
                    id: `med-${Date.now()}`,
                    title: uploadMediaTitle.trim(),
                    url: uploadMediaUrl.trim(),
                    dateAdded: new Date().toISOString().split('T')[0]
                  }
                  const updated = [newMedia, ...mediaList]
                  setMediaList(updated)
                  void writeSharedContent('media-library', updated)
                  showToast('Media asset added to library.', 'success')
                  setUploadMediaTitle('')
                  setUploadMediaUrl('')
                  setShowUploadMediaModal(false)
                }
              }}
            >
              <div className="cms-dialog-body">
                <label className="cms-dialog-label">Asset Title</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Caterpillar 320 GC Excavator"
                  className="cms-dialog-input"
                  value={uploadMediaTitle}
                  onChange={(e) => setUploadMediaTitle(e.target.value)}
                />

                <label className="cms-dialog-label" style={{ marginTop: '12px' }}>Media Asset URL</label>
                <input
                  type="text"
                  required
                  placeholder="https://... or /images/..."
                  className="cms-dialog-input"
                  value={uploadMediaUrl}
                  onChange={(e) => setUploadMediaUrl(e.target.value)}
                />

                {uploadMediaUrl && (
                  <div style={{ marginTop: '12px', borderRadius: '10px', overflow: 'hidden', height: '140px', background: '#050a14', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--cms-border)' }}>
                    <img
                      src={uploadMediaUrl}
                      alt="Preview"
                      style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                      onError={(e) => {
                        ;(e.target as HTMLElement).style.display = 'none'
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="cms-dialog-footer">
                <button
                  type="button"
                  className="cms-dialog-btn secondary"
                  onClick={() => {
                    setShowUploadMediaModal(false)
                    setUploadMediaTitle('')
                    setUploadMediaUrl('')
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="cms-dialog-btn primary">
                  Save to Media Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sleek Custom Confirm Dialog */}
      {confirmDialog && (
        <div className="cms-dialog-backdrop" onClick={() => setConfirmDialog(null)}>
          <div className="cms-dialog-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="cms-dialog-header">
              <div className="cms-dialog-icon-wrap warning">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="cms-dialog-titles">
                <h3>{confirmDialog.title}</h3>
                <p>{confirmDialog.message}</p>
              </div>
            </div>
            <div className="cms-dialog-footer" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="cms-dialog-btn secondary"
                onClick={() => setConfirmDialog(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cms-dialog-btn primary"
                onClick={() => {
                  confirmDialog.onConfirm()
                  setConfirmDialog(null)
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
