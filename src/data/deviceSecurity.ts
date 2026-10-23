/**
 * Happy Machinery - Device Fingerprinting, IP & Device Threat Defense Engine
 * Automatically enforces 10 failed attempt auto-ban, device identification,
 * and comprehensive login activity auditing.
 */

import type { BannedIp, BannedDevice, LoginActivityLog, FailedLoginAttempt, SecuritySettings } from './cmsTypes'
import { readSharedContent, writeSharedContent, appendSharedContent } from './sharedContentStorage'
import { logSecurityEvent } from './cmsAuth'
import { DEFAULT_SECURITY_SETTINGS } from './cmsDefaults'

const DEVICE_ID_KEY = 'hm_cms_device_id'
const FAILED_TRACKER_KEY = 'hm_failed_attempts_tracker'
let cachedClientIp: string | null = null

/**
 * Get or generate persistent unique device ID
 */
export const getDeviceId = (): string => {
  if (typeof window === 'undefined') return 'server_environment'
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY)
    if (!id) {
      id = `dev_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`
      localStorage.setItem(DEVICE_ID_KEY, id)
    }
    return id
  } catch {
    return 'fallback_device_id'
  }
}

/**
 * Generate deterministic browser signature
 */
export const getDeviceSignature = (): string => {
  if (typeof window === 'undefined') return 'srv'
  const nav = window.navigator
  const scr = window.screen
  const parts = [
    nav.userAgent || '',
    scr ? `${scr.width}x${scr.height}x${scr.colorDepth}` : '',
    nav.language || '',
    Intl?.DateTimeFormat ? Intl.DateTimeFormat().resolvedOptions().timeZone : '',
    nav.hardwareConcurrency || 4,
    (nav as any).platform || ''
  ]
  const str = parts.join('|')
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return `sig_${Math.abs(hash).toString(36)}`
}

/**
 * Generate human-friendly device name (e.g., "Apple Mac (Chrome 131)")
 */
export const getDeviceFriendlyName = (): string => {
  if (typeof window === 'undefined') return 'Server Console'
  const ua = navigator.userAgent
  let os = 'Unknown OS'
  let browser = 'Browser'

  if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS Device'
  else if (/Macintosh|Mac OS X/.test(ua)) os = 'Apple Mac'
  else if (/Windows NT 10.0/.test(ua)) os = 'Windows 10/11'
  else if (/Windows/.test(ua)) os = 'Windows PC'
  else if (/Android/.test(ua)) os = 'Android Device'
  else if (/Linux/.test(ua)) os = 'Linux PC'

  if (/Edg\//.test(ua)) browser = 'Edge'
  else if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) browser = 'Chrome'
  else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = 'Safari'
  else if (/Firefox\//.test(ua)) browser = 'Firefox'

  return `${os} (${browser})`
}

/**
 * Retrieve client IP with memory cache and multi-tier fallback
 */
export const getClientIp = async (): Promise<string> => {
  if (cachedClientIp) return cachedClientIp
  if (typeof window === 'undefined') return '127.0.0.1'

  // Tier 1: Check CMS local backend check-ip endpoint
  try {
    const res = await fetch('/api/content.php?action=check-ip', { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      if (data && data.ip && data.ip !== '127.0.0.1') {
        cachedClientIp = data.ip
        return data.ip
      }
    }
  } catch {}

  // Tier 2: Public IP service with 1.2s timeout
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 1200)
    const ipRes = await fetch('https://api.ipify.org?format=json', { signal: controller.signal })
    clearTimeout(timeout)
    if (ipRes.ok) {
      const ipData = await ipRes.json()
      if (ipData?.ip) {
        cachedClientIp = ipData.ip
        return ipData.ip
      }
    }
  } catch {}

  // Fallback to local loopback
  cachedClientIp = '127.0.0.1'
  return cachedClientIp
}

export interface BanCheckResult {
  isBanned: boolean
  type?: 'ip' | 'device' | 'both'
  ip: string
  deviceId: string
  deviceName: string
  reason?: string
  bannedAt?: string
}

/**
 * Check whether the current visitor's IP or Device is banned
 */
