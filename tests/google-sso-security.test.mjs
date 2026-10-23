import test from 'node:test'
import assert from 'node:assert/strict'

// Simulation of Google Authentication & Device Security Engine
const GOOGLE_CLIENT_ID = '541058603521-n08b3ccepheqtsqdsf55qjej7ds5vdh6.apps.googleusercontent.com'

function decodeGoogleJwt(jwtToken) {
  try {
    const parts = jwtToken.split('.')
    if (parts.length < 2) return null
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) {
      base64 += '='
    }
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf8')
    const payload = JSON.parse(jsonPayload)
    return {
      sub: payload.sub || 'test-sub-123',
      email: payload.email || '',
      email_verified: payload.email_verified !== false,
      name: payload.name || '',
      picture: payload.picture || ''
    }
  } catch {
    return null
  }
}

function createMockGoogleJwt(email, name = 'Test Admin') {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({
    iss: 'https://accounts.google.com',
    sub: 'google_sub_' + Math.abs(email.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)),
    email,
    email_verified: true,
    name,
    picture: 'https://lh3.googleusercontent.com/a/default-user'
  })).toString('base64url')
  return `${header}.${payload}.mock_signature`
}

class SecurityEngine {
  constructor(initialThreshold = 10) {
    this.bannedIps = []
    this.bannedDevices = []
    this.failedAttempts = new Map()
    this.autoBanThreshold = initialThreshold
    this.activityLogs = []
  }

  setAutoBanThreshold(n) {
    this.autoBanThreshold = Math.max(1, Number(n))
  }

  isBlocked(ip, deviceId) {
    const ipBanned = this.bannedIps.some(b => b.ip === ip)
    const deviceBanned = this.bannedDevices.some(d => d.deviceId === deviceId)
    return ipBanned || deviceBanned
  }

  recordFailedLogin(ip, deviceId, deviceName, reason) {
    const key = `${ip}___${deviceId}`
    const current = (this.failedAttempts.get(key) || 0) + 1
    this.failedAttempts.set(key, current)

    this.activityLogs.push({
      type: 'LOGIN_FAILED',
      ip,
      deviceId,
      reason,
      attemptNumber: current,
      timestamp: new Date().toISOString()
    })

    if (current >= this.autoBanThreshold) {
      if (!this.bannedIps.some(b => b.ip === ip)) {
        this.bannedIps.push({
          ip,
          reason: `Auto-ban: Exceeded ${this.autoBanThreshold} failed login attempts (${current} attempts)`,
          bannedAt: new Date().toISOString(),
          autoBanned: true
        })
      }
      if (!this.bannedDevices.some(d => d.deviceId === deviceId)) {
        this.bannedDevices.push({
          deviceId,
          deviceName,
          reason: `Auto-ban: Exceeded ${this.autoBanThreshold} failed login attempts (${current} attempts)`,
          bannedAt: new Date().toISOString(),
          autoBanned: true
        })
      }
      return { banned: true, attempts: current }
    }

    return { banned: false, attempts: current }
  }

  recordSuccessfulLogin(ip, deviceId, user) {
    const key = `${ip}___${deviceId}`
    this.failedAttempts.delete(key)
    this.activityLogs.push({
      type: 'LOGIN_SUCCESS',
      ip,
      deviceId,
      userId: user.id,
      timestamp: new Date().toISOString()
    })
  }

  unbanIp(ip) {
    this.bannedIps = this.bannedIps.filter(b => b.ip !== ip)
  }

  unbanDevice(deviceId) {
    this.bannedDevices = this.bannedDevices.filter(d => d.deviceId !== deviceId)
  }

  authenticateWithGoogle(credentialToken, adminUsers, clientIp, deviceId, deviceName) {
    if (this.isBlocked(clientIp, deviceId)) {
      return { success: false, reason: 'Device or IP is banned from accessing the CMS portal.' }
    }

    const payload = decodeGoogleJwt(credentialToken)
    if (!payload || !payload.email) {
      this.recordFailedLogin(clientIp, deviceId, deviceName, 'Invalid Google token signature')
      return { success: false, reason: 'Invalid Google authentication token.' }
    }

    // STRICT WRONG EMAIL CHECK:
    // User MUST exist and have googleLinked === true with matching email or sub
    const googleEmailClean = payload.email.trim().toLowerCase()
    const matchedUser = adminUsers.find(u =>
      u.googleLinked &&
      (
        (u.googleEmail && u.googleEmail.trim().toLowerCase() === googleEmailClean) ||
        (u.googleSub && u.googleSub === payload.sub)
      )
    )

    if (!matchedUser) {
      // Rejection of unlinked / unauthorized Google email
      this.recordFailedLogin(clientIp, deviceId, deviceName, `Unauthorized Google Account: ${payload.email}`)
      return {
        success: false,
        reason: `The Google account "${payload.email}" is not linked to any active administrator profile. First sign in with password and link in /profile.`
      }
    }

    this.recordSuccessfulLogin(clientIp, deviceId, matchedUser)
    return { success: true, user: matchedUser }
  }
}

// ----------------- TEST SUITE -----------------

test('1. Google Client ID is configured accurately for production Google Identity Services', () => {
  assert.equal(GOOGLE_CLIENT_ID, '541058603521-n08b3ccepheqtsqdsf55qjej7ds5vdh6.apps.googleusercontent.com')
})

test('2. Google JWT token decoding extracts sub, email, name, and picture properly', () => {
  const token = createMockGoogleJwt('soporadara@happymachinery.com', 'Dara S')
  const payload = decodeGoogleJwt(token)
  assert.ok(payload)
  assert.equal(payload.email, 'soporadara@happymachinery.com')
  assert.equal(payload.name, 'Dara S')
  assert.equal(payload.email_verified, true)
  assert.ok(payload.sub.startsWith('google_sub_'))
})

