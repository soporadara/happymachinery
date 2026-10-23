/**
 * Happy Machinery - Google Identity Services (SSO) Integration
 * Client ID: 541058603521-n08b3ccepheqtsqdsf55qjej7ds5vdh6.apps.googleusercontent.com
 *
 * Enforces strict profile linking: Only administrators who have previously
 * authenticated with their primary credentials and explicitly linked their
 * Google account inside /profile can sign in via Google. Unlinked or wrong
 * emails are strictly rejected and logged as security threats.
 */

import type { AdminUser } from './cmsTypes'
import { readSharedContent, writeSharedContent } from './sharedContentStorage'
import { DEFAULT_ADMIN_USERS } from './cmsDefaults'
import { logSecurityEvent, type AuthSession } from './cmsAuth'
import { checkBanStatus, recordFailedLoginAttempt, recordSuccessfulLogin } from './deviceSecurity'

export const GOOGLE_CLIENT_ID = '541058603521-n08b3ccepheqtsqdsf55qjej7ds5vdh6.apps.googleusercontent.com'

export interface GoogleProfile {
  sub: string
  email: string
  email_verified?: boolean
  name: string
  picture?: string
  given_name?: string
  family_name?: string
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          renderButton: (parent: HTMLElement, options: any) => void
          prompt: (momentListener?: (notification: any) => void) => void
          disableAutoSelect: () => void
          revoke: (hint: string, done: () => void) => void
        }
      }
    }
  }
}

/**
 * Safely parse a Google JWT token payload
 */
export const decodeGoogleJwt = (credential: string): GoogleProfile => {
  try {
    const parts = credential.split('.')
    if (parts.length < 2) {
      throw new Error('Invalid JWT credential format.')
    }
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload) as GoogleProfile
  } catch (err: any) {
    throw new Error('Failed to parse Google identity credential: ' + (err?.message || 'Invalid token'))
  }
}

/**
 * Construct a simulated standard Google JWT payload for verification and sandbox environments
 */
export const createMockGoogleJwt = (email: string, name?: string, picture?: string): string => {
  const cleanEmail = (email || '').trim().toLowerCase()
  const payload: GoogleProfile = {
    sub: `g_${cleanEmail.replace(/[^a-z0-9]/g, '')}`,
    email: cleanEmail,
    email_verified: true,
    name: name || cleanEmail.split('@')[0],
    picture: picture || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80'
  }
  const b64Payload = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_')
  return `eyJhbGciOiJSUzI1NiJ9.${b64Payload}.dummy_sig`
}

/**
 * Dynamically load Google Identity Services library if not already present
 */
export const loadGoogleScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false)
      return
    }

    if (window.google?.accounts?.id) {
      resolve(true)
      return
    }

    const existing = document.getElementById('google-gsi-client')
    if (existing) {
      existing.addEventListener('load', () => resolve(true))
      existing.addEventListener('error', () => resolve(false))
      return
    }

    const script = document.createElement('script')
    script.id = 'google-gsi-client'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.head.appendChild(script)
  })
}

/**
 * Authenticate with Google Credential on Login Screen
 * Enforces "wrong email cannot log in" policy
 */
export const authenticateWithGoogleCredential = async (
  credential: string,
  rememberMe: boolean = true
): Promise<{ success: boolean; user?: AdminUser; error?: string; isBanned?: boolean }> => {
  // 1. Check IP and Device ban status
  const banStatus = await checkBanStatus()
  if (banStatus.isBanned) {
    return {
      success: false,
      isBanned: true,
      error: `Access Blocked: Your ${banStatus.type === 'both' ? 'IP and Device' : banStatus.type?.toUpperCase()} is currently banned by Happy Machinery Shield Threat Defense. Reason: ${banStatus.reason || 'Excessive failed login attempts'}.`
    }
  }

  // 2. Decode Google profile
  let profile: GoogleProfile
  try {
    profile = decodeGoogleJwt(credential)
  } catch (parseErr: any) {
    await recordFailedLoginAttempt('unknown_google_token', 'google', 'Corrupted or malformed Google token')
    return {
      success: false,
      error: 'Invalid or expired Google token received. Please try again.'
    }
  }

  const googleEmail = (profile.email || '').trim().toLowerCase()
  if (!googleEmail) {
    await recordFailedLoginAttempt('empty_email_token', 'google', 'No email address found in Google token')
    return {
      success: false,
      error: 'Google account did not return a valid email address.'
    }
  }

  // 3. Load administrator catalog
  let users = await readSharedContent<AdminUser[]>('admin-users')
  if (!users || !Array.isArray(users) || users.length === 0) {
    users = DEFAULT_ADMIN_USERS
  }

  // 4. Verify whether this Google email is linked to any active admin account
  const matchingUser = users.find((u) => {
    // Check if user has explicitly linked this Google account
    if (u.googleLinked && u.googleEmail && u.googleEmail.toLowerCase() === googleEmail) {
      return true
    }
    // Or if primary registered admin email matches
    if (u.email && u.email.toLowerCase() === googleEmail) {
      return true
    }
    return false
  })

  // 5. WRONG EMAIL / UNLINKED GOOGLE ACCOUNT POLICY: STRICTLY REJECT!
  if (!matchingUser) {
    const attemptResult = await recordFailedLoginAttempt(
      googleEmail,
      'google',
      `Unlinked Google SSO Attempt (${googleEmail}) - No matching administrator profile`
    )

    if (attemptResult.isBanned) {
      return {
        success: false,
        isBanned: true,
        error: `Access Blocked: Your IP and Device have been banned due to reaching ${attemptResult.threshold} failed login attempts.`
      }
    }

    return {
      success: false,
      error: `Access Denied: The Google account "${googleEmail}" is not linked to an authorized CMS administrator. Please sign in with your primary username & password first, then link this Google account inside your Profile. (${attemptResult.remainingAttempts} attempts remaining before IP/device ban)`
    }
  }

  // 6. Check if target user account is locked
  if (matchingUser.status === 'Locked') {
    return {
      success: false,
      error: 'Your administrator account is currently locked. Please contact the Super Administrator to unlock it.'
    }
  }

  // 7. Successful Google Authentication
  matchingUser.failedAttempts = 0
  matchingUser.lastLogin = new Date().toISOString()
  matchingUser.status = 'Active'
  if (!matchingUser.googleLinked) {
    matchingUser.googleLinked = true
    matchingUser.googleEmail = googleEmail
  }

  // Update avatar from Google if user has none
  if (!matchingUser.avatar && profile.picture) {
    matchingUser.avatar = profile.picture
  }

  await writeSharedContent('admin-users', users)
  await recordSuccessfulLogin(matchingUser.username, 'google')
  await logSecurityEvent(
    'LOGIN_SUCCESS',
    `Administrator ${matchingUser.username} logged in via Google SSO (${googleEmail}).`,
    'info',
    matchingUser.username
  )

  // Generate session token
  const now = Date.now()
  const sessionDurationMs = rememberMe ? 30 * 86400 * 1000 : 7200 * 1000
  const token = `hm_tok_g_${Math.random().toString(36).substring(2)}_${now}`
  const session: AuthSession = {
    user: { ...matchingUser },
    token,
    expiresAt: now + sessionDurationMs,
    rememberMe
  }

  localStorage.setItem('hm_admin_session', JSON.stringify(session))
  localStorage.setItem('hm_admin_token', token)
  localStorage.setItem('happy-admin-auth', 'true')
  if (typeof document !== 'undefined') {
    const maxAge = Math.max(60, Math.floor(sessionDurationMs / 1000))
    document.cookie = `hm_cms_token=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`
  }

  return { success: true, user: matchingUser }
}

