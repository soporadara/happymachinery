import { useState } from 'react'
import { Link } from 'react-router-dom'
import './V900Showcase.css'

export default function V900Showcase() {
  const [engineAngle, setEngineAngle] = useState<'fan' | 'flywheel'>('fan')
  const [activeTab, setActiveTab] = useState<'all' | 'engine' | 'hydraulics' | 'tracks' | 'guards' | 'capacity'>('all')
  const [lightboxOpen, setLightboxOpen] = useState(false)

  return (
    <section id="v900-deep-dive" className="v900-deep-dive-section" aria-labelledby="v900-deep-dive-heading">
      <div className="v900-container">
        {/* Section Master Header */}
        <div className="v900-master-header">
          <div className="v900-pill-badge">
            <span className="badge-pulse"></span>
            <span>ENGINEERING & PERFORMANCE DEEP-DIVE</span>
          </div>
          <h2 id="v900-deep-dive-heading" className="v900-master-title">
            V900 Compact Track Loader Specifications
          </h2>
          <p className="v900-master-subtitle">
            Compact Size. Serious Lifting Performance. Explore the genuine Kubota D1105 powertrain,
            3-pump / 3-valve hydraulic architecture, triangular track stability, reinforced protective
            side guards, and verified lifting capacity.
          </p>

          {/* Jump Navigation Pills */}
          <div className="v900-section-nav" role="tablist" aria-label="V900 Specifications filter">
            <button
              type="button"
              className={`v900-nav-pill ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <span>View All 5 Systems</span>
            </button>
            <a
              href="#v900-engine"
              className={`v900-nav-pill ${activeTab === 'engine' ? 'active' : ''}`}
              onClick={() => setActiveTab('engine')}
            >
              <span>1. Kubota D1105 Engine</span>
            </a>
            <a
              href="#v900-hydraulics"
              className={`v900-nav-pill ${activeTab === 'hydraulics' ? 'active' : ''}`}
              onClick={() => setActiveTab('hydraulics')}
            >
              <span>2. 3-Pump / 3-Valve Hydraulics</span>
            </a>
            <a
              href="#v900-tracks"
              className={`v900-nav-pill ${activeTab === 'tracks' ? 'active' : ''}`}
              onClick={() => setActiveTab('tracks')}
            >
              <span>3. Triangular Track System</span>
            </a>
            <a
              href="#v900-guards"
              className={`v900-nav-pill ${activeTab === 'guards' ? 'active' : ''}`}
              onClick={() => setActiveTab('guards')}
            >
              <span>4. Protective Side Guards</span>
            </a>
            <a
              href="#v900-capacity"
              className={`v900-nav-pill ${activeTab === 'capacity' ? 'active' : ''}`}
              onClick={() => setActiveTab('capacity')}
            >
              <span>5. Lifting Capacity (500 kg Max)</span>
            </a>
          </div>
        </div>

        {/* 1. Kubota D1105 Engine Feature Section */}
        {(activeTab === 'all' || activeTab === 'engine') && (
          <div id="v900-engine" className="v900-system-block">
            <div className="v900-block-intro">
              <span className="v900-eyebrow">Proven Powertrain Platform</span>
              <h3 className="v900-block-heading">
                Powered by the Kubota D1105 Engine
              </h3>
              <p className="v900-block-desc">
                The V900 is equipped with a Kubota D1105 engine, bringing a proven compact diesel power
                platform to a machine designed for practical jobsite performance. Its compact engine
                format complements the V900's maneuverability and utility-focused design.
              </p>
            </div>

            <div className="v900-engine-grid">
              <div className="v900-engine-viewer">
                <div className="engine-angle-tabs" role="tablist" aria-label="Engine angle selector">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={engineAngle === 'fan'}
                    className={`angle-tab-btn ${engineAngle === 'fan' ? 'active' : ''}`}
                    onClick={() => setEngineAngle('fan')}
                  >
                    <span className="angle-bullet"></span>
                    <span>Front Fan & Cooling Drive</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={engineAngle === 'flywheel'}
                    className={`angle-tab-btn ${engineAngle === 'flywheel' ? 'active' : ''}`}
                    onClick={() => setEngineAngle('flywheel')}
                  >
                    <span className="angle-bullet"></span>
                    <span>Rear Flywheel & Manifold</span>
                  </button>
                </div>

                <div className="v900-product-stage">
                  <div className="stage-glow" aria-hidden="true"></div>
                  {engineAngle === 'fan' ? (
                    <img
                      src="/images/v900/v900-kubota-d1105-engine.webp"
                      alt="Kubota D1105 compact diesel engine front fan view on transparent background"
                      title="Kubota D1105 Engine - Front View"
                      className="v900-transparent-product-img"
                      width={1280}
                      height={1280}
                      loading="lazy"
                    />
                  ) : (
                    <img
                      src="/images/v900/v900-kubota-d1105-engine-angle.webp"
                      alt="Kubota D1105 compact diesel engine flywheel rear angle on transparent background"
                      title="Kubota D1105 Engine - Flywheel Angle"
                      className="v900-transparent-product-img"
                      width={1280}
                      height={1280}
                      loading="lazy"
                    />
                  )}
                  <div className="stage-badge">
                    <span>AUTHENTIC KUBOTA D1105 DIESEL</span>
                  </div>
                </div>
              </div>

              <div className="v900-engine-content">
                <div className="v900-spec-feature-card">
                  <div className="feature-card-icon">⚡</div>
                  <div>
                    <h4>Proven Compact Diesel Platform</h4>
                    <p>
                      Kubota's renowned industrial diesel engineering delivers smooth power transfer,
                      dependable low-RPM torque for tough digging, and exceptional thermal efficiency.
                    </p>
                  </div>
                </div>

                <div className="v900-spec-feature-card">
                  <div className="feature-card-icon">📋</div>
                  <div>
                    <h4>Verified Kubota D1105 Designation</h4>
                    <p>
                      Authentic Japanese-engineered 3-cylinder diesel platform matching official manufacturer
                      documentation. Built with easy-reach daily maintenance filters, dipstick, and fluid ports.
                    </p>
                  </div>
                </div>

                <div className="v900-spec-feature-card">
                  <div className="feature-card-icon">⚖️</div>
                  <div>
                    <h4>Optimized Tight-Chassis Integration</h4>
                    <p>
                      Engineered to sit low in the V900 frame, lowering the center of gravity to enhance
                      machine balance, reduce vibration, and preserve 360-degree operator jobsite visibility.
                    </p>
                  </div>
                </div>

                <div className="v900-action-card">
                  <div>
                    <strong>Ready to spec your machine?</strong>
                    <p>Inquire about Kubota EPA diesel packages with warranty support.</p>
                  </div>
                  <Link to="/contact" className="btn-v900-action">
                    Request Spec Sheet →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. 3-Pump / 3-Valve Hydraulic System Section */}
        {(activeTab === 'all' || activeTab === 'hydraulics') && (
          <div id="v900-hydraulics" className="v900-system-block">
            <div className="v900-block-intro">
              <span className="v900-eyebrow">Hydraulic Capability</span>
              <h3 className="v900-block-heading">
                Responsive Hydraulic Performance
              </h3>
              <p className="v900-block-desc">
                The V900's 3-pump / 3-valve hydraulic system is designed to support responsive machine
                operation and attachment functionality. With a stated hydraulic flow of 48 L/min (12.7 GPM)
                and rated pressure of 16 MPa (2,321 PSI), it provides a clear specification-led view of
                the machine's hydraulic capability.
              </p>
            </div>

            <div className="v900-hydraulics-layout">
              <div className="v900-product-stage hydraulics-stage">
                <div className="stage-glow" aria-hidden="true"></div>
                <img
                  src="/images/v900/v900-hydraulic-system.webp"
                  alt="V900 compact loader showing 3-pump / 3-valve hydraulic system on transparent background"
                  title="V900 3-Pump / 3-Valve Hydraulic System"
                  className="v900-transparent-product-img"
                  width={1280}
                  height={1280}
                  loading="lazy"
                />

                {/* Floating Clean Inset Card for the 3 Quick-Couplers */}
                <div className="valve-inset-card">
                  <div className="valve-inset-thumb-wrap">
                    <img
                      src="/images/v900/v900-hydraulic-valve-inset.webp"
                      alt="Close-up detail of 3 hydraulic valve quick couplers with red dust caps"
                      title="3-Valve Quick Coupler Manifold Detail"
                      className="valve-inset-thumb"
                    />
                  </div>
                  <div className="valve-inset-copy">
                    <strong>3-Valve Auxiliary Ports</strong>
                    <span>Quick-Connect Couplers</span>
                  </div>
                </div>
              </div>

              <div className="v900-hydraulics-spec-grid">
                <div className="v900-metric-tile highlight-tile">
                  <div className="tile-stat-header">
                    <span className="tile-stat-number">48</span>
                    <span className="tile-stat-unit">L/min <small>(12.7 GPM)</small></span>
                  </div>
                  <h4>Auxiliary Hydraulic Flow</h4>
                  <p>
                    Continuous high auxiliary flow rapidly cycles heavy attachments including pallet forks,
                    augers, trenchers, and hydraulic grapples.
                  </p>
                </div>

                <div className="v900-metric-tile">
                  <div className="tile-stat-header">
                    <span className="tile-stat-number">16</span>
                    <span className="tile-stat-unit">MPa <small>(2,321 PSI)</small></span>
                  </div>
                  <h4>Rated System Pressure</h4>
                  <p>
                    Provides steady mechanical clamping pressure and maximum bucket breakout force
                    through dense clay, roots, and rock.
                  </p>
                </div>

                <div className="v900-metric-tile">
                  <div className="tile-stat-header">
                    <span className="tile-stat-number">3 / 3</span>
                    <span className="tile-stat-unit">System Config</span>
                  </div>
                  <h4>Triple Pump & Valve Architecture</h4>
                  <p>
                    Dedicated hydraulic circuits balance flow among drive tracks, boom hoist, and auxiliary
                    hydraulic attachments for fluid simultaneous control.
                  </p>
                </div>

                <div className="v900-metric-tile">
                  <div className="tile-stat-header">
                    <span className="tile-stat-number">Quick</span>
                    <span className="tile-stat-unit">Flat-Face</span>
                  </div>
                  <h4>Universal Quick-Attach Couplers</h4>
                  <p>
                    Standard flat-face dry-break couplers prevent hydraulic fluid leaks and allow clean
                    swaps between bucket and pallet fork in under 2 minutes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Triangular Track System Section */}
        {(activeTab === 'all' || activeTab === 'tracks') && (
          <div id="v900-tracks" className="v900-system-block">
            <div className="v900-dual-grid">
              <div className="v900-grid-text">
                <span className="v900-eyebrow">Undercarriage Architecture</span>
                <h3 className="v900-block-heading">
                  Triangular Track System for Stability and Traction
                </h3>
                <p className="v900-block-desc">
                  The V900's triangular track configuration is designed to support stable movement and
                  traction across demanding working surfaces. Its compact tracked platform helps the
                  machine navigate jobsite conditions while maintaining a practical footprint.
                </p>

                <div className="v900-check-list">
                  <div className="check-item">
                    <div className="check-badge">✓</div>
                    <div>
                      <strong>Elevated Drive Sprocket Geometry</strong>
                      <p>
                        Keeps drive motors raised away from muddy ruts, gravel strikes, and corrosive standing water,
                        prolonging undercarriage seal life.
                      </p>
                    </div>
                  </div>

                  <div className="check-item">
                    <div className="check-badge">✓</div>
                    <div>
                      <strong>Broad Ground Contact Distribution</strong>
                      <p>
                        Distributes the operating weight across rubber tracks to minimize ground pressure,
                        preventing turf tearing on landscaped residential yards.
                      </p>
                    </div>
                  </div>

                  <div className="check-item">
                    <div className="check-badge">✓</div>
                    <div>
                      <strong>Anti-Slip Chevron Rubber Tracks</strong>
                      <p>
                        Deep bidirectional track tread grips reliably into wet mud, gravel, clay, and snow
                        without slipping or losing heading control.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="v900-grid-visual">
                <div className="v900-product-stage">
                  <div className="stage-glow" aria-hidden="true"></div>
                  <img
                    src="/images/v900/v900-triangular-track-system.webp"
                    alt="V900 triangular track undercarriage profile on transparent background"
                    title="V900 Triangular Track Undercarriage"
                    className="v900-transparent-product-img"
                    width={1280}
                    height={1280}
                    loading="lazy"
                  />
                  <div className="stage-badge">
                    <span>TRIANGULAR GEOMETRY • ELEVATED SPROCKET</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Protective Side Safety Guards Section */}
        {(activeTab === 'all' || activeTab === 'guards') && (
          <div id="v900-guards" className="v900-system-block">
            <div className="v900-dual-grid reverse-on-desktop">
              <div className="v900-grid-visual">
                <div className="v900-product-stage">
                  <div className="stage-glow" aria-hidden="true"></div>
                  <img
                    src="/images/v900/v900-protective-side-guards.webp"
                    alt="V900 rear elevation highlighting protective side safety guards on transparent background"
                    title="V900 Protective Side Safety Guards"
                    className="v900-transparent-product-img"
                    width={1280}
                    height={1280}
                    loading="lazy"
                  />
                  <div className="stage-badge">
                    <span>REINFORCED STEEL SIDE SHIELDING</span>
                  </div>
                </div>
              </div>

              <div className="v900-grid-text">
                <span className="v900-eyebrow">Chassis Protection</span>
                <h3 className="v900-block-heading">
                  Protective Side Guards
                </h3>
                <p className="v900-block-desc">
                  Protective side guards add a practical layer of shielding around designated machine
                  components. The V900's guard design should be shown clearly so customers can
                  understand the machine's construction and protective features.
                </p>

                <div className="v900-guard-cards-grid">
                  <div className="guard-card">
                    <h4>Component Shielding</h4>
                    <p>
                      Protects critical hydraulic line routing and valve fittings from falling rocks,
                      fence posts, and construction site hazards.
                    </p>
                  </div>

                  <div className="guard-card">
                    <h4>Preserved Narrow Clearance</h4>
                    <p>
                      Form-fitted to the machine frame, ensuring the loader easily glides through standard
                      36-inch gates and tight backyard fences.
                    </p>
                  </div>

                  <div className="guard-card">
                    <h4>Heavy-Gauge Laser-Cut Steel</h4>
                    <p>
                      Fabricated with industrial-grade steel and durable weather-resistant powder-coat
                      to resist corrosion and jobsite impact.
                    </p>
                  </div>

                  <div className="guard-card">
                    <h4>Service Access Ports</h4>
                    <p>
                      Designed with rapid inspection cutouts so operators can inspect grease fittings and
                      fluid lines without chassis teardown.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. V900 Lifting Capacity Section */}
        {(activeTab === 'all' || activeTab === 'capacity') && (
          <div id="v900-capacity" className="v900-system-block">
            <div className="v900-block-intro">
              <span className="v900-eyebrow">Load Ratings & Lifting Performance</span>
              <h3 className="v900-block-heading">
                Compact Footprint. Practical Lifting Capacity.
              </h3>
              <p className="v900-block-desc">
                The V900 delivers a rated operating capacity of 1,014 lbs (460 kg) and a maximum load
                capacity of 1,102 lbs (500 kg), providing impressive lifting performance for a compact machine.
              </p>
            </div>

            <div className="v900-capacity-showcase">
              {/* Product Visuals: Side Raised & Front Elevation */}
              <div className="v900-capacity-visuals-row">
                <div className="capacity-visual-card">
                  <div className="stage-glow" aria-hidden="true"></div>
                  <img
                    src="/images/v900/v900-compact-track-loader-hero.webp"
                    alt="TYPHON V900 loader 3/4 raised bucket profile on transparent background"
                    title="TYPHON V900 Full Lift Height"
                    className="capacity-loader-img"
                    loading="lazy"
                  />
                  <div className="capacity-visual-tag">SIDE LIFT PATH GEOMETRY</div>
                </div>

                <div className="capacity-visual-card">
                  <div className="stage-glow" aria-hidden="true"></div>
                  <img
                    src="/images/v900/v900-loader-raised-front.webp"
                    alt="TYPHON V900 loader front elevation with bucket high raised on transparent background"
                    title="TYPHON V900 Front High-Lift Elevation"
                    className="capacity-loader-img"
                    loading="lazy"
                  />
                  <div className="capacity-visual-tag">FRONT HIGH-LIFT REACH</div>
                </div>
              </div>

              {/* Native Specification Cards */}
              <div className="v900-capacity-cards-grid">
                <div className="capacity-metric-card roc-card">
                  <span className="capacity-badge">DAILY WORKING LIMIT</span>
                  <div className="capacity-stat">
                    <span className="stat-number">1,014</span>
                    <span className="stat-unit">LBS <small>(460 KG)</small></span>
                  </div>
                  <h4>Rated Operating Capacity (ROC)</h4>
                  <p>
                    Calculated for everyday safe, balanced material transport across uneven jobsite terrain
                    without compromising machine stability.
                  </p>
                  <ul className="capacity-checks">
                    <li>Ideal for pallets of sod, cement bags, and dirt</li>
                    <li>Maintains fluid hydrostatic steering control</li>
                  </ul>
                </div>

                <div className="capacity-metric-card peak-card">
                  <span className="capacity-badge">MAX MECHANICAL THRESHOLD</span>
                  <div className="capacity-stat">
                    <span className="stat-number">1,102</span>
                    <span className="stat-unit">LBS <small>(500 KG)</small></span>
                  </div>
                  <h4>Maximum Load Capacity</h4>
                  <p>
                    Peak mechanical hydraulic lift threshold designed for heavy breakout, stationary loading,
                    and dense material placement.
                  </p>
                  <ul className="capacity-checks">
                    <li>Heavy material breakout in packed soil</li>
                    <li>Dual reinforced hydraulic lift rams</li>
                  </ul>
                </div>

                <div className="capacity-metric-card aux-card">
                  <span className="capacity-badge">BUCKET & BREAKOUT METRICS</span>
                  <div className="aux-metrics-pair">
                    <div>
                      <span className="aux-num">5.30 FT³</span>
                      <span className="aux-lbl">Bucket Volume (0.15 m³)</span>
                    </div>
                    <div>
                      <span className="aux-num">1,012 LBF</span>
                      <span className="aux-lbl">Breakout Force (4.5 kN)</span>
                    </div>
                  </div>
                  <div className="aux-poster-trigger">
                    <button
                      type="button"
                      className="btn-view-poster"
                      onClick={() => setLightboxOpen(true)}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <span>View Original Spec Poster</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox for Original Manufacturer Poster */}
      {lightboxOpen && (
        <div
          className="v900-lightbox-backdrop"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="V900 Promotional Poster"
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
              <span>Verified: 1,014 lbs (460 kg) ROC • 1,102 lbs (500 kg) Max Load</span>
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
    </section>
  )
}
