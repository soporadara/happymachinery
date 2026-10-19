import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import type { Product } from '../components/CartDrawer'
import type { AdminProduct } from './adminData'
import { readSharedContent } from '../data/sharedContentStorage'
import { getV900ProductId, getV900ProductPath, V900_PRODUCT_SLUGS } from '../data/v900Urls'
import {
  V900_ORIGINAL_PRICE,
  V900_PALLET_FORK_PRICE,
  V900_SALE_PRICE,
  formatV900Price,
} from '../data/v900Pricing'
import './ProductDetail.css'

interface ProductDetailProps {
  onAddToCart: (product: Product, quantity?: number) => void
  onOpenCart: () => void
}

interface LoaderProduct extends Product {
  colorName: string
  bucketImage: string
  forkImage: string
  engine: string
  capacity: string
  weight: string
  flow: string
  tracks: string
  width: string
  fullDesc: string
  originalPrice?: number
  purchaseSku: string
  purchaseUrl: string
}

const COLOR_GALLERY_FALLBACKS: Record<string, string[]> = {
  'Crimson Red': [
    '/images/loader-red.png',
    '/images/loader-red.jpg',
    '/images/fork-red.jpg',
    '/images/why-choose-collage.jpg',
    '/images/v900-equipment-layout.png',
    '/images/v900-delivery.png'
  ],
  'Industrial Yellow': [
    '/images/loader-yellow.png',
    '/images/loader-yellow.jpg',
    '/images/fork-yellow.jpg',
    '/images/why-choose-collage.jpg',
    '/images/v900-equipment-layout.png',
    '/images/v900-delivery.png'
  ],
  'Cobalt Blue': [
    '/images/loader-blue.png',
    '/images/loader-blue.jpg',
    '/images/fork-blue.jpg',
    '/images/why-choose-collage.jpg',
    '/images/v900-equipment-layout.png',
    '/images/v900-delivery.png'
  ]
}