export const checkBanStatus = async (): Promise<BanCheckResult> => {
  const ip = await getClientIp()
  const deviceId = getDeviceId()
  const deviceSignature = getDeviceSignature()
  const deviceName = getDeviceFriendlyName()

  // 1. Check IP ban
  let bannedIps: BannedIp[] = []
  try {
    const fromStorage = await readSharedContent<BannedIp[]>('banned-ips')
    if (Array.isArray(fromStorage)) {
      bannedIps = fromStorage
    } else {
      const raw = localStorage.getItem('hm_banned_ips')
      if (raw) bannedIps = JSON.parse(raw)
    }
  } catch {}

  const activeIpBan = bannedIps.find((b) => b.active && (b.ip === ip || b.ip === '::1' && ip === '127.0.0.1'))

  // 2. Check Device ban
  let bannedDevices: BannedDevice[] = []
  try {
    const fromStorage = await readSharedContent<BannedDevice[]>('banned-devices')
    if (Array.isArray(fromStorage)) {
      bannedDevices = fromStorage
    } else {
      const raw = localStorage.getItem('hm_banned_devices')
      if (raw) bannedDevices = JSON.parse(raw)
    }
  } catch {}

  const activeDeviceBan = bannedDevices.find(
    (b) => b.active && (b.deviceId === deviceId || (b.deviceSignature && b.deviceSignature === deviceSignature))
  )

  if (activeIpBan && activeDeviceBan) {
    return {
      isBanned: true,
      type: 'both',
      ip,
      deviceId,
      deviceName,
      reason: activeIpBan.reason || activeDeviceBan.reason,
      bannedAt: activeIpBan.createdAt || activeDeviceBan.createdAt
    }
  }

  if (activeIpBan) {
    return {
      isBanned: true,
      type: 'ip',
      ip,
      deviceId,
      deviceName,
      reason: activeIpBan.reason,
      bannedAt: activeIpBan.createdAt
    }
  }

  if (activeDeviceBan) {
    return {
      isBanned: true,
      type: 'device',
      ip,
      deviceId,
      deviceName,
      reason: activeDeviceBan.reason,
      bannedAt: activeDeviceBan.createdAt
    }
  }

  return { isBanned: false, ip, deviceId, deviceName }
}

/**
 * Failed attempts tracker helper
 */
interface FailedTracker {
  [key: string]: {
    count: number
    lastAttempt: string
    identifiers: string[]
  }
}

