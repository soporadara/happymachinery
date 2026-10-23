import { useState } from 'react'
import { Link } from 'react-router-dom'
import './V900Showcase.css'

interface CalloutItem {
  id: string
  title: string
  subtitle: string
  detail: string
  // Target coordinates on image where arrow points (0-100%)
  target: { x: number; y: number }
  // Origin coordinates where callout badge is placed (0-100%)
  origin: { x: number; y: number }
}

interface ProductStageProps {
  imageSrc: string
  imageAlt: string
  imageTitle: string
  sysId: string
  badgeText: string
  callouts: CalloutItem[]
  activeCallout: string | null
  onHoverCallout: (id: string | null) => void
  extraVisual?: React.ReactNode
}

function TechnicalCalloutStage({
  imageSrc,
  imageAlt,
  imageTitle,
  sysId,
  badgeText,
  callouts,
  activeCallout,
  onHoverCallout,
  extraVisual
}: ProductStageProps) {
  return (
    <div className="v900-tech-stage-wrapper">
      <div className="v900-product-stage">
        {/* Ambient Stage Lighting & Blueprint Grid */}
        <div className="stage-glow" aria-hidden="true"></div>
        <div className="stage-blueprint-grid" aria-hidden="true"></div>
        <div className="stage-floor-shadow" aria-hidden="true"></div>

        {/* HUD Technical Badges */}
        <div className="stage-hud stage-hud-top-left">
          <span className="hud-code">SYS.ID // {sysId}</span>
          <span className="hud-status">● ACTIVE SPEC</span>
        </div>
        <div className="stage-hud stage-hud-top-right">
          <span className="hud-badge-tag">{badgeText}</span>
        </div>

        {/* Machine Product Cutout - Scaled Prominently */}
        <img
          src={imageSrc}
          alt={imageAlt}
          title={imageTitle}
          className="v900-transparent-product-img"
          width={1280}
          height={1280}
          loading="lazy"
        />

        {/* Optional Extra Visual (e.g., Quick-Coupler Inset) */}
        {extraVisual}

        {/* Technical SVG Leader-Lines and Pointing Arrowheads */}
        <svg
          className="v900-arrows-svg"
          viewBox="0 0 1000 700"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <marker
              id={`arrowhead-default-${sysId}`}
              markerWidth="10"
              markerHeight="8"
              refX="8"
              refY="4"
              orient="auto"
            >
              <polygon points="0 1, 9 4, 0 7" fill="#0066ff" />
            </marker>
            <marker
              id={`arrowhead-active-${sysId}`}
              markerWidth="12"
              markerHeight="10"
              refX="10"
              refY="5"
              orient="auto"
            >
              <polygon points="0 1, 11 5, 0 9" fill="#00e5ff" />
            </marker>
          </defs>

          {callouts.map((c) => {
            const isActive = activeCallout === c.id
            const originX = c.origin.x < 50 ? (c.origin.x + 22) * 10 : c.origin.x * 10
            const originY = (c.origin.y + 4.5) * 7
            const targetX = c.target.x * 10
            const targetY = c.target.y * 7

            return (
              <g key={c.id} className={`v900-svg-group ${isActive ? 'is-active' : ''}`}>
                {/* Dynamic Leader Line with Arrowhead */}
                <line
                  x1={originX}
                  y1={originY}
                  x2={targetX}
                  y2={targetY}
                  className="v900-leader-line"
                  markerEnd={`url(#${isActive ? `arrowhead-active-${sysId}` : `arrowhead-default-${sysId}`})`}
                />
                {/* Glowing Radar Target Pin on the Exact Machine Component */}
                <g className="v900-target-pin">
                  <circle cx={targetX} cy={targetY} r="16" className="target-pulse-wave" />
                  <circle cx={targetX} cy={targetY} r="7" className="target-core-ring" />
                  <circle cx={targetX} cy={targetY} r="3.5" className="target-center-dot" />
                </g>
              </g>
            )
          })}
        </svg>

        {/* Floating Technical Callout Badges with Pointing Leader Arrows */}
        <div className="v900-callouts-container">
          {callouts.map((c, idx) => {
            const isActive = activeCallout === c.id
            const isLeft = c.origin.x < 50

            return (
              <div
                key={c.id}
                className={`v900-callout-card ${isActive ? 'is-active' : ''} ${isLeft ? 'align-left' : 'align-right'}`}
                style={{ left: `${c.origin.x}%`, top: `${c.origin.y}%` }}
                onMouseEnter={() => onHoverCallout(c.id)}
                onMouseLeave={() => onHoverCallout(null)}
                onClick={() => onHoverCallout(isActive ? null : c.id)}
                tabIndex={0}
                role="button"
                aria-label={`${c.title}: ${c.subtitle}`}
              >
                <div className="callout-card-inner">
                  <div className="callout-index-badge">
                    <span className="dot"></span>
                    <span>0{idx + 1}</span>
                  </div>
                  <div className="callout-text-wrap">
                    <span className="callout-title">{c.title}</span>
                    <span className="callout-sub">{c.subtitle}</span>
                  </div>
                </div>
                <div className="callout-expand-detail">
                  <p>{c.detail}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Stage Bottom Tech Coordinates Footer */}
        <div className="stage-footer-coords">
          <span>COORDINATES: X:1000 // Y:700 // SCALE: 1:1</span>
          <span className="coords-pulse"></span>
          <span>INTERACTIVE FEATURE ARROWS ACTIVE</span>
        </div>
      </div>

      {/* Mobile/Tablet Callout Pill Switcher */}
      <div className="v900-callout-pill-strip" role="tablist" aria-label="Feature callout selector">
        {callouts.map((c, idx) => (
          <button
            key={c.id}
            type="button"
            className={`callout-pill-btn ${activeCallout === c.id ? 'is-active' : ''}`}
            onClick={() => onHoverCallout(activeCallout === c.id ? null : c.id)}
          >
            <span className="pill-idx">0{idx + 1}</span>
            <span className="pill-title">{c.title}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function V900Showcase() {
  const [engineAngle, setEngineAngle] = useState<'fan' | 'flywheel'>('fan')
  const [activeTab, setActiveTab] = useState<'all' | 'engine' | 'hydraulics' | 'tracks' | 'guards' | 'capacity'>('all')
  const [activeCallout, setActiveCallout] = useState<string | null>(null)

  // 1. Kubota D1105 25 HP Engine Callouts
  const engineFanCallouts: CalloutItem[] = [
    {
      id: 'eng-block',
      title: '25 HP Kubota D1105 Block',
      subtitle: '1.123L 3-Cylinder Diesel',
      detail: 'Authentic Kubota D1105-E4B delivering 25.0 HP (18.5 kW) @ 3000 RPM with 71.5 N·m low-RPM torque for heavy pushing and digging.',
      target: { x: 49, y: 55 },
      origin: { x: 4, y: 14 }
    },
    {
      id: 'eng-fan',
      title: 'High-CFM Cooling Fan',
      subtitle: 'Continuous Thermal Stability',
      detail: 'Belt-driven multi-blade fan draws high airflow volume through the aluminum core radiator for non-stop operation up to 45°C.',
      target: { x: 65, y: 39 },
      origin: { x: 66, y: 14 }
    },
    {
      id: 'eng-injection',
      title: 'E-TVCS Combustion',
      subtitle: 'Clean Burn & Quick Glow Starts',
      detail: 'Kubota patented Three Vortex Combustion System reduces smoke soot, cuts diesel knock, and enables instantaneous cold winter starts.',
      target: { x: 42, y: 31 },
      origin: { x: 4, y: 64 }
    },
    {
      id: 'eng-coupling',
      title: 'Triple-Pump Drive Flange',
      subtitle: 'Direct Flywheel Coupling',
      detail: 'Heavy balanced flywheel couples directly to the triple-pump hydraulic group, transferring 25 HP with zero belt slip.',
      target: { x: 32, y: 55 },
      origin: { x: 66, y: 64 }
    }
  ]

  const engineFlywheelCallouts: CalloutItem[] = [
    {
      id: 'eng-fly-block',
      title: 'Cast-Iron Heavy Block',
      subtitle: '10,000+ Hour Commercial Life',
      detail: 'Rugged Japanese industrial casting engineered with low center of gravity to minimize machine vibration and chassis stress.',
      target: { x: 49, y: 28 },
      origin: { x: 4, y: 14 }
    },
    {
      id: 'eng-fly-rating',
      title: '25 HP Verified Output',
      subtitle: 'EPA Tier 4 Final Certified',
      detail: 'EPA and EU Stage V compliant diesel with exceptional fuel economy (~1.8–2.2 L/h) and universal parts availability nationwide.',
      target: { x: 62, y: 44 },
      origin: { x: 66, y: 14 }
    },
    {
      id: 'eng-fly-starter',
      title: 'Heavy-Duty 12V Starter',
      subtitle: 'Integrated Glow Plugs',
      detail: 'High-torque starter motor combined with pre-heat glow plugs delivers reliable ignition in freezing weather conditions.',
      target: { x: 38, y: 50 },
      origin: { x: 4, y: 64 }
    },
    {
      id: 'eng-fly-bell',
      title: 'SAE Pump Bellhousing',
      subtitle: 'Direct Hydraulic Flange',
      detail: 'Precision-machined bellhousing flange anchors the 3-pump hydraulic system directly to the 25 HP engine output shaft.',
      target: { x: 54, y: 56 },
      origin: { x: 66, y: 64 }
    }
  ]

  // 2. 3-Pump / 3-Valve Hydraulic System Callouts
  const hydraulicsCallouts: CalloutItem[] = [
    {
      id: 'hyd-pilot',
      title: 'Precision Pilot Joysticks',
      subtitle: 'Micro-Feathering Control',
      detail: 'Low-effort hydraulic pilot joysticks provide responsive, feather-light boom positioning and smooth dual-track steering.',
      target: { x: 33, y: 24 },
      origin: { x: 4, y: 14 }
    },
    {
      id: 'hyd-rams',
      title: '16 MPa (2,321 PSI) Lift Rams',
      subtitle: 'Dual Boom Cylinders',
      detail: 'Dual hard-chrome plated hydraulic rams deliver 16 MPa (2,321 PSI) working pressure for high breakout force and swift cycle times.',
      target: { x: 54, y: 50 },
      origin: { x: 66, y: 14 }
    },
    {
      id: 'hyd-ports',
      title: '3-Valve Auxiliary Ports',
      subtitle: '48 L/min (12.7 GPM) Flow',
      detail: 'Triple flat-face dry-break quick couplers with red dust caps supply 48 L/min auxiliary flow for augers, trenchers, and grapples.',
      target: { x: 44, y: 49 },
      origin: { x: 4, y: 64 }
    },
    {
      id: 'hyd-attach',
      title: 'Quick-Attach Mount Plate',
      subtitle: 'Rapid Attachment Changes',
      detail: 'Universal quick-attach interface allows rapid 2-minute swaps between standard dirt bucket, pallet fork, and hydraulic attachments.',
      target: { x: 62, y: 70 },
      origin: { x: 66, y: 64 }
    }
  ]

  // 3. Triangular Track Undercarriage Callouts
  const trackCallouts: CalloutItem[] = [
    {
      id: 'trk-sprocket',
      title: 'Elevated High-Drive Sprocket',
      subtitle: 'Triangular Geometry',
      detail: 'Elevated triangular drive sprocket positions hydraulic motors high above abrasive mud, sand, and water to protect seal life.',
      target: { x: 68, y: 68 },
      origin: { x: 66, y: 14 }
    },
    {
      id: 'trk-boom',
      title: 'High-Pivot Box Arms',
      subtitle: 'Robotic Welded Steel',
      detail: 'Reinforced box-section steel loader arms distribute high lifting stresses directly down to the rigid track undercarriage.',
      target: { x: 52, y: 48 },
      origin: { x: 4, y: 14 }
    },
    {
      id: 'trk-tensioner',
      title: 'Spring Grease Tensioner',
      subtitle: 'Anti-Derailment Guide',
      detail: 'Grease-cylinder recoil spring absorbs harsh rock impacts and maintains correct track tension on steep hillside slopes.',
      target: { x: 36, y: 74 },
      origin: { x: 4, y: 64 }
    },
    {
      id: 'trk-rubber',
      title: 'Chevron Rubber Tracks',
      subtitle: '3.8 PSI Ground Pressure',
      detail: '180mm continuous steel-cord rubber tracks float over delicate residential lawns with 3.8 PSI ground pressure and 30° gradeability.',
      target: { x: 50, y: 78 },
      origin: { x: 66, y: 64 }
    }
  ]

  // 4. Protective Side Safety Guards Callouts
  const guardsCallouts: CalloutItem[] = [
    {
      id: 'grd-width',
      title: '35.9-Inch (911 mm) Width',
      subtitle: 'Standard 36" Gate Entry',
      detail: 'Ultra-compact 911 mm machine width allows the V900 to easily glide through standard residential pedestrian gates and tight yard fences.',
      target: { x: 41, y: 38 },
      origin: { x: 4, y: 14 }
    },
    {
      id: 'grd-safety',
      title: 'Roll-Over Safety Frame',
      subtitle: 'Structural Carbon Steel',
      detail: 'Substantial structural steel cage surrounds the console, protecting the operator controls and gauges from falling debris.',
      target: { x: 58, y: 38 },
      origin: { x: 66, y: 14 }
    },
    {
      id: 'grd-shield',
      title: '4mm Steel Side Shields',
      subtitle: 'Heavy-Duty Impact Armor',
      detail: 'Laser-cut 4mm carbon steel armor panels shield hydraulic valves, hoses, and battery compartment from tree trunks and rock strikes.',
      target: { x: 36, y: 58 },
      origin: { x: 4, y: 64 }
    },
    {
      id: 'grd-platform',
      title: 'Cushioned Stand-On Platform',
      subtitle: 'Fold-Up Anti-Fatigue',
      detail: 'Perforated non-slip steel floor plate with vibration-damped suspension cushions the ride over rough jobsite terrain.',
      target: { x: 49, y: 74 },
      origin: { x: 66, y: 64 }
    }
  ]

  // 5. Lifting Capacity & Breakout Callouts
  const capacityCallouts: CalloutItem[] = [
    {
      id: 'cap-bucket',
      title: '5.30 FT³ (0.15 m³) Bucket',
      subtitle: '1,012 LBF Breakout Force',
      detail: 'Heavy-duty steel bucket with 1,012 lbf (4.5 kN) hydraulic breakout force to pry through hard clay, roots, and compacted rubble.',
      target: { x: 42, y: 16 },
      origin: { x: 4, y: 14 }
    },
    {
      id: 'cap-reach',
      title: '74-Inch Dump Clearance',
      subtitle: 'High-Truck Loading Path',
      detail: 'High-pivot vertical lift geometry easily clears commercial pickup truck beds and high-sided dump trailers for efficient loading.',
      target: { x: 58, y: 16 },
      origin: { x: 66, y: 14 }
    },
    {
      id: 'cap-rams',
      title: 'Dual Hydraulic Hoist Rams',
      subtitle: '16 MPa Working Pressure',
      detail: 'Dual synchronized hydraulic lift rams with internal safety check valves provide smooth, stable bucket elevation without drift.',
      target: { x: 41, y: 44 },
      origin: { x: 4, y: 64 }
    },
    {
      id: 'cap-roc',
      title: '1,014 LBS ROC (460 KG)',
      subtitle: '1,102 LBS (500 KG) Max Threshold',
      detail: 'Everyday Rated Operating Capacity (35% SAE standard) designed for safe balanced transport, with 1,102 lbs peak mechanical capacity.',
      target: { x: 50, y: 62 },
      origin: { x: 66, y: 64 }
    }
  ]

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
            Compact Size. Serious Lifting Performance. Explore the genuine <strong>Kubota D1105 25 HP</strong> powertrain,
            3-pump / 3-valve hydraulic architecture, triangular track stability, reinforced protective
            side guards, and verified 1,014 lbs ROC lifting capacity.
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
              <span>1. Kubota D1105 (25 HP)</span>
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
              <span>5. Lifting Capacity (1,014 lbs ROC)</span>
            </a>
          </div>
        </div>

        {/* 1. Kubota D1105 Engine Feature Section */}
        {(activeTab === 'all' || activeTab === 'engine') && (
          <div id="v900-engine" className="v900-system-block">
            <div className="v900-block-intro">
              <span className="v900-eyebrow">Proven Powertrain Platform</span>
              <h3 className="v900-block-heading">
                Powered by the Genuine Kubota D1105 (25 HP) Engine
              </h3>
              <p className="v900-block-desc">
                The V900 is equipped with the genuine <strong>Kubota D1105 25 HP (18.5 kW)</strong> 3-cylinder diesel engine.
                Renowned worldwide for its legendary industrial reliability, low-RPM torque of 71.5 N·m, spherical E-TVCS
                combustion chamber, and EPA Tier 4 Final compliance, it powers the V900 through demanding earthmoving and grading.
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
                    <span>Front Fan & Cooling Drive (25 HP)</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={engineAngle === 'flywheel'}
                    className={`angle-tab-btn ${engineAngle === 'flywheel' ? 'active' : ''}`}
                    onClick={() => setEngineAngle('flywheel')}
                  >
                    <span className="angle-bullet"></span>
                    <span>Rear Flywheel & Manifold (25 HP)</span>
                  </button>
                </div>

                <TechnicalCalloutStage
                  imageSrc={
                    engineAngle === 'fan'
                      ? '/images/v900/v900-kubota-d1105-engine.webp'
                      : '/images/v900/v900-kubota-d1105-engine-angle.webp'
                  }
                  imageAlt="Kubota D1105 25 HP compact diesel engine on technical studio stage"
                  imageTitle="Kubota D1105 25 HP Engine"
                  sysId="KUBOTA-D1105-25HP"
                  badgeText="25.0 HP @ 3000 RPM // 3-CYLINDER DIESEL"
                  callouts={engineAngle === 'fan' ? engineFanCallouts : engineFlywheelCallouts}
                  activeCallout={activeCallout}
                  onHoverCallout={setActiveCallout}
                />
              </div>

              <div className="v900-engine-content">
                <div className={`v900-spec-feature-card ${activeCallout === 'eng-block' || activeCallout === 'eng-fly-rating' ? 'highlighted' : ''}`}>
                  <div className="feature-card-icon">⚡</div>
                  <div>
                    <h4>25 HP High-Torque Diesel Platform</h4>
                    <p>
                      The genuine Kubota D1105-E4B produces <strong>25.0 HP (18.5 kW) @ 3000 RPM</strong> and <strong>71.5 N·m (52.7 lb-ft) of low-end torque</strong>.
                      This delivers ample power to drive the tracks and operate heavy attachments simultaneously without engine stall.
                    </p>
                  </div>
                </div>

                <div className={`v900-spec-feature-card ${activeCallout === 'eng-injection' ? 'highlighted' : ''}`}>
                  <div className="feature-card-icon">🔬</div>
                  <div>
                    <h4>Spherical E-TVCS Combustion Technology</h4>
                    <p>
                      Kubota's patented Three Vortex Combustion System generates an optimal air-fuel swirl in the pre-chamber.
                      Results in complete combustion, reduced particulate soot emissions, low noise, and high fuel economy (~1.8–2.2 L/h).
                    </p>
                  </div>
                </div>

                <div className={`v900-spec-feature-card ${activeCallout === 'eng-fan' ? 'highlighted' : ''}`}>
                  <div className="feature-card-icon">❄️</div>
                  <div>
                    <h4>Heavy-Duty Liquid Cooling System</h4>
                    <p>
                      Pressurized water cooling with a high-flow multi-blade fan and aluminum core radiator maintains safe thermal
                      operating limits in harsh summer jobsite temperatures up to 45°C (113°F).
                    </p>
                  </div>
                </div>

                <div className={`v900-spec-feature-card ${activeCallout === 'eng-coupling' || activeCallout === 'eng-fly-bell' ? 'highlighted' : ''}`}>
                  <div className="feature-card-icon">⚙️</div>
                  <div>
                    <h4>Direct Triple-Pump Hydraulic Coupling</h4>
                    <p>
                      Direct mechanical flange coupling transfers the 25 HP engine output directly into the triple-pump hydraulic group
                      with zero belt slipping, maximizing mechanical efficiency and response.
                    </p>
                  </div>
                </div>

                <div className="v900-action-card">
                  <div>
                    <strong>Need official Kubota D1105 documentation?</strong>
                    <p>Download certified power curves, EPA certificates, and service schematics.</p>
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
                3-Pump / 3-Valve Responsive Hydraulic Architecture
              </h3>
              <p className="v900-block-desc">
                The V900 features an advanced 3-pump / 3-valve hydraulic circuit delivering <strong>48 L/min (12.7 GPM)</strong> auxiliary flow
                at <strong>16 MPa (2,321 PSI)</strong>. Dedicated hydraulic pumps for left track, right track, and implements eliminate
                power drop during simultaneous turning and lifting.
              </p>
            </div>

            <div className="v900-hydraulics-layout">
              <TechnicalCalloutStage
                imageSrc="/images/v900/v900-hydraulic-system.webp"
                imageAlt="V900 3-pump / 3-valve hydraulic system on technical studio stage"
                imageTitle="V900 3-Pump / 3-Valve Hydraulic System"
                sysId="HYD-3P3V-48LPM"
                badgeText="48 L/MIN (12.7 GPM) // 16 MPA (2,321 PSI)"
                callouts={hydraulicsCallouts}
                activeCallout={activeCallout}
                onHoverCallout={setActiveCallout}
                extraVisual={
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
                      <span>Flat-Face Quick Couplers</span>
                    </div>
                  </div>
                }
              />

              <div className="v900-hydraulics-spec-grid">
                <div className={`v900-metric-tile highlight-tile ${activeCallout === 'hyd-ports' ? 'highlighted' : ''}`}>
                  <div className="tile-stat-header">
                    <span className="tile-stat-number">48</span>
                    <span className="tile-stat-unit">L/min <small>(12.7 GPM)</small></span>
                  </div>
                  <h4>Continuous Auxiliary Flow</h4>
                  <p>
                    High continuous auxiliary flow rapidly cycles heavy attachments including pallet forks,
                    hydraulic augers, trenchers, and grapples.
                  </p>
                </div>

                <div className={`v900-metric-tile ${activeCallout === 'hyd-rams' ? 'highlighted' : ''}`}>
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

                <div className={`v900-metric-tile ${activeCallout === 'hyd-pilot' ? 'highlighted' : ''}`}>
                  <div className="tile-stat-header">
                    <span className="tile-stat-number">3 / 3</span>
                    <span className="tile-stat-unit">System Config</span>
                  </div>
                  <h4>Triple Pump & Valve Architecture</h4>
                  <p>
                    Dedicated hydraulic circuits balance flow among drive tracks, boom hoist, and auxiliary
                    attachments for fluid simultaneous control without arm stutter.
                  </p>
                </div>

                <div className={`v900-metric-tile ${activeCallout === 'hyd-attach' ? 'highlighted' : ''}`}>
                  <div className="tile-stat-header">
                    <span className="tile-stat-number">Flat</span>
                    <span className="tile-stat-unit">Face Couplers</span>
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
                  Triangular Track System for Stability and Low Ground Pressure
                </h3>
                <p className="v900-block-desc">
                  The V900's triangular track configuration elevates the drive sprocket above mud, rocks, and corrosive water,
                  protecting hydraulic drive motor seals while distributing the 1,400 kg machine weight across rubber tracks at only
                  <strong> 3.8 PSI (26 kPa)</strong>.
                </p>

                <div className="v900-check-list">
                  <div className={`check-item ${activeCallout === 'trk-sprocket' ? 'highlighted' : ''}`}>
                    <div className="check-badge">✓</div>
                    <div>
                      <strong>Elevated High-Drive Sprocket</strong>
                      <p>
                        Isolates the drive motors high above wet slurry, rocky debris, and standing water,
                        prolonging motor seal life by over 60%.
                      </p>
                    </div>
                  </div>

                  <div className={`check-item ${activeCallout === 'trk-rubber' ? 'highlighted' : ''}`}>
                    <div className="check-badge">✓</div>
                    <div>
                      <strong>3.8 PSI Low Ground Pressure</strong>
                      <p>
                        Wide 180mm continuous steel-cord tracks float over lawns, finished stone pavers, and golf turf
                        without tearing or leaving deep wheel ruts.
                      </p>
                    </div>
                  </div>

                  <div className={`check-item ${activeCallout === 'trk-tensioner' ? 'highlighted' : ''}`}>
                    <div className="check-badge">✓</div>
                    <div>
                      <strong>Grease-Cylinder Recoil Tensioning</strong>
                      <p>
                        Internal recoil spring absorbs severe rock impacts and maintains correct track tension
                        to eliminate track de-tracking on 30° slopes.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="v900-grid-visual">
                <TechnicalCalloutStage
                  imageSrc="/images/v900/v900-triangular-track-system.webp"
                  imageAlt="V900 triangular track undercarriage on technical studio stage"
                  imageTitle="V900 Triangular Track Undercarriage"
                  sysId="TRACK-TRI-180MM"
                  badgeText="HIGH-DRIVE SPROCKET // 3.8 PSI GROUND PRESSURE"
                  callouts={trackCallouts}
                  activeCallout={activeCallout}
                  onHoverCallout={setActiveCallout}
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. Protective Side Safety Guards Section */}
        {(activeTab === 'all' || activeTab === 'guards') && (
          <div id="v900-guards" className="v900-system-block">
            <div className="v900-dual-grid reverse-on-desktop">
              <div className="v900-grid-visual">
                <TechnicalCalloutStage
                  imageSrc="/images/v900/v900-protective-side-guards.webp"
                  imageAlt="V900 rear elevation showing protective side safety guards on technical studio stage"
                  imageTitle="V900 Protective Side Safety Guards"
                  sysId="GUARD-4MM-STEEL"
                  badgeText="4MM STEEL ARMOR // 35.9-INCH NARROW PROFILE"
                  callouts={guardsCallouts}
                  activeCallout={activeCallout}
                  onHoverCallout={setActiveCallout}
                />
              </div>

              <div className="v900-grid-text">
                <span className="v900-eyebrow">Chassis Protection</span>
                <h3 className="v900-block-heading">
                  Reinforced 4mm Steel Side Guards & 35.9" Gate Entry
                </h3>
                <p className="v900-block-desc">
                  Heavy-duty 4mm laser-cut structural steel side shields guard internal hydraulic distribution blocks,
                  wiring harnesses, and the Kubota 25 HP engine compartment from tree stumps, concrete blocks, and jobsite impact,
                  all while maintaining an ultra-narrow <strong>911 mm (35.9-inch)</strong> machine profile.
                </p>

                <div className="v900-guard-cards-grid">
                  <div className={`guard-card ${activeCallout === 'grd-shield' ? 'highlighted' : ''}`}>
                    <h4>4mm Steel Side Armor</h4>
                    <p>
                      Protects critical hydraulic line routing and valve fittings from falling rocks, fence posts, and construction site hazards.
                    </p>
                  </div>

                  <div className={`guard-card ${activeCallout === 'grd-width' ? 'highlighted' : ''}`}>
                    <h4>35.9" Standard Gate Entry</h4>
                    <p>
                      Slim 911 mm frame glides effortlessly through standard 36-inch residential garden gates without dismantling fences.
                    </p>
                  </div>

                  <div className={`guard-card ${activeCallout === 'grd-safety' ? 'highlighted' : ''}`}>
                    <h4>Operator Safety Framework</h4>
                    <p>
                      Robust steel safety structure protects the operator control console, joysticks, and instrument displays.
                    </p>
                  </div>

                  <div className={`guard-card ${activeCallout === 'grd-platform' ? 'highlighted' : ''}`}>
                    <h4>Suspension Stand-On Platform</h4>
                    <p>
                      Vibration-damped cushioned stand-on plate minimizes operator fatigue during long shifts and folds up for transport.
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
                Compact Footprint. Verified Lifting Capacity & Breakout Force
              </h3>
              <p className="v900-block-desc">
                The V900 delivers a <strong>1,014 lbs (460 kg)</strong> Rated Operating Capacity (ROC, 35% SAE standard)
                and a peak mechanical capacity of <strong>1,102 lbs (500 kg)</strong>, paired with <strong>1,012 lbf (4.5 kN)</strong> breakout force
                and a <strong>74-inch</strong> dump height for truck bed clearance.
              </p>
            </div>

            <div className="v900-capacity-showcase">
              {/* Product Visual: Front Raised Elevation with Interactive Technical Arrows */}
              <TechnicalCalloutStage
                imageSrc="/images/v900/v900-loader-raised-front.webp"
                imageAlt="V900 high-lift raised front loader on technical studio stage"
                imageTitle="V900 Lifting Capacity and Front High-Lift Elevation"
                sysId="CAPACITY-ROC-1014LBS"
                badgeText="1,014 LBS ROC // 1,102 LBS MAX LOAD // 1,012 LBF BREAKOUT"
                callouts={capacityCallouts}
                activeCallout={activeCallout}
                onHoverCallout={setActiveCallout}
              />

              {/* Native Specification Cards */}
              <div className="v900-capacity-cards-grid">
                <div className={`capacity-metric-card roc-card ${activeCallout === 'cap-roc' ? 'highlighted' : ''}`}>
                  <span className="capacity-badge">DAILY SAFE WORKING LIMIT</span>
                  <div className="capacity-stat">
                    <span className="stat-number">1,014</span>
                    <span className="stat-unit">LBS <small>(460 KG)</small></span>
                  </div>
                  <h4>Rated Operating Capacity (ROC)</h4>
                  <p>
                    Engineered according to 35% SAE safety standards for everyday safe, balanced material transport across uneven jobsite terrain
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

                <div className={`capacity-metric-card aux-card ${activeCallout === 'cap-bucket' || activeCallout === 'cap-reach' ? 'highlighted' : ''}`}>
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
                  <div className="aux-metrics-pair" style={{ marginTop: '1rem', borderTop: '1px solid rgba(226, 232, 240, 0.8)', paddingTop: '0.85rem' }}>
                    <div>
                      <span className="aux-num">74 IN</span>
                      <span className="aux-lbl">Dump Pin Height</span>
                    </div>
                    <div>
                      <span className="aux-num">16 MPA</span>
                      <span className="aux-lbl">Hoist Ram Pressure</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
