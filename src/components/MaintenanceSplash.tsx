import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { MaintenanceConfig } from '../data/maintenanceConfig'
import { useSiteBranding } from '../data/siteBranding'
import './MaintenanceSplash.css'

interface MaintenanceSplashProps {
  config: MaintenanceConfig
}

export default function MaintenanceSplash({ config }: MaintenanceSplashProps) {
  const branding = useSiteBranding()
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null)

  useEffect(() => {
    if (!config.eta) {
      setTimeLeft(null)
      return
    }

    const target = new Date(config.eta).getTime()
    if (isNaN(target)) {
      setTimeLeft(null)
      return
    }

    const updateTimer = () => {
      const now = Date.now()
      const diff = Math.max(0, target - now)
      if (diff <= 0) {
        setTimeLeft(null)
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setTimeLeft({ hours, minutes, seconds })
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [config.eta])

  return (
    <div className="maintenance-splash-overlay">
      <div className="maintenance-splash-card">
        <div className="maintenance-splash-badge">
          <span className="maintenance-dot" />
          <span>SCHEDULED UPGRADE</span>
        </div>

        <div className="maintenance-splash-logo-wrap">
          <img
            src={branding.logo || '/logo.png'}
            alt={branding.siteName || 'Happy Machinery'}
            className="maintenance-splash-logo"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = '/logo.png'
            }}
          />
        </div>

        <h1 className="maintenance-splash-heading">{config.title || "We'll Be Right Back"}</h1>
        <p className="maintenance-splash-message">
          {config.message || "We're performing scheduled maintenance. Please check back soon."}
        </p>

        {timeLeft && (
          <div className="maintenance-countdown-box">
            <span className="maintenance-countdown-label">Estimated Service Resumption:</span>
            <div className="maintenance-countdown-digits">
              <div className="maintenance-countdown-unit">
                <strong>{String(timeLeft.hours).padStart(2, '0')}</strong>
                <small>Hours</small>
              </div>
              <span className="maintenance-colon">:</span>
              <div className="maintenance-countdown-unit">
                <strong>{String(timeLeft.minutes).padStart(2, '0')}</strong>
                <small>Minutes</small>
              </div>
              <span className="maintenance-colon">:</span>
              <div className="maintenance-countdown-unit">
                <strong>{String(timeLeft.seconds).padStart(2, '0')}</strong>
                <small>Seconds</small>
              </div>
            </div>
          </div>
        )}

        <div className="maintenance-progress-wrapper">
          <div className="maintenance-progress-meta">
            <span>Upgrade Status</span>
            <strong>
              {config.progress >= 90 ? `${config.progress}% · Final Stage` : `${config.progress}% · In Progress`}
            </strong>
          </div>
          <div className="maintenance-progress-bar-bg">
            <div
              className="maintenance-progress-bar-fill"
              style={{ width: `${Math.min(100, Math.max(5, config.progress))}%` }}
            />
          </div>
        </div>

        <div className="maintenance-splash-footer">
          <span className="maintenance-contact-hint">
            Urgent inquiries? Email: <a href="mailto:support@happymachinery.com">support@happymachinery.com</a>
          </span>
          <Link to="/ourcmskiuq" className="maintenance-admin-portal-link">
            Admin Console Portal →
          </Link>
        </div>
      </div>
    </div>
  )
}
