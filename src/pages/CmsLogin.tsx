import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { authenticateUser } from '../data/cmsAuth'
import type { AdminUser } from '../data/cmsTypes'
import './CmsLogin.css'

interface CmsLoginProps {
  onLoginSuccess: (user: AdminUser) => void
}

export default function CmsLogin({ onLoginSuccess }: CmsLoginProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [lockoutTimer, setLockoutTimer] = useState<number | null>(null)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (lockoutTimer !== null && lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => (prev && prev > 1 ? prev - 1 : null))
      }, 60000)
    }
    return () => clearInterval(interval)
  }, [lockoutTimer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      setErrorMessage('Please enter both username and password.')
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      const result = await authenticateUser(username, password, rememberMe)
      if (result.success && result.user) {
        onLoginSuccess(result.user)
      } else {
        setErrorMessage(result.error || 'Authentication failed. Please verify credentials.')
        if (result.lockoutMinutes) {
          setLockoutTimer(result.lockoutMinutes)
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Server communication error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="cms-login-viewport">
      {/* Top Left: Return to Site Button */}
      <div className="cms-login-top-bar">
        <Link to="/" className="cms-return-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Return to Happy Machinery
        </Link>
      </div>

      {/* Main Glass Card Form */}
      <div className="cms-login-card-container">
        <div className="cms-login-header">
          <div className="cms-login-logo-container">
            <img
              src="https://img.miniexcavator.org/ebay/Dashboard-Icon/Happy_Machinery_Logo.webp"
              alt="Happy Machinery"
              className="cms-login-brand-logo"
              onError={(e) => { (e.target as HTMLImageElement).src = '/images/Happy_Machinery_Logo.webp' }}
            />
          </div>
          <h1 className="cms-login-title">Sign in</h1>
          <p className="cms-login-subtitle">Happy Machinery Content Management System</p>
        </div>

        {errorMessage && (
          <div className="cms-error-banner" role="alert">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="cms-login-form">
          {/* Username Input */}
          <div className="cms-input-group">
            <span className="cms-input-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
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
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
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

          {/* Primary Pill Submit Button */}
          <button
            type="submit"
            className="cms-submit-btn"
            disabled={isLoading || lockoutTimer !== null}
          >
            {isLoading ? (
              <span className="cms-btn-spinner"></span>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        {/* Security Shield Notice */}
        <div className="cms-shield-footer">
          <div className="cms-shield-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
            Happy Machinery Shield Active
          </div>
          <div>Protected by automated IP threat defense and brute-force lockout guard.</div>
        </div>
      </div>

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
