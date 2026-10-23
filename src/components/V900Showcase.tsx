import { useState } from 'react'
import './V900Showcase.css'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any
    }
  }
  namespace React.JSX {
    interface IntrinsicElements {
      'model-viewer': any
    }
  }
}

interface AccurateCallout {
  id: string
  title: string
  subtitle: string
  // Exact coordinate where the arrow points directly onto the product (0-100% of image)
  target: { x: number; y: number }
  // Origin where the callout badge is anchored (0-100% of image canvas)
  origin: { x: number; y: number }
  // Line start offset so arrow connects naturally from badge
  lineStart: { x: number; y: number }
}

interface PrecisionStageProps {
  imageSrc: string
  imageAlt: string
  imageTitle: string
  sysId: string
  callouts: AccurateCallout[]
  activeCallout: string | null
  onHoverCallout: (id: string | null) => void
}

function PrecisionProductStage({
  imageSrc,
  imageAlt,
  imageTitle,
  sysId,
  callouts,
  activeCallout,
  onHoverCallout
}: PrecisionStageProps) {
  return (
    <div className="v900-precision-stage-shell">
      {/* Studio Background with Ambient Spotlight & Subtle Tech Blueprint Grid */}
      <div className="v900-precision-canvas-box">
        {/* Machine Isolated Transparent Product */}
        <img
          src={imageSrc}
          alt={imageAlt}
          title={imageTitle}
          className="v900-precision-img"
          width={1280}
          height={1280}
          loading="lazy"
        />

        {/* 1:1 Matched SVG Overlay for 100% Exact Arrow Accuracy */}
        <svg
          className="v900-precision-svg"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <marker
              id={`arr-default-${sysId}`}
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0.5, 5 3, 0 5.5" fill="currentColor" className="marker-default-poly" />
            </marker>
            <marker
              id={`arr-active-${sysId}`}
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0.5, 6 3.5, 0 6.5" fill="#00e5ff" />
            </marker>
          </defs>

          {callouts.map((c) => {
            const isActive = activeCallout === c.id
            return (
              <g key={c.id} className={`v900-arrow-item ${isActive ? 'is-active' : ''}`}>
                {/* Precision Leader Arrow pointing directly to product feature */}
                <line
                  x1={c.lineStart.x}
                  y1={c.lineStart.y}
                  x2={c.target.x}
                  y2={c.target.y}
                  className="v900-leader-line"
                  markerEnd={`url(#${isActive ? `arr-active-${sysId}` : `arr-default-${sysId}`})`}
                />
                {/* Glowing Radar Target Pin on Product */}
                <circle cx={c.target.x} cy={c.target.y} r="1.8" className="pin-center" />
                <circle cx={c.target.x} cy={c.target.y} r="3.6" className="pin-pulse" />
              </g>
            )
          })}
        </svg>

        {/* Floating Callout Badges Anchored around Image */}
        {callouts.map((c, idx) => {
          const isActive = activeCallout === c.id
          return (
            <button
              key={c.id}
              type="button"
              className={`v900-pointer-badge ${isActive ? 'is-active' : ''}`}
              style={{ left: `${c.origin.x}%`, top: `${c.origin.y}%` }}
              onMouseEnter={() => onHoverCallout(c.id)}
              onMouseLeave={() => onHoverCallout(null)}
              onClick={() => onHoverCallout(isActive ? null : c.id)}
              aria-label={`${c.title} - ${c.subtitle}`}
            >
              <span className="badge-num">0{idx + 1}</span>
              <div className="badge-copy">
                <strong>{c.title}</strong>
                <small>{c.subtitle}</small>
              </div>
            </button>
          )
        })}
      </div>

      {/* Mobile/Tablet Callout Switcher Strip */}
      <div className="v900-mobile-pill-strip" role="tablist" aria-label="Feature callouts">
        {callouts.map((c, idx) => (
          <button
            key={c.id}
            type="button"
            className={`mobile-pill-btn ${activeCallout === c.id ? 'is-active' : ''}`}
            onClick={() => onHoverCallout(activeCallout === c.id ? null : c.id)}
          >
            <span className="pill-n">0{idx + 1}</span>
            <span>{c.title}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function V900Showcase() {
  const [activeTab, setActiveTab] = useState<'both' | 'engine' | 'track'>('both')
  const [engineMode, setEngineMode] = useState<'diagram' | '3d'>('3d')
  const [activeCallout, setActiveCallout] = useState<string | null>(null)
  const [customModelUrl, setCustomModelUrl] = useState<string | null>(null)
  const [uploadToast, setUploadToast] = useState<string | null>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    setCustomModelUrl(objectUrl)
    setUploadToast(`Loaded ${file.name}! Saving...`)

    try {
      const buffer = await file.arrayBuffer()
      const res = await fetch('/api/save-3d-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: buffer
      })
      if (res.ok) {
        setUploadToast(`✔ ${file.name} saved permanently!`)
        setTimeout(() => setUploadToast(null), 4000)
      }
    } catch {
      setUploadToast(`✔ Loaded in 3D viewer!`)
      setTimeout(() => setUploadToast(null), 4000)
    }
  }

  // 1. Kubota D1105 (25 HP) Engine - Exact Points Calibrated to Product Image
  const engineCallouts: AccurateCallout[] = [
    {
      id: 'eng-fan',
      title: 'Cooling Fan',
      subtitle: 'Multi-Blade Thermal Cooling',
      // Centroid of white fan blades: X=66.2%, Y=36.4%
      target: { x: 66.2, y: 36.4 },
      origin: { x: 74, y: 16 },
      lineStart: { x: 74, y: 22 }
    },
    {
      id: 'eng-block',
      title: '25 HP Kubota Block',
      subtitle: '3-Cylinder Diesel Engine',
      // Exact center of the 25 HP engine block: X=48.0%, Y=52.0%
      target: { x: 48.0, y: 52.0 },
      origin: { x: 5, y: 36 },
      lineStart: { x: 26, y: 40 }
    },
    {
      id: 'eng-flywheel',
      title: 'Flywheel Output',
      subtitle: 'Direct Hydraulic Power Flange',
      // Center of left flywheel rim: X=33.0%, Y=52.0%
      target: { x: 33.0, y: 52.0 },
      origin: { x: 5, y: 68 },
      lineStart: { x: 26, y: 68 }
    }
  ]

  // Triangular Track Undercarriage - Exact Points Calibrated to Product Image
  const trackCallouts: AccurateCallout[] = [
    {
      id: 'trk-sprocket',
      title: 'Elevated Drive Sprocket',
      subtitle: 'Raised Clear of Mud & Water',
      // Center of circular elevated sprocket: X=68.5%, Y=68.0%
      target: { x: 68.5, y: 68.0 },
      origin: { x: 72, y: 46 },
      lineStart: { x: 72, y: 54 }
    },
    {
      id: 'trk-rubber',
      title: 'Chevron Rubber Track',
      subtitle: '3.8 PSI Low Ground Pressure',
      // Ground contact of the chevron rubber track: X=52.0%, Y=78.5%
      target: { x: 52.0, y: 78.5 },
      origin: { x: 34, y: 91 },
      lineStart: { x: 52, y: 91 }
    },
    {
      id: 'trk-idler',
      title: 'Steel Track Idler',
      subtitle: 'Impact Recoil Guide',
      // Center of front track idler wheel: X=36.0%, Y=74.5%
      target: { x: 36.0, y: 74.5 },
      origin: { x: 4, y: 52 },
      lineStart: { x: 26, y: 58 }
    }
  ]

  return (
    <section id="v900-deep-dive" className="v900-deep-dive-section" aria-labelledby="v900-deep-dive-heading">
      <div className="v900-container">
        {/* Section Header */}
        <div className="v900-master-header">
          <div className="v900-pill-badge">
            <span className="badge-pulse"></span>
            <span>V900 CORE ENGINEERING HIGHLIGHTS</span>
          </div>
          <h2 id="v900-deep-dive-heading" className="v900-master-title">
            Engine & Triangular Track System
          </h2>
          <p className="v900-master-subtitle">
            Explore the authentic <strong>Kubota D1105 (25 HP)</strong> 3-cylinder diesel powertrain
            and the heavy-duty <strong>Triangular Track</strong> undercarriage engineered for maximum stability.
          </p>

          {/* Simple Clean Filter Pills */}
          <div className="v900-section-nav" role="tablist" aria-label="Feature filter">
            <button
              type="button"
              className={`v900-nav-pill ${activeTab === 'both' ? 'active' : ''}`}
              onClick={() => setActiveTab('both')}
            >
              <span>View Both</span>
            </button>
            <button
              type="button"
              className={`v900-nav-pill ${activeTab === 'engine' ? 'active' : ''}`}
              onClick={() => setActiveTab('engine')}
            >
              <span>1. Kubota D1105 Engine (25 HP)</span>
            </button>
            <button
              type="button"
              className={`v900-nav-pill ${activeTab === 'track' ? 'active' : ''}`}
              onClick={() => setActiveTab('track')}
            >
              <span>2. Triangular Track System</span>
            </button>
          </div>
        </div>

        {/* 1. KUBOTA D1105 (25 HP) ENGINE */}
        {(activeTab === 'both' || activeTab === 'engine') && (
          <div id="v900-engine" className="v900-core-block">
            <div className="v900-core-grid">
              {/* Left / Visual: Interactive Precision Diagram OR 3D Model View */}
              <div className="v900-core-visual">
                {/* Engine View Mode Switcher */}
                <div className="v900-engine-mode-bar" role="tablist" aria-label="Engine Visual Mode">
                  <button
                    type="button"
                    className={`v900-engine-mode-btn ${engineMode === 'diagram' ? 'active' : ''}`}
                    onClick={() => setEngineMode('diagram')}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>Blueprint Diagram</span>
                  </button>
                  <button
                    type="button"
                    className={`v900-engine-mode-btn ${engineMode === '3d' ? 'active' : ''}`}
                    onClick={() => setEngineMode('3d')}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                    <span>3D Model (Interactive)</span>
                  </button>
                </div>

                {engineMode === 'diagram' ? (
                  <PrecisionProductStage
                    imageSrc="/images/v900/v900-kubota-d1105-engine.webp"
                    imageAlt="Kubota D1105 25 HP compact diesel engine"
                    imageTitle="Kubota D1105 25 HP Engine"
                    sysId="KUBOTA-25HP"
                    callouts={engineCallouts}
                    activeCallout={activeCallout}
                    onHoverCallout={setActiveCallout}
                  />
                ) : (
                  <div className="v900-3d-model-card">
                    {/* Top Status Tag */}
                    <div className="v900-3d-card-top-tag">
                      <span className="v900-3d-radar-pulse" />
                      <span>3D INTERACTIVE ENGINE • ROTATE 360°</span>
                    </div>

                    <model-viewer
                      src={customModelUrl || "/models/kubota-d1105.glb"}
                      alt="Kubota D1105 (25 HP) Engine 3D Interactive Model"
                      auto-rotate
                      auto-rotate-delay="300"
                      rotation-per-second="25deg"
                      camera-controls
                      touch-action="pan-y"
                      shadow-intensity="1.5"
                      shadow-softness="0.5"
                      exposure="1.0"
                      poster="/images/v900/v900-kubota-d1105-engine.webp"
                      loading="eager"
                      reveal="auto"
                      className="v900-model-viewer-elem"
                    >
                      <div slot="poster" className="v900-3d-loading-poster">
                        <img
                          src="/images/v900/v900-kubota-d1105-engine.webp"
                          alt="Kubota D1105 Engine"
                          className="v900-3d-preview-img"
                        />
                        <div className="v900-3d-loading-spinner">
                          <span className="v900-spinner-ring" />
                          <span>Loading 3D Engine...</span>
                        </div>
                      </div>
                    </model-viewer>

                    {/* Bottom Action / Hint Bar */}
                    <div className="v900-3d-bottom-bar">
                      <span className="v900-3d-hint-text">
                        🖱️ Drag to rotate 360° • Scroll to zoom
                      </span>

                      <div className="v900-3d-actions-group">
                        <label className="v900-3d-upload-btn" title="Upload exported GLB file directly from Meshy">
                          <input type="file" accept=".glb,.gltf" onChange={handleFileUpload} style={{ display: 'none' }} />
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                          </svg>
                          <span>Import Meshy .glb</span>
                        </label>

                        <a
                          href="https://www.meshy.ai/3d-models/f249cbd6-7e0d-40cf-a4a2-9d99b2c5ba66?utm_medium=referral-program&utm_source=meshy&utm_content=2RJKFJ&share_type=3d-models"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="v900-3d-link-mini"
                          title="Open full model on Meshy.ai"
                        >
                          <span>Open in Meshy</span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      </div>
                    </div>

                    {uploadToast && (
                      <div className="v900-3d-toast-float">
                        <span>{uploadToast}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right / Content: Concise & Punchy ("dont too much detail") */}
              <div className="v900-core-info">
                <span className="v900-eyebrow">Proven Powertrain</span>
                <h3 className="v900-core-heading">
                  Kubota D1105 (25 HP) Engine
                </h3>
                <p className="v900-core-desc">
                  Powered by an authentic <strong>25.0 HP (18.5 kW)</strong> 3-cylinder liquid-cooled Kubota diesel.
                  Engineered for high low-RPM torque (71.5 N·m), smooth operation, and extreme all-day jobsite reliability.
                </p>

                {/* 3 Key Spec Badges */}
                <div className="v900-specs-strip">
                  <div className={`spec-badge-box ${activeCallout === 'eng-block' ? 'highlighted' : ''}`}>
                    <span className="spec-big">25 HP</span>
                    <span className="spec-sub">Gross Power @ 3000 RPM</span>
                  </div>
                  <div className={`spec-badge-box ${activeCallout === 'eng-fan' ? 'highlighted' : ''}`}>
                    <span className="spec-big">3-Cyl</span>
                    <span className="spec-sub">1.123L Liquid-Cooled</span>
                  </div>
                  <div className={`spec-badge-box ${activeCallout === 'eng-flywheel' ? 'highlighted' : ''}`}>
                    <span className="spec-big">Tier 4</span>
                    <span className="spec-sub">EPA Final Compliant</span>
                  </div>
                </div>

                {/* 3 Concise Key Feature Points */}
                <div className="v900-clean-points">
                  <div className={`clean-point ${activeCallout === 'eng-block' ? 'highlighted' : ''}`}>
                    <div className="point-icon">⚡</div>
                    <div>
                      <strong>25 HP High-Torque Performance</strong>
                      <p>Produces 71.5 N·m torque to push heavy material and drive attachments without bogging down.</p>
                    </div>
                  </div>

                  <div className={`clean-point ${activeCallout === 'eng-fan' ? 'highlighted' : ''}`}>
                    <div className="point-icon">❄️</div>
                    <div>
                      <strong>Multi-Blade Cooling System</strong>
                      <p>High-CFM fan and heavy-duty radiator provide continuous thermal stability in hot climates.</p>
                    </div>
                  </div>

                  <div className={`clean-point ${activeCallout === 'eng-flywheel' ? 'highlighted' : ''}`}>
                    <div className="point-icon">⚙️</div>
                    <div>
                      <strong>Direct Hydraulic Coupling</strong>
                      <p>Flywheel transfers 25 HP directly to the hydraulic pump group with zero belt slippage.</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* 2. TRIANGULAR TRACK SYSTEM */}
        {(activeTab === 'both' || activeTab === 'track') && (
          <div id="v900-tracks" className="v900-core-block">
            <div className="v900-core-grid reverse-on-desktop">
              {/* Left / Content */}
              <div className="v900-core-info">
                <span className="v900-eyebrow">Undercarriage Stability</span>
                <h3 className="v900-core-heading">
                  Triangular Track System
                </h3>
                <p className="v900-core-desc">
                  The V900's triangular track architecture elevates the drive motor safely above jobsite mud, rocks, and water,
                  while wide rubber tracks distribute the machine weight at only <strong>3.8 PSI</strong> to protect finished lawns and pavers.
                </p>

                {/* 3 Key Spec Badges */}
                <div className="v900-specs-strip">
                  <div className={`spec-badge-box ${activeCallout === 'trk-rubber' ? 'highlighted' : ''}`}>
                    <span className="spec-big">3.8 PSI</span>
                    <span className="spec-sub">Low Ground Pressure</span>
                  </div>
                  <div className={`spec-badge-box ${activeCallout === 'trk-sprocket' ? 'highlighted' : ''}`}>
                    <span className="spec-big">High-Drive</span>
                    <span className="spec-sub">Protected Motor Apex</span>
                  </div>
                  <div className={`spec-badge-box ${activeCallout === 'trk-idler' ? 'highlighted' : ''}`}>
                    <span className="spec-big">180 mm</span>
                    <span className="spec-sub">Chevron Rubber Tracks</span>
                  </div>
                </div>

                {/* 3 Concise Key Feature Points */}
                <div className="v900-clean-points">
                  <div className={`clean-point ${activeCallout === 'trk-sprocket' ? 'highlighted' : ''}`}>
                    <div className="point-icon">🔺</div>
                    <div>
                      <strong>Elevated High-Drive Sprocket</strong>
                      <p>Keeps the hydraulic drive motor raised clear of slurry, sand, and standing water to prolong seal life.</p>
                    </div>
                  </div>

                  <div className={`clean-point ${activeCallout === 'trk-rubber' ? 'highlighted' : ''}`}>
                    <div className="point-icon">🚜</div>
                    <div>
                      <strong>Turf-Friendly 3.8 PSI Footprint</strong>
                      <p>Continuous steel-cord rubber tracks prevent lawn rutting and climb steep 30° slopes with traction.</p>
                    </div>
                  </div>

                  <div className={`clean-point ${activeCallout === 'trk-idler' ? 'highlighted' : ''}`}>
                    <div className="point-icon">🛡️</div>
                    <div>
                      <strong>Shock-Absorbing Track Guide</strong>
                      <p>Heavy-duty recoil tensioner absorbs rock strikes and maintains proper alignment on uneven ground.</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right / Visual: Image with Exact Arrows */}
              <div className="v900-core-visual">
                <PrecisionProductStage
                  imageSrc="/images/v900/v900-triangular-track-system.webp"
                  imageAlt="V900 compact loader with triangular track undercarriage"
                  imageTitle="V900 Triangular Track System"
                  sysId="TRACK-TRI"
                  callouts={trackCallouts}
                  activeCallout={activeCallout}
                  onHoverCallout={setActiveCallout}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
