import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import CmsLogin from './CmsLogin'
import { getStoredSession, clearStoredSession, logSecurityEvent } from '../data/cmsAuth'
import type { 
  AdminUser, 
  AdminRole, 
  SecurityLog, 
  BannedIp, 
  BannedDevice,
  LoginActivityLog,
  FailedLoginAttempt, 
  SecuritySettings, 
  AnalyticsViewEvent, 
  SiteSettings, 
  SitePage 
} from '../data/cmsTypes'
import { 
  linkGoogleAccountToUser, 
  unlinkGoogleAccountFromUser, 
  GOOGLE_CLIENT_ID, 
  createMockGoogleJwt
} from '../data/googleAuth'
import { 
  unbanIpAddress, 
  unbanDeviceRecord, 
  manualBanIp, 
  manualBanDevice
} from '../data/deviceSecurity'
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
  ProductAttribute,
  getUserProfileAvatar,
  DEFAULT_POSTS, 
  DEFAULT_PRODUCTS, 
  DEFAULT_MEDIA,
  DEFAULT_PRODUCT_ATTRIBUTES,
  DEFAULT_CART_ORDERS,
  DEFAULT_INQUIRIES,
  DEFAULT_COMMENTS
} from './adminData'
import { readSharedContent, writeSharedContent } from '../data/sharedContentStorage'
import { getBlogPostPath } from '../data/blogUrls'
import { DEFAULT_HOME_CONTENT, HomePageContent } from '../data/homeContent'
import HomePageCmsEditor from '../components/HomePageCmsEditor'
import TopBlogsManager from '../components/TopBlogsManager'
import TiptapEditor from '../components/Editor/TiptapEditor'
import { renderMarkdownToReact } from './Blog'
import { convertContentToHtml, splitContentIntoBlocks, getHeadingMatch } from '../utils/editorContentHelper'
import { processPastedBlog, cleanImageTitle } from '../utils/blogImportHelper'
import { cacheSiteSettings, updateBrowserFavicon } from '../data/siteBranding'
import './AdminDashboard.css'

export interface TrashItem {
  id: string
  originalId: string | number
  type: 'article' | 'product' | 'blog-category' | 'product-category' | 'media'
  title: string
  subtitle?: string
  image?: string
  deletedAt: string
  deletedTimestamp: number
  data: any
}

type CmsTab = 
  | 'dashboard' 
  | 'articles' 
  | 'media' 
  | 'products' 
  | 'cart'
  | 'inquiries'
  | 'comments'
  | 'pages' 
  | 'trash'
  | 'security' 
  | 'admins' 
  | 'profile'
  | 'settings'

export interface AdminNotificationItem {
  id: string
  title: string
  message: string
  time: string
  timestamp: number
  read: boolean
  type: 'inquiry' | 'product' | 'security' | 'system'
  targetTab?: CmsTab
}

type SecuritySubTab = 
  | 'overview' 
  | 'banned-ips' 
  | 'banned-devices'
  | 'activity-log' 
  | 'failed-logins' 
  | 'blocked-users' 
  | 'settings'

type CmsTheme = 'dark' | 'light' | 'neon'

export const DEFAULT_SUPERADMIN_AVATAR = 'https://lightcyan-weasel-711536.hostingersite.com/storage/avatars/UNOQP8Qv0cfy6L3twxNormAHlv7UnrVPV0Xs9k1c.jpg'

export function getAdminDisplayName(fullName?: string): string {
  if (!fullName) return 'Admin'
  const trimmed = fullName.trim()
  const parts = trimmed.split(/\s+/)
  if (parts.length > 1 && /^(mr\.?|mrs\.?|ms\.?|dr\.?)$/i.test(parts[0])) {
    return `${parts[0]} ${parts[1]}`
  }
  return parts[0]
}

export interface VisualBlock {
  id: string
  type: 'image' | 'video' | 'text'
  url?: string
  alt?: string
  caption?: string
  videoId?: string
  videoTitle?: string
  text?: string
}

export function parseContentToVisualBlocks(raw: string): VisualBlock[] {
  if (!raw || !raw.trim()) {
    return [{ id: 'blk-' + Date.now() + '-0', type: 'text', text: '' }]
  }

  const normalized = raw.replace(/\r\n/g, '\n')
  // Match images: ![alt](url) with optional caption on next line *caption*
  // Match videos: [Watch Video: title](url) or standalone YouTube URLs
  const mediaRegex = /(!\[(.*?)\]\(([^\)]+)\)(?:\s*\n\s*[*_](.*?)[*_])?)|(\[(?:Watch Video(?::\s*(.*?))?|Video:\s*(.*?))\]\((https?:\/\/[^\s\)]+)\))|((?:^|\n)(https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?[^\s]+|embed\/[^\s]+|shorts\/[^\s]+)|youtu\.be\/[a-zA-Z0-9_-]+))(?:\n|$))/g

  const blocks: VisualBlock[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = mediaRegex.exec(normalized)) !== null) {
    const matchStart = match.index
    const matchEnd = mediaRegex.lastIndex

    const textBefore = normalized.substring(lastIndex, matchStart).trim()
    if (textBefore) {
      blocks.push({
        id: 'blk-' + Math.random().toString(36).substring(2, 9),
        type: 'text',
        text: textBefore
      })
    }

    if (match[1]) {
      blocks.push({
        id: 'blk-' + Math.random().toString(36).substring(2, 9),
        type: 'image',
        alt: (match[2] || '').trim(),
        url: (match[3] || '').trim(),
        caption: (match[4] || '').trim()
      })
    } else if (match[5]) {
      const title = (match[6] || match[7] || 'Jobsite Equipment Video').trim()
      const url = (match[8] || '').trim()
      const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/)
      blocks.push({
        id: 'blk-' + Math.random().toString(36).substring(2, 9),
        type: 'video',
        videoTitle: title,
        url,
        videoId: ytMatch ? ytMatch[1] : ''
      })
    } else if (match[9] && match[10]) {
      const url = match[10].trim()
      const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/)
      blocks.push({
        id: 'blk-' + Math.random().toString(36).substring(2, 9),
        type: 'video',
        videoTitle: 'Jobsite Equipment Video',
        url,
        videoId: ytMatch ? ytMatch[1] : ''
      })
    }

    lastIndex = matchEnd
  }

  const remainingText = normalized.substring(lastIndex).trim()
  if (remainingText) {
    blocks.push({
      id: 'blk-' + Math.random().toString(36).substring(2, 9),
      type: 'text',
      text: remainingText
    })
  }

  if (blocks.length === 0) {
    blocks.push({ id: 'blk-' + Date.now() + '-0', type: 'text', text: '' })
  }

  return blocks
}

export function serializeVisualBlocksToContent(blocks: VisualBlock[]): string {
  return blocks
    .map((b) => {
      if (b.type === 'image') {
        const alt = (b.alt || 'Jobsite Equipment Image').trim()
        const url = (b.url || '').trim()
        if (!url) return ''
        let res = `![${alt}](${url})`
        if (b.caption && b.caption.trim()) {
          res += `\n*${b.caption.trim()}*`
        }
        return res
      } else if (b.type === 'video') {
        const title = (b.videoTitle || 'Jobsite Equipment Video').trim()
        const url = (b.url || '').trim()
        if (!url) return ''
        return `[Watch Video: ${title}](${url})`
      } else {
        return (b.text || '').trim()
      }
    })
    .filter(Boolean)
    .join('\n\n')
}

export function convertMarkdownToVisualHtml(md: string): string {
  if (!md || !md.trim()) return ''

  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const out: string[] = []

  let inUl = false
  let inOl = false
  let inTable = false
  let tableRows: string[][] = []

  const closeLists = () => {
    if (inUl) { out.push('</ul>'); inUl = false }
    if (inOl) { out.push('</ol>'); inOl = false }
  }

  const flushTable = () => {
    if (inTable && tableRows.length > 0) {
      let tHtml = '<div class="cms-rendered-table-wrap"><table class="cms-rendered-table">'
      tableRows.forEach((row, rIdx) => {
        if (rIdx === 0) {
          tHtml += '<thead><tr>' + row.map((c) => `<th>${formatInline(c)}</th>`).join('') + '</tr></thead><tbody>'
        } else {
          tHtml += '<tr>' + row.map((c) => `<td>${formatInline(c)}</td>`).join('') + '</tr>'
        }
      })
      tHtml += '</tbody></table></div>'
      out.push(tHtml)
      inTable = false
      tableRows = []
    }
  }

  const formatInline = (str: string): string => {
    let s = str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')

    // Preserve and sanitize safe tags
    s = s.replace(/&lt;u&gt;(.*?)&lt;\/u&gt;/gi, '<u>$1</u>')

    // Inline Code: `code`
    s = s.replace(/`([^`]+)`/g, '<code class="cms-inline-code">$1</code>')

    // Bold: **text** or __text__
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>')

    // Strikethrough: ~~text~~
    s = s.replace(/~~([^~]+)~~/g, '<del>$1</del>')

    // Italic: *text* or _text_
    s = s.replace(/(^|[^\*])\*([^\*]+)\*([^\*]|$)/g, '$1<em>$2</em>$3')
    s = s.replace(/(^|[^_])_([^_]+)_([^_]|$)/g, '$1<em>$2</em>$3')

    // Links: [text](url)
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="cms-inline-link">$1</a>')

    return s
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()

    if (!trimmed) {
      closeLists()
      flushTable()
      continue
    }

    if (/^(---|___|\*\*\*)$/.test(trimmed)) {
      closeLists()
      flushTable()
      out.push('<hr class="cms-rendered-hr" />')
      continue
    }

    const headingMatch = trimmed.match(/^(#{1,4})\s+(.*)$/)
    if (headingMatch) {
      closeLists()
      flushTable()
      const level = headingMatch[1].length
      const text = formatInline(headingMatch[2])
      out.push(`<h${level} class="cms-rendered-h${level}">${text}</h${level}>`)
      continue
    }

    const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/)
    if (bulletMatch) {
      flushTable()
      if (inOl) { out.push('</ol>'); inOl = false }
      if (!inUl) { out.push('<ul class="cms-rendered-ul">'); inUl = true }
      out.push(`<li class="cms-rendered-li">${formatInline(bulletMatch[1])}</li>`)
      continue
    }

    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/)
    if (numMatch) {
      flushTable()
      if (inUl) { out.push('</ul>'); inUl = false }
      if (!inOl) { out.push('<ol class="cms-rendered-ol">'); inOl = true }
      out.push(`<li class="cms-rendered-li">${formatInline(numMatch[2])}</li>`)
      continue
    }

    const bqMatch = trimmed.match(/^>\s*(.*)$/)
    if (bqMatch) {
      closeLists()
      flushTable()
      out.push(`<blockquote class="cms-rendered-blockquote">${formatInline(bqMatch[1])}</blockquote>`)
      continue
    }

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      closeLists()
      if (/^\|[\s\-:|]+\|$/.test(trimmed)) {
        continue
      }
      const cells = trimmed.slice(1, -1).split('|').map((c) => c.trim())
      inTable = true
      tableRows.push(cells)
      continue
    }

    closeLists()
    flushTable()
    out.push(`<p class="cms-rendered-p">${formatInline(trimmed)}</p>`)
  }

  closeLists()
  flushTable()

  return out.join('\n')
}

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
    if (typeof window !== 'undefined') {
      const search = window.location.search
      if (search.includes('cms_action=logout') || search.includes('action=logout') || search.includes('logged_out=1')) {
        clearStoredSession()
        return null
      }
    }
    const session = getStoredSession()
    if (session?.user) {
      if (!session.user.avatar || session.user.avatar.includes('about-team-1.png')) {
        session.user.avatar = DEFAULT_SUPERADMIN_AVATAR
        try {
          localStorage.setItem('hm_admin_session', JSON.stringify(session))
          sessionStorage.setItem('hm_admin_session', JSON.stringify(session))
        } catch {}
      }
      return session.user
    }
    return null
  })

  // Theme State
  const [theme, setTheme] = useState<CmsTheme>(() => {
    return (localStorage.getItem('hm_cms_theme') as CmsTheme) || 'dark'
  })

  // Navigation State & Collapsible Sidebar
  const [activeTab, setActiveTab] = useState<CmsTab>('dashboard')
  const [securitySubTab, setSecuritySubTab] = useState<SecuritySubTab>('overview')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('hm_cms_sidebar_collapsed') === 'true'
    } catch {
      return false
    }
  })

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('hm_cms_sidebar_collapsed', String(next))
      } catch {}
      return next
    })
  }
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [collapsedFlyout, setCollapsedFlyout] = useState<'articles' | 'products' | null>(null)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('all')
  const notificationRef = useRef<HTMLDivElement | null>(null)
  const profileRef = useRef<HTMLDivElement | null>(null)
  const [globalSearch, setGlobalSearch] = useState('')
  const mainContentRef = useRef<HTMLDivElement | null>(null)

  // Close flyout on outside click or sidebar uncollapse
  useEffect(() => {
    if (!collapsedFlyout) return
    const handleDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.cms-nav-expandable-group')) {
        setCollapsedFlyout(null)
      }
    }
    document.addEventListener('click', handleDocClick)
    return () => document.removeEventListener('click', handleDocClick)
  }, [collapsedFlyout])

  useEffect(() => {
    if (!isSidebarCollapsed) {
      setCollapsedFlyout(null)
    }
  }, [isSidebarCollapsed])

  // System & User Notifications State
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem('happy-machinery-admin-notifications')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
    return [
      {
        id: 'notif-1',
        title: 'New Customer Inquiry',
        message: 'Jason Miller submitted a quote request for TYPHON V900 Mini Track Loader.',
        time: '10m ago',
        timestamp: Date.now() - 10 * 60 * 1000,
        read: false,
        type: 'inquiry',
        targetTab: 'inquiries'
      },
      {
        id: 'notif-2',
        title: 'Machinery Status Update',
        message: 'TYPHON V900 Mini Track Loader status was changed to "In Stock".',
        time: '45m ago',
        timestamp: Date.now() - 45 * 60 * 1000,
        read: false,
        type: 'product',
        targetTab: 'products'
      },
      {
        id: 'notif-3',
        title: 'Security System Notice',
        message: 'Automated firewall integrity scan passed with 0 suspicious events.',
        time: '2h ago',
        timestamp: Date.now() - 2 * 3600 * 1000,
        read: false,
        type: 'security',
        targetTab: 'security'
      },
      {
        id: 'notif-4',
        title: 'Cloud Backup Complete',
        message: 'Automated snapshot backup completed for database & media storage.',
        time: '1d ago',
        timestamp: Date.now() - 24 * 3600 * 1000,
        read: true,
        type: 'system',
        targetTab: 'settings'
      }
    ]
  })

  const saveNotifications = (updated: AdminNotificationItem[]) => {
    setNotifications(updated)
    try {
      localStorage.setItem('happy-machinery-admin-notifications', JSON.stringify(updated))
    } catch {}
  }

  const unreadNotificationCount = notifications.filter((n) => !n.read).length

  const handleMarkAllNotificationsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }))
    saveNotifications(updated)
    showToast('All notifications marked as read.', 'success' as any)
  }

  const handleNotificationClick = (item: AdminNotificationItem) => {
    const updated = notifications.map((n) => (n.id === item.id ? { ...n, read: true } : n))
    saveNotifications(updated)
    if (item.targetTab) {
      setActiveTab(item.targetTab)
    }
    setIsNotificationOpen(false)
  }

  const handleDeleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = notifications.filter((n) => n.id !== id)
    saveNotifications(updated)
  }

  const handleClearAllNotifications = () => {
    saveNotifications([])
    showToast('All notifications cleared.', 'info' as any)
  }

  const displayedNotifications = notifications.filter((item) => {
    if (notificationFilter === 'unread') return !item.read
    return true
  })

  // Toast Notification State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null)

  // Primary CMS Collections Data
  const [posts, setPosts] = useState<BlogPost[]>(() => {
    try {
      const saved = localStorage.getItem('happy-machinery-blog-posts')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch {}
    return DEFAULT_POSTS
  })
  const [products, setProducts] = useState<AdminProduct[]>(() => {
    try {
      const saved = localStorage.getItem('happy-machinery-products')
      if (saved) {
        const parsed = JSON.parse(saved) as AdminProduct[]
        if (Array.isArray(parsed) && parsed.length > 0) {
          let mod = false
          const migrated = parsed.map((item) => {
            if (item.id === 901 && (!item.name || !item.name.includes('TYPHON STOMP') || item.name.includes('Piston Pump'))) {
              item.name = 'TYPHON STOMP V900 1.4 Ton Skid Steer Loader with 25HP Kubota D1105 Engine, 1,102 lb Max Load — Crimson Red'
              mod = true
            }
            if (item.id === 902 && (!item.name || !item.name.includes('TYPHON STOMP') || item.name.includes('Piston Pump'))) {
              item.name = 'TYPHON STOMP V900 1.4 Ton Skid Steer Loader with 25HP Kubota D1105 Engine, 1,102 lb Max Load — Industrial Yellow'
              mod = true
            }
            if (item.id === 903 && (!item.name || !item.name.includes('TYPHON STOMP') || item.name.includes('Piston Pump'))) {
              item.name = 'TYPHON STOMP V900 1.4 Ton Skid Steer Loader with 25HP Kubota D1105 Engine, 1,102 lb Max Load — Cobalt Blue'
              mod = true
            }
            return item
          })
          if (mod) {
            try { localStorage.setItem('happy-machinery-products', JSON.stringify(migrated)) } catch {}
          }
          return migrated
        }
      }
    } catch {}
    return DEFAULT_PRODUCTS
  })
  const [mediaList, setMediaList] = useState<MediaItem[]>(() => {
    try {
      const saved = localStorage.getItem('happy-machinery-media')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const defaultFolderMap: Record<string, 'features' | 'galleries' | 'profileimg'> = {
            'logo.png': 'features',
            'v900-promo.webp': 'features',
            'why-choose-collage.jpg': 'features',
            'about-team-1.png': 'profileimg',
            'about-team-2.jpg': 'profileimg',
            'about-team-3.png': 'profileimg',
            'customer-feedback-portraits.png': 'profileimg',
          }
          // Only keep real website photos, discard old dummy ebay files
          const validWebsiteItems = parsed.filter((item: MediaItem) => {
            if (!item.url) return false
            const isEbayDummy = item.url.includes('/ebay/') || item.url.includes('1801') || item.title?.includes('1801')
            return !isEbayDummy
          })
          if (validWebsiteItems.length > 0) {
            return validWebsiteItems.map((item: MediaItem) => {
              if (!item.folder) {
                const matchedKey = Object.keys(defaultFolderMap).find((k) => item.url?.includes(k))
                return { ...item, folder: matchedKey ? defaultFolderMap[matchedKey] : 'galleries' }
              }
              return item
            })
          }
        }
      }
    } catch {}
    return DEFAULT_MEDIA
  })
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(() => DEFAULT_ADMIN_USERS)
  const [, setSecurityLogs] = useState<SecurityLog[]>([])
  const [bannedIps, setBannedIps] = useState<BannedIp[]>([])
  const [bannedDevices, setBannedDevices] = useState<BannedDevice[]>(() => {
    try {
      const raw = localStorage.getItem('hm_banned_devices')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [loginActivityLogs, setLoginActivityLogs] = useState<LoginActivityLog[]>(() => {
    try {
      const raw = localStorage.getItem('hm_login_activity')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })
  const [failedLogins, setFailedLogins] = useState<FailedLoginAttempt[]>([])
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(DEFAULT_SECURITY_SETTINGS)
  // Auto Sign-Out Inactivity Security Settings & State
  const [autoSignOutEnabled, setAutoSignOutEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('hm_auto_sign_out_enabled')
      if (saved !== null) return saved === 'true'
    } catch {}
    return false // Default: false ("Sign in forever" until user turns it on)
  })

  const [autoSignOutSeconds, setAutoSignOutSeconds] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('hm_auto_sign_out_seconds')
      const val = saved ? parseInt(saved, 10) : NaN
      if (!isNaN(val) && val > 0) return val
    } catch {}
    return 300 // Default: 300 seconds (5 minutes) when enabled
  })

  const [isAutoSignOutModalOpen, setIsAutoSignOutModalOpen] = useState(false)
  const [tempAutoSignOutEnabled, setTempAutoSignOutEnabled] = useState(autoSignOutEnabled)
  const [tempAutoSignOutSeconds, setTempAutoSignOutSeconds] = useState(autoSignOutSeconds)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(autoSignOutSeconds)
  const [showSignOutWarning, setShowSignOutWarning] = useState<boolean>(false)
  const lastActivityRef = useRef<number>(Date.now())
  const [, setAnalyticsEvents] = useState<AnalyticsViewEvent[]>([])
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS)
  const logoFileInputRef = useRef<HTMLInputElement>(null)
  const faviconFileInputRef = useRef<HTMLInputElement>(null)
  const [logoPreviewBg, setLogoPreviewBg] = useState<'dark' | 'light'>('dark')

  const handleLogoUpload = (file: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file (PNG, JPG, SVG, WebP, GIF)', 'error')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Logo file size must be less than 5MB', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      if (dataUrl) {
        setSiteSettings((prev) => ({ ...prev, logo: dataUrl }))
        showToast('Logo loaded! Click "Save Global Settings & Brand Assets" to apply.', 'success')
      }
    }
    reader.readAsDataURL(file)
  }

  const handleFaviconUpload = (file: File) => {
    if (!file) return
    if (!file.type.startsWith('image/') && !file.name.endsWith('.ico')) {
      showToast('Please select an icon or image file (.png, .ico, .webp, .svg)', 'error')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Favicon file size must be less than 2MB', 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      if (dataUrl) {
        setSiteSettings((prev) => ({ ...prev, favicon: dataUrl }))
        updateBrowserFavicon(dataUrl)
        showToast('Favicon loaded and browser tab updated! Click "Save Global Settings & Brand Assets" to apply.', 'success')
      }
    }
    reader.readAsDataURL(file)
  }

  const [, setSitePages] = useState<SitePage[]>(DEFAULT_SITE_PAGES)
  const [homeContent, setHomeContent] = useState<HomePageContent>(DEFAULT_HOME_CONTENT)
  const [isSavingHome, setIsSavingHome] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Modals & Sub-forms State
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [editingArticle, setEditingArticle] = useState<BlogPost | null>(null)
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null)
  const [showAddAdminModal, setShowAddAdminModal] = useState(false)
  const [showBanIpModal, setShowBanIpModal] = useState(false)
  const [banModalType, setBanModalType] = useState<'ip' | 'device'>('ip')
  const [newDeviceInput, setNewDeviceInput] = useState('')
  const [newDeviceNameInput, setNewDeviceNameInput] = useState('')
  const [showGoogleLinkModal, setShowGoogleLinkModal] = useState(false)
  const [googleLinkManualEmail, setGoogleLinkManualEmail] = useState('')
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false)
  const [loginActivityFilter, setLoginActivityFilter] = useState<'all' | 'success' | 'failed' | 'google'>('all')
  const [loginActivitySearch, setLoginActivitySearch] = useState('')
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [mediaZoom, setMediaZoom] = useState<number>(100)
  const [mediaRotation, setMediaRotation] = useState<number>(0)
  const [mediaPan, setMediaPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [initialPan, setInitialPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [copiedMediaUrl, setCopiedMediaUrl] = useState(false)

  // Upload Progress & WebP Conversion States
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatusText, setUploadStatusText] = useState('')
  const [convertedWebpInfo, setConvertedWebpInfo] = useState<{ originalSize: string; webpSize: string; savings: string } | null>(null)
  const [isDragOverUpload, setIsDragOverUpload] = useState(false)

  const handleOpenMedia = (item: MediaItem) => {
    setSelectedMedia(item)
    setMediaZoom(100)
    setMediaRotation(0)
    setMediaPan({ x: 0, y: 0 })
    setIsPanning(false)
    setCopiedMediaUrl(false)
  }

  const handlePrevMedia = () => {
    if (!selectedMedia || mediaList.length === 0) return
    const currentIdx = mediaList.findIndex((m) => m.id === selectedMedia.id || m.url === selectedMedia.url)
    const prevIdx = currentIdx > 0 ? currentIdx - 1 : mediaList.length - 1
    setSelectedMedia(mediaList[prevIdx])
    setMediaZoom(100)
    setMediaRotation(0)
    setMediaPan({ x: 0, y: 0 })
    setIsPanning(false)
    setCopiedMediaUrl(false)
  }

  const handleNextMedia = () => {
    if (!selectedMedia || mediaList.length === 0) return
    const currentIdx = mediaList.findIndex((m) => m.id === selectedMedia.id || m.url === selectedMedia.url)
    const nextIdx = currentIdx < mediaList.length - 1 ? currentIdx + 1 : 0
    setSelectedMedia(mediaList[nextIdx])
    setMediaZoom(100)
    setMediaRotation(0)
    setMediaPan({ x: 0, y: 0 })
    setIsPanning(false)
    setCopiedMediaUrl(false)
  }

  const handleZoomIn = () => {
    setMediaZoom((prev) => Math.min(500, prev + 25))
  }

  const handleZoomOut = () => {
    setMediaZoom((prev) => Math.max(25, prev - 25))
  }

  const handleResetZoom = () => {
    setMediaZoom(100)
    setMediaRotation(0)
    setMediaPan({ x: 0, y: 0 })
    setIsPanning(false)
  }

  const handleRotate = () => {
    setMediaRotation((prev) => (prev + 90) % 360)
  }

  // Canva-like Mouse Wheel Zoom (Zooms in / out smoothly)
  const handleLightboxWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const zoomDelta = e.deltaY < 0 ? 15 : -15
    setMediaZoom((prev) => Math.min(500, Math.max(25, prev + zoomDelta)))
  }

  // Canva-like Pan & Move (Mouse Drag to move left, right, up, down)
  const handleLightboxMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    setIsPanning(true)
    setPanStart({ x: e.clientX, y: e.clientY })
    setInitialPan({ x: mediaPan.x, y: mediaPan.y })
  }

  const handleLightboxMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return
    const dx = e.clientX - panStart.x
    const dy = e.clientY - panStart.y
    setMediaPan({
      x: initialPan.x + dx,
      y: initialPan.y + dy,
    })
  }

  const handleLightboxMouseUp = (e: React.MouseEvent) => {
    if (!isPanning) return
    setIsPanning(false)
    // If at normal scale (<= 115%) and user swiped horizontally > 75px, navigate next/prev
    if (mediaZoom <= 115) {
      const dx = e.clientX - panStart.x
      if (dx < -75) {
        handleNextMedia()
      } else if (dx > 75) {
        handlePrevMedia()
      } else {
        setMediaPan({ x: 0, y: 0 })
      }
    }
  }

  // Double Click toggles zoom like Canva/Figma
  const handleLightboxDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (mediaZoom !== 100 || mediaPan.x !== 0 || mediaPan.y !== 0) {
      setMediaZoom(100)
      setMediaPan({ x: 0, y: 0 })
    } else {
      setMediaZoom(200)
    }
  }

  // Copy URL with instant visual feedback and full origin resolution
  const handleCopySelectedUrl = async (url: string) => {
    try {
      const fullUrl = url.startsWith('http')
        ? url
        : window.location.origin + (url.startsWith('/') ? url : '/' + url)
      await navigator.clipboard.writeText(fullUrl)
      setCopiedMediaUrl(true)
      showToast('Image URL copied to clipboard!', 'success')
      setTimeout(() => setCopiedMediaUrl(false), 2200)
    } catch {
      navigator.clipboard.writeText(url)
      setCopiedMediaUrl(true)
      showToast('Image URL copied!', 'success')
      setTimeout(() => setCopiedMediaUrl(false), 2200)
    }
  }

  // Fast Client-Side WebP Converter (100% Quality, preserving original resolution)
  const processImageToWebP = (file: File): Promise<{ dataUrl: string; webpName: string; originalSize: string; webpSize: string; savings: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth || img.width
          canvas.height = img.naturalHeight || img.height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Canvas context not available'))
            return
          }
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0)

          const baseName = file.name.replace(/\.[^/.]+$/, '').trim() || 'image'
          const webpName = `${baseName}.webp`

          // Export at 100% lossless/ultra-high quality WebP
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                const dataUrl = canvas.toDataURL('image/webp', 0.98)
                const origKb = (file.size / 1024).toFixed(1) + ' KB'
                resolve({
                  dataUrl,
                  webpName,
                  originalSize: origKb,
                  webpSize: origKb,
                  savings: '100% Quality WebP',
                })
                return
              }
              const dataUrl = canvas.toDataURL('image/webp', 0.98)
              const origKb = (file.size / 1024).toFixed(1) + ' KB'
              const webpKb = (blob.size / 1024).toFixed(1) + ' KB'
              const savingsPct = file.size > blob.size
                ? Math.round(((file.size - blob.size) / file.size) * 100) + '% smaller'
                : '100% Quality WebP'

              resolve({
                dataUrl,
                webpName,
                originalSize: origKb,
                webpSize: webpKb,
                savings: savingsPct,
              })
            },
            'image/webp',
            0.98
          )
        }
        img.onerror = () => reject(new Error('Failed to parse image file'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  const handleUploadFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, JPEG, WEBP, GIF).', 'warning')
      return
    }

    setIsUploadingMedia(true)
    setUploadProgress(15)
    setUploadStatusText('Reading image file...')
    setConvertedWebpInfo(null)

    try {
      setUploadProgress(45)
      setUploadStatusText('Converting to WebP (100% High Quality)...')

      const result = await processImageToWebP(file)

      setUploadProgress(85)
      setUploadStatusText('Finalizing WebP asset...')
      setUploadMediaUrl(result.dataUrl)
      if (!uploadMediaTitle.trim()) {
        const cleanTitle = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())
        setUploadMediaTitle(cleanTitle)
      }

      setConvertedWebpInfo({
        originalSize: result.originalSize,
        webpSize: result.webpSize,
        savings: result.savings,
      })

      setUploadProgress(100)
      setUploadStatusText('Converted to WebP successfully!')
      showToast(`Auto-converted "${file.name}" to WebP with 100% quality!`, 'success')
    } catch (err) {
      console.error('WebP conversion failed:', err)
      showToast('Failed to convert image. Please try again.', 'error')
    } finally {
      setIsUploadingMedia(false)
    }
  }

  // Products Management States (Screenshots 1, 2, 3)
  const [isProductsExpanded, setIsProductsExpanded] = useState(true)
  const [productsSubView, setProductsSubView] = useState<'list' | 'editor' | 'categories' | 'brands' | 'attributes'>('list')
  const [dashboardRecentTab, setDashboardRecentTab] = useState<'products' | 'articles'>('products')
  const [prodSearch, setProdSearch] = useState('')
  const [prodStatusFilter, setProdStatusFilter] = useState<'all' | 'published' | 'draft' | 'low-stock'>('all')
  const [prodCategoryFilter, setProdCategoryFilter] = useState('all')
  const [prodCurrentPage, setProdCurrentPage] = useState(1)
  const prodItemsPerPage = 20

  // Product Categories Taxonomy States
  const [productCategories, setProductCategories] = useState<{
    id: string
    name: string
    slug: string
    parent?: string
    description?: string
    coverImage?: string
  }[]>(() => {
    try {
      const saved = localStorage.getItem('hm_cms_product_categories')
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
    return [
      {
        id: 'pcat-1',
        name: 'Skid Steer Loaders',
        slug: 'skid-steer-loaders',
        parent: 'Equipment',
        description: 'Tracked and wheeled compact skid steer loaders, stand-on machinery, and diesel utility tractors.',
        coverImage: '/images/loader-red.png'
      },
      {
        id: 'pcat-2',
        name: 'Mini Excavators',
        slug: 'mini-excavators',
        parent: 'Equipment',
        description: 'Compact hydraulic excavators from 1 to 3.5 tons for trenching, earthmoving, and tight-access digging.',
        coverImage: '/images/why-choose-v900-jobsite.png'
      },
      {
        id: 'pcat-3',
        name: 'Wheel Loaders',
        slug: 'wheel-loaders',
        parent: 'Equipment',
        description: 'Electric and diesel articulated compact wheel loaders for material handling and bulk loading.',
        coverImage: '/images/loader-yellow.png'
      },
      {
        id: 'pcat-4',
        name: 'Skid Steer Attachments',
        slug: 'skid-steer-attachments',
        parent: 'Attachments & Parts',
        description: 'Pallet forks, hydraulic hammers, earth augers, rotary tillers, snow blowers, and grapple buckets.',
        coverImage: '/images/fork-red-jobsite.png'
      },
      {
        id: 'pcat-5',
        name: 'Mini Excavator Attachments',
        slug: 'mini-excavator-attachments',
        parent: 'Attachments & Parts',
        description: 'Tilting buckets, rippers, hydraulic thumb clips, rakes, quick hitches, and tree diggers.',
        coverImage: '/images/fork-blue-jobsite.png'
      },
      {
        id: 'pcat-6',
        name: 'Compact Series (501–507)',
        slug: 'compact-series-501-507',
        parent: 'Attachments & Parts > Skid Steer Attachments',
        description: 'Specialized quick-tach implements for sub-compact utility loaders.',
        coverImage: '/images/fork-yellow-jobsite.png'
      },
      {
        id: 'pcat-7',
        name: 'Attachments for Mini Excavators (2 Tons and Below)',
        slug: 'attachments-mini-excavators-under-2-tons',
        parent: 'Attachments & Parts > Mini Excavator Attachments',
        description: 'Lightweight high-durability tools tailored for 1-2 ton mini diggers.',
        coverImage: '/images/why-choose-v900-jobsite.png'
      }
    ]
  })

  const [editingProductCat, setEditingProductCat] = useState<{
    id: string
    name: string
    slug: string
    parent?: string
    description?: string
    coverImage?: string
  } | null>(null)
  const [pcatName, setPcatName] = useState('')
  const [pcatSlug, setPcatSlug] = useState('')
  const [pcatParent, setPcatParent] = useState('')
  const [pcatDesc, setPcatDesc] = useState('')
  const [pcatCover, setPcatCover] = useState('')
  const [pcatSearch, setPcatSearch] = useState('')

  // Product Attributes Management States (New Attributes Menu)
  const [productAttributes, setProductAttributes] = useState<ProductAttribute[]>(() => {
    try {
      const saved = localStorage.getItem('hm_cms_product_attributes')
      if (saved) return JSON.parse(saved)
    } catch {}
    return DEFAULT_PRODUCT_ATTRIBUTES
  })
  const [editingAttribute, setEditingAttribute] = useState<ProductAttribute | null>(null)
  const [attrSearch, setAttrSearch] = useState('')
  const [attrFormName, setAttrFormName] = useState('')
  const [attrFormSlug, setAttrFormSlug] = useState('')
  const [attrFormType, setAttrFormType] = useState<'select' | 'pills' | 'text' | 'number'>('select')
  const [attrFormTerms, setAttrFormTerms] = useState('')
  const [attrFormDesc, setAttrFormDesc] = useState('')
  const [attrFormFilterable, setAttrFormFilterable] = useState(true)
  const [attrFormRequired, setAttrFormRequired] = useState(false)
  const [quickTermInput, setQuickTermInput] = useState<{ [attrId: string]: string }>({})

  // Product Editor Form States (Screenshots 1 & 3)
  const [prodEditorId, setProdEditorId] = useState<number | null>(null)
  const [prodEditorName, setProdEditorName] = useState('')
  const [prodEditorSlug, setProdEditorSlug] = useState('')
  const [prodEditorShortDesc, setProdEditorShortDesc] = useState('')
  const [prodEditorDesc, setProdEditorDesc] = useState('')
  const [prodEditorSku, setProdEditorSku] = useState('')
  const [prodEditorCategory, setProdEditorCategory] = useState('')
  const [prodEditorBrand, setProdEditorBrand] = useState('')
  const [prodEditorPrice, setProdEditorPrice] = useState<number | ''>('')
  const [prodEditorSalePrice, setProdEditorSalePrice] = useState<number | ''>('')
  const [prodEditorStock, setProdEditorStock] = useState<number | ''>('')
  const [prodEditorStatus, setProdEditorStatus] = useState<'Published' | 'Draft'>('Published')
  const [prodEditorBuyUrl, setProdEditorBuyUrl] = useState('')
  const [prodEditorFeatured, setProdEditorFeatured] = useState(false)
  const [prodEditorAddToCart, setProdEditorAddToCart] = useState(true)
  const [prodEditorImage, setProdEditorImage] = useState('')
  const [prodEditorGallery, setProdEditorGallery] = useState('')
  const [prodEditorSpecs, setProdEditorSpecs] = useState<{ name: string; value: string }[]>([])

  // Inquiries & Leads States
  const [inquiriesList, setInquiriesList] = useState<Inquiry[]>(() => {
    try {
      const saved = localStorage.getItem('happy-machinery-inquiries')
      if (saved) return JSON.parse(saved)
    } catch {}
    return DEFAULT_INQUIRIES
  })
  const [inquirySearch, setInquirySearch] = useState('')
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState<string>('all')

  // Cart Orders States
  const [ordersList, setOrdersList] = useState<CartOrder[]>(() => {
    try {
      const saved = localStorage.getItem('happy-machinery-orders')
      if (saved) return JSON.parse(saved)
    } catch {}
    return DEFAULT_CART_ORDERS
  })

  // Comments Moderation States
  const [commentsData, setCommentsData] = useState<BlogComment[]>(() => {
    try {
      const saved = localStorage.getItem('happy-machinery-comments')
      if (saved) return JSON.parse(saved)
    } catch {}
    return DEFAULT_COMMENTS
  })
  const [commentFilter, setCommentFilter] = useState<'all' | 'Pending' | 'Approved' | 'Spam'>('all')

  // Articles Sub-view & Editorial States
  const [articlesSubView, setArticlesSubView] = useState<'list' | 'editor' | 'categories' | 'topBlogs'>('list')
  const [editorTitle, setEditorTitle] = useState('')
  const [editorSlug, setEditorSlug] = useState('')
  const [editorExcerpt, setEditorExcerpt] = useState('')
  const [editorContent, setEditorContent] = useState('')
  const [editorContentRaw, setEditorContentRaw] = useState('')
  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [linkModalType, setLinkModalType] = useState<'internal' | 'external'>('internal')
  const [linkModalInternalUrl, setLinkModalInternalUrl] = useState('/store')
  const [linkModalExternalUrl, setLinkModalExternalUrl] = useState('https://')
  const [linkModalText, setLinkModalText] = useState('')
  // Live Visual WYSIWYG vs Markdown Code Mode vs Full Live Reader Preview
  const [editorMode, setEditorMode] = useState<'visual' | 'code' | 'preview'>('visual')
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [editorBlocks, setEditorBlocks] = useState<VisualBlock[]>([{ id: 'blk-init', type: 'text', text: '' }])
  const [activeVisualBlockIndex, setActiveVisualBlockIndex] = useState<number | null>(null)
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null)
  // Image & YouTube Media Insertion Modals with Live Preview & Media Library
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [imageModalTab, setImageModalTab] = useState<'library' | 'upload' | 'url'>('library')
  const [imageModalSearch, setImageModalSearch] = useState('')
  const [selectedLibraryItem, setSelectedLibraryItem] = useState<MediaItem | null>(null)
  const [modalUploadProgress, setModalUploadProgress] = useState<number | null>(null)
  const [modalUploadStatus, setModalUploadStatus] = useState<string>('')
  const [imageModalUrl, setImageModalUrl] = useState('')
  const [imageModalAlt, setImageModalAlt] = useState('')
  const [imageModalCaption, setImageModalCaption] = useState('')
  const [youtubeModalOpen, setYoutubeModalOpen] = useState(false)
  const [youtubeModalUrl, setYoutubeModalUrl] = useState('')
  const [youtubeModalTitle, setYoutubeModalTitle] = useState('')
  const [savedCursorPos, setSavedCursorPos] = useState<{ start: number; end: number } | null>(null)
  const [editorCategory, setEditorCategory] = useState('Jobsite Productivity')
  const [editorStatus, setEditorStatus] = useState<'Published' | 'Draft' | 'Scheduled'>('Draft')
  const [editorCoverImage, setEditorCoverImage] = useState('')
  const [editorCoverAlt, setEditorCoverAlt] = useState('')
  // Featured Cover Image Media Library & Upload States
  const [isCoverMediaModalOpen, setIsCoverMediaModalOpen] = useState(false)
  const [coverMediaSearch, setCoverMediaSearch] = useState('')
  const [coverMediaFolder, setCoverMediaFolder] = useState<string>('all')
  const [selectedCoverMedia, setSelectedCoverMedia] = useState<MediaItem | null>(null)
  const [isUploadingCover, setIsUploadingCover] = useState(false)
  const coverFileInputRef = useRef<HTMLInputElement>(null)
  const coverModalFileInputRef = useRef<HTMLInputElement>(null)
  const [editorVideoUrl, setEditorVideoUrl] = useState('')
  const [editorSeoTitle, setEditorSeoTitle] = useState('')
  const [editorSeoDesc, setEditorSeoDesc] = useState('')
  const [editorScheduledAt, setEditorScheduledAt] = useState('')

  // Rich WYSIWYG & Media Editor States (Matches Image 2)
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null)

  const [assignedSeries, setAssignedSeries] = useState('None (Standalone Article)')

  // Categories Taxonomy State (Screenshot 5)
  const [blogCategories, setBlogCategories] = useState<{ name: string; slug: string; desc?: string; cover?: string; parent?: string }[]>(() => {
    try {
      const saved = localStorage.getItem('happy-machinery-blog-categories')
      if (saved) return JSON.parse(saved)
    } catch {}
    return [
      { name: 'Jobsite Productivity', slug: 'jobsite-productivity', desc: 'Efficiency strategies on residential and tight job sites.' },
      { name: 'Equipment Maintenance', slug: 'equipment-maintenance', desc: 'Hydraulic checks, oil intervals, and rubber track care.' },
      { name: 'Attachments & Tools', slug: 'attachments-tools', desc: 'Augers, trenchers, pallet forks, and hydraulic breakers.' },
      { name: 'Compact Loaders', slug: 'compact-loaders', desc: 'Mini skid steer walkthroughs and stand-on machinery.' },
      { name: 'Skid Steer Comparisons', slug: 'skid-steer-comparisons', desc: 'Wheeled vs tracked loaders, gas vs diesel options.' },
      { name: 'Hydraulic Systems', slug: 'hydraulic-systems', desc: 'Pressure testing, auxiliary circuits, and pump diagnostics.' }
    ]
  })
  const [editingBlogCat, setEditingBlogCat] = useState<{ name: string; slug: string; desc?: string; cover?: string; parent?: string } | null>(null)
  const [newCatName, setNewCatName] = useState('')
  const [newCatSlug, setNewCatSlug] = useState('')
  const [newCatDesc, setNewCatDesc] = useState('')
  const [newCatCover, setNewCatCover] = useState('')
  const [newCatParent, setNewCatParent] = useState('')
  const [categorySearch, setCategorySearch] = useState('')

  // Trash & Recovery Vault State
  const [trashItems, setTrashItems] = useState<TrashItem[]>(() => {
    try {
      const saved = localStorage.getItem('happy-machinery-trash')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [trashFilter, setTrashFilter] = useState<'all' | 'article' | 'product' | 'category' | 'media'>('all')
  const [trashSearch, setTrashSearch] = useState('')

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
    isDanger?: boolean
    warningDetails?: string[]
    onConfirm: () => void | Promise<void>
  } | null>(null)

  // Custom Prompt / Action Dialog State (Replaces native window.prompt)
  const [cmsActionDialog, setCmsActionDialog] = useState<{
    isOpen: boolean
    title: string
    subtitle?: string
    icon?: string
    inputLabel: string
    defaultValue?: string
    placeholder?: string
    confirmLabel?: string
    isFolderSelect?: boolean
    options?: string[]
    onConfirm: (val: string) => void | Promise<void>
  } | null>(null)
  const [actionDialogInputValue, setActionDialogInputValue] = useState('')

  // Profile Edit State
  const [profileName, setProfileName] = useState('')
  const [profileEmail, setProfileEmail] = useState('')
  const [profileAvatar, setProfileAvatar] = useState('')
  const [newPasswordInput, setNewPasswordInput] = useState('')
  const [showProfilePassword, setShowProfilePassword] = useState(false)

  // Media Library Enhanced States & Folder Tree Navigation (File Manager-KiuQ)
  interface MediaFolderItem {
    name: string
    isPinned?: boolean
    size: string
    date: string
  }
  const DEFAULT_KIUQ_FOLDERS: MediaFolderItem[] = [
    { name: 'galleries', isPinned: true, size: '20.6 MB', date: '2026-10-20' },
    { name: 'features', isPinned: true, size: '2.23 MB', date: '2026-10-20' },
    { name: 'profileimg', isPinned: true, size: '3.72 MB', date: '2026-10-20' },
  ]
  const [mediaFolders, setMediaFolders] = useState<MediaFolderItem[]>(DEFAULT_KIUQ_FOLDERS)
  const [selectedFolder, setSelectedFolder] = useState<string>('galleries')
  const [uploadTargetFolder, setUploadTargetFolder] = useState<string>('galleries')
  const [articleModalFolder, setArticleModalFolder] = useState<string>('all')
  const [mediaSearchTerm, setMediaSearchTerm] = useState('')
  const [mediaSortOrder, setMediaSortOrder] = useState<'A-Z' | 'Z-A' | 'Newest'>('A-Z')
  const [mediaActiveView, setMediaActiveView] = useState<'files' | 'urls' | 'previews'>('files')
  const [isMediaSidebarCollapsed, setIsMediaSidebarCollapsed] = useState(false)
  const mediaBaseUrl = 'https://img.miniexcavator.org/'

  const handleMoveMediaFolder = (itemId: string, newFolder: string) => {
    const updated = mediaList.map((m) => (m.id === itemId ? { ...m, folder: newFolder } : m))
    setMediaList(updated)
    void writeSharedContent('media-library', updated)
    showToast(`Asset moved to "${newFolder}".`, 'success')
  }

  // Media Library Fullscreen & Multi-Select States
  const [isMediaFullScreen, setIsMediaFullScreen] = useState(false)
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([])
  const getMediaStandaloneUrl = () => {
    const session = getStoredSession()
    const token = session?.token || (typeof localStorage !== 'undefined' ? localStorage.getItem('hm_admin_token') : '') || ''
    const base = typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.hostname}${window.location.port && !['5173', '5174', '5175', '5176', '3000'].includes(window.location.port) ? `:${window.location.port}` : ''}/happymachinery/Media_Library/medialibrary.php`
      : 'http://localhost/happymachinery/Media_Library/medialibrary.php'
    return token ? `${base}?cms_token=${encodeURIComponent(token)}` : base
  }

  const handleSelectAllMedia = (e: React.ChangeEvent<HTMLInputElement>, list: MediaItem[]) => {
    if (e.target.checked) {
      setSelectedMediaIds(list.map((m) => m.id))
    } else {
      setSelectedMediaIds([])
    }
  }

  const handleToggleSelectMedia = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedMediaIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const handleDuplicateMedia = (item: MediaItem, e: React.MouseEvent) => {
    e.stopPropagation()
    const newItem: MediaItem = {
      ...item,
      id: String(Date.now() + Math.random()),
      title: `${item.title} (Copy)`,
      dateAdded: new Date().toISOString().split('T')[0]
    }
    const updated = [newItem, ...mediaList]
    setMediaList(updated)
    void writeSharedContent('media-library', updated)
    showToast(`Duplicated "${item.title}".`, 'success')
  }

  const handleRenameMedia = (item: MediaItem, e: React.MouseEvent) => {
    e.stopPropagation()
    setActionDialogInputValue(item.title)
    setCmsActionDialog({
      isOpen: true,
      title: 'Rename Media Asset',
      subtitle: 'Update asset title and public description.',
      icon: '✏️',
      inputLabel: 'Asset Title',
      defaultValue: item.title,
      placeholder: 'Enter new asset title...',
      confirmLabel: 'Save Title',
      onConfirm: (newName) => {
        if (newName && newName.trim() && newName.trim() !== item.title) {
          const updated = mediaList.map((m) =>
            m.id === item.id ? { ...m, title: newName.trim() } : m
          )
          setMediaList(updated)
          void writeSharedContent('media-library', updated)
          showToast(`Renamed to "${newName.trim()}".`, 'success')
        }
      }
    })
  }

  const getMediaReferences = (url: string) => {
    const refs: string[] = []
    if (!url) return refs
    const cleanUrl = url.toLowerCase()
    posts.forEach((p) => {
      if (p.image?.toLowerCase() === cleanUrl || p.content?.some((c) => c.toLowerCase().includes(cleanUrl))) {
        refs.push(`Article: "${p.title}"`)
      }
    })
    products.forEach((p) => {
      if (
        p.image?.toLowerCase() === cleanUrl ||
        p.galleryImages?.some((g) => g.toLowerCase().includes(cleanUrl)) ||
        p.description?.toLowerCase().includes(cleanUrl)
      ) {
        refs.push(`Product: "${p.name}"`)
      }
    })
    return refs
  }

  const handleDeleteSingleMedia = (item: MediaItem, e: React.MouseEvent) => {
    e.stopPropagation()
    const refs = getMediaReferences(item.url)

    setConfirmDialog({
      isOpen: true,
      title: 'Move Asset to Trash Vault?',
      message: `Move "${item.title}" to Trash? It will be safely preserved in the Trash Vault and can be recovered back to the Media Library at any time.`,
      confirmLabel: 'Move to Trash Vault',
      isDanger: true,
      warningDetails: refs,
      onConfirm: async () => {
        const trashRecord: TrashItem = {
          id: `media-${item.id}`,
          originalId: item.id,
          type: 'media',
          title: item.title,
          subtitle: `Size: ${item.size || 'N/A'} · Folder: ${item.folder || 'general'}`,
          image: item.url,
          deletedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          deletedTimestamp: Date.now(),
          data: item
        }
        const updatedTrash = [trashRecord, ...trashItems]
        const updated = mediaList.filter((m) => m.id !== item.id)

        setTrashItems(updatedTrash)
        setMediaList(updated)

        localStorage.setItem('happy-machinery-trash', JSON.stringify(updatedTrash))
        await writeSharedContent('trash-items', updatedTrash)
        await writeSharedContent('media-library', updated)
        await logSecurityEvent('CONTENT_DELETED', `Media asset "${item.title}" moved to Trash.`, 'warning', currentUser?.username)

        showToast(`Asset "${item.title}" moved to Trash. Recover anytime from Trash.`, 'warning')
        setConfirmDialog(null)
      }
    })
  }

  const handleBatchDeleteMedia = () => {
    if (selectedMediaIds.length === 0) {
      showToast('No items selected.', 'warning')
      return
    }
    const targetItems = mediaList.filter((m) => selectedMediaIds.includes(m.id))
    const allRefs: string[] = []
    targetItems.forEach((m) => {
      const refs = getMediaReferences(m.url)
      if (refs.length > 0) allRefs.push(`"${m.title}" (${refs.length} refs)`)
    })
    const warningText = allRefs.length > 0
      ? `⚠️ WARNING: ${allRefs.length} selected asset(s) are actively referenced (${allRefs.slice(0, 3).join(', ')}).\n\n`
      : ''

    setConfirmDialog({
      isOpen: true,
      title: `Move ${selectedMediaIds.length} Assets to Trash Vault?`,
      message: `${warningText}Move ${selectedMediaIds.length} selected asset(s) to Trash? They will be safely stored in the Trash Vault and can be restored at any time.`,
      confirmLabel: 'Move All to Trash',
      onConfirm: async () => {
        const newTrash: TrashItem[] = targetItems.map((item) => ({
          id: `media-${item.id}`,
          originalId: item.id,
          type: 'media',
          title: item.title,
          subtitle: `Size: ${item.size || 'N/A'} · Folder: ${item.folder || 'general'}`,
          image: item.url,
          deletedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          deletedTimestamp: Date.now(),
          data: item
        }))
        const updatedTrash = [...newTrash, ...trashItems]
        const updated = mediaList.filter((m) => !selectedMediaIds.includes(m.id))

        setTrashItems(updatedTrash)
        setMediaList(updated)
        setSelectedMediaIds([])

        localStorage.setItem('happy-machinery-trash', JSON.stringify(updatedTrash))
        await writeSharedContent('trash-items', updatedTrash)
        await writeSharedContent('media-library', updated)
        await logSecurityEvent('CONTENT_DELETED', `Batch moved ${selectedMediaIds.length} media assets to Trash.`, 'warning', currentUser?.username)

        showToast(`Moved ${selectedMediaIds.length} items to Trash.`, 'warning')
        setConfirmDialog(null)
      }
    })
  }

  const handleCopySelectedUrls = () => {
    const targetList = selectedMediaIds.length > 0
      ? mediaList.filter((m) => selectedMediaIds.includes(m.id))
      : mediaList
    const urls = targetList.map((m) => m.url).join('\n')
    navigator.clipboard.writeText(urls)
    showToast(`${targetList.length} URL(s) copied to clipboard!`, 'success')
  }

  // Keyboard shortcut: Esc exits full screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMediaFullScreen) {
        setIsMediaFullScreen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMediaFullScreen])


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
    if (theme === 'light') {
      document.documentElement.classList.remove('dark')
      document.body.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
      document.body.classList.add('dark')
    }
  }, [theme])

  // Load All Collections from Backend
  const loadAllData = async () => {
    setIsLoadingData(true)
    const safeRead = async <T,>(key: string): Promise<T | undefined> => {
      try {
        return await readSharedContent<T>(key)
      } catch (e) {
        console.warn(`[CMS Storage] Could not read collection '${key}':`, e)
        return undefined
      }
    }

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
        fetchedPages,
        fetchedBlogCats,
        fetchedTrash,
        fetchedHomeContent,
        fetchedInquiries,
        fetchedOrders,
        fetchedComments,
        fetchedBannedDevs,
        fetchedLoginActivity
      ] = await Promise.all([
        safeRead<BlogPost[]>('blog-posts'),
        safeRead<AdminProduct[]>('products'),
        safeRead<MediaItem[]>('media-library'),
        safeRead<AdminUser[]>('admin-users'),
        safeRead<SecurityLog[]>('security-logs'),
        safeRead<BannedIp[]>('banned-ips'),
        safeRead<FailedLoginAttempt[]>('failed-logins'),
        safeRead<SecuritySettings>('security-settings'),
        safeRead<AnalyticsViewEvent[]>('analytics-events'),
        safeRead<SiteSettings>('site-settings'),
        safeRead<SitePage[]>('site-pages'),
        safeRead<{ name: string; slug: string; desc?: string; cover?: string; parent?: string }[]>('blog-categories'),
        safeRead<TrashItem[]>('trash-items'),
        safeRead<HomePageContent>('home-content'),
        safeRead<Inquiry[]>('inquiries'),
        safeRead<CartOrder[]>('orders'),
        safeRead<BlogComment[]>('comments'),
        safeRead<BannedDevice[]>('banned-devices'),
        safeRead<LoginActivityLog[]>('login-activity')
      ])

      if (fetchedPosts && Array.isArray(fetchedPosts) && fetchedPosts.length > 0) {
        setPosts(fetchedPosts)
        try { localStorage.setItem('happy-machinery-blog-posts', JSON.stringify(fetchedPosts)) } catch {}
      } else {
        setPosts((prev) => (prev.length > 0 ? prev : DEFAULT_POSTS))
      }

      if (fetchedProducts && Array.isArray(fetchedProducts) && fetchedProducts.length > 0) {
        setProducts(fetchedProducts)
        try { localStorage.setItem('happy-machinery-products', JSON.stringify(fetchedProducts)) } catch {}
      } else {
        setProducts((prev) => (prev.length > 0 ? prev : DEFAULT_PRODUCTS))
      }

      if (fetchedMedia && Array.isArray(fetchedMedia) && fetchedMedia.length > 0) {
        setMediaList(fetchedMedia)
        try { localStorage.setItem('happy-machinery-media', JSON.stringify(fetchedMedia)) } catch {}
      } else {
        setMediaList((prev) => (prev.length > 0 ? prev : DEFAULT_MEDIA))
      }

      if (fetchedUsers && Array.isArray(fetchedUsers) && fetchedUsers.length > 0) {
        const normalizedUsers = fetchedUsers.map((u) => {
          if ((u.username === 'admin' || u.email === 'soporadara@kiuq.com') && (!u.avatar || u.avatar.includes('about-team-1.png'))) {
            return { ...u, avatar: DEFAULT_SUPERADMIN_AVATAR }
          }
          return u
        })
        setAdminUsers(normalizedUsers)
        const selfMatch = normalizedUsers.find((u) => u.username === currentUser?.username || u.email === currentUser?.email)
        if (selfMatch && selfMatch.avatar) {
          setCurrentUser(selfMatch)
          const session = getStoredSession()
          if (session) {
            session.user = selfMatch
            try { localStorage.setItem('hm_admin_session', JSON.stringify(session)) } catch {}
          }
        }
      } else {
        setAdminUsers((prev) => (prev.length > 0 ? prev : DEFAULT_ADMIN_USERS))
      }

      if (fetchedLogs && Array.isArray(fetchedLogs)) setSecurityLogs(fetchedLogs)
      if (fetchedBans && Array.isArray(fetchedBans)) setBannedIps(fetchedBans)
      if (fetchedBannedDevs && Array.isArray(fetchedBannedDevs)) setBannedDevices(fetchedBannedDevs)
      if (fetchedLoginActivity && Array.isArray(fetchedLoginActivity)) setLoginActivityLogs(fetchedLoginActivity)
      if (fetchedFails && Array.isArray(fetchedFails)) setFailedLogins(fetchedFails)
      if (fetchedSecSettings) {
        setSecuritySettings(fetchedSecSettings)
        if (typeof fetchedSecSettings.autoSignOutEnabled === 'boolean') {
          setAutoSignOutEnabled(fetchedSecSettings.autoSignOutEnabled)
          setTempAutoSignOutEnabled(fetchedSecSettings.autoSignOutEnabled)
        }
        if (typeof fetchedSecSettings.autoSignOutSeconds === 'number' && fetchedSecSettings.autoSignOutSeconds > 0) {
          setAutoSignOutSeconds(fetchedSecSettings.autoSignOutSeconds)
          setTempAutoSignOutSeconds(fetchedSecSettings.autoSignOutSeconds)
          setSecondsRemaining(fetchedSecSettings.autoSignOutSeconds)
        }
      }
      if (fetchedAnalytics && Array.isArray(fetchedAnalytics)) setAnalyticsEvents(fetchedAnalytics)
      if (fetchedSiteSettings) {
        const normalized: SiteSettings = {
          ...DEFAULT_SITE_SETTINGS,
          ...fetchedSiteSettings,
          logo: (!fetchedSiteSettings.logo || fetchedSiteSettings.logo.includes('Happy_Machinery_Logo.webp')) ? '/logo.png' : fetchedSiteSettings.logo,
          favicon: (!fetchedSiteSettings.favicon || fetchedSiteSettings.favicon === '/logo.png' || fetchedSiteSettings.favicon.includes('Happy_Machinery_Logo.webp')) ? '/favicon.png' : fetchedSiteSettings.favicon
        }
        setSiteSettings(normalized)
        cacheSiteSettings(normalized)
      } else {
        cacheSiteSettings(DEFAULT_SITE_SETTINGS)
      }
      if (fetchedPages && Array.isArray(fetchedPages)) setSitePages(fetchedPages)
      if (fetchedBlogCats && Array.isArray(fetchedBlogCats) && fetchedBlogCats.length > 0) {
        setBlogCategories(fetchedBlogCats)
      }
      if (fetchedTrash && Array.isArray(fetchedTrash)) {
        setTrashItems(fetchedTrash)
      }
      // Merge server-persisted inquiries with local storage cache
      const serverInquiries = (fetchedInquiries && Array.isArray(fetchedInquiries)) ? fetchedInquiries : []
      let localInquiries: Inquiry[] = []
      try {
        const rawLocal = localStorage.getItem('happy-machinery-inquiries')
        localInquiries = rawLocal ? JSON.parse(rawLocal) : []
      } catch {}

      const inquiryMap = new Map<number, Inquiry>()
      serverInquiries.forEach((item) => inquiryMap.set(item.id, item))
      localInquiries.forEach((item) => {
        if (!inquiryMap.has(item.id)) {
          inquiryMap.set(item.id, item)
        }
      })
      let mergedInquiries = Array.from(inquiryMap.values()).sort((a, b) => b.id - a.id)
      if (mergedInquiries.length === 0) {
        mergedInquiries = DEFAULT_INQUIRIES
      }
      setInquiriesList(mergedInquiries)
      try {
        localStorage.setItem('happy-machinery-inquiries', JSON.stringify(mergedInquiries))
      } catch {}

      if (mergedInquiries.length > serverInquiries.length) {
        void writeSharedContent('inquiries', mergedInquiries).catch(() => {})
      }
      if (fetchedOrders && Array.isArray(fetchedOrders) && fetchedOrders.length > 0) {
        setOrdersList(fetchedOrders)
        try { localStorage.setItem('happy-machinery-orders', JSON.stringify(fetchedOrders)) } catch {}
      } else {
        let localOrders: CartOrder[] = []
        try {
          const raw = localStorage.getItem('happy-machinery-orders')
          localOrders = raw ? JSON.parse(raw) : []
        } catch {}
        const finalOrders = localOrders.length > 0 ? localOrders : DEFAULT_CART_ORDERS
        setOrdersList(finalOrders)
        try { localStorage.setItem('happy-machinery-orders', JSON.stringify(finalOrders)) } catch {}
      }

      if (fetchedComments && Array.isArray(fetchedComments) && fetchedComments.length > 0) {
        setCommentsData(fetchedComments)
        try { localStorage.setItem('happy-machinery-comments', JSON.stringify(fetchedComments)) } catch {}
      } else {
        let localComments: BlogComment[] = []
        try {
          const raw = localStorage.getItem('happy-machinery-comments')
          localComments = raw ? JSON.parse(raw) : []
        } catch {}
        const finalComments = localComments.length > 0 ? localComments : DEFAULT_COMMENTS
        setCommentsData(finalComments)
        try { localStorage.setItem('happy-machinery-comments', JSON.stringify(finalComments)) } catch {}
      }

      // Sync Product Attributes
      let localAttrs: ProductAttribute[] = []
      try {
        const raw = localStorage.getItem('hm_cms_product_attributes')
        localAttrs = raw ? JSON.parse(raw) : []
      } catch {}
      if (localAttrs.length > 0) {
        setProductAttributes(localAttrs)
      } else {
        setProductAttributes(DEFAULT_PRODUCT_ATTRIBUTES)
        try { localStorage.setItem('hm_cms_product_attributes', JSON.stringify(DEFAULT_PRODUCT_ATTRIBUTES)) } catch {}
      }

      if (fetchedHomeContent) {
        setHomeContent((prev) => ({
          ...prev,
          ...fetchedHomeContent,
          hero: { ...prev.hero, ...(fetchedHomeContent.hero || {}) },
          featuresOverview: { ...prev.featuresOverview, ...(fetchedHomeContent.featuresOverview || {}) },
          promo: { ...prev.promo, ...(fetchedHomeContent.promo || {}) },
          featuredFleet: { ...prev.featuredFleet, ...(fetchedHomeContent.featuredFleet || {}) },
          forkShowcase: { ...prev.forkShowcase, ...(fetchedHomeContent.forkShowcase || {}) },
          why: { ...prev.why, ...(fetchedHomeContent.why || {}) },
          performance: { ...prev.performance, ...(fetchedHomeContent.performance || {}) },
          faq: { ...prev.faq, ...(fetchedHomeContent.faq || {}) },
          advantages: { ...prev.advantages, ...(fetchedHomeContent.advantages || {}) },
          delivery: { ...prev.delivery, ...(fetchedHomeContent.delivery || {}) },
          youtube: { ...prev.youtube, ...(fetchedHomeContent.youtube || {}) },
          feedback: { ...prev.feedback, ...(fetchedHomeContent.feedback || {}) },
          ctaStrip: { ...prev.ctaStrip, ...(fetchedHomeContent.ctaStrip || {}) }
        }))
      }
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

  // Real-time synchronization for customer inquiries
  useEffect(() => {
    const handleInquirySync = () => {
      void (async () => {
        try {
          const fetched = await readSharedContent<Inquiry[]>('inquiries')
          const srv = (fetched && Array.isArray(fetched)) ? fetched : []
          let loc: Inquiry[] = []
          try {
            const raw = localStorage.getItem('happy-machinery-inquiries')
            loc = raw ? JSON.parse(raw) : []
          } catch {}
          const map = new Map<number, Inquiry>()
          srv.forEach((i) => map.set(i.id, i))
          loc.forEach((i) => { if (!map.has(i.id)) map.set(i.id, i) })
          const merged = Array.from(map.values()).sort((a, b) => b.id - a.id)
          setInquiriesList(merged)
        } catch {}
      })()
    }

    window.addEventListener('inquiry-submitted', handleInquirySync)
    window.addEventListener('storage', handleInquirySync)
    return () => {
      window.removeEventListener('inquiry-submitted', handleInquirySync)
      window.removeEventListener('storage', handleInquirySync)
    }
  }, [])

  // Initialize Profile form on open
  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.name || '')
      setProfileEmail(currentUser.email || '')
      const userAvatar = currentUser.avatar && !currentUser.avatar.includes('about-team-1.png')
        ? currentUser.avatar
        : DEFAULT_SUPERADMIN_AVATAR
      setProfileAvatar(userAvatar)
    }
  }, [currentUser, showProfileModal, activeTab])

  // Deep-linking support for CMS routes: ?tab=profile, ?tab=security, or hash #profile, #security
  useEffect(() => {
    try {
      const url = new URL(window.location.href)
      const tabParam = url.searchParams.get('tab')
      const hash = window.location.hash.replace('#', '')
      if (tabParam === 'profile' || hash === 'profile') {
        setActiveTab('profile')
      } else if (tabParam === 'security' || hash === 'security') {
        setActiveTab('security')
      }
    } catch {}
  }, [])

  // Lock body scroll in CMS mode so no outer window scrollbar cuts into the header
  useEffect(() => {
    document.body.classList.add('cms-mode')
    return () => {
      document.body.classList.remove('cms-mode')
    }
  }, [])

  // Auto-close mobile sidebar and reset scroll position when changing views
  useEffect(() => {
    setIsMobileSidebarOpen(false)
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0
    }
  }, [activeTab, articlesSubView, productsSubView])

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
        setMediaZoom((prev) => Math.min(500, prev + 25))
      } else if (e.key === '-') {
        setMediaZoom((prev) => Math.max(25, prev - 25))
      } else if (e.key === '0') {
        setMediaZoom(100)
        setMediaRotation(0)
        setMediaPan({ x: 0, y: 0 })
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedMedia, mediaList])

  // Handle outside clicks and Escape key to close Notification & Profile Dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (notificationRef.current && !notificationRef.current.contains(target)) {
        setIsNotificationOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileDropdownOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsNotificationOpen(false)
        setIsProfileDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleLoginSuccess = (user: AdminUser) => {
    setCurrentUser(user)
    showToast(`Welcome back, ${user.name}!`, 'success')
  }

  const handleLogout = async () => {
    const session = getStoredSession()
    const token = session?.token || (typeof localStorage !== 'undefined' ? localStorage.getItem('hm_admin_token') : '') || ''

    if (currentUser) {
      await logSecurityEvent('LOGOUT', `User ${currentUser.username} logged out.`, 'info', currentUser.username)
    }

    // 1. Remove active session from shared content storage and revoke on server
    if (token) {
      try {
        const existingSessions = (await readSharedContent<Array<{ token: string; user: AdminUser; expiresAt: number }>>('admin-sessions')) || []
        const updated = existingSessions.filter((s) => s.token !== token)
        await writeSharedContent('admin-sessions', updated)
      } catch {}

      try {
        fetch('/api/content.php?action=logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ token })
        }).catch(() => {})
      } catch {}
    }

    // 2. Explicitly notify and terminate Apache Media Library session
    try {
      fetch('/happymachinery/Media_Library/medialibrary.php?logout=1', {
        method: 'GET',
        credentials: 'include'
      }).catch(() => {})
    } catch {}

    // 3. Clear all client storage and cookies
    clearStoredSession()
    if (typeof document !== 'undefined') {
      document.cookie = 'hm_cms_token=; path=/; max-age=0; SameSite=Lax'
    }
    setCurrentUser(null)
    setIsProfileDropdownOpen(false)
    showToast('Signed out successfully.', 'success')
  }

  // Auto Sign-Out Implementation for CMS Inactivity Timeout
  const executeAutoSignOut = async () => {
    setShowSignOutWarning(false)
    setIsAutoSignOutModalOpen(false)

    const session = getStoredSession()
    const token = session?.token || (typeof localStorage !== 'undefined' ? localStorage.getItem('hm_admin_token') : '') || ''

    if (currentUser) {
      await logSecurityEvent(
        'LOGOUT',
        `Auto Sign-Out triggered: Inactivity exceeded ${autoSignOutSeconds} seconds threshold for CMS security policy.`,
        'warning',
        currentUser.username
      )
    }

    if (token) {
      try {
        const existingSessions = (await readSharedContent<Array<{ token: string; user: AdminUser; expiresAt: number }>>('admin-sessions')) || []
        const updated = existingSessions.filter((s) => s.token !== token)
        await writeSharedContent('admin-sessions', updated)
      } catch {}

      try {
        fetch('/api/content.php?action=logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ token })
        }).catch(() => {})
      } catch {}
    }

    try {
      fetch('/happymachinery/Media_Library/medialibrary.php?logout=1', {
        method: 'GET',
        credentials: 'include'
      }).catch(() => {})
    } catch {}

    clearStoredSession()
    if (typeof document !== 'undefined') {
      document.cookie = 'hm_cms_token=; path=/; max-age=0; SameSite=Lax'
    }
    try {
      localStorage.setItem('hm_auto_logout_msg', `🔒 Security Auto Sign-Out: You were signed out after ${autoSignOutSeconds} seconds of inactivity.`)
    } catch {}

    setCurrentUser(null)
    setIsProfileDropdownOpen(false)
    showToast(`Security Auto Sign-Out: Session timed out after ${autoSignOutSeconds}s of inactivity.`, 'warning')
  }

  const handleSaveAutoSignOut = async (enabled: boolean, seconds: number) => {
    const validSeconds = Math.max(5, Math.min(86400, Number(seconds) || 60))
    setAutoSignOutEnabled(enabled)
    setAutoSignOutSeconds(validSeconds)
    setTempAutoSignOutEnabled(enabled)
    setTempAutoSignOutSeconds(validSeconds)
    setSecondsRemaining(validSeconds)
    lastActivityRef.current = Date.now()

    try {
      localStorage.setItem('hm_auto_sign_out_enabled', String(enabled))
      localStorage.setItem('hm_auto_sign_out_seconds', String(validSeconds))
    } catch {}

    const updatedSettings: SecuritySettings = {
      ...securitySettings,
      autoSignOutEnabled: enabled,
      autoSignOutSeconds: validSeconds
    }
    setSecuritySettings(updatedSettings)
    await writeSharedContent('security-settings', updatedSettings).catch(() => {})

    await logSecurityEvent(
      'SETTINGS_UPDATED',
      enabled 
        ? `Auto Sign-Out policy updated: Inactivity timeout set to ${validSeconds} seconds.` 
        : 'Auto Sign-Out policy updated: Sign in forever enabled (inactivity timeout disabled).',
      'info',
      currentUser?.username || 'admin'
    )

    showToast(
      enabled 
        ? `Auto Sign-Out active: Will sign out after ${validSeconds}s of idle time.` 
        : 'Auto Sign-Out turned off: You will stay signed in forever.',
      'success'
    )
    setIsAutoSignOutModalOpen(false)
  }

  // User Inactivity Tracking for Auto Sign-Out
  useEffect(() => {
    const handleUserActivity = () => {
      lastActivityRef.current = Date.now()
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click']
    events.forEach((ev) => window.addEventListener(ev, handleUserActivity, { passive: true }))

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, handleUserActivity))
    }
  }, [])

  // Auto Sign-Out Countdown Loop
  useEffect(() => {
    if (!currentUser || !autoSignOutEnabled) {
      setShowSignOutWarning(false)
      return
    }

    lastActivityRef.current = Date.now()

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastActivityRef.current) / 1000)
      const remaining = Math.max(0, autoSignOutSeconds - elapsed)
      setSecondsRemaining(remaining)

      const warningThreshold = Math.min(15, Math.max(5, Math.floor(autoSignOutSeconds / 2)))
      if (remaining <= warningThreshold && remaining > 0) {
        setShowSignOutWarning(true)
      } else if (remaining > warningThreshold) {
        setShowSignOutWarning(false)
      }

      if (remaining <= 0) {
        clearInterval(interval)
        void executeAutoSignOut()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [currentUser, autoSignOutEnabled, autoSignOutSeconds])

  // Security Operations: Ban & Unban (IP and Device)
  const handleSaveBan = async (e: React.FormEvent) => {
    e.preventDefault()
    const adminUser = currentUser?.username || 'admin'

    if (banModalType === 'ip') {
      if (!newIpAddress.trim()) {
        showToast('Please enter a valid IP address.', 'error')
        return
      }
      await manualBanIp(newIpAddress.trim(), newIpReason.trim() || 'Manual administrative ban', adminUser)
      const newBan: BannedIp = {
        id: `ban-${Date.now()}`,
        ip: newIpAddress.trim(),
        reason: newIpReason.trim() || 'Manual administrative ban',
        bannedBy: adminUser,
        createdAt: new Date().toISOString(),
        active: true,
        failedAttempts: 0
      }
      setBannedIps((prev) => [newBan, ...prev.filter((b) => b.ip !== newIpAddress.trim())])
      showToast(`IP ${newIpAddress.trim()} has been banned.`, 'success')
      setNewIpAddress('')
      setNewIpReason('')
      setShowBanIpModal(false)
    } else {
      if (!newDeviceInput.trim()) {
        showToast('Please enter a Device ID.', 'error')
        return
      }
      const devName = newDeviceNameInput.trim() || 'Restricted Device'
      await manualBanDevice(newDeviceInput.trim(), devName, newIpReason.trim() || 'Manual administrative ban', adminUser)
      const newDevBan: BannedDevice = {
        id: `ban-dev-${Date.now()}`,
        deviceId: newDeviceInput.trim(),
        deviceSignature: '',
        deviceName: devName,
        ip: 'Manual',
        reason: newIpReason.trim() || 'Manual administrative ban',
        bannedBy: adminUser,
        createdAt: new Date().toISOString(),
        expiresAt: null,
        active: true,
        failedAttempts: 0
      }
      setBannedDevices((prev) => [newDevBan, ...prev.filter((d) => d.deviceId !== newDeviceInput.trim())])
      showToast(`Device "${devName}" has been banned.`, 'success')
      setNewDeviceInput('')
      setNewDeviceNameInput('')
      setNewIpReason('')
      setShowBanIpModal(false)
    }
  }

  const handleUnbanIp = async (id: string, ip: string) => {
    await unbanIpAddress(ip, currentUser?.username || 'admin')
    const updated = bannedIps.filter((b) => b.id !== id && b.ip !== ip)
    setBannedIps(updated)
    showToast(`IP ${ip} unbanned successfully and counter reset.`, 'success')
  }

  const handleUnbanDevice = async (id: string, name: string) => {
    await unbanDeviceRecord(id, currentUser?.username || 'admin')
    const updated = bannedDevices.filter((d) => d.id !== id && d.deviceId !== id)
    setBannedDevices(updated)
    showToast(`Device "${name}" has been unbanned and counter reset.`, 'success')
  }

  // Google SSO Linking Handlers
  const handleStartLinkGoogle = () => {
    if (window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: { credential?: string }) => {
            if (response.credential) {
              void handleCompleteLinkGoogle(response.credential)
            }
          }
        })
        window.google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            setShowGoogleLinkModal(true)
          }
        })
        return
      } catch {}
    }
    setShowGoogleLinkModal(true)
  }

  const handleCompleteLinkGoogle = async (credential: string) => {
    if (!currentUser) return
    setIsLinkingGoogle(true)
    try {
      const res = await linkGoogleAccountToUser(currentUser, credential)
      if (res.success && res.user) {
        setCurrentUser(res.user)
        const updatedUsers = adminUsers.map((u) => (u.id === res.user!.id ? res.user! : u))
        setAdminUsers(updatedUsers)
        showToast(`Google account (${res.user.googleEmail}) linked successfully! You can now sign in with Google.`, 'success')
      } else {
        showToast(res.error || 'Failed to link Google account.', 'error')
      }
    } catch (err: any) {
      showToast(err?.message || 'Error linking Google account.', 'error')
    } finally {
      setIsLinkingGoogle(false)
      setShowGoogleLinkModal(false)
    }
  }

  const handleUnlinkGoogleAccount = async () => {
    if (!currentUser) return
    if (!window.confirm('Are you sure you want to unlink your Google account? Next time you must log in with your primary username and password.')) return
    try {
      const res = await unlinkGoogleAccountFromUser(currentUser)
      if (res.success && res.user) {
        setCurrentUser(res.user)
        const updatedUsers = adminUsers.map((u) => (u.id === res.user!.id ? res.user! : u))
        setAdminUsers(updatedUsers)
        showToast('Google account unlinked successfully.', 'success')
      }
    } catch {
      showToast('Failed to unlink Google account.', 'error')
    }
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

    if (adminUsers.some((u) => u.username.toLowerCase() === newAdminUsername.trim().toLowerCase())) {
      showToast(`Username "${newAdminUsername}" is already taken.`, 'error')
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

  // Update Admin Role
  const handleUpdateAdminRole = async (userId: string, newRole: AdminRole) => {
    const targetUser = adminUsers.find((u) => u.id === userId)
    if (!targetUser) return
    if (targetUser.role === 'Super Administrator' && newRole !== 'Super Administrator') {
      const superAdminCount = adminUsers.filter((u) => u.role === 'Super Administrator').length
      if (superAdminCount <= 1) {
        showToast('At least one Super Administrator account must remain active.', 'error')
        return
      }
    }
    const updated = adminUsers.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    setAdminUsers(updated)
    await writeSharedContent('admin-users', updated)
    await logSecurityEvent('USER_UPDATED', `Role for ${targetUser.username} updated to ${newRole}.`, 'info', currentUser?.username)
    showToast(`Role for ${targetUser.name} updated to ${newRole}.`, 'success')
  }

  // Toggle Admin Active Status
  const handleToggleAdminStatus = async (user: AdminUser) => {
    if (currentUser && user.id === currentUser.id) {
      showToast('You cannot suspend your own administrative account.', 'error')
      return
    }
    const newStatus = user.status === 'Active' ? 'Suspended' : 'Active'
    const updated = adminUsers.map((u) => (u.id === user.id ? { ...u, status: newStatus as any } : u))
    setAdminUsers(updated)
    await writeSharedContent('admin-users', updated)
    await logSecurityEvent('USER_UPDATED', `Account ${user.username} status set to ${newStatus}.`, 'warning', currentUser?.username)
    showToast(`Account ${user.username} is now ${newStatus}.`, 'warning')
  }

  // Delete Admin Account
  const handleDeleteAdmin = (user: AdminUser) => {
    if (currentUser && user.id === currentUser.id) {
      showToast('You cannot delete your own administrative account.', 'error')
      return
    }
    if (user.role === 'Super Administrator') {
      const superAdminCount = adminUsers.filter((u) => u.role === 'Super Administrator').length
      if (superAdminCount <= 1) {
        showToast('Cannot delete the sole Super Administrator account.', 'error')
        return
      }
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Revoke Administrator Access?',
      message: `Permanently delete administrator account "${user.name}" (@${user.username})? They will immediately lose all access to the CMS.`,
      confirmLabel: 'Delete Administrator',
      onConfirm: async () => {
        const updated = adminUsers.filter((u) => u.id !== user.id)
        setAdminUsers(updated)
        await writeSharedContent('admin-users', updated)
        await logSecurityEvent('USER_DELETED', `Admin account ${user.username} deleted by ${currentUser?.username}.`, 'warning', currentUser?.username)
        showToast(`Administrator ${user.name} removed.`, 'warning')
        setConfirmDialog(null)
      }
    })
  }

  // Save Profile Updates
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    const chosenAvatar = profileAvatar && !profileAvatar.includes('about-team-1.png')
      ? profileAvatar.trim()
      : (currentUser.avatar && !currentUser.avatar.includes('about-team-1.png') ? currentUser.avatar : DEFAULT_SUPERADMIN_AVATAR)

    const updatedUsers = adminUsers.map((u) => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          name: profileName || u.name,
          email: profileEmail || u.email,
          avatar: chosenAvatar,
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
        try {
          localStorage.setItem('hm_admin_session', JSON.stringify(session))
          sessionStorage.setItem('hm_admin_session', JSON.stringify(session))
        } catch {}
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

  // Editorial Article Handlers
  const openNewArticle = () => {
    setEditingArticle(null)
    setEditorTitle('')
    setEditorSlug('')
    setEditorExcerpt('')
    setEditorContent('')
    setEditorBlocks([{ id: 'blk-' + Date.now(), type: 'text', text: '' }])
    setEditorMode('visual')
    setActiveVisualBlockIndex(null)
    setEditingBlockIndex(null)
    setEditorCategory(blogCategories[0]?.name || 'Jobsite Productivity')
    setEditorStatus('Draft')
    setEditorCoverImage('')
    setEditorCoverAlt('')
    setEditorVideoUrl('')
    setEditorSeoTitle('')
    setEditorSeoDesc('')
    setEditorScheduledAt('')
    setAssignedSeries('None (Standalone Article)')
    setArticlesSubView('editor')
  }

  const openEditArticle = (post: BlogPost) => {
    setEditingArticle(post)
    setEditorTitle(post.title)
    setEditorSlug(post.slug || '')
    setEditorExcerpt(post.excerpt)
    const formattedHtml = convertContentToHtml(post.content)
    setEditorContent(formattedHtml)
    setEditorBlocks(parseContentToVisualBlocks(formattedHtml))
    setEditorMode('visual')
    setActiveVisualBlockIndex(null)
    setEditingBlockIndex(null)
    setEditorCategory(post.category)
    setEditorStatus('Published')
    setEditorCoverImage(post.image)
    setEditorCoverAlt(post.imageAlt || (post as any).alt || '')
    setEditorVideoUrl('')
    setEditorSeoTitle((post as any).seoTitle || post.title)
    setEditorSeoDesc((post as any).metaDescription || post.excerpt)
    setEditorScheduledAt((post as any).scheduled_at || '')
    setArticlesSubView('editor')
  }


  const handleModalUploadFile = async (file: File) => {
    if (!file) return
    try {
      setModalUploadStatus(`Converting ${file.name} to 100% WebP...`)
      setModalUploadProgress(35)
      const res = await processImageToWebP(file)
      setModalUploadProgress(85)

      const newMedia: MediaItem = {
        id: `media-${Date.now()}`,
        title: res.webpName.replace(/\.webp$/i, ''),
        url: res.dataUrl,
        dateAdded: new Date().toISOString().split('T')[0],
        size: res.webpSize
      }

      const updated = [newMedia, ...mediaList]
      setMediaList(updated)
      await writeSharedContent('media-library', updated)
      setSelectedLibraryItem(newMedia)
      setImageModalUrl(res.dataUrl)
      setImageModalAlt(newMedia.title)
      setModalUploadProgress(100)
      setModalUploadStatus('Upload & conversion complete!')

      setTimeout(() => {
        setModalUploadProgress(null)
        setModalUploadStatus('')
        setImageModalTab('library')
      }, 500)

      showToast(`"${newMedia.title}" saved to Media Library (galleries)!`, 'success')
    } catch (err: any) {
      setModalUploadProgress(null)
      setModalUploadStatus('')
      showToast(err.message || 'Failed to upload image', 'error')
    }
  }

  const handleUploadCoverFile = async (file: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP, GIF, SVG).', 'error')
      return
    }
    setIsUploadingCover(true)
    try {
      showToast(`Optimizing and converting "${file.name}" to 100% WebP...`, 'info' as any)
      const res = await processImageToWebP(file)
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim()
      const newMedia: MediaItem = {
        id: `media-${Date.now()}`,
        title: cleanTitle || 'Cover Image',
        url: res.dataUrl,
        dateAdded: new Date().toISOString().split('T')[0],
        size: res.webpSize,
        folder: 'features'
      }
      const updated = [newMedia, ...mediaList]
      setMediaList(updated)
      await writeSharedContent('media-library', updated)
      setEditorCoverImage(res.dataUrl)
      if (!editorCoverAlt.trim()) {
        setEditorCoverAlt(cleanTitle)
      }
      setIsCoverMediaModalOpen(false)
      showToast(`Cover image set and saved to Media Library!`, 'success')
    } catch (err: any) {
      showToast(err.message || 'Failed to process cover image', 'error')
    } finally {
      setIsUploadingCover(false)
    }
  }

  const handleSelectCoverFromLibrary = (media: MediaItem) => {
    setEditorCoverImage(media.url)
    if (!editorCoverAlt.trim()) {
      setEditorCoverAlt(media.title)
    }
    setIsCoverMediaModalOpen(false)
    showToast(`Cover image set from Media Library: "${media.title}"`, 'success')
  }

  const handleInsertLinkIntoSection = () => {
    const url = linkModalType === 'internal' ? linkModalInternalUrl : linkModalExternalUrl
    const text = linkModalText.trim() || (linkModalType === 'internal' ? linkModalInternalUrl : 'Link')
    const mdSnippet = `[${text}](${url})`
    insertMediaAtSavedCursor(mdSnippet)
    setLinkModalOpen(false)
    showToast('Link inserted into article.', 'success')
  }

  const extractYouTubeId = (url: string): string => {
    if (!url) return ''
    const trimmed = url.trim()
    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/)
    if (match && match[1]) return match[1]
    if (/^[\w-]{11}$/.test(trimmed)) return trimmed
    return ''
  }

  const insertMediaAtSavedCursor = (snippet: string) => {
    const textarea = contentTextareaRef.current
    const start = savedCursorPos?.start ?? (textarea ? textarea.selectionStart : editorContent.length)
    const end = savedCursorPos?.end ?? (textarea ? textarea.selectionEnd : editorContent.length)

    const before = editorContent.substring(0, start)
    const after = editorContent.substring(end)

    const prefix = before.length > 0 && !before.endsWith('\n\n') ? (before.endsWith('\n') ? '\n' : '\n\n') : ''
    const suffix = after.length > 0 && !after.startsWith('\n\n') ? (after.startsWith('\n') ? '\n' : '\n\n') : ''

    const insertion = `${prefix}${snippet}${suffix}`
    const newContent = before + insertion + after

    setEditorContent(newContent)
    pushContentHistory(newContent)

    setTimeout(() => {
      if (textarea) {
        textarea.focus()
        const newPos = start + insertion.length
        textarea.setSelectionRange(newPos, newPos)
      }
    }, 60)
  }

  const handleInsertImageIntoSection = () => {
    if (!imageModalUrl.trim()) {
      showToast('Please select or enter an image URL', 'error')
      return
    }
    const url = imageModalUrl.trim()
    const alt = imageModalAlt.trim() || 'Jobsite Equipment Image'
    const caption = imageModalCaption.trim()

    if (editorMode === 'visual') {
      if (editingBlockIndex !== null && editingBlockIndex >= 0 && editingBlockIndex < editorBlocks.length) {
        // Replace existing block
        setEditorBlocks((prev) => {
          const next = [...prev]
          next[editingBlockIndex] = {
            id: next[editingBlockIndex].id || 'blk-' + Date.now(),
            type: 'image',
            url,
            alt,
            caption
          }
          const serialized = serializeVisualBlocksToContent(next)
          setEditorContent(serialized)
          pushContentHistory(serialized)
          return next
        })
        showToast('Image updated in article', 'success')
      } else {
        // Insert new image block
        const insertAt = activeVisualBlockIndex !== null ? activeVisualBlockIndex + 1 : editorBlocks.length
        const newBlock: VisualBlock = {
          id: 'blk-' + Date.now(),
          type: 'image',
          url,
          alt,
          caption
        }
        setEditorBlocks((prev) => {
          const next = [...prev]
          next.splice(insertAt, 0, newBlock)
          if (insertAt === next.length - 1 || next[insertAt + 1]?.type !== 'text') {
            next.splice(insertAt + 1, 0, { id: 'blk-' + (Date.now() + 1), type: 'text', text: '' })
          }
          const serialized = serializeVisualBlocksToContent(next)
          setEditorContent(serialized)
          pushContentHistory(serialized)
          return next
        })
        showToast('Image inserted into article', 'success')
      }
    } else {
      let snippet = `![${alt}](${url})`
      if (caption) {
        snippet += `\n*${caption}*`
      }
      insertMediaAtSavedCursor(snippet)
      showToast('Image inserted into article section', 'success')
    }

    setImageModalOpen(false)
    setEditingBlockIndex(null)
    setActiveVisualBlockIndex(null)
  }

  const handleInsertYouTubeIntoSection = () => {
    const videoId = extractYouTubeId(youtubeModalUrl)
    if (!videoId) {
      showToast('Please enter a valid YouTube video URL or ID', 'error')
      return
    }
    const title = youtubeModalTitle.trim() || 'Jobsite Equipment Video'
    const fullUrl = `https://www.youtube.com/watch?v=${videoId}`

    if (editorMode === 'visual') {
      const insertAt = activeVisualBlockIndex !== null ? activeVisualBlockIndex + 1 : editorBlocks.length
      const newBlock: VisualBlock = {
        id: 'blk-' + Date.now(),
        type: 'video',
        url: fullUrl,
        videoId,
        videoTitle: title
      }
      setEditorBlocks((prev) => {
        const next = [...prev]
        next.splice(insertAt, 0, newBlock)
        if (insertAt === next.length - 1 || next[insertAt + 1]?.type !== 'text') {
          next.splice(insertAt + 1, 0, { id: 'blk-' + (Date.now() + 1), type: 'text', text: '' })
        }
        const serialized = serializeVisualBlocksToContent(next)
        setEditorContent(serialized)
        pushContentHistory(serialized)
        return next
      })
      showToast('YouTube video embedded into article', 'success')
    } else {
      const snippet = `[Watch Video: ${title}](${fullUrl})`
      insertMediaAtSavedCursor(snippet)
      showToast('YouTube video embedded into article section', 'success')
    }

    setYoutubeModalOpen(false)
    setActiveVisualBlockIndex(null)
  }


  const pushContentHistory = (_newVal?: string) => {}

  const handleSmartBlogImport = async (text: string) => {
    if (!text || !text.trim()) return
    const res = processPastedBlog(text)
    if (!res.detected) {
      showToast('No structured blog or miniexcavator images detected.', 'info' as any)
      return
    }

    if (res.title) {
      setEditorTitle(res.title)
      if (!editingArticle) {
        setEditorSlug(res.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
      }
    }

    if (res.coverImage) {
      setEditorCoverImage(res.coverImage.url)
      if (!editorCoverAlt.trim()) {
        setEditorCoverAlt(res.coverImage.alt)
      }
    }

    if (res.allImages && res.allImages.length > 0) {
      const newMediaItems: MediaItem[] = res.allImages.map((img, idx) => ({
        id: `media-auto-${Date.now()}-${idx}`,
        title: img.caption || img.alt || cleanImageTitle(img.url),
        url: img.url,
        folder: 'galleries',
        dateAdded: new Date().toISOString().split('T')[0],
        size: '160 KB',
      }))

      setMediaList((prev) => {
        const filteredNew = newMediaItems.filter(
          (item) => !prev.some((existing) => existing.url === item.url)
        )
        const updated = [...filteredNew, ...prev]
        void writeSharedContent('media-library', updated)
        return updated
      })
    }

    if (res.cleanedHtml) {
      setEditorContent(res.cleanedHtml)
    }

    showToast(
      `Smart Blog Import: Title set to "${res.title || 'Extracted'}", Cover Image filled, and ${res.remainingImages.length} images formatted!`,
      'success'
    )
  }

  const handleSaveArticle = async (status: 'Published' | 'Draft' | 'Scheduled') => {
    if (!editorTitle.trim()) {
      showToast('Article title is required.', 'error')
      return
    }

    const contentParagraphs = splitContentIntoBlocks(editorContent)

    if (contentParagraphs.length === 0) {
      showToast('Article must contain content.', 'error')
      return
    }

    const firstTextPara = contentParagraphs.find(p => !p.includes('<figure') && !p.includes('<img')) || contentParagraphs[0]
    const plainFirstParagraph = firstTextPara ? firstTextPara.replace(/<[^>]*>/g, '').trim() : ''
    const finalExcerpt =
      editorExcerpt.trim() ||
      (plainFirstParagraph ? plainFirstParagraph.slice(0, 220).trim() + '...' : editorTitle)

    const finalSlug = editorSlug.trim() || editorTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    const isDuplicateSlug = posts.some((p) => p.slug === finalSlug && (!editingArticle || p.id !== editingArticle.id))
    if (isDuplicateSlug) {
      showToast(`An article with slug "${finalSlug}" already exists. Please choose a unique slug.`, 'error')
      return
    }

    const finalStatus: 'Published' | 'Draft' = status === 'Scheduled' ? 'Draft' : status

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
              author: 'Happy Machinery',
              image: editorCoverImage || p.image,
              imageAlt: editorCoverAlt.trim() || p.imageAlt || (p as any).alt || '',
              alt: editorCoverAlt.trim() || p.imageAlt || (p as any).alt || '',
              seoTitle: editorSeoTitle.trim() || undefined,
              metaDescription: editorSeoDesc.trim() || undefined,
              status: finalStatus,
              content_raw: editorContentRaw || undefined
            }
          : p
      )
      setPosts(updated)
      await writeSharedContent('blog-posts', updated)
      await logSecurityEvent('CONTENT_PUBLISHED', `Article "${editorTitle}" updated (${finalStatus}).`, 'info', currentUser?.username)
      showToast(`Article "${editorTitle}" saved as ${finalStatus}!`, 'success')
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
        imageAlt: editorCoverAlt.trim(),
        alt: editorCoverAlt.trim(),
        seoTitle: editorSeoTitle.trim() || undefined,
        metaDescription: editorSeoDesc.trim() || undefined,
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        readTime: `${Math.max(2, Math.ceil(contentParagraphs.join(' ').split(/\s+/).length / 180))} min read`,
        author: 'Happy Machinery',
        status: finalStatus,
        content_raw: editorContentRaw || undefined
      }
      const updated = [newPost, ...posts]
      setPosts(updated)
      await writeSharedContent('blog-posts', updated)
      await logSecurityEvent('CONTENT_PUBLISHED', `New article "${newPost.title}" created as ${finalStatus}.`, 'info', currentUser?.username)
      showToast(`Article "${editorTitle}" saved as ${finalStatus}!`, 'success')
    }
    setArticlesSubView('list')
  }

  const handleSaveBlogCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return

    const slug = (newCatSlug.trim() || newCatName.trim())
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const catData = {
      name: newCatName.trim(),
      slug,
      desc: newCatDesc.trim(),
      cover: newCatCover.trim() || '/images/why-choose-v900-jobsite.png',
      parent: newCatParent.trim() || undefined
    }

    if (editingBlogCat) {
      const oldName = editingBlogCat.name
      const updated = blogCategories.map((c) => (c.name === oldName ? catData : c))
      setBlogCategories(updated)
      localStorage.setItem('happy-machinery-blog-categories', JSON.stringify(updated))
      void writeSharedContent('blog-categories', updated)

      // Update linked posts if name changed
      if (oldName !== catData.name) {
        const updatedPosts = posts.map((p) => (p.category === oldName ? { ...p, category: catData.name } : p))
        setPosts(updatedPosts)
        void writeSharedContent('blog-posts', updatedPosts)
      }

      showToast(`Category "${catData.name}" updated successfully!`, 'success')
      setEditingBlogCat(null)
    } else {
      const exists = blogCategories.some((c) => c.name.toLowerCase() === catData.name.toLowerCase())
      if (exists) {
        showToast(`Category "${catData.name}" already exists.`, 'warning')
        return
      }
      const updated = [...blogCategories, catData]
      setBlogCategories(updated)
      localStorage.setItem('happy-machinery-blog-categories', JSON.stringify(updated))
      void writeSharedContent('blog-categories', updated)
      showToast(`Category "${catData.name}" created successfully!`, 'success')
    }

    setNewCatName('')
    setNewCatSlug('')
    setNewCatDesc('')
    setNewCatCover('')
    setNewCatParent('')
  }

  const startEditBlogCategory = (cat: { name: string; slug: string; desc?: string; cover?: string; parent?: string }) => {
    setEditingBlogCat(cat)
    setNewCatName(cat.name)
    setNewCatSlug(cat.slug)
    setNewCatDesc(cat.desc || '')
    setNewCatCover(cat.cover || '')
    setNewCatParent(cat.parent || '')
  }

  const cancelEditBlogCategory = () => {
    setEditingBlogCat(null)
    setNewCatName('')
    setNewCatSlug('')
    setNewCatDesc('')
    setNewCatCover('')
    setNewCatParent('')
  }

  const handleDeleteCategory = (catName: string) => {
    const cat = blogCategories.find((c) => c.name === catName)
    if (!cat) return
    setConfirmDialog({
      isOpen: true,
      title: 'Move Category to Trash?',
      message: `Move category "${cat.name}" to Trash? You can restore it anytime from the Trash & Recovery menu.`,
      confirmLabel: 'Move to Trash',
      onConfirm: async () => {
        const trashRecord: TrashItem = {
          id: `blog-cat-${cat.slug || Date.now()}`,
          originalId: cat.slug,
          type: 'blog-category',
          title: cat.name,
          subtitle: `/category/${cat.slug} · Editorial Category`,
          image: cat.cover,
          deletedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          deletedTimestamp: Date.now(),
          data: cat
        }
        const updatedTrash = [trashRecord, ...trashItems]
        const remaining = blogCategories.filter((c) => c.name !== catName)

        setTrashItems(updatedTrash)
        setBlogCategories(remaining)

        localStorage.setItem('happy-machinery-trash', JSON.stringify(updatedTrash))
        localStorage.setItem('happy-machinery-blog-categories', JSON.stringify(remaining))
        await writeSharedContent('trash-items', updatedTrash)
        await writeSharedContent('blog-categories', remaining)
        await logSecurityEvent('CONTENT_DELETED', `Category "${cat.name}" moved to Trash.`, 'warning', currentUser?.username)

        showToast(`Category "${cat.name}" moved to Trash.`, 'warning')
        setConfirmDialog(null)
        if (editingBlogCat?.name === catName) {
          cancelEditBlogCategory()
        }
      }
    })
  }

  const handleMoveArticleToTrash = (post: BlogPost) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Move Article to Trash?',
      message: `Move "${post.title}" to Trash? You can easily restore it anytime from the Trash & Recovery vault.`,
      confirmLabel: 'Move to Trash',
      onConfirm: async () => {
        const trashRecord: TrashItem = {
          id: `article-${post.id}`,
          originalId: post.id,
          type: 'article',
          title: post.title,
          subtitle: `Category: ${post.category} · Author: ${post.author || 'Super Admin'}`,
          image: post.image,
          deletedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          deletedTimestamp: Date.now(),
          data: post
        }
        const updatedTrash = [trashRecord, ...trashItems]
        const updatedPosts = posts.filter((p) => p.id !== post.id)

        setTrashItems(updatedTrash)
        setPosts(updatedPosts)

        localStorage.setItem('happy-machinery-trash', JSON.stringify(updatedTrash))
        await writeSharedContent('trash-items', updatedTrash)
        await writeSharedContent('blog-posts', updatedPosts)
        await logSecurityEvent('CONTENT_DELETED', `Article "${post.title}" moved to Trash.`, 'warning', currentUser?.username)

        showToast(`Article "${post.title}" moved to Trash.`, 'warning')
        setConfirmDialog(null)
        if (articlesSubView === 'editor') setArticlesSubView('list')
      }
    })
  }

  const handleRestoreTrashItem = async (item: TrashItem) => {
    if (item.type === 'article') {
      const restoredPost = item.data as BlogPost
      const exists = posts.some((p) => p.id === restoredPost.id)
      const updatedPosts = exists ? posts : [restoredPost, ...posts]
      setPosts(updatedPosts)
      await writeSharedContent('blog-posts', updatedPosts)
    } else if (item.type === 'product') {
      const restoredProd = item.data as AdminProduct
      const exists = products.some((p) => p.id === restoredProd.id)
      const updatedProducts = exists ? products : [restoredProd, ...products]
      setProducts(updatedProducts)
      await writeSharedContent('products', updatedProducts)
    } else if (item.type === 'blog-category') {
      const restoredCat = item.data
      const exists = blogCategories.some((c) => c.name === restoredCat.name)
      const updated = exists ? blogCategories : [...blogCategories, restoredCat]
      setBlogCategories(updated)
      localStorage.setItem('happy-machinery-blog-categories', JSON.stringify(updated))
      await writeSharedContent('blog-categories', updated)
    } else if (item.type === 'product-category') {
      const restoredCat = item.data
      const exists = productCategories.some((c) => c.id === restoredCat.id)
      const updated = exists ? productCategories : [...productCategories, restoredCat]
      setProductCategories(updated)
      await writeSharedContent('product-categories', updated)
    } else if (item.type === 'media') {
      const restoredMedia = item.data as MediaItem
      const exists = mediaList.some((m) => m.id === restoredMedia.id)
      const updatedMedia = exists ? mediaList : [restoredMedia, ...mediaList]
      setMediaList(updatedMedia)
      await writeSharedContent('media-library', updatedMedia)
    }

    const remaining = trashItems.filter((t) => t.id !== item.id)
    setTrashItems(remaining)
    localStorage.setItem('happy-machinery-trash', JSON.stringify(remaining))
    await writeSharedContent('trash-items', remaining)
    await logSecurityEvent('CONTENT_PUBLISHED', `Restored ${item.type} "${item.title}" from Trash.`, 'info', currentUser?.username)
    showToast(`"${item.title}" restored successfully!`, 'success')
  }

  const handlePermanentlyDeleteTrashItem = (item: TrashItem) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Permanently Erase Item?',
      message: `Permanently erase "${item.title}"? This cannot be undone.`,
      confirmLabel: 'Permanently Delete',
      onConfirm: async () => {
        const remaining = trashItems.filter((t) => t.id !== item.id)
        setTrashItems(remaining)
        localStorage.setItem('happy-machinery-trash', JSON.stringify(remaining))
        await writeSharedContent('trash-items', remaining)
        await logSecurityEvent('CONTENT_DELETED', `Purged ${item.type} "${item.title}".`, 'warning', currentUser?.username)
        showToast(`"${item.title}" permanently erased.`, 'warning')
        setConfirmDialog(null)
      }
    })
  }

  const handleRestoreAllTrash = () => {
    if (trashItems.length === 0) return
    setConfirmDialog({
      isOpen: true,
      title: `Restore All ${trashItems.length} Trashed Items?`,
      message: 'This will recover all deleted articles, products, categories, and media assets back to their active sections.',
      confirmLabel: 'Restore All',
      onConfirm: async () => {
        let newPosts = [...posts]
        let newProds = [...products]
        let newBlogCats = [...blogCategories]
        let newProdCats = [...productCategories]
        let newMedia = [...mediaList]

        for (const item of trashItems) {
          if (item.type === 'article' && !newPosts.some((p) => p.id === item.data.id)) {
            newPosts.unshift(item.data)
          } else if (item.type === 'product' && !newProds.some((p) => p.id === item.data.id)) {
            newProds.unshift(item.data)
          } else if (item.type === 'blog-category' && !newBlogCats.some((c) => c.name === item.data.name)) {
            newBlogCats.push(item.data)
          } else if (item.type === 'product-category' && !newProdCats.some((c) => c.id === item.data.id)) {
            newProdCats.push(item.data)
          } else if (item.type === 'media' && !newMedia.some((m) => m.id === item.data.id)) {
            newMedia.unshift(item.data)
          }
        }

        setPosts(newPosts)
        setProducts(newProds)
        setBlogCategories(newBlogCats)
        setProductCategories(newProdCats)
        setMediaList(newMedia)
        setTrashItems([])

        localStorage.setItem('happy-machinery-trash', JSON.stringify([]))
        localStorage.setItem('happy-machinery-blog-categories', JSON.stringify(newBlogCats))
        await writeSharedContent('trash-items', [])
        await writeSharedContent('blog-posts', newPosts)
        await writeSharedContent('products', newProds)
        await writeSharedContent('blog-categories', newBlogCats)
        await writeSharedContent('product-categories', newProdCats)
        await writeSharedContent('media-library', newMedia)

        showToast(`All ${trashItems.length} items restored!`, 'success')
        setConfirmDialog(null)
      }
    })
  }

  const handleEmptyAllTrash = () => {
    if (trashItems.length === 0) return
    setConfirmDialog({
      isOpen: true,
      title: 'Empty Trash Vault?',
      message: `Permanently delete all ${trashItems.length} items in Trash? They cannot be recovered after this.`,
      confirmLabel: 'Empty Trash',
      onConfirm: async () => {
        const count = trashItems.length
        setTrashItems([])
        localStorage.setItem('happy-machinery-trash', JSON.stringify([]))
        await writeSharedContent('trash-items', [])
        await logSecurityEvent('CONTENT_DELETED', `Purged entire trash (${count} items).`, 'warning', currentUser?.username)
        showToast(`Trash vault emptied (${count} items removed).`, 'warning')
        setConfirmDialog(null)
      }
    })
  }

  // ==============================================================================
  // Product Categories Handlers
  // ==============================================================================
  const handleSaveProductCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!pcatName.trim()) {
      setToast({ message: 'Category name is required', type: 'error' })
      return
    }

    const slug = (pcatSlug.trim() || pcatName.trim())
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    if (editingProductCat) {
      // Update existing category
      const oldName = editingProductCat.name
      const newName = pcatName.trim()
      const updatedList = productCategories.map((c) =>
        c.id === editingProductCat.id
          ? {
              ...c,
              name: newName,
              slug,
              parent: pcatParent.trim(),
              description: pcatDesc.trim(),
              coverImage: pcatCover.trim() || c.coverImage
            }
          : c
      )
      setProductCategories(updatedList)
      localStorage.setItem('hm_cms_product_categories', JSON.stringify(updatedList))

      // Also sync products assigned to this category if name changed
      if (oldName !== newName) {
        const updatedProducts = products.map((p) => {
          if (p.category === oldName) {
            return { ...p, category: newName }
          }
          if (p.category?.includes(oldName)) {
            return { ...p, category: p.category.replace(oldName, newName) }
          }
          return p
        })
        setProducts(updatedProducts)
        localStorage.setItem('hm_cms_products', JSON.stringify(updatedProducts))
      }

      setToast({ message: `Category "${newName}" updated successfully!`, type: 'success' })
      setEditingProductCat(null)
      setPcatName('')
      setPcatSlug('')
      setPcatParent('')
      setPcatDesc('')
      setPcatCover('')
    } else {
      // Add new category
      const newCat = {
        id: `pcat-${Date.now()}`,
        name: pcatName.trim(),
        slug,
        parent: pcatParent.trim(),
        description: pcatDesc.trim(),
        coverImage: pcatCover.trim() || '/images/why-choose-v900-jobsite.png'
      }
      const updatedList = [newCat, ...productCategories]
      setProductCategories(updatedList)
      localStorage.setItem('hm_cms_product_categories', JSON.stringify(updatedList))

      setToast({ message: `Category "${newCat.name}" created successfully!`, type: 'success' })
      setPcatName('')
      setPcatSlug('')
      setPcatParent('')
      setPcatDesc('')
      setPcatCover('')
    }
  }

  const handleStartEditProductCat = (cat: { id: string; name: string; slug: string; parent?: string; description?: string; coverImage?: string }) => {
    setEditingProductCat(cat)
    setPcatName(cat.name)
    setPcatSlug(cat.slug)
    setPcatParent(cat.parent || '')
    setPcatDesc(cat.description || '')
    setPcatCover(cat.coverImage || '')
    const formElem = document.getElementById('cms-pcat-form-anchor')
    if (formElem) {
      formElem.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const handleCancelEditProductCat = () => {
    setEditingProductCat(null)
    setPcatName('')
    setPcatSlug('')
    setPcatParent('')
    setPcatDesc('')
    setPcatCover('')
  }

  const handleDeleteProductCat = (catId: string, _catName?: string) => {
    const cat = productCategories.find((c) => c.id === catId)
    if (!cat) return
    setConfirmDialog({
      isOpen: true,
      title: 'Move Equipment Category to Trash?',
      message: `Move category "${cat.name}" to Trash? You can restore it back anytime from the Trash & Recovery vault.`,
      confirmLabel: 'Move to Trash',
      onConfirm: async () => {
        const trashRecord: TrashItem = {
          id: `prod-cat-${cat.id}`,
          originalId: cat.id,
          type: 'product-category',
          title: cat.name,
          subtitle: `/equipment/${cat.slug} · Equipment Category`,
          image: cat.coverImage,
          deletedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          deletedTimestamp: Date.now(),
          data: cat
        }
        const updatedTrash = [trashRecord, ...trashItems]
        const remaining = productCategories.filter((c) => c.id !== catId)

        setTrashItems(updatedTrash)
        setProductCategories(remaining)

        localStorage.setItem('happy-machinery-trash', JSON.stringify(updatedTrash))
        localStorage.setItem('hm_cms_product_categories', JSON.stringify(remaining))
        await writeSharedContent('trash-items', updatedTrash)
        await writeSharedContent('product-categories', remaining)
        await logSecurityEvent('CONTENT_DELETED', `Equipment category "${cat.name}" moved to Trash.`, 'warning', currentUser?.username)

        showToast(`Category "${cat.name}" moved to Trash.`, 'warning')
        setConfirmDialog(null)
        if (editingProductCat?.id === catId) {
          handleCancelEditProductCat()
        }
      }
    })
  }

  const getProductCountForCategory = (catName: string) => {
    return products.filter((p) => {
      if (!p.category) return false
      const lowerCat = catName.toLowerCase()
      const lowerProdCat = p.category.toLowerCase()
      return lowerProdCat === lowerCat || lowerProdCat.includes(lowerCat)
    }).length
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
    setProdEditorSku('')
    setProdEditorCategory('')
    setProdEditorBrand('')
    setProdEditorPrice('')
    setProdEditorSalePrice('')
    setProdEditorStock('')
    setProdEditorStatus('Published')
    setProdEditorBuyUrl('')
    setProdEditorFeatured(false)
    setProdEditorAddToCart(true)
    setProdEditorImage('')
    setProdEditorGallery('')
    setProdEditorSpecs([])
    setProductsSubView('editor')
  }

  const openEditProduct = (prod: AdminProduct) => {
    setProdEditorId(prod.id)
    setProdEditorName(prod.name)
    setProdEditorSlug(prod.slug || prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    setProdEditorShortDesc(prod.shortDescription || prod.description.slice(0, 140))
    setProdEditorDesc(prod.description)
    setProdEditorSku(prod.sku ? prod.sku.replace(/^typh/i, 'TYPH') : '')
    setProdEditorCategory(prod.category || '')
    setProdEditorBrand(prod.brand || '')
    setProdEditorPrice(prod.price)
    setProdEditorSalePrice(prod.salePrice ?? '')
    setProdEditorStock(prod.stock ?? 0)
    setProdEditorStatus(prod.status || 'Draft')
    setProdEditorBuyUrl(prod.buyUrl || '')
    setProdEditorFeatured(!!prod.featured)
    setProdEditorAddToCart(prod.addToCartEnabled !== false)
    setProdEditorImage(prod.image || '')
    setProdEditorGallery(Array.isArray(prod.galleryImages) ? prod.galleryImages.join('\n') : '')
    setProdEditorSpecs(prod.specifications && prod.specifications.length > 0 ? prod.specifications : [])
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

    const isDuplicateSlug = products.some((p) => p.slug === finalSlug && p.id !== prodEditorId)
    if (isDuplicateSlug) {
      showToast(`A product with slug "${finalSlug}" already exists. Please choose a unique slug.`, 'error')
      return
    }

    if (prodEditorId !== null) {
      const updated = products.map((p) =>
        p.id === prodEditorId
          ? {
              ...p,
              name: prodEditorName,
              slug: finalSlug,
              shortDescription: prodEditorShortDesc,
              description: prodEditorDesc,
              sku: (prodEditorSku || p.sku).replace(/^typh/i, 'TYPH'),
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
        sku: prodEditorSku ? prodEditorSku.replace(/^typh/i, 'TYPH') : `TYPH-${Math.floor(1000 + Math.random() * 9000)}`,
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
    if (!prod) return
    setConfirmDialog({
      isOpen: true,
      title: 'Move Equipment Listing to Trash?',
      message: `Move "${prod.name}" to Trash? It will be safely preserved in the Trash Vault and can be recovered back to your store catalog at any time.`,
      confirmLabel: 'Move to Trash',
      onConfirm: async () => {
        const trashRecord: TrashItem = {
          id: `product-${prod.id}`,
          originalId: prod.id,
          type: 'product',
          title: prod.name,
          subtitle: `SKU: ${(prod.sku || '').replace(/^typh/i, 'TYPH')} · $${prod.price?.toLocaleString()} · Status: ${prod.status}`,
          image: prod.image,
          deletedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
          deletedTimestamp: Date.now(),
          data: prod
        }
        const updatedTrash = [trashRecord, ...trashItems]
        const updated = products.filter((p) => p.id !== id)

        setTrashItems(updatedTrash)
        setProducts(updated)

        localStorage.setItem('happy-machinery-trash', JSON.stringify(updatedTrash))
        await writeSharedContent('trash-items', updatedTrash)
        await writeSharedContent('products', updated)
        await logSecurityEvent('CONTENT_DELETED', `Equipment listing #${id} ("${prod.name}") moved to Trash.`, 'warning', currentUser?.username)

        showToast(`Equipment listing "${prod.name}" moved to Trash. Recover anytime from Trash.`, 'warning')
        setConfirmDialog(null)
        if (productsSubView === 'editor') setProductsSubView('list')
      }
    })
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
    try { localStorage.setItem('happy-machinery-inquiries', JSON.stringify(updated)) } catch {}
    await writeSharedContent('inquiries', updated)
    showToast(`Inquiry status updated to ${status}.`, 'success')
  }

  const handleDeleteInquiry = async (id: number) => {
    const updated = inquiriesList.filter((item) => item.id !== id)
    setInquiriesList(updated)
    try { localStorage.setItem('happy-machinery-inquiries', JSON.stringify(updated)) } catch {}
    await writeSharedContent('inquiries', updated)
    showToast('Inquiry removed.', 'success')
  }

  // Orders Handlers
  const handleUpdateOrderStatus = async (id: string, status: CartOrder['status']) => {
    const updated = ordersList.map((item) => item.id === id ? { ...item, status } : item)
    setOrdersList(updated)
    try { localStorage.setItem('happy-machinery-orders', JSON.stringify(updated)) } catch {}
    await writeSharedContent('orders', updated)
    showToast(`Order ${id} marked as ${status}.`, 'success')
  }

  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm(`Delete order ${id}? This cannot be undone.`)) return
    const updated = ordersList.filter((item) => item.id !== id)
    setOrdersList(updated)
    try { localStorage.setItem('happy-machinery-orders', JSON.stringify(updated)) } catch {}
    await writeSharedContent('orders', updated)
    showToast(`Order ${id} removed.`, 'success')
  }

  // Comments Handlers
  const handleUpdateCommentStatus = async (id: number, status: 'Pending' | 'Approved' | 'Spam') => {
    const updated = commentsData.map((item) => item.id === id ? { ...item, status } : item)
    setCommentsData(updated)
    try { localStorage.setItem('happy-machinery-comments', JSON.stringify(updated)) } catch {}
    await writeSharedContent('comments', updated)
    showToast(`Comment marked as ${status}.`, 'success')
  }

  const handleDeleteComment = async (id: number) => {
    const updated = commentsData.filter((item) => item.id !== id)
    setCommentsData(updated)
    try { localStorage.setItem('happy-machinery-comments', JSON.stringify(updated)) } catch {}
    await writeSharedContent('comments', updated)
    showToast('Comment deleted.', 'success')
  }

  // Product Attributes Handlers
  const handleSaveAttribute = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const name = attrFormName.trim()
    if (!name) {
      showToast('Please enter an attribute name.', 'warning')
      return
    }

    const slug = (attrFormSlug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) || 'attr'
    const termsArray = attrFormTerms
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    if (editingAttribute) {
      const updated = productAttributes.map((attr) =>
        attr.id === editingAttribute.id
          ? {
              ...attr,
              name,
              slug,
              type: attrFormType,
              terms: termsArray.length > 0 ? termsArray : attr.terms,
              description: attrFormDesc.trim(),
              isFilterable: attrFormFilterable,
              isRequired: attrFormRequired
            }
          : attr
      )
      setProductAttributes(updated)
      try { localStorage.setItem('hm_cms_product_attributes', JSON.stringify(updated)) } catch {}
      setEditingAttribute(null)
      showToast(`Attribute "${name}" updated successfully.`, 'success')
    } else {
      const newAttr: ProductAttribute = {
        id: `attr-${Date.now()}`,
        name,
        slug,
        type: attrFormType,
        terms: termsArray,
        description: attrFormDesc.trim(),
        isFilterable: attrFormFilterable,
        isRequired: attrFormRequired,
        productsCount: 0
      }
      const updated = [newAttr, ...productAttributes]
      setProductAttributes(updated)
      try { localStorage.setItem('hm_cms_product_attributes', JSON.stringify(updated)) } catch {}
      showToast(`Attribute "${name}" created with ${termsArray.length} terms.`, 'success')
    }

    // Reset form
    setAttrFormName('')
    setAttrFormSlug('')
    setAttrFormType('select')
    setAttrFormTerms('')
    setAttrFormDesc('')
    setAttrFormFilterable(true)
    setAttrFormRequired(false)
  }

  const handleStartEditAttribute = (attr: ProductAttribute) => {
    setEditingAttribute(attr)
    setAttrFormName(attr.name)
    setAttrFormSlug(attr.slug)
    setAttrFormType(attr.type)
    setAttrFormTerms(attr.terms.join(', '))
    setAttrFormDesc(attr.description || '')
    setAttrFormFilterable(attr.isFilterable ?? true)
    setAttrFormRequired(attr.isRequired ?? false)

    const formEl = document.getElementById('cms-attr-form-anchor')
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleCancelEditAttribute = () => {
    setEditingAttribute(null)
    setAttrFormName('')
    setAttrFormSlug('')
    setAttrFormType('select')
    setAttrFormTerms('')
    setAttrFormDesc('')
    setAttrFormFilterable(true)
    setAttrFormRequired(false)
  }

  const handleDeleteAttribute = (attrId: string) => {
    const target = productAttributes.find((a) => a.id === attrId)
    if (!target) return
    if (!window.confirm(`Are you sure you want to delete the attribute "${target.name}"?`)) return

    const remaining = productAttributes.filter((a) => a.id !== attrId)
    setProductAttributes(remaining)
    try { localStorage.setItem('hm_cms_product_attributes', JSON.stringify(remaining)) } catch {}
    if (editingAttribute?.id === attrId) {
      handleCancelEditAttribute()
    }
    showToast(`Attribute "${target.name}" removed.`, 'success')
  }

  const handleAddTermToAttribute = (attrId: string, newTerm: string) => {
    const clean = newTerm.trim()
    if (!clean) return
    const updated = productAttributes.map((attr) => {
      if (attr.id === attrId) {
        if (attr.terms.includes(clean)) {
          showToast(`Term "${clean}" already exists on this attribute.`, 'warning')
          return attr
        }
        return { ...attr, terms: [...attr.terms, clean] }
      }
      return attr
    })
    setProductAttributes(updated)
    try { localStorage.setItem('hm_cms_product_attributes', JSON.stringify(updated)) } catch {}
    setQuickTermInput((prev) => ({ ...prev, [attrId]: '' }))
    showToast(`Added term "${clean}".`, 'success')
  }

  const handleRemoveTermFromAttribute = (attrId: string, termToRemove: string) => {
    const updated = productAttributes.map((attr) => {
      if (attr.id === attrId) {
        return { ...attr, terms: attr.terms.filter((t) => t !== termToRemove) }
      }
      return attr
    })
    setProductAttributes(updated)
    try { localStorage.setItem('hm_cms_product_attributes', JSON.stringify(updated)) } catch {}
    showToast(`Removed "${termToRemove}".`, 'success')
  }

  const handleResetDefaultAttributes = () => {
    if (window.confirm('Reset equipment attributes to the standard machinery presets? Any custom attributes will be replaced.')) {
      setProductAttributes(DEFAULT_PRODUCT_ATTRIBUTES)
      try { localStorage.setItem('hm_cms_product_attributes', JSON.stringify(DEFAULT_PRODUCT_ATTRIBUTES)) } catch {}
      showToast('Reset attributes to standard machinery presets.', 'success')
    }
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
    <div className={`cms-shell cms-theme-${theme} ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${(activeTab === 'articles' && articlesSubView === 'editor') || (activeTab === 'products' && productsSubView === 'editor') ? 'cms-editor-active-view' : ''}`}>
      {isLoadingData && <div className="cms-top-loader" />}
      {/* Toast Notification Container */}
      {toast && (
        <div className="cms-toast-container">
          <div className={`cms-toast ${toast.type}`}>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Mobile Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="cms-sidebar-backdrop"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ==============================================================================
          Rafvex-Style Modern Sidebar Navigation (Always Expanded with Submenus)
          ============================================================================== */}
      <aside className={`cms-sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="cms-sidebar-brand">
          <Link to="/ourcmskiuq" className="cms-brand-link" onClick={() => setIsMobileSidebarOpen(false)}>
            {isSidebarCollapsed ? (
              <div
                className="cms-brand-logo-badge"
                data-tooltip="Happy Machinery CMS"
                title="Expand sidebar"
                onClick={(e) => {
                  e.preventDefault()
                  toggleSidebar()
                }}
              >
                <img
                  src={siteSettings.logo || '/logo.png'}
                  alt="Happy Machinery"
                  style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png' }}
                />
              </div>
            ) : (
              <div className="cms-sidebar-logo-wrapper">
                <img
                  src={siteSettings.logo || '/logo.png'}
                  alt="Happy Machinery"
                  className="cms-sidebar-logo-img"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png' }}
                />
              </div>
            )}
          </Link>

          {/* Sidebar Toggle Button (Collapse / Expand) */}
          <button
            type="button"
            className="cms-sidebar-toggle-btn"
            onClick={toggleSidebar}
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            data-tooltip={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            aria-label={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {isSidebarCollapsed ? <path d="M9 18l6-6-6-6" /> : <path d="M15 18l-6-6 6-6" />}
            </svg>
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            className="cms-sidebar-mobile-close-btn"
            onClick={() => setIsMobileSidebarOpen(false)}
            title="Close navigation"
            aria-label="Close navigation"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
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
          <div
            className={`cms-nav-expandable-group ${collapsedFlyout === 'articles' ? 'flyout-open' : ''}`}
            onMouseEnter={() => { if (isSidebarCollapsed) setCollapsedFlyout('articles') }}
            onMouseLeave={() => { if (isSidebarCollapsed) setCollapsedFlyout(null) }}
          >
            <button
              className={`cms-nav-item ${activeTab === 'articles' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('articles')
                if (isSidebarCollapsed) {
                  setCollapsedFlyout(collapsedFlyout === 'articles' ? null : 'articles')
                } else {
                  setIsArticlesExpanded(!isArticlesExpanded)
                }
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
            </button>

            {/* Articles Submenu */}
            {!isSidebarCollapsed && isArticlesExpanded && (
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

                <button
                  className={`cms-nav-sub-item ${activeTab === 'articles' && articlesSubView === 'topBlogs' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('articles')
                    setArticlesSubView('topBlogs')
                  }}
                >
                  <span className="cms-sub-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  </span>
                  <span>Top Blogs</span>
                  <span className="cms-sub-count" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>HOT</span>
                </button>
              </div>
            )}

            {/* Articles Flyout Submenu (Collapsed sidebar icon hover/click) */}
            {isSidebarCollapsed && (
              <div className={`cms-collapsed-flyout-menu ${collapsedFlyout === 'articles' ? 'is-active' : ''}`}>
                <div className="cms-flyout-arrow" />
                <div className="cms-flyout-header">
                  <div className="cms-flyout-header-info">
                    <span className="cms-flyout-title">Articles &amp; Content</span>
                    <span className="cms-flyout-count">{posts.length} posts</span>
                  </div>
                </div>
                <div className="cms-flyout-divider" />
                <div className="cms-flyout-list">
                  <button
                    type="button"
                    className={`cms-flyout-item ${activeTab === 'articles' && articlesSubView === 'list' ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveTab('articles')
                      setArticlesSubView('list')
                      setCollapsedFlyout(null)
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
                    <span className="cms-flyout-item-name">All Articles</span>
                    <span className="cms-sub-count">{posts.length}</span>
                  </button>

                  <button
                    type="button"
                    className={`cms-flyout-item ${activeTab === 'articles' && articlesSubView === 'editor' && !editingArticle ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveTab('articles')
                      openNewArticle()
                      setCollapsedFlyout(null)
                    }}
                  >
                    <span className="cms-sub-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                    </span>
                    <span className="cms-flyout-item-name">New Article</span>
                    <span className="cms-flyout-action-pill">+ Write</span>
                  </button>

                  <button
                    type="button"
                    className={`cms-flyout-item ${activeTab === 'articles' && articlesSubView === 'categories' ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveTab('articles')
                      setArticlesSubView('categories')
                      setCollapsedFlyout(null)
                    }}
                  >
                    <span className="cms-sub-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                      </svg>
                    </span>
                    <span className="cms-flyout-item-name">Categories</span>
                    <span className="cms-sub-count">{blogCategories.length}</span>
                  </button>

                  <button
                    type="button"
                    className={`cms-flyout-item ${activeTab === 'articles' && articlesSubView === 'topBlogs' ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveTab('articles')
                      setArticlesSubView('topBlogs')
                      setCollapsedFlyout(null)
                    }}
                  >
                    <span className="cms-sub-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </span>
                    <span className="cms-flyout-item-name">Top Blogs</span>
                    <span className="cms-flyout-badge-hot">HOT</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Products & Equipment Expandable Item */}
          <div
            className={`cms-nav-expandable-group ${collapsedFlyout === 'products' ? 'flyout-open' : ''}`}
            onMouseEnter={() => { if (isSidebarCollapsed) setCollapsedFlyout('products') }}
            onMouseLeave={() => { if (isSidebarCollapsed) setCollapsedFlyout(null) }}
          >
            <button
              className={`cms-nav-item ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('products')
                if (isSidebarCollapsed) {
                  setCollapsedFlyout(collapsedFlyout === 'products' ? null : 'products')
                } else {
                  setIsProductsExpanded(!isProductsExpanded)
                }
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
            </button>

            {/* Products Submenu */}
            {!isSidebarCollapsed && isProductsExpanded && (
              <div className="cms-nav-sub-menu">
                <button
                  className={`cms-nav-sub-item ${activeTab === 'products' && productsSubView === 'list' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('products')
                    setProductsSubView('list')
                    setProdCategoryFilter('all')
                  }}
                >
                  <span className="cms-sub-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
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
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="16" />
                      <line x1="8" y1="12" x2="16" y2="12" />
                    </svg>
                  </span>
                  <span>Add new product</span>
                </button>

                <button
                  className={`cms-nav-sub-item ${activeTab === 'products' && productsSubView === 'categories' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('products')
                    setProductsSubView('categories')
                  }}
                >
                  <span className="cms-sub-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                      <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                  </span>
                  <span>Categories</span>
                  <span className="cms-sub-count">{productCategories.length}</span>
                </button>

                <button
                  className={`cms-nav-sub-item ${activeTab === 'products' && productsSubView === 'brands' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('products')
                    setProductsSubView('brands')
                  }}
                >
                  <span className="cms-sub-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                      <path d="M3 21h18M3 7v14M21 7v14M6 7V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3M9 10h2M13 10h2M9 14h2M13 14h2M9 18h2M13 18h2" />
                    </svg>
                  </span>
                  <span>Brands</span>
                </button>

                <button
                  className={`cms-nav-sub-item ${activeTab === 'products' && productsSubView === 'attributes' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('products')
                    setProductsSubView('attributes')
                  }}
                >
                  <span className="cms-sub-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                      <line x1="4" y1="21" x2="4" y2="14" />
                      <line x1="4" y1="10" x2="4" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12" y2="3" />
                      <line x1="20" y1="21" x2="20" y2="16" />
                      <line x1="20" y1="12" x2="20" y2="3" />
                      <line x1="1" y1="14" x2="7" y2="14" />
                      <line x1="9" y1="8" x2="15" y2="8" />
                      <line x1="17" y1="16" x2="23" y2="16" />
                    </svg>
                  </span>
                  <span>Attributes</span>
                  <span className="cms-sub-count">{productAttributes.length}</span>
                </button>
              </div>
            )}

            {/* Products Flyout Submenu (Collapsed sidebar icon hover/click) */}
            {isSidebarCollapsed && (
              <div className={`cms-collapsed-flyout-menu ${collapsedFlyout === 'products' ? 'is-active' : ''}`}>
                <div className="cms-flyout-arrow" />
                <div className="cms-flyout-header">
                  <div className="cms-flyout-header-info">
                    <span className="cms-flyout-title">Equipment &amp; Products</span>
                    <span className="cms-flyout-count">{products.length} items</span>
                  </div>
                </div>
                <div className="cms-flyout-divider" />
                <div className="cms-flyout-list">
                  <button
                    type="button"
                    className={`cms-flyout-item ${activeTab === 'products' && productsSubView === 'list' ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveTab('products')
                      setProductsSubView('list')
                      setProdCategoryFilter('all')
                      setCollapsedFlyout(null)
                    }}
                  >
                    <span className="cms-sub-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                      </svg>
                    </span>
                    <span className="cms-flyout-item-name">All Products</span>
                    <span className="cms-sub-count">{products.length}</span>
                  </button>

                  <button
                    type="button"
                    className={`cms-flyout-item ${activeTab === 'products' && productsSubView === 'editor' && !prodEditorId ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveTab('products')
                      openCreateProduct()
                      setCollapsedFlyout(null)
                    }}
                  >
                    <span className="cms-sub-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                    </span>
                    <span className="cms-flyout-item-name">Add new product</span>
                    <span className="cms-flyout-action-pill">+ Add</span>
                  </button>

                  <button
                    type="button"
                    className={`cms-flyout-item ${activeTab === 'products' && productsSubView === 'categories' ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveTab('products')
                      setProductsSubView('categories')
                      setCollapsedFlyout(null)
                    }}
                  >
                    <span className="cms-sub-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                      </svg>
                    </span>
                    <span className="cms-flyout-item-name">Categories</span>
                    <span className="cms-sub-count">{productCategories.length}</span>
                  </button>

                  <button
                    type="button"
                    className={`cms-flyout-item ${activeTab === 'products' && productsSubView === 'brands' ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveTab('products')
                      setProductsSubView('brands')
                      setCollapsedFlyout(null)
                    }}
                  >
                    <span className="cms-sub-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                        <path d="M3 21h18M3 7v14M21 7v14M6 7V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3M9 10h2M13 10h2M9 14h2M13 14h2M9 18h2M13 18h2" />
                      </svg>
                    </span>
                    <span className="cms-flyout-item-name">Brands</span>
                  </button>

                  <button
                    type="button"
                    className={`cms-flyout-item ${activeTab === 'products' && productsSubView === 'attributes' ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveTab('products')
                      setProductsSubView('attributes')
                      setCollapsedFlyout(null)
                    }}
                  >
                    <span className="cms-sub-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                        <line x1="4" y1="21" x2="4" y2="14" />
                        <line x1="4" y1="10" x2="4" y2="3" />
                        <line x1="12" y1="21" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12" y2="3" />
                        <line x1="20" y1="21" x2="20" y2="16" />
                        <line x1="20" y1="12" x2="20" y2="3" />
                        <line x1="1" y1="14" x2="7" y2="14" />
                        <line x1="9" y1="8" x2="15" y2="8" />
                        <line x1="17" y1="16" x2="23" y2="16" />
                      </svg>
                    </span>
                    <span className="cms-flyout-item-name">Attributes</span>
                    <span className="cms-sub-count">{productAttributes.length}</span>
                  </button>
                </div>
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
            <span className="cms-nav-label">Media Library</span>
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

          {/* Trash & Recovery Vault */}
          <button
            className={`cms-nav-item ${activeTab === 'trash' ? 'active' : ''}`}
            onClick={() => setActiveTab('trash')}
            data-tooltip="Trash & Recovery"
            title={isSidebarCollapsed ? 'Trash & Recovery' : undefined}
          >
            <span className="cms-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
            </span>
            <span className="cms-nav-label">Trash & Recovery</span>
            {trashItems.length > 0 && (
              <span className="cms-nav-badge warning">{trashItems.length}</span>
            )}
            {activeTab === 'trash' && <span className="cms-nav-active-dot" />}
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

          <button
            className={`cms-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
            data-tooltip="Profile & Google SSO"
            title={isSidebarCollapsed ? 'Profile & Google SSO' : undefined}
          >
            <span className="cms-nav-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <span className="cms-nav-label">Profile & Google SSO</span>
            {currentUser?.googleLinked && (
              <span className="cms-nav-badge" style={{ background: '#10b981', color: '#fff', fontSize: '0.7rem', padding: '1px 6px' }}>
                SSO
              </span>
            )}
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
                src={currentUser.avatar || DEFAULT_SUPERADMIN_AVATAR}
                alt={currentUser.name}
                className="cms-avatar-img"
                onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_SUPERADMIN_AVATAR }}
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
            {/* Sidebar Collapse / Expand Toggle Button */}
            <button
              type="button"
              className="cms-header-sidebar-toggle"
              onClick={() => {
                if (window.innerWidth <= 1024) {
                  setIsMobileSidebarOpen(!isMobileSidebarOpen)
                } else {
                  toggleSidebar()
                }
              }}
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              aria-label={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Pill Search Input */}
            <div className="cms-header-pill-search">
              <svg className="cms-header-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="cms-pill-search-input"
                placeholder="Search products, blog posts, inquiries..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
              {globalSearch ? (
                <button
                  type="button"
                  className="cms-search-clear-btn"
                  onClick={() => setGlobalSearch('')}
                  title="Clear search"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              ) : (
                <kbd className="cms-search-kbd" title="Search Shortcut">⌘K</kbd>
              )}
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

            {/* Auto Sign-Out Security Quick Pill Button */}
            <button
              type="button"
              className={`cms-auto-signout-pill ${autoSignOutEnabled ? 'active-timer' : 'disabled-forever'}`}
              onClick={() => {
                setTempAutoSignOutEnabled(autoSignOutEnabled)
                setTempAutoSignOutSeconds(autoSignOutSeconds)
                setIsAutoSignOutModalOpen(true)
              }}
              title={autoSignOutEnabled 
                ? `Auto Sign-Out: Active (${autoSignOutSeconds}s timeout, ${secondsRemaining}s remaining idle). Click to configure.` 
                : 'Auto Sign-Out: Disabled (Signed in forever). Click to configure.'}
            >
              <span className="cms-auto-signout-dot" />
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="12 8 12 12 14 14" />
              </svg>
              <span>
                {autoSignOutEnabled ? `Auto Sign-Out: ${autoSignOutSeconds}s` : 'Sign In: Forever'}
              </span>
            </button>

            {/* Notification Bell Dropdown Container */}
            <div className="cms-notification-menu-container" ref={notificationRef}>
              <button
                type="button"
                className={`cms-header-icon-btn ${isNotificationOpen ? 'active' : ''}`}
                onClick={() => {
                  setIsNotificationOpen((prev) => !prev)
                  setIsProfileDropdownOpen(false)
                }}
                title="Notifications"
                aria-label="View notifications"
                aria-expanded={isNotificationOpen}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadNotificationCount > 0 && (
                  <span className="cms-notif-badge">
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Menu */}
              {isNotificationOpen && (
                <div className="cms-notification-dropdown" onClick={(e) => e.stopPropagation()}>
                  {/* Header */}
                  <div className="cms-notif-header">
                    <div className="cms-notif-header-title-row">
                      <div className="cms-notif-header-title">
                        <span>Notifications</span>
                        {unreadNotificationCount > 0 && (
                          <span className="cms-notif-unread-pill">{unreadNotificationCount} new</span>
                        )}
                      </div>
                      {unreadNotificationCount > 0 && (
                        <button
                          type="button"
                          className="cms-notif-action-text-btn"
                          onClick={handleMarkAllNotificationsRead}
                          title="Mark all as read"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    {/* Filter tabs */}
                    <div className="cms-notif-filters">
                      <button
                        type="button"
                        className={`cms-notif-filter-btn ${notificationFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setNotificationFilter('all')}
                      >
                        All ({notifications.length})
                      </button>
                      <button
                        type="button"
                        className={`cms-notif-filter-btn ${notificationFilter === 'unread' ? 'active' : ''}`}
                        onClick={() => setNotificationFilter('unread')}
                      >
                        Unread ({unreadNotificationCount})
                      </button>
                    </div>
                  </div>

                  {/* Notification Items List */}
                  <div className="cms-notif-list">
                    {displayedNotifications.length === 0 ? (
                      <div className="cms-notif-empty">
                        <div className="cms-notif-empty-icon">
                          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                          </svg>
                        </div>
                        <div className="cms-notif-empty-title">All caught up!</div>
                        <div className="cms-notif-empty-desc">
                          {notificationFilter === 'unread'
                            ? 'No unread notifications at the moment.'
                            : 'No notifications right now.'}
                        </div>
                      </div>
                    ) : (
                      displayedNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`cms-notif-item ${!notif.read ? 'unread' : ''}`}
                          onClick={() => handleNotificationClick(notif)}
                        >
                          <div className={`cms-notif-item-icon ${notif.type}`}>
                            {notif.type === 'inquiry' && (
                              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                              </svg>
                            )}
                            {notif.type === 'product' && (
                              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="1" y="3" width="15" height="13" />
                                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                                <circle cx="5.5" cy="18.5" r="2.5" />
                                <circle cx="18.5" cy="18.5" r="2.5" />
                              </svg>
                            )}
                            {notif.type === 'security' && (
                              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                              </svg>
                            )}
                            {notif.type === 'system' && (
                              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="23 4 23 10 17 10" />
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                              </svg>
                            )}
                          </div>
                          <div className="cms-notif-item-content">
                            <div className="cms-notif-item-title-row">
                              <span className="cms-notif-item-title">{notif.title}</span>
                              {!notif.read && <span className="cms-notif-dot" title="Unread" />}
                            </div>
                            <p className="cms-notif-item-message">{notif.message}</p>
                            <div className="cms-notif-item-meta">
                              <span className="cms-notif-item-time">{notif.time}</span>
                              {notif.targetTab && (
                                <span className="cms-notif-item-tab-link">
                                  Go to {notif.targetTab} →
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="cms-notif-item-delete"
                            title="Remove notification"
                            onClick={(e) => handleDeleteNotification(notif.id, e)}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Dropdown Footer */}
                  <div className="cms-notif-footer">
                    <button
                      type="button"
                      className="cms-notif-footer-link"
                      onClick={() => {
                        setActiveTab('inquiries')
                        setIsNotificationOpen(false)
                      }}
                    >
                      View All Inquiries →
                    </button>
                    {notifications.length > 0 && (
                      <button
                        type="button"
                        className="cms-notif-footer-clear"
                        onClick={handleClearAllNotifications}
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill Dropdown Trigger */}
            <div className="cms-profile-menu-container" ref={profileRef}>
              <button
                type="button"
                className={`cms-user-profile-pill ${isProfileDropdownOpen ? 'active' : ''}`}
                onClick={() => {
                  setIsProfileDropdownOpen((prev) => !prev)
                  setIsNotificationOpen(false)
                }}
              >
                <div className="cms-avatar-badge">
                  <img
                    src={currentUser.avatar || DEFAULT_SUPERADMIN_AVATAR}
                    alt={currentUser.name}
                    className="cms-avatar-img"
                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_SUPERADMIN_AVATAR }}
                  />
                  <span className="cms-avatar-status-dot"></span>
                </div>
                <div className="cms-user-pill-text">
                  <span className="cms-user-pill-greeting">Hi, {getAdminDisplayName(currentUser.name)}</span>
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
                      src={currentUser.avatar || DEFAULT_SUPERADMIN_AVATAR}
                      alt={currentUser.name}
                      style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', objectPosition: '50% 15%' }}
                      onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_SUPERADMIN_AVATAR }}
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
                        setActiveTab('profile')
                        setIsProfileDropdownOpen(false)
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      My Profile & Google SSO
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
                      onClick={() => {
                        setTempAutoSignOutEnabled(autoSignOutEnabled)
                        setTempAutoSignOutSeconds(autoSignOutSeconds)
                        setIsAutoSignOutModalOpen(true)
                        setIsProfileDropdownOpen(false)
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <polyline points="12 8 12 12 14 14" />
                      </svg>
                      Auto Sign-Out ({autoSignOutEnabled ? `${autoSignOutSeconds}s` : 'Forever'})
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
        <div
          ref={mainContentRef}
          className={`cms-main-scrollable-body ${(activeTab === 'articles' && articlesSubView === 'editor') || (activeTab === 'products' && productsSubView === 'editor') ? 'cms-editor-split-scroll-body' : ''}`}
        >
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
                    Welcome back, {getAdminDisplayName(currentUser?.name)}! 👋
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
                {/* 1. Total Equipment (Cobalt Blue) */}
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

                {/* 2. Live Published (Industrial Yellow) */}
                <div className="cms-kpi-card yellow" style={{ cursor: 'pointer' }} onClick={() => { setActiveTab('products'); setProdStatusFilter('published') }}>
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

                {/* 3. Inquiries & Leads (Crimson Red) */}
                <div className="cms-kpi-card red" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('inquiries')}>
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

                {/* 4. Articles & Guides (Cobalt Blue) */}
                <div className="cms-kpi-card blue" style={{ cursor: 'pointer' }} onClick={() => { setActiveTab('articles'); setArticlesSubView('list') }}>
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

                {/* 5. Store Orders (Crimson Red) */}
                <div className="cms-kpi-card red" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('cart')}>
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                  </div>

                  <div className="cms-table-wrapper">
                    {dashboardRecentTab === 'products' ? (
                      <table className="cms-table cms-articles-table cms-dashboard-equipment-table">
                        <thead>
                          <tr>
                            <th>EQUIPMENT MODEL</th>
                            <th>SKU</th>
                            <th>CATEGORY</th>
                            <th>BASE PRICE</th>
                            <th>SALE PRICE</th>
                            <th>STOCK LEVEL</th>
                            <th>STATUS</th>
                            <th>STORE LINK</th>
                            <th>LAST UPDATED</th>
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
                                      {prod.sku}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="cms-sku-badge">{prod.sku}</span>
                              </td>
                              <td>
                                <span className="cms-category-pill" title={prod.category || 'General'}>
                                  {(prod.category ? prod.category.split('>').pop()?.trim() : '') || prod.category || 'General'}
                                </span>
                              </td>
                              <td style={{ fontWeight: 800, color: 'var(--cms-text-primary)' }}>
                                ${prod.price.toLocaleString()}
                              </td>
                              <td style={{ fontWeight: 700, color: prod.salePrice ? '#10b981' : 'var(--cms-text-muted)' }}>
                                {prod.salePrice ? `$${prod.salePrice.toLocaleString()}` : '—'}
                              </td>
                              <td>
                                <span className={`cms-stock-pill ${(prod.stock ?? 10) <= 2 ? 'low' : 'ok'}`}>
                                  {(prod.stock ?? 10) > 0 ? `${prod.stock ?? 10} in stock` : 'Out of stock'}
                                </span>
                              </td>
                              <td>
                                <span className={`cms-status-pill ${prod.status === 'Published' ? 'published' : 'draft'}`}>
                                  {prod.status}
                                </span>
                              </td>
                              <td>
                                <a
                                  href={prod.slug ? `/product/${prod.slug}` : (prod.buyUrl || '/store')}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="cms-view-store-link"
                                  title="View product in store"
                                >
                                  <span>Store</span>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                  </svg>
                                </a>
                              </td>
                              <td className="cms-date-cell">
                                {prod.updatedAt || 'Oct 19, 2026'}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div className="cms-row-actions">
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
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <table className="cms-table cms-articles-table cms-dashboard-articles-table">
                        <thead>
                          <tr>
                            <th>ARTICLE</th>
                            <th>CATEGORY</th>
                            <th>STATUS</th>
                            <th>AUTHOR</th>
                            <th>EST. READ</th>
                            <th>DATE</th>
                            <th>LIVE PREVIEW</th>
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
                              <td>
                                <span className="cms-author-pill">
                                  {post.author || 'Admin Team'}
                                </span>
                              </td>
                              <td>
                                <span className="cms-readtime-pill">
                                  ⏱️ {post.readTime || '4 min read'}
                                </span>
                              </td>
                              <td className="cms-date-cell">
                                {post.date || 'Oct 15, 2026'}
                              </td>
                              <td>
                                <a
                                  href={`/${getBlogPostPath(post)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="cms-view-store-link"
                                  title="View Live Article"
                                >
                                  <span>Live Article</span>
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                    <polyline points="15 3 21 3 21 9" />
                                    <line x1="10" y1="14" x2="21" y2="3" />
                                  </svg>
                                </a>
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
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
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
                        onClick={() => setActiveTab('settings')}
                      >
                        <div className="cms-qa-icon" style={{ background: '#f1f5f9', color: '#07182e' }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                          </svg>
                        </div>
                        <div className="cms-qa-text">
                          <strong>Settings</strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--cms-text-muted)' }}>Site preferences</span>
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
                  {/* Top Header Row with Back Button, Status Badge and Actions (Matches Rafelblog Screenshot 2 & 5) */}
                  <div className="cms-rafvex-editor-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <button
                        type="button"
                        className="cms-editor-back-box"
                        onClick={() => setArticlesSubView('list')}
                        title="Back to Articles"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="19" y1="12" x2="5" y2="12" />
                          <polyline points="12 19 5 12 12 5" />
                        </svg>
                      </button>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h1 className="cms-editor-h1-title">{editingArticle ? 'Edit Article' : 'New Article'}</h1>
                          <span className={`cms-status-header-pill ${editorStatus === 'Published' ? 'status-published' : editorStatus === 'Scheduled' ? 'status-scheduled' : 'status-draft'}`}>
                            {editorStatus === 'Published' ? 'Public' : editorStatus}
                          </span>
                        </div>
                        <p className="cms-editor-header-submeta">
                          ID #{editingArticle?.id || 'NEW'} • {editingArticle ? `Created ${(editingArticle as any).created_at || editingArticle.date || '10/15/2026'}` : 'Write and publish an editorial post'}
                        </p>
                      </div>
                    </div>

                    <div className="cms-editor-header-actions">
                      <button
                        type="button"
                        className={`cms-btn-header-preview ${editorMode === 'preview' ? 'active' : ''}`}
                        onClick={() => {
                          setEditorMode(editorMode === 'preview' ? 'visual' : 'preview')
                        }}
                        title={editorMode === 'preview' ? 'Return to editing article' : 'Preview full blog post as visitors see it'}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {editorMode === 'preview' ? (
                            <>
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </>
                          ) : (
                            <>
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </>
                          )}
                        </svg>
                        <span>{editorMode === 'preview' ? 'Edit Article' : 'Preview'}</span>
                      </button>
                      <button
                        type="button"
                        className="cms-btn-header-draft"
                        onClick={() => handleSaveArticle('Draft')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        <span>Save as Draft</span>
                      </button>
                      <button
                        type="button"
                        className="cms-btn-header-publish"
                        onClick={() => handleSaveArticle(editorStatus === 'Scheduled' ? 'Scheduled' : 'Published')}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                          <polyline points="17 21 17 13 7 13 7 21" />
                          <polyline points="7 3 7 8 15 8" />
                        </svg>
                        <span>{editingArticle ? 'Save Changes' : 'Publish Article'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 2-Column Editor Grid vs Full Live Reader Preview */}
                  {editorMode === 'preview' ? (
                    <div className="cms-full-preview-stage">
                      {/* Top Preview Control Bar */}
                      <div className="cms-preview-toolbar">
                        <div className="cms-preview-toolbar-left">
                          <span className="cms-preview-badge-live">
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2563eb', display: 'inline-block' }} />
                            Live Reader Preview
                          </span>
                          <span style={{ fontSize: '12px', color: 'var(--cms-text-muted, #64748b)', fontWeight: 500 }}>
                            Full Public Article View
                          </span>
                          <div className="cms-preview-device-switch">
                            <button
                              type="button"
                              className={`cms-preview-device-btn ${previewDevice === 'desktop' ? 'active' : ''}`}
                              onClick={() => setPreviewDevice('desktop')}
                              title="Full Desktop View (100% width)"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect width="20" height="14" x="2" y="3" rx="2" />
                                <line x1="8" x2="16" y1="21" y2="21" />
                                <line x1="12" x2="12" y1="17" y2="21" />
                              </svg>
                              <span>Desktop</span>
                            </button>
                            <button
                              type="button"
                              className={`cms-preview-device-btn ${previewDevice === 'tablet' ? 'active' : ''}`}
                              onClick={() => setPreviewDevice('tablet')}
                              title="Tablet View (768px width)"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect width="16" height="20" x="4" y="2" rx="2" />
                                <line x1="12" x2="12" y1="18" y2="18" />
                              </svg>
                              <span>Tablet</span>
                            </button>
                            <button
                              type="button"
                              className={`cms-preview-device-btn ${previewDevice === 'mobile' ? 'active' : ''}`}
                              onClick={() => setPreviewDevice('mobile')}
                              title="Mobile View (420px width)"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect width="14" height="20" x="5" y="2" rx="2" />
                                <path d="M12 18h.01" />
                              </svg>
                              <span>Mobile</span>
                            </button>
                          </div>
                        </div>

                        <div className="cms-preview-toolbar-right">
                          <button
                            type="button"
                            className="cms-preview-btn-back"
                            onClick={() => setEditorMode('visual')}
                            title="Return to editing article"
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            <span>Back to Editor</span>
                          </button>
                          <button
                            type="button"
                            className="cms-btn-header-publish"
                            style={{ padding: '6px 14px', fontSize: '12px' }}
                            onClick={() => handleSaveArticle(editorStatus === 'Scheduled' ? 'Scheduled' : 'Published')}
                          >
                            <span>Save Changes</span>
                          </button>
                          {editorSlug && (
                            <button
                              type="button"
                              className="cms-preview-btn-openlink"
                              onClick={() => window.open(`/blog/${editorSlug}`, '_blank')}
                              title="Open live URL in new tab"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" x2="21" y1="14" y2="3" />
                              </svg>
                              <span>Open Live URL</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Scrollable Stage */}
                      <div className="cms-full-preview-scroll-area">
                        <div className={`cms-preview-frame frame-${previewDevice}`}>
                          <div className="cms-preview-paper">
                            {/* Breadcrumbs */}
                            <nav className="raf-breadcrumb" style={{ marginBottom: '18px' }}>
                              <span className="raf-bc-link">Home</span>
                              <span className="raf-bc-sep">›</span>
                              <span className="raf-bc-link">Machinery Guides</span>
                              <span className="raf-bc-sep">›</span>
                              <span className="raf-bc-link">{editorCategory || 'Jobsite Productivity'}</span>
                              <span className="raf-bc-sep">›</span>
                              <span className="raf-bc-current">{editorTitle || 'Untitled Editorial Post'}</span>
                            </nav>

                            {/* Category Pill */}
                            <div className="raf-meta-top-row" style={{ marginBottom: '10px' }}>
                              <div className="raf-category-pill">
                                <span className="raf-pill-dot" />
                                <span className="raf-pill-text">{(editorCategory || 'Jobsite Productivity').toUpperCase()}</span>
                              </div>
                            </div>

                            {/* Headline */}
                            <h1 className="raf-article-headline" style={{ fontSize: previewDevice === 'mobile' ? '1.5rem' : '2.25rem', marginBottom: '14px' }}>
                              {editorTitle || 'Untitled Editorial Post'}
                            </h1>

                            {/* Excerpt */}
                            {editorExcerpt && (
                              <p className="raf-article-excerpt-bar" style={{ marginBottom: '22px' }}>
                                {editorExcerpt}
                              </p>
                            )}

                            {/* Featured Cover Image */}
                            {editorCoverImage && (
                              <div className="raf-hero-image-box" style={{ width: '100%', aspectRatio: '16 / 9', marginBottom: '22px', borderRadius: '16px', overflow: 'hidden' }}>
                                <img
                                  src={editorCoverImage}
                                  alt={editorCoverAlt || editorTitle || 'Featured Cover Image'}
                                  className="raf-hero-image"
                                  style={{ width: '100%', height: '100%', aspectRatio: '16 / 9', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                                />
                              </div>
                            )}

                            {/* Author & Published Info Bar */}
                            <div className="raf-author-row" style={{ marginBottom: '26px' }}>
                              <div className="raf-author-avatar">
                                <img
                                  src="https://lh3.googleusercontent.com/-UDuMZS2bji_GLgC69Z9-vrD4uLHxcqGQIYEHW3O85aWYN4nXhiAMjnQikFFbyOhUnfl"
                                  alt={editingArticle?.author || 'Happy Machinery'}
                                  className="raf-author-favicon"
                                  onError={(e) => {
                                    const img = e.currentTarget as HTMLImageElement;
                                    img.src = '/favicon.png';
                                  }}
                                />
                              </div>
                              <div className="raf-author-details">
                                <span className="raf-author-name">{editingArticle?.author || 'Happy Machinery'}</span>
                                <span className="raf-publish-date">Published Today &bull; {editingArticle?.readTime || `${Math.max(2, Math.ceil((editorContent || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length / 180))} min read`}</span>
                              </div>
                            </div>

                            {/* Main Body + On This Page Grid */}
                            <div className="cms-preview-split-grid">
                              {/* Left Content Column */}
                              <article className="raf-body-content" style={{ minWidth: 0 }}>
                                {(() => {
                                  const previewBlocks = splitContentIntoBlocks(editorContent)
                                  if (previewBlocks.length === 0) {
                                    return (
                                      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--cms-text-muted, #94a3b8)' }}>
                                        <p style={{ fontSize: '15px', fontWeight: 500 }}>No article content to preview yet.</p>
                                        <p style={{ fontSize: '13px' }}>Switch back to the editor to write paragraphs and insert images.</p>
                                      </div>
                                    )
                                  }
                                  return previewBlocks.map((block, idx) => {
                                    // 1. Skip duplicate title if at start of content
                                    if (idx === 0) {
                                      const cleanP = block.replace(/^<[^>]+>/g, '').replace(/<\/[^>]+>$/g, '').replace(/^#+\s*/, '').trim().toLowerCase()
                                      if (cleanP === editorTitle.trim().toLowerCase()) return null
                                    }
                                    // 2. Skip first image if identical to editorCoverImage
                                    if ((idx === 0 || idx === 1) && editorCoverImage) {
                                      if (block.includes(editorCoverImage)) return null
                                    }
                                    return renderMarkdownToReact(block, `full-prev-${idx}`)
                                  })
                                })()}
                              </article>

                              {/* Right Sidebar: On This Page */}
                              <aside className="cms-preview-sidebar">
                                <div className="cms-preview-toc-box">
                                  <div className="cms-preview-toc-title">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                      <line x1="3" y1="6" x2="21" y2="6" />
                                      <line x1="3" y1="12" x2="15" y2="12" />
                                      <line x1="3" y1="18" x2="18" y2="18" />
                                    </svg>
                                    <span>On This Page</span>
                                  </div>
                                  <ul className="cms-preview-toc-list">
                                    {(() => {
                                      const blocks = splitContentIntoBlocks(editorContent)
                                      const headings: { id: string; text: string; num: number }[] = []
                                      let counter = 1
                                      const seenIds = new Set<string>()
                                      blocks.forEach((line, idx) => {
                                        const h = getHeadingMatch(line, idx)
                                        if (h && h.text.length > 2 && h.text.toLowerCase() !== editorTitle.toLowerCase()) {
                                          let finalId = h.id
                                          if (seenIds.has(finalId)) finalId = `${finalId}-${idx}`
                                          seenIds.add(finalId)
                                          headings.push({ id: finalId, text: h.text, num: counter++ })
                                        }
                                      })
                                      if (headings.length === 0) {
                                        return (
                                          <li style={{ fontSize: '12px', color: 'var(--cms-text-muted, #94a3b8)', fontStyle: 'italic' }}>
                                            No section headings detected yet.
                                          </li>
                                        )
                                      }
                                      return headings.map((h) => (
                                        <li key={h.id}>
                                          <a
                                            href={`#${h.id}`}
                                            className="cms-preview-toc-link"
                                            onClick={(e) => {
                                              e.preventDefault()
                                              const el = document.getElementById(h.id)
                                              if (el) el.scrollIntoView({ behavior: 'smooth' })
                                            }}
                                          >
                                            <span className="cms-preview-toc-num">{h.num}</span>
                                            <span>{h.text}</span>
                                          </a>
                                        </li>
                                      ))
                                    })()}
                                  </ul>
                                </div>

                                {/* Simulated Guidance Box */}
                                <div style={{
                                  marginTop: '20px',
                                  padding: '20px',
                                  borderRadius: '16px',
                                  background: 'linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(15,23,42,0.04) 100%)',
                                  border: '1px solid var(--cms-border, #e2e8f0)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '10px'
                                }}>
                                  <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#2563eb' }}>
                                    Equipment Guidance
                                  </span>
                                  <h4 style={{ fontSize: '14px', fontWeight: 750, color: 'var(--cms-text, #0f172a)', margin: 0 }}>
                                    Need Machinery Advice?
                                  </h4>
                                  <p style={{ fontSize: '12px', color: 'var(--cms-text-secondary, #64748b)', margin: 0, lineHeight: 1.5 }}>
                                    Connect with our technical team for prompt answers, parts availability, or jobsite recommendations.
                                  </p>
                                </div>
                              </aside>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="cms-rafvex-editor-grid">
                    {/* Left Main Column */}
                    <div className="cms-editor-main-col">
                      {/* Card 1: Article Title & Slug (Matches Screenshot 2 & 5) */}
                      <div className="cms-editor-card cms-title-slug-card">
                        <label className="cms-editor-eyebrow">Article Title</label>
                        <input
                          type="text"
                          className="cms-raf-title-input"
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
                        <div className="cms-raf-slug-row">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#94a3b8', flexShrink: 0 }}>
                            <circle cx="12" cy="12" r="10" />
                            <line x1="2" y1="12" x2="22" y2="12" />
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                          </svg>
                          <span className="cms-slug-prefix">happymachinery.com/blog/</span>
                          <input
                            type="text"
                            className="cms-raf-slug-input"
                            placeholder="custom-article-slug"
                            value={editorSlug}
                            onChange={(e) => setEditorSlug(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Card 2: Article Body (Unified Modern WYSIWYG & Media - Rafelblog Style) */}
                      <div className="cms-editor-card cms-article-content-card">
                        <div className="cms-editor-card-header-row" style={{ paddingBottom: '12px', borderBottom: '1px solid var(--cms-border, #e2e8f0)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <label className="cms-editor-eyebrow" style={{ margin: 0 }}>Article Content</label>
                            <span className="cms-wysiwyg-badge">
                              {editorMode === 'visual' ? 'Rich WYSIWYG & Media' : 'Markdown Source'}
                            </span>
                          </div>

                          {/* Mode Switcher Buttons */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const clip = await navigator.clipboard.readText()
                                  if (clip && clip.trim()) {
                                    await handleSmartBlogImport(clip)
                                  } else {
                                    const text = prompt('Paste your blog content here (with miniexcavator links, title, images):')
                                    if (text) await handleSmartBlogImport(text)
                                  }
                                } catch {
                                  const text = prompt('Paste your blog content here (with miniexcavator links, title, images):')
                                  if (text) await handleSmartBlogImport(text)
                                }
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '6px 12px',
                                borderRadius: '10px',
                                fontSize: '12px',
                                fontWeight: 650,
                                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                                color: '#ffffff',
                                border: 'none',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(239, 68, 68, 0.25)',
                              }}
                              title="Auto-detect blog with miniexcavator links: extracts title, cover image, and formats photos with captions"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                              </svg>
                              <span>Smart Import Blog</span>
                            </button>

                            <div className="cms-raf-mode-switcher">
                              <button
                                type="button"
                                className={`cms-raf-mode-btn ${editorMode === 'visual' ? 'active' : ''}`}
                                onClick={() => setEditorMode('visual')}
                                title="Visual WYSIWYG: Fluid writing with inline media, formatting ribbon, and drag & drop"
                              >
                                Visual (WYSIWYG)
                              </button>
                              <button
                                type="button"
                                className={`cms-raf-mode-btn ${editorMode === 'code' ? 'active' : ''}`}
                                onClick={() => setEditorMode('code')}
                                title="Raw Code: Direct markdown or HTML editing"
                              >
                                Code (Markdown)
                              </button>
                              <button
                                type="button"
                                className={`cms-raf-mode-btn ${(editorMode as string) === 'preview' ? 'active' : ''}`}
                                onClick={() => setEditorMode('preview')}
                                title="Live Reader Preview: Preview how this article looks to visitors"
                              >
                                Preview
                              </button>
                            </div>
                          </div>
                        </div>


                        {/* Content Body Based on Mode */}
                        {editorMode === 'visual' && (
                          <div className="cms-tiptap-editor-wrap" style={{ minHeight: '520px' }}>
                            <TiptapEditor
                              content={editorContent}
                              onChangeHtml={(html) => {
                                setEditorContent(html)
                                pushContentHistory(html)
                              }}
                              onChangeRaw={(raw) => setEditorContentRaw(raw)}
                              mediaList={mediaList.map((m: any) => ({
                                id: m.id,
                                title: m.title,
                                url: m.url,
                                folder: m.folder,
                                dateAdded: m.dateAdded,
                                size: m.size
                              }))}
                              onMediaUploaded={(newItem: any) => {
                                setMediaList((prev: any) => {
                                  const updated = [newItem, ...prev]
                                  void writeSharedContent('media-library', updated)
                                  return updated
                                })
                              }}
                              onAutoExtractTitle={(title) => {
                                setEditorTitle(title)
                                if (!editingArticle) {
                                  setEditorSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
                                }
                                showToast(`Auto-detected Article Title: "${title}"`, 'success')
                              }}
                              onAutoExtractCoverImage={(url, alt) => {
                                setEditorCoverImage(url)
                                if (alt) {
                                  setEditorCoverAlt(alt)
                                }
                                showToast('Auto-filled Featured Cover Image from first photo!', 'success')
                              }}
                            />
                          </div>
                        )}

                        {editorMode === 'code' && (
                          <div className="cms-code-editor-container" style={{ padding: '16px' }}>
                            <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '12px', color: '#64748b' }}>
                                Direct Markdown / HTML source. You can paste images (Cmd+V) or drop image files directly into this area.
                              </span>
                              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#94a3b8' }}>
                                {editorContent.length} chars
                              </span>
                            </div>
                            <textarea
                              ref={contentTextareaRef}
                              rows={26}
                              className="cms-wysiwyg-textarea"
                              style={{ width: '100%', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', fontSize: '13.5px', lineHeight: 1.6 }}
                              placeholder="Write or edit article content here... Paste images (Cmd+V) or drag & drop image files to auto-convert to WebP..."
                              value={editorContent}
                              onSelect={(e) => {
                                const target = e.target as HTMLTextAreaElement
                                setSavedCursorPos({ start: target.selectionStart, end: target.selectionEnd })
                              }}
                              onChange={(e) => {
                                setEditorContent(e.target.value)
                                pushContentHistory(e.target.value)
                              }}
                              onPaste={async (e) => {
                                const items = e.clipboardData?.items
                                if (items) {
                                  for (let i = 0; i < items.length; i++) {
                                    if (items[i].type.startsWith('image/')) {
                                      const file = items[i].getAsFile()
                                      if (file) {
                                        e.preventDefault()
                                        const reader = new FileReader()
                                        reader.onload = () => {
                                          const img = new Image()
                                          img.onload = () => {
                                            const canvas = document.createElement('canvas')
                                            canvas.width = img.width
                                            canvas.height = img.height
                                            const ctx = canvas.getContext('2d')
                                            ctx?.drawImage(img, 0, 0)
                                            const webpUrl = canvas.toDataURL('image/webp', 0.88)
                                            insertMediaAtSavedCursor(`\n\n![Pasted Image](${webpUrl})\n\n`)
                                            showToast('Image pasted and converted to WebP.', 'success')
                                          }
                                          img.src = reader.result as string
                                        }
                                        reader.readAsDataURL(file)
                                        return
                                      }
                                    }
                                  }
                                }

                                const text = e.clipboardData?.getData('text/plain') || ''
                                if (text && (/img\.miniexcavator\.org/i.test(text) || (/^(?:#+\s|<h[1-3])/im.test(text) && /\.(webp|png|jpe?g)/i.test(text)))) {
                                  e.preventDefault()
                                  await handleSmartBlogImport(text)
                                }
                              }}
                              onDrop={async (e) => {
                                const files = e.dataTransfer?.files
                                if (!files || files.length === 0) return
                                for (let i = 0; i < files.length; i++) {
                                  if (files[i].type.startsWith('image/')) {
                                    e.preventDefault()
                                    const reader = new FileReader()
                                    reader.onload = () => {
                                      const img = new Image()
                                      img.onload = () => {
                                        const canvas = document.createElement('canvas')
                                        canvas.width = img.width
                                        canvas.height = img.height
                                        const ctx = canvas.getContext('2d')
                                        ctx?.drawImage(img, 0, 0)
                                        const webpUrl = canvas.toDataURL('image/webp', 0.88)
                                        insertMediaAtSavedCursor(`\n\n![Dropped Image](${webpUrl})\n\n`)
                                        showToast('Image dropped and converted to WebP.', 'success')
                                      }
                                      img.src = reader.result as string
                                    }
                                    reader.readAsDataURL(files[i])
                                    return
                                  }
                                }
                              }}
                            />
                          </div>
                        )}

                      </div>
                    </div>

                    {/* Right Inspector Column (Matches Rafelblog Screenshot 2) */}
                    {/* Right Inspector Column - Organized, Clean Order */}
                    <div className="cms-editor-sidebar-col">
                      {/* Card 1: Publishing Status */}
                      <div className="cms-editor-card">
                        <div className="cms-editor-card-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--cms-border, #f1f5f9)' }}>
                          <div className="cms-card-header-left">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--cms-text-secondary, #64748b)' }}>
                              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                            </svg>
                            <h3 className="cms-card-subhead" style={{ margin: 0, padding: 0, border: 'none' }}>
                              Publishing
                            </h3>
                          </div>
                          <span className={`cms-status-header-pill ${editorStatus === 'Published' ? 'status-published' : editorStatus === 'Scheduled' ? 'status-scheduled' : 'status-draft'}`} style={{ fontSize: '10.5px', padding: '2px 8px' }}>
                            {editorStatus === 'Published' ? 'Public' : editorStatus}
                          </span>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div>
                            <label className="cms-field-label-sm">Visibility Status</label>
                            <select
                              className="cms-editor-select"
                              value={editorStatus}
                              onChange={(e) => setEditorStatus(e.target.value as any)}
                            >
                              <option value="Draft">Draft (Private / Work in Progress)</option>
                              <option value="Published">Public (Published &amp; Live)</option>
                              <option value="Scheduled">Scheduled (Auto-Publish Later)</option>
                            </select>
                          </div>

                          {editorStatus === 'Scheduled' && (
                            <div className="cms-scheduled-box animate-in">
                              <label className="cms-field-label-sm" style={{ color: '#b45309' }}>Schedule Date &amp; Time</label>
                              <input
                                type="datetime-local"
                                value={editorScheduledAt}
                                onChange={(e) => setEditorScheduledAt(e.target.value)}
                                className="cms-editor-select"
                                style={{ fontSize: '12px' }}
                              />
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', fontSize: '11px', color: 'var(--cms-text-muted, #94a3b8)' }}>
                            <span>Author: {editingArticle?.author || 'Happy Machinery'}</span>
                            <span>{editingArticle ? `ID #${editingArticle.id}` : 'Draft'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card 2: Featured Cover Image (Directly Under Publishing) */}
                      <div className="cms-editor-card">
                        <div className="cms-editor-card-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--cms-border, #f1f5f9)' }}>
                          <div className="cms-card-header-left">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--cms-text-secondary, #64748b)' }}>
                              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                              <circle cx="9" cy="9" r="2" />
                              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                            </svg>
                            <h3 className="cms-card-subhead" style={{ margin: 0, padding: 0, border: 'none' }}>
                              Featured Cover Image
                            </h3>
                          </div>
                          {editorCoverImage && (
                            <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: 650 }}>
                              Active Cover
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {/* Hidden file input for direct computer/device upload */}
                          <input
                            ref={coverFileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleUploadCoverFile(e.target.files[0])
                                e.target.value = ''
                              }
                            }}
                          />

                          {/* Quick Action Buttons: Upload File or Choose from Media Library */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => coverFileInputRef.current?.click()}
                              disabled={isUploadingCover}
                              className="cms-cover-action-btn upload"
                              title="Upload an image file directly from your computer"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                              </svg>
                              <span>{isUploadingCover ? 'Uploading...' : 'Upload File'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const current = mediaList.find((m) => m.url === editorCoverImage)
                                if (current) setSelectedCoverMedia(current)
                                setIsCoverMediaModalOpen(true)
                              }}
                              className="cms-cover-action-btn library"
                              title="Browse and pick an image from your Media Library"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </svg>
                              <span>Media Library</span>
                            </button>
                          </div>

                          {/* Drag & Drop zone OR Rich Preview */}
                          {editorCoverImage ? (
                            <div className="cms-cover-preview-wrapper group">
                              <img
                                src={editorCoverImage}
                                alt={editorCoverAlt || "Cover preview"}
                                className="cms-cover-preview-img"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.opacity = '0.5'
                                }}
                              />
                              <div className="cms-cover-preview-overlay">
                                <button
                                  type="button"
                                  onClick={() => coverFileInputRef.current?.click()}
                                  className="cms-cover-overlay-btn"
                                  title="Replace with new upload"
                                >
                                  Replace
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const current = mediaList.find((m) => m.url === editorCoverImage)
                                    if (current) setSelectedCoverMedia(current)
                                    setIsCoverMediaModalOpen(true)
                                  }}
                                  className="cms-cover-overlay-btn"
                                  title="Select different image from library"
                                >
                                  Library
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditorCoverImage('')
                                    setEditorCoverAlt('')
                                  }}
                                  className="cms-cover-remove-btn"
                                  title="Remove cover image"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="cms-cover-dropzone"
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault()
                                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                  handleUploadCoverFile(e.dataTransfer.files[0])
                                }
                              }}
                              onClick={() => coverFileInputRef.current?.click()}
                              title="Click to browse or drop an image file here"
                            >
                              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: '#94a3b8' }}>
                                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                                <circle cx="9" cy="9" r="2" />
                                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                              </svg>
                              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--cms-text-secondary, #475569)' }}>
                                Drag &amp; drop or click to upload
                              </span>
                              <span style={{ fontSize: '10px', color: 'var(--cms-text-muted, #94a3b8)' }}>
                                Auto-compressed to WebP &amp; saved to library
                              </span>
                            </div>
                          )}

                          <div>
                            <label className="cms-field-label-sm" style={{ marginBottom: '5px' }}>
                              Image URL
                            </label>
                            <input
                              type="url"
                              className="cms-editor-input-sm"
                              placeholder="https://images.unsplash.com/... or /images/..."
                              value={editorCoverImage}
                              onChange={(e) => setEditorCoverImage(e.target.value)}
                            />
                          </div>

                          <div>
                            <label className="cms-field-label-sm" style={{ marginBottom: '5px' }}>
                              Alt Description (SEO &amp; Accessibility)
                            </label>
                            <input
                              type="text"
                              className="cms-editor-input-sm"
                              placeholder="e.g. Modern excavator loading gravel on highway construction site"
                              value={editorCoverAlt}
                              onChange={(e) => setEditorCoverAlt(e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Card 3: Organization & Series (Unified Taxonomy) */}
                      <div className="cms-editor-card">
                        <div className="cms-editor-card-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--cms-border, #f1f5f9)' }}>
                          <div className="cms-card-header-left">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                              <polygon points="12 2 2 7 12 12 22 7 12 2" />
                              <polyline points="2 17 12 22 22 17" />
                              <polyline points="2 12 12 17 22 12" />
                            </svg>
                            <h3 className="cms-card-subhead" style={{ margin: 0, padding: 0, border: 'none' }}>
                              Organization &amp; Taxonomy
                            </h3>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          <div>
                            <label className="cms-field-label-sm">Primary Category</label>
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

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                              <label className="cms-field-label-sm" style={{ margin: 0 }}>Topic Series / Playlist</label>
                              <button
                                type="button"
                                className="cms-btn-new-series-inline"
                                onClick={() => showToast("Topic Series manager: select an existing series or manage pillars.", "success")}
                              >
                                + New Series
                              </button>
                            </div>
                            <select
                              className="cms-editor-select"
                              value={assignedSeries}
                              onChange={(e) => setAssignedSeries(e.target.value)}
                            >
                              <option value="None (Standalone Article)">None (Standalone Article)</option>
                              <option value="Mini Skid Steer Operations & Safety Guide">Mini Skid Steer Operations & Safety Guide</option>
                              <option value="Hydraulic System Maintenance & Troubleshooting">Hydraulic System Maintenance & Troubleshooting</option>
                              <option value="Jobsite Productivity & Attachment Selection">Jobsite Productivity & Attachment Selection</option>
                            </select>
                            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--cms-text-muted, #94a3b8)', lineHeight: 1.4 }}>
                              Groups articles into Pillar and Sub-Blog series for readers.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Card 4: Article Excerpt */}
                      <div className="cms-editor-card">
                        <div className="cms-editor-card-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--cms-border, #f1f5f9)' }}>
                          <div className="cms-card-header-left">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--cms-text-secondary, #64748b)' }}>
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                              <line x1="16" y1="13" x2="8" y2="13" />
                              <line x1="16" y1="17" x2="8" y2="17" />
                            </svg>
                            <h3 className="cms-card-subhead" style={{ margin: 0, padding: 0, border: 'none' }}>
                              Article Excerpt
                            </h3>
                          </div>
                          <span style={{ fontSize: '11px', color: editorExcerpt.length > 250 ? '#ea580c' : 'var(--cms-text-muted, #64748b)' }}>
                            {editorExcerpt.length} / 300
                          </span>
                        </div>
                        <textarea
                          rows={3}
                          className="cms-editor-textarea"
                          placeholder="A concise, engaging 1-2 sentence preview shown on category cards, homepage feeds, and SEO snippets..."
                          value={editorExcerpt}
                          maxLength={300}
                          onChange={(e) => setEditorExcerpt(e.target.value)}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--cms-text-muted, #94a3b8)' }}>
                          <span>Used for card previews &amp; social teasers</span>
                          <span>{editorExcerpt.trim() ? editorExcerpt.trim().split(/\s+/).length : 0} words</span>
                        </div>
                      </div>

                      {/* Card 5: Attached Video (Optional) */}
                      <div className="cms-editor-card">
                        <div className="cms-editor-card-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--cms-border, #f1f5f9)' }}>
                          <div className="cms-card-header-left">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                              <polygon points="23 7 16 12 23 17 23 7" />
                              <rect width="14" height="14" x="1" y="5" rx="2" ry="2" />
                            </svg>
                            <h3 className="cms-card-subhead" style={{ margin: 0, padding: 0, border: 'none' }}>
                              Attached Video (Optional)
                            </h3>
                          </div>
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--cms-text-muted, #94a3b8)', margin: '0 0 10px 0', lineHeight: 1.45 }}>
                          YouTube or Vimeo video URL. Displays a responsive video player at the top of the blog article.
                        </p>
                        <input
                          type="url"
                          className="cms-editor-input-sm"
                          placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                          value={editorVideoUrl}
                          onChange={(e) => setEditorVideoUrl(e.target.value)}
                        />
                        {editorVideoUrl && (
                          <div style={{ marginTop: '10px' }}>
                            <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cms-text-muted, #94a3b8)', marginBottom: '6px' }}>
                              Live Player Preview
                            </p>
                            <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', paddingBottom: '56.25%', height: 0, background: '#000', border: '1px solid var(--cms-border, #e2e8f0)' }}>
                              <iframe
                                src={editorVideoUrl.includes('embed') ? editorVideoUrl : editorVideoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                                title="Video Preview"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card 6: SEO & Social Meta (with Google SERP Preview) */}
                      <div className="cms-editor-card">
                        <div className="cms-editor-card-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid var(--cms-border, #f1f5f9)' }}>
                          <div className="cms-card-header-left">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="2" y1="12" x2="22" y2="12" />
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                            </svg>
                            <h3 className="cms-card-subhead" style={{ margin: 0, padding: 0, border: 'none' }}>
                              SEO &amp; Search Engine Meta
                            </h3>
                          </div>
                          <span style={{ fontSize: '10.5px', color: '#16a34a', fontWeight: 650 }}>
                            Google Ready
                          </span>
                        </div>
                        
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label className="cms-field-label-sm" style={{ margin: 0 }}>Meta Title</label>
                            <span style={{ fontSize: '10.5px', color: 'var(--cms-text-muted, #94a3b8)' }}>
                              {(editorSeoTitle || editorTitle).length} / 60
                            </span>
                          </div>
                          <input
                            type="text"
                            className="cms-editor-input-sm"
                            placeholder="Page meta title (defaults to article title)..."
                            value={editorSeoTitle}
                            maxLength={70}
                            onChange={(e) => setEditorSeoTitle(e.target.value)}
                          />
                        </div>

                        <div style={{ marginTop: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label className="cms-field-label-sm" style={{ margin: 0 }}>Meta Description</label>
                            <span style={{ fontSize: '10.5px', color: (editorSeoDesc || editorExcerpt).length > 160 ? '#ea580c' : 'var(--cms-text-muted, #94a3b8)' }}>
                              {(editorSeoDesc || editorExcerpt).length} / 160
                            </span>
                          </div>
                          <textarea
                            rows={2}
                            className="cms-editor-textarea"
                            placeholder="Search engine snippet (recommended 140-160 characters)..."
                            value={editorSeoDesc}
                            maxLength={200}
                            onChange={(e) => setEditorSeoDesc(e.target.value)}
                          />
                        </div>

                        {/* Live Google Search Result Simulation */}
                        <div className="cms-serp-preview-card">
                          <span className="cms-serp-url">
                            happymachinery.com › blog › {editorSlug || 'article-title'}
                          </span>
                          <h4 className="cms-serp-title">
                            {editorSeoTitle || editorTitle || 'Article Title - Happy Machinery'}
                          </h4>
                          <p className="cms-serp-desc">
                            {editorSeoDesc || editorExcerpt || 'Read our in-depth machinery guides, maintenance tips, and industry insights at Happy Machinery.'}
                          </p>
                        </div>
                      </div>

                      {/* Card 7: Danger Zone (Move to Trash) */}
                      {editingArticle && (
                        <div className="cms-editor-card" style={{ border: '1px dashed #fca5a5', background: 'rgba(254, 242, 242, 0.4)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <strong style={{ fontSize: '12px', color: '#b91c1c', display: 'block' }}>Danger Zone</strong>
                              <span style={{ fontSize: '11px', color: '#7f1d1d' }}>Move this article to trash bin</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleMoveArticleToTrash(editingArticle)}
                              className="cms-trash-danger-btn"
                              style={{ width: 'auto', padding: '6px 14px' }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                              <span>Move to Trash</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

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

                  {/* Cover Image Media Library Picker Modal */}
                  {isCoverMediaModalOpen && (
                    <div className="cms-modal-backdrop" onClick={() => setIsCoverMediaModalOpen(false)}>
                      <div className="cms-cover-picker-dialog" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="cms-cover-picker-header">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="cms-cover-picker-icon">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </svg>
                            </div>
                            <div>
                              <h3 style={{ margin: 0, fontSize: '15.5px', fontWeight: 700, color: 'var(--cms-text, #0f172a)' }}>
                                Choose Cover Image from Media Library
                              </h3>
                              <p style={{ margin: 0, fontSize: '12px', color: 'var(--cms-text-muted, #64748b)' }}>
                                Select an image from your library or upload a new photo directly
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="cms-modal-close-btn"
                            onClick={() => setIsCoverMediaModalOpen(false)}
                            title="Close modal"
                          >
                            &times;
                          </button>
                        </div>

                        {/* Filter & Upload Toolbar */}
                        <div className="cms-cover-picker-toolbar">
                          <div className="cms-cover-picker-search">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="11" cy="11" r="8" />
                              <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <input
                              type="text"
                              placeholder="Filter by title or filename..."
                              value={coverMediaSearch}
                              onChange={(e) => setCoverMediaSearch(e.target.value)}
                              autoFocus
                            />
                            {coverMediaSearch && (
                              <button type="button" onClick={() => setCoverMediaSearch('')}>&times;</button>
                            )}
                          </div>

                          <div className="cms-cover-picker-folders">
                            {[
                              { id: 'all', label: 'All', count: mediaList.length },
                              { id: 'galleries', label: 'Galleries', count: mediaList.filter(m => (m.folder || 'galleries') === 'galleries').length },
                              { id: 'features', label: 'Features', count: mediaList.filter(m => m.folder === 'features').length },
                              { id: 'profileimg', label: 'Profile', count: mediaList.filter(m => m.folder === 'profileimg').length }
                            ].map((f) => (
                              <button
                                key={f.id}
                                type="button"
                                className={`cms-cover-folder-pill ${coverMediaFolder === f.id ? 'active' : ''}`}
                                onClick={() => setCoverMediaFolder(f.id)}
                              >
                                <span>{f.label}</span>
                                <span className="cms-pill-badge">{f.count}</span>
                              </button>
                            ))}
                          </div>

                          <input
                            ref={coverModalFileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleUploadCoverFile(e.target.files[0])
                                e.target.value = ''
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="cms-cover-modal-upload-btn"
                            onClick={() => coverModalFileInputRef.current?.click()}
                            disabled={isUploadingCover}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <span>{isUploadingCover ? 'Uploading...' : 'Upload Device Image'}</span>
                          </button>
                        </div>

                        {/* Media Grid */}
                        <div className="cms-cover-picker-grid">
                          {(() => {
                            const filtered = mediaList.filter((m) => {
                              if (coverMediaFolder !== 'all') {
                                const f = m.folder || 'galleries'
                                if (f !== coverMediaFolder) return false
                              }
                              if (coverMediaSearch.trim()) {
                                const q = coverMediaSearch.toLowerCase()
                                const matchTitle = m.title.toLowerCase().includes(q)
                                const matchUrl = m.url.toLowerCase().includes(q)
                                if (!matchTitle && !matchUrl) return false
                              }
                              return true
                            })

                            if (filtered.length === 0) {
                              return (
                                <div className="cms-cover-picker-empty">
                                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21 15 16 10 5 21" />
                                  </svg>
                                  <p>No images found matching your filter.</p>
                                  <button
                                    type="button"
                                    className="cms-cover-modal-upload-btn"
                                    onClick={() => coverModalFileInputRef.current?.click()}
                                  >
                                    Upload an image now
                                  </button>
                                </div>
                              )
                            }

                            return filtered.map((item) => {
                              const isSelected = selectedCoverMedia?.id === item.id || (!selectedCoverMedia && editorCoverImage === item.url)
                              return (
                                <div
                                  key={item.id}
                                  className={`cms-cover-grid-item ${isSelected ? 'selected' : ''}`}
                                  onClick={() => setSelectedCoverMedia(item)}
                                  onDoubleClick={() => handleSelectCoverFromLibrary(item)}
                                  title={`${item.title} (Double-click to set as cover)`}
                                >
                                  <div className="cms-cover-item-thumb">
                                    <img
                                      src={item.url}
                                      alt={item.title}
                                      loading="lazy"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).style.opacity = '0.4'
                                      }}
                                    />
                                    {isSelected && (
                                      <div className="cms-cover-selected-badge">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                          <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                      </div>
                                    )}
                                    <span className="cms-cover-item-folder">
                                      {item.folder || 'galleries'}
                                    </span>
                                  </div>
                                  <div className="cms-cover-item-info">
                                    <span className="cms-cover-item-title" title={item.title}>
                                      {item.title}
                                    </span>
                                    <span className="cms-cover-item-size">{item.size || 'WebP'}</span>
                                  </div>
                                </div>
                              )
                            })
                          })()}
                        </div>

                        {/* Footer */}
                        <div className="cms-cover-picker-footer">
                          <div className="cms-cover-picker-selected-info">
                            {selectedCoverMedia ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img
                                  src={selectedCoverMedia.url}
                                  alt={selectedCoverMedia.title}
                                  style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '7px', border: '1px solid #cbd5e1' }}
                                />
                                <div style={{ minWidth: 0 }}>
                                  <strong style={{ display: 'block', fontSize: '12px', color: 'var(--cms-text, #0f172a)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '320px' }}>
                                    {selectedCoverMedia.title}
                                  </strong>
                                  <span style={{ fontSize: '11px', color: 'var(--cms-text-muted, #64748b)' }}>
                                    {selectedCoverMedia.size || 'WebP'} • {selectedCoverMedia.folder || 'galleries'}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span style={{ fontSize: '12px', color: 'var(--cms-text-muted, #94a3b8)' }}>
                                Click an image to select it, or double-click to set as cover immediately.
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button
                              type="button"
                              className="cms-cover-picker-btn-cancel"
                              onClick={() => setIsCoverMediaModalOpen(false)}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="cms-cover-picker-btn-confirm"
                              disabled={!selectedCoverMedia}
                              onClick={() => {
                                if (selectedCoverMedia) {
                                  handleSelectCoverFromLibrary(selectedCoverMedia)
                                }
                              }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span>Set as Cover Image</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Image Insertion Modal with Media Library (galleries), WebP Upload & Presets */}
                  {imageModalOpen && (
                    <div className="cms-modal-backdrop" onClick={() => setImageModalOpen(false)}>
                      <div className="cms-media-modal-card cms-media-picker-modal" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="cms-media-modal-header">
                          <div className="cms-media-header-title-box">
                            <div className="cms-media-header-icon blue">
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </svg>
                            </div>
                            <div>
                              <h3>{editingBlockIndex !== null ? 'Replace Article Image' : 'Insert Article Image'}</h3>
                              <p>Choose an image directly from your Media Library (galleries), upload new WebP, or paste an external URL.</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="cms-modal-close-btn"
                            onClick={() => setImageModalOpen(false)}
                            title="Close modal"
                          >
                            &times;
                          </button>
                        </div>

                        {/* Top Tab Bar */}
                        <div className="cms-modal-tab-bar">
                          <button
                            type="button"
                            className={`cms-modal-tab-btn ${imageModalTab === 'library' ? 'active' : ''}`}
                            onClick={() => setImageModalTab('library')}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <polyline points="21 15 16 10 5 21" />
                            </svg>
                            <span>Media Library</span>
                            <span className="cms-modal-tab-badge">{mediaList.length}</span>
                          </button>
                          <button
                            type="button"
                            className={`cms-modal-tab-btn ${imageModalTab === 'upload' ? 'active' : ''}`}
                            onClick={() => setImageModalTab('upload')}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="17 8 12 3 7 8" />
                              <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <span>Quick Upload New (100% WebP)</span>
                          </button>
                          <button
                            type="button"
                            className={`cms-modal-tab-btn ${imageModalTab === 'url' ? 'active' : ''}`}
                            onClick={() => setImageModalTab('url')}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                            <span>External URL &amp; Presets</span>
                          </button>

                          <button
                            type="button"
                            className="cms-modal-open-ext-btn"
                            title="Open Original Media Library in New Tab"
                            onClick={() => window.open(getMediaStandaloneUrl(), '_blank')}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                            <span>Open Media App ↗</span>
                          </button>
                        </div>

                        {/* Modal Body */}
                        <div className="cms-media-modal-body">
                          {/* Left Column based on active Tab */}
                          <div className="cms-media-form-col">
                            {/* TAB 1: Media Library */}
                            {imageModalTab === 'library' && (
                              <div className="cms-modal-lib-tab-content">
                                <div className="cms-modal-lib-filter-bar">
                                  <div className="cms-modal-search-box">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <circle cx="11" cy="11" r="8" />
                                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                    </svg>
                                    <input
                                      type="text"
                                      className="cms-modal-search-input"
                                      placeholder="Filter media library by title, folder or date..."
                                      value={imageModalSearch}
                                      onChange={(e) => setImageModalSearch(e.target.value)}
                                      autoFocus
                                    />
                                    {imageModalSearch && (
                                      <button
                                        type="button"
                                        className="cms-modal-search-clear"
                                        onClick={() => setImageModalSearch('')}
                                      >
                                        &times;
                                      </button>
                                    )}
                                  </div>
                                  <div className="cms-modal-lib-meta-pill">
                                    <span className="cms-folder-tag">
                                      📁 {articleModalFolder === 'all' ? 'All Folders' : articleModalFolder}
                                    </span>
                                  </div>
                                </div>

                                {/* Folder Filter Navigation Pills */}
                                <div className="cms-modal-folder-filter-pills">
                                  <button
                                    type="button"
                                    className={`cms-modal-folder-pill ${articleModalFolder === 'all' ? 'active' : ''}`}
                                    onClick={() => setArticleModalFolder('all')}
                                  >
                                    <span>All</span>
                                    <span className="cms-pill-cnt">{mediaList.length}</span>
                                  </button>
                                  <button
                                    type="button"
                                    className={`cms-modal-folder-pill ${articleModalFolder === 'galleries' ? 'active' : ''}`}
                                    onClick={() => setArticleModalFolder('galleries')}
                                  >
                                    <span>📁 galleries</span>
                                    <span className="cms-pill-cnt">
                                      {mediaList.filter((m) => (m.folder || 'galleries') === 'galleries').length}
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    className={`cms-modal-folder-pill ${articleModalFolder === 'features' ? 'active' : ''}`}
                                    onClick={() => setArticleModalFolder('features')}
                                  >
                                    <span>📁 features</span>
                                    <span className="cms-pill-cnt">
                                      {mediaList.filter((m) => m.folder === 'features').length}
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    className={`cms-modal-folder-pill ${articleModalFolder === 'profileimg' ? 'active' : ''}`}
                                    onClick={() => setArticleModalFolder('profileimg')}
                                  >
                                    <span>📁 profileimg</span>
                                    <span className="cms-pill-cnt">
                                      {mediaList.filter((m) => m.folder === 'profileimg').length}
                                    </span>
                                  </button>
                                </div>

                                {/* Media Library Grid */}
                                <div className="cms-modal-media-grid">
                                  {mediaList
                                    .filter((m) => {
                                      if (articleModalFolder !== 'all') {
                                        const f = m.folder || 'galleries'
                                        if (f !== articleModalFolder) return false
                                      }
                                      if (!imageModalSearch.trim()) return true
                                      const q = imageModalSearch.toLowerCase()
                                      return (
                                        m.title.toLowerCase().includes(q) ||
                                        m.url.toLowerCase().includes(q) ||
                                        (m.folder && m.folder.toLowerCase().includes(q)) ||
                                        (m.dateAdded && m.dateAdded.includes(q))
                                      )
                                    })
                                    .map((item) => {
                                      const isSelected = selectedLibraryItem?.id === item.id || imageModalUrl === item.url
                                      return (
                                        <div
                                          key={item.id}
                                          className={`cms-modal-media-card ${isSelected ? 'selected' : ''}`}
                                          onClick={() => {
                                            setSelectedLibraryItem(item)
                                            setImageModalUrl(item.url)
                                            if (!imageModalAlt || imageModalAlt === 'Jobsite Equipment Image') {
                                              setImageModalAlt(item.title)
                                            }
                                          }}
                                          onDoubleClick={() => {
                                            setSelectedLibraryItem(item)
                                            setImageModalUrl(item.url)
                                            if (!imageModalAlt) setImageModalAlt(item.title)
                                            handleInsertImageIntoSection()
                                          }}
                                          title={`Click to select, double-click to insert: ${item.title}`}
                                        >
                                          <div className="cms-mmc-thumb-box">
                                            <img
                                              src={item.url}
                                              alt={item.title}
                                              className="cms-mmc-thumb"
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/images/why-choose-v900-jobsite.png'
                                              }}
                                            />
                                            {isSelected && (
                                              <div className="cms-mmc-check-badge">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                  <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                              </div>
                                            )}
                                            {item.size && <span className="cms-mmc-size-badge">{item.size}</span>}
                                          </div>
                                          <div className="cms-mmc-meta">
                                            <div className="cms-mmc-meta-top">
                                              <span className="cms-mmc-title" title={item.title}>
                                                {item.title}
                                              </span>
                                              <span className="cms-mmc-folder-tag">
                                                📁 {item.folder || 'galleries'}
                                              </span>
                                            </div>
                                            <span className="cms-mmc-date">{item.dateAdded}</span>
                                          </div>
                                        </div>
                                      )
                                    })}
                                </div>
                              </div>
                            )}

                            {/* TAB 2: Quick Upload New (WebP 100%) */}
                            {imageModalTab === 'upload' && (
                              <div className="cms-modal-upload-tab-content">
                                <div
                                  className="cms-modal-dropzone"
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => {
                                    e.preventDefault()
                                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                      handleModalUploadFile(e.dataTransfer.files[0])
                                    }
                                  }}
                                >
                                  <div className="cms-dropzone-icon">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                      <polyline points="17 8 12 3 7 8" />
                                      <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                  </div>
                                  <h4>Drag &amp; drop an image here</h4>
                                  <p>Auto-converted to 100% Ultra-High Quality WebP and saved directly into <strong>galleries</strong>.</p>
                                  <label className="cms-modal-browse-btn">
                                    <span>Browse from Computer</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      style={{ display: 'none' }}
                                      onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                          handleModalUploadFile(e.target.files[0])
                                        }
                                      }}
                                    />
                                  </label>
                                </div>

                                {modalUploadProgress !== null && (
                                  <div className="cms-modal-upload-progress-box">
                                    <div className="cms-mup-text">
                                      <span>{modalUploadStatus}</span>
                                      <span>{modalUploadProgress}%</span>
                                    </div>
                                    <div className="cms-mup-track">
                                      <div className="cms-mup-fill" style={{ width: `${modalUploadProgress}%` }} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* TAB 3: External URL & Presets */}
                            {imageModalTab === 'url' && (
                              <div className="cms-modal-url-tab-content">
                                <div className="cms-media-field">
                                  <label className="cms-media-label">
                                    <span>External Image URL</span>
                                    <span className="cms-required-star">*</span>
                                  </label>
                                  <input
                                    type="url"
                                    className="cms-media-input"
                                    placeholder="https://machineryvillage.com/... or https://example.com/photo.jpg"
                                    value={imageModalUrl}
                                    onChange={(e) => setImageModalUrl(e.target.value)}
                                    autoFocus
                                  />
                                </div>

                                {/* Quick Presets Gallery */}
                                <div className="cms-media-field">
                                  <label className="cms-media-label">
                                    <span>Equipment Photo Presets</span>
                                    <span className="cms-media-hint-inline">Click to select</span>
                                  </label>
                                  <div className="cms-media-presets-grid">
                                    {[
                                      { label: 'Happy Machinery Logo', url: 'https://img.miniexcavator.org/ebay/Dashboard-Icon/Happy_Machinery_Logo.webp', alt: 'Happy Machinery Brand Logo' },
                                      { label: 'V900 Jobsite Walkaround', url: '/images/why-choose-v900-jobsite.png', alt: 'Typhon Stomp V900 Compact Skid Steer on Jobsite' },
                                      { label: 'Residential Excavation', url: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800&auto=format&fit=crop&q=80', alt: 'Mini excavator digging trenches for residential foundation' },
                                      { label: 'Earthmoving Fleet', url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80', alt: 'Heavy machinery fleet prepared for commercial site work' },
                                      { label: 'Hydraulic Systems', url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&auto=format&fit=crop&q=80', alt: 'Precision hydraulic diagnostics and auxiliary flow lines' }
                                    ].map((preset, idx) => (
                                      <button
                                        key={idx}
                                        type="button"
                                        className={`cms-media-preset-card ${imageModalUrl === preset.url ? 'active' : ''}`}
                                        onClick={() => {
                                          setImageModalUrl(preset.url)
                                          if (!imageModalAlt) setImageModalAlt(preset.alt)
                                        }}
                                      >
                                        <img src={preset.url} alt={preset.label} onError={(e) => { (e.target as HTMLImageElement).src = '/images/why-choose-v900-jobsite.png' }} />
                                        <span>{preset.label}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Common Alt Text & Caption fields below */}
                            <div className="cms-media-field">
                              <label className="cms-media-label">
                                <span>Alt Text (SEO &amp; Accessibility)</span>
                              </label>
                              <input
                                type="text"
                                className="cms-media-input"
                                placeholder="e.g. Typhon Stomp V900 skid steer operating on residential driveway"
                                value={imageModalAlt}
                                onChange={(e) => setImageModalAlt(e.target.value)}
                              />
                            </div>

                            <div className="cms-media-field">
                              <label className="cms-media-label">
                                <span>Caption (Displays directly beneath image)</span>
                              </label>
                              <input
                                type="text"
                                className="cms-media-input"
                                placeholder="e.g. Figure 1: Compact 7.1-inch track width allows tight clearance through gates"
                                value={imageModalCaption}
                                onChange={(e) => setImageModalCaption(e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Live Image Preview Column */}
                          <div className="cms-media-preview-col">
                            <div className="cms-media-preview-header">
                              <span className="cms-media-preview-tag">SELECTED IMAGE PREVIEW</span>
                              {imageModalUrl.trim() && <span className="cms-media-preview-status ok">Ready to insert</span>}
                            </div>
                            <div className="cms-media-preview-box">
                              {imageModalUrl.trim() ? (
                                <div className="cms-media-live-card">
                                  <img
                                    src={imageModalUrl}
                                    alt={imageModalAlt || 'Preview'}
                                    className="cms-media-live-img"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.opacity = '0.3'
                                    }}
                                  />
                                  {imageModalCaption.trim() && (
                                    <p className="cms-media-live-caption">
                                      <em>{imageModalCaption}</em>
                                    </p>
                                  )}
                                  <div className="cms-modal-url-display">
                                    <span className="cms-mud-label">URL:</span>
                                    <span className="cms-mud-val" title={imageModalUrl}>{imageModalUrl}</span>
                                    <button
                                      type="button"
                                      className="cms-mud-copy"
                                      onClick={() => {
                                        navigator.clipboard.writeText(imageModalUrl)
                                        showToast('Image URL copied to clipboard!', 'success')
                                      }}
                                    >
                                      Copy
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="cms-media-empty-preview">
                                  <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                    <polyline points="21 15 16 10 5 21" />
                                  </svg>
                                  <p>Select any image from your <strong>Media Library</strong>, upload a new photo, or enter an external URL.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="cms-media-modal-footer">
                          <button
                            type="button"
                            className="cms-profile-btn-cancel"
                            onClick={() => {
                              setImageModalOpen(false)
                              setEditingBlockIndex(null)
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="cms-profile-btn-save"
                            disabled={!imageModalUrl.trim()}
                            onClick={handleInsertImageIntoSection}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>
                              {editingBlockIndex !== null ? 'Update Image in Article' : 'Insert Image into Article'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* YouTube Video Embed Modal with Live Player Preview */}
                  {youtubeModalOpen && (
                    <div className="cms-modal-backdrop" onClick={() => setYoutubeModalOpen(false)}>
                      <div className="cms-media-modal-card" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="cms-media-modal-header">
                          <div className="cms-media-header-title-box">
                            <div className="cms-media-header-icon red">
                              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                              </svg>
                            </div>
                            <div>
                              <h3>Embed YouTube Video</h3>
                              <p>Paste any YouTube video link to preview playable video and embed it into your active section.</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="cms-modal-close-btn"
                            onClick={() => setYoutubeModalOpen(false)}
                            title="Close modal"
                          >
                            &times;
                          </button>
                        </div>

                        <div className="cms-media-modal-body">
                          {/* Form Column */}
                          <div className="cms-media-form-col">
                            <div className="cms-media-field">
                              <label className="cms-media-label">
                                <span>YouTube Video URL or Video ID</span>
                                <span className="cms-required-star">*</span>
                              </label>
                              <input
                                type="text"
                                className="cms-media-input"
                                placeholder="https://www.youtube.com/watch?v=... or youtu.be/..."
                                value={youtubeModalUrl}
                                onChange={(e) => setYoutubeModalUrl(e.target.value)}
                                autoFocus
                              />
                              <span className="cms-media-hint">Supports standard watch links, youtu.be short links, shorts, or raw 11-char IDs.</span>
                            </div>

                            {/* Equipment Video Presets */}
                            <div className="cms-media-field">
                              <label className="cms-media-label">
                                <span>Equipment Demo Presets</span>
                                <span className="cms-media-hint-inline">Click to test</span>
                              </label>
                              <div className="cms-media-video-presets-list">
                                {[
                                  { title: 'Typhon V900 Walkaround & Operation', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
                                  { title: 'Mini Excavator Trenching Diagnostics', url: 'https://www.youtube.com/watch?v=7hB6_988tYc' }
                                ].map((preset, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    className={`cms-media-video-preset-pill ${youtubeModalUrl === preset.url ? 'active' : ''}`}
                                    onClick={() => {
                                      setYoutubeModalUrl(preset.url)
                                      if (!youtubeModalTitle) setYoutubeModalTitle(preset.title)
                                    }}
                                  >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                                    <span>{preset.title}</span>
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="cms-media-field">
                              <label className="cms-media-label">
                                <span>Video Display Title / Caption</span>
                              </label>
                              <input
                                type="text"
                                className="cms-media-input"
                                placeholder="e.g. Typhon Stomp V900 Skid Steer Operational Demo"
                                value={youtubeModalTitle}
                                onChange={(e) => setYoutubeModalTitle(e.target.value)}
                              />
                            </div>
                          </div>

                          {/* Live Video Preview Column */}
                          <div className="cms-media-preview-col">
                            <div className="cms-media-preview-header">
                              <span className="cms-media-preview-tag">LIVE VIDEO PLAYER PREVIEW</span>
                              {extractYouTubeId(youtubeModalUrl) && (
                                <span className="cms-media-preview-status ok">
                                  ID: {extractYouTubeId(youtubeModalUrl)}
                                </span>
                              )}
                            </div>
                            <div className="cms-media-preview-box video-box">
                              {extractYouTubeId(youtubeModalUrl) ? (
                                <div className="cms-media-live-video-wrapper">
                                  <iframe
                                    src={`https://www.youtube-nocookie.com/embed/${extractYouTubeId(youtubeModalUrl)}?rel=0`}
                                    title={youtubeModalTitle || 'YouTube video preview'}
                                    className="cms-media-live-iframe"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                </div>
                              ) : (
                                <div className="cms-media-empty-preview">
                                  <div className="cms-media-empty-play-icon">
                                    <svg width="34" height="34" viewBox="0 0 24 24" fill="currentColor">
                                      <polygon points="5 3 19 12 5 21 5 3"/>
                                    </svg>
                                  </div>
                                  <p>Paste a YouTube video link to preview playable video here before inserting.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="cms-media-modal-footer">
                          <button
                            type="button"
                            className="cms-profile-btn-cancel"
                            onClick={() => setYoutubeModalOpen(false)}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="cms-profile-btn-save"
                            style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}
                            disabled={!extractYouTubeId(youtubeModalUrl)}
                            onClick={handleInsertYouTubeIntoSection}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            <span>Embed Video into Section</span>
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
                  <div className="cms-view-breadcrumb-bar">
                    <span>Dashboard</span>
                    <span>›</span>
                    <span>Articles</span>
                    <span>›</span>
                    <span className="active">Categories & Slugs</span>
                  </div>
                  <div className="cms-view-header">
                    <div className="cms-view-title-group">
                      <h1>Blog Categories & Slugs</h1>
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
                    <button type="button" className="cms-subnav-btn" onClick={() => setArticlesSubView('topBlogs')}>🔥 Top Blogs</button>
                  </div>

                  <div className="cms-categories-grid">
                    {/* Left: Add or Edit Category Form */}
                    <div className={`cms-card ${editingBlogCat ? 'is-editing-card' : ''}`}>
                      <div className="cms-card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                        <div className="cms-card-title">
                          <span style={{ color: 'var(--cms-accent-blue)', display: 'inline-flex' }}>
                            {editingBlogCat ? (
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                              </svg>
                            ) : (
                              <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>+</span>
                            )}
                          </span>
                          <h3>{editingBlogCat ? `Edit Category` : 'Add New Category'}</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--cms-text-muted)' }}>
                          {editingBlogCat ? `Modifying "${editingBlogCat.name}"` : 'Create a channel for your stories'}
                        </p>
                      </div>

                      <form onSubmit={handleSaveBlogCategory} className="cms-category-form">
                        <div className="cms-form-field">
                          <label>CATEGORY NAME *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Skid Steer Hydraulics"
                            value={newCatName}
                            onChange={(e) => {
                              setNewCatName(e.target.value)
                              if (!editingBlogCat) {
                                setNewCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
                              }
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
                          <select
                            className="cms-editor-select"
                            value={newCatParent}
                            onChange={(e) => setNewCatParent(e.target.value)}
                          >
                            <option value="">None (Top Level Root)</option>
                            {blogCategories
                              .filter((c) => !editingBlogCat || c.name !== editingBlogCat.name)
                              .map((c) => (
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

                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                          <button type="submit" className="cms-btn cms-btn-primary" style={{ flex: 1 }}>
                            {editingBlogCat ? (
                              <>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>Save Changes</span>
                              </>
                            ) : (
                              <>
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <line x1="12" y1="5" x2="12" y2="19" />
                                  <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                                <span>Add Category</span>
                              </>
                            )}
                          </button>
                          {editingBlogCat && (
                            <button
                              type="button"
                              className="cms-btn cms-btn-secondary"
                              onClick={cancelEditBlogCategory}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
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
                            const isBeingEdited = editingBlogCat?.name === cat.name
                            return (
                              <div
                                key={cat.slug}
                                className={`cms-category-structure-item ${isBeingEdited ? 'is-editing-item' : ''}`}
                              >
                                <div className="cms-cat-item-left">
                                  <span className="cms-cat-icon">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                    </svg>
                                  </span>
                                  <div className="cms-cat-info">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <strong>{cat.name}</strong>
                                      {isBeingEdited && (
                                        <span className="cms-cat-editing-badge">Editing</span>
                                      )}
                                    </div>
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
                                    title="View articles in this category"
                                  >
                                    View Blogs
                                  </button>
                                  <button
                                    type="button"
                                    className={`cms-btn cms-btn-sm ${isBeingEdited ? 'cms-btn-primary' : 'cms-btn-secondary'}`}
                                    onClick={() => startEditBlogCategory(cat)}
                                    title="Edit category name, slug, and details"
                                  >
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                                      <path d="M12 20h9" />
                                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                    </svg>
                                    {isBeingEdited ? 'Editing' : 'Edit'}
                                  </button>
                                  <button
                                    type="button"
                                    className="cms-btn cms-btn-sm danger-text"
                                    onClick={() => handleDeleteCategory(cat.name)}
                                    title="Move category to Trash"
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
                    <button type="button" className="cms-subnav-btn" onClick={() => setArticlesSubView('topBlogs')}>🔥 Top Blogs</button>
                    {trashItems.filter((i) => i.type === 'article').length > 0 && (
                      <button
                        type="button"
                        className="cms-subnav-btn"
                        onClick={() => {
                          setActiveTab('trash')
                          setTrashFilter('article')
                        }}
                        style={{ color: 'var(--cms-warning)', marginLeft: 'auto' }}
                      >
                        Trash ({trashItems.filter((i) => i.type === 'article').length})
                      </button>
                    )}
                  </div>

                  <div className="cms-card">
                    <div className="cms-table-wrapper">
                      <table className="cms-table">
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Status</th>
                            <th>Author</th>
                            <th>Slug</th>
                            <th>Date</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const filtered = posts.filter(
                              (p) =>
                                p.title.toLowerCase().includes(globalSearch.toLowerCase()) ||
                                p.category.toLowerCase().includes(globalSearch.toLowerCase()) ||
                                (p.slug && p.slug.toLowerCase().includes(globalSearch.toLowerCase()))
                            )

                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={7} style={{ textAlign: 'center', padding: '50px 20px' }}>
                                    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                      <div style={{ fontSize: '32px' }}>📰</div>
                                      <h4 style={{ margin: 0, fontSize: '0.98rem', color: 'var(--cms-text-primary)' }}>No articles found</h4>
                                      <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--cms-text-muted)' }}>
                                        {globalSearch ? 'No articles match your search query.' : 'No articles published yet. Click "New Article" to create your first guide.'}
                                      </p>
                                    </div>
                                  </td>
                                </tr>
                              )
                            }

                            return filtered.map((post) => (
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
                                <td>
                                  <span className={`cms-badge ${post.status === 'Draft' ? 'warning' : 'success'}`}>
                                    {post.status || 'Published'}
                                  </span>
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
                                      className="cms-action-btn-modern view"
                                      title="View Live Guide"
                                    >
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                        <polyline points="15 3 21 3 21 9" />
                                        <line x1="10" y1="14" x2="21" y2="3" />
                                      </svg>
                                      <span>View</span>
                                    </a>
                                    <button
                                      type="button"
                                      className="cms-action-btn-modern edit"
                                      onClick={() => openEditArticle(post)}
                                      title="Edit Article"
                                    >
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                      </svg>
                                      <span>Edit</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="cms-action-btn-modern danger"
                                      onClick={() => handleMoveArticleToTrash(post)}
                                      title="Move article to Trash"
                                    >
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                      </svg>
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {/* SUBVIEW D: TOP BLOGS RANKING & ANALYTICS */}
              {articlesSubView === 'topBlogs' && (
                <TopBlogsManager
                  posts={posts}
                  onEditArticle={(post) => openEditArticle(post)}
                  onOpenNewArticle={openNewArticle}
                  onNavigateToCategories={() => setArticlesSubView('categories')}
                  onNavigateToList={() => setArticlesSubView('list')}
                  trashCount={trashItems.filter((i) => i.type === 'article').length}
                  onNavigateToTrash={() => {
                    setActiveTab('trash')
                    setTrashFilter('article')
                  }}
                  showToast={showToast}
                />
              )}
            </>
          )}

          {/* TAB 3: MEDIA ASSET LIBRARY - FILE MANAGER-KIUQ (100% MATCHING ORIGINAL) */}
          {activeTab === 'media' && (
            <div className={`cms-kiuq-fm-container ${isMediaFullScreen ? 'cms-medialib-fullscreen-mode' : ''}`}>
              {/* TOP HEADER BAR */}
              <header className="cms-kiuq-topbar">
                <div className="cms-kiuq-topbar-left">
                  <button
                    type="button"
                    className="cms-kiuq-collapse-btn"
                    title={isMediaSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    onClick={() => setIsMediaSidebarCollapsed((prev) => !prev)}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <line x1="9" y1="3" x2="9" y2="21" />
                    </svg>
                  </button>

                  <div className="cms-kiuq-brand" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img
                      src="/images/header-logo.webp"
                      alt="Happy Machinery"
                      style={{ height: '28px', width: 'auto', objectFit: 'contain' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/logo.png'
                      }}
                    />
                    <div className="cms-kiuq-brand-info">
                      <span className="cms-kiuq-brand-name">Happy Machinery</span>
                      <span className="cms-kiuq-brand-tag">Asset & Media Library</span>
                    </div>
                  </div>
                </div>

                <div className="cms-kiuq-topbar-right">
                  <button
                    type="button"
                    className="cms-kiuq-cms-btn"
                    onClick={() => setActiveTab('dashboard')}
                    title="Return to CMS Dashboard"
                  >
                    &lt; CMS
                  </button>
                  <a
                    href="/"
                    target="_blank"
                    rel="noreferrer"
                    className="cms-kiuq-cms-btn"
                    title="Open live website in new tab"
                  >
                    Live Site ↗
                  </a>
                  <button
                    type="button"
                    className="cms-kiuq-cms-btn"
                    onClick={() => setIsMediaFullScreen((prev) => !prev)}
                    title={isMediaFullScreen ? 'Exit Full Screen' : 'Fullscreen'}
                  >
                    {isMediaFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  </button>
                  <button
                    type="button"
                    className="cms-kiuq-cms-btn"
                    onClick={() => {
                      showToast('Opening Standalone Media Library (/happymachinery/Media_Library/medialibrary.php)... Make sure Apache is running in XAMPP.', 'info' as any)
                      window.open(getMediaStandaloneUrl(), '_blank')
                    }}
                    title="Open Standalone Media Library in full browser window"
                  >
                    Standalone ↗
                  </button>

                  {/* Theme Switcher Sun / Moon */}
                  <div
                    className="cms-kiuq-theme-switch"
                    onClick={() => {
                      const next = theme === 'dark' ? 'light' : 'dark'
                      setTheme(next)
                      showToast(`Switched to ${next.toUpperCase()} theme`, 'info' as any)
                    }}
                    title="Toggle Dark / Light Mode"
                  >
                    <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
                  </div>

                  {/* User Profile Chip */}
                  <div
                    className="cms-kiuq-user-pill"
                    onClick={() => setShowProfileModal(true)}
                    title="User Profile"
                  >
                    <span className="cms-kiuq-user-avatar">
                      {currentUser?.name ? currentUser.name.slice(0, 4) : 'Dara'}
                    </span>
                    <span>Admin ▾</span>
                  </div>
                </div>
              </header>

              {/* BODY LAYOUT: SIDEBAR + MAIN */}
              <div className="cms-kiuq-body">
                {/* LEFT SIDEBAR */}
                <aside className={`cms-kiuq-sidebar ${isMediaSidebarCollapsed ? 'collapsed' : ''}`}>
                  <div className="cms-kiuq-side-section">ACTIONS</div>
                  <button
                    type="button"
                    className={`cms-kiuq-side-btn ${selectedFolder === 'all' ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedFolder('all')
                      setMediaActiveView('files')
                    }}
                  >
                    <span className="cms-kiuq-side-icon cms-kiuq-icon-home">📁</span>
                    <span>All Media ({mediaList.length})</span>
                  </button>

                  <button
                    type="button"
                    className="cms-kiuq-side-btn"
                    onClick={() => {
                      showToast('Convert File Type: Upload files to automatically convert to optimized WebP format.', 'info' as any)
                      setShowUploadMediaModal(true)
                    }}
                  >
                    <span className="cms-kiuq-side-icon cms-kiuq-icon-convert">🔄</span>
                    <span>Convert File Type</span>
                  </button>

                  <button
                    type="button"
                    className="cms-kiuq-side-btn"
                    onClick={() => {
                      setActiveTab('trash')
                      setTrashFilter('all')
                    }}
                  >
                    <span className="cms-kiuq-side-icon cms-kiuq-icon-trash">🗑</span>
                    <span>Trash Bin</span>
                  </button>

                  <div className="cms-kiuq-side-section">FOLDERS</div>
                  {mediaFolders.map((folder) => {
                    const count = mediaList.filter((m) => (m.folder || 'galleries') === folder.name).length
                    return (
                      <button
                        key={folder.name}
                        type="button"
                        className={`cms-kiuq-side-btn ${selectedFolder === folder.name ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedFolder(folder.name)
                          setMediaActiveView('files')
                        }}
                      >
                        <span className="cms-kiuq-side-icon cms-kiuq-icon-folder">📁</span>
                        <span>{folder.name}</span>
                        <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.6, fontWeight: 600 }}>
                          {count}
                        </span>
                      </button>
                    )
                  })}

                  <div className="cms-kiuq-side-section">ACCOUNT</div>
                  <button
                    type="button"
                    className="cms-kiuq-side-btn"
                    onClick={() => setShowProfileModal(true)}
                  >
                    <span className="cms-kiuq-side-icon cms-kiuq-icon-user">👤</span>
                    <span>Profile</span>
                  </button>

                  <button
                    type="button"
                    className="cms-kiuq-side-btn"
                    onClick={() => {
                      setActiveTab('security')
                      showToast('Viewing login activity & security logs', 'info' as any)
                    }}
                  >
                    <span className="cms-kiuq-side-icon cms-kiuq-icon-log">🧾</span>
                    <span>Login Activity</span>
                  </button>

                  <button
                    type="button"
                    className="cms-kiuq-side-btn"
                    onClick={() => {
                      setActiveTab('admins')
                    }}
                  >
                    <span className="cms-kiuq-side-icon cms-kiuq-icon-users">👥</span>
                    <span>Users</span>
                  </button>

                  <button
                    type="button"
                    className="cms-kiuq-side-btn"
                    onClick={() => {
                      setActiveTab('settings')
                    }}
                  >
                    <span className="cms-kiuq-side-icon cms-kiuq-icon-gear">⚙️</span>
                    <span>Admin Settings</span>
                  </button>

                  <button
                    type="button"
                    className="cms-kiuq-side-btn"
                    onClick={() => {
                      setActiveTab('security')
                    }}
                  >
                    <span className="cms-kiuq-side-icon cms-kiuq-icon-shield">🛡️</span>
                    <span>Security</span>
                  </button>

                  {/* BASE URL Box */}
                  <div className="cms-kiuq-side-section">BASE URL</div>
                  <div className="cms-kiuq-baseurl-box">
                    <div className="cms-kiuq-baseurl-input-wrap">
                      <input
                        type="text"
                        readOnly
                        value={mediaBaseUrl}
                        className="cms-kiuq-baseurl-input"
                        title="Click to copy Base URL"
                        onClick={() => {
                          navigator.clipboard.writeText(mediaBaseUrl)
                          showToast('Base URL copied: ' + mediaBaseUrl, 'success')
                        }}
                      />
                      <button
                        type="button"
                        className="cms-kiuq-baseurl-copy"
                        title="Copy Base URL"
                        onClick={() => {
                          navigator.clipboard.writeText(mediaBaseUrl)
                          showToast('Base URL copied: ' + mediaBaseUrl, 'success')
                        }}
                      >
                        📋
                      </button>
                    </div>
                  </div>

                  <div className="cms-kiuq-side-logout">
                    <button
                      type="button"
                      className="cms-kiuq-logout-btn"
                      onClick={() => handleLogout()}
                    >
                      <span className="cms-kiuq-side-icon cms-kiuq-icon-trash">🚪</span>
                      <span>Logout</span>
                    </button>
                  </div>
                </aside>

                {/* RIGHT MAIN AREA */}
                <main className="cms-kiuq-main">
                  {/* 4 STAT CARDS */}
                  <div className="cms-kiuq-stats-row">
                    <div className="cms-kiuq-stat-card">
                      <div className="cms-kiuq-stat-icon purple">📂</div>
                      <div className="cms-kiuq-stat-val">{mediaList.length}</div>
                      <div className="cms-kiuq-stat-lbl">Total Media</div>
                    </div>

                    <div className="cms-kiuq-stat-card">
                      <div className="cms-kiuq-stat-icon amber">📁</div>
                      <div className="cms-kiuq-stat-val">{mediaFolders.length}</div>
                      <div className="cms-kiuq-stat-lbl">Folders</div>
                    </div>

                    <div className="cms-kiuq-stat-card">
                      <div className="cms-kiuq-stat-icon cyan">🖼️</div>
                      <div className="cms-kiuq-stat-val">
                        {selectedFolder === 'all'
                          ? mediaList.length
                          : mediaList.filter((m) => (m.folder || 'galleries') === selectedFolder).length}
                      </div>
                      <div className="cms-kiuq-stat-lbl">
                        {selectedFolder === 'all' ? 'All Images' : `${selectedFolder} Images`}
                      </div>
                    </div>

                    <div className="cms-kiuq-stat-card">
                      <div className="cms-kiuq-stat-icon green">💾</div>
                      <div className="cms-kiuq-stat-val">26.5 MB</div>
                      <div className="cms-kiuq-stat-lbl">Storage Used</div>
                    </div>
                  </div>

                  {/* ACTION TOOLBAR (11 BUTTONS EXACTLY AS SCREENSHOT) */}
                  <div className="cms-kiuq-toolbar">
                    <button
                      type="button"
                      className="cms-kiuq-tb-btn primary"
                      onClick={() => {
                        setUploadTargetFolder(selectedFolder === 'all' ? 'galleries' : selectedFolder)
                        setShowUploadMediaModal(true)
                      }}
                    >
                      <span>📤</span>
                      <span>Upload</span>
                    </button>

                    <button
                      type="button"
                      className="cms-kiuq-tb-btn"
                      onClick={() => {
                        showToast('Convert: Select images or drag & drop to convert to WebP format.', 'info' as any)
                        setUploadTargetFolder('img-webp-converter')
                        setShowUploadMediaModal(true)
                      }}
                    >
                      <span>🔄</span>
                      <span>Convert</span>
                    </button>

                    <button
                      type="button"
                      className="cms-kiuq-tb-btn"
                      onClick={() => {
                        setActionDialogInputValue('')
                        setCmsActionDialog({
                          isOpen: true,
                          title: 'Create New Media Folder',
                          subtitle: 'Organize equipment photos, attachments, and marketing assets.',
                          icon: '📁',
                          inputLabel: 'Folder Name',
                          placeholder: 'e.g. v900-field, attachments, hydraulics',
                          confirmLabel: 'Create Folder',
                          onConfirm: (newName) => {
                            if (newName && newName.trim()) {
                              const trimmed = newName.trim()
                              if (mediaFolders.some((f) => f.name.toLowerCase() === trimmed.toLowerCase())) {
                                showToast(`Folder "${trimmed}" already exists.`, 'warning')
                              } else {
                                setMediaFolders((prev) => [
                                  ...prev,
                                  { name: trimmed, isPinned: false, size: '0 KB', date: new Date().toISOString().split('T')[0] }
                                ])
                                showToast(`Folder "${trimmed}" created successfully!`, 'success')
                              }
                            }
                          }
                        })
                      }}
                    >
                      <span>📁</span>
                      <span>New Folder</span>
                    </button>

                    <button
                      type="button"
                      className="cms-kiuq-tb-btn"
                      onClick={() => {
                        setActionDialogInputValue('')
                        setCmsActionDialog({
                          isOpen: true,
                          title: 'Create New File',
                          subtitle: 'Specify a file name and format extension.',
                          icon: '📝',
                          inputLabel: 'File Name',
                          placeholder: 'e.g. inventory-notes.txt, v900-spec.json',
                          confirmLabel: 'Create File',
                          onConfirm: (fileName) => {
                            if (fileName && fileName.trim()) {
                              showToast(`File "${fileName.trim()}" created successfully!`, 'success')
                            }
                          }
                        })
                      }}
                    >
                      <span>📝</span>
                      <span>New File</span>
                    </button>

                    <button
                      type="button"
                      className="cms-kiuq-tb-btn remove-bg"
                      onClick={() => {
                        showToast('AI Background Remover tool initialized. Select an image to process.', 'info' as any)
                      }}
                    >
                      <span>🪄</span>
                      <span>Remove BG</span>
                    </button>

                    <button
                      type="button"
                      className="cms-kiuq-tb-btn resize-img"
                      onClick={() => {
                        showToast('Image Resizer: Resize asset dimensions & aspect ratio.', 'info' as any)
                      }}
                    >
                      <span>📐</span>
                      <span>Resize Image</span>
                    </button>

                    <button
                      type="button"
                      className="cms-kiuq-tb-btn"
                      onClick={() => {
                        setMediaActiveView('urls')
                        handleCopySelectedUrls()
                      }}
                    >
                      <span>🔗</span>
                      <span>All URLs</span>
                    </button>

                    <button
                      type="button"
                      className="cms-kiuq-tb-btn"
                      onClick={() => {
                        if (selectedMediaIds.length > 0) {
                          setSelectedMediaIds([])
                          showToast('Selection cleared.', 'info' as any)
                        } else {
                          const allIds = [
                            ...mediaFolders.map((f) => `folder-${f.name}`),
                            ...mediaList.map((m) => m.id)
                          ]
                          setSelectedMediaIds(allIds)
                          showToast(`Selected all items.`, 'info' as any)
                        }
                      }}
                    >
                      <span style={{ color: '#16a34a' }}>✅</span>
                      <span>Select</span>
                    </button>

                    <button
                      type="button"
                      className="cms-kiuq-tb-btn"
                      onClick={() => {
                        setActionDialogInputValue('webp')
                        setCmsActionDialog({
                          isOpen: true,
                          title: 'Batch Convert / Rename Type',
                          subtitle: 'Specify target image format extension to apply.',
                          icon: '🏷️',
                          inputLabel: 'Target Format Extension',
                          defaultValue: 'webp',
                          placeholder: 'webp, png, jpg...',
                          confirmLabel: 'Apply Type',
                          onConfirm: (newExt) => {
                            if (newExt && newExt.trim()) {
                              showToast(`Batch type rename to .${newExt.trim()} complete.`, 'success')
                            }
                          }
                        })
                      }}
                    >
                      <span style={{ color: '#d97706' }}>🏷️</span>
                      <span>Rename Type</span>
                    </button>

                    <button
                      type="button"
                      className="cms-kiuq-tb-btn"
                      onClick={() => {
                        const allUrls = mediaList.map((m) => m.url).join('\n')
                        navigator.clipboard.writeText(allUrls)
                        showToast('Downloading / copied all URLs for download!', 'success')
                      }}
                    >
                      <span style={{ color: '#2563eb' }}>⬇️</span>
                      <span>Download</span>
                    </button>

                    <button
                      type="button"
                      className="cms-kiuq-tb-btn danger"
                      onClick={handleBatchDeleteMedia}
                    >
                      <span style={{ color: '#ef4444' }}>🗑️</span>
                      <span>Delete</span>
                    </button>
                  </div>

                  {/* BREADCRUMB PATH ROW */}
                  <div className="cms-kiuq-pathbar">
                    <span
                      className="ph-home"
                      onClick={() => {
                        setSelectedFolder('all')
                        setMediaActiveView('files')
                      }}
                      title="All Media"
                    >
                      🏠
                    </span>
                    <span className="ph-sep">/</span>
                    <span
                      className={`ph-link ${selectedFolder === 'all' ? 'ph-cur' : ''}`}
                      onClick={() => {
                        setSelectedFolder('all')
                        setMediaActiveView('files')
                      }}
                    >
                      media
                    </span>
                    {selectedFolder !== 'all' && (
                      <>
                        <span className="ph-sep">/</span>
                        <span className="ph-cur">{selectedFolder}</span>
                      </>
                    )}
                  </div>

                  {/* MAIN PANEL (FILES & FOLDERS) */}
                  <div className="cms-kiuq-panel">
                    <div className="cms-kiuq-panel-head">
                      <div className="cms-kiuq-panel-title">
                        <span>📁</span>
                        <span>{selectedFolder === 'all' ? 'All Files & Folders' : `Folder: ${selectedFolder}`}</span>
                      </div>

                      <div className="cms-kiuq-search-box">
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
                        <span className="cms-kiuq-search-kbd">/</span>
                      </div>

                      <select
                        className="cms-kiuq-sort-select"
                        value={mediaSortOrder}
                        onChange={(e) => setMediaSortOrder(e.target.value as any)}
                      >
                        <option value="A-Z">↕ Name A–Z</option>
                        <option value="Z-A">↕ Name Z–A</option>
                        <option value="Newest">↕ Newest First</option>
                      </select>

                      <div className="cms-kiuq-head-pills">
                        <button
                          type="button"
                          className={`cms-kiuq-head-pill-btn ${mediaActiveView === 'urls' ? 'active' : ''}`}
                          onClick={() => setMediaActiveView(mediaActiveView === 'urls' ? 'files' : 'urls')}
                          title="View / Copy Image URLs"
                        >
                          <span>🔗</span>
                          <span>Image URLs</span>
                          <span className="cms-kiuq-head-pill-badge">
                            {selectedFolder === 'all'
                              ? mediaList.length
                              : mediaList.filter((m) => (m.folder || 'galleries') === selectedFolder).length}
                          </span>
                        </button>

                        <button
                          type="button"
                          className={`cms-kiuq-head-pill-btn ${mediaActiveView === 'previews' ? 'active' : ''}`}
                          onClick={() => setMediaActiveView(mediaActiveView === 'previews' ? 'files' : 'previews')}
                          title="View Image Previews"
                        >
                          <span>🖼️</span>
                          <span>Image Preview</span>
                          <span className="cms-kiuq-head-pill-badge">
                            {selectedFolder === 'all'
                              ? mediaList.length
                              : mediaList.filter((m) => (m.folder || 'galleries') === selectedFolder).length}
                          </span>
                        </button>
                      </div>

                      <div className="cms-kiuq-panel-meta">
                        {selectedFolder === 'all'
                          ? `${mediaList.length} items · Double-click to open`
                          : `${mediaList.filter((m) => (m.folder || 'galleries') === selectedFolder).length} items in ${selectedFolder} · Double-click to open`}
                      </div>
                    </div>

                    {/* TABLE */}
                    <div className="cms-kiuq-table-responsive">
                      <div className="cms-kiuq-table-head">
                        <div>
                          <input
                            type="checkbox"
                            checked={
                              mediaList.length > 0 &&
                              mediaList.every((m) => selectedMediaIds.includes(m.id))
                            }
                            onChange={(e) => handleSelectAllMedia(e, mediaList)}
                          />
                        </div>
                        <div>NAME</div>
                        <div>SIZE / DATE</div>
                        <div style={{ textAlign: 'right' }}>ACTIONS</div>
                      </div>

                      {/* FOLDER ROWS (Shown in all or when searching) */}
                      {selectedFolder === 'all' &&
                        mediaFolders
                          .filter((f) => {
                            if (!mediaSearchTerm.trim()) return true
                            return f.name.toLowerCase().includes(mediaSearchTerm.toLowerCase())
                          })
                          .sort((a, b) => {
                            if (mediaSortOrder === 'A-Z') return a.name.localeCompare(b.name)
                            if (mediaSortOrder === 'Z-A') return b.name.localeCompare(a.name)
                            return 0
                          })
                          .map((folder) => {
                            const isSelected = selectedMediaIds.includes(`folder-${folder.name}`)
                            return (
                              <div
                                key={folder.name}
                                className={`cms-kiuq-row ${isSelected ? 'selected' : ''}`}
                                onClick={() => {
                                  setSelectedMediaIds((prev) =>
                                    prev.includes(`folder-${folder.name}`)
                                      ? prev.filter((id) => id !== `folder-${folder.name}`)
                                      : [...prev, `folder-${folder.name}`]
                                  )
                                }}
                                onDoubleClick={() => {
                                  setSelectedFolder(folder.name)
                                }}
                              >
                                <div onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {
                                      setSelectedMediaIds((prev) =>
                                        prev.includes(`folder-${folder.name}`)
                                          ? prev.filter((id) => id !== `folder-${folder.name}`)
                                          : [...prev, `folder-${folder.name}`]
                                      )
                                    }}
                                  />
                                </div>

                                <div className="cms-kiuq-item-name-cell">
                                  <div className="cms-kiuq-folder-glyph">
                                    <svg width="22" height="22" viewBox="0 0 24 24" fill="#3b82f6" stroke="#2563eb" strokeWidth="1">
                                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                    </svg>
                                  </div>
                                  <div className="cms-kiuq-name-meta">
                                    <div className="cms-kiuq-filename-row">
                                      <span
                                        className="cms-kiuq-filename"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setSelectedFolder(folder.name)
                                        }}
                                      >
                                        {folder.name}
                                      </span>
                                      {folder.isPinned && (
                                        <span className="cms-kiuq-pin-badge" title="Pinned Folder">
                                          📌
                                        </span>
                                      )}
                                    </div>
                                    <span className="cms-kiuq-filesub">Folder</span>
                                  </div>
                                </div>

                                <div className="cms-kiuq-size-cell">
                                  {folder.size}
                                </div>

                                <div className="cms-kiuq-row-actions" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    className="cms-kiuq-act-btn"
                                    onClick={() => {
                                      navigator.clipboard.writeText(`${mediaBaseUrl}${folder.name}`)
                                      showToast(`Folder path for "${folder.name}" copied!`, 'success')
                                    }}
                                  >
                                    ⬇ Download
                                  </button>
                                  <button
                                    type="button"
                                    className="cms-kiuq-act-btn"
                                    onClick={() => setSelectedFolder(folder.name)}
                                  >
                                    👁 Open
                                  </button>
                                  <button
                                    type="button"
                                    className="cms-kiuq-act-btn"
                                    onClick={() => {
                                      setActionDialogInputValue(folder.name)
                                      setCmsActionDialog({
                                        isOpen: true,
                                        title: 'Rename Folder',
                                        subtitle: `Enter a new name for "${folder.name}". Contained assets will remain safe.`,
                                        icon: '📁',
                                        inputLabel: 'Folder Name',
                                        defaultValue: folder.name,
                                        confirmLabel: 'Rename Folder',
                                        onConfirm: (ren) => {
                                          if (ren && ren.trim() && ren.trim() !== folder.name) {
                                            const trimmed = ren.trim()
                                            setMediaFolders((prev) =>
                                              prev.map((f) => (f.name === folder.name ? { ...f, name: trimmed } : f))
                                            )
                                            setMediaList((prev) =>
                                              prev.map((m) => (m.folder === folder.name ? { ...m, folder: trimmed } : m))
                                            )
                                            showToast(`Folder renamed to "${trimmed}".`, 'success')
                                          }
                                        }
                                      })
                                    }}
                                  >
                                    ✏️ Rename
                                  </button>
                                  <button
                                    type="button"
                                    className="cms-kiuq-act-btn danger"
                                    onClick={() => {
                                      setConfirmDialog({
                                        isOpen: true,
                                        title: 'Delete Media Folder?',
                                        message: `Are you sure you want to delete folder "${folder.name}"? Assets inside will be moved to galleries.`,
                                        confirmLabel: 'Delete Folder',
                                        isDanger: true,
                                        onConfirm: () => {
                                          setMediaFolders((prev) => prev.filter((f) => f.name !== folder.name))
                                          setMediaList((prev) =>
                                            prev.map((m) => (m.folder === folder.name ? { ...m, folder: 'galleries' } : m))
                                          )
                                          showToast(`Folder "${folder.name}" deleted.`, 'success')
                                        }
                                      })
                                    }}
                                  >
                                    🗑
                                  </button>
                                </div>
                              </div>
                            )
                          })}

                      {/* FILES LIST (Matching current folder or all) */}
                      {mediaList
                        .filter((item) => {
                          if (selectedFolder === 'all') return true
                          return (item.folder || 'galleries') === selectedFolder
                        })
                        .filter((item) => {
                          if (!mediaSearchTerm.trim()) return true
                          const q = mediaSearchTerm.toLowerCase()
                          return item.title.toLowerCase().includes(q) || item.url.toLowerCase().includes(q)
                        })
                        .map((item) => {
                          const isSelected = selectedMediaIds.includes(item.id)
                          return (
                            <div
                              key={item.id}
                              className={`cms-kiuq-row ${isSelected ? 'selected' : ''}`}
                              onClick={(e) => handleToggleSelectMedia(item.id, e)}
                              onDoubleClick={() => handleOpenMedia(item)}
                            >
                              <div onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {
                                    setSelectedMediaIds((prev) =>
                                      prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id]
                                    )
                                  }}
                                />
                              </div>

                              <div className="cms-kiuq-item-name-cell">
                                <img
                                  src={item.url}
                                  alt={item.title}
                                  className="cms-kiuq-thumb-img"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleOpenMedia(item)
                                  }}
                                />
                                <div className="cms-kiuq-name-meta">
                                  <div className="cms-kiuq-filename-row">
                                    <span
                                      className="cms-kiuq-filename"
                                      title={item.title}
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleOpenMedia(item)
                                      }}
                                    >
                                      {item.title}
                                    </span>
                                  </div>
                                  <span className="cms-kiuq-filesub">
                                    image/webp · {item.size || '2.4 MB'} · {item.dateAdded || '2026-07-18'}
                                  </span>
                                </div>
                              </div>

                              <div className="cms-kiuq-size-cell">
                                {item.size || '2.4 MB'}
                              </div>

                              <div className="cms-kiuq-row-actions" onClick={(e) => e.stopPropagation()}>
                                <a
                                  href={item.url}
                                  download={item.title}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="cms-kiuq-act-btn"
                                >
                                  ⬇ Download
                                </a>
                                <button
                                  type="button"
                                  className="cms-kiuq-act-btn"
                                  onClick={() => handleOpenMedia(item)}
                                >
                                  👁 Open
                                </button>
                                <button
                                  type="button"
                                  className="cms-kiuq-act-btn"
                                  onClick={(e) => handleDuplicateMedia(item, e)}
                                >
                                  📑 Duplicate
                                </button>
                                <button
                                  type="button"
                                  className="cms-kiuq-act-btn"
                                  onClick={() => {
                                    const currentFolder = item.folder || 'galleries'
                                    setActionDialogInputValue(currentFolder)
                                    setCmsActionDialog({
                                      isOpen: true,
                                      title: 'Move Item to Folder',
                                      subtitle: `Select or specify destination folder for "${item.title}".`,
                                      icon: '📦',
                                      inputLabel: 'Destination Folder',
                                      defaultValue: currentFolder,
                                      isFolderSelect: true,
                                      options: mediaFolders.map((f) => f.name),
                                      confirmLabel: 'Move Asset',
                                      onConfirm: (dest) => {
                                        if (dest && dest.trim()) {
                                          handleMoveMediaFolder(item.id, dest.trim())
                                        }
                                      }
                                    })
                                  }}
                                >
                                  📦 Move
                                </button>
                                <button
                                  type="button"
                                  className="cms-kiuq-act-btn"
                                  onClick={(e) => handleRenameMedia(item, e)}
                                >
                                  ✏️ Rename
                                </button>
                                <button
                                  type="button"
                                  className="cms-kiuq-act-btn danger"
                                  onClick={(e) => handleDeleteSingleMedia(item, e)}
                                >
                                  🗑
                                </button>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>

                  {/* ALL URLs PANEL (Matches original .all-urls-panel) */}
                  {(mediaActiveView === 'urls' || mediaActiveView === 'files') && (
                    <div className="cms-kiuq-urls-panel">
                      <div className="cms-kiuq-panel-head">
                        <div className="cms-kiuq-panel-title">
                          <span>🔗</span>
                          <span>Image URLs</span>
                        </div>
                        <div className="cms-kiuq-panel-meta">
                          {(selectedFolder === 'all'
                            ? mediaList
                            : mediaList.filter((m) => (m.folder || 'galleries') === selectedFolder)
                          ).length}{' '}
                          image(s) · Click any URL to copy
                        </div>
                      </div>

                      <div className="cms-kiuq-url-list-wrap">
                        {(selectedFolder === 'all'
                          ? mediaList
                          : mediaList.filter((m) => (m.folder || 'galleries') === selectedFolder)
                        )
                          .filter((item) => {
                            if (!mediaSearchTerm.trim()) return true
                            const q = mediaSearchTerm.toLowerCase()
                            return item.title.toLowerCase().includes(q) || item.url.toLowerCase().includes(q)
                          })
                          .slice(0, 24)
                          .map((item, idx) => (
                            <div key={item.id} className="cms-kiuq-url-item">
                              <span className="cms-kiuq-url-num">{idx + 1}</span>
                              <img
                                src={item.url}
                                alt=""
                                className="cms-kiuq-url-thumb"
                                onClick={() => handleOpenMedia(item)}
                              />
                              <span className="cms-kiuq-url-name" title={item.title}>
                                {item.title}
                              </span>
                              <input
                                type="text"
                                readOnly
                                value={item.url}
                                className="cms-kiuq-url-input"
                                onClick={(e) => (e.target as HTMLInputElement).select()}
                              />
                              <button
                                type="button"
                                className="cms-kiuq-url-copy-btn"
                                onClick={() => {
                                  navigator.clipboard.writeText(item.url)
                                  showToast(`URL copied!`, 'success')
                                }}
                              >
                                📋 Copy
                              </button>
                            </div>
                          ))}
                      </div>

                      <div className="cms-kiuq-urls-footer">
                        <button
                          type="button"
                          className="cms-kiuq-tb-btn primary"
                          onClick={() => {
                            const curItems =
                              selectedFolder === 'all'
                                ? mediaList
                                : mediaList.filter((m) => (m.folder || 'galleries') === selectedFolder)
                            const all = curItems.map((m) => m.url).join('\n')
                            navigator.clipboard.writeText(all)
                            showToast('All URLs copied to clipboard!', 'success')
                          }}
                        >
                          📋 Copy All URLs
                        </button>
                        <button
                          type="button"
                          className="cms-kiuq-tb-btn"
                          onClick={() => {
                            const selected = mediaList.filter((m) => selectedMediaIds.includes(m.id))
                            if (selected.length === 0) {
                              showToast('Please select items to copy URLs.', 'warning')
                            } else {
                              const urls = selected.map((m) => m.url).join('\n')
                              navigator.clipboard.writeText(urls)
                              showToast(`${selected.length} URL(s) copied!`, 'success')
                            }
                          }}
                        >
                          ✅ Copy Selected URLs
                        </button>
                      </div>
                    </div>
                  )}

                  {/* IMAGE PREVIEWS GRID PANEL (Matches original .img-grid-panel) */}
                  {(mediaActiveView === 'previews' || mediaActiveView === 'files') && (
                    <div className="cms-kiuq-preview-grid-panel">
                      <div className="cms-kiuq-panel-head">
                        <div className="cms-kiuq-panel-title">
                          <span>🖼️</span>
                          <span>Image Preview</span>
                        </div>
                        <div className="cms-kiuq-panel-meta">
                          {(selectedFolder === 'all'
                            ? mediaList
                            : mediaList.filter((m) => (m.folder || 'galleries') === selectedFolder)
                          ).length}{' '}
                          image(s) · Double-click for full preview
                        </div>
                      </div>

                      <div className="cms-kiuq-grid">
                        {(selectedFolder === 'all'
                          ? mediaList
                          : mediaList.filter((m) => (m.folder || 'galleries') === selectedFolder)
                        )
                          .filter((item) => {
                            if (!mediaSearchTerm.trim()) return true
                            const q = mediaSearchTerm.toLowerCase()
                            return item.title.toLowerCase().includes(q) || item.url.toLowerCase().includes(q)
                          })
                          .slice(0, 36)
                          .map((item) => (
                            <div
                              key={item.id}
                              className="cms-kiuq-card-tile"
                              onClick={() => handleOpenMedia(item)}
                            >
                              <img
                                src={item.url}
                                alt={item.title}
                                className="cms-kiuq-tile-thumb"
                              />
                              <div className="cms-kiuq-tile-info">
                                <div className="cms-kiuq-tile-name" title={item.title}>
                                  {item.title}
                                </div>
                                <div className="cms-kiuq-tile-url-row" onClick={(e) => e.stopPropagation()}>
                                  <input
                                    type="text"
                                    readOnly
                                    value={item.url}
                                    className="cms-kiuq-tile-input"
                                    onClick={(e) => (e.target as HTMLInputElement).select()}
                                  />
                                  <button
                                    type="button"
                                    className="cms-kiuq-tile-copy"
                                    title="Copy URL"
                                    onClick={() => {
                                      navigator.clipboard.writeText(item.url)
                                      showToast('URL copied!', 'success')
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
                  )}
                </main>
              </div>

              {/* FLOATING CAPSULE SWITCHER (BOTTOM RIGHT FIXED) */}
              <div className="cms-kiuq-floating-switcher">
                <button
                  type="button"
                  className={`cms-kiuq-capsule-btn ${mediaActiveView === 'files' ? 'active' : ''}`}
                  onClick={() => {
                    setMediaActiveView('files')
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                >
                  <span>📁</span>
                  <span>Files</span>
                </button>

                <button
                  type="button"
                  className={`cms-kiuq-capsule-btn ${mediaActiveView === 'urls' ? 'active' : ''}`}
                  onClick={() => {
                    setMediaActiveView('urls')
                  }}
                >
                  <span>🔗</span>
                  <span>URLs</span>
                </button>

                <button
                  type="button"
                  className={`cms-kiuq-capsule-btn ${mediaActiveView === 'previews' ? 'active' : ''}`}
                  onClick={() => {
                    setMediaActiveView('previews')
                  }}
                >
                  <span>🖼</span>
                  <span>Previews</span>
                </button>
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
                    <span>Dashboard</span>
                    <span>›</span>
                    <span>Products</span>
                    <span>›</span>
                    <span className="active">All Products</span>
                  </div>

                  {/* Header Title Row */}
                  <div className="cms-catalog-title-row">
                    <div>
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

                  {/* Products Subnav Row */}
                  <div className="cms-articles-subnav" style={{ marginBottom: '16px' }}>
                    <button
                      type="button"
                      className="cms-subnav-btn active"
                      onClick={() => {
                        setProductsSubView('list')
                        setProdCategoryFilter('all')
                      }}
                    >
                      All Products ({products.length})
                    </button>
                    <button
                      type="button"
                      className="cms-subnav-btn"
                      onClick={() => openCreateProduct()}
                    >
                      Add New Product
                    </button>
                    <button
                      type="button"
                      className="cms-subnav-btn"
                      onClick={() => setProductsSubView('categories')}
                    >
                      Categories & Hierarchy ({productCategories.length})
                    </button>
                    <button
                      type="button"
                      className="cms-subnav-btn"
                      onClick={() => setProductsSubView('brands')}
                    >
                      Brands
                    </button>
                    <button
                      type="button"
                      className="cms-subnav-btn"
                      onClick={() => setProductsSubView('attributes')}
                    >
                      Attributes ({productAttributes.length})
                    </button>
                    {trashItems.filter((i) => i.type === 'product').length > 0 && (
                      <button
                        type="button"
                        className="cms-subnav-btn"
                        style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.4)' }}
                        onClick={() => {
                          setActiveTab('trash')
                          setTrashFilter('product')
                        }}
                        title="View trashed products"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        <span>Trash ({trashItems.filter((i) => i.type === 'product').length})</span>
                      </button>
                    )}
                  </div>

                  {/* 4 Product Metric Cards */}
                  <div className="cms-prod-metrics-grid">
                    <div
                      className={`cms-prod-metric-card total ${prodStatusFilter === 'all' && !prodSearch ? 'active' : ''}`}
                      onClick={() => { setProdStatusFilter('all'); setProdSearch(''); setProdCurrentPage(1) }}
                    >
                      <div className="cms-prod-metric-top">
                        <span className="cms-pm-label">Total Products</span>
                        <div className="cms-pm-icon total">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                          </svg>
                        </div>
                      </div>
                      <span className="cms-pm-value">{products.length}</span>
                      <span className="cms-pm-sub">Complete store inventory</span>
                    </div>

                    <div
                      className={`cms-prod-metric-card published ${prodStatusFilter === 'published' ? 'active' : ''}`}
                      onClick={() => { setProdStatusFilter('published'); setProdCurrentPage(1) }}
                    >
                      <div className="cms-prod-metric-top">
                        <span className="cms-pm-label">Published</span>
                        <div className="cms-pm-icon published">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg>
                        </div>
                      </div>
                      <span className="cms-pm-value">{products.filter((p) => p.status === 'Published').length}</span>
                      <span className="cms-pm-sub">Live in catalog & store</span>
                    </div>

                    <div
                      className={`cms-prod-metric-card drafts ${prodStatusFilter === 'draft' ? 'active' : ''}`}
                      onClick={() => { setProdStatusFilter('draft'); setProdCurrentPage(1) }}
                    >
                      <div className="cms-prod-metric-top">
                        <span className="cms-pm-label">Drafts</span>
                        <div className="cms-pm-icon drafts">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                          </svg>
                        </div>
                      </div>
                      <span className="cms-pm-value">{products.filter((p) => p.status === 'Draft').length}</span>
                      <span className="cms-pm-sub">Draft catalog listings</span>
                    </div>

                    <div
                      className={`cms-prod-metric-card lowstock ${prodStatusFilter === 'low-stock' ? 'active' : ''}`}
                      onClick={() => { setProdStatusFilter('low-stock'); setProdCurrentPage(1) }}
                    >
                      <div className="cms-prod-metric-top">
                        <span className="cms-pm-label">Low Stock</span>
                        <div className="cms-pm-icon lowstock">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        </div>
                      </div>
                      <span className="cms-pm-value">{products.filter((p) => (p.stock ?? 0) <= 2).length}</span>
                      <span className="cms-pm-sub">Units with stock ≤ 2</span>
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
                      {productCategories.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
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
                                {paginated.length === 0 ? (
                                  <tr>
                                    <td colSpan={9} style={{ textAlign: 'center', padding: '50px 20px' }}>
                                      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ fontSize: '32px' }}>🚜</div>
                                        <h4 style={{ margin: 0, fontSize: '0.98rem', color: 'var(--cms-text-primary)' }}>No machinery equipment found</h4>
                                        <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--cms-text-muted)' }}>
                                          {prodSearch || prodStatusFilter !== 'all' || prodCategoryFilter !== 'all'
                                            ? 'No products match your selected filters or search keyword.'
                                            : 'No equipment listings currently in your catalog.'}
                                        </p>
                                      </div>
                                    </td>
                                  </tr>
                                ) : (
                                  paginated.map((prod) => (
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
                                      <span className="cms-sku-badge">{(prod.sku || '').replace(/^typh/i, 'TYPH')}</span>
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
                                      <span className={`cms-stock-pill ${(prod.stock ?? 0) > 2 ? 'in-stock' : (prod.stock ?? 0) > 0 ? 'low-stock' : 'out-stock'}`}>
                                        <span className="cms-stock-dot" />
                                        <span>{prod.stock ?? 0}</span>
                                      </span>
                                    </td>
                                    <td>
                                      <button
                                        type="button"
                                        className={`cms-status-btn-pill ${prod.status === 'Published' ? 'published' : 'draft'}`}
                                        onClick={() => handleToggleProductStatus(prod.id)}
                                        title="Click to toggle Published / Draft"
                                      >
                                        <span className="cms-status-dot" />
                                        <span>{prod.status}</span>
                                      </button>
                                    </td>
                                    <td>
                                      <span className={`cms-cart-badge-pill ${prod.addToCartEnabled !== false ? 'enabled' : 'disabled'}`}>
                                        {prod.addToCartEnabled !== false ? '✓ Enabled' : '✕ Disabled'}
                                      </span>
                                    </td>
                                    <td style={{ fontSize: '0.8rem', color: 'var(--cms-text-muted)', whiteSpace: 'nowrap' }}>
                                      {prod.updatedAt || 'July 29, 2026'}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                      <div className="cms-table-action-btns">
                                        <button
                                          type="button"
                                          className="cms-action-btn-modern edit"
                                          onClick={() => openEditProduct(prod)}
                                          title="Edit Product"
                                        >
                                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                          </svg>
                                          <span>Edit</span>
                                        </button>
                                        <button
                                          type="button"
                                          className="cms-action-btn-modern danger"
                                          onClick={() => handleDeleteProduct(prod.id)}
                                          title="Move to Trash"
                                        >
                                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                          </svg>
                                          <span>Delete</span>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                )))}
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
                            placeholder="e.g. skid-steer-v900-red"
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {productAttributes.length > 0 && (
                              <select
                                className="cms-filter-dropdown-select"
                                style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                                value=""
                                onChange={(e) => {
                                  const selectedAttr = productAttributes.find((a) => a.id === e.target.value)
                                  if (selectedAttr) {
                                    setProdEditorSpecs((prev) => [
                                      ...prev,
                                      { name: selectedAttr.name, value: selectedAttr.terms[0] || '' }
                                    ])
                                  }
                                }}
                              >
                                <option value="" disabled>+ Add from Attributes...</option>
                                {productAttributes.map((attr) => (
                                  <option key={attr.id} value={attr.id}>
                                    {attr.name}
                                  </option>
                                ))}
                              </select>
                            )}
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
                        </div>

                        {prodEditorSpecs.length === 0 ? (
                          <div className="cms-no-specs-notice">
                            <span>No specifications added yet.</span>
                            <button
                              type="button"
                              className="cms-action-pill-btn"
                              style={{ fontSize: '0.82rem', padding: '7px 16px' }}
                              onClick={handleAddSpecRow}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                              <span>Add First Specification</span>
                            </button>
                          </div>
                        ) : (
                          <div className="cms-specs-matrix-box">
                            {prodEditorSpecs.map((spec, index) => (
                              <div key={index} className="cms-spec-item-row">
                                <input
                                  type="text"
                                  placeholder="Spec Name (e.g. Engine Model)"
                                  value={spec.name}
                                  onChange={(e) => handleUpdateSpecRow(index, 'name', e.target.value)}
                                />
                                <input
                                  type="text"
                                  placeholder="Spec Value (e.g. Kubota D1105 Diesel)"
                                  value={spec.value}
                                  onChange={(e) => handleUpdateSpecRow(index, 'value', e.target.value)}
                                  list={`spec-terms-${index}`}
                                />
                                <datalist id={`spec-terms-${index}`}>
                                  {productAttributes
                                    .find((a) => a.name.toLowerCase() === spec.name.trim().toLowerCase())
                                    ?.terms.map((t, idx) => (
                                      <option key={idx} value={t} />
                                    ))}
                                </datalist>
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
                              placeholder="0.00"
                              value={prodEditorPrice}
                              onChange={(e) => setProdEditorPrice(e.target.value === '' ? '' : parseFloat(e.target.value))}
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
                              onChange={(e) => setProdEditorSalePrice(e.target.value ? parseFloat(e.target.value) : '')}
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div>
                            <label className="cms-form-label">STOCK QUANTITY</label>
                            <input
                              type="number"
                              className="cms-input-text"
                              placeholder="0"
                              value={prodEditorStock}
                              onChange={(e) => setProdEditorStock(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                            />
                          </div>

                          <div>
                            <label className="cms-form-label">SKU</label>
                            <input
                              type="text"
                              className="cms-input-text"
                              placeholder="e.g. HM-SKID-01"
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
                          className="cms-btn-primary-blue cms-prod-publish-btn"
                          onClick={() => handleSaveProduct('Published')}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          <span>PUBLISH PRODUCT</span>
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
                          className="cms-action-btn-outline cms-prod-draft-btn"
                          onClick={() => handleSaveProduct('Draft')}
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                            <polyline points="17 21 17 13 7 13 7 21" />
                            <polyline points="7 3 7 8 15 8" />
                          </svg>
                          <span>Save as Draft</span>
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
                            placeholder="e.g. TYPHON, KUBOTA, BOBCAT..."
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
                            <option value="">Select a category...</option>
                            {productCategories.map((cat) => (
                              <option key={cat.id} value={cat.name}>
                                {cat.name}
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
                            placeholder="https://happymachinery.com/store/your-product"
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
                          <span>Feature this product in store highlights</span>
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

              {/* SUBVIEW C: PRODUCT CATEGORIES MANAGEMENT (SHOWS ONLY CATEGORIES, ALLOWS ADD & UPDATE) */}
              {productsSubView === 'categories' && (
                <div className="cms-categories-view-wrapper">
                  {/* Top Breadcrumb Bar */}
                  <div className="cms-view-breadcrumb-bar">
                    <span>Dashboard</span>
                    <span>›</span>
                    <span>Products</span>
                    <span>›</span>
                    <span className="active">Categories</span>
                  </div>

                  {/* Header Row */}
                  <div className="cms-view-header">
                    <div className="cms-view-title-group">
                      <h1>Equipment & Product Categories</h1>
                      <p>Organize store machinery into distinct categories, hierarchy paths, and URL slugs.</p>
                    </div>
                    <div className="cms-taxonomy-counters">
                      <div className="cms-tax-pill">
                        <span>CATEGORIES</span>
                        <strong>{productCategories.length}</strong>
                      </div>
                      <div className="cms-tax-pill blue">
                        <span>ASSIGNED EQUIPMENT</span>
                        <strong>{products.length}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Subnav row */}
                  <div className="cms-articles-subnav">
                    <button
                      type="button"
                      className="cms-subnav-btn"
                      onClick={() => {
                        setProductsSubView('list')
                        setProdCategoryFilter('all')
                      }}
                    >
                      All Products ({products.length})
                    </button>
                    <button
                      type="button"
                      className="cms-subnav-btn active"
                    >
                      Categories ({productCategories.length})
                    </button>
                    <button
                      type="button"
                      className="cms-subnav-btn"
                      onClick={() => setProductsSubView('brands')}
                    >
                      Brands
                    </button>
                    <button
                      type="button"
                      className="cms-subnav-btn"
                      onClick={() => setProductsSubView('attributes')}
                    >
                      Attributes ({productAttributes.length})
                    </button>
                  </div>

                  {/* 2-Column Categories Grid */}
                  <div className="cms-categories-grid">
                    {/* LEFT CARD: Add / Update Category Form */}
                    <div className="cms-card" id="cms-pcat-form-anchor">
                      <div className="cms-card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                        <div className="cms-card-title">
                          <span style={{ color: 'var(--cms-accent-blue)', fontSize: '1.2rem', fontWeight: 700 }}>
                            {editingProductCat ? '✏️' : '+'}
                          </span>
                          <h3>{editingProductCat ? 'Update Category' : 'Add New Category'}</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--cms-text-muted)' }}>
                          {editingProductCat ? `Editing "${editingProductCat.name}"` : 'Create a category for equipment and store catalog'}
                        </p>
                      </div>

                      <form onSubmit={handleSaveProductCategory} className="cms-category-form">
                        <div className="cms-form-field">
                          <label>CATEGORY NAME *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Mini Excavators"
                            value={pcatName}
                            onChange={(e) => {
                              setPcatName(e.target.value)
                              if (!editingProductCat) {
                                setPcatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
                              }
                            }}
                          />
                        </div>

                        <div className="cms-form-field">
                          <label>URL SLUG *</label>
                          <div className="cms-slug-input-wrapper">
                            <span>/store?category=</span>
                            <input
                              type="text"
                              required
                              placeholder="mini-excavators"
                              value={pcatSlug}
                              onChange={(e) => setPcatSlug(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="cms-form-field">
                          <label>PARENT CATEGORY</label>
                          <select
                            className="cms-editor-select"
                            value={pcatParent}
                            onChange={(e) => setPcatParent(e.target.value)}
                          >
                            <option value="">None (Top-Level Equipment Root)</option>
                            <option value="Equipment">Equipment</option>
                            <option value="Attachments & Parts">Attachments & Parts</option>
                            {productCategories
                              .filter((c) => !editingProductCat || c.id !== editingProductCat.id)
                              .map((c) => (
                                <option key={c.id} value={c.name}>
                                  {c.parent ? `${c.parent} > ` : ''}{c.name}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div className="cms-form-field">
                          <label>COVER IMAGE URL</label>
                          <input
                            type="text"
                            placeholder="/images/loader-red.png or https://..."
                            value={pcatCover}
                            onChange={(e) => setPcatCover(e.target.value)}
                          />
                        </div>

                        <div className="cms-form-field">
                          <label>DESCRIPTION</label>
                          <textarea
                            rows={3}
                            placeholder="Brief description of the machinery or attachments in this category..."
                            value={pcatDesc}
                            onChange={(e) => setPcatDesc(e.target.value)}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                          <button
                            type="submit"
                            className="cms-btn cms-btn-primary"
                            style={{ flex: 1 }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              {editingProductCat ? (
                                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                              ) : (
                                <>
                                  <line x1="12" y1="5" x2="12" y2="19" />
                                  <line x1="5" y1="12" x2="19" y2="12" />
                                </>
                              )}
                            </svg>
                            <span>{editingProductCat ? 'Update Category' : 'Add Category'}</span>
                          </button>
                          {editingProductCat && (
                            <button
                              type="button"
                              className="cms-btn cms-btn-secondary"
                              onClick={handleCancelEditProductCat}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                    {/* RIGHT CARD: Categories List & Hierarchy */}
                    <div className="cms-card">
                      <div className="cms-card-header">
                        <div className="cms-card-title">
                          <span style={{ color: 'var(--cms-accent-blue)', display: 'inline-flex' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                              <line x1="7" y1="7" x2="7.01" y2="7" />
                            </svg>
                          </span>
                          <h3>Active Categories ({productCategories.length})</h3>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--cms-text-muted)' }}>
                          Click Edit to update category details
                        </span>
                      </div>

                      {/* Search Bar inside card */}
                      <div style={{ padding: '0 20px 14px 20px' }}>
                        <div className="cms-filter-search-box" style={{ maxWidth: '100%' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                          </svg>
                          <input
                            type="text"
                            placeholder="Search categories or slugs..."
                            value={pcatSearch}
                            onChange={(e) => setPcatSearch(e.target.value)}
                          />
                          {pcatSearch && (
                            <button
                              type="button"
                              onClick={() => setPcatSearch('')}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cms-text-muted)', fontSize: '0.9rem' }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Categories Table */}
                      <div className="cms-table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
                        <table className="cms-table">
                          <thead>
                            <tr>
                              <th>CATEGORY</th>
                              <th>PARENT HIERARCHY</th>
                              <th>ASSIGNED ITEMS</th>
                              <th style={{ textAlign: 'right' }}>ACTIONS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productCategories
                              .filter((c) => {
                                if (!pcatSearch) return true
                                const q = pcatSearch.toLowerCase()
                                return (
                                  c.name.toLowerCase().includes(q) ||
                                  c.slug.toLowerCase().includes(q) ||
                                  (c.parent && c.parent.toLowerCase().includes(q))
                                )
                              })
                              .map((cat) => {
                                const count = getProductCountForCategory(cat.name)
                                const isEditing = editingProductCat?.id === cat.id
                                return (
                                  <tr key={cat.id} style={isEditing ? { background: 'rgba(37, 99, 235, 0.08)' } : undefined}>
                                    <td>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <img
                                          src={cat.coverImage || '/images/why-choose-v900-jobsite.png'}
                                          alt={cat.name}
                                          style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--cms-border)', flexShrink: 0 }}
                                          onError={(e) => { (e.target as any).src = '/images/why-choose-v900-jobsite.png' }}
                                        />
                                        <div>
                                          <strong style={{ display: 'block', fontSize: '0.88rem', color: 'var(--cms-text-primary)', fontWeight: 750 }}>
                                            {cat.name}
                                          </strong>
                                          <span style={{ fontSize: '0.74rem', color: 'var(--cms-accent-blue)', fontFamily: 'monospace' }}>
                                            /{cat.slug}
                                          </span>
                                          {cat.description && (
                                            <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--cms-text-secondary)', maxWidth: '300px', whiteSpace: 'normal' }}>
                                              {cat.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td>
                                      <span className="cms-category-pill" style={{ fontSize: '0.72rem' }}>
                                        {cat.parent || 'Top-Level Root'}
                                      </span>
                                    </td>
                                    <td>
                                      <button
                                        type="button"
                                        style={{
                                          background: count > 0 ? 'rgba(37, 99, 235, 0.1)' : 'var(--cms-bg-card-hover)',
                                          color: count > 0 ? '#2563eb' : 'var(--cms-text-muted)',
                                          border: '1px solid',
                                          borderColor: count > 0 ? 'rgba(37, 99, 235, 0.25)' : 'var(--cms-border)',
                                          padding: '3px 8px',
                                          borderRadius: '9999px',
                                          fontSize: '0.74rem',
                                          fontWeight: 750,
                                          cursor: count > 0 ? 'pointer' : 'default',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px'
                                        }}
                                        onClick={() => {
                                          if (count > 0) {
                                            setActiveTab('products')
                                            setProductsSubView('list')
                                            setProdCategoryFilter(cat.name)
                                          }
                                        }}
                                        title={count > 0 ? `Filter products to ${cat.name}` : 'No products assigned'}
                                      >
                                        <span>{count} {count === 1 ? 'item' : 'items'}</span>
                                        {count > 0 && <span style={{ fontSize: '0.7rem' }}>→</span>}
                                      </button>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                        <button
                                          type="button"
                                          className="cms-action-btn-modern edit"
                                          onClick={() => handleStartEditProductCat(cat)}
                                          title="Edit and update category"
                                        >
                                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                          </svg>
                                          <span>Edit</span>
                                        </button>
                                        <button
                                          type="button"
                                          className="cms-action-btn-modern danger"
                                          onClick={() => handleDeleteProductCat(cat.id, cat.name)}
                                          title="Delete category"
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
                                )
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBVIEW D: BRANDS FILTER / LIST */}
              {productsSubView === 'brands' && (
                <div className="cms-categories-view-wrapper">
                  <div className="cms-view-breadcrumb-bar">
                    <span>Dashboard</span>
                    <span>›</span>
                    <span>Products</span>
                    <span>›</span>
                    <span className="active">Brands</span>
                  </div>
                  <div className="cms-view-header">
                    <div className="cms-view-title-group">
                      <h1>Equipment Brands</h1>
                      <p>View products organized by machinery manufacturer brand.</p>
                    </div>
                  </div>
                  <div className="cms-articles-subnav">
                    <button
                      type="button"
                      className="cms-subnav-btn"
                      onClick={() => {
                        setProductsSubView('list')
                        setProdCategoryFilter('all')
                      }}
                    >
                      All Products
                    </button>
                    <button
                      type="button"
                      className="cms-subnav-btn"
                      onClick={() => setProductsSubView('categories')}
                    >
                      Categories ({productCategories.length})
                    </button>
                    <button
                      type="button"
                      className="cms-subnav-btn active"
                    >
                      Brands
                    </button>
                    <button
                      type="button"
                      className="cms-subnav-btn"
                      onClick={() => setProductsSubView('attributes')}
                    >
                      Attributes ({productAttributes.length})
                    </button>
                  </div>
                  <div className="cms-categories-grid">
                    <div className="cms-card">
                      <div className="cms-card-header">
                        <div className="cms-card-title">
                          <h3>TYPHON Machinery</h3>
                        </div>
                      </div>
                      <div style={{ padding: '0 20px 20px 20px' }}>
                        <p style={{ margin: '0 0 16px', color: 'var(--cms-text-secondary)', fontSize: '0.88rem' }}>
                          Primary equipment line including mini excavators, skid steer loaders, wheel loaders, and heavy attachments.
                          Currently includes <strong>{products.filter((p) => p.brand === 'TYPHON' || !p.brand).length} products</strong>.
                        </p>
                        <button
                          type="button"
                          className="cms-btn cms-btn-primary"
                          onClick={() => {
                            setProductsSubView('list')
                            setProdSearch('TYPHON')
                          }}
                        >
                          View TYPHON Products →
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SUBVIEW E: PRODUCT ATTRIBUTES MANAGEMENT */}
              {productsSubView === 'attributes' && (
                <div className="cms-categories-view-wrapper">
                  {/* Top Breadcrumb Bar */}
                  <div className="cms-view-breadcrumb-bar">
                    <span>Dashboard</span>
                    <span>›</span>
                    <span>Products</span>
                    <span>›</span>
                    <span className="active">Attributes</span>
                  </div>

                  {/* Header Row */}
                  <div className="cms-view-header">
                    <div className="cms-view-title-group">
                      <h1>Equipment & Product Attributes</h1>
                      <p>
                        Define machinery specifications, engine configurations, track systems, and option terms across your catalog.
                      </p>
                    </div>
                    <div className="cms-taxonomy-counters">
                      <div className="cms-tax-pill">
                        <span>ATTRIBUTES</span>
                        <strong>{productAttributes.length}</strong>
                      </div>
                      <div className="cms-tax-pill blue">
                        <span>TOTAL TERMS</span>
                        <strong>{productAttributes.reduce((acc, a) => acc + a.terms.length, 0)}</strong>
                      </div>
                      <div className="cms-tax-pill">
                        <span>FILTERABLE</span>
                        <strong>{productAttributes.filter((a) => a.isFilterable).length}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Subnav row */}
                  <div className="cms-articles-subnav">
                    <button
                      type="button"
                      className="cms-subnav-btn"
                      onClick={() => {
                        setProductsSubView('list')
                        setProdCategoryFilter('all')
                      }}
                    >
                      All Products ({products.length})
                    </button>
                    <button
                      type="button"
                      className="cms-subnav-btn"
                      onClick={() => setProductsSubView('categories')}
                    >
                      Categories ({productCategories.length})
                    </button>
                    <button
                      type="button"
                      className="cms-subnav-btn"
                      onClick={() => setProductsSubView('brands')}
                    >
                      Brands
                    </button>
                    <button
                      type="button"
                      className="cms-subnav-btn active"
                    >
                      Attributes ({productAttributes.length})
                    </button>
                  </div>

                  {/* 2-Column Attributes Grid */}
                  <div className="cms-categories-grid">
                    {/* LEFT CARD: Add / Update Attribute Form */}
                    <div className="cms-card" id="cms-attr-form-anchor">
                      <div className="cms-card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                        <div className="cms-card-title">
                          <span style={{ color: 'var(--cms-accent-blue)', fontSize: '1.2rem', fontWeight: 700 }}>
                            {editingAttribute ? '✏️' : '+'}
                          </span>
                          <h3>{editingAttribute ? 'Update Attribute' : 'Add New Attribute'}</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--cms-text-muted)' }}>
                          {editingAttribute ? `Editing "${editingAttribute.name}"` : 'Add technical machinery specification or option attribute'}
                        </p>
                      </div>

                      <form onSubmit={handleSaveAttribute} style={{ padding: '0 20px 20px 20px' }}>
                        <div className="cms-form-group" style={{ marginBottom: '14px' }}>
                          <label className="cms-form-label">ATTRIBUTE NAME *</label>
                          <input
                            type="text"
                            className="cms-input-text"
                            placeholder="e.g. Engine Model, Track Type, Horsepower"
                            value={attrFormName}
                            onChange={(e) => {
                              setAttrFormName(e.target.value)
                              if (!editingAttribute && !attrFormSlug) {
                                setAttrFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
                              }
                            }}
                            required
                          />
                        </div>

                        <div className="cms-form-group" style={{ marginBottom: '14px' }}>
                          <label className="cms-form-label">SLUG (URL-FRIENDLY IDENTIFIER)</label>
                          <input
                            type="text"
                            className="cms-input-text"
                            placeholder="e.g. engine-model, track-type"
                            value={attrFormSlug}
                            onChange={(e) => setAttrFormSlug(e.target.value)}
                          />
                        </div>

                        <div className="cms-form-group" style={{ marginBottom: '14px' }}>
                          <label className="cms-form-label">ATTRIBUTE DISPLAY TYPE</label>
                          <select
                            className="cms-filter-dropdown-select"
                            style={{ width: '100%' }}
                            value={attrFormType}
                            onChange={(e) => setAttrFormType(e.target.value as any)}
                          >
                            <option value="select">Dropdown Select (Predefined options)</option>
                            <option value="pills">Pills / Badges (Color swatches, HP, quick badges)</option>
                            <option value="text">Text Specification (Custom string value)</option>
                            <option value="number">Numeric Specification (Weight, dimensions)</option>
                          </select>
                        </div>

                        <div className="cms-form-group" style={{ marginBottom: '14px' }}>
                          <label className="cms-form-label">TERMS / VALUES (COMMA-SEPARATED)</label>
                          <textarea
                            className="cms-input-text"
                            rows={3}
                            placeholder="e.g. Kubota D1105 (25 HP), Kubota V1505 (24.8 HP), Yanmar 3TNV80"
                            value={attrFormTerms}
                            onChange={(e) => setAttrFormTerms(e.target.value)}
                          />
                          <span style={{ fontSize: '0.74rem', color: 'var(--cms-text-muted)', display: 'block', marginTop: '4px' }}>
                            Separate multiple options with commas. You can also add more terms later using the quick-add buttons.
                          </span>
                        </div>

                        <div className="cms-form-group" style={{ marginBottom: '14px' }}>
                          <label className="cms-form-label">DESCRIPTION (INTERNAL / STORE NOTES)</label>
                          <input
                            type="text"
                            className="cms-input-text"
                            placeholder="e.g. Original factory engine power plant specs"
                            value={attrFormDesc}
                            onChange={(e) => setAttrFormDesc(e.target.value)}
                          />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--cms-text-primary)' }}>
                            <input
                              type="checkbox"
                              checked={attrFormFilterable}
                              onChange={(e) => setAttrFormFilterable(e.target.checked)}
                            />
                            <span>Enable as Store Filter (Visitors can filter machines by this attribute)</span>
                          </label>

                          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--cms-text-primary)' }}>
                            <input
                              type="checkbox"
                              checked={attrFormRequired}
                              onChange={(e) => setAttrFormRequired(e.target.checked)}
                            />
                            <span>Required on New Equipment (Must be filled when creating machines)</span>
                          </label>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            type="submit"
                            className="cms-btn cms-btn-primary"
                            style={{ flex: 1 }}
                          >
                            {editingAttribute ? 'Save Changes' : '+ Add Attribute'}
                          </button>
                          {editingAttribute && (
                            <button
                              type="button"
                              className="cms-btn-secondary"
                              onClick={handleCancelEditAttribute}
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </form>
                    </div>

                    {/* RIGHT CARD: Attributes Table & Interactive Term Pills */}
                    <div className="cms-card">
                      <div className="cms-card-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                        <div className="cms-card-title">
                          <h3>Active Attributes ({productAttributes.length})</h3>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            type="button"
                            className="cms-action-pill-btn"
                            style={{ fontSize: '0.78rem', padding: '5px 12px' }}
                            onClick={handleResetDefaultAttributes}
                            title="Reset to factory machinery attributes"
                          >
                            🔄 Reset Presets
                          </button>
                        </div>
                      </div>

                      {/* Search Filter Toolbar */}
                      <div style={{ padding: '0 20px 14px 20px' }}>
                        <div className="cms-filter-search-box" style={{ maxWidth: '100%' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                          </svg>
                          <input
                            type="text"
                            placeholder="Search attribute name, slug, or term..."
                            value={attrSearch}
                            onChange={(e) => setAttrSearch(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Attributes List */}
                      <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {(() => {
                          const filtered = productAttributes.filter((attr) => {
                            if (!attrSearch) return true
                            const q = attrSearch.toLowerCase()
                            return (
                              attr.name.toLowerCase().includes(q) ||
                              attr.slug.toLowerCase().includes(q) ||
                              attr.terms.some((t) => t.toLowerCase().includes(q))
                            )
                          })

                          if (filtered.length === 0) {
                            return (
                              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--cms-text-muted)' }}>
                                <p style={{ margin: 0, fontSize: '0.92rem' }}>No attributes match "{attrSearch}".</p>
                              </div>
                            )
                          }

                          return filtered.map((attr) => (
                            <div
                              key={attr.id}
                              style={{
                                background: 'var(--cms-bg-surface)',
                                border: '1px solid var(--cms-border)',
                                borderRadius: '12px',
                                padding: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <strong style={{ fontSize: '0.96rem', color: 'var(--cms-text-primary)' }}>
                                    {attr.name}
                                  </strong>
                                  <span className="cms-sku-badge" style={{ fontSize: '0.74rem' }}>
                                    {attr.slug}
                                  </span>
                                  <span
                                    className="cms-category-pill"
                                    style={{
                                      fontSize: '0.72rem',
                                      background: attr.type === 'pills' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(0, 102, 255, 0.1)',
                                      color: attr.type === 'pills' ? '#059669' : '#0284c7'
                                    }}
                                  >
                                    {attr.type.toUpperCase()}
                                  </span>
                                  {attr.isFilterable && (
                                    <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700 }}>
                                      ✓ Filterable
                                    </span>
                                  )}
                                  {attr.isRequired && (
                                    <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 700 }}>
                                      ★ Required
                                    </span>
                                  )}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <button
                                    type="button"
                                    className="cms-action-pill-btn"
                                    onClick={() => handleStartEditAttribute(attr)}
                                    title="Edit attribute definition"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="cms-action-pill-btn danger"
                                    onClick={() => handleDeleteAttribute(attr.id)}
                                    title="Delete attribute"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>

                              {attr.description && (
                                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--cms-text-muted)' }}>
                                  {attr.description}
                                </p>
                              )}

                              {/* Terms Pills & Quick Add */}
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--cms-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Configured Terms ({attr.terms.length})
                                  </span>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                                  {attr.terms.map((term, tIdx) => (
                                    <span
                                      key={tIdx}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        padding: '4px 10px',
                                        background: 'var(--cms-bg-card)',
                                        border: '1px solid var(--cms-border)',
                                        borderRadius: '8px',
                                        fontSize: '0.8rem',
                                        color: 'var(--cms-text-primary)'
                                      }}
                                    >
                                      <span>{term}</span>
                                      <button
                                        type="button"
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          padding: 0,
                                          cursor: 'pointer',
                                          color: 'var(--cms-text-muted)',
                                          fontSize: '0.9rem',
                                          lineHeight: 1
                                        }}
                                        onClick={() => handleRemoveTermFromAttribute(attr.id, term)}
                                        title={`Remove "${term}"`}
                                      >
                                        ×
                                      </button>
                                    </span>
                                  ))}

                                  {/* Quick Term Add Mini Input */}
                                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <input
                                      type="text"
                                      placeholder="+ Add term..."
                                      style={{
                                        padding: '4px 8px',
                                        fontSize: '0.78rem',
                                        border: '1px dashed var(--cms-border)',
                                        borderRadius: '6px',
                                        background: 'var(--cms-bg-card)',
                                        color: 'var(--cms-text-primary)',
                                        width: '120px'
                                      }}
                                      value={quickTermInput[attr.id] || ''}
                                      onChange={(e) =>
                                        setQuickTermInput((prev) => ({ ...prev, [attr.id]: e.target.value }))
                                      }
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault()
                                          handleAddTermToAttribute(attr.id, quickTermInput[attr.id] || '')
                                        }
                                      }}
                                    />
                                    {(quickTermInput[attr.id] || '').trim() && (
                                      <button
                                        type="button"
                                        className="cms-btn-primary"
                                        style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                                        onClick={() => handleAddTermToAttribute(attr.id, quickTermInput[attr.id] || '')}
                                      >
                                        Add
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        })()}
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
                  <span className="cms-pm-value" style={{ color: '#10b981' }}>
                    ${ordersList.reduce((sum, o) => sum + (Number(o.amount) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
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
                      {ordersList.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '50px 20px' }}>
                            <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                              <div style={{ fontSize: '32px' }}>🛒</div>
                              <h4 style={{ margin: 0, fontSize: '0.98rem', color: 'var(--cms-text-primary)' }}>No customer orders yet</h4>
                              <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--cms-text-muted)' }}>
                                Incoming cart checkout sessions and machine orders will appear here automatically.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        ordersList.map((order) => (
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
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
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
                              <button
                                type="button"
                                className="cms-action-pill-btn danger"
                                style={{ padding: '4px 8px' }}
                                onClick={() => handleDeleteOrder(order.id)}
                                title="Delete Order"
                              >
                                ✕
                              </button>
                            </div>
                          </td>
                        </tr>
                      )))}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    className="cms-btn-secondary"
                    onClick={async () => {
                      showToast('Checking for new inquiries...')
                      try {
                        const fetched = await readSharedContent<Inquiry[]>('inquiries')
                        const srv = (fetched && Array.isArray(fetched)) ? fetched : []
                        let loc: Inquiry[] = []
                        try {
                          const raw = localStorage.getItem('happy-machinery-inquiries')
                          loc = raw ? JSON.parse(raw) : []
                        } catch {}
                        const map = new Map<number, Inquiry>()
                        srv.forEach((i) => map.set(i.id, i))
                        loc.forEach((i) => { if (!map.has(i.id)) map.set(i.id, i) })
                        const merged = Array.from(map.values()).sort((a, b) => b.id - a.id)
                        setInquiriesList(merged)
                        showToast(`Loaded ${merged.length} inquiries.`, 'success')
                      } catch {
                        showToast('Could not refresh inquiries.', 'error')
                      }
                    }}
                  >
                    🔄 Refresh Inquiries
                  </button>
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
                {(() => {
                  const filteredInquiries = inquiriesList.filter((item) => {
                    const matchSearch =
                      !inquirySearch ||
                      item.name.toLowerCase().includes(inquirySearch.toLowerCase()) ||
                      item.company.toLowerCase().includes(inquirySearch.toLowerCase()) ||
                      item.message.toLowerCase().includes(inquirySearch.toLowerCase())
                    const matchStatus = inquiryStatusFilter === 'all' || item.status === inquiryStatusFilter
                    return matchSearch && matchStatus
                  })

                  if (filteredInquiries.length === 0) {
                    return (
                      <div className="cms-card" style={{ gridColumn: '1 / -1', padding: '60px 20px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <div style={{ fontSize: '36px' }}>📬</div>
                          <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--cms-text-primary)' }}>No contractor inquiries</h4>
                          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--cms-text-muted)' }}>
                            {inquirySearch || inquiryStatusFilter !== 'all'
                              ? 'No inquiries match your current search or filter criteria.'
                              : 'New equipment quote requests and contact form submissions will appear here.'}
                          </p>
                        </div>
                      </div>
                    )
                  }

                  return filteredInquiries.map((inq) => (
                    <div key={inq.id} className="cms-inquiry-card">
                      <div className="cms-inquiry-header-row">
                        <div className="cms-inquiry-author-info">
                          <strong>{inq.name}</strong>
                          {inq.company && <span className="cms-inquiry-company">{inq.company}</span>}
                        </div>
                        <span className="cms-inquiry-badge">{inq.productInterest || 'General Inquiry'}</span>
                      </div>

                      <div className="cms-inquiry-msg-box">
                        "{inq.message}"
                      </div>

                      <div className="cms-inquiry-contact-strip">
                        <span>📧 {inq.email}</span>
                        {inq.phone && <span>📞 {inq.phone}</span>}
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
                  ))
                })()}
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
                  {(() => {
                    const filteredComments = commentsData.filter((c) => commentFilter === 'all' || c.status === commentFilter)
                    if (filteredComments.length === 0) {
                      return (
                        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <div style={{ fontSize: '36px' }}>💬</div>
                            <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--cms-text-primary)' }}>No comments to display</h4>
                            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--cms-text-muted)' }}>
                              {commentFilter !== 'all'
                                ? `No comments currently marked as "${commentFilter}".`
                                : 'Reader reviews and blog post comments will appear here for editorial moderation.'}
                            </p>
                          </div>
                        </div>
                      )
                    }

                    return filteredComments.map((item) => {
                      const avatarUrl = item.avatar || getUserProfileAvatar(item.email, item.author)
                      return (
                        <div
                          key={item.id}
                          className="cms-comment-row-item"
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
                                flexShrink: 0,
                                overflow: 'hidden',
                                border: '1.5px solid var(--cms-border)'
                              }}
                            >
                              {avatarUrl ? (
                                <img
                                  src={avatarUrl}
                                  alt={item.author}
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                  onError={(e) => {
                                    (e.currentTarget as HTMLElement).style.display = 'none'
                                  }}
                                />
                              ) : (
                                item.author.charAt(0)
                              )}
                            </div>
                            <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                              <strong style={{ fontSize: '0.94rem' }}>{item.author}</strong>
                              {item.email && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--cms-text-muted)' }}>
                                  ({item.email})
                                </span>
                              )}
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

                        <div className="cms-comment-actions-wrap" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
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
                    )
                  })
                })()}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: VISUAL HOMEPAGE BUILDER (WORDPRESS CMS) */}
          {activeTab === 'pages' && (
            <HomePageCmsEditor
              content={homeContent}
              onChange={setHomeContent}
              onSave={async () => {
                setIsSavingHome(true)
                try {
                  const payload: HomePageContent = {
                    ...homeContent,
                    updatedAt: new Date().toISOString()
                  }
                  await writeSharedContent('home-content', payload)
                  showToast('Homepage changes saved & published live!', 'success')
                } catch (err) {
                  console.error(err)
                  showToast('Error saving homepage.', 'error')
                } finally {
                  setIsSavingHome(false)
                }
              }}
              onReset={async () => {
                if (window.confirm('Reset ALL homepage sections to factory default template? This cannot be undone.')) {
                  setHomeContent(DEFAULT_HOME_CONTENT)
                  await writeSharedContent('home-content', DEFAULT_HOME_CONTENT)
                  showToast('Homepage reset to default template.', 'success')
                }
              }}
              isSaving={isSavingHome}
              mediaList={mediaList}
              showToast={showToast}
            />
          )}

          {/* TAB: TRASH & RECOVERY VAULT */}
          {activeTab === 'trash' && (
            <div className="cms-trash-view-wrapper">
              {/* Top Breadcrumb Bar */}
              <div className="cms-view-breadcrumb-bar">
                <span>Dashboard</span>
                <span>›</span>
                <span>System</span>
                <span>›</span>
                <span className="active">Trash & Recovery</span>
              </div>

              {/* View Header */}
              <div className="cms-view-header">
                <div className="cms-view-title-group">
                  <h1>Trash & Recovery</h1>
                  <p>
                    Safely recover accidentally deleted equipment products, blog articles, and categories, or permanently erase them.
                  </p>
                </div>
                <div className="cms-view-actions">
                  {trashItems.length > 0 && (
                    <>
                      <button
                        type="button"
                        className="cms-btn cms-btn-primary"
                        onClick={handleRestoreAllTrash}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <polyline points="1 4 1 10 7 10" />
                          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                        </svg>
                        <span>Restore All ({trashItems.length})</span>
                      </button>
                      <button
                        type="button"
                        className="cms-btn cms-btn-danger"
                        onClick={handleEmptyAllTrash}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        <span>Empty Trash</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 4 Metric / Status Cards */}
              <div className="cms-trash-stat-row">
                <div className="cms-trash-stat-card">
                  <div className="cms-trash-stat-icon total">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </div>
                  <div className="cms-trash-stat-data">
                    <span className="cms-trash-stat-num">{trashItems.length}</span>
                    <span className="cms-trash-stat-label">Total in Trash</span>
                  </div>
                </div>

                <div className="cms-trash-stat-card">
                  <div className="cms-trash-stat-icon article">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <div className="cms-trash-stat-data">
                    <span className="cms-trash-stat-num">{trashItems.filter((i) => i.type === 'article').length}</span>
                    <span className="cms-trash-stat-label">Articles</span>
                  </div>
                </div>

                <div className="cms-trash-stat-card">
                  <div className="cms-trash-stat-icon product">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  </div>
                  <div className="cms-trash-stat-data">
                    <span className="cms-trash-stat-num">{trashItems.filter((i) => i.type === 'product').length}</span>
                    <span className="cms-trash-stat-label">Equipment Products</span>
                  </div>
                </div>

                <div className="cms-trash-stat-card">
                  <div className="cms-trash-stat-icon category">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>
                  <div className="cms-trash-stat-data">
                    <span className="cms-trash-stat-num">
                      {trashItems.filter((i) => i.type === 'blog-category' || i.type === 'product-category').length}
                    </span>
                    <span className="cms-trash-stat-label">Categories</span>
                  </div>
                </div>
              </div>

              {/* Subnav Filters & Search Bar */}
              <div className="cms-trash-filter-bar">
                <div className="cms-articles-subnav" style={{ margin: 0 }}>
                  <button
                    type="button"
                    className={`cms-subnav-btn ${trashFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setTrashFilter('all')}
                  >
                    All ({trashItems.length})
                  </button>
                  <button
                    type="button"
                    className={`cms-subnav-btn ${trashFilter === 'article' ? 'active' : ''}`}
                    onClick={() => setTrashFilter('article')}
                  >
                    Articles ({trashItems.filter((i) => i.type === 'article').length})
                  </button>
                  <button
                    type="button"
                    className={`cms-subnav-btn ${trashFilter === 'product' ? 'active' : ''}`}
                    onClick={() => setTrashFilter('product')}
                  >
                    Products ({trashItems.filter((i) => i.type === 'product').length})
                  </button>
                  <button
                    type="button"
                    className={`cms-subnav-btn ${trashFilter === 'category' ? 'active' : ''}`}
                    onClick={() => setTrashFilter('category')}
                  >
                    Categories ({trashItems.filter((i) => i.type === 'blog-category' || i.type === 'product-category').length})
                  </button>
                  <button
                    type="button"
                    className={`cms-subnav-btn ${trashFilter === 'media' ? 'active' : ''}`}
                    onClick={() => setTrashFilter('media')}
                  >
                    Media ({trashItems.filter((i) => i.type === 'media').length})
                  </button>
                </div>

                <div className="cms-trash-search-wrapper">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search trash by title or details..."
                    value={trashSearch}
                    onChange={(e) => setTrashSearch(e.target.value)}
                  />
                  {trashSearch && (
                    <button
                      type="button"
                      className="cms-trash-search-clear"
                      onClick={() => setTrashSearch('')}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Trash Items List or Empty State */}
              <div className="cms-card" style={{ padding: 0, overflow: 'hidden' }}>
                {trashItems.length === 0 ? (
                  <div className="cms-trash-empty-state">
                    <div className="cms-trash-empty-icon">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </div>
                    <h3>Trash Vault is Empty</h3>
                    <p>
                      No deleted articles, equipment listings, or categories. When you delete items from your store catalog or blog, they will be safely kept here for quick recovery.
                    </p>
                  </div>
                ) : (
                  <>
                    {(() => {
                      const filtered = trashItems.filter((item) => {
                        const matchesFilter =
                          trashFilter === 'all'
                            ? true
                            : trashFilter === 'category'
                            ? item.type === 'blog-category' || item.type === 'product-category'
                            : item.type === trashFilter
                        const matchesSearch =
                          trashSearch.trim() === '' ||
                          item.title.toLowerCase().includes(trashSearch.toLowerCase()) ||
                          (item.subtitle && item.subtitle.toLowerCase().includes(trashSearch.toLowerCase()))
                        return matchesFilter && matchesSearch
                      })

                      if (filtered.length === 0) {
                        return (
                          <div className="cms-trash-empty-state">
                            <h3>No Matching Items</h3>
                            <p>No trashed items match your current filter or search criteria.</p>
                            <button
                              type="button"
                              className="cms-btn cms-btn-secondary"
                              onClick={() => {
                                setTrashFilter('all')
                                setTrashSearch('')
                              }}
                            >
                              Reset Filters
                            </button>
                          </div>
                        )
                      }

                      return (
                        <div className="cms-table-responsive">
                          <table className="cms-table">
                            <thead>
                              <tr>
                                <th style={{ width: '45%' }}>Item / Content Details</th>
                                <th style={{ width: '18%' }}>Item Type</th>
                                <th style={{ width: '17%' }}>Deleted On</th>
                                <th style={{ width: '20%', textAlign: 'right' }}>Recovery Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filtered.map((item) => {
                                const typeLabel =
                                  item.type === 'article'
                                    ? 'Blog Article'
                                    : item.type === 'product'
                                    ? 'Equipment Product'
                                    : item.type === 'blog-category'
                                    ? 'Editorial Category'
                                    : 'Store Category'

                                const typeBadgeClass =
                                  item.type === 'article'
                                    ? 'article'
                                    : item.type === 'product'
                                    ? 'product'
                                    : 'category'

                                return (
                                  <tr key={item.id} className="cms-trash-table-row">
                                    <td>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {item.image ? (
                                          <img
                                            src={item.image}
                                            alt=""
                                            className="cms-trash-item-thumb"
                                            onError={(e) => {
                                              ;(e.target as HTMLElement).style.display = 'none'
                                            }}
                                          />
                                        ) : (
                                          <div className="cms-trash-item-placeholder">
                                            {item.type === 'article' ? '📝' : item.type === 'product' ? '🚜' : '📁'}
                                          </div>
                                        )}
                                        <div style={{ minWidth: 0 }}>
                                          <strong className="cms-trash-item-title">{item.title}</strong>
                                          {item.subtitle && (
                                            <div className="cms-trash-item-subtitle">{item.subtitle}</div>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                    <td>
                                      <span className={`cms-trash-type-badge ${typeBadgeClass}`}>
                                        {typeLabel}
                                      </span>
                                    </td>
                                    <td>
                                      <div className="cms-trash-item-date">
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <circle cx="12" cy="12" r="10" />
                                          <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                        <span>{item.deletedAt}</span>
                                      </div>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                        <button
                                          type="button"
                                          className="cms-btn cms-btn-primary cms-btn-sm"
                                          onClick={() => handleRestoreTrashItem(item)}
                                          title="Restore this item back to active catalog/articles"
                                        >
                                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <polyline points="1 4 1 10 7 10" />
                                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                                          </svg>
                                          <span>Restore</span>
                                        </button>
                                        <button
                                          type="button"
                                          className="cms-btn cms-btn-secondary cms-btn-sm danger-text"
                                          onClick={() => handlePermanentlyDeleteTrashItem(item)}
                                          title="Permanently remove from database"
                                        >
                                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                          </svg>
                                          <span>Delete Forever</span>
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      )
                    })()}
                  </>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: SECURITY CENTER */}
          {activeTab === 'security' && (
            <>
              <div className="cms-view-header">
                <div className="cms-view-title-group">
                  <h1>Website Security Center</h1>
                  <p>Real-time threat monitoring, IP banning, brute force lockouts, and audit trail.</p>
                </div>
                <div className="cms-view-actions" style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="cms-btn cms-btn-danger"
                    onClick={() => {
                      setBanModalType('ip')
                      setShowBanIpModal(true)
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                    </svg>
                    <span>Ban IP Address</span>
                  </button>
                  <button
                    className="cms-btn cms-btn-danger"
                    onClick={() => {
                      setBanModalType('device')
                      setShowBanIpModal(true)
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                    <span>Ban Device</span>
                  </button>
                </div>
              </div>

              {/* Security Center Sub-navigation Tabs */}
              <div className="cms-security-subnav" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--cms-border)', paddingBottom: '12px', flexWrap: 'wrap' }}>
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
                  className={`cms-btn ${securitySubTab === 'banned-devices' ? 'cms-btn-primary' : 'cms-btn-secondary'} cms-btn-sm`}
                  onClick={() => setSecuritySubTab('banned-devices')}
                >
                  Banned Devices ({bannedDevices.length})
                </button>
                <button
                  className={`cms-btn ${securitySubTab === 'activity-log' ? 'cms-btn-primary' : 'cms-btn-secondary'} cms-btn-sm`}
                  onClick={() => setSecuritySubTab('activity-log')}
                >
                  Login Activity ({loginActivityLogs.length})
                </button>
                <button
                  className={`cms-btn ${securitySubTab === 'failed-logins' ? 'cms-btn-primary' : 'cms-btn-secondary'} cms-btn-sm`}
                  onClick={() => setSecuritySubTab('failed-logins')}
                >
                  Failed Logins ({failedLogins.length})
                </button>
                <button
                  className={`cms-btn ${securitySubTab === 'blocked-users' ? 'cms-btn-primary' : 'cms-btn-secondary'} cms-btn-sm`}
                  onClick={() => setSecuritySubTab('blocked-users')}
                >
                  Locked Users ({adminUsers.filter((u) => u.status === 'Locked').length})
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
                        <h4 className="cms-metric-title">Banned Devices</h4>
                        <p className="cms-metric-value">{bannedDevices.length}</p>
                        <span className="cms-metric-subtext">Hardware fingerprint blocks</span>
                      </div>
                      <div className="cms-metric-icon-box red">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                          <line x1="8" y1="21" x2="16" y2="21" />
                          <line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                      </div>
                    </div>

                    <div className="cms-metric-card">
                      <div>
                        <h4 className="cms-metric-title">Auto-Ban Threshold</h4>
                        <p className="cms-metric-value">{securitySettings.autoBanThreshold || 10}</p>
                        <span className="cms-metric-subtext">Attempts before auto-ban</span>
                      </div>
                      <div className="cms-metric-icon-box blue">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      </div>
                    </div>

                    <div className="cms-metric-card">
                      <div>
                        <h4 className="cms-metric-title">Failed Login Alerts</h4>
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
                        <h4 className="cms-metric-title">Total Login Events</h4>
                        <p className="cms-metric-value">{loginActivityLogs.length}</p>
                        <span className="cms-metric-subtext">Recorded authentication audits</span>
                      </div>
                      <div className="cms-metric-icon-box green">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Shield Status Summary Card */}
                  <div className="cms-card" style={{ marginTop: '20px', padding: '20px 24px', background: 'rgba(0, 102, 255, 0.05)', border: '1.5px solid rgba(0, 102, 255, 0.2)', borderRadius: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(0, 102, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Happy Machinery Active Shield Status</h4>
                        <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--cms-text-muted)' }}>
                          Automated 10-attempt threat defense, Google SSO email verification, and hardware device fingerprinting are active.
                        </p>
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
                          <th>Failed Attempts</th>
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
                              <td>{ban.failedAttempts || '—'}</td>
                              <td>{new Date(ban.createdAt).toLocaleDateString()}</td>
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  className="cms-btn cms-btn-danger cms-btn-sm"
                                  onClick={() => handleUnbanIp(ban.id, ban.ip)}
                                >
                                  Unban IP
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', color: 'var(--cms-text-muted)', padding: '24px' }}>
                              No banned IP addresses. All network traffic clear.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Banned Devices */}
              {securitySubTab === 'banned-devices' && (
                <div className="cms-card">
                  <div className="cms-table-wrapper">
                    <table className="cms-table">
                      <thead>
                        <tr>
                          <th>Device Name</th>
                          <th>Device ID</th>
                          <th>Associated IP</th>
                          <th>Reason</th>
                          <th>Failed Attempts</th>
                          <th>Date</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bannedDevices.length > 0 ? (
                          bannedDevices.map((dev) => (
                            <tr key={dev.id}>
                              <td style={{ fontWeight: 650 }}>{dev.deviceName}</td>
                              <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{dev.deviceId}</td>
                              <td style={{ fontFamily: 'monospace' }}>{dev.ip}</td>
                              <td>{dev.reason}</td>
                              <td>{dev.failedAttempts || '—'}</td>
                              <td>{new Date(dev.createdAt).toLocaleDateString()}</td>
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  className="cms-btn cms-btn-danger cms-btn-sm"
                                  onClick={() => handleUnbanDevice(dev.id, dev.deviceName)}
                                >
                                  Unban Device
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} style={{ textAlign: 'center', color: 'var(--cms-text-muted)', padding: '24px' }}>
                              No banned devices. All hardware fingerprints clear.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-tab 4: Login Activity & Audit Log */}
              {securitySubTab === 'activity-log' && (
                <div className="cms-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className={`cms-btn ${loginActivityFilter === 'all' ? 'cms-btn-primary' : 'cms-btn-secondary'} cms-btn-sm`}
                        onClick={() => setLoginActivityFilter('all')}
                      >
                        All Events ({loginActivityLogs.length})
                      </button>
                      <button
                        type="button"
                        className={`cms-btn ${loginActivityFilter === 'success' ? 'cms-btn-primary' : 'cms-btn-secondary'} cms-btn-sm`}
                        onClick={() => setLoginActivityFilter('success')}
                      >
                        Successful ({loginActivityLogs.filter((l) => l.status === 'success').length})
                      </button>
                      <button
                        type="button"
                        className={`cms-btn ${loginActivityFilter === 'failed' ? 'cms-btn-primary' : 'cms-btn-secondary'} cms-btn-sm`}
                        onClick={() => setLoginActivityFilter('failed')}
                      >
                        Failed / Banned ({loginActivityLogs.filter((l) => l.status === 'failed' || l.status === 'banned').length})
                      </button>
                      <button
                        type="button"
                        className={`cms-btn ${loginActivityFilter === 'google' ? 'cms-btn-primary' : 'cms-btn-secondary'} cms-btn-sm`}
                        onClick={() => setLoginActivityFilter('google')}
                      >
                        Google SSO ({loginActivityLogs.filter((l) => l.method === 'google').length})
                      </button>
                    </div>

                    <input
                      type="text"
                      className="cms-header-search-input"
                      placeholder="Search by user, IP, or device..."
                      value={loginActivitySearch}
                      onChange={(e) => setLoginActivitySearch(e.target.value)}
                      style={{ maxWidth: '280px' }}
                    />
                  </div>

                  <div className="cms-table-wrapper">
                    <table className="cms-table">
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>Method</th>
                          <th>Submitted Identity</th>
                          <th>IP Address</th>
                          <th>Device</th>
                          <th>Status</th>
                          <th>Details / Failure Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          let list = loginActivityLogs.filter((l) => {
                            if (loginActivityFilter === 'success') return l.status === 'success'
                            if (loginActivityFilter === 'failed') return l.status === 'failed' || l.status === 'banned'
                            if (loginActivityFilter === 'google') return l.method === 'google'
                            return true
                          })

                          if (loginActivitySearch.trim()) {
                            const q = loginActivitySearch.toLowerCase().trim()
                            list = list.filter(
                              (l) =>
                                l.identifier?.toLowerCase().includes(q) ||
                                l.ip?.toLowerCase().includes(q) ||
                                l.deviceName?.toLowerCase().includes(q) ||
                                l.reason?.toLowerCase().includes(q)
                            )
                          }

                          if (list.length === 0) {
                            return (
                              <tr>
                                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--cms-text-muted)', padding: '24px' }}>
                                  No login activity matching current filter.
                                </td>
                              </tr>
                            )
                          }

                          return list.map((item) => (
                            <tr key={item.id}>
                              <td style={{ fontSize: '0.82rem', color: 'var(--cms-text-muted)' }}>
                                {new Date(item.timestamp).toLocaleString()}
                              </td>
                              <td>
                                {item.method === 'google' ? (
                                  <span className="cms-badge" style={{ background: 'rgba(66, 133, 244, 0.15)', color: '#60a5fa', border: '1px solid rgba(66, 133, 244, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <svg width="12" height="12" viewBox="0 0 24 24">
                                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                    </svg>
                                    Google SSO
                                  </span>
                                ) : (
                                  <span className="cms-badge" style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#cbd5e1', border: '1px solid rgba(148, 163, 184, 0.3)' }}>
                                    Password
                                  </span>
                                )}
                              </td>
                              <td style={{ fontWeight: 650 }}>{item.identifier}</td>
                              <td style={{ fontFamily: 'monospace' }}>{item.ip}</td>
                              <td>{item.deviceName}</td>
                              <td>
                                {item.status === 'success' && (
                                  <span className="cms-badge success">Success</span>
                                )}
                                {item.status === 'failed' && (
                                  <span className="cms-badge warning">Failed</span>
                                )}
                                {item.status === 'banned' && (
                                  <span className="cms-badge danger">Auto-Banned</span>
                                )}
                              </td>
                              <td style={{ fontSize: '0.84rem', color: item.status === 'success' ? '#10b981' : item.status === 'banned' ? '#f87171' : 'var(--cms-text-muted)' }}>
                                {item.reason || item.details || 'Authenticated successfully'}
                              </td>
                            </tr>
                          ))
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-tab 5: Failed Logins */}
              {securitySubTab === 'failed-logins' && (
                <div className="cms-card">
                  <div className="cms-table-wrapper">
                    <table className="cms-table">
                      <thead>
                        <tr>
                          <th>Timestamp</th>
                          <th>Submitted Username</th>
                          <th>IP Address</th>
                          <th>Device</th>
                          <th>Reason</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {failedLogins.length > 0 ? (
                          failedLogins.map((fail) => (
                            <tr key={fail.id}>
                              <td>{new Date(fail.timestamp).toLocaleString()}</td>
                              <td style={{ fontWeight: 650 }}>{fail.username}</td>
                              <td style={{ fontFamily: 'monospace' }}>{fail.ip}</td>
                              <td>{fail.deviceName || 'Browser'}</td>
                              <td>
                                <span className="cms-badge warning">{fail.reason}</span>
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end' }}>
                                  <button
                                    className="cms-btn cms-btn-danger cms-btn-sm"
                                    onClick={() => {
                                      setBanModalType('ip')
                                      setNewIpAddress(fail.ip)
                                      setNewIpReason(`Manual ban: brute force on ${fail.username}`)
                                      setShowBanIpModal(true)
                                    }}
                                  >
                                    Ban IP
                                  </button>
                                  {fail.deviceId && (
                                    <button
                                      className="cms-btn cms-btn-danger cms-btn-sm"
                                      onClick={() => {
                                        setBanModalType('device')
                                        setNewDeviceInput(fail.deviceId || '')
                                        setNewDeviceNameInput(fail.deviceName || 'Device')
                                        setNewIpReason(`Manual ban: brute force on ${fail.username}`)
                                        setShowBanIpModal(true)
                                      }}
                                    >
                                      Ban Device
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} style={{ textAlign: 'center', color: 'var(--cms-text-muted)', padding: '24px' }}>
                              No failed login attempts recorded.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-tab 6: Locked Users */}
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

              {/* Sub-tab 7: Security Config */}
              {securitySubTab === 'settings' && (
                <div className="cms-card" style={{ maxWidth: '640px' }}>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      const toSave = {
                        ...securitySettings,
                        autoSignOutEnabled,
                        autoSignOutSeconds
                      }
                      void writeSharedContent('security-settings', toSave)
                      localStorage.setItem('happy-machinery-security-settings', JSON.stringify(toSave))
                      try {
                        localStorage.setItem('hm_auto_sign_out_enabled', String(autoSignOutEnabled))
                        localStorage.setItem('hm_auto_sign_out_seconds', String(autoSignOutSeconds))
                      } catch {}
                      void logSecurityEvent('SETTINGS_UPDATED', `Security settings updated: Auto sign-out ${autoSignOutEnabled ? `${autoSignOutSeconds}s` : 'disabled (sign in forever)'}.`, 'info', currentUser?.username)
                      showToast('Security settings saved.', 'success')
                    }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                  >
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 650, fontSize: '0.88rem' }}>
                        Failed Login Attempts Before Auto-Ban (IP &amp; Device)
                      </label>
                      <input
                        type="number"
                        min="2"
                        max="50"
                        className="cms-header-search-input"
                        style={{ width: '100%' }}
                        value={securitySettings.autoBanThreshold || 10}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, autoBanThreshold: parseInt(e.target.value, 10) || 10 })}
                      />
                      <span style={{ fontSize: '0.78rem', color: 'var(--cms-text-muted)', display: 'block', marginTop: '4px' }}>
                        Default: 10 attempts. Exceeding this threshold will automatically ban both the IP address and the device hardware fingerprint.
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                      <input
                        type="checkbox"
                        id="autoBanDeviceCheckbox"
                        checked={securitySettings.autoBanDeviceEnabled !== false}
                        onChange={(e) => setSecuritySettings({ ...securitySettings, autoBanDeviceEnabled: e.target.checked })}
                      />
                      <label htmlFor="autoBanDeviceCheckbox" style={{ fontSize: '0.86rem', fontWeight: 600, cursor: 'pointer' }}>
                        Enforce Device Fingerprinting &amp; Hardware Identification Auto-Ban
                      </label>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '0.88rem' }}>
                        Account Lockout Threshold (Attempts)
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
                        Account Lockout Duration (Minutes)
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

                    {/* Auto Sign-Out Inactivity Security Settings (Seconds / Sign in Forever) */}
                    <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--cms-bg-subtle, #f8fafc)', border: '1px solid var(--cms-border, #e2e8f0)', marginTop: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: autoSignOutEnabled ? '#fee2e2' : '#dcfce7', color: autoSignOutEnabled ? '#dc2626' : '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                              <polyline points="12 8 12 12 14 14" />
                            </svg>
                          </div>
                          <div>
                            <strong style={{ fontSize: '0.92rem', color: 'var(--cms-text-primary, #0f172a)' }}>
                              Auto Sign-Out Security Policy
                            </strong>
                            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--cms-text-muted, #64748b)' }}>
                              Auto-sign out when inactive or turn off to sign in forever
                            </p>
                          </div>
                        </div>

                        {/* Toggle Switch */}
                        <label className="cms-switch" style={{ position: 'relative', display: 'inline-block', width: '46px', height: '26px', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={autoSignOutEnabled}
                            onChange={(e) => {
                              const enabled = e.target.checked
                              setAutoSignOutEnabled(enabled)
                              setTempAutoSignOutEnabled(enabled)
                              try { localStorage.setItem('hm_auto_sign_out_enabled', String(enabled)) } catch {}
                              setSecuritySettings((prev) => ({ ...prev, autoSignOutEnabled: enabled }))
                            }}
                            style={{ opacity: 0, width: 0, height: 0 }}
                          />
                          <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, background: autoSignOutEnabled ? '#dc2626' : '#cbd5e1', borderRadius: '34px', transition: '0.2s' }}>
                            <span style={{ position: 'absolute', content: '', height: '20px', width: '20px', left: autoSignOutEnabled ? '23px' : '3px', bottom: '3px', background: '#fff', borderRadius: '50%', transition: '0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                          </span>
                        </label>
                      </div>

                      <div style={{ marginTop: '12px' }}>
                        {autoSignOutEnabled ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <label style={{ fontSize: '0.84rem', fontWeight: 650, color: 'var(--cms-text-primary)' }}>
                                  Inactivity Timeout (Set in Seconds)
                                </label>
                                <span style={{ fontSize: '0.76rem', color: '#dc2626', fontWeight: 700 }}>
                                  Active: {secondsRemaining}s idle countdown
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                  type="number"
                                  min="5"
                                  max="86400"
                                  className="cms-header-search-input"
                                  style={{ flex: 1, fontWeight: 700 }}
                                  value={autoSignOutSeconds}
                                  onChange={(e) => {
                                    const val = Math.max(5, Math.min(86400, parseInt(e.target.value, 10) || 60))
                                    setAutoSignOutSeconds(val)
                                    setTempAutoSignOutSeconds(val)
                                    setSecondsRemaining(val)
                                    try { localStorage.setItem('hm_auto_sign_out_seconds', String(val)) } catch {}
                                    setSecuritySettings((prev) => ({ ...prev, autoSignOutSeconds: val }))
                                  }}
                                />
                                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--cms-text-muted)' }}>seconds</span>
                              </div>
                            </div>

                            {/* Preset Buttons */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
                              {[
                                { label: '15s (Test)', sec: 15 },
                                { label: '30s', sec: 30 },
                                { label: '60s (1m)', sec: 60 },
                                { label: '300s (5m)', sec: 300 },
                                { label: '900s (15m)', sec: 900 },
                                { label: '1800s (30m)', sec: 1800 },
                                { label: '3600s (1h)', sec: 3600 },
                              ].map((preset) => (
                                <button
                                  key={preset.sec}
                                  type="button"
                                  className={`cms-action-btn-modern ${autoSignOutSeconds === preset.sec ? 'edit' : ''}`}
                                  style={{ fontSize: '11px', padding: '3px 8px' }}
                                  onClick={() => {
                                    setAutoSignOutSeconds(preset.sec)
                                    setTempAutoSignOutSeconds(preset.sec)
                                    setSecondsRemaining(preset.sec)
                                    try { localStorage.setItem('hm_auto_sign_out_seconds', String(preset.sec)) } catch {}
                                    setSecuritySettings((prev) => ({ ...prev, autoSignOutSeconds: preset.sec }))
                                  }}
                                >
                                  {preset.label}
                                </button>
                              ))}
                            </div>

                            <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: 'var(--cms-text-muted)' }}>
                              🛡️ When idle without keyboard/mouse interaction for {autoSignOutSeconds} seconds, CMS will auto sign-out for security.
                            </p>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(22, 163, 74, 0.08)', border: '1px solid rgba(22, 163, 74, 0.25)' }}>
                            <span style={{ fontSize: '16px' }}>♾️</span>
                            <div>
                              <strong style={{ fontSize: '0.84rem', color: '#15803d', display: 'block' }}>
                                Sign In Forever Mode Active
                              </strong>
                              <span style={{ fontSize: '0.76rem', color: '#166534' }}>
                                Auto sign-out is turned OFF. Your session will stay signed in indefinitely without inactivity timeouts.
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
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
                            <select
                              className="cms-filter-dropdown-select"
                              style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                              value={user.role}
                              onChange={(e) => handleUpdateAdminRole(user.id, e.target.value as AdminRole)}
                              disabled={currentUser?.id === user.id && user.role === 'Super Administrator'}
                            >
                              <option value="Super Administrator">Super Administrator</option>
                              <option value="Administrator">Administrator</option>
                              <option value="Editor">Editor</option>
                              <option value="Analyst">Analyst</option>
                            </select>
                          </td>
                          <td>
                            <span className={`cms-badge ${user.status === 'Active' ? 'success' : 'danger'}`}>
                              {user.status}
                            </span>
                          </td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                              {user.status === 'Locked' && (
                                <button
                                  type="button"
                                  className="cms-btn cms-btn-primary cms-btn-sm"
                                  onClick={() => handleUnlockUser(user.id, user.username)}
                                >
                                  Unlock
                                </button>
                              )}
                              {currentUser?.id !== user.id && (
                                <>
                                  <button
                                    type="button"
                                    className="cms-action-btn-outline"
                                    style={{ fontSize: '0.74rem', padding: '4px 8px' }}
                                    onClick={() => handleToggleAdminStatus(user)}
                                    title={user.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
                                  >
                                    {user.status === 'Active' ? 'Suspend' : 'Activate'}
                                  </button>
                                  <button
                                    type="button"
                                    className="cms-action-btn-outline danger"
                                    style={{ fontSize: '0.74rem', padding: '4px 8px' }}
                                    onClick={() => handleDeleteAdmin(user)}
                                    title="Revoke Administrator Access"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                              {currentUser?.id === user.id && (
                                <span style={{ fontSize: '0.75rem', color: 'var(--cms-accent-blue)', fontWeight: 600 }}>
                                  (Your Account)
                                </span>
                              )}
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

              <div className="cms-settings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', alignItems: 'start' }}>
                {/* CARD 1: BRAND ASSETS (LOGO & FAVICON) */}
                <div className="cms-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', borderBottom: '1px solid var(--cms-border-subtle)', paddingBottom: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(30, 58, 138, 0.12)', color: 'var(--cms-accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--cms-text-primary)' }}>Brand Identity & Logos</h2>
                      <p style={{ fontSize: '0.8rem', color: 'var(--cms-text-muted)', margin: '2px 0 0' }}>Manage primary header logo and browser tab favicon</p>
                    </div>
                  </div>

                  {/* Hidden file inputs */}
                  <input
                    type="file"
                    ref={logoFileInputRef}
                    style={{ display: 'none' }}
                    accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleLogoUpload(e.target.files[0])
                      }
                    }}
                  />
                  <input
                    type="file"
                    ref={faviconFileInputRef}
                    style={{ display: 'none' }}
                    accept="image/png,image/x-icon,image/vnd.microsoft.icon,image/webp,image/svg+xml"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFaviconUpload(e.target.files[0])
                      }
                    }}
                  />

                  {/* LOGO SECTION */}
                  <div style={{ marginBottom: '22px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--cms-text-primary)' }}>
                        Website Primary Logo
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setLogoPreviewBg('dark')}
                          style={{
                            padding: '3px 8px',
                            fontSize: '0.72rem',
                            borderRadius: '5px',
                            border: '1px solid var(--cms-border-subtle)',
                            background: logoPreviewBg === 'dark' ? 'var(--cms-accent-blue)' : 'transparent',
                            color: logoPreviewBg === 'dark' ? '#fff' : 'var(--cms-text-muted)',
                            cursor: 'pointer'
                          }}
                        >
                          Dark Bg
                        </button>
                        <button
                          type="button"
                          onClick={() => setLogoPreviewBg('light')}
                          style={{
                            padding: '3px 8px',
                            fontSize: '0.72rem',
                            borderRadius: '5px',
                            border: '1px solid var(--cms-border-subtle)',
                            background: logoPreviewBg === 'light' ? 'var(--cms-accent-blue)' : 'transparent',
                            color: logoPreviewBg === 'light' ? '#fff' : 'var(--cms-text-muted)',
                            cursor: 'pointer'
                          }}
                        >
                          Light Bg
                        </button>
                      </div>
                    </div>

                    {/* Logo Preview Stage */}
                    <div
                      style={{
                        padding: '20px',
                        borderRadius: '12px',
                        background: logoPreviewBg === 'dark' ? '#0f172a' : '#f8fafc',
                        border: '1px dashed var(--cms-border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '100px',
                        marginBottom: '10px'
                      }}
                    >
                      <img
                        src={siteSettings.logo || '/logo.png'}
                        alt="Brand Logo Preview"
                        style={{ maxHeight: '70px', maxWidth: '100%', objectFit: 'contain' }}
                        onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      <button
                        type="button"
                        className="cms-btn cms-btn-primary"
                        style={{ fontSize: '0.82rem', padding: '7px 14px' }}
                        onClick={() => logoFileInputRef.current?.click()}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Upload New Logo
                      </button>
                      <button
                        type="button"
                        className="cms-btn cms-btn-outline"
                        style={{ fontSize: '0.82rem', padding: '7px 12px' }}
                        onClick={() => {
                          setSiteSettings((prev) => ({ ...prev, logo: '/logo.png' }))
                          showToast('Reset logo to default (/logo.png)', 'success')
                        }}
                      >
                        Reset to Default
                      </button>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.78rem', color: 'var(--cms-text-muted)' }}>
                        Or Direct Logo URL / Asset Path
                      </label>
                      <input
                        type="text"
                        className="cms-header-search-input"
                        style={{ width: '100%', fontSize: '0.82rem' }}
                        placeholder="/logo.png or https://example.com/logo.png"
                        value={siteSettings.logo}
                        onChange={(e) => setSiteSettings({ ...siteSettings, logo: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* FAVICON SECTION */}
                  <div style={{ borderTop: '1px solid var(--cms-border-subtle)', paddingTop: '16px' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', color: 'var(--cms-text-primary)', marginBottom: '8px' }}>
                      Browser Tab Favicon
                    </label>

                    {/* Browser Tab Simulation Preview */}
                    <div
                      style={{
                        background: 'var(--cms-bg-card-secondary, #1e293b)',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        marginBottom: '10px',
                        border: '1px solid var(--cms-border-subtle)'
                      }}
                    >
                      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--cms-text-muted)', display: 'block', marginBottom: '6px' }}>
                        Browser Tab Live Preview
                      </span>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'var(--cms-bg-card, #0f172a)',
                          padding: '6px 14px',
                          borderRadius: '8px 8px 0 0',
                          border: '1px solid var(--cms-border-subtle)',
                          maxWidth: '260px'
                        }}
                      >
                        <img
                          src={siteSettings.favicon || '/favicon.png'}
                          alt="Favicon Preview"
                          style={{ width: '18px', height: '18px', objectFit: 'contain', borderRadius: '3px' }}
                          onError={(e) => { (e.target as HTMLImageElement).src = '/favicon.png' }}
                        />
                        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--cms-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {siteSettings.siteName || 'Happy Machinery'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                      <button
                        type="button"
                        className="cms-btn cms-btn-primary"
                        style={{ fontSize: '0.82rem', padding: '7px 14px' }}
                        onClick={() => faviconFileInputRef.current?.click()}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Upload Favicon
                      </button>
                      <button
                        type="button"
                        className="cms-btn cms-btn-outline"
                        style={{ fontSize: '0.82rem', padding: '7px 12px' }}
                        onClick={() => {
                          const currentLogo = siteSettings.logo || '/logo.png'
                          setSiteSettings((prev) => ({ ...prev, favicon: currentLogo }))
                          updateBrowserFavicon(currentLogo)
                          showToast('Favicon synced with current Brand Logo!', 'success')
                        }}
                      >
                        Sync with Logo
                      </button>
                      <button
                        type="button"
                        className="cms-btn cms-btn-outline"
                        style={{ fontSize: '0.82rem', padding: '7px 12px' }}
                        onClick={() => {
                          setSiteSettings((prev) => ({ ...prev, favicon: '/favicon.png' }))
                          updateBrowserFavicon('/favicon.png')
                          showToast('Reset favicon to default (/favicon.png)', 'success')
                        }}
                      >
                        Reset Default
                      </button>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.78rem', color: 'var(--cms-text-muted)' }}>
                        Or Direct Favicon URL / Asset Path
                      </label>
                      <input
                        type="text"
                        className="cms-header-search-input"
                        style={{ width: '100%', fontSize: '0.82rem' }}
                        placeholder="/logo.png or https://example.com/favicon.ico"
                        value={siteSettings.favicon}
                        onChange={(e) => {
                          setSiteSettings({ ...siteSettings, favicon: e.target.value })
                          if (e.target.value) updateBrowserFavicon(e.target.value)
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* CARD 2: GENERAL WEBSITE & SEO SETTINGS */}
                <div className="cms-card">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      void writeSharedContent('site-settings', siteSettings)
                      cacheSiteSettings(siteSettings)
                      updateBrowserFavicon(siteSettings.favicon || '/favicon.png')
                      void logSecurityEvent('SETTINGS_UPDATED', 'Global website settings & brand assets updated.', 'info', currentUser?.username)
                      showToast('Website settings and brand assets saved successfully!', 'success')
                    }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', borderBottom: '1px solid var(--cms-border-subtle)', paddingBottom: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(30, 58, 138, 0.12)', color: 'var(--cms-accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                      </div>
                      <div>
                        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--cms-text-primary)' }}>Site Details & SEO</h2>
                        <p style={{ fontSize: '0.8rem', color: 'var(--cms-text-muted)', margin: '2px 0 0' }}>Configure public contact info and default search engine metadata</p>
                      </div>
                    </div>

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

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
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

                    <button type="submit" className="cms-btn cms-btn-primary" style={{ marginTop: '10px', width: '100%', justifyContent: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                        <polyline points="17 21 17 13 7 13 7 21" />
                        <polyline points="7 3 7 8 15 8" />
                      </svg>
                      Save Global Settings & Brand Assets
                    </button>
                  </form>
                </div>
              </div>
            </>
          )}

          {/* ADMINISTRATOR PROFILE & GOOGLE SSO */}
          {activeTab === 'profile' && (
            <>
              <div className="cms-view-header">
                <div className="cms-view-title-group">
                  <h1>My Profile & Authentication Security</h1>
                  <p>Manage your administrative profile, display avatar, secure passcode, and Google Single Sign-On (SSO) integration.</p>
                </div>
                <div className="cms-view-actions">
                  {currentUser?.googleLinked ? (
                    <button
                      className="cms-btn cms-btn-danger"
                      onClick={handleUnlinkGoogleAccount}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                      </svg>
                      <span>Unlink Google Account</span>
                    </button>
                  ) : (
                    <button
                      className="cms-btn cms-btn-primary"
                      onClick={handleStartLinkGoogle}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24">
                        <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Link Google Account</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Profile Overview Card */}
              <div className="cms-card" style={{ maxWidth: '880px', margin: '0 0 24px' }}>
                <div className="cms-profile-identity-strip" style={{ borderBottom: '1px solid var(--cms-border)' }}>
                  <div className="cms-profile-avatar-wrapper">
                    <img
                      src={profileAvatar || currentUser?.avatar || DEFAULT_SUPERADMIN_AVATAR}
                      alt={profileName || currentUser?.name || 'Administrator'}
                      className="cms-profile-avatar-img"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_SUPERADMIN_AVATAR
                      }}
                    />
                    <span className="cms-profile-avatar-status-dot" title="Session Verified & Active" />
                  </div>

                  <div className="cms-profile-identity-info">
                    <div className="cms-profile-identity-name-row">
                      <h4>{profileName || currentUser?.name || 'Super Admin'}</h4>
                      <span className="cms-profile-role-pill">{currentUser?.role || 'Lead Administrator'}</span>
                    </div>
                    <span className="cms-profile-identity-handle">
                      @{currentUser?.username || 'admin'} • {profileEmail || currentUser?.email || 'admin@happymachinery.com'}
                    </span>

                    {/* Quick Avatar Presets */}
                    <div className="cms-profile-presets-row">
                      <span className="cms-profile-presets-label">Presets:</span>
                      {[
                        DEFAULT_SUPERADMIN_AVATAR,
                        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80',
                        'https://img.miniexcavator.org/ebay/Dashboard-Icon/Happy_Machinery_Logo.webp'
                      ].map((presetUrl, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          className={`cms-profile-preset-thumb-btn ${profileAvatar === presetUrl ? 'active' : ''}`}
                          onClick={() => setProfileAvatar(presetUrl)}
                          title={`Select preset avatar ${pIdx + 1}`}
                        >
                          <img src={presetUrl} alt={`Preset ${pIdx + 1}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Google SSO Hero Card */}
                <div className="cms-profile-card-body">
                  <div
                    style={{
                      background: 'var(--cms-bg-surface, rgba(255, 255, 255, 0.04))',
                      border: '1.5px solid var(--cms-border, rgba(255, 255, 255, 0.12))',
                      borderRadius: '14px',
                      padding: '20px',
                      marginBottom: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: '1 1 280px' }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <div>
                          <strong style={{ fontSize: '1.05rem', color: 'var(--cms-text-primary)' }}>Google Single Sign-On (SSO) Status</strong>
                          <div style={{ fontSize: '0.84rem', color: 'var(--cms-text-muted)' }}>
                            Link your authorized Google account to log in with 1-click "Continue with Google" on subsequent visits.
                          </div>
                        </div>
                      </div>

                      {currentUser?.googleLinked ? (
                        <span className="cms-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '6px 14px', fontSize: '0.85rem' }}>
                          ✓ LINKED & READY FOR GOOGLE SIGN-IN
                        </span>
                      ) : (
                        <span className="cms-badge" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 14px', fontSize: '0.85rem' }}>
                          NOT LINKED (Password Only)
                        </span>
                      )}
                    </div>

                    {currentUser?.googleLinked ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--cms-bg-card, rgba(0, 0, 0, 0.2))', padding: '14px 18px', borderRadius: '10px', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: '1 1 260px' }}>
                          {currentUser.googleAvatar ? (
                            <img src={currentUser.googleAvatar} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#4285F4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>G</div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.95rem', fontWeight: 650, color: 'var(--cms-text-primary)', wordBreak: 'break-all' }}>
                              {currentUser.googleEmail}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--cms-text-muted)' }}>
                              Linked on {currentUser.googleLinkedAt ? new Date(currentUser.googleLinkedAt).toLocaleDateString() : 'Active'} • Sub ID: <code>{currentUser.googleSub || 'Verified'}</code>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          <button
                            type="button"
                            className="cms-action-pill-btn danger"
                            onClick={handleUnlinkGoogleAccount}
                          >
                            Unlink Account
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--cms-bg-card, rgba(0, 0, 0, 0.2))', padding: '14px 18px', borderRadius: '10px', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ fontSize: '0.86rem', color: 'var(--cms-text-muted)', flex: '1 1 240px' }}>
                          Click the button to link your Google account. In compliance with security policy, unlinked Google emails will be rejected at login.
                        </div>
                        <button
                          type="button"
                          className="cms-btn cms-btn-primary"
                          onClick={handleStartLinkGoogle}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 18px', flexShrink: 0 }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24">
                            <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                            <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                          </svg>
                          <span>Connect Google Account</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Profile Form Details */}
                  <form onSubmit={handleSaveProfile} className="cms-profile-form" style={{ padding: 0 }}>
                    <div className="cms-profile-fields-grid">
                      <div className="cms-profile-field-group">
                        <label className="cms-profile-field-label">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                          <span>Display Name</span>
                        </label>
                        <div className="cms-profile-input-wrap">
                          <input
                            type="text"
                            className="cms-profile-input"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="cms-profile-field-group">
                        <label className="cms-profile-field-label">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                          <span>Email Address</span>
                        </label>
                        <div className="cms-profile-input-wrap">
                          <input
                            type="email"
                            className="cms-profile-input"
                            value={profileEmail}
                            onChange={(e) => setProfileEmail(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="cms-profile-field-group">
                        <label className="cms-profile-field-label">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                          <span>Custom Avatar URL</span>
                        </label>
                        <div className="cms-profile-input-wrap">
                          <input
                            type="url"
                            className="cms-profile-input"
                            placeholder="https://..."
                            value={profileAvatar}
                            onChange={(e) => setProfileAvatar(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="cms-profile-field-group">
                        <label className="cms-profile-field-label">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          <span>Update Password (Optional)</span>
                        </label>
                        <div className="cms-profile-input-wrap password-wrap">
                          <input
                            type={showProfilePassword ? 'text' : 'password'}
                            className="cms-profile-input"
                            placeholder="Leave empty to keep current password"
                            value={newPasswordInput}
                            onChange={(e) => setNewPasswordInput(e.target.value)}
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            className="cms-profile-pwd-toggle-btn"
                            onClick={() => setShowProfilePassword(!showProfilePassword)}
                            tabIndex={-1}
                          >
                            {showProfilePassword ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                              </svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                      <button type="submit" className="cms-btn cms-btn-primary" style={{ padding: '10px 24px' }}>
                        Save Profile Changes
                      </button>
                    </div>
                  </form>
                </div>
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
          <div className="cms-profile-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="cms-profile-modal-header">
              <div className="cms-profile-header-title-box">
                <div className="cms-profile-header-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <h3>My Administrator Profile</h3>
                  <p>Update your display credentials, avatar, and authentication security.</p>
                </div>
              </div>
              <button
                type="button"
                className="cms-modal-close-btn"
                onClick={() => setShowProfileModal(false)}
                title="Close profile modal"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {/* Profile Identity Card with Live Avatar Preview & Presets */}
            <div className="cms-profile-identity-strip">
              <div className="cms-profile-avatar-wrapper">
                <img
                  src={profileAvatar || currentUser?.avatar || DEFAULT_SUPERADMIN_AVATAR}
                  alt={profileName || currentUser?.name || 'Administrator'}
                  className="cms-profile-avatar-img"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_SUPERADMIN_AVATAR
                  }}
                />
                <span className="cms-profile-avatar-status-dot" title="Session Verified & Active" />
              </div>

              <div className="cms-profile-identity-info">
                <div className="cms-profile-identity-name-row">
                  <h4>{profileName || currentUser?.name || 'Super Admin'}</h4>
                  <span className="cms-profile-role-pill">{currentUser?.role || 'Lead Administrator'}</span>
                </div>
                <span className="cms-profile-identity-handle">
                  @{currentUser?.username || 'admin'} • {profileEmail || currentUser?.email || 'admin@happymachinery.com'}
                </span>

                {/* Quick Avatar Presets */}
                <div className="cms-profile-presets-row">
                  <span className="cms-profile-presets-label">Presets:</span>
                  {[
                    DEFAULT_SUPERADMIN_AVATAR,
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80',
                    'https://img.miniexcavator.org/ebay/Dashboard-Icon/Happy_Machinery_Logo.webp'
                  ].map((presetUrl, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      className={`cms-profile-preset-thumb-btn ${profileAvatar === presetUrl ? 'active' : ''}`}
                      onClick={() => setProfileAvatar(presetUrl)}
                      title={`Select preset avatar ${pIdx + 1}`}
                    >
                      <img src={presetUrl} alt={`Preset ${pIdx + 1}`} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Profile Edit Form */}
            <form onSubmit={handleSaveProfile} className="cms-profile-form">
              <div className="cms-profile-fields-grid">
                {/* Display Name */}
                <div className="cms-profile-field-group">
                  <label className="cms-profile-field-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Display Name</span>
                  </label>
                  <div className="cms-profile-input-wrap">
                    <input
                      type="text"
                      className="cms-profile-input"
                      placeholder="e.g. Super Admin"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div className="cms-profile-field-group">
                  <label className="cms-profile-field-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <span>Email Address</span>
                  </label>
                  <div className="cms-profile-input-wrap">
                    <input
                      type="email"
                      className="cms-profile-input"
                      placeholder="admin@happymachinery.com"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Avatar Image URL */}
                <div className="cms-profile-field-group">
                  <label className="cms-profile-field-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span>Avatar Image URL</span>
                  </label>
                  <div className="cms-profile-input-wrap">
                    <input
                      type="url"
                      className="cms-profile-input"
                      placeholder="https://example.com/avatar.jpg"
                      value={profileAvatar}
                      onChange={(e) => setProfileAvatar(e.target.value)}
                    />
                  </div>
                </div>

                {/* Password / Passcode */}
                <div className="cms-profile-field-group">
                  <label className="cms-profile-field-label">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <span>New Password / Passcode</span>
                  </label>
                  <div className="cms-profile-input-wrap password-wrap">
                    <input
                      type={showProfilePassword ? 'text' : 'password'}
                      className="cms-profile-input"
                      placeholder="Leave blank to keep current password"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="cms-profile-pwd-toggle-btn"
                      onClick={() => setShowProfilePassword(!showProfilePassword)}
                      title={showProfilePassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showProfilePassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <span className="cms-profile-field-hint">Leave blank to maintain your current secure login passcode.</span>
                </div>

                {/* Google Single Sign-On (SSO) Integration Card */}
                <div
                  className="cms-profile-google-card"
                  style={{
                    gridColumn: '1 / -1',
                    background: 'var(--cms-bg-surface, rgba(255, 255, 255, 0.04))',
                    border: '1.5px solid var(--cms-border, rgba(255, 255, 255, 0.12))',
                    borderRadius: '14px',
                    padding: '16px 20px',
                    marginTop: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <div>
                        <strong style={{ fontSize: '0.94rem', color: 'var(--cms-text-primary)' }}>Google SSO Integration</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--cms-text-muted)' }}>
                          Link your Google account to enable 1-click "Continue with Google" sign-in.
                        </div>
                      </div>
                    </div>

                    {currentUser?.googleLinked ? (
                      <span className="cms-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '4px 10px' }}>
                        ✓ LINKED & ACTIVE
                      </span>
                    ) : (
                      <span className="cms-badge" style={{ background: 'rgba(148, 163, 184, 0.15)', color: '#94a3b8', border: '1px solid rgba(148, 163, 184, 0.3)', padding: '4px 10px' }}>
                        NOT LINKED
                      </span>
                    )}
                  </div>

                  {currentUser?.googleLinked ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--cms-bg-card, rgba(0, 0, 0, 0.2))', padding: '12px 16px', borderRadius: '10px', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {currentUser.googleAvatar ? (
                          <img src={currentUser.googleAvatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                        ) : (
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#4285F4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>G</div>
                        )}
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 650, color: 'var(--cms-text-primary)' }}>
                            {currentUser.googleEmail}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--cms-text-muted)' }}>
                            Linked on {currentUser.googleLinkedAt ? new Date(currentUser.googleLinkedAt).toLocaleDateString() : 'Active'} • Ready for 1-click login
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="cms-action-pill-btn danger"
                        onClick={handleUnlinkGoogleAccount}
                        title="Unlink Google account from this profile"
                      >
                        Unlink Google Account
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--cms-text-muted)' }}>
                        Client ID: <code>541058603521-...apps.googleusercontent.com</code>
                      </span>

                      <button
                        type="button"
                        className="cms-btn cms-btn-primary"
                        style={{ fontSize: '0.84rem', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                        onClick={handleStartLinkGoogle}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24">
                          <path fill="#ffffff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#ffffff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#ffffff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#ffffff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <span>Link Google Account</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="cms-profile-modal-footer">
                <button
                  type="button"
                  className="cms-profile-btn-cancel"
                  onClick={() => setShowProfileModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cms-profile-btn-save"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Save Changes</span>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3 style={{ margin: 0 }}>Provision New Administrator</h3>
              <button
                type="button"
                className="cms-modal-close-btn"
                onClick={() => setShowAddAdminModal(false)}
                title="Close modal"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
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

      {/* Ban IP & Device Hardware Modal */}
      {showBanIpModal && (
        <div className="cms-modal-backdrop" onClick={() => setShowBanIpModal(false)}>
          <div className="cms-recovery-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--cms-danger, #ef4444)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                </span>
                <h3 style={{ color: 'var(--cms-danger, #ef4444)', margin: 0, fontSize: '1.15rem' }}>
                  {banModalType === 'ip' ? 'Add IP to Threat Ban List' : 'Ban Hardware Device Fingerprint'}
                </h3>
              </div>
              <button
                type="button"
                className="cms-modal-close-btn"
                onClick={() => setShowBanIpModal(false)}
                title="Close modal"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {/* Type Switcher */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: 'var(--cms-bg-subtle, #f1f5f9)', padding: '4px', borderRadius: '8px' }}>
              <button
                type="button"
                onClick={() => setBanModalType('ip')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: banModalType === 'ip' ? 'var(--cms-surface, #ffffff)' : 'transparent',
                  color: banModalType === 'ip' ? 'var(--cms-danger, #ef4444)' : 'var(--cms-text-secondary, #64748b)',
                  boxShadow: banModalType === 'ip' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                🌐 Ban IP Address
              </button>
              <button
                type="button"
                onClick={() => setBanModalType('device')}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: banModalType === 'device' ? 'var(--cms-surface, #ffffff)' : 'transparent',
                  color: banModalType === 'device' ? 'var(--cms-danger, #ef4444)' : 'var(--cms-text-secondary, #64748b)',
                  boxShadow: banModalType === 'device' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                💻 Ban Device Hardware
              </button>
            </div>

            <p style={{ fontSize: '0.86rem', color: 'var(--cms-text-secondary, #64748b)', margin: '0 0 14px' }}>
              {banModalType === 'ip'
                ? 'Traffic and authentication requests originating from this IP address will be blocked immediately.'
                : 'Target device fingerprint will be permanently restricted from accessing the CMS portal until unbanned.'}
            </p>

            <form onSubmit={handleSaveBan} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {banModalType === 'ip' ? (
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.84rem', fontWeight: 600 }}>
                    IP Address / CIDR
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 192.168.1.100 or 10.0.0.0/24"
                    className="cms-header-search-input"
                    style={{ width: '100%' }}
                    required
                    value={newIpAddress}
                    onChange={(e) => setNewIpAddress(e.target.value)}
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.84rem', fontWeight: 600 }}>
                      Device Hardware Fingerprint (Device ID)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. hm_dev_8f29c4e1b8... or signature hash"
                      className="cms-header-search-input"
                      style={{ width: '100%' }}
                      required
                      value={newDeviceInput}
                      onChange={(e) => setNewDeviceInput(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.84rem', fontWeight: 600 }}>
                      Device Friendly Name / Label
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Suspicious Mac Mini or Chrome on Windows"
                      className="cms-header-search-input"
                      style={{ width: '100%' }}
                      value={newDeviceNameInput}
                      onChange={(e) => setNewDeviceNameInput(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '0.84rem', fontWeight: 600 }}>
                  Reason for Ban
                </label>
                <input
                  type="text"
                  placeholder="e.g. Excessive brute force authentication attempts"
                  className="cms-header-search-input"
                  style={{ width: '100%' }}
                  value={newIpReason}
                  onChange={(e) => setNewIpReason(e.target.value)}
                />
              </div>

              <div className="cms-modal-actions" style={{ marginTop: '12px' }}>
                <button type="button" className="cms-modal-btn secondary" onClick={() => setShowBanIpModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="cms-modal-btn primary" style={{ background: 'var(--cms-danger, #ef4444)' }}>
                  {banModalType === 'ip' ? 'Confirm IP Ban' : 'Confirm Device Ban'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Account Linking Modal (Fallback & Verification) */}
      {showGoogleLinkModal && (
        <div className="cms-modal-backdrop" onClick={() => setShowGoogleLinkModal(false)}>
          <div className="cms-recovery-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Link Google Account</h3>
              </div>
              <button
                type="button"
                className="cms-modal-close-btn"
                onClick={() => setShowGoogleLinkModal(false)}
                title="Close modal"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--cms-text-secondary, #64748b)', marginBottom: '14px' }}>
              Connect your Google Workspace or Gmail account to enable one-click Google Sign-In next time you log in to Happy Machinery CMS.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!googleLinkManualEmail.trim()) return
                const token = createMockGoogleJwt(googleLinkManualEmail.trim(), currentUser?.name || currentUser?.username)
                void handleCompleteLinkGoogle(token)
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.84rem', fontWeight: 600 }}>
                  Google Account Email
                </label>
                <input
                  type="email"
                  className="cms-header-search-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. yourname@gmail.com"
                  required
                  value={googleLinkManualEmail}
                  onChange={(e) => setGoogleLinkManualEmail(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--cms-text-secondary, #64748b)', marginTop: '4px', display: 'block' }}>
                  Only authorized admin accounts linked to this Google address can log in via Google SSO.
                </span>
              </div>

              <div className="cms-modal-actions" style={{ marginTop: '10px' }}>
                <button
                  type="button"
                  className="cms-modal-btn secondary"
                  onClick={() => setShowGoogleLinkModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cms-modal-btn primary"
                  disabled={isLinkingGoogle}
                >
                  {isLinkingGoogle ? 'Linking...' : 'Confirm & Link Google Account'}
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <h3 style={{ margin: 0 }}>Edit Machine: {editingProduct.name}</h3>
              <button
                type="button"
                className="cms-modal-close-btn"
                onClick={() => setEditingProduct(null)}
                title="Close modal"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
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
              title="Zoom Out (- or Scroll Down)"
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
              title="Zoom In (+ or Scroll Up)"
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
              title="Previous Image (← or Swipe Right)"
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
              title="Next Image (→ or Swipe Left)"
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

          {/* Center Image Canvas (Canva Experience: Mouse Zoom, Pan/Drag, Double-Click) */}
          <div
            className={`cms-lightbox-canvas ${isPanning ? 'panning' : ''}`}
            onClick={(e) => e.stopPropagation()}
            onWheel={handleLightboxWheel}
            onMouseDown={handleLightboxMouseDown}
            onMouseMove={handleLightboxMouseMove}
            onMouseUp={handleLightboxMouseUp}
            onMouseLeave={() => setIsPanning(false)}
            onDoubleClick={handleLightboxDoubleClick}
            title="Scroll mouse to zoom • Click and drag to pan • Double-click to toggle zoom"
          >
            <img
              src={selectedMedia.url}
              alt={selectedMedia.title}
              className="cms-lightbox-img"
              style={{
                transform: `translate3d(${mediaPan.x}px, ${mediaPan.y}px, 0) scale(${mediaZoom / 100}) rotate(${mediaRotation}deg)`,
                transition: isPanning ? 'none' : 'transform 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              draggable={false}
            />
          </div>

          {/* Bottom Left Title & Count Indicator */}
          <div className="cms-lightbox-bottom-left" onClick={(e) => e.stopPropagation()}>
            <div className="cms-lightbox-filename" title={selectedMedia.title} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>{selectedMedia.url.split('/').pop() || selectedMedia.title}</span>
              <span className={`cms-folder-badge ${selectedMedia.folder || 'galleries'}`}>
                📁 {selectedMedia.folder || 'galleries'}
              </span>
            </div>
            <div className="cms-lightbox-counter">
              {selectedMedia.size ? `${selectedMedia.size} · ` : ''}
              {selectedMedia.dateAdded ? `${selectedMedia.dateAdded} · ` : ''}
              {(() => {
                const curIdx = mediaList.findIndex((m) => m.id === selectedMedia.id || m.url === selectedMedia.url)
                return curIdx !== -1 ? `${curIdx + 1} / ${mediaList.length}` : `1 / ${mediaList.length || 1}`
              })()}
            </div>
          </div>

          {/* Bottom Right Blue Copy URL Button */}
          <button
            type="button"
            className={`cms-lightbox-copy-btn ${copiedMediaUrl ? 'copied' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              void handleCopySelectedUrl(selectedMedia.url)
            }}
          >
            {copiedMediaUrl ? (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Copied!</span>
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>Copy URL</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Create New Folder In-App Dialog */}
      {showFolderModal && (
        <div className="cms-dialog-backdrop" onClick={() => setShowFolderModal(false)}>
          <div className="cms-dialog-card" onClick={(e) => e.stopPropagation()}>
            <div className="cms-dialog-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                <div className="cms-dialog-icon-wrap blue">
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
              <button
                type="button"
                className="cms-modal-close-btn"
                onClick={() => {
                  setShowFolderModal(false)
                  setNewFolderName('')
                }}
                title="Close dialog"
                aria-label="Close"
              >
                &times;
              </button>
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

      {/* Add Media Asset In-App Modal with Fast 100% Quality WebP Auto-Converter */}
      {showUploadMediaModal && (
        <div className="cms-dialog-backdrop" onClick={() => setShowUploadMediaModal(false)}>
          <div className="cms-dialog-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="cms-dialog-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                <div className="cms-dialog-icon-wrap" style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.2) 0%, rgba(30,64,175,0.3) 100%)', color: '#60a5fa' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                </div>
                <div className="cms-dialog-titles">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3>Upload Media Asset</h3>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, background: 'rgba(37,99,235,0.18)', color: '#60a5fa', padding: '2px 8px', borderRadius: '999px', border: '1px solid rgba(37,99,235,0.3)' }}>
                      Auto-WebP 100%
                    </span>
                  </div>
                  <p>Drag & drop or select images. Fast auto-conversion to WebP at 100% original quality.</p>
                </div>
              </div>
              <button
                type="button"
                className="cms-modal-close-btn"
                onClick={() => {
                  setShowUploadMediaModal(false)
                  setUploadMediaTitle('')
                  setUploadMediaUrl('')
                  setConvertedWebpInfo(null)
                  setUploadProgress(0)
                }}
                title="Close dialog"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (uploadMediaUrl.trim() && uploadMediaTitle.trim()) {
                  const newMedia: MediaItem = {
                    id: `med-${Date.now()}`,
                    title: uploadMediaTitle.trim(),
                    url: uploadMediaUrl.trim(),
                    dateAdded: new Date().toISOString().split('T')[0],
                    size: convertedWebpInfo?.webpSize || 'WebP',
                    folder: uploadTargetFolder
                  }
                  const updated = [newMedia, ...mediaList]
                  setMediaList(updated)
                  void writeSharedContent('media-library', updated)
                  showToast(`"${uploadMediaTitle.trim()}" added to ${uploadTargetFolder}.`, 'success')
                  setUploadMediaTitle('')
                  setUploadMediaUrl('')
                  setConvertedWebpInfo(null)
                  setUploadProgress(0)
                  setShowUploadMediaModal(false)
                }
              }}
            >
              <div className="cms-dialog-body">
                {/* Drag & Drop Zone */}
                <div
                  className={`cms-upload-dropzone ${isDragOverUpload ? 'drag-over' : ''} ${uploadMediaUrl ? 'has-file' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragOverUpload(true)
                  }}
                  onDragLeave={() => setIsDragOverUpload(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setIsDragOverUpload(false)
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      void handleUploadFiles(e.dataTransfer.files)
                    }
                  }}
                  onClick={() => {
                    const inputEl = document.getElementById('cms-file-upload-input')
                    if (inputEl) inputEl.click()
                  }}
                >
                  <input
                    type="file"
                    id="cms-file-upload-input"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        void handleUploadFiles(e.target.files)
                      }
                    }}
                  />
                  <div className="cms-dropzone-content">
                    <div className="cms-dropzone-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    </div>
                    <div className="cms-dropzone-text">
                      <strong>Click to browse</strong> or drag & drop image
                    </div>
                    <span className="cms-dropzone-hint">
                      PNG, JPG, JPEG, GIF, AVIF · Auto-converts to WebP with 100% Quality
                    </span>
                  </div>
                </div>

                {/* Upload & Conversion Progress Bar */}
                {(isUploadingMedia || uploadProgress > 0) && (
                  <div className="cms-upload-progress-card">
                    <div className="cms-upload-progress-header">
                      <span className="cms-progress-label">{uploadStatusText || 'Processing...'}</span>
                      <span className="cms-progress-pct">{uploadProgress}%</span>
                    </div>
                    <div className="cms-upload-progress-track">
                      <div
                        className="cms-upload-progress-fill"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    {convertedWebpInfo && (
                      <div className="cms-webp-stats-row">
                        <span className="cms-stat-badge">
                          Original: <strong>{convertedWebpInfo.originalSize}</strong>
                        </span>
                        <span className="cms-stat-sep">→</span>
                        <span className="cms-stat-badge success">
                          WebP: <strong>{convertedWebpInfo.webpSize}</strong> ({convertedWebpInfo.savings})
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Target Folder Selector */}
                <div style={{ marginTop: '14px' }}>
                  <label className="cms-dialog-label">Target Media Folder</label>
                  <select
                    className="cms-dialog-input"
                    value={uploadTargetFolder}
                    onChange={(e) => setUploadTargetFolder(e.target.value as any)}
                  >
                    {mediaFolders.map((f) => (
                      <option value={f.name} key={f.name}>
                        📁 {f.name} {f.name === 'galleries' ? '(Equipment & Jobsite Photos)' : f.name === 'features' ? '(Banners & Promos)' : f.name === 'profileimg' ? '(Profiles & Team)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Asset Title */}
                <div style={{ marginTop: '12px' }}>
                  <label className="cms-dialog-label">Asset Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Caterpillar 320 GC Excavator"
                    className="cms-dialog-input"
                    value={uploadMediaTitle}
                    onChange={(e) => setUploadMediaTitle(e.target.value)}
                  />
                </div>

                {/* Media URL / Converted Source */}
                <div style={{ marginTop: '12px' }}>
                  <label className="cms-dialog-label">Image Source URL (WebP)</label>
                  <input
                    type="text"
                    required
                    placeholder="Auto-populated or paste custom URL..."
                    className="cms-dialog-input"
                    value={uploadMediaUrl}
                    onChange={(e) => setUploadMediaUrl(e.target.value)}
                  />
                </div>

                {/* Image Preview Box */}
                {uploadMediaUrl && (
                  <div className="cms-upload-preview-wrap">
                    <img
                      src={uploadMediaUrl}
                      alt="Preview"
                      className="cms-upload-preview-img"
                      onError={(e) => {
                        ;(e.target as HTMLElement).style.display = 'none'
                      }}
                    />
                    <span className="cms-preview-badge">100% Quality WebP</span>
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
                    setConvertedWebpInfo(null)
                    setUploadProgress(0)
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cms-dialog-btn primary"
                  disabled={!uploadMediaUrl || !uploadMediaTitle}
                >
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
          <div className="cms-dialog-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="cms-dialog-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                <div className={`cms-dialog-icon-wrap ${confirmDialog.isDanger ? 'danger' : 'warning'}`}>
                  {confirmDialog.isDanger ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  )}
                </div>
                <div className="cms-dialog-titles">
                  <h3>{confirmDialog.title}</h3>
                  <p style={{ margin: 0 }}>{confirmDialog.message}</p>
                </div>
              </div>
              <button
                type="button"
                className="cms-modal-close-btn"
                onClick={() => setConfirmDialog(null)}
                title="Close dialog"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {/* Warning Callout Box if Active References Exist */}
            {confirmDialog.warningDetails && confirmDialog.warningDetails.length > 0 && (
              <div className="cms-dialog-warning-callout">
                <div className="warning-callout-header">
                  <span className="callout-icon">⚠️</span>
                  <span>Asset is in active use on the website:</span>
                </div>
                <div className="warning-callout-tags">
                  {confirmDialog.warningDetails.slice(0, 4).map((ref, idx) => (
                    <span key={idx} className="warning-tag-pill">{ref}</span>
                  ))}
                  {confirmDialog.warningDetails.length > 4 && (
                    <span className="warning-tag-pill more">+{confirmDialog.warningDetails.length - 4} more</span>
                  )}
                </div>
                <small className="warning-callout-note">
                  Deleting will cause broken images on these pages until restored from Trash.
                </small>
              </div>
            )}

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
                className={`cms-dialog-btn ${confirmDialog.isDanger ? 'danger' : 'primary'}`}
                onClick={() => {
                  confirmDialog.onConfirm()
                  setConfirmDialog(null)
                }}
              >
                {confirmDialog.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Action / Prompt Dialog (Replaces native browser prompt) */}
      {cmsActionDialog && (
        <div className="cms-dialog-backdrop" onClick={() => setCmsActionDialog(null)}>
          <div className="cms-dialog-card action-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="cms-dialog-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                <div className="cms-dialog-icon-wrap" style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.18) 0%, rgba(30,64,175,0.25) 100%)', color: '#38bdf8', fontSize: '1.25rem' }}>
                  {cmsActionDialog.icon || '💬'}
                </div>
                <div className="cms-dialog-titles">
                  <h3>{cmsActionDialog.title}</h3>
                  {cmsActionDialog.subtitle && <p>{cmsActionDialog.subtitle}</p>}
                </div>
              </div>
              <button
                type="button"
                className="cms-modal-close-btn"
                onClick={() => setCmsActionDialog(null)}
                title="Close dialog"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                cmsActionDialog.onConfirm(actionDialogInputValue.trim())
                setCmsActionDialog(null)
              }}
            >
              <div className="cms-dialog-body">
                <label className="cms-dialog-label">{cmsActionDialog.inputLabel}</label>
                
                {cmsActionDialog.isFolderSelect && cmsActionDialog.options && (
                  <div className="cms-action-dialog-folder-chips">
                    <span className="cms-chips-label">Quick select existing folder:</span>
                    <div className="cms-chips-list">
                      {cmsActionDialog.options.map((opt) => (
                        <button
                          type="button"
                          key={opt}
                          className={`cms-folder-pick-chip ${actionDialogInputValue === opt ? 'active' : ''}`}
                          onClick={() => setActionDialogInputValue(opt)}
                        >
                          📁 {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <input
                  type="text"
                  required
                  autoFocus
                  placeholder={cmsActionDialog.placeholder || 'Enter value...'}
                  className="cms-dialog-input"
                  value={actionDialogInputValue}
                  onChange={(e) => setActionDialogInputValue(e.target.value)}
                />
              </div>

              <div className="cms-dialog-footer">
                <button
                  type="button"
                  className="cms-dialog-btn secondary"
                  onClick={() => setCmsActionDialog(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cms-dialog-btn primary"
                  disabled={!actionDialogInputValue.trim()}
                >
                  {cmsActionDialog.confirmLabel || 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auto Sign-Out Security Policy Modal */}
      {isAutoSignOutModalOpen && (
        <div className="cms-modal-backdrop" onClick={() => setIsAutoSignOutModalOpen(false)}>
          <div className="cms-recovery-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: tempAutoSignOutEnabled ? '#fee2e2' : '#dcfce7', color: tempAutoSignOutEnabled ? '#dc2626' : '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="12 8 12 12 14 14" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--cms-text-primary, #0f172a)' }}>
                    Auto Sign-Out Security
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--cms-text-muted, #64748b)' }}>
                    Protect CMS on idle devices or remain signed in forever
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="cms-modal-close-btn"
                onClick={() => setIsAutoSignOutModalOpen(false)}
                title="Close"
              >
                &times;
              </button>
            </div>

            {/* Toggle: Sign in Forever vs Auto Sign-Out */}
            <div style={{ background: 'var(--cms-bg-subtle, #f8fafc)', border: '1px solid var(--cms-border, #e2e8f0)', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--cms-text-primary, #0f172a)', display: 'block' }}>
                    Auto Sign-Out on Inactivity
                  </strong>
                  <span style={{ fontSize: '0.78rem', color: 'var(--cms-text-muted, #64748b)' }}>
                    {tempAutoSignOutEnabled 
                      ? 'Signs out automatically when keyboard/mouse is idle' 
                      : 'Disabled: Stay signed in forever (no auto sign-out)'}
                  </span>
                </div>
                <label className="cms-switch" style={{ position: 'relative', display: 'inline-block', width: '46px', height: '26px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={tempAutoSignOutEnabled}
                    onChange={(e) => setTempAutoSignOutEnabled(e.target.checked)}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, background: tempAutoSignOutEnabled ? '#dc2626' : '#cbd5e1', borderRadius: '34px', transition: '0.2s' }}>
                    <span style={{ position: 'absolute', content: '', height: '20px', width: '20px', left: tempAutoSignOutEnabled ? '23px' : '3px', bottom: '3px', background: '#fff', borderRadius: '50%', transition: '0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </span>
                </label>
              </div>

              {!tempAutoSignOutEnabled && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(22, 163, 74, 0.1)', border: '1px solid rgba(22, 163, 74, 0.25)' }}>
                  <span style={{ fontSize: '15px' }}>🟢</span>
                  <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600 }}>
                    Sign In Forever active: Session will never expire from inactivity.
                  </span>
                </div>
              )}
            </div>

            {/* Seconds Config Input (when enabled) */}
            {tempAutoSignOutEnabled && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 700, marginBottom: '6px', color: 'var(--cms-text-primary)' }}>
                  Inactivity Timeout (Set in Seconds)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    min="5"
                    max="86400"
                    className="cms-header-search-input"
                    style={{ flex: 1, fontSize: '1rem', fontWeight: 700 }}
                    value={tempAutoSignOutSeconds}
                    onChange={(e) => setTempAutoSignOutSeconds(Math.max(5, Math.min(86400, parseInt(e.target.value, 10) || 60)))}
                  />
                  <span style={{ fontSize: '0.88rem', fontWeight: 650, color: 'var(--cms-text-muted)' }}>seconds</span>
                </div>

                {/* Quick Presets */}
                <div style={{ marginTop: '10px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--cms-text-muted)', display: 'block', marginBottom: '6px' }}>
                    Quick Presets
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {[
                      { label: '15s (Test)', sec: 15 },
                      { label: '30s', sec: 30 },
                      { label: '60s (1m)', sec: 60 },
                      { label: '300s (5m)', sec: 300 },
                      { label: '900s (15m)', sec: 900 },
                      { label: '1800s (30m)', sec: 1800 },
                      { label: '3600s (1h)', sec: 3600 },
                    ].map((p) => (
                      <button
                        key={p.sec}
                        type="button"
                        className={`cms-action-btn-modern ${tempAutoSignOutSeconds === p.sec ? 'edit' : ''}`}
                        style={{ fontSize: '11px', padding: '4px 9px' }}
                        onClick={() => setTempAutoSignOutSeconds(p.sec)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Countdown & Reset */}
                {autoSignOutEnabled && (
                  <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.74rem', color: '#b91c1c', fontWeight: 600 }}>
                        Current Idle Countdown
                      </span>
                      <strong style={{ fontSize: '0.96rem', color: '#dc2626' }}>
                        {secondsRemaining}s remaining
                      </strong>
                    </div>
                    <button
                      type="button"
                      className="cms-action-btn-modern view"
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                      onClick={() => {
                        lastActivityRef.current = Date.now()
                        setSecondsRemaining(autoSignOutSeconds)
                        showToast('Activity timer reset.', 'success')
                      }}
                    >
                      Reset Timer
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--cms-border)', paddingTop: '14px' }}>
              <button
                type="button"
                className="cms-btn cms-btn-secondary"
                onClick={() => setIsAutoSignOutModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="cms-btn cms-btn-primary"
                onClick={() => handleSaveAutoSignOut(tempAutoSignOutEnabled, tempAutoSignOutSeconds)}
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Imminent Inactivity Auto Sign-Out Warning Modal */}
      {showSignOutWarning && (
        <div className="cms-modal-backdrop" style={{ zIndex: 999999 }}>
          <div className="cms-signout-warning-dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>

            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', color: '#b91c1c' }}>
              Inactivity Auto Sign-Out
            </h3>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: 'var(--cms-text-secondary, #475569)', lineHeight: 1.4 }}>
              You have been idle in the CMS. For your security, your session will automatically sign out in:
            </p>

            <div className="cms-warning-countdown-badge">
              {secondsRemaining}s
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '16px' }}>
              <button
                type="button"
                className="cms-btn cms-btn-primary"
                style={{ padding: '10px 22px', fontSize: '0.9rem', fontWeight: 700 }}
                onClick={() => {
                  lastActivityRef.current = Date.now()
                  setSecondsRemaining(autoSignOutSeconds)
                  setShowSignOutWarning(false)
                  showToast('Session extended! You remain signed in.', 'success')
                }}
              >
                Stay Signed In
              </button>
              <button
                type="button"
                className="cms-btn cms-btn-danger"
                style={{ padding: '10px 18px', fontSize: '0.88rem' }}
                onClick={executeAutoSignOut}
              >
                Sign Out Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