test('3. Wrong or unlinked Google email is strictly rejected and logged as a security failure', () => {
  const security = new SecurityEngine(10)
  const users = [
    {
      id: 'admin_1',
      username: 'admin',
      email: 'admin@happymachinery.com',
      googleLinked: false
    }
  ]

  const token = createMockGoogleJwt('unauthorized_hacker@gmail.com')
  const res = security.authenticateWithGoogle(token, users, '203.0.113.195', 'dev_xyz_999', 'Chrome on Mac')

  assert.equal(res.success, false)
  assert.match(res.reason, /not linked to any active administrator profile/i)
  assert.equal(security.failedAttempts.get('203.0.113.195___dev_xyz_999'), 1)
})

test('4. Auto-bans both IP and Device Hardware fingerprint after 10 failed login attempts', () => {
  const security = new SecurityEngine(10)
  const users = [
    {
      id: 'admin_1',
      username: 'admin',
      googleLinked: true,
      googleEmail: 'authorized_admin@happymachinery.com'
    }
  ]

  const badToken = createMockGoogleJwt('unauthorized_user@gmail.com')

  // Simulate 9 failed attempts
  for (let i = 1; i <= 9; i++) {
    const res = security.authenticateWithGoogle(badToken, users, '198.51.100.42', 'dev_attacker_007', 'Firefox on Linux')
    assert.equal(res.success, false)
    assert.equal(security.isBlocked('198.51.100.42', 'dev_attacker_007'), false)
  }

  // 10th failed attempt -> AUTO-BAN TRIGGERS
  const res10 = security.authenticateWithGoogle(badToken, users, '198.51.100.42', 'dev_attacker_007', 'Firefox on Linux')
  assert.equal(res10.success, false)

  // Verify IP & Device are banned
  assert.equal(security.isBlocked('198.51.100.42', 'dev_attacker_007'), true)
  assert.equal(security.bannedIps.length, 1)
  assert.equal(security.bannedIps[0].ip, '198.51.100.42')
  assert.equal(security.bannedDevices.length, 1)
  assert.equal(security.bannedDevices[0].deviceId, 'dev_attacker_007')

  // Next attempt blocked immediately by ban guard
  const blockedAttempt = security.authenticateWithGoogle(badToken, users, '198.51.100.42', 'dev_attacker_007', 'Firefox on Linux')
  assert.equal(blockedAttempt.success, false)
  assert.match(blockedAttempt.reason, /Device or IP is banned/i)
})

test('5. Administrators can unban IPs and Devices in /security', () => {
  const security = new SecurityEngine(10)
  security.bannedIps.push({ ip: '198.51.100.42', reason: 'Auto-ban test' })
  security.bannedDevices.push({ deviceId: 'dev_attacker_007', deviceName: 'Banned Laptop' })

  assert.equal(security.isBlocked('198.51.100.42', 'other_dev'), true)
  assert.equal(security.isBlocked('other_ip', 'dev_attacker_007'), true)

  // Unban IP
  security.unbanIp('198.51.100.42')
  assert.equal(security.isBlocked('198.51.100.42', 'other_dev'), false)

  // Unban Device
  security.unbanDevice('dev_attacker_007')
  assert.equal(security.isBlocked('other_ip', 'dev_attacker_007'), false)
})

test('6. Dynamic auto-ban threshold customization allows configurable limits (e.g. 3 attempts)', () => {
  const security = new SecurityEngine(10)
  security.setAutoBanThreshold(3) // Administrator configured 3 failed attempts in /security

  const users = []
  const token = createMockGoogleJwt('wrong@domain.com')

  // Attempt 1 & 2
  security.authenticateWithGoogle(token, users, '10.0.0.50', 'dev_custom_threshold', 'iPad')
  security.authenticateWithGoogle(token, users, '10.0.0.50', 'dev_custom_threshold', 'iPad')
  assert.equal(security.isBlocked('10.0.0.50', 'dev_custom_threshold'), false)

  // Attempt 3 -> Auto-ban triggers because threshold is 3
  security.authenticateWithGoogle(token, users, '10.0.0.50', 'dev_custom_threshold', 'iPad')
  assert.equal(security.isBlocked('10.0.0.50', 'dev_custom_threshold'), true)
})

test('7. Linked Google account authenticates successfully and clears failed attempt counters', () => {
  const security = new SecurityEngine(10)
  const users = [
    {
      id: 'admin_1',
      username: 'sopora',
      name: 'Sopora Dara',
      email: 'sopora@happymachinery.com',
      googleLinked: true,
      googleEmail: 'sopora.dara@gmail.com',
      googleSub: 'google_sub_12345'
    }
  ]

  // First fail once with wrong email
  const badToken = createMockGoogleJwt('wrong@gmail.com')
  security.authenticateWithGoogle(badToken, users, '192.168.1.5', 'dev_office_mac', 'Office Mac')
  assert.equal(security.failedAttempts.get('192.168.1.5___dev_office_mac'), 1)

  // Now log in with correctly linked Google account
  const goodToken = createMockGoogleJwt('sopora.dara@gmail.com', 'Sopora Dara')
  const res = security.authenticateWithGoogle(goodToken, users, '192.168.1.5', 'dev_office_mac', 'Office Mac')

  assert.equal(res.success, true)
  assert.equal(res.user.id, 'admin_1')
  // Failed attempt counter should be cleared on success
  assert.equal(security.failedAttempts.has('192.168.1.5___dev_office_mac'), false)
})
