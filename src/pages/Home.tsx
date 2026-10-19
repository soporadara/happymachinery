import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  V900_DISCOUNT_PERCENT,
  V900_ORIGINAL_PRICE,
  V900_PALLET_FORK_PRICE,
  V900_SALE_PRICE,
  formatV900Price,
} from '../data/v900Pricing'
import './Home.css'

export default function Home() {
  const [forkColor, setForkColor] = useState('red')
  const [activePerformance, setActivePerformance] = useState(0)
  const [activeSpecsCard, setActiveSpecsCard] = useState<string | null>(null)
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null)
  const [activeWhySpec, setActiveWhySpec] = useState(0)

  const whySpecs = [
    {
      stat: '1,400',
      unit: 'kg',
      title: 'Operating Weight',
      desc: 'Heavy-duty chassis delivering <b>1.4 Tons</b> of pushing power while maintaining track stability.',
      x: '18%',
      y: '50%',
      label: 'Chassis Frame (Red)'
    },
    {
      stat: '460',
      unit: 'kg',
      title: 'Rated Capacity',
      desc: 'Easily handles <b>1,014 lbs</b> of material, with a peak capacity of up to 500 kg.',
      x: '8%',
      y: '72%',
      label: 'Front Loader Bucket (Red)'
    },
    {
      stat: '25',
      unit: 'HP',
      title: 'Kubota D1105',
      desc: 'Premium Japanese <b>3-Cylinder engine</b> providing reliable high-torque performance.',
      x: '56%',
      y: '35%',
      label: 'Engine Block (Blue)'
    },
    {
      stat: '48',
      unit: 'L/min',
      title: 'Auxiliary Flow',
      desc: 'Delivers <b>12.7 GPM</b> of high-flow hydraulic pressure to power heavy attachments.',
      x: '89%',
      y: '55%',
      label: 'Hydraulic Valve (Yellow)'
    },
    {
      stat: '911',
      unit: 'mm',
      title: 'Compact Width',
      desc: 'Ultra-slim <b>35.9-inch profile</b> designed to easily navigate tight gates, alleys, and yards.',
      x: '75%',
      y: '80%',
      label: 'Vehicle Footprint (Yellow)'
    }
  ]



  const features = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
        </svg>
      ),
      kicker: 'High-Flow Performance',
      title: 'Faster Cycles. More Work Done.',
      text: 'Responsive hydraulics provide smooth attachment control and faster loading cycles, helping crews stay productive throughout the day.',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="m9 12 2 2 4-4"/>
        </svg>
      ),
      kicker: 'Stable Lifting Power',
      title: 'Lift More with Confidence.',
      text: 'A balanced tracked platform keeps heavy loads composed, giving operators greater control from pickup through placement.',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12h16"/>
          <path d="m7 9-3 3 3 3"/>
          <path d="m17 9 3 3-3 3"/>
          <path d="M12 4v16"/>
        </svg>
      ),
      kicker: 'Go-Anywhere Agility',
      title: 'Work Where Others Cannot.',
      text: 'The ultra-slim footprint moves through tight gates and confined job sites while tracked traction keeps movement steady.',
    },
  ]

  const performanceVideos = [
    {
      src: '/videos/v900-lift-performance.mp4',
      poster: '/images/fork-red-jobsite.png',
      number: '01',
      tag: 'Lift & Carry',
      title: 'Confident material handling',
      text: 'Responsive hydraulics and a stable tracked stance keep every lift controlled from pickup to placement.',
    },
    {
      src: '/videos/v900-jobsite-performance.mp4',
      poster: '/images/why-choose-v900-jobsite.png',
      number: '02',
      tag: 'Job-Site Agility',
      title: 'Built to work in tight spaces',
      text: 'A compact footprint gives operators the freedom to move through narrow access points without sacrificing capability.',
    },
    {
      src: '/videos/v900-ground-performance.mp4',
      poster: '/images/v900-equipment-layout.png',
      number: '03',
      tag: 'Tracked Control',
      title: 'Traction you can count on',
      text: 'Low ground-pressure tracks deliver composed movement and dependable grip across demanding work surfaces.',
    },
  ]

  const specsList = {
    red: [
      { name: 'Engine Type', value: 'Kubota D1105 (3-Cyl, 25 HP)' },
      { name: 'Rated Load', value: '1,014 lbs (460 kg)' },
      { name: 'Operating Weight', value: '3,086 lbs (1400 kg)' },
      { name: 'Working Pump Flow', value: '12.7 GPM (48 L/min)' },
      { name: 'Tracks Profile', value: 'Anti-Slip Rubber (180mm)' },
      { name: 'Vehicle Width', value: '35.9 inches (911 mm)' },
    ],
    yellow: [
      { name: 'Engine Type', value: 'Kubota D1105 (3-Cyl, 25 HP)' },
      { name: 'Rated Load', value: '1,014 lbs (460 kg)' },
      { name: 'Operating Weight', value: '3,086 lbs (1400 kg)' },
      { name: 'Working Pump Flow', value: '12.7 GPM (48 L/min)' },
      { name: 'Tracks Profile', value: 'Anti-Slip Rubber (180mm)' },
      { name: 'Vehicle Width', value: '35.9 inches (911 mm)' },
    ],
    blue: [
      { name: 'Engine Type', value: 'Kubota D1105 (3-Cyl, 25 HP)' },
      { name: 'Rated Load', value: '1,014 lbs (460 kg)' },
      { name: 'Operating Weight', value: '3,086 lbs (1400 kg)' },
      { name: 'Working Pump Flow', value: '12.7 GPM (48 L/min)' },
      { name: 'Tracks Profile', value: 'Anti-Slip Rubber (180mm)' },
      { name: 'Vehicle Width', value: '35.9 inches (911 mm)' },
    ]
  }


  const toggleSpecs = (cardType: string) => {
    if (activeSpecsCard === cardType) {
      setActiveSpecsCard(null)
    } else {
      setActiveSpecsCard(cardType)
    }
  }

  return (
    <div className="home-page">
      {/* Premium Hero Section */}
      <section className="hero">
        <video
          className="hero-background-media"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/images/hero-v900-three-colors.png"
          aria-hidden="true"
        >
          <source src="/images/home-hero-optimized.m4v" type="video/mp4" />
        </video>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <p className="eyebrow-accent">Professional Grade Equipment</p>
          <h1 aria-label="Skid Steer V900 by TYPHON">
            <span className="hero-title-part hero-title-red">Skid Steer</span>{' '}
            <span className="hero-title-part hero-title-yellow">V900</span>{' '}
            <span className="hero-title-part hero-title-blue">by TYPHON</span>
          </h1>
          <p className="hero-desc">
            Discover the skid steer V900 from Happy Machinery. This compact TYPHON Machinery loader is engineered for controlled performance, tight-access work, and quick transport, with bucket and TYPH-5005M pallet-fork packages available.
          </p>
          <div className="hero-buttons">
            <a href="#featured-fleet" className="btn btn-primary">
              Explore Featured Fleet
            </a>
            <Link to="/contact" className="btn btn-secondary">
              Get Specs & Pricing
            </Link>
          </div>
          <div className="hero-stats" aria-label="Machine highlights">
            <span><strong>Kubota EPA</strong> Diesel Option</span>
            <span><strong>Quick-Tach</strong> Plate Std</span>
            <span><strong>USA</strong> Direct Delivery</span>
          </div>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="features-overview">
        <div className="features-overview-head">
          <div>
            <p className="eyebrow">V900 Engineering</p>
            <h2>Compact machine. Serious capability.</h2>
          </div>
          <p>Three systems working together to deliver full-size productivity in a job-site-ready footprint.</p>
        </div>
        <div className="features-container">
          {features.map((feature, index) => (
            <article className="feature-card performance-feature-card" key={feature.title}>
              <div className="performance-feature-top">
                <div className="feature-icon">{feature.icon}</div>
                <span className="performance-feature-index">0{index + 1}</span>
              </div>
              <div className="feature-info">
                <span className="feature-kicker">{feature.kicker}</span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </div>
              <div className="performance-feature-line" aria-hidden="true"></div>
            </article>
          ))}
        </div>
      </section>

      {/* V900 promotional banner */}
      <section className="v900-promo-section" aria-labelledby="v900-promo-title">
        <div className="v900-promo-card">
          <div className="v900-promo-copy">
            <p className="v900-promo-kicker">Limited-time fleet offer</p>
            <h2 id="v900-promo-title">
              Save {V900_DISCOUNT_PERCENT}% on the
              <span>V900 Fleet</span>
            </h2>
            <div className="v900-promo-price" aria-label={`Sale price ${formatV900Price(V900_SALE_PRICE)}, originally ${formatV900Price(V900_ORIGINAL_PRICE)}`}>
              <small>Now</small>
              <strong>{formatV900Price(V900_SALE_PRICE)}</strong>
              <span className="v900-promo-original">{formatV900Price(V900_ORIGINAL_PRICE)}</span>
            </div>
            <a href="#featured-fleet" className="v900-promo-button">
              Shop V900 packages <span aria-hidden="true">→</span>
            </a>
          </div>

          <div className="v900-promo-visual">
            <span className="v900-promo-color-label">Three signature colors</span>
            <span className="v900-promo-sale-seal">
              Save
              <strong>{V900_DISCOUNT_PERCENT}%</strong>
            </span>
            <img
              src="/images/v900-promo.webp"
              alt="Red, yellow, and blue TYPHON STOMP V900 mini skid steer machines"
              title="TYPHON STOMP V900 mini skid steer lineup"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* V900 Product Cards Section */}
      <section id="featured-fleet" className="v900-products-section">
        <div className="section-header">
          <p className="eyebrow">Featured Fleet</p>
          <h2>Skid Steer V900</h2>
          <p className="section-desc">
            The power and flexibility your job site demands. Available in 3 signature colors with a standard utility bucket. The <strong>TYPH-5005M Pallet Fork is optional and sold separately</strong>.
          </p>
        </div>

        <div className="v900-grid">
          {/* Card 1: Red */}
          <article className={`v900-card red-theme${activeSpecsCard === 'red' ? ' specs-expanded' : ''}`}>
            <Link to="/product/typhon-stomp-v900-mini-track-loader-kubota-d1105-red" className="v900-img-container">
              <img className="v900-product-image" src="/images/loader-red.png" alt="Crimson Red TYPHON STOMP V900 mini skid steer loader with utility bucket" title="Crimson Red TYPHON STOMP V900" />
              <img className="v900-attachment-image" src="/images/fork-red.jpg" alt="Crimson Red TYPHON STOMP V900 fitted with the optional TYPH-5005M pallet fork" title="Crimson Red TYPHON STOMP V900 with pallet fork" />
              <span className="color-badge red-badge">Crimson Red</span>
            </Link>
            <div className="v900-content">
              <h3>Skid Steer V900 (Red Edition)</h3>
              <p className="attachment-spotlight">
                <strong>Optional Attachment:</strong> TYPH-5005M Pallet Fork — {formatV900Price(V900_PALLET_FORK_PRICE)}
              </p>
              <p className="v900-text">
                Bold, high-visibility Crimson Red finish. Built for heavy-duty earthmoving, residential grading, and excavation tasks.
              </p>
              
              {/* Expandable Technical Specs Button */}
              <button className="btn-toggle-specs" onClick={() => toggleSpecs('red')}>
                {activeSpecsCard === 'red' ? 'Hide Specifications ▲' : 'Show Technical Specs ▼'}
              </button>

              <div className="specs-slide-panel">
                <table className="specs-table">
                  <tbody>
                    {specsList.red.map((spec) => (
                      <tr key={spec.name}>
                        <td className="spec-name">{spec.name}</td>
                        <td className="spec-val">{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="v900-footer">
                <span className="price-tag">Inquire for Spec Sheets</span>
                <Link to="/product/typhon-stomp-v900-mini-track-loader-kubota-d1105-red" className="btn-inquire">View Package &rarr;</Link>
              </div>
            </div>
          </article>

          {/* Card 2: Yellow */}
          <article className={`v900-card yellow-theme${activeSpecsCard === 'yellow' ? ' specs-expanded' : ''}`}>
            <Link to="/product/typhon-stomp-v900-mini-track-loader-kubota-d1105" className="v900-img-container">
              <img className="v900-product-image" src="/images/loader-yellow.png" alt="Industrial Yellow TYPHON STOMP V900 mini skid steer loader with utility bucket" title="Industrial Yellow TYPHON STOMP V900" />
              <img className="v900-attachment-image" src="/images/fork-yellow.jpg" alt="Industrial Yellow TYPHON STOMP V900 fitted with the optional TYPH-5005M pallet fork" title="Industrial Yellow TYPHON STOMP V900 with pallet fork" />
              <span className="color-badge yellow-badge">Industrial Yellow</span>
            </Link>
            <div className="v900-content">
              <h3>Skid Steer V900 (Yellow Edition)</h3>
              <p className="attachment-spotlight">
                <strong>Optional Attachment:</strong> TYPH-5005M Pallet Fork — {formatV900Price(V900_PALLET_FORK_PRICE)}
              </p>
              <p className="v900-text">
                Classic high-visibility construction Yellow. Features low ground-pressure rubber tracks and responsive pilot controls.
              </p>
              
              {/* Expandable Technical Specs Button */}
              <button className="btn-toggle-specs" onClick={() => toggleSpecs('yellow')}>
                {activeSpecsCard === 'yellow' ? 'Hide Specifications ▲' : 'Show Technical Specs ▼'}
              </button>

              <div className="specs-slide-panel">
                <table className="specs-table">
                  <tbody>
                    {specsList.yellow.map((spec) => (
                      <tr key={spec.name}>
                        <td className="spec-name">{spec.name}</td>
                        <td className="spec-val">{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="v900-footer">
                <span className="price-tag">Inquire for Spec Sheets</span>
                <Link to="/product/typhon-stomp-v900-mini-track-loader-kubota-d1105" className="btn-inquire">View Package &rarr;</Link>
              </div>
            </div>
          </article>

          {/* Card 3: Blue */}
          <article className={`v900-card blue-theme${activeSpecsCard === 'blue' ? ' specs-expanded' : ''}`}>
            <Link to="/product/typhon-stomp-v900-mini-track-loader-kubota-d1105-blue" className="v900-img-container">
              <img className="v900-product-image" src="/images/loader-blue.png" alt="Cobalt Blue TYPHON STOMP V900 mini skid steer loader with utility bucket" title="Cobalt Blue TYPHON STOMP V900" />
              <img className="v900-attachment-image" src="/images/fork-blue.jpg" alt="Cobalt Blue TYPHON STOMP V900 fitted with the optional TYPH-5005M pallet fork" title="Cobalt Blue TYPHON STOMP V900 with pallet fork" />
              <span className="color-badge blue-badge">Cobalt Blue</span>
            </Link>
            <div className="v900-content">
              <h3>Skid Steer V900 (Blue Edition)</h3>
              <p className="attachment-spotlight">
                <strong>Optional Attachment:</strong> TYPH-5005M Pallet Fork — {formatV900Price(V900_PALLET_FORK_PRICE)}
              </p>
              <p className="v900-text">
                Sleek Cobalt Blue bodywork. Engineered for maximum torque, grading efficiency, and rapid attachment swaps.
              </p>
              
              {/* Expandable Technical Specs Button */}
              <button className="btn-toggle-specs" onClick={() => toggleSpecs('blue')}>
                {activeSpecsCard === 'blue' ? 'Hide Specifications ▲' : 'Show Technical Specs ▼'}
              </button>

              <div className="specs-slide-panel">
                <table className="specs-table">
                  <tbody>
                    {specsList.blue.map((spec) => (
                      <tr key={spec.name}>
                        <td className="spec-name">{spec.name}</td>
                        <td className="spec-val">{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="v900-footer">
                <span className="price-tag">Inquire for Spec Sheets</span>
                <Link to="/product/typhon-stomp-v900-mini-track-loader-kubota-d1105-blue" className="btn-inquire">View Package &rarr;</Link>
              </div>
            </div>
          </article>
        </div>

      </section>

      {/* Interactive Pallet Fork Attachment Spotlight Section with Hotspots */}
      <section className="fork-showcase-section">
        <div className="fork-showcase-container">
          <div className="fork-image-panel">
            <div className="fork-image-viewer">
              {forkColor === 'red' && (
                <img src="/images/fork-red-jobsite.png" alt="Crimson Red TYPHON STOMP V900 carrying a pallet with the TYPH-5005M pallet fork" title="TYPHON STOMP V900 Crimson Red pallet fork demonstration" />
              )}
              {forkColor === 'yellow' && (
                <img src="/images/fork-yellow-jobsite.png" alt="Industrial Yellow TYPHON STOMP V900 carrying a pallet with the TYPH-5005M pallet fork" title="TYPHON STOMP V900 Industrial Yellow pallet fork demonstration" />
              )}
              {forkColor === 'blue' && (
                <img src="/images/fork-blue-jobsite.png" alt="Cobalt Blue TYPHON STOMP V900 carrying a pallet with the TYPH-5005M pallet fork" title="TYPHON STOMP V900 Cobalt Blue pallet fork demonstration" />
              )}

              {/* Dynamic Overlay Hotspots */}
              <div 
                className={`fork-hotspot hotspot-tines${hoveredHotspot === 'tines' ? ' active' : ''}`}
                onMouseEnter={() => setHoveredHotspot('tines')}
                onMouseLeave={() => setHoveredHotspot(null)}
                style={{ top: '82%', left: '15%' }}
              >
                <span className="hotspot-pin"></span>
                <div className="hotspot-tooltip">Forged Steel Tines (1500 lbs limit)</div>
              </div>

              <div 
                className={`fork-hotspot hotspot-rails${hoveredHotspot === 'rails' ? ' active' : ''}`}
                onMouseEnter={() => setHoveredHotspot('rails')}
                onMouseLeave={() => setHoveredHotspot(null)}
                style={{ top: '65%', left: '35%' }}
              >
                <span className="hotspot-pin"></span>
                <div className="hotspot-tooltip">Adjustable Slider Rails (8" to 36")</div>
              </div>

              <div 
                className={`fork-hotspot hotspot-quick-tach${hoveredHotspot === 'quick-tach' ? ' active' : ''}`}
                onMouseEnter={() => setHoveredHotspot('quick-tach')}
                onMouseLeave={() => setHoveredHotspot(null)}
                style={{ top: '55%', left: '37%' }}
              >
                <span className="hotspot-pin"></span>
                <div className="hotspot-tooltip">Universal Quick-Attach Hookup</div>
              </div>

              <div 
                className={`fork-hotspot hotspot-guard${hoveredHotspot === 'guard' ? ' active' : ''}`}
                onMouseEnter={() => setHoveredHotspot('guard')}
                onMouseLeave={() => setHoveredHotspot(null)}
                style={{ top: '41%', left: '31%' }}
              >
                <span className="hotspot-pin"></span>
                <div className="hotspot-tooltip">High-Strength Steel spill guard</div>
              </div>
            </div>

            {/* Premium Circle Swatches */}
            <div className="fork-color-selector">
              <span className="selector-label">Interactive Color Configurator:</span>
              <div className="selector-swatches">
                <button
                  className={`swatch red-swatch${forkColor === 'red' ? ' active' : ''}`}
                  onClick={() => setForkColor('red')}
                  aria-label="Crimson Red V900"
                />
                <button
                  className={`swatch yellow-swatch${forkColor === 'yellow' ? ' active' : ''}`}
                  onClick={() => setForkColor('yellow')}
                  aria-label="Industrial Yellow V900"
                />
                <button
                  className={`swatch blue-swatch${forkColor === 'blue' ? ' active' : ''}`}
                  onClick={() => setForkColor('blue')}
                  aria-label="Cobalt Blue V900"
                />
              </div>
            </div>
          </div>

          <div className="fork-details-panel">
            <p className="eyebrow">Optional Attachment</p>
            <h2>TYPH-5005M Pallet Fork</h2>
            <p className="fork-option-price">{formatV900Price(V900_PALLET_FORK_PRICE)}</p>
            <p className="fork-intro">
              Turn the compact V900 into a confident material handler. The quick-attach pallet fork package delivers controlled lifting, stable transport, and faster changeovers on busy job sites. Hover over the loader hotspots to inspect the system.
            </p>

            <dl className="fork-machine-specs" aria-label="V900 performance highlights">
              <div>
                <dt>Hydraulic Response</dt>
                <dd>12.7 GPM Flow</dd>
              </div>
              <div>
                <dt>Rated Capacity</dt>
                <dd>1,014 lbs</dd>
              </div>
              <div>
                <dt>Attachment Swap</dt>
                <dd>Under 2 Minutes</dd>
              </div>
            </dl>

            <ul className="fork-specs-list">
              <li 
                className={hoveredHotspot === 'tines' ? 'active-item' : ''}
                onMouseEnter={() => setHoveredHotspot('tines')}
                onMouseLeave={() => setHoveredHotspot(null)}
              >
                <span className="spec-icon">💪</span>
                <div>
                  <h3>Forged Steel Strength</h3>
                  <p>Heavy-duty structural steel tines optimized to support loads up to 1,500 lbs without bending.</p>
                </div>
              </li>
              <li 
                className={hoveredHotspot === 'rails' ? 'active-item' : ''}
                onMouseEnter={() => setHoveredHotspot('rails')}
                onMouseLeave={() => setHoveredHotspot(null)}
              >
                <span className="spec-icon">↕️</span>
                <div>
                  <h3>Slide-Adjustable Spacing</h3>
                  <p>Forks slide smoothly on locking rails from 8" to 36" wide, adjusting instantly for standard pallets, logs, and pipes.</p>
                </div>
              </li>
              <li 
                className={hoveredHotspot === 'quick-tach' ? 'active-item' : ''}
                onMouseEnter={() => setHoveredHotspot('quick-tach')}
                onMouseLeave={() => setHoveredHotspot(null)}
              >
                <span className="spec-icon">⚡</span>
                <div>
                  <h3>Quick-Tach Mounting</h3>
                  <p>Universal quick-attach system allows quick changeovers from bucket to forks in under 2 minutes.</p>
                </div>
              </li>
              <li 
                className={hoveredHotspot === 'guard' ? 'active-item' : ''}
                onMouseEnter={() => setHoveredHotspot('guard')}
                onMouseLeave={() => setHoveredHotspot(null)}
              >
                <span className="spec-icon">🛡️</span>
                <div>
                  <h3>Integrated Spill Guard</h3>
                  <p>High-strength safety backrest prevents sliding materials from slipping backwards, ensuring safe operations.</p>
                </div>
              </li>
            </ul>

            <div className="fork-action">
              <Link to="/contact" className="btn btn-primary">
                Inquire About Package Deals
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="why">
        <div className="section-wrap">
          <div className="why-body">
            <div className="why-visual-column">
              <div className="why-head">
                <div className="eyebrow">The V900 Advantage</div>
                <h2>Why choose the TYPHON V900?</h2>
                <p>Five reasons crews are replacing full-sized skid steers with a machine that fits through a backyard gate and still moves like one twice its size. Hover or tap a spec to see where it lives on the machine.</p>
              </div>

              <div className="why-media">
                <div 
                  className="why-media-frame is-active" 
                  style={{
                    '--spot-x': whySpecs[activeWhySpec].x,
                    '--spot-y': whySpecs[activeWhySpec].y
                  } as React.CSSProperties}
                >
                  <img src="/images/why-choose-v900-jobsite.png" alt="Red, yellow, and blue TYPHON STOMP V900 mini skid steer loaders working on a jobsite" title="TYPHON STOMP V900 mini skid steer machines at work" />
                  <div className="spotlight"></div>
                  <div className="marker">
                    <div className="ring"></div>
                    <div className="dot"></div>
                  </div>
                </div>
                <div className="why-media-cap">
                  <span>SYSTEM: <b>V900</b></span>
                  <span className="live-label">TARGET: <b>{whySpecs[activeWhySpec].label}</b></span>
                </div>
              </div>
            </div>

            <div className="spec-list">
              {whySpecs.map((spec, idx) => (
                <button
                  key={idx}
                  className={`spec-item is-visible ${activeWhySpec === idx ? 'is-active' : ''}`}
                  onClick={() => setActiveWhySpec(idx)}
                  onMouseEnter={() => setActiveWhySpec(idx)}
                >
                  <div className="spec-rail"></div>
                  <div className="spec-stat">
                    {spec.stat}
                    <span className="unit">{spec.unit}</span>
                  </div>
                  <div className="spec-copy">
                    <span className="spec-index">0{idx + 1}</span>
                    <h3>{spec.title}</h3>
                    <p dangerouslySetInnerHTML={{ __html: spec.desc }}></p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Real-world performance video showcase */}
      <section id="performance" className="performance-section" aria-labelledby="performance-title">
        <div className="performance-shell">
          <div className="performance-copy">
            <p className="eyebrow">Performance in Action</p>
            <h2 id="performance-title">See what the V900 can do.</h2>
            <p className="performance-lead">
              Real machine. Real terrain. Watch the V900 turn compact dimensions, hydraulic power, and tracked stability into productive work.
            </p>

            <div className="performance-selector" role="tablist" aria-label="Select a performance video">
              {performanceVideos.map((video, index) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activePerformance === index}
                  className={`performance-option${activePerformance === index ? ' is-active' : ''}`}
                  onClick={() => setActivePerformance(index)}
                  key={video.title}
                >
                  <span className="performance-option-number">{video.number}</span>
                  <span className="performance-option-copy">
                    <small>{video.tag}</small>
                    <strong>{video.title}</strong>
                  </span>
                  <span className="performance-option-arrow" aria-hidden="true">↗</span>
                </button>
              ))}
            </div>

            <Link to="/contact" className="performance-cta">
              Request full specifications <span aria-hidden="true">→</span>
            </Link>
          </div>

          <div className="performance-stage">
            <div className="performance-video-frame">
              <video
                key={performanceVideos[activePerformance].src}
                src={performanceVideos[activePerformance].src}
                poster={performanceVideos[activePerformance].poster}
                autoPlay
                muted
                loop
                playsInline
                controls
                preload="metadata"
                aria-label={`${performanceVideos[activePerformance].tag}: ${performanceVideos[activePerformance].title}`}
                title={`TYPHON STOMP V900 ${performanceVideos[activePerformance].tag} performance video`}
              >
                Your browser does not support the TYPHON STOMP V900 performance video.
              </video>
              <div className="performance-video-label">
                <span className="performance-live-dot"></span>
                Field footage
              </div>
            </div>
            <div className="performance-caption">
              <span>{performanceVideos[activePerformance].number} / 03</span>
              <p>{performanceVideos[activePerformance].text}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="home-faq" aria-labelledby="faq-title">
        <div className="faq-shell">
          <div className="faq-intro">
            <p className="eyebrow">Questions, Answered</p>
            <h2 id="faq-title">Everything you need to know before choosing a V900.</h2>
            <p>Clear answers about capability, attachments, ordering, and delivery. For live pricing or inventory, our team can prepare a current quote.</p>
            <Link to="/contact" className="faq-contact-link">Still have a question? <span>Talk to our team →</span></Link>
          </div>

          <div className="faq-list">
            <details open>
              <summary><span>01</span>How much can the V900 lift?<i aria-hidden="true"></i></summary>
              <p>The V900 has a rated operating capacity of 1,014 lbs (460 kg). Actual safe handling depends on the attachment, load position, terrain, and operating conditions.</p>
            </details>
            <details>
              <summary><span>02</span>Will it fit through a standard backyard gate?<i aria-hidden="true"></i></summary>
              <p>The machine is 35.9 inches (911 mm) wide, allowing it to pass through many 36-inch openings. Always measure the complete access route and allow suitable clearance before delivery.</p>
            </details>
            <details>
              <summary><span>03</span>Which attachment should I choose?<i aria-hidden="true"></i></summary>
              <p>Choose the standard bucket for digging, grading, and loose material. Choose the TYPH-5005M pallet fork for pallets, blocks, logs, and job-site supplies.</p>
            </details>
            <details>
              <summary><span>04</span>Can I purchase the machine directly?<i aria-hidden="true"></i></summary>
              <p>Yes. Visit the Store to select a package, or request a quote with your preferred color, attachment, and delivery ZIP code for an accurate total.</p>
            </details>
            <details>
              <summary><span>05</span>Is nationwide delivery available?<i aria-hidden="true"></i></summary>
              <p>Nationwide US shipping is available. The machine is prepared and secured for transport, and the team coordinates delivery details before dispatch.</p>
            </details>
            <details>
              <summary><span>06</span>What warranty is included?<i aria-hidden="true"></i></summary>
              <p>The website lists a 1-year commercial warranty. Request the complete written warranty terms, exclusions, and claim process from the sales team before purchasing.</p>
            </details>
          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section className="features-section">
        <div className="section-wrap">
          <div className="features-head">
            <div>
              <div className="eyebrow">Key Advantages</div>
              <h2>Built For The Field.</h2>
            </div>
            <p>
              Every engineering decision on the TYPHON V900 focuses on productivity, component lifespan, and ease of service.
            </p>
          </div>
          
          <div className="feature-grid">
            <article className="feature-card">
              <svg className="feature-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3>Kubota Power</h3>
              <p>Equipped with a Japanese 25 HP Kubota D1105 diesel engine, renowned worldwide for longevity and fuel economy.</p>
            </article>

            <article className="feature-card">
              <svg className="feature-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4m0 6H4m0 0l4 4" />
              </svg>
              <h3>Universal Quick-Attach</h3>
              <p>Standard SAE J2513 plate fits standard mini skid steer attachments including sweeps, augers, and trenches.</p>
            </article>

            <article className="feature-card">
              <svg className="feature-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <h3>Pilot Controls</h3>
              <p>Highly responsive dual-joystick pilot controls provide comfortable, zero-fatigue steering and loader hydraulics operation.</p>
            </article>

            <article className="feature-card">
              <svg className="feature-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <h3>High-Flow Hydraulics</h3>
              <p>Delivers 12.7 GPM pump flow at 2,321 psi operating pressure to fuel heavy-duty attachment systems.</p>
            </article>
          </div>
        </div>
      </section>

      {/* Nationwide delivery section */}
      <section className="delivery-section" aria-labelledby="delivery-title">
        <div className="delivery-shell">
          <div className="delivery-media">
            <img
              src="/images/v900-delivery.png"
              alt="Red, blue, and yellow TYPHON STOMP V900 mini skid steer loaders secured on a delivery truck"
              title="TYPHON STOMP V900 nationwide machine delivery"
            />
            <div className="delivery-media-badge">
              <span className="delivery-badge-icon" aria-hidden="true">✓</span>
              <span><strong>Load secured</strong>Ready for dispatch</span>
            </div>
          </div>

          <div className="delivery-content">
            <p className="eyebrow">From Our Yard to Yours</p>
            <h2 id="delivery-title">Delivery, handled.</h2>
            <p className="delivery-intro">
              Your V900 is prepared, secured, and coordinated for dependable delivery. Our team keeps the process clear from order confirmation through arrival.
            </p>

            <ol className="delivery-steps">
              <li>
                <span>01</span>
                <div><strong>Machine preparation</strong><p>Your loader is checked and prepared with its selected package before dispatch.</p></div>
              </li>
              <li>
                <span>02</span>
                <div><strong>Secure transport</strong><p>Equipment is carefully positioned and tied down for safe, stable transportation.</p></div>
              </li>
              <li>
                <span>03</span>
                <div><strong>Coordinated arrival</strong><p>We confirm delivery details and help you plan for a smooth equipment handoff.</p></div>
              </li>
            </ol>

            <div className="delivery-actions">
              <Link to="/contact" className="btn btn-primary">Get a Delivery Quote</Link>
              <span>Nationwide US shipping available</span>
            </div>
          </div>
        </div>
      </section>

      {/* YouTube video gallery */}
      <section className="youtube-showcase" aria-labelledby="youtube-showcase-title">
        <div className="youtube-showcase-shell">
          <div className="youtube-showcase-head">
            <div>
              <p className="eyebrow">Watch the V900 Work</p>
              <h2 id="youtube-showcase-title">See the skid steer in action.</h2>
            </div>
            <p>Explore real V900 walkarounds, operating highlights, and equipment details from the field.</p>
          </div>

          <div className="youtube-video-grid">
            <article className="youtube-video-card">
              <div className="youtube-video-frame">
                <iframe
                  src="https://www.youtube-nocookie.com/embed/ohPfpKb1KBY"
                  title="Meet the all-new TYPHON STOMP V900 skid steer loader"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
              <div className="youtube-video-copy">
                <span>Fleet Introduction</span>
                <h3>Meet the TYPHON STOMP V900</h3>
              </div>
            </article>

            <article className="youtube-video-card">
              <div className="youtube-video-frame">
                <iframe
                  src="https://www.youtube-nocookie.com/embed/NRtbw6hlbIs"
                  title="TYPHON STOMP V900 mini track loader with 25 HP Kubota diesel"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
              <div className="youtube-video-copy">
                <span>Machine Walkaround</span>
                <h3>25 HP Kubota-Powered Skid Steer</h3>
              </div>
            </article>

            <article className="youtube-video-card">
              <div className="youtube-video-frame">
                <iframe
                  src="https://www.youtube-nocookie.com/embed/TESbJHPzlOQ"
                  title="Introducing the all-new STOMP V900 skid steer"
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
              <div className="youtube-video-copy">
                <span>Product Highlight</span>
                <h3>Introducing the All-New STOMP V900</h3>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Customer Feedback */}
      <section className="customer-feedback" aria-labelledby="feedback-title">
        <div className="feedback-shell">
          <div className="feedback-head">
            <div>
              <p className="eyebrow">Customer Feedback</p>
              <h2 id="feedback-title">Built for real work. Valued by real crews.</h2>
            </div>
            <p>From tight-access landscaping to daily material handling, customers value practical capability, straightforward controls, and dependable support.</p>
          </div>

          <div className="feedback-grid">
            <article className="feedback-card featured-feedback">
              <div className="feedback-card-top">
                <span className="feedback-quote" aria-hidden="true">“</span>
                <span className="feedback-stars" aria-label="Five out of five stars">★★★★★</span>
              </div>
              <blockquote>The compact width is the reason we chose it. We can move through backyard gates, finish grading work, and load material without bringing a full-size machine onto the property.</blockquote>
              <footer>
                <span className="feedback-avatar">LC</span>
                <span><strong>Landscaping Crew</strong><small>Residential projects</small></span>
              </footer>
            </article>

            <article className="feedback-card">
              <div className="feedback-card-top">
                <span className="feedback-quote" aria-hidden="true">“</span>
                <span className="feedback-stars" aria-label="Five out of five stars">★★★★★</span>
              </div>
              <blockquote>The controls are responsive and the tracked stance feels composed when carrying supplies. Switching from the bucket to pallet forks keeps the day moving.</blockquote>
              <footer>
                <span className="feedback-avatar">PM</span>
                <span><strong>Property Maintenance</strong><small>Material handling</small></span>
              </footer>
            </article>

            <article className="feedback-card">
              <div className="feedback-card-top">
                <span className="feedback-quote" aria-hidden="true">“</span>
                <span className="feedback-stars" aria-label="Five out of five stars">★★★★★</span>
              </div>
              <blockquote>The delivery process was clear from scheduling through arrival. The machine was secured properly, and our team knew what to prepare before it reached the site.</blockquote>
              <footer>
                <span className="feedback-avatar">FO</span>
                <span><strong>Fleet Operator</strong><small>Equipment delivery</small></span>
              </footer>
            </article>
          </div>

          <div className="feedback-bottom">
            <span><strong>Have experience with the V900?</strong> We would like to hear about your project.</span>
            <Link to="/contact">Share your feedback →</Link>
          </div>
        </div>
      </section>

      {/* CTA Strip Section */}
      <section className="cta-strip">
        <div className="section-wrap">
          <div className="cta-strip-inner">
            <div>
              <h2>Ready to upgrade your fleet? <span>TYPHON V900</span> is ready.</h2>
              <p className="cta-strip-sub">In stock now &middot; 1-Year Commercial Warranty &middot; US Shipping</p>
            </div>
            <div className="cta-row">
              <Link to="/store" className="btn btn-primary">Order Package</Link>
              <Link to="/contact" className="btn btn-ghost">Inquire Now</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