const LOADER_PRODUCTS: Record<string, LoaderProduct> = {
  '901': {
    id: 901,
    name: 'Skid Steer V900 – Crimson Red',
    price: V900_SALE_PRICE,
    originalPrice: V900_ORIGINAL_PRICE,
    description: 'The TYPH-V900R skid steer loader delivers powerful performance, reliable operation, and exceptional value. Perfect for construction, landscaping, and material handling tasks.',
    tag: 'Crimson Red',
    image: '/images/loader-red.png',
    colorName: 'Crimson Red',
    bucketImage: '/images/loader-red.png',
    forkImage: '/images/fork-red.jpg',
    engine: 'Kubota D1105 (3-Cyl, 25 HP, Naturally Aspirated, EPA Tier 4 / Stage V)',
    capacity: '1,014 lbs (460 kg) rated / 1,102 lbs (500 kg) max load',
    weight: '3,086 lbs (1400 kg / 1.4 Ton)',
    flow: '12.7 GPM (48 L/min) / 2,321 psi (16 MPa)',
    tracks: '180mm x 72mm x 45mm Reinforced Anti-Slip Rubber Tracks',
    width: '35.9 inches (911 mm)',
    purchaseSku: 'TyPH-V900R',
    purchaseUrl: '/store/Brand-New-TYPHON-STOMP-V900-1-4-Ton-Mini-Track-Loader-Featuring-Dual-Auxiliary-Hydraulics-%26-Kubota-D1105-25HP-USA-Engine-p849053936',
    fullDesc: 'The Crimson Red V900 mini skid steer is engineered for worksite visibility and continuous heavy-duty operation. Driven by a premium Kubota D1105 naturally aspirated 3-cylinder diesel engine, this tracked skid steer delivers 25 HP and 71.5 N·m torque. Featuring a rated pressure of 16 MPa and 12.7 GPM flow, it is optimized for efficient grading, lifting, and excavation with minimal site impact.'
  },
  '902': {
    id: 902,
    name: 'Skid Steer V900 – Industrial Yellow',
    price: V900_SALE_PRICE,
    originalPrice: V900_ORIGINAL_PRICE,
    description: 'The TYPH-V900Y skid steer loader delivers powerful performance, reliable operation, and exceptional value. Perfect for construction, landscaping, and material handling tasks.',
    tag: 'Industrial Yellow',
    image: '/images/loader-yellow.png',
    colorName: 'Industrial Yellow',
    bucketImage: '/images/loader-yellow.png',
    forkImage: '/images/fork-yellow.jpg',
    engine: 'Kubota D1105 (3-Cyl, 25 HP, Naturally Aspirated, EPA Tier 4 / Stage V)',
    capacity: '1,014 lbs (460 kg) rated / 1,102 lbs (500 kg) max load',
    weight: '3,086 lbs (1400 kg / 1.4 Ton)',
    flow: '12.7 GPM (48 L/min) / 2,321 psi (16 MPa)',
    tracks: '180mm x 72mm x 45mm Reinforced Anti-Slip Rubber Tracks',
    width: '35.9 inches (911 mm)',
    purchaseSku: 'TyPH-V900Y',
    purchaseUrl: '/store/Brand-New-TYPHON-STOMP-V900-1-4-Ton-Compact-Track-Loader-with-25HP-Kubota-Diesel-Engine-1-102-lb-Max-Load-p849060904',
    fullDesc: 'The classic construction Yellow V900 loader combines maximum site visibility with premium Kubota diesel reliability. Fitted with a 25 HP D1105 engine and low ground-pressure rubber tracks, it excels at trenching, municipal utility grading, and compact landscaping work.'
  },
  '903': {
    id: 903,
    name: 'Skid Steer V900 – Cobalt Blue',
    price: V900_SALE_PRICE,
    originalPrice: V900_ORIGINAL_PRICE,
    description: 'The TYPH-V900B skid steer loader delivers powerful performance, reliable operation, and exceptional value. Perfect for construction, landscaping, and material handling tasks.',
    tag: 'Cobalt Blue',
    image: '/images/loader-blue.png',
    colorName: 'Cobalt Blue',
    bucketImage: '/images/loader-blue.png',
    forkImage: '/images/fork-blue.jpg',
    engine: 'Kubota D1105 (3-Cyl, 25 HP, Naturally Aspirated, EPA Tier 4 / Stage V)',
    capacity: '1,014 lbs (460 kg) rated / 1,102 lbs (500 kg) max load',
    weight: '3,086 lbs (1400 kg / 1.4 Ton)',
    flow: '12.7 GPM (48 L/min) / 2,321 psi (16 MPa)',
    tracks: '180mm x 72mm x 45mm Reinforced Anti-Slip Rubber Tracks',
    width: '35.9 inches (911 mm)',
    purchaseSku: 'TyPH-V900B',
    purchaseUrl: '/store/Brand-New-TYPHON-STOMP-V900-Mini-Track-Loader-Kubota-D1105-25HP-Diesel-Stand-On-Skid-Steer-EPA-EU-Stage-V-p849057653',
    fullDesc: 'The Cobalt Blue V900 package unites modern heavy equipment aesthetics with commercial Kubota diesel performance. Delivering 12.7 GPM auxiliary flow and 1,014 lbs rated capacity, the unit manages heavy material lifts and grading passes with ease.'
  }
}

