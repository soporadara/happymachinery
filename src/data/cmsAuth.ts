/**
 * Happy Machinery - Secure CMS Authentication & Role-Based Access Control
 */

import type { AdminUser, AdminRole, SecurityLog, SecuritySettings, FailedLoginAttempt } from './cmsTypes'
import { readSharedContent, writeSharedContent, appendSharedContent } from './sharedContentStorage'
import { DEFAULT_ADMIN_USERS, DEFAULT_SECURITY_SETTINGS } from './cmsDefaults'

const AUTH_STORAGE_KEY = 'hm_admin_session'
const AUTH_TOKEN_KEY = 'hm_admin_token'

export interface AuthSession {
  user: AdminUser
  token: string
  expiresAt: number
  rememberMe: boolean
}

export const getStoredSession = (): AuthSession | null => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as AuthSession
    if (Date.now() > session.expiresAt) {
      clearStoredSession()
      return null
    }
    return session
  } catch {
    return null
  }
}

export const clearStoredSession = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  localStorage.removeItem(AUTH_TOKEN_KEY)
  sessionStorage.removeItem(AUTH_STORAGE_KEY)
  sessionStorage.removeItem(AUTH_TOKEN_KEY)
}

export const logSecurityEvent = async (
  event: SecurityLog['event'],
  details: string,
  severity: SecurityLog['severity'] = 'info',
  username: string = 'system'
) => {
  const logItem: SecurityLog = {
    id: `sec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    event,
    ip: '127.0.0.1',
    username,
    details,
    severity
  }
  try {
    await appendSharedContent<SecurityLog>('security-logs', logItem)
  } catch {
    // Non-blocking
  }
}

export const authenticateUser = async (
  usernameInput: string,
  passwordInput: string,
  rememberMe: boolean = false
): Promise<{ success: boolean; user?: AdminUser; error?: string; lockoutMinutes?: number }> => {
  const username = usernameInput.trim().toLowerCase()
  const password = passwordInput.trim()

  // 1. Fetch users and settings
  let users = await readSharedContent<AdminUser[]>('admin-users')
  if (!users || !Array.isArray(users) || users.length === 0) {
    users = DEFAULT_ADMIN_USERS
  }

  let settings = await readSharedContent<SecuritySettings>('security-settings')
  if (!settings) settings = DEFAULT_SECURITY_SETTINGS

  // 2. Find target account (or default to primary admin if none exists)
  let user = users.find((u) => u.username.toLowerCase() === username || u.email.toLowerCase() === username)
  if (!user && (username === 'admin' || username === 'admin@happymachinery.com')) {
    user = users[0] || DEFAULT_ADMIN_USERS[0]
  }

  const now = Date.now()

  // 3. Check for existing lockout
  if (user && user.lockoutUntil) {
    const lockExpiry = new Date(user.lockoutUntil).getTime()
    if (now < lockExpiry) {
      const remainingMinutes = Math.ceil((lockExpiry - now) / 60000)
      await logSecurityEvent('LOGIN_FAILED', `Attempt on locked account: ${username}`, 'warning', username)
      return {
        success: false,
        error: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingMinutes} minute(s).`,
        lockoutMinutes: remainingMinutes
      }
    } else {
      // Lockout expired, reset failed attempts
      user.lockoutUntil = undefined
      user.failedAttempts = 0
    }
  }

  // 4. Verify password
  // Accepts 'admin123' / 'admin' or stored password
  const isValidPassword = password === 'admin123' || password === 'admin' || (user?.passwordHash && user.passwordHash === password)

  if (!user || !isValidPassword) {
    // Record failed attempt
    const failedLog: FailedLoginAttempt = {
      id: `fail-${now}`,
      timestamp: new Date().toISOString(),
      username: username || 'unknown',
      ip: '127.0.0.1',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      reason: !user ? 'Account not found' : 'Invalid credentials'
    }

    try {
      await appendSharedContent<FailedLoginAttempt>('failed-logins', failedLog)
    } catch {}

    if (user) {
      user.failedAttempts = (user.failedAttempts || 0) + 1
      if (user.failedAttempts >= settings.maxFailedAttempts) {
        const lockoutDuration = (settings.lockoutDurationMinutes || 30) * 60 * 1000
        user.lockoutUntil = new Date(now + lockoutDuration).toISOString()
        user.status = 'Locked'

        // Save updated users
        await writeSharedContent('admin-users', users)
        await logSecurityEvent('ACCOUNT_LOCKED', `User ${user.username} locked after ${user.failedAttempts} failed attempts.`, 'critical', user.username)

        return {
          success: false,
          error: `Too many failed attempts. Account has been locked for ${settings.lockoutDurationMinutes} minutes.`,
          lockoutMinutes: settings.lockoutDurationMinutes
        }
      }
      await writeSharedContent('admin-users', users)
    }

    await logSecurityEvent('LOGIN_FAILED', `Failed login attempt for username: ${username}`, 'warning', username)
    return {
      success: false,
      error: 'Invalid username or password. Please verify your credentials.'
    }
  }

  // 5. Successful login
  user.failedAttempts = 0
  user.lockoutUntil = undefined
  user.lastLogin = new Date().toISOString()
  user.status = 'Active'

  await writeSharedContent('admin-users', users)
  await logSecurityEvent('LOGIN_SUCCESS', `Administrator ${user.username} logged in successfully.`, 'info', user.username)

  // 6. Generate Session
  const sessionDurationMs = rememberMe 
    ? 30 * 24 * 60 * 60 * 1000 // 30 days
    : (settings.sessionTimeoutMinutes || 120) * 60 * 1000 // default 2 hours

  const token = `hm_tok_${Math.random().toString(36).substring(2)}${Date.now()}`
  const session: AuthSession = {
    user: { ...user },
    token,
    expiresAt: now + sessionDurationMs,
    rememberMe
  }

  const storage = rememberMe ? localStorage : sessionStorage
  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
  storage.setItem(AUTH_TOKEN_KEY, token)

  // Also maintain legacy flag for compatibility
  localStorage.setItem('happy-admin-auth', 'true')

  return { success: true, user }
}

export const checkPermission = (userRole: AdminRole, requiredRole: AdminRole): boolean => {
  const roleWeights: Record<AdminRole, number> = {
    'Super Administrator': 100,
    'Administrator': 80,
    'Security Administrator': 70,
    'Editor': 50,
    'Analyst': 30
  }
  return (roleWeights[userRole] || 0) >= (roleWeights[requiredRole] || 0)
}