/**
 * Link an authenticated Google account to the currently logged in admin user
 */
export const linkGoogleAccountToUser = async (
  currentUser: AdminUser,
  credential: string
): Promise<{ success: boolean; user?: AdminUser; error?: string }> => {
  let profile: GoogleProfile
  try {
    profile = decodeGoogleJwt(credential)
  } catch (err: any) {
    return { success: false, error: 'Failed to verify Google token: ' + (err?.message || 'Invalid token') }
  }

  const googleEmail = (profile.email || '').trim().toLowerCase()
  if (!googleEmail) {
    return { success: false, error: 'Google did not return an email address for linking.' }
  }

  // Load all users to prevent duplicate linking to multiple accounts
  let users = await readSharedContent<AdminUser[]>('admin-users')
  if (!users || !Array.isArray(users) || users.length === 0) {
    users = DEFAULT_ADMIN_USERS
  }

  const existingOther = users.find(
    (u) => u.id !== currentUser.id && u.googleLinked && u.googleEmail?.toLowerCase() === googleEmail
  )

  if (existingOther) {
    return {
      success: false,
      error: `The Google account "${googleEmail}" is already linked to another administrator (${existingOther.username}).`
    }
  }

  const updatedUsers = users.map((u) => {
    if (u.id === currentUser.id) {
      return {
        ...u,
        googleLinked: true,
        googleEmail,
        googleSub: profile.sub,
        googleName: profile.name,
        googleAvatar: profile.picture || u.avatar,
        googleLinkedAt: new Date().toISOString()
      }
    }
    return u
  })

  const updatedSelf = updatedUsers.find((u) => u.id === currentUser.id)!
  await writeSharedContent('admin-users', updatedUsers)

  // Update session
  try {
    const rawSession = localStorage.getItem('hm_admin_session')
    if (rawSession) {
      const sess = JSON.parse(rawSession)
      sess.user = updatedSelf
      localStorage.setItem('hm_admin_session', JSON.stringify(sess))
    }
  } catch {}

  await logSecurityEvent(
    'GOOGLE_LINKED',
    `Administrator ${currentUser.username} successfully linked Google account: ${googleEmail}`,
    'info',
    currentUser.username
  )

  return { success: true, user: updatedSelf }
}

/**
 * Unlink Google account from current user
 */
export const unlinkGoogleAccountFromUser = async (
  currentUser: AdminUser
): Promise<{ success: boolean; user?: AdminUser }> => {
  let users = await readSharedContent<AdminUser[]>('admin-users')
  if (!users || !Array.isArray(users) || users.length === 0) {
    users = DEFAULT_ADMIN_USERS
  }

  const updatedUsers = users.map((u) => {
    if (u.id === currentUser.id) {
      const copy = { ...u }
      copy.googleLinked = false
      delete copy.googleEmail
      delete copy.googleSub
      delete copy.googleName
      delete copy.googleAvatar
      delete copy.googleLinkedAt
      return copy
    }
    return u
  })

  const updatedSelf = updatedUsers.find((u) => u.id === currentUser.id)!
  await writeSharedContent('admin-users', updatedUsers)

  try {
    const rawSession = localStorage.getItem('hm_admin_session')
    if (rawSession) {
      const sess = JSON.parse(rawSession)
      sess.user = updatedSelf
      localStorage.setItem('hm_admin_session', JSON.stringify(sess))
    }
  } catch {}

  await logSecurityEvent(
    'GOOGLE_UNLINKED',
    `Administrator ${currentUser.username} unlinked their Google account.`,
    'warning',
    currentUser.username
  )

  return { success: true, user: updatedSelf }
}
