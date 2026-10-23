import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  V900_PALLET_FORK_PRICE,
  formatV900Price,
} from '../data/v900Pricing'
import { DEFAULT_HOME_CONTENT, HomePageContent } from '../data/homeContent'
import { readSharedContent } from '../data/sharedContentStorage'
import V900Showcase from '../components/V900Showcase'
import './Home.css'

const extractYouTubeId = (url: string): string => {
  if (!url) return ''
  const regExp = /(?:youtube(?:-nocookie)?\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
  const match = url.match(regExp)
  return match ? match[1] : url.replace(/[^a-zA-Z0-9_-]/g, '')
}

export default function Home() {
  const [content, setContent] = useState<HomePageContent>(DEFAULT_HOME_CONTENT)
  const [forkColor, setForkColor] = useState('red')
  const [activePerformance, setActivePerformance] = useState(0)
  const [openSpecsCards, setOpenSpecsCards] = useState<Record<string, boolean>>({
    red: false,
    yellow: false,
    blue: false
  })
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null)
  const [activeWhySpec, setActiveWhySpec] = useState(0)
  const [activeVideoModal, setActiveVideoModal] = useState<{
    videoId: string
    title: string
    tag: string
  } | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveVideoModal(null)
    }
    if (activeVideoModal) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [activeVideoModal])

  useEffect(() => {
    let mounted = true
    const loadSharedHomeContent = async () => {
      try {
        const saved = await readSharedContent<HomePageContent>('home-content')
        if (saved && mounted) {
          setContent((prev) => ({
            ...prev,
            ...saved,
            hero: { ...prev.hero, ...(saved.hero || {}) },
            featuresOverview: { ...prev.featuresOverview, ...(saved.featuresOverview || {}) },
            promo: { ...prev.promo, ...(saved.promo || {}) },
            featuredFleet: { ...prev.featuredFleet, ...(saved.featuredFleet || {}) },
            forkShowcase: { ...prev.forkShowcase, ...(saved.forkShowcase || {}) },
            why: { ...prev.why, ...(saved.why || {}) },
            performance: { ...prev.performance, ...(saved.performance || {}) },
            faq: { ...prev.faq, ...(saved.faq || {}) },
            advantages: { ...prev.advantages, ...(saved.advantages || {}) },
            delivery: { ...prev.delivery, ...(saved.delivery || {}) },
            youtube: { ...prev.youtube, ...(saved.youtube || {}) },
            feedback: { ...prev.feedback, ...(saved.feedback || {}) },
            ctaStrip: { ...prev.ctaStrip, ...(saved.ctaStrip || {}) },
          }))
        }
      } catch (err) {
        console.error('Failed to load shared home content:', err)
      }
    }
    void loadSharedHomeContent()
    return () => {
      mounted = false
    }
  }, [])

  const defaultWhySpecs = [
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

  const featureIcons = [
    (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/>
      </svg>
    ),
    (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="m9 12 2 2 4-4"/>
      </svg>
    ),
    (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12h16"/>
        <path d="m7 9-3 3 3 3"/>
        <path d="m17 9 3 3-3 3"/>
        <path d="M12 4v16"/>
      </svg>
    )
  ]

  const defaultPerformanceVideos = [
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
    setOpenSpecsCards((prev) => ({
      ...prev,
      [cardType]: !prev[cardType]
    }))
  }

  const currentWhySpecs = (content.why.specs && content.why.specs.length > 0) ? content.why.specs : defaultWhySpecs
  const currentPerformanceVideos = (content.performance.videos && content.performance.videos.length > 0) ? content.performance.videos : defaultPerformanceVideos
  const currentFaqs = (content.faq.faqs && content.faq.faqs.length > 0) ? content.faq.faqs : []

  return (
    <div className="home-page">
      {/* 1. Premium Hero Section */}
      {content.hero.visible !== false && (
        <section className="hero">
          <video
            key={content.hero.videoUrl}
            className="hero-background-media"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={content.hero.posterUrl}
            aria-hidden="true"
          >
            <source src={content.hero.videoUrl} type="video/mp4" />
          </video>
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <p className="eyebrow-accent">{content.hero.eyebrow}</p>
            <h1 aria-label={`${content.hero.titleRed} ${content.hero.titleYellow} ${content.hero.titleBlue}`}>
              <span className="hero-title-part hero-title-red">{content.hero.titleRed}</span>{' '}
              <span className="hero-title-part hero-title-yellow">{content.hero.titleYellow}</span>{' '}
              <span className="hero-title-part hero-title-blue">{content.hero.titleBlue}</span>
            </h1>
            <p className="hero-desc">{content.hero.description}</p>
            <div className="hero-buttons">
              <a href={content.hero.primaryBtnUrl} className="btn btn-primary">
                {content.hero.primaryBtnText}
              </a>
              <Link to={content.hero.secondaryBtnUrl} className="btn btn-secondary">
                {content.hero.secondaryBtnText}
              </Link>
            </div>
            <div className="hero-stats" aria-label="Machine highlights">
              {content.hero.highlights.map((h, i) => (
                <span key={i}><strong>{h.tag}</strong> {h.label}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 2. Main Features Grid */}
      {content.featuresOverview.visible !== false && (
        <section className="features-overview">
          <div className="features-overview-head">
            <div>
              <p className="eyebrow">{content.featuresOverview.eyebrow}</p>
              <h2>{content.featuresOverview.title}</h2>
            </div>
            <p>{content.featuresOverview.subtitle}</p>
          </div>
          <div className="features-container">
            {content.featuresOverview.features.map((feature, index) => (
              <article className="feature-card performance-feature-card" key={index}>
                <div className="performance-feature-top">
                  <div className="feature-icon">{featureIcons[index] || featureIcons[0]}</div>
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
      )}

      {/* 3. V900 promotional banner */}
      {content.promo.visible !== false && (
        <section className="v900-promo-section" aria-labelledby="v900-promo-title">
          <div className="v900-promo-card">
            <div className="v900-promo-copy">
              <p className="v900-promo-kicker">{content.promo.kicker}</p>
              <h2 id="v900-promo-title">
                {content.promo.title}{' '}
                <span>{content.promo.titleHighlight}</span>
              </h2>
              <div className="v900-promo-price">
                <small>Now</small>
                <strong>{content.promo.nowPriceText}</strong>
                <span className="v900-promo-original">{content.promo.originalPriceText}</span>
              </div>
              <a href={content.promo.buttonUrl} className="v900-promo-button">
                {content.promo.buttonText} <span aria-hidden="true">→</span>
              </a>
            </div>

            <div className="v900-promo-visual">
              <span className="v900-promo-color-label">{content.promo.colorLabel}</span>
              <span className="v900-promo-sale-seal">
                {content.promo.discountBadgeText}
              </span>
              <img
                src={content.promo.imageUrl}
                alt="Promotion"
                title="TYPHON STOMP V900"
                loading="lazy"
              />
            </div>
          </div>
        </section>
      )}

      {/* 4. V900 Product Cards Section */}
      {content.featuredFleet.visible !== false && (
        <section id="featured-fleet" className="v900-products-section">
          <div className="section-header">
            <p className="eyebrow">{content.featuredFleet.eyebrow}</p>
            <h2>{content.featuredFleet.title}</h2>
            <p className="section-desc">
              {content.featuredFleet.description}
            </p>
          </div>

          <div className="v900-grid">
            {/* Card 1: Red */}
            <article className={`v900-card red-theme${openSpecsCards.red ? ' specs-expanded' : ''}`}>
              <Link to="/product/typhon-stomp-v900-mini-track-loader-kubota-d1105-red" className="v900-img-container">
                <img className="v900-product-image" src="/images/loader-red.png" alt="Crimson Red TYPHON STOMP V900" title="Crimson Red TYPHON STOMP V900" />
                <img className="v900-attachment-image" src="/images/fork-red.jpg" alt="Crimson Red TYPHON STOMP V900 with fork" title="Crimson Red TYPHON STOMP V900 with pallet fork" />
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
                
                <button className="btn-toggle-specs" onClick={() => toggleSpecs('red')}>
                  {openSpecsCards.red ? 'Hide Specifications ▲' : 'Show Technical Specs ▼'}
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
            <article className={`v900-card yellow-theme${openSpecsCards.yellow ? ' specs-expanded' : ''}`}>
              <Link to="/product/typhon-stomp-v900-mini-track-loader-kubota-d1105" className="v900-img-container">
                <img className="v900-product-image" src="/images/loader-yellow.png" alt="Industrial Yellow TYPHON STOMP V900" title="Industrial Yellow TYPHON STOMP V900" />
                <img className="v900-attachment-image" src="/images/fork-yellow.jpg" alt="Industrial Yellow TYPHON STOMP V900 with fork" title="Industrial Yellow TYPHON STOMP V900 with pallet fork" />
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
                
                <button className="btn-toggle-specs" onClick={() => toggleSpecs('yellow')}>
                  {openSpecsCards.yellow ? 'Hide Specifications ▲' : 'Show Technical Specs ▼'}
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
            <article className={`v900-card blue-theme${openSpecsCards.blue ? ' specs-expanded' : ''}`}>
              <Link to="/product/typhon-stomp-v900-mini-track-loader-kubota-d1105-blue" className="v900-img-container">
                <img className="v900-product-image" src="/images/loader-blue.png" alt="Cobalt Blue TYPHON STOMP V900" title="Cobalt Blue TYPHON STOMP V900" />
                <img className="v900-attachment-image" src="/images/fork-blue.jpg" alt="Cobalt Blue TYPHON STOMP V900 with fork" title="Cobalt Blue TYPHON STOMP V900 with pallet fork" />
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
                
                <button className="btn-toggle-specs" onClick={() => toggleSpecs('blue')}>
                  {openSpecsCards.blue ? 'Hide Specifications ▲' : 'Show Technical Specs ▼'}
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
      )}

      {/* 5. Interactive Pallet Fork Attachment Spotlight Section */}
      {content.forkShowcase.visible !== false && (
        <section className="fork-showcase-section">
          <div className="fork-showcase-container">
            <div className="fork-image-panel">
              <div className="fork-image-viewer">
                {forkColor === 'red' && (
                  <img src={content.forkShowcase.redImageUrl || "/images/fork-red-jobsite.png"} alt="Crimson Red TYPHON STOMP V900 with fork" title="TYPHON STOMP V900 Crimson Red" />
                )}
                {forkColor === 'yellow' && (
                  <img src={content.forkShowcase.yellowImageUrl || "/images/fork-yellow-jobsite.png"} alt="Industrial Yellow TYPHON STOMP V900 with fork" title="TYPHON STOMP V900 Industrial Yellow" />
                )}
                {forkColor === 'blue' && (
                  <img src={content.forkShowcase.blueImageUrl || "/images/fork-blue-jobsite.png"} alt="Cobalt Blue TYPHON STOMP V900 with fork" title="TYPHON STOMP V900 Cobalt Blue" />
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

              {/* Circle Swatches */}
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
              <p className="eyebrow">{content.forkShowcase.eyebrow}</p>
              <h2>{content.forkShowcase.title}</h2>
              <p className="fork-option-price">{content.forkShowcase.price}</p>
              <p className="fork-intro">
                {content.forkShowcase.intro}
              </p>

              <dl className="fork-machine-specs" aria-label="V900 performance highlights">
                {content.forkShowcase.quickSpecs.map((qs, i) => (
                  <div key={i}>
                    <dt>{qs.label}</dt>
                    <dd>{qs.value}</dd>
                  </div>
                ))}
              </dl>

              <ul className="fork-specs-list">
                {content.forkShowcase.highlights.map((hl, i) => (
                  <li 
                    key={i}
                    className={hoveredHotspot === (i === 0 ? 'tines' : i === 1 ? 'rails' : i === 2 ? 'quick-tach' : 'guard') ? 'active-item' : ''}
                    onMouseEnter={() => setHoveredHotspot(i === 0 ? 'tines' : i === 1 ? 'rails' : i === 2 ? 'quick-tach' : 'guard')}
                    onMouseLeave={() => setHoveredHotspot(null)}
                  >
                    <span className="spec-icon">{hl.icon}</span>
                    <div>
                      <h3>{hl.title}</h3>
                      <p>{hl.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="fork-action">
                <Link to={content.forkShowcase.btnUrl} className="btn btn-primary">
                  {content.forkShowcase.btnText}
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. Why Choose Section */}
      {content.why.visible !== false && (
        <section className="why">
          <div className="section-wrap">
            <div className="why-body">
              <div className="why-visual-column">
                <div className="why-head">
                  <div className="eyebrow">{content.why.eyebrow}</div>
                  <h2>{content.why.title}</h2>
                  <p>{content.why.description}</p>
                </div>

                <div className="why-media">
                  <div 
                    className="why-media-frame is-active" 
                    style={{
                      '--spot-x': (currentWhySpecs[activeWhySpec] || currentWhySpecs[0]).x,
                      '--spot-y': (currentWhySpecs[activeWhySpec] || currentWhySpecs[0]).y
                    } as React.CSSProperties}
                  >
                    <img src={content.why.imageUrl || "/images/why-choose-v900-jobsite.png"} alt="Why choose V900" title="TYPHON STOMP V900" />
                    <div className="spotlight"></div>
                    <div className="marker">
                      <div className="ring"></div>
                      <div className="dot"></div>
                    </div>
                  </div>
                  <div className="why-media-cap">
                    <span>SYSTEM: <b>V900</b></span>
                    <span className="live-label">TARGET: <b>{(currentWhySpecs[activeWhySpec] || currentWhySpecs[0]).label}</b></span>
                  </div>
                </div>
              </div>

              <div className="spec-list">
                {currentWhySpecs.map((spec, idx) => (
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
      )}

      {/* 7. Real-world performance video showcase */}
      {content.performance.visible !== false && (
        <section id="performance" className="performance-section" aria-labelledby="performance-title">
          <div className="performance-shell">
            <div className="performance-copy">
              <p className="eyebrow">{content.performance.eyebrow}</p>
              <h2 id="performance-title">{content.performance.title}</h2>
              <p className="performance-lead">
                {content.performance.lead}
              </p>

              <div className="performance-selector" role="tablist" aria-label="Select a performance video">
                {currentPerformanceVideos.map((video, index) => (
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

              <Link to={content.performance.ctaUrl} className="performance-cta">
                {content.performance.ctaText} <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="performance-stage">
              <div className="performance-video-frame">
                <video
                  key={(currentPerformanceVideos[activePerformance] || currentPerformanceVideos[0]).src}
                  src={(currentPerformanceVideos[activePerformance] || currentPerformanceVideos[0]).src}
                  poster={(currentPerformanceVideos[activePerformance] || currentPerformanceVideos[0]).poster}
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls
                  preload="metadata"
                >
                  Your browser does not support the video.
                </video>
                <div className="performance-video-label">
                  <span className="performance-live-dot"></span>
                  Field footage
                </div>
              </div>
              <div className="performance-caption">
                <span>{(currentPerformanceVideos[activePerformance] || currentPerformanceVideos[0]).number} / 03</span>
                <p>{(currentPerformanceVideos[activePerformance] || currentPerformanceVideos[0]).text}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* V900 Engineering & Performance Deep-Dive: Kubota D1105, 3P/3V Hydraulics, Tracks, Guards, Capacity */}
      <V900Showcase />

      {/* 8. Frequently Asked Questions */}
      {content.faq.visible !== false && (
        <section className="home-faq" aria-labelledby="faq-title">
          <div className="faq-shell">
            <div className="faq-intro">
              <p className="eyebrow">{content.faq.eyebrow}</p>
              <h2 id="faq-title">{content.faq.title}</h2>
              <p>{content.faq.description}</p>
              <Link to={content.faq.contactLinkUrl} className="faq-contact-link">
                {content.faq.contactPromptText} <span>{content.faq.contactLinkText}</span>
              </Link>
            </div>

            <div className="faq-list">
              {currentFaqs.map((faq, i) => (
                <details key={i} open={i === 0}>
                  <summary><span>0{i + 1}</span>{faq.question}<i aria-hidden="true"></i></summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 9. Feature Grid Section (Key Advantages) */}
      {content.advantages.visible !== false && (
        <section className="features-section">
          <div className="section-wrap">
            <div className="features-head">
              <div>
                <div className="eyebrow">{content.advantages.eyebrow}</div>
                <h2>{content.advantages.title}</h2>
              </div>
              <p>{content.advantages.description}</p>
            </div>
            
            <div className="feature-grid">
              {content.advantages.advantages.map((adv, i) => (
                <article className="feature-card" key={i}>
                  <svg className="feature-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <h3>{adv.title}</h3>
                  <p>{adv.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 10. Nationwide delivery section */}
      {content.delivery.visible !== false && (
        <section className="delivery-section" aria-labelledby="delivery-title">
          <div className="delivery-shell">
            <div className="delivery-media">
              <img
                src={content.delivery.imageUrl || "/images/v900-delivery.png"}
                alt="Delivery"
                title="Delivery"
              />
              <div className="delivery-media-badge">
                <span className="delivery-badge-icon" aria-hidden="true">✓</span>
                <span><strong>{content.delivery.badgeTitle}</strong>{content.delivery.badgeSubtitle}</span>
              </div>
            </div>

            <div className="delivery-content">
              <p className="eyebrow">{content.delivery.eyebrow}</p>
              <h2 id="delivery-title">{content.delivery.title}</h2>
              <p className="delivery-intro">{content.delivery.intro}</p>

              <ol className="delivery-steps">
                {content.delivery.steps.map((st, i) => (
                  <li key={i}>
                    <span>{st.number}</span>
                    <div><strong>{st.title}</strong><p>{st.text}</p></div>
                  </li>
                ))}
              </ol>

              <div className="delivery-actions">
                <Link to={content.delivery.btnUrl} className="btn btn-primary">{content.delivery.btnText}</Link>
                <span>{content.delivery.note}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 11. Bespoke Video Showcase Gallery */}
      {content.youtube.visible !== false && (
        <section className="youtube-showcase" aria-labelledby="youtube-showcase-title">
          <div className="youtube-showcase-shell">
            <div className="youtube-showcase-head">
              <div>
                <p className="eyebrow">{content.youtube.eyebrow}</p>
                <h2 id="youtube-showcase-title">{content.youtube.title}</h2>
              </div>
              <p>{content.youtube.description}</p>
            </div>

            <div className="youtube-video-grid">
              {content.youtube.videos.map((vid, i) => {
                const videoId = extractYouTubeId(vid.embedUrl)
                return (
                  <article className="youtube-video-card" key={i}>
                    {/* Custom Bespoke Video Preview & Play Button */}
                    <div
                      className="custom-video-preview"
                      onClick={() => setActiveVideoModal({ videoId, title: vid.title, tag: vid.tag })}
                      role="button"
                      tabIndex={0}
                      aria-label={`Play video: ${vid.title}`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setActiveVideoModal({ videoId, title: vid.title, tag: vid.tag })
                        }
                      }}
                    >
                      <img
                        src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                        alt={vid.title}
                        className="custom-video-thumb"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                        }}
                      />
                      <div className="custom-video-overlay" aria-hidden="true"></div>

                      {/* Top Glassmorphic Badge */}
                      <div className="custom-video-top-badge">
                        <span className="badge-pulse-indicator" aria-hidden="true"></span>
                        <span>4K ULTRA HD</span>
                      </div>

                      {/* Bespoke Glowing Machinery Play Button */}
                      <div className="custom-play-btn-wrap" aria-hidden="true">
                        <div className="play-ripple-ring"></div>
                        <div className="play-ripple-ring delay"></div>
                        <div className="custom-play-disc">
                          <svg className="custom-play-svg" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="7,4 20,12 7,20" />
                          </svg>
                        </div>
                      </div>

                      {/* Bottom Info Bar */}
                      <div className="custom-video-bottom-bar">
                        <span className="video-duration-pill">FIELD DEMO</span>
                        <span className="video-click-prompt">Click to Play ▷</span>
                      </div>
                    </div>

                    <div className="youtube-video-copy">
                      <div className="custom-video-meta-bar">
                        <span className="custom-video-tag">{vid.tag}</span>
                        <span className="custom-video-fps">1080p 60FPS</span>
                      </div>
                      <h3>{vid.title}</h3>
                      <div className="custom-video-actions-group">
                        <button
                          type="button"
                          className="custom-video-action-btn primary"
                          onClick={() => setActiveVideoModal({ videoId, title: vid.title, tag: vid.tag })}
                        >
                          <span className="btn-play-glyph">▶</span>
                          <span>Watch Field Demo</span>
                        </button>
                        <Link
                          to="/product/typhon-stomp-v900-mini-track-loader-kubota-d1105"
                          className="custom-video-action-btn secondary"
                          title="Explore V900 Front Product Page"
                        >
                          <span>Explore V900 Specs</span>
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>

          {/* Cinema Video Lightbox Modal */}
          {activeVideoModal && (
            <div
              className="cinema-video-modal-backdrop"
              onClick={() => setActiveVideoModal(null)}
              role="dialog"
              aria-modal="true"
              aria-label={activeVideoModal.title}
            >
              <div className="cinema-video-modal-shell" onClick={(e) => e.stopPropagation()}>
                <div className="cinema-modal-header">
                  <div className="cinema-modal-title-group">
                    <span className="cinema-modal-tag">{activeVideoModal.tag}</span>
                    <h3 className="cinema-modal-heading">{activeVideoModal.title}</h3>
                  </div>
                  <button
                    type="button"
                    className="cinema-modal-close"
                    onClick={() => setActiveVideoModal(null)}
                    aria-label="Close video player"
                  >
                    &times;
                  </button>
                </div>

                <div className="cinema-modal-player-wrap">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${activeVideoModal.videoId}?autoplay=1&rel=0&modestbranding=1&controls=1&playsinline=1`}
                    title={activeVideoModal.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="cinema-modal-iframe"
                  ></iframe>
                </div>

                <div className="cinema-modal-footer">
                  <div className="cinema-modal-info">
                    <p className="cinema-modal-desc">
                      TYPHON STOMP V900 EPA Tier 4 Diesel Skid Steer Loader in action.
                    </p>
                    <div className="cinema-modal-colors">
                      <span className="cinema-colors-label">V900 Color Editions:</span>
                      <Link
                        to="/product/typhon-stomp-v900-mini-track-loader-kubota-d1105"
                        className="cinema-color-pill yellow"
                        onClick={() => setActiveVideoModal(null)}
                      >
                        <span className="color-dot yellow"></span> Yellow
                      </Link>
                      <Link
                        to="/product/typhon-stomp-v900-mini-track-loader-kubota-d1105-red"
                        className="cinema-color-pill red"
                        onClick={() => setActiveVideoModal(null)}
                      >
                        <span className="color-dot red"></span> Red
                      </Link>
                      <Link
                        to="/product/typhon-stomp-v900-mini-track-loader-kubota-d1105-blue"
                        className="cinema-color-pill blue"
                        onClick={() => setActiveVideoModal(null)}
                      >
                        <span className="color-dot blue"></span> Blue
                      </Link>
                    </div>
                  </div>

                  <Link
                    to="/product/typhon-stomp-v900-mini-track-loader-kubota-d1105"
                    className="cinema-modal-cta"
                    onClick={() => setActiveVideoModal(null)}
                  >
                    <span>Inspect V900 360° Specs & Features</span>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* 12. Customer Feedback */}
      {content.feedback.visible !== false && (
        <section className="customer-feedback" aria-labelledby="feedback-title">
          <div className="feedback-shell">
            <div className="feedback-head">
              <div>
                <p className="eyebrow">{content.feedback.eyebrow}</p>
                <h2 id="feedback-title">{content.feedback.title}</h2>
              </div>
              <p>{content.feedback.description}</p>
            </div>

            <div className="feedback-grid">
              {content.feedback.testimonials.map((t, i) => (
                <article className={`feedback-card ${i === 0 ? 'featured-feedback' : ''}`} key={i}>
                  <div className="feedback-card-top">
                    <span className="feedback-quote" aria-hidden="true">“</span>
                    <span className="feedback-stars" aria-label="Rating">{t.stars}</span>
                  </div>
                  <blockquote>{t.quote}</blockquote>
                  <footer>
                    <span className="feedback-avatar">{t.avatar}</span>
                    <span><strong>{t.name}</strong><small>{t.role}</small></span>
                  </footer>
                </article>
              ))}
            </div>

            <div className="feedback-bottom">
              <span><strong>{content.feedback.bottomPrompt}</strong></span>
              <Link to={content.feedback.bottomLinkUrl}>{content.feedback.bottomLinkText}</Link>
            </div>
          </div>
        </section>
      )}

      {/* 13. CTA Strip Section */}
      {content.ctaStrip.visible !== false && (
        <section className="cta-strip">
          <div className="section-wrap">
            <div className="cta-strip-inner">
              <div>
                <h2>{content.ctaStrip.title} <span>{content.ctaStrip.titleHighlight}</span></h2>
                <p className="cta-strip-sub">{content.ctaStrip.subtitle}</p>
              </div>
              <div className="cta-row">
                <Link to={content.ctaStrip.primaryBtnUrl} className="btn btn-primary">{content.ctaStrip.primaryBtnText}</Link>
                <Link to={content.ctaStrip.secondaryBtnUrl} className="btn btn-ghost">{content.ctaStrip.secondaryBtnText}</Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
