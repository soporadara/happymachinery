/**
 * Happy Machinery - Comprehensive CMS & Security Type Definitions
 */

export type AdminRole = 
  | 'Super Administrator'
  | 'Administrator'
  | 'Editor'
  | 'Analyst'
  | 'Security Administrator'

export type AccountStatus = 'Active' | 'Locked' | 'Inactive'

export interface AdminUser {
  id: string
  username: string
  name: string
  email: string
  role: AdminRole
  status: AccountStatus
  avatar?: string
  passwordHash?: string
  salt?: string
  createdAt: string
  lastLogin?: string
  lastLoginIp?: string
  failedAttempts: number
  lockoutUntil?: string
  googleLinked?: boolean
  googleEmail?: string
  googleSub?: string
  googleName?: string
  googleAvatar?: string
  googleLinkedAt?: string
}

export type SecurityEventType = 
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'ACCOUNT_LOCKED'
  | 'ACCOUNT_UNLOCKED'
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'USER_DELETED'
  | 'PASSWORD_CHANGED'
  | 'IP_BANNED'
  | 'IP_UNBANNED'
  | 'DEVICE_BANNED'
  | 'DEVICE_UNBANNED'
  | 'GOOGLE_LINKED'
  | 'GOOGLE_UNLINKED'
  | 'SETTINGS_UPDATED'
  | 'CONTENT_PUBLISHED'
  | 'CONTENT_DELETED'
  | 'CACHE_PURGED'

export interface SecurityLog {
  id: string
  timestamp: string
  event: SecurityEventType
  ip: string
  username: string
  details: string
  severity: 'info' | 'warning' | 'critical'
}

export interface BannedIp {
  id: string
  ip: string
  reason: string
  bannedBy: string
  createdAt: string
  expiresAt?: string | null // null = permanent
  active: boolean
  failedAttempts?: number
}

export interface BannedDevice {
  id: string
  deviceId: string
  deviceSignature: string
  deviceName: string
  ip: string
  reason: string
  bannedBy: string
  createdAt: string
  expiresAt?: string | null // null = permanent
  active: boolean
  failedAttempts: number
}

export interface LoginActivityLog {
  id: string
  timestamp: string
  method: 'password' | 'google'
  identifier: string // username or email attempted
  ip: string
  deviceId: string
  deviceName: string
  status: 'success' | 'failed' | 'banned'
  reason?: string
  details?: string
}

export interface FailedLoginAttempt {
  id: string
  timestamp: string
  username: string
  ip: string
  deviceId?: string
  deviceName?: string
  userAgent: string
  reason: string
  method?: 'password' | 'google'
}

export interface SecuritySettings {
  maxFailedAttempts: number // Account lockout threshold
  lockoutWindowMinutes: number
  lockoutDurationMinutes: number
  sessionTimeoutMinutes: number
  autoBanThreshold: number // Failed attempts threshold to ban IP and Device (Default: 10)
  autoBanDeviceEnabled?: boolean
  autoBanDurationMinutes?: number
  enableIpWhitelisting: boolean
  whitelistedIps: string[]
  requirePasswordComplexity: boolean
}

export interface AnalyticsViewEvent {
  id: string
  timestamp: string
  path: string
  title: string
  type: 'page' | 'article' | 'product'
  itemId?: string | number
  ipHash: string
  device: 'desktop' | 'mobile' | 'tablet'
  referrer?: string
}

export interface SiteSettings {
  siteName: string
  tagline: string
  contactEmail: string
  phone: string
  address: string
  businessHours: string
  logo: string
  favicon: string
  defaultSeoTitle: string
  defaultSeoDescription: string
  socialLinks: {
    facebook?: string
    twitter?: string
    youtube?: string
    linkedin?: string
    instagram?: string
  }
  footerCopyright: string
  announcementBar: {
    enabled: boolean
    text: string
    linkText?: string
    linkUrl?: string
  }
  maintenanceMode: boolean
}

export interface CustomCtaButton {
  id: string
  label: string
  url: string
  style: 'primary' | 'secondary' | 'outline' | 'amber'
  actionType: 'link' | 'quote' | 'contact'
  enabled: boolean
}

export interface PageSection {
  id: string
  type: 'hero' | 'features' | 'products-grid' | 'cta' | 'text-image' | 'testimonials' | 'faq'
  title: string
  subtitle?: string
  content?: string
  imageUrl?: string
  buttons?: CustomCtaButton[]
  visible: boolean
  order: number
}

export interface SitePage {
  id: string
  slug: string
  title: string
  seoTitle?: string
  seoDescription?: string
  bannerImage?: string
  status: 'Published' | 'Draft'
  updatedAt: string
  sections: PageSection[]
}
