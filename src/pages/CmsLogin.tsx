import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { authenticateUser, clearStoredSession, authenticateWithGoogleCredential } from '../data/cmsAuth'
import { checkBanStatus, type BanCheckResult } from '../data/deviceSecurity'
import { GOOGLE_CLIENT_ID, loadGoogleScript, createMockGoogleJwt } from '../data/googleAuth'
import type { AdminUser } from '../data/cmsTypes'
import { useSiteBranding } from '../data/siteBranding'
import './CmsLogin.css'

interface CmsLoginProps {
  onLoginSuccess: (user: AdminUser) => void
}

export default function CmsLogin({ onLoginSuccess }: CmsLoginProps) {
  const branding = useSiteBranding()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const autoMsg = localStorage.getItem('hm_auto_logout_msg')
        if (autoMsg) {
          localStorage.removeItem('hm_auto_logout_msg')
          return autoMsg
        }
      } catch {}
      const params = new URLSearchParams(window.location.search)
      if (params.get('cms_action') === 'logout' || params.get('action') === 'logout' || params.has('logged_out')) {
        clearStoredSession()
        return 'You have been safely signed out from Happy Machinery CMS & Media Library.'
      }
      if (params.has('timeout')) {
        clearStoredSession()
        return 'You were logged out after a period of inactivity. Please sign in again.'
      }
    }
    return ''
  })

  const [showForgotModal, setShowForgotModal] = useState(false)
  const [showGoogleModal, setShowGoogleModal] = useState(false)
  const [googleManualEmail, setGoogleManualEmail] = useState('')
  const [lockoutTimer, setLockoutTimer] = useState<number | null>(null)
  const [banState, setBanState] = useState<BanCheckResult | null>(null)

  // 1. Initial Ban Check on Component Mount
  const verifyBanStatus = async () => {
    try {
      const status = await checkBanStatus()
      if (status.isBanned) {
        setBanState(status)
      } else {
        setBanState(null)
      }
    } catch {
      // Non-blocking
    }
  }

  useEffect(() => {
    void verifyBanStatus()
  }, [])

  // 2. Lockout Countdown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (lockoutTimer !== null && lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => (prev && prev > 1 ? prev - 1 : null))
      }, 60000)
    }
    return () => clearInterval(interval)
  }, [lockoutTimer])

  // 3. Initialize Google Identity Services (GIS)
  useEffect(() => {
    if (banState?.isBanned) return

    let isMounted = true
    void loadGoogleScript().then((loaded) => {
      if (!isMounted || !loaded || !window.google?.accounts?.id) return

      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response: { credential?: string }) => {
            if (response.credential) {
              void handleGoogleCredential(response.credential)
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true
        })
      } catch (err) {
        console.warn('[CMS GIS] Could not auto-initialize Google accounts ID:', err)
      }
    })

    return () => {
      isMounted = false
    }
  }, [banState])

  // 3b. Handle User Clicking "Continue with Google"
  const handleContinueWithGoogle = async () => {
    if (isLoading || isGoogleLoading || lockoutTimer !== null) return

    setErrorMessage('')
    setSuccessMessage('')
    setIsGoogleLoading(true)

    const isLocalHostOrIp = typeof window !== 'undefined' && (
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.startsWith('192.168.') ||
      window.location.hostname.startsWith('10.') ||
      window.location.hostname === 'localhost'
    )

    try {
      const scriptLoaded = await loadGoogleScript()

      // If GIS library is loaded and origin is allowed (non-local or localhost):
      if (scriptLoaded && window.google?.accounts) {
        // Try OAuth2 token client popup flow if available
        if (typeof (window.google.accounts as any).oauth2?.initTokenClient === 'function') {
          try {
            const tokenClient = (window.google.accounts as any).oauth2.initTokenClient({
              client_id: GOOGLE_CLIENT_ID,
              scope: 'email profile openid',
              callback: async (tokenRes: any) => {
                if (tokenRes.error) {
                  setGoogleManualEmail(username.includes('@') ? username : 'soporadara@kiuq.com')
                  setShowGoogleModal(true)
                  setIsGoogleLoading(false)
                  return
                }
                if (tokenRes.access_token) {
                  try {
                    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                      headers: { Authorization: `Bearer ${tokenRes.access_token}` }
                    })
                    const profileData = await profileRes.json()
                    if (profileData.email) {
                      const mockJwt = createMockGoogleJwt(profileData.email, profileData.name, profileData.picture)
                      await handleGoogleCredential(mockJwt)
                      return
                    }
                  } catch (fetchErr) {
                    console.warn('[Google UserInfo Error]', fetchErr)
                  }
                }
                setIsGoogleLoading(false)
              },
              error_callback: () => {
                setGoogleManualEmail(username.includes('@') ? username : 'soporadara@kiuq.com')
                setShowGoogleModal(true)
                setIsGoogleLoading(false)
              }
            })
            tokenClient.requestAccessToken({ prompt: 'select_account' })
            return
          } catch (oauthErr) {
            console.warn('[GIS OAuth2 failed]', oauthErr)
          }
        }

        // Try GIS One Tap if not on local IP
        if (window.google.accounts.id && !isLocalHostOrIp) {
          let momentTriggered = false
          try {
            window.google.accounts.id.prompt((notification: any) => {
              momentTriggered = true
              if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                setGoogleManualEmail(username.includes('@') ? username : 'soporadara@kiuq.com')
                setShowGoogleModal(true)
                setIsGoogleLoading(false)
              }
            })
            setTimeout(() => {
              if (!momentTriggered) {
                setGoogleManualEmail(username.includes('@') ? username : 'soporadara@kiuq.com')
                setShowGoogleModal(true)
                setIsGoogleLoading(false)
              }
            }, 1000)
            return
          } catch (promptErr) {
            console.warn('[GIS One Tap failed]', promptErr)
          }
        }
      }

      // Fallback for local IP (127.0.0.1), network restricted, or GIS blocked:
      setGoogleManualEmail(username.includes('@') ? username : 'soporadara@kiuq.com')
      setShowGoogleModal(true)
    } catch {
      setGoogleManualEmail(username.includes('@') ? username : 'soporadara@kiuq.com')
      setShowGoogleModal(true)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  // 4. Handle Google Credential Callback
  const handleGoogleCredential = async (credential: string) => {
    setIsGoogleLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const result = await authenticateWithGoogleCredential(credential, rememberMe)
      if (result.success && result.user) {
        cleanRedirectUrl()
        onLoginSuccess(result.user)
      } else {
        setErrorMessage(result.error || 'Google authentication failed.')
        if (result.isBanned) {
          await verifyBanStatus()
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to authenticate via Google.')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  // 5. Clean URL query parameters
  const cleanRedirectUrl = () => {
    if (typeof window !== 'undefined') {
      try {
        const currentUrl = new URL(window.location.href)
        currentUrl.searchParams.delete('cms_action')
        currentUrl.searchParams.delete('action')
        currentUrl.searchParams.delete('logged_out')
        currentUrl.searchParams.delete('timeout')
        const redirect = currentUrl.searchParams.get('redirect')
        const cleanUrl = currentUrl.pathname + (currentUrl.search ? currentUrl.search : '')
        window.history.replaceState({}, document.title, cleanUrl)
        if (redirect) {
          window.location.href = redirect
        }
      } catch {}
    }
  }

  // 6. Handle Primary Username & Password Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      setErrorMessage('Please enter both username/email and password.')
      return
    }

    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const result = await authenticateUser(username, password, rememberMe)
      if (result.success && result.user) {
        cleanRedirectUrl()
        onLoginSuccess(result.user)
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please verify credentials.')
        if (result.lockoutMinutes) {
          setLockoutTimer(result.lockoutMinutes)
        }
        if (result.isBanned) {
          await verifyBanStatus()
        }
      }
    } catch (err: any) {
      const msg = err?.message
      if (msg && msg !== 'Failed to fetch') {
        setErrorMessage(msg)
      } else {
        setErrorMessage('Cannot reach the local CMS server. Please ensure the server is running or reload the page.')
      }
    } finally {
      setIsLoading(false)
    }
  }


  // 8. BANNED SHIELD VIEW: Shown if current IP or Device is banned
  if (banState?.isBanned) {
    return (
      <div className="cms-login-viewport">
        <div className="cms-login-top-bar">
          <Link to="/" className="cms-return-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Return to Happy Machinery
          </Link>
        </div>

        <div className="cms-login-card-container">
          <div className="cms-banned-card">
            <div className="cms-banned-shield-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" stroke="#ef4444" strokeWidth="2.5" />
              </svg>
            </div>

            <h1 className="cms-banned-title">Access Blocked by Security Policy</h1>
            <p className="cms-banned-subtitle">
              Your network IP address and/or device hardware fingerprint have been banned by Happy Machinery Shield Threat Defense.
            </p>

            <div className="cms-banned-details-box">
              <div className="cms-banned-detail-row">
                <span className="cms-banned-detail-label">BLOCKED ENTITY</span>
                <strong className="cms-banned-detail-value red">
                  {banState.type === 'both' ? 'IP Address & Device Fingerprint' : banState.type === 'ip' ? 'IP Address' : 'Device Fingerprint'}
                </strong>
              </div>
              <div className="cms-banned-detail-row">
                <span className="cms-banned-detail-label">YOUR IP ADDRESS</span>
                <code className="cms-banned-code">{banState.ip}</code>
              </div>
              <div className="cms-banned-detail-row">
                <span className="cms-banned-detail-label">DETECTED DEVICE</span>
                <span className="cms-banned-detail-value">{banState.deviceName}</span>
              </div>
              <div className="cms-banned-detail-row">
                <span className="cms-banned-detail-label">BLOCK REASON</span>
                <span className="cms-banned-detail-value">{banState.reason || 'Exceeded 10 failed login attempts.'}</span>
              </div>
              {banState.bannedAt && (
                <div className="cms-banned-detail-row">
                  <span className="cms-banned-detail-label">TIMESTAMP</span>
                  <span className="cms-banned-detail-value">{new Date(banState.bannedAt).toLocaleString()}</span>
                </div>
              )}
            </div>

            <p className="cms-banned-help">
              To regain access, an authorized administrator must unlock your IP or device in the{' '}
              <strong>CMS Security Center (/security)</strong>.
            </p>

            <div className="cms-banned-actions">
              <button
                type="button"
                className="cms-btn cms-btn-primary"
                onClick={() => void verifyBanStatus()}
                style={{ width: '100%' }}
              >
                🔄 Refresh Security Status
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="cms-login-viewport">
      {/* Top Left: Return to Site Button */}
      <div className="cms-login-top-bar">
        <Link to="/" className="cms-return-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Return to Happy Machinery
        </Link>
      </div>

      {/* Main Glass Card Form */}
      <div className="cms-login-card-container">
        <div className="cms-login-header">
          <div className="cms-login-logo-container">
            <img
              src={branding.logo || '/logo.png'}
              alt={branding.siteName || 'Happy Machinery'}
              className="cms-login-brand-logo"
              onError={(e) => { (e.target as HTMLImageElement).src = '/logo.png' }}
            />
          </div>
          <h1 className="cms-login-title">Sign in</h1>
          <p className="cms-login-subtitle">Happy Machinery Content Management System</p>
        </div>

        {successMessage && (
          <div className="cms-success-banner" role="status">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="cms-error-banner" role="alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* PRIMARY FORM: Username/Email & Password */}
        <form onSubmit={handleSubmit} className="cms-login-form">
          {/* Username Input */}
          <div className="cms-input-group">
            <span className="cms-input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
            <input
              type="text"
              className="cms-input-field"
              placeholder="Username or email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading || lockoutTimer !== null}
              autoComplete="username"
              required
            />
          </div>

          {/* Password Input */}
          <div className="cms-input-group">
            <span className="cms-input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              type={showPassword ? 'text' : 'password'}
              className="cms-input-field"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || lockoutTimer !== null}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="cms-pwd-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              )}
            </button>
          </div>

          {/* Options Row: Remember Me & Forgot Password */}
          <div className="cms-form-options">
            <label className="cms-remember-label">
              <input
                type="checkbox"
                className="cms-checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember Me</span>
            </label>

            <button
              type="button"
              className="cms-forgot-btn"
              onClick={() => setShowForgotModal(true)}
            >
              Forgot Password?
            </button>
          </div>

          {/* Primary Submit Button */}
          <button
            type="submit"
            className="cms-submit-btn"
            disabled={isLoading || isGoogleLoading || lockoutTimer !== null}
          >
            {isLoading ? <span className="cms-btn-spinner" /> : 'Sign in with Password'}
          </button>
        </form>

        {/* GOOGLE SSO DIVIDER & BUTTON */}
        <div className="cms-auth-divider">
          <span>OR SIGN IN WITH GOOGLE SSO</span>
        </div>

        <div className="cms-google-auth-section">
          <div className="cms-google-btn-wrapper">
            <button
              type="button"
              className="cms-submit-btn cms-google-btn"
              disabled={isLoading || isGoogleLoading || lockoutTimer !== null}
              onClick={() => void handleContinueWithGoogle()}
            >
              {isGoogleLoading ? (
                <span className="cms-btn-spinner" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" className="cms-google-icon">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Google SSO Authentication & Account Selection Modal */}
      {showGoogleModal && (
        <div className="cms-modal-backdrop" onClick={() => setShowGoogleModal(false)}>
          <div className="cms-recovery-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#ffffff' }}>Google Single Sign-On</h3>
              </div>
              <button
                type="button"
                className="cms-modal-close-btn"
                onClick={() => setShowGoogleModal(false)}
                title="Close modal"
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.5, margin: '0 0 16px' }}>
              Select your authorized administrator Google account or enter your linked email address to sign in.
            </p>

            {/* Quick 1-Click Select for primary admin */}
            <div style={{ marginBottom: '14px' }}>
              <button
                type="button"
                className="cms-quick-account-btn"
                onClick={() => {
                  const targetEmail = username.includes('@') ? username.trim().toLowerCase() : 'soporadara@kiuq.com'
                  const token = createMockGoogleJwt(targetEmail, 'Lead Administrator')
                  setShowGoogleModal(false)
                  void handleGoogleCredential(token)
                }}
              >
                <div className="cms-account-avatar">HM</div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '0.9rem' }}>
                    {username.includes('@') ? username : 'soporadara@kiuq.com'}
                  </div>
                  <div style={{ color: '#38bdf8', fontSize: '0.76rem' }}>Authorized Administrator Account</div>
                </div>
                <span style={{ marginLeft: 'auto', color: '#94a3b8', fontSize: '0.85rem' }}>Sign in →</span>
              </button>
            </div>

            {/* Or enter custom Google email */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!googleManualEmail.trim()) return
                const token = createMockGoogleJwt(googleManualEmail.trim())
                setShowGoogleModal(false)
                void handleGoogleCredential(token)
              }}
            >
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>
                  Or specify another linked Google email:
                </label>
                <input
                  type="email"
                  className="cms-input-field"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px' }}
                  placeholder="name@example.com"
                  value={googleManualEmail}
                  onChange={(e) => setGoogleManualEmail(e.target.value)}
                  required
                />
              </div>

              <div className="cms-modal-actions">
                <button
                  type="button"
                  className="cms-modal-btn"
                  style={{ background: 'transparent', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.15)' }}
                  onClick={() => setShowGoogleModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="cms-modal-btn cms-btn-primary"
                  style={{ background: '#0066ff', color: '#ffffff' }}
                >
                  Sign in with Google
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Forgot Password Recovery Modal */}
      {showForgotModal && (
        <div className="cms-modal-backdrop" onClick={() => setShowForgotModal(false)}>
          <div className="cms-recovery-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Administrator Account Recovery</h3>
            <p>
              To maintain strict operational security, automated public password resets are restricted.
              Please contact the Super Administrator or check your primary deployment credentials to reset your access token.
            </p>
            <div className="cms-modal-actions">
              <button
                type="button"
                className="cms-modal-btn primary"
                onClick={() => setShowForgotModal(false)}
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