const getFailedTracker = (): FailedTracker => {
  try {
    const raw = localStorage.getItem(FAILED_TRACKER_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const saveFailedTracker = (tracker: FailedTracker) => {
  try {
    localStorage.setItem(FAILED_TRACKER_KEY, JSON.stringify(tracker))
  } catch {}
}

export interface RecordAttemptResult {
  isBanned: boolean
  threshold: number
  attempts: number
  remainingAttempts: number
  reason?: string
}

/**
 * Record a failed login attempt and automatically ban IP & Device if threshold reached
 */
export const recordFailedLoginAttempt = async (
  identifier: string,
  method: 'password' | 'google',
  reason: string
): Promise<RecordAttemptResult> => {
  const ip = await getClientIp()
  const deviceId = getDeviceId()
  const deviceSignature = getDeviceSignature()
  const deviceName = getDeviceFriendlyName()
  const now = new Date().toISOString()

  // 1. Read security settings
  let settings: SecuritySettings = DEFAULT_SECURITY_SETTINGS
  try {
    const fromStorage = await readSharedContent<SecuritySettings>('security-settings')
    if (fromStorage && typeof fromStorage.autoBanThreshold === 'number') {
      settings = fromStorage
    } else {
      const raw = localStorage.getItem('happy-machinery-security-settings')
      if (raw) settings = JSON.parse(raw)
    }
  } catch {}

  const threshold = settings.autoBanThreshold || 10

  // 2. Update failed attempt counters
  const tracker = getFailedTracker()
  const ipKey = `ip_${ip}`
  const devKey = `dev_${deviceId}`

  const ipData = tracker[ipKey] || { count: 0, lastAttempt: now, identifiers: [] }
  ipData.count += 1
  ipData.lastAttempt = now
  if (!ipData.identifiers.includes(identifier)) ipData.identifiers.push(identifier)
  tracker[ipKey] = ipData

  const devData = tracker[devKey] || { count: 0, lastAttempt: now, identifiers: [] }
  devData.count += 1
  devData.lastAttempt = now
  if (!devData.identifiers.includes(identifier)) devData.identifiers.push(identifier)
  tracker[devKey] = devData

  saveFailedTracker(tracker)

  const currentAttempts = Math.max(ipData.count, devData.count)

  // 3. Log failed attempt to failed-logins & login-activity
  const failItem: FailedLoginAttempt = {
    id: `fail-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: now,
    username: identifier,
    ip,
    deviceId,
    deviceName,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    reason,
    method
  }

  const activityItem: LoginActivityLog = {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: now,
    method,
    identifier,
    ip,
    deviceId,
    deviceName,
    status: currentAttempts >= threshold ? 'banned' : 'failed',
    reason
  }

  try {
    await appendSharedContent<FailedLoginAttempt>('failed-logins', failItem)
    await appendSharedContent<LoginActivityLog>('login-activity', activityItem)
  } catch {}

  // Local storage backups for robust resilience
  try {
    const rawFails = localStorage.getItem('hm_failed_logins')
    const listFails = rawFails ? JSON.parse(rawFails) : []
    listFails.unshift(failItem)
    localStorage.setItem('hm_failed_logins', JSON.stringify(listFails.slice(0, 300)))

    const rawActs = localStorage.getItem('hm_login_activity')
    const listActs = rawActs ? JSON.parse(rawActs) : []
    listActs.unshift(activityItem)
    localStorage.setItem('hm_login_activity', JSON.stringify(listActs.slice(0, 300)))
  } catch {}

  // 4. Auto-ban check
  if (currentAttempts >= threshold) {
    const banReason = `Exceeded maximum failed login attempts threshold (${currentAttempts}/${threshold}). Last attempt for: ${identifier}`

    // Ban IP
    const newIpBan: BannedIp = {
      id: `ban-ip-${Date.now()}`,
      ip,
      reason: banReason,
      bannedBy: 'Automated Shield Guard',
      createdAt: now,
      expiresAt: null,
      active: true,
      failedAttempts: ipData.count
    }

    let existingIps: BannedIp[] = (await readSharedContent<BannedIp[]>('banned-ips')) || []
    if (!existingIps.some((b) => b.ip === ip && b.active)) {
      existingIps.unshift(newIpBan)
      await writeSharedContent('banned-ips', existingIps)
      localStorage.setItem('hm_banned_ips', JSON.stringify(existingIps))
      await logSecurityEvent('IP_BANNED', `Auto-banned IP ${ip} after ${ipData.count} failed attempts.`, 'critical', identifier)
    }

    // Ban Device
    const newDeviceBan: BannedDevice = {
      id: `ban-dev-${Date.now()}`,
      deviceId,
      deviceSignature,
      deviceName,
      ip,
      reason: banReason,
      bannedBy: 'Automated Shield Guard',
      createdAt: now,
      expiresAt: null,
      active: true,
      failedAttempts: devData.count
    }

    let existingDevices: BannedDevice[] = (await readSharedContent<BannedDevice[]>('banned-devices')) || []
    if (!existingDevices.some((b) => b.deviceId === deviceId && b.active)) {
      existingDevices.unshift(newDeviceBan)
      await writeSharedContent('banned-devices', existingDevices)
      localStorage.setItem('hm_banned_devices', JSON.stringify(existingDevices))
      await logSecurityEvent('DEVICE_BANNED', `Auto-banned device "${deviceName}" (${deviceId}) after ${devData.count} failed attempts.`, 'critical', identifier)
    }

    return {
      isBanned: true,
      threshold,
      attempts: currentAttempts,
      remainingAttempts: 0,
      reason: banReason
    }
  }

  return {
    isBanned: false,
    threshold,
    attempts: currentAttempts,
    remainingAttempts: Math.max(0, threshold - currentAttempts)
  }
}

/**
 * Record a successful login and clear failed attempts for this device & IP
 */
export const recordSuccessfulLogin = async (
  identifier: string,
  method: 'password' | 'google'
): Promise<void> => {
  const ip = await getClientIp()
  const deviceId = getDeviceId()
  const deviceName = getDeviceFriendlyName()
  const now = new Date().toISOString()

  // Reset tracker
  const tracker = getFailedTracker()
  delete tracker[`ip_${ip}`]
  delete tracker[`dev_${deviceId}`]
  saveFailedTracker(tracker)

  // Append login activity
  const act: LoginActivityLog = {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: now,
    method,
    identifier,
    ip,
    deviceId,
    deviceName,
    status: 'success',
    details: method === 'google' ? 'Authenticated via Google Identity Services' : 'Authenticated via Primary Credentials'
  }

  try {
    await appendSharedContent<LoginActivityLog>('login-activity', act)
    const rawActs = localStorage.getItem('hm_login_activity')
    const listActs = rawActs ? JSON.parse(rawActs) : []
    listActs.unshift(act)
    localStorage.setItem('hm_login_activity', JSON.stringify(listActs.slice(0, 300)))
  } catch {}
}

/**
 * Unban an IP address
 */
export const unbanIpAddress = async (ip: string, adminUsername: string = 'admin'): Promise<void> => {
  let existingIps: BannedIp[] = (await readSharedContent<BannedIp[]>('banned-ips')) || []
  existingIps = existingIps.filter((b) => b.ip !== ip && b.id !== ip)
  await writeSharedContent('banned-ips', existingIps)
  localStorage.setItem('hm_banned_ips', JSON.stringify(existingIps))

  // Reset failed tracker for this IP
  const tracker = getFailedTracker()
  delete tracker[`ip_${ip}`]
  saveFailedTracker(tracker)

  await logSecurityEvent('IP_UNBANNED', `IP ${ip} was unbanned by ${adminUsername}.`, 'info', adminUsername)
}

/**
 * Unban a Device
 */
export const unbanDeviceRecord = async (deviceId: string, adminUsername: string = 'admin'): Promise<void> => {
  let existingDevices: BannedDevice[] = (await readSharedContent<BannedDevice[]>('banned-devices')) || []
  const found = existingDevices.find((b) => b.deviceId === deviceId || b.id === deviceId)
  const targetId = found ? found.deviceId : deviceId
  existingDevices = existingDevices.filter((b) => b.deviceId !== targetId && b.id !== deviceId)
  await writeSharedContent('banned-devices', existingDevices)
  localStorage.setItem('hm_banned_devices', JSON.stringify(existingDevices))

  // Reset failed tracker for this device
  const tracker = getFailedTracker()
  delete tracker[`dev_${targetId}`]
  saveFailedTracker(tracker)

  await logSecurityEvent(
    'DEVICE_UNBANNED',
    `Device ${found?.deviceName || targetId} was unbanned by ${adminUsername}.`,
    'info',
    adminUsername
  )
}

/**
 * Manually Ban an IP Address
 */
export const manualBanIp = async (ip: string, reason: string, adminUsername: string = 'admin'): Promise<void> => {
  const newBan: BannedIp = {
    id: `ban-ip-${Date.now()}`,
    ip: ip.trim(),
    reason: reason.trim() || 'Manual administrative block',
    bannedBy: adminUsername,
    createdAt: new Date().toISOString(),
    expiresAt: null,
    active: true,
    failedAttempts: 0
  }
  let existingIps: BannedIp[] = (await readSharedContent<BannedIp[]>('banned-ips')) || []
  existingIps = existingIps.filter((b) => b.ip !== ip.trim())
  existingIps.unshift(newBan)
  await writeSharedContent('banned-ips', existingIps)
  localStorage.setItem('hm_banned_ips', JSON.stringify(existingIps))
  await logSecurityEvent('IP_BANNED', `IP ${ip} manually banned by ${adminUsername}. Reason: ${reason}`, 'warning', adminUsername)
}

/**
 * Manually Ban a Device
 */
export const manualBanDevice = async (
  deviceId: string,
  deviceName: string,
  reason: string,
  adminUsername: string = 'admin'
): Promise<void> => {
  const newBan: BannedDevice = {
    id: `ban-dev-${Date.now()}`,
    deviceId: deviceId.trim(),
    deviceSignature: '',
    deviceName: deviceName.trim() || 'Custom Device Block',
    ip: 'Manual Block',
    reason: reason.trim() || 'Manual administrative block',
    bannedBy: adminUsername,
    createdAt: new Date().toISOString(),
    expiresAt: null,
    active: true,
    failedAttempts: 0
  }
  let existingDevices: BannedDevice[] = (await readSharedContent<BannedDevice[]>('banned-devices')) || []
  existingDevices = existingDevices.filter((b) => b.deviceId !== deviceId.trim())
  existingDevices.unshift(newBan)
  await writeSharedContent('banned-devices', existingDevices)
  localStorage.setItem('hm_banned_devices', JSON.stringify(existingDevices))
  await logSecurityEvent('DEVICE_BANNED', `Device ${deviceId} manually banned by ${adminUsername}.`, 'warning', adminUsername)
}
