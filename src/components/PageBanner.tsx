import { Link } from 'react-router-dom'
import './PageBanner.css'

export interface PageBannerFeature {
  icon: string
  text: string
}

export interface PageBannerBtn {
  text: string
  link?: string
  onClick?: () => void
  isExternal?: boolean
}

export interface PageBannerProps {
  badgeText?: string
  eyebrow?: string
  title: string
  titleHighlight?: string
  description: string
  features?: PageBannerFeature[]
  primaryBtn?: PageBannerBtn
  secondaryBtn?: PageBannerBtn
  showColorOptions?: boolean
  imageSrc?: string
  imageAlt?: string
}

export default function PageBanner({
  badgeText = 'OFFICIAL TYPHON DISTRIBUTOR',
  eyebrow = 'COMMERCIAL GRADE EQUIPMENT',
  title,
  titleHighlight,
  description,
  features = [
    { icon: '⚡', text: '25 HP Kubota D1105 Diesel' },
    { icon: '🛡️', text: '1-Year Warranty & Parts' },
    { icon: '🚚', text: 'Fast Nationwide USA Delivery' },
    { icon: '⚖️', text: '1,102 lb Max Operating Load' }
  ],
  primaryBtn,
  secondaryBtn,
  showColorOptions = true,
  imageSrc = '/images/v900-promo.webp',
  imageAlt = 'TYPHON STOMP V900 Mini Skid Steer 3 Color Fleet (Yellow, Red, Blue)'
}: PageBannerProps) {
  return (
    <div className="unified-page-banner" role="banner">
      <div className="banner-bg-grid" aria-hidden="true"></div>
      <div className="banner-ambient-glow red-glow" aria-hidden="true"></div>
      <div className="banner-ambient-glow yellow-glow" aria-hidden="true"></div>
      <div className="banner-ambient-glow blue-glow" aria-hidden="true"></div>

      <div className="banner-inner">
        {/* Left Column: Details & Copy */}
        <div className="banner-copy-col">
          <div className="banner-badge-row">
            <span className="banner-badge">
              <span className="banner-badge-dot"></span>
              {badgeText}
            </span>
            <span className="banner-eyebrow-text">{eyebrow}</span>
          </div>

          <h1 className="banner-title">
            {title}{' '}
            {titleHighlight && (
              <span className="banner-title-highlight">{titleHighlight}</span>
            )}
          </h1>

          <p className="banner-desc">{description}</p>

          {/* Key Machine Specification Chips */}
          {features && features.length > 0 && (
            <div className="banner-feature-chips">
              {features.map((feat, idx) => (
                <div className="banner-chip" key={idx}>
                  <span className="banner-chip-icon">{feat.icon}</span>
                  <span className="banner-chip-text">{feat.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Action CTAs */}
          {(primaryBtn || secondaryBtn) && (
            <div className="banner-actions">
              {primaryBtn && (
                primaryBtn.onClick ? (
                  <button type="button" className="banner-btn primary" onClick={primaryBtn.onClick}>
                    {primaryBtn.text}
                  </button>
                ) : (
                  <Link to={primaryBtn.link || '/store'} className="banner-btn primary">
                    {primaryBtn.text}
                  </Link>
                )
              )}
              {secondaryBtn && (
                secondaryBtn.link?.startsWith('tel:') ? (
                  <a href={secondaryBtn.link} className="banner-btn secondary">
                    {secondaryBtn.text}
                  </a>
                ) : (
                  <Link to={secondaryBtn.link || '/contact'} className="banner-btn secondary">
                    {secondaryBtn.text}
                  </Link>
                )
              )}
            </div>
          )}
        </div>

        {/* Right Column: 3 V900 Machines Showcase */}
        <div className="banner-visual-col">
          <div className="banner-machine-stage">
            <div className="banner-stage-pedestal" aria-hidden="true"></div>
            
            {/* The 3 Machines Promo Graphic */}
            <div className="banner-image-wrapper">
              <img
                src={imageSrc}
                alt={imageAlt}
                className="banner-fleet-img"
                loading="eager"
              />
            </div>

            {/* Spec Tag Overlay */}
            <div className="banner-stage-tag" aria-hidden="true">
              <span className="stage-tag-badge">STOMP V900</span>
              <span className="stage-tag-sub">EPA TIER 4 · 1.4T COMPACT LOADER</span>
            </div>

            {/* Color Swatch Selectors */}
            {showColorOptions && (
              <div className="banner-colors-bar">
                <span className="colors-bar-label">V900 Color Editions:</span>
                <div className="colors-bar-options">
                  <Link
                    to="/product/typhon-stomp-v900-mini-track-loader-kubota-d1105"
                    className="color-pill yellow"
                    title="View Industrial Yellow V900 Skid Steer"
                  >
                    <span className="pill-dot yellow"></span>
                    <span>Yellow</span>
                  </Link>
                  <Link
                    to="/product/typhon-stomp-v900-mini-track-loader-kubota-d1105-red"
                    className="color-pill red"
                    title="View Crimson Red V900 Skid Steer"
                  >
                    <span className="pill-dot red"></span>
                    <span>Red</span>
                  </Link>
                  <Link
                    to="/product/typhon-stomp-v900-mini-track-loader-kubota-d1105-blue"
                    className="color-pill blue"
                    title="View Cobalt Blue V900 Skid Steer"
                  >
                    <span className="pill-dot blue"></span>
                    <span>Blue</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