export default function ProductDetail({ onAddToCart, onOpenCart }: ProductDetailProps) {
  const { productKey } = useParams<{ productKey: string }>()
  const navigate = useNavigate()
  const id = getV900ProductId(productKey)
  const baseProduct = id ? LOADER_PRODUCTS[id] : null
  const [adminProduct, setAdminProduct] = useState<AdminProduct | null>(() => {
    if (!id) return null
    try {
      const saved = JSON.parse(localStorage.getItem('happy-machinery-products') || '[]') as AdminProduct[]
      return saved.find((item) => String(item.id) === id) ?? null
    } catch {
      return null
    }
  })

  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isVideoActive, setIsVideoActive] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [zoomScale, setZoomScale] = useState(1)
  const [activeTab, setActiveTab] = useState<'overview' | 'specifications' | 'reviews' | 'shipping'>('overview')
  const [quantity, setQuantity] = useState(1)
  const thumbnailStripRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!id) return

    const loadProduct = async () => {
      try {
        const sharedProducts = await readSharedContent<AdminProduct[]>('products')
        const sharedProduct = sharedProducts?.find((item) => String(item.id) === id)
        if (sharedProduct) {
          setAdminProduct(sharedProduct)
          return
        }
      } catch (error) {
        console.error('Could not load the shared product gallery.', error)
      }

      try {
        const saved = JSON.parse(localStorage.getItem('happy-machinery-products') || '[]') as AdminProduct[]
        setAdminProduct(saved.find((item) => String(item.id) === id) ?? null)
      } catch {
        setAdminProduct(null)
      }
    }

    void loadProduct()
    window.addEventListener('products-updated', loadProduct)
    window.addEventListener('storage', loadProduct)
    return () => {
      window.removeEventListener('products-updated', loadProduct)
      window.removeEventListener('storage', loadProduct)
    }
  }, [id])

  const product: LoaderProduct | null = baseProduct ? {
    ...baseProduct,
    name: adminProduct?.name || baseProduct.name,
    description: adminProduct?.description || baseProduct.description,
    fullDesc: adminProduct?.description || baseProduct.fullDesc,
    image: adminProduct?.image || baseProduct.image,
    bucketImage: adminProduct?.image || baseProduct.bucketImage,
    price: adminProduct?.salePrice || adminProduct?.price || baseProduct.price,
    originalPrice: adminProduct?.salePrice ? adminProduct.price : baseProduct.originalPrice,
  } : null

  const addToCartEnabled = adminProduct?.addToCartEnabled !== false

  const colorFallback = product ? COLOR_GALLERY_FALLBACKS[product.colorName] || [] : []
  const galleryImages: string[] = product
    ? Array.from(new Set([
        product.bucketImage,
        ...(adminProduct?.galleryImages ?? []),
        ...colorFallback
      ].filter(Boolean)))
    : []

  const activeImage = galleryImages[activeImageIndex] || galleryImages[0] || product?.image || ''

  useEffect(() => {
    setActiveImageIndex(0)
    setIsVideoActive(false)
  }, [id, adminProduct])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  useEffect(() => {
    if (id && productKey !== V900_PRODUCT_SLUGS[id]) {
      navigate(getV900ProductPath(id), { replace: true })
    }
  }, [id, navigate, productKey])

  const handlePrevImage = useCallback(() => {
    setIsVideoActive(false)
    setActiveImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1))
    setZoomScale(1)
  }, [galleryImages.length])

  const handleNextImage = useCallback(() => {
    setIsVideoActive(false)
    setActiveImageIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1))
    setZoomScale(1)
  }, [galleryImages.length])

  // Keyboard controls for lightbox
  useEffect(() => {
    if (!isLightboxOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false)
        setZoomScale(1)
      } else if (e.key === 'ArrowLeft') {
        handlePrevImage()
      } else if (e.key === 'ArrowRight') {
        handleNextImage()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isLightboxOpen, handlePrevImage, handleNextImage])

  const getShareUrl = () => {
    if (!product) return ''
    const base = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'https://happymachinery.com'
      : window.location.origin
    return `${base}${getV900ProductPath(product.id)}`
  }

  if (!product) {
    return (
      <div className="page product-not-found">
        <h2>Machinery Item Not Found</h2>
        <p>The product ID you requested does not exist in our active fleet listings.</p>
        <Link to="/" className="btn btn-primary">Return to Homepage</Link>
      </div>
    )
  }

  const handleAdd = () => {
    if (!addToCartEnabled) return
    onAddToCart(product, quantity)
    onOpenCart()
  }

  return (
    <div className="product-detail-page">
      {/* ==============================================================================
          BREADCRUMB BAR (Matches Screenshot Image 1)
          ============================================================================== */}
      <nav className="pdp-breadcrumb-nav" aria-label="Breadcrumb">
        <Link to="/" className="pdp-bc-link" title="Home">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
          </svg>
        </Link>
        <span className="pdp-bc-separator">&rsaquo;</span>
        <Link to="/store" className="pdp-bc-link">Construction Equipment</Link>
        <span className="pdp-bc-separator">&rsaquo;</span>
        <Link to="/store" className="pdp-bc-link">Skid Steer Loaders</Link>
        <span className="pdp-bc-separator">&rsaquo;</span>
        <span className="pdp-bc-current">{product.name}</span>
      </nav>

      {/* ==============================================================================
          TWO-COLUMN MAIN PRODUCT LAYOUT (Matches Screenshot Image 1)
          ============================================================================== */}
      <div className="pdp-main-grid">
        {/* ==========================================================================
            LEFT COLUMN: Main Image Gallery & Tabbed Information
            ========================================================================== */}
        <div className="pdp-left-col">
          {/* Main Gallery Card */}
          <div className="pdp-gallery-card">
            {/* Sale Pill Badge (Top Left) */}
            <div className="pdp-gallery-badge-sale">
              <span className="pdp-sale-fire-icon">🔥</span>
              <span>Sale</span>
            </div>

            {/* Expand / Fullscreen Button (Top Right) */}
            <button
              type="button"
              className="pdp-gallery-expand-btn"
              onClick={() => setIsLightboxOpen(true)}
              title="Expand full screen"
              aria-label="Expand image"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>

            {/* Left Nav Arrow */}
            <button
              type="button"
              className="pdp-gallery-arrow prev"
              onClick={(e) => {
                e.stopPropagation()
                handlePrevImage()
              }}
              aria-label="Previous image"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {/* Main Stage: Image or Video */}
            <div
              className="pdp-main-image-viewport"
              onDoubleClick={() => setIsLightboxOpen(true)}
              title="Double click to expand full screen"
            >
              {isVideoActive ? (
                <video
                  src="/images/home-hero-optimized.m4v"
                  poster="/images/why-choose-v900-jobsite.png"
                  controls
                  autoPlay
                  playsInline
                  className="pdp-main-video-player"
                />
              ) : (
                <img
                  src={activeImage}
                  alt={product.name}
                  className="pdp-main-product-img"
                />
              )}
            </div>

            {/* Right Nav Arrow */}
            <button
              type="button"
              className="pdp-gallery-arrow next"
              onClick={(e) => {
                e.stopPropagation()
                handleNextImage()
              }}
              aria-label="Next image"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Thumbnails Row (6 Thumbnails with Red Border for Active & Video Overlay) */}
          <div className="pdp-thumbnails-strip" ref={thumbnailStripRef}>
            {galleryImages.slice(0, 5).map((img, idx) => (
              <button
                key={`${img}-${idx}`}
                type="button"
                className={`pdp-thumb-chip ${!isVideoActive && activeImageIndex === idx ? 'active' : ''}`}
                onClick={() => {
                  setIsVideoActive(false)
                  setActiveImageIndex(idx)
                }}
                title={`View angle ${idx + 1}`}
              >
                <img src={img} alt={`Thumbnail ${idx + 1}`} />
              </button>
            ))}

            {/* Thumbnail 6: Video Demo with Play Overlay (Matches Screenshot Image 1) */}
            <button
              type="button"
              className={`pdp-thumb-chip video-chip ${isVideoActive ? 'active' : ''}`}
              onClick={() => setIsVideoActive(true)}
              title="Watch machinery in action"
            >
              <img src="/images/v900-delivery.png" alt="Video demo" />
              <div className="pdp-thumb-video-overlay">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </button>
          </div>

          {/* Tabbed Details Section (Matches Image 1: Overview, Specs, Reviews, Shipping) */}
          <div className="pdp-tabs-container">
            <div className="pdp-tabs-nav-bar">
              <button
                type="button"
                className={`pdp-tab-item ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                type="button"
                className={`pdp-tab-item ${activeTab === 'specifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('specifications')}
              >
                Specifications
              </button>
              <button
                type="button"
                className={`pdp-tab-item ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                Reviews (12)
              </button>
              <button
                type="button"
                className={`pdp-tab-item ${activeTab === 'shipping' ? 'active' : ''}`}
                onClick={() => setActiveTab('shipping')}
              >
                Shipping &amp; Return
              </button>
            </div>

            <div className="pdp-tab-content-panel">
              {/* TAB 1: OVERVIEW (Matches Image 1 with Product Overview & Quick Specs Card) */}
              {activeTab === 'overview' && (
                <div className="pdp-overview-layout">
                  <div className="pdp-overview-text-col">
                    <h3 className="pdp-overview-heading">Product Overview</h3>
                    <p className="pdp-overview-desc-lead">
                      The {product.purchaseSku} is a high-performance skid steer loader designed for maximum productivity and durability. With its compact size and powerful engine, it can handle a wide range of jobs in tight spaces and tough conditions.
                    </p>
                    <p className="pdp-overview-desc-body">
                      {product.fullDesc}
                    </p>
                  </div>

                  <div className="pdp-overview-quick-specs-box">
                    <div className="pdp-spec-row-item">
                      <div className="pdp-spec-row-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="3" />
                          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                      </div>
                      <div className="pdp-spec-meta-block">
                        <span className="pdp-spec-title">Engine</span>
                        <strong className="pdp-spec-value">Kubota Diesel Option</strong>
                      </div>
                    </div>

                    <div className="pdp-spec-row-item">
                      <div className="pdp-spec-row-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                      </div>
                      <div className="pdp-spec-meta-block">
                        <span className="pdp-spec-title">Operating Capacity</span>
                        <strong className="pdp-spec-value">1,014 lbs (460 kg)</strong>
                      </div>
                    </div>

                    <div className="pdp-spec-row-item">
                      <div className="pdp-spec-row-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                          <line x1="3" y1="6" x2="21" y2="6" />
                          <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                      </div>
                      <div className="pdp-spec-meta-block">
                        <span className="pdp-spec-title">Rated Load</span>
                        <strong className="pdp-spec-value">1,102 lbs (500 kg)</strong>
                      </div>
                    </div>

                    <div className="pdp-spec-row-item">
                      <div className="pdp-spec-row-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="2" y="6" width="20" height="12" rx="2" />
                          <circle cx="6" cy="12" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="18" cy="12" r="2" />
                        </svg>
                      </div>
                      <div className="pdp-spec-meta-block">
                        <span className="pdp-spec-title">Tracks</span>
                        <strong className="pdp-spec-value">Anti-Slip Rubber</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SPECIFICATIONS */}
              {activeTab === 'specifications' && (
                <div className="pdp-specs-tab-view">
                  <table className="pdp-specs-table">
                    <tbody>
                      <tr>
                        <td>Engine Model</td>
                        <td><strong>{product.engine}</strong></td>
                      </tr>
                      <tr>
                        <td>Operating Capacity</td>
                        <td><strong>{product.capacity}</strong></td>
                      </tr>
                      <tr>
                        <td>Gross Operating Weight</td>
                        <td><strong>{product.weight}</strong></td>
                      </tr>
                      <tr>
                        <td>Auxiliary Hydraulic Flow</td>
                        <td><strong>{product.flow}</strong></td>
                      </tr>
                      <tr>
                        <td>Track Specification</td>
                        <td><strong>{product.tracks}</strong></td>
                      </tr>
                      <tr>
                        <td>Overall Chassis Width</td>
                        <td><strong>{product.width}</strong></td>
                      </tr>
                      <tr>
                        <td>Quick-Tach Mounting Standard</td>
                        <td><strong>Universal SAE J2513 Skid Steer Spec</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: REVIEWS (12) */}
              {activeTab === 'reviews' && (
                <div className="pdp-reviews-tab-view">
                  <div className="pdp-reviews-summary">
                    <span className="pdp-rev-score">5.0</span>
                    <div className="pdp-rev-stars">★★★★★</div>
                    <span className="pdp-rev-count">Based on 12 verified contractor reviews</span>
                  </div>
                  <div className="pdp-reviews-list">
                    <div className="pdp-rev-card">
                      <div className="pdp-rev-head">
                        <strong>Mark Dawson</strong>
                        <span className="pdp-rev-company">Civil Earthworks LLC, Texas</span>
                        <span className="pdp-rev-stars-small">★★★★★</span>
                      </div>
                      <p className="pdp-rev-quote">
                        "The Kubota D1105 diesel engine has incredible torque. Fits right through narrow 36-inch gates on our residential grading contracts. The hydraulic control response is silky smooth."
                      </p>
                    </div>
                    <div className="pdp-rev-card">
                      <div className="pdp-rev-head">
                        <strong>Kevin Miller</strong>
                        <span className="pdp-rev-company">Tri-State Landscaping, Ohio</span>
                        <span className="pdp-rev-stars-small">★★★★★</span>
                      </div>
                      <p className="pdp-rev-quote">
                        "We purchased the {product.colorName} package with the TYPH-5005M pallet fork. Moving 1,000 lb paver pallets in tight backyards has cut our job times in half. Excellent machine!"
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SHIPPING & RETURN */}
              {activeTab === 'shipping' && (
                <div className="pdp-shipping-tab-view">
                  <h4>Nationwide Freight &amp; Delivery</h4>
                  <p>
                    We distribute heavy machinery across all 48 contiguous US states. Standard delivery is handled via dedicated flatbed freight service. Residential liftgate drop-off is fully supported.
                  </p>
                  <h4>1-Year Commercial Warranty</h4>
                  <p>
                    All brand-new heavy equipment includes a <strong>1-Year Commercial Warranty</strong> covering major drive components, engines, and hydraulic pumps. Technical parts and servicing support are coordinated directly from our US fulfillment center.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==========================================================================
            RIGHT COLUMN: Pricing, Inclusions, Actions, Trust & Promo (Matches Image 1)
            ========================================================================== */}
        <div className="pdp-right-col">
          {/* Edition Pill Badge (Top) */}
          <div className="pdp-edition-tag">
            {product.colorName.toUpperCase()} EDITION
          </div>

          {/* Product Title & Reviews Row */}
          <div className="pdp-header-row">
            <h1 className="pdp-title">{product.name}</h1>
            <div className="pdp-rating-badge">
              <span className="pdp-stars-gold">★★★★★</span>
              <span className="pdp-reviews-label">(12 reviews)</span>
            </div>
          </div>

          {/* SKU Code */}
          <p className="pdp-sku-row">
            SKU: <strong>{product.purchaseSku}</strong>
          </p>

          {/* Pricing Row: Original Strikethrough, Sale Price, SALE! Tag */}
          <div className="pdp-price-row">
            {product.originalPrice && (
              <span className="pdp-original-price">
                ${product.originalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
            <span className="pdp-sale-price">
              ${product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="pdp-sale-tag-badge">SALE!</span>
          </div>

          {/* Short Excerpt Paragraph */}
          <p className="pdp-description-excerpt">
            {product.description}
          </p>

          {/* Inclusions Grid: 4 Feature Boxes (Matches Image 1) */}
          <div className="pdp-inclusions-grid">
            <div className="pdp-inc-box">
              <div className="pdp-inc-icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="14" width="20" height="6" rx="2" />
                  <circle cx="6" cy="17" r="1.5" fill="#dc2626" />
                  <circle cx="12" cy="17" r="1.5" fill="#dc2626" />
                  <circle cx="18" cy="17" r="1.5" fill="#dc2626" />
                  <path d="M5 14V8a2 2 0 0 1 2-2h4l3 6h6" />
                  <path d="M19 14v-2" />
                </svg>
              </div>
              <span className="pdp-inc-text">1x Skid Steer V900 ({product.colorName})</span>
            </div>

            <div className="pdp-inc-box">
              <div className="pdp-inc-icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 7h16l-2 10a3 3 0 0 1-3 2H9a3 3 0 0 1-3-2L4 7z" />
                  <path d="M8 7V4h8v3" />
                  <line x1="10" y1="12" x2="14" y2="12" />
                </svg>
              </div>
              <span className="pdp-inc-text">1x Standard Soil Utility Excavator Bucket</span>
            </div>

            <div className="pdp-inc-box">
              <div className="pdp-inc-icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="7" width="18" height="13" rx="2" />
                  <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                </svg>
              </div>
              <span className="pdp-inc-text">1x Toolbox (For Accessories)</span>
            </div>

            <div className="pdp-inc-box">
              <div className="pdp-inc-icon-wrap">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </div>
              <span className="pdp-inc-text">Replacement Filters &amp; Spare Spares</span>
            </div>
          </div>

          {/* Optional Fork Notice with Delivery Truck */}
          <div className="pdp-optional-notice">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <rect x="1" y="3" width="15" height="13" />
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
            <span>
              TYPH-5005M pallet fork shown in the gallery is optional and sold separately for {formatV900Price(V900_PALLET_FORK_PRICE)}.
            </span>
          </div>

          {/* Action Row: Quantity Selector, Add to Cart (Red), Buy Now (White with Lightning) */}
          <div className="pdp-action-buttons-row">
            <div className="pdp-quantity-control">
              <span className="pdp-qty-label">Quantity:</span>
              <div className="pdp-qty-stepper">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="pdp-qty-value">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            </div>

            <button
              type="button"
              className="pdp-btn-add-to-cart"
              onClick={handleAdd}
              disabled={!addToCartEnabled}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span>Add to Cart</span>
            </button>

            <a
              href={product.purchaseUrl}
              className="pdp-btn-buy-now"
              aria-label={`Buy ${product.name} now`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#dc2626" stroke="#dc2626" strokeWidth="1">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>Buy Now</span>
            </a>
          </div>

          {/* Trust Badges: 4 Grid Columns (Matches Image 1) */}
          <div className="pdp-trust-bar">
            <div className="pdp-trust-badge">
              <div className="pdp-trust-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
              </div>
              <div className="pdp-trust-copy">
                <strong>Trusted Quality</strong>
                <span>100% Original</span>
              </div>
            </div>

            <div className="pdp-trust-badge">
              <div className="pdp-trust-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
              </div>
              <div className="pdp-trust-copy">
                <strong>Fast Delivery</strong>
                <span>Within 3-7 Days</span>
              </div>
            </div>

            <div className="pdp-trust-badge">
              <div className="pdp-trust-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
                  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
                </svg>
              </div>
              <div className="pdp-trust-copy">
                <strong>Expert Support</strong>
                <span>24/7 Support</span>
              </div>
            </div>

            <div className="pdp-trust-badge">
              <div className="pdp-trust-icon-box">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2">
                  <circle cx="12" cy="8" r="7" />
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                </svg>
              </div>
              <div className="pdp-trust-copy">
                <strong>Warranty</strong>
                <span>1 Year Limited</span>
              </div>
            </div>
          </div>

          {/* Share This Product Section (Matches Image 1) */}
          <div className="pdp-share-strip">
            <span className="pdp-share-label">Share This Product</span>
            <div className="pdp-social-buttons">
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`}
                target="_blank"
                rel="noopener noreferrer"
                className="pdp-social-btn fb"
                title="Share on Facebook"
                aria-label="Share on Facebook"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>

              <a
                href="https://www.youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="pdp-social-btn yt"
                title="Watch on YouTube"
                aria-label="Watch on YouTube"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="#fff" />
                </svg>
              </a>

              <a
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent(product.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="pdp-social-btn x"
                title="Share on X"
                aria-label="Share on X"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              <a
                href={`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(getShareUrl())}&media=${encodeURIComponent(product.image || '')}&description=${encodeURIComponent(product.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="pdp-social-btn pin"
                title="Pin on Pinterest"
                aria-label="Pin on Pinterest"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0a12 12 0 0 0-4.37 23.18c-.06-.55-.11-1.39.02-1.99.12-.55.8-3.4 1.34-5.69a4.8 4.8 0 0 1-.36-1.92c0-1.8 1.04-3.15 2.34-3.15 1.1 0 1.63.83 1.63 1.83 0 1.11-.71 2.77-1.07 4.31-.3 1.29.65 2.34 1.92 2.34 2.3 0 4.07-2.43 4.07-5.93 0-3.1-2.23-5.27-5.41-5.27-3.69 0-5.85 2.77-5.85 5.62 0 1.11.43 2.3 0.96 2.95.1.13.12.24.09.37-.1.41-.32 1.32-.36 1.5-.06.24-.2.29-.46.18-1.72-.8-2.79-3.32-2.79-5.34 0-4.35 3.16-8.34 9.12-8.34 4.79 0 8.51 3.41 8.51 7.97 0 4.75-2.99 8.58-7.14 8.58-1.4 0-2.71-.73-3.16-1.59l-.86 3.28c-.31 1.2-1.15 2.7-1.72 3.61A11.98 11.98 0 1 0 12 0z" />
                </svg>
              </a>

              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="pdp-social-btn ig"
                title="Follow on Instagram"
                aria-label="Follow on Instagram"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>

              <a
                href={`https://www.tumblr.com/widgets/share/tool?canonicalUrl=${encodeURIComponent(getShareUrl())}&title=${encodeURIComponent(product.name)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="pdp-social-btn tb"
                title="Share on Tumblr"
                aria-label="Share on Tumblr"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M14.563 24c-5.093 0-7.031-2.556-7.031-6.702V11.2H4.634v-3.79c3.08-1.074 4.382-3.834 4.545-6.621h3.707v6.621h4.634v3.79h-4.634v5.719c0 1.956.88 2.673 2.477 2.673h2.157V24h-2.955z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Special Offer Promo Banner (Matches Image 1) */}
          <div className="pdp-promo-card-banner">
            <div className="pdp-promo-copy">
              <span className="pdp-promo-kicker">SPECIAL OFFER</span>
              <h3 className="pdp-promo-headline">Get the Best Deal<br />on Heavy Machinery</h3>
              <p className="pdp-promo-subtext">Professional equipment for your business.</p>
              <Link to="/store" className="pdp-promo-link-btn">
                View All Products &rarr;
              </Link>
            </div>
            <div className="pdp-promo-image-box">
              <img src="/images/loader-red.png" alt="Happy Machinery Special Offer" />
            </div>
          </div>
        </div>
      </div>

      {/* ==============================================================================
          FULL SCREEN LIGHTBOX MODAL
          ============================================================================== */}
      {isLightboxOpen && (
        <div
          className="product-lightbox-modal"
          onClick={() => {
            setIsLightboxOpen(false)
            setZoomScale(1)
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Full screen image viewer"
        >
          <div className="lightbox-content-box" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-top-bar">
              <div className="lightbox-meta">
                <h3>{product.name}</h3>
                <span className="lightbox-count">Angle {activeImageIndex + 1} of {galleryImages.length}</span>
              </div>
              <div className="lightbox-zoom-actions">
                <button
                  type="button"
                  className="lb-tool-btn"
                  onClick={() => setZoomScale((prev) => Math.max(0.5, Number((prev - 0.25).toFixed(2))))}
                  disabled={zoomScale <= 0.5}
                  title="Zoom Out"
                >
                  &minus;
                </button>
                <span className="lb-zoom-level">{Math.round(zoomScale * 100)}%</span>
                <button
                  type="button"
                  className="lb-tool-btn"
                  onClick={() => setZoomScale((prev) => Math.min(3, Number((prev + 0.25).toFixed(2))))}
                  disabled={zoomScale >= 3}
                  title="Zoom In"
                >
                  +
                </button>
                <button
                  type="button"
                  className="lb-tool-btn reset"
                  onClick={() => setZoomScale(1)}
                  title="Reset Zoom"
                >
                  Reset
                </button>
                <button
                  type="button"
                  className="lb-close-btn"
                  onClick={() => {
                    setIsLightboxOpen(false)
                    setZoomScale(1)
                  }}
                  title="Close viewer"
                  aria-label="Close viewer"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="lightbox-main-stage">
              <button
                type="button"
                className="lightbox-stage-arrow prev"
                onClick={handlePrevImage}
                aria-label="Previous image"
              >
                &lsaquo;
              </button>
              <div className="lightbox-img-wrapper" style={{ transform: `scale(${zoomScale})` }}>
                <img src={activeImage} alt={product.name} className="lightbox-zoom-img" />
              </div>
              <button
                type="button"
                className="lightbox-stage-arrow next"
                onClick={handleNextImage}
                aria-label="Next image"
              >
                &rsaquo;
              </button>
            </div>

            <div className="lightbox-bottom-strip">
              {galleryImages.map((img, idx) => (
                <button
                  key={`lb-${img}-${idx}`}
                  type="button"
                  className={`lb-thumb-chip ${activeImageIndex === idx ? 'active' : ''}`}
                  onClick={() => {
                    setActiveImageIndex(idx)
                    setZoomScale(1)
                  }}
                >
                  <img src={img} alt={`Angle ${idx + 1}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
