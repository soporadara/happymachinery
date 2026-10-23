import { useState } from 'react'
import { Link } from 'react-router-dom'
import './V900Showcase.css'

interface V900ShowcaseProps {
  onOpenVideo?: () => void
}

export default function V900Showcase({ onOpenVideo }: V900ShowcaseProps) {
  const [engineAngle, setEngineAngle] = useState<'fan' | 'flywheel'>('fan')
  const [lightboxOpen, setLightboxOpen] = useState(false)

  return (
    <div className="v900-showcase-wrapper">
      {/* 1. Hero Section */}
      <section className="v900-hero-section" aria-labelledby="v900-hero-title">
        <div className="v900-hero-grid">
          <div className="v900-hero-copy">
            <div className="v900-hero-pill-badge">
              <span className="badge-pulse"></span>
              <span>Compact Track Loader Flagship</span>
            </div>

            <h1 id="v900-hero-title" className="v900-hero-headline">
              Compact Size. <br />
              <span className="v900-gradient-text">Serious Lifting Performance.</span>
            </h1>

            <p className="v900-hero-desc">
              Meet the V900 compact track loader, engineered for demanding work in confined spaces.
              With a capable hydraulic system, a stability-focused triangular track design, protective
              side guards, and a 460 kg rated operating capacity, the V900 delivers practical
              performance for everyday jobsite tasks.
            </p>

            <div className="v900-hero-actions">
              <Link
                to="/product/typhon-stomp-v900-mini-track-loader-kubota-d1105"
                className="btn-v900-primary"
                id="hero-explore-v900-btn"
              >
                <span>Explore the V900</span>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                to="/contact"
                className="btn-v900-secondary"
                id="hero-request-quote-btn"
              >
                <span>Request a Quote</span>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </svg>
              </Link>
              {onOpenVideo && (
                <button
                  type="button"
                  className="btn-v900-ghost"
                  onClick={onOpenVideo}
                  aria-label="Watch V900 field demonstration video"
                >
                  <span className="ghost-play-icon">▶</span>
                  <span>Field Video</span>
                </button>
              )}
            </div>

            {/* Performance Strip */}
            <div className="v900-hero-metrics" aria-label="Key V900 performance specifications">
              <div className="v900-metric-card">
                <span className="metric-val">460 <small>kg</small></span>
                <span className="metric-label">Rated Capacity (1,014 lbs)</span>
              </div>
              <div className="v900-metric-card">
                <span className="metric-val">Kubota</span>
                <span className="metric-label">D1105 Diesel Engine</span>
              </div>
              <div className="v900-metric-card">
                <span className="metric-val">48 <small>L/min</small></span>
                <span className="metric-label">Aux Flow (12.7 GPM)</span>
              </div>
              <div className="v900-metric-card">
                <span className="metric-val">3P / 3V</span>
                <span className="metric-label">Triple Hydraulic System</span>
              </div>
            </div>
          </div>

          <div className="v900-hero-visual-col">
            <div className="v900-hero-image-stage">
              <div className="v900-hero-ambient-glow" aria-hidden="true"></div>
              <img
                src="/images/v900/v900-compact-track-loader-hero.webp"
                alt="TYPHON STOMP V900 Compact Track Loader raised with bucket"
                title="TYPHON STOMP V900 Compact Track Loader"
                className="v900-hero-main-img"
                width={1280}
                height={1280}
                fetchPriority="high"
              />
              <div className="v900-hero-floating-card">
                <div className="floating-card-icon">🇯🇵</div>
                <div className="floating-card-text">
                  <strong>Kubota D1105 Power</strong>
                  <span>Tier 4 / EPA Certified Diesel</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Anchor Navigation Strip */}
        <nav className="v900-anchor-nav" aria-label="V900 Feature deep-dive navigation">
          <div className="v900-anchor-track">
            <a href="#v900-engine" className="v900-anchor-link">
              <span className="anchor-dot"></span>
              <span>Kubota D1105 Engine</span>
            </a>
            <a href="#v900-hydraulics" className="v900-anchor-link">
              <span className="anchor-dot"></span>
              <span>3-Pump / 3-Valve Hydraulics</span>
            </a>
            <a href="#v900-tracks" className="v900-anchor-link">
              <span className="anchor-dot"></span>
              <span>Triangular Track Stability</span>
            </a>
            <a href="#v900-guards" className="v900-anchor-link">
              <span className="anchor-dot"></span>
              <span>Protective Side Guards</span>
            </a>
            <a href="#v900-capacity" className="v900-anchor-link">
              <span className="anchor-dot"></span>
              <span>Lifting Capacity (500 kg Max)</span>
            </a>
            <a href="#featured-fleet" className="v900-anchor-link anchor-action">
              <span>View 3 Colors & Packages ↓</span>
            </a>
          </div>
        </nav>
      </section>

      {/* 2. Kubota D1105 Engine Section */}
      <section id="v900-engine" className="v900-engine-section" aria-labelledby="v900-engine-title">
        <div className="v900-container">
          <div className="v900-section-intro">
            <span className="v900-eyebrow">Proven Powertrain Engineering</span>
            <h2 id="v900-engine-title" className="v900-section-heading">
              Powered by the Kubota D1105 Engine
            </h2>
            <p className="v900-section-desc">
              The V900 is equipped with a Kubota D1105 engine, bringing a proven compact diesel power
              platform to a machine designed for practical jobsite performance. Its compact engine
              format complements the V900's maneuverability and utility-focused design.
            </p>
          </div>

          <div className="v900-engine-grid">
            <div className="v900-engine-viewer">
              <div className="engine-angle-tabs" role="tablist" aria-label="Engine viewing angles">
                <button
                  type="button"
                  role="tab"
                  aria-selected={engineAngle === 'fan'}
                  className={`angle-tab-btn ${engineAngle === 'fan' ? 'active' : ''}`}
                  onClick={() => setEngineAngle('fan')}
                >
                  <span className="angle-tab-bullet"></span>
                  <span>Front Fan & Belt Drive</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={engineAngle === 'flywheel'}
                  className={`angle-tab-btn ${engineAngle === 'flywheel' ? 'active' : ''}`}
                  onClick={() => setEngineAngle('flywheel')}
                >
                  <span className="angle-tab-bullet"></span>
                  <span>Rear Flywheel & Manifold</span>
                </button>
              </div>

              <div className="engine-photo-frame">
                {engineAngle === 'fan' ? (
                  <img
                    src="/images/v900/v900-kubota-d1105-engine.webp"
                    alt="Authentic Kubota D1105 compact diesel engine - front cooling fan view"
                    title="Kubota D1105 Engine - Front View"
                    className="engine-photo"
                    width={1280}
                    height={1280}
                    loading="lazy"
                  />
                ) : (
                  <img
                    src="/images/v900/v900-kubota-d1105-engine-angle.webp"
                    alt="Authentic Kubota D1105 compact diesel engine - rear flywheel angle"
                    title="Kubota D1105 Engine - Flywheel Angle"
                    className="engine-photo"
                    width={1280}
                    height={1280}
                    loading="lazy"
                  />
                )}
                <div className="engine-watermark-badge">
                  <span>GENUINE KUBOTA D1105 DIESEL</span>
                </div>
              </div>
            </div>

            <div className="v900-engine-details">
              <div className="engine-feature-card">
                <div className="feature-card-icon-wrap">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 3" />
                  </svg>
                </div>
                <div>
                  <h3>Proven Compact Diesel Platform</h3>
                  <p>
                    Kubota's renowned industrial diesel engineering delivers smooth power transfer,
                    reliable low-RPM torque for tough digging, and exceptional thermal efficiency.
                  </p>
                </div>
              </div>

              <div className="engine-feature-card">
                <div className="feature-card-icon-wrap">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </div>
                <div>
                  <h3>Verified Designation</h3>
                  <p>
                    Authentic Kubota D1105 configuration matches manufacturer documentation. Clean
                    service points allow swift daily oil, filter, and coolant checks.
                  </p>
                </div>
              </div>

              <div className="engine-feature-card">
                <div className="feature-card-icon-wrap">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                </div>
                <div>
                  <h3>Tight-Chassis Integration</h3>
                  <p>
                    Engineered to sit low in the V900 frame, lowering the center of gravity while
                    preserving full 360-degree operator sightlines and stable track balance.
                  </p>
                </div>
              </div>

              <div className="engine-cta-box">
                <div>
                  <strong>Need full engine specifications?</strong>
                  <p>Download our verified manufacturer product spec sheet.</p>
                </div>
                <Link to="/contact" className="engine-sheet-link">
                  Request Spec Sheet →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 3-Pump / 3-Valve Hydraulic System Section */}
      <section id="v900-hydraulics" className="v900-hydraulics-section" aria-labelledby="v900-hydraulics-title">
        <div className="v900-container">
          <div className="v900-section-intro">
            <span className="v900-eyebrow">Hydraulic Capability</span>
            <h2 id="v900-hydraulics-title" className="v900-section-heading">
              Responsive Hydraulic Performance
            </h2>
            <p className="v900-section-desc">
              The V900's 3-pump / 3-valve hydraulic system is designed to support responsive machine
              operation and attachment functionality. With a stated hydraulic flow of 48 L/min (12.7 GPM)
              and rated pressure of 16 MPa (2,321 PSI), it provides a clear specification-led view of
              the machine's hydraulic capability.
            </p>
          </div>

          <div className="v900-hydraulics-grid">
            <div className="v900-hydraulics-image-col">
              <div className="hydraulics-image-card">
                <img
                  src="/images/v900/v900-hydraulic-system.webp"
                  alt="V900 3-pump / 3-valve hydraulic system layout and valve manifold assembly"
                  title="V900 3-Pump / 3-Valve Hydraulic System"
                  className="hydraulics-photo"
                  width={1280}
                  height={1280}
                  loading="lazy"
                />
                <div className="hydraulics-badge-overlay">
                  <span>3 PUMPS / 3 VALVES CONFIGURATION</span>
                </div>
              </div>
            </div>

            <div className="v900-hydraulics-specs-col">
              <div className="hydraulics-spec-card highlight-card">
                <div className="hyd-stat-top">
                  <span className="hyd-stat-num">48</span>
                  <span className="hyd-stat-unit">L/min <small>(12.7 GPM)</small></span>
                </div>
                <h4>Auxiliary Hydraulic Flow</h4>
                <p>
                  High auxiliary oil volume provides quick cycle times for buckets, augers, trenchers,
                  grapples, and the TYPH-5005M pallet fork.
                </p>
              </div>

              <div className="hydraulics-spec-card">
                <div className="hyd-stat-top">
                  <span className="hyd-stat-num">16</span>
                  <span className="hyd-stat-unit">MPa <small>(2,321 PSI)</small></span>
                </div>
                <h4>Rated Working Pressure</h4>
                <p>
                  Generates robust breakout force and consistent clamp pressure to hold heavy loads
                  securely without hydraulic fade.
                </p>
              </div>

              <div className="hydraulics-spec-card">
                <div className="hyd-stat-top">
                  <span className="hyd-stat-num">3 / 3</span>
                  <span className="hyd-stat-unit">Triple Circuit</span>
                </div>
                <h4>Independent Valving Architecture</h4>
                <p>
                  Dedicated valve blocks ensure drive motor power, boom lift, and auxiliary circuits
                  receive balanced oil supply for fluid multi-function operation.
                </p>
              </div>

              <div className="hydraulics-spec-card">
                <div className="hyd-stat-top">
                  <span className="hyd-stat-num">Quick</span>
                  <span className="hyd-stat-unit">Flat-Face</span>
                </div>
                <h4>Standard Quick-Connect Couplers</h4>
                <p>
                  Standardized flat-face couplers prevent oil spills and allow clean, two-minute attachment
                  changes right on the work site.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Triangular Track System Section */}
      <section id="v900-tracks" className="v900-tracks-section" aria-labelledby="v900-tracks-title">
        <div className="v900-container">
          <div className="v900-dual-column">
            <div className="v900-column-text">
              <span className="v900-eyebrow">Undercarriage Dynamics</span>
              <h2 id="v900-tracks-title" className="v900-section-heading">
                Triangular Track System for Stability and Traction
              </h2>
              <p className="v900-section-desc">
                The V900's triangular track configuration is designed to support stable movement and
                traction across demanding working surfaces. Its compact tracked platform helps the
                machine navigate jobsite conditions while maintaining a practical footprint.
              </p>

              <div className="track-features-list">
                <div className="track-feature-item">
                  <div className="track-check-icon">✓</div>
                  <div>
                    <strong>Elevated Drive Sprocket Geometry</strong>
                    <p>
                      Protects the final drive motor from rocks, mud, and abrasive ground debris while
                      maintaining maximum chain wrap.
                    </p>
                  </div>
                </div>

                <div className="track-feature-item">
                  <div className="track-check-icon">✓</div>
                  <div>
                    <strong>Wide Contact Ground Distribution</strong>
                    <p>
                      Spreads the machine's 1,400 kg operating weight to minimize lawn rutting, mud
                      sinkage, and delicate turf disturbance.
                    </p>
                  </div>
                </div>

                <div className="track-feature-item">
                  <div className="track-check-icon">✓</div>
                  <div>
                    <strong>Anti-Slip Chevron Rubber Cleats</strong>
                    <p>
                      Aggressive track pattern bites securely into loose gravel, clay, snow, and wet soil
                      for dependable forward propulsion.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="v900-column-visual">
              <div className="track-visual-card">
                <img
                  src="/images/v900/v900-triangular-track-system.webp"
                  alt="V900 triangular track undercarriage system showing drive sprockets and rollers"
                  title="V900 Triangular Track Undercarriage"
                  className="track-photo"
                  width={1280}
                  height={1280}
                  loading="lazy"
                />
                <div className="track-info-pill">
                  <span>TRIANGULAR PROFILE • DUAL ROLLER REINFORCED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Protective Side Safety Guards Section */}
      <section id="v900-guards" className="v900-guards-section" aria-labelledby="v900-guards-title">
        <div className="v900-container">
          <div className="v900-dual-column reverse-on-desktop">
            <div className="v900-column-visual">
              <div className="guards-visual-card">
                <img
                  src="/images/v900/v900-protective-side-guards.webp"
                  alt="V900 rear view highlighting protective side safety guards"
                  title="V900 Protective Side Safety Guards"
                  className="guards-photo"
                  width={1280}
                  height={1280}
                  loading="lazy"
                />
                <div className="guards-info-pill">
                  <span>REINFORCED STEEL SIDE SHIELDING</span>
                </div>
              </div>
            </div>

            <div className="v900-column-text">
              <span className="v900-eyebrow">Chassis Protection</span>
              <h2 id="v900-guards-title" className="v900-section-heading">
                Protective Side Guards
              </h2>
              <p className="v900-section-desc">
                Protective side guards add a practical layer of shielding around designated machine
                components. The V900's guard design should be shown clearly so customers can
                understand the machine's construction and protective features.
              </p>

              <div className="guards-spec-grid">
                <div className="guard-benefit-box">
                  <h4>Component Shielding</h4>
                  <p>
                    Prevents tree branches, fence rails, and masonry debris from striking sensitive
                    hydraulic plumbing and fittings.
                  </p>
                </div>
                <div className="guard-benefit-box">
                  <h4>Narrow-Gate Clearance</h4>
                  <p>
                    Contoured profile hugs the chassis tightly, ensuring the machine's 35.9-inch (911 mm)
                    total width is preserved.
                  </p>
                </div>
                <div className="guard-benefit-box">
                  <h4>Rigid Steel Fabrication</h4>
                  <p>
                    Heavy-gauge laser-cut steel with anti-corrosion industrial powder-coating resists
                    impacts and harsh outdoor weather.
                  </p>
                </div>
                <div className="guard-benefit-box">
                  <h4>Service Accessibility</h4>
                  <p>
                    Strategically placed access ports allow routine maintenance checks without requiring
                    chassis disassembly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. V900 Lifting Capacity Section */}
      <section id="v900-capacity" className="v900-capacity-section" aria-labelledby="v900-capacity-title">
        <div className="v900-container">
          <div className="v900-section-intro">
            <span className="v900-eyebrow">Lifting Performance & Load Specifications</span>
            <h2 id="v900-capacity-title" className="v900-section-heading">
              Compact Footprint. Practical Lifting Capacity.
            </h2>
            <p className="v900-section-desc">
              The V900 delivers a rated operating capacity of 1,014 lbs (460 kg) and a maximum load
              capacity of 1,102 lbs (500 kg), providing impressive lifting performance for a compact machine.
            </p>
          </div>

          <div className="v900-capacity-grid">
            <div className="capacity-card primary-roc">
              <div className="capacity-card-badge">STANDARD OPERATING LIMIT</div>
              <div className="capacity-number">
                <span className="num-val">1,014</span>
                <span className="num-unit">LBS <small>(460 KG)</small></span>
              </div>
              <h3>Rated Operating Capacity (ROC)</h3>
              <p>
                The officially certified daily working capacity calculated for balanced operation,
                steady steering response, and stability across uneven terrain.
              </p>
              <div className="capacity-divider"></div>
              <ul className="capacity-bullet-list">
                <li>Ideal for palletized sod, bricks, and bagged concrete</li>
                <li>Preserves smooth hydrostatic steering response</li>
                <li>Complies with standard compact equipment safety margins</li>
              </ul>
            </div>

            <div className="capacity-card peak-load">
              <div className="capacity-card-badge">PEAK MECHANICAL LIMIT</div>
              <div className="capacity-number">
                <span className="num-val">1,102</span>
                <span className="num-unit">LBS <small>(500 KG)</small></span>
              </div>
              <h3>Maximum Load Capacity</h3>
              <p>
                The absolute mechanical hydraulic threshold designed for heavy breakout, dense gravel
                scooping, and stationary placement tasks.
              </p>
              <div className="capacity-divider"></div>
              <ul className="capacity-bullet-list">
                <li>Heavy material breakout force in dense earth</li>
                <li>Robust dual hydraulic lift cylinders</li>
                <li>Clearly distinguished from everyday rated operating capacity</li>
              </ul>
            </div>

            <div className="capacity-card auxiliary-specs">
              <div className="capacity-card-badge">BUCKET & BREAKOUT SPECS</div>
              <div className="aux-spec-row">
                <div>
                  <span className="aux-spec-val">5.30 FT³</span>
                  <span className="aux-spec-label">Standard Bucket Volume (0.15 m³)</span>
                </div>
                <div>
                  <span className="aux-spec-val">1,012 LBF</span>
                  <span className="aux-spec-label">Hydraulic Breakout Force (4.5 kN)</span>
                </div>
              </div>
              <div className="capacity-divider"></div>
              <p className="aux-spec-note">
                Engineered for optimal fill factors with sand, topsoil, river rock, and construction debris.
              </p>
              <div className="capacity-poster-cta">
                <button
                  type="button"
                  className="btn-open-poster"
                  onClick={() => setLightboxOpen(true)}
                  id="v900-view-poster-btn"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <span>View Original Promotional Poster</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lightbox Modal for Original Poster */}
      {lightboxOpen && (
        <div
          className="v900-lightbox-backdrop"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="V900 Lifting Capacity Promotional Poster"
        >
          <div className="v900-lightbox-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-dialog-header">
              <div>
                <span className="lightbox-tag">MANUFACTURER SPECIFICATION</span>
                <h3>V900 Lifting Capacity & Performance Overview</h3>
              </div>
              <button
                type="button"
                className="lightbox-close-btn"
                onClick={() => setLightboxOpen(false)}
                aria-label="Close poster preview"
              >
                &times;
              </button>
            </div>
            <div className="lightbox-image-wrap">
              <img
                src="/images/v900/v900-lifting-capacity-poster.webp"
                alt="TYPHON STOMP V900 Promotional Load Poster with 1,014 lbs rated capacity and 1,102 lbs maximum load"
                title="V900 Lifting Capacity Poster"
                className="lightbox-img"
              />
            </div>
            <div className="lightbox-dialog-footer">
              <span>Verified figures: 1,014 lbs (460 kg) ROC • 1,102 lbs (500 kg) Max Load</span>
              <button
                type="button"
                className="btn-lightbox-dismiss"
                onClick={() => setLightboxOpen(false)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
