import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import type { Product } from '../components/CartDrawer'
import type { AdminProduct } from './adminData'
import { readSharedContent } from '../data/sharedContentStorage'
import { getV900ProductId, getV900ProductPath, V900_PRODUCT_SLUGS } from '../data/v900Urls'
import SocialShareButtons from '../components/SocialShareButtons'
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
    '/images/fork-red-jobsite.png',
    '/images/why-choose-v900-jobsite.png',
    '/images/v900-equipment-layout.png',
    '/images/hero-v900-three-colors.png',
    '/images/v900-delivery.png'
  ],
  'Industrial Yellow': [
    '/images/loader-yellow.png',
    '/images/loader-yellow.jpg',
    '/images/fork-yellow.jpg',
    '/images/fork-yellow-jobsite.png',
    '/images/why-choose-v900-jobsite.png',
    '/images/v900-equipment-layout.png',
    '/images/hero-v900-three-colors.png',
    '/images/v900-delivery.png'
  ],
  'Cobalt Blue': [
    '/images/loader-blue.png',
    '/images/loader-blue.jpg',
    '/images/fork-blue.jpg',
    '/images/fork-blue-jobsite.png',
    '/images/why-choose-v900-jobsite.png',
    '/images/v900-equipment-layout.png',
    '/images/hero-v900-three-colors.png',
    '/images/v900-delivery.png'
  ]
}

const LOADER_PRODUCTS: Record<string, LoaderProduct> = {
  '901': {
    id: 901,
    name: 'Skid Steer V900 (Red Edition)',
    price: V900_SALE_PRICE,
    originalPrice: V900_ORIGINAL_PRICE,
    description: 'Bold Crimson Red utility package with Kubota D1105 engine.',
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
    purchaseSku: 'TYPH-V900R',
    purchaseUrl: '/store/Brand-New-TYPHON-STOMP-V900-1-4-Ton-Mini-Track-Loader-Featuring-Dual-Auxiliary-Hydraulics-%26-Kubota-D1105-25HP-USA-Engine-p849053936',
    fullDesc: 'The Crimson Red V900 mini skid steer is engineered for worksite visibility and continuous heavy-duty operation. Driven by a premium Kubota D1105 naturally aspirated 3-cylinder diesel engine, this tracked skid steer delivers 25 HP and 71.5 N·m torque. Featuring a rated pressure of 16 MPa and 12.7 GPM flow, it is optimized for efficient grading, lifting, and excavation with minimal site impact.'
  },
  '902': {
    id: 902,
    name: 'Skid Steer V900 (Yellow Edition)',
    price: V900_SALE_PRICE,
    originalPrice: V900_ORIGINAL_PRICE,
    description: 'Industrial Yellow finish with Kubota D1105 engine.',
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
    purchaseSku: 'TYPH-V900Y',
    purchaseUrl: '/store/Brand-New-TYPHON-STOMP-V900-1-4-Ton-Compact-Track-Loader-with-25HP-Kubota-Diesel-Engine-1-102-lb-Max-Load-p849060904',
    fullDesc: 'The classic construction Yellow V900 loader combines maximum site visibility with premium Kubota diesel reliability. Fitted with a 25 HP D1105 engine and low ground-pressure rubber tracks, it excels at trenching, municipal utility grading, and compact landscaping work.'
  },
  '903': {
    id: 903,
    name: 'Skid Steer V900 (Blue Edition)',
    price: V900_SALE_PRICE,
    originalPrice: V900_ORIGINAL_PRICE,
    description: 'Cobalt Blue utility package with Kubota D1105 engine.',
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
    purchaseSku: 'TYPH-V900B',
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
  const [isHovered, setIsHovered] = useState(false)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [zoomScale, setZoomScale] = useState(1)
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews' | 'shipping'>('description')
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
        product.forkImage,
        ...colorFallback
      ].filter(Boolean)))
    : []

  const activeImage = galleryImages[activeImageIndex] || galleryImages[0] || product?.image || ''

  useEffect(() => {
    setActiveImageIndex(0)
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
    setActiveImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1))
    setZoomScale(1)
  }, [galleryImages.length])

  const handleNextImage = useCallback(() => {
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

  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (thumbnailStripRef.current) {
      const scrollAmount = direction === 'left' ? -220 : 220
      thumbnailStripRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  const getShareUrl = () => {
    if (!product) return ''
    const base = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'https://happymachinery.com'
      : window.location.origin
    return `${base}${getV900ProductPath(product.id)}`
  }

  const getSocialShareUrl = () => `${getShareUrl()}?share=1`

  const printProduct = () => {
    window.print()
  }

  const downloadPDF = () => {
    window.print()
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
    <div className="page product-detail-page">
      <div className="detail-navigation">
        <Link to="/" className="back-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span>Back to Fleet Catalog</span>
        </Link>
      </div>

      <div className="product-layout-container">
        {/* ==============================================================================
            LEFT COLUMN: Interactive Gallery & Product Tabs (Matches Screenshot)
            ============================================================================== */}
        <div className="product-gallery-panel">
          {/* Main Image Display with Hover Overlay, Controls & Double Click to Zoom */}
          <div
            className="main-display-view"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onDoubleClick={() => setIsLightboxOpen(true)}
            title="Double-click to view high resolution full screen"
          >
            {/* Best Seller Badge (Screenshot 1) */}
            <div className="gallery-badge-seller">
              <span>🔥 Best Seller</span>
            </div>

            {/* Expand / Fullscreen Button */}
            <button
              type="button"
              className="gallery-expand-btn"
              onClick={() => setIsLightboxOpen(true)}
              title="Expand full screen (Double click)"
              aria-label="View full screen"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>

            {/* Left Nav Arrow */}
            <button
              type="button"
              className="gallery-nav-btn prev"
              onClick={(e) => {
                e.stopPropagation()
                handlePrevImage()
              }}
              aria-label="Previous image"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {/* Main Picture */}
            <img
              src={activeImage}
              alt={`TYPHON STOMP V900 ${product.colorName} mini skid steer — ${product.name}`}
              className="main-active-img"
            />

            {/* Right Nav Arrow */}
            <button
              type="button"
              className="gallery-nav-btn next"
              onClick={(e) => {
                e.stopPropagation()
                handleNextImage()
              }}
              aria-label="Next image"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>

            {/* Hover Tooltip: Double Click to View (Requested by User) */}
            <div className={`gallery-hover-tooltip ${isHovered ? 'visible' : ''}`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
                <line x1="11" y1="8" x2="11" y2="14" />
                <line x1="8" y1="11" x2="14" y2="11" />
              </svg>
              <span>Double click to view full screen</span>
            </div>

            {/* Bottom Right Image Counter Pill (e.g. 1/8) */}
            <div className="gallery-counter-pill">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span>{activeImageIndex + 1}/{galleryImages.length}</span>
            </div>
          </div>

          {/* Thumbnail Carousel Row (Matches Screenshot with Active Blue Border & Arrows) */}
          <div className="gallery-thumbnails-strip-wrapper">
            <button
              type="button"
              className="thumb-scroll-btn left"
              onClick={() => scrollThumbnails('left')}
              title="Scroll thumbnails left"
              aria-label="Scroll thumbnails left"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div className="gallery-thumbnails-strip" ref={thumbnailStripRef}>
              {galleryImages.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  className={`thumbnail-chip ${activeImageIndex === index ? 'active' : ''}`}
                  onClick={() => setActiveImageIndex(index)}
                  title={`View angle ${index + 1}`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail angle ${index + 1} of ${product.name}`}
                  />
                </button>
              ))}
            </div>

            <button
              type="button"
              className="thumb-scroll-btn right"
              onClick={() => scrollThumbnails('right')}
              title="Scroll thumbnails right"
              aria-label="Scroll thumbnails right"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          {/* Product Tabs Directly Under Gallery (Matches User Screenshot) */}
          <section className="product-info-tabs-section">
            <div className="tabs-header-pills">
              <button
                type="button"
                className={`tab-pill-btn ${activeTab === 'description' ? 'active' : ''}`}
                onClick={() => setActiveTab('description')}
              >
                Description
              </button>
              <button
                type="button"
                className={`tab-pill-btn ${activeTab === 'specifications' ? 'active' : ''}`}
                onClick={() => setActiveTab('specifications')}
              >
                Specifications
              </button>
              <button
                type="button"
                className={`tab-pill-btn ${activeTab === 'reviews' ? 'active' : ''}`}
                onClick={() => setActiveTab('reviews')}
              >
                Reviews (24)
              </button>
              <button
                type="button"
                className={`tab-pill-btn ${activeTab === 'shipping' ? 'active' : ''}`}
                onClick={() => setActiveTab('shipping')}
              >
                Shipping Info
              </button>
            </div>

            <div className="tab-body-card">
              {/* TAB 1: DESCRIPTION */}
              {activeTab === 'description' && (
                <div className="tab-pane-fade">
                  <p className="tab-lead-intro">
                    The Skid Steer V900 in {product.colorName} delivers powerful performance, versatility, and reliability for your toughest jobs. With its compact design and advanced hydraulics, it's perfect for construction, landscaping, and more.
                  </p>
                  <h4 style={{ margin: '18px 0 8px', fontSize: '1rem', color: '#0c2b5c', fontWeight: 800 }}>
                    Industrial Utility Redefined
                  </h4>
                  <p style={{ color: '#475569', lineHeight: 1.7, fontSize: '0.94rem' }}>
                    {product.fullDesc}
                  </p>
                  <p style={{ marginTop: '14px', color: '#475569', lineHeight: 1.7, fontSize: '0.94rem' }}>
                    Every machine is shipped fully compiled, field-tested, and topped with engine fluid. Simply unlock the controls, attach the pallet forks or the bucket, and you are ready to begin grading or loading.
                  </p>
                </div>
              )}

              {/* TAB 2: SPECIFICATIONS */}
              {activeTab === 'specifications' && (
                <div className="tab-pane-fade">
                  <h4 style={{ margin: '0 0 16px', fontSize: '1rem', color: '#0c2b5c', fontWeight: 800 }}>
                    Technical Specification Grid
                  </h4>
                  <table className="details-specs-table">
                    <tbody>
                      <tr>
                        <td>Engine Model & Config</td>
                        <td><strong>{product.engine}</strong></td>
                      </tr>
                      <tr>
                        <td>Lifting Operating Capacity</td>
                        <td><strong>{product.capacity}</strong></td>
                      </tr>
                      <tr>
                        <td>Machine Operating Weight</td>
                        <td><strong>{product.weight}</strong></td>
                      </tr>
                      <tr>
                        <td>Auxiliary Hydraulic Flow</td>
                        <td><strong>{product.flow}</strong></td>
                      </tr>
                      <tr>
                        <td>Traction Track Type</td>
                        <td><strong>{product.tracks}</strong></td>
                      </tr>
                      <tr>
                        <td>Maximum Chassis Width</td>
                        <td><strong>{product.width}</strong></td>
                      </tr>
                      <tr>
                        <td>Universal Plate Standard</td>
                        <td><strong>SAE J2513 Skid Steer Spec</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: REVIEWS (24) */}
              {activeTab === 'reviews' && (
                <div className="tab-pane-fade">
                  <div className="reviews-summary-bar">
                    <div className="reviews-score-col">
                      <span className="reviews-score-num">5.0</span>
                      <div className="reviews-stars">★★★★★</div>
                      <span className="reviews-count-text">Based on 24 verified contractor reviews</span>
                    </div>
                    <div className="reviews-badges-col">
                      <span className="verified-badge">✓ 100% Verified Equipment Owners</span>
                      <span className="commercial-grade-badge">🛡️ Commercial Jobsite Tested</span>
                    </div>
                  </div>

                  <div className="reviews-list-grid">
                    <div className="review-card-item">
                      <div className="review-card-header">
                        <strong>Mark Dawson</strong>
                        <span className="review-jobsite">Civil Earthworks LLC, Texas</span>
                        <div className="review-stars-small">★★★★★</div>
                      </div>
                      <p className="review-card-text">
                        "The Kubota D1105 diesel engine has incredible torque. Fits right through narrow 36-inch gates on our residential grading contracts. The hydraulic control response is silky smooth."
                      </p>
                    </div>

                    <div className="review-card-item">
                      <div className="review-card-header">
                        <strong>Kevin Miller</strong>
                        <span className="review-jobsite">Tri-State Landscaping, Ohio</span>
                        <div className="review-stars-small">★★★★★</div>
                      </div>
                      <p className="review-card-text">
                        "We purchased the {product.colorName} package with the TYPH-5005M pallet fork. Moving 1,000 lb paver pallets in tight backyards has cut our job times in half. Excellent machine!"
                      </p>
                    </div>

                    <div className="review-card-item">
                      <div className="review-card-header">
                        <strong>Roberto Sanchez</strong>
                        <span className="review-jobsite">Apex Concrete & Utilities, Florida</span>
                        <div className="review-stars-small">★★★★★</div>
                      </div>
                      <p className="review-card-text">
                        "Auxiliary hydraulic flow handles our auger and trenching attachments with zero overheating. Best value mini track loader on the market."
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SHIPPING INFO */}
              {activeTab === 'shipping' && (
                <div className="tab-pane-fade">
                  <h4 style={{ margin: '0 0 12px', fontSize: '1rem', color: '#0c2b5c', fontWeight: 800 }}>
                    Nationwide Freight & Delivery
                  </h4>
                  <p style={{ color: '#475569', lineHeight: 1.7, fontSize: '0.94rem' }}>
                    We distribute heavy machinery across all 48 contiguous US states. Standard delivery is handled via dedicated flatbed freight service. Residential liftgate drop-off is fully supported.
                  </p>
                  <h4 style={{ margin: '20px 0 12px', fontSize: '1rem', color: '#0c2b5c', fontWeight: 800 }}>
                    1-Year Commercial Warranty
                  </h4>
                  <p style={{ color: '#475569', lineHeight: 1.7, fontSize: '0.94rem' }}>
                    All brand-new heavy equipment includes a <strong>1-Year Commercial Warranty</strong> covering major drive components, engines, and hydraulic pumps. Technical parts and servicing support are coordinated directly from our US fulfillment center.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ==============================================================================
            RIGHT COLUMN: Configurations, Pricing & Purchase Panel
            ============================================================================== */}
        <div className="product-purchase-panel">
          <span className="detail-badge">{product.colorName} Edition</span>
          <h1 className="product-page-title">{product.name}</h1>
          <p className="detail-sku">
            SKU: <strong>{product.purchaseSku}</strong>
          </p>
          <div className="detail-price">
            {product.originalPrice && (
              <>
                <span className="original-price">${product.originalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="sale-price">${product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="sale-badge-pill">Sale!</span>
              </>
            )}
            {!product.originalPrice && (
              <span className="sale-price">${product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            )}
          </div>

          <div className="detail-inclusions">
            <h3>Standard Package Inclusions:</h3>
            <ul>
              <li>🚜 1x Skid Steer V900 ({product.colorName})</li>
              <li>🪣 1x Standard Soil Utility Excavator Bucket</li>
              <li>🔧 1x Toolbox, Replacement Filters & Spare Spares</li>
            </ul>
            <p className="optional-attachment-note">
              TYPH-5005M pallet fork shown in the gallery is optional and sold separately for <strong>{formatV900Price(V900_PALLET_FORK_PRICE)}</strong>.
            </p>
          </div>

          <div className="purchase-controls">
            <div className="quantity-selector-panel">
              <span className="qty-label">Quantity:</span>
              <div className="qty-controls">
                <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}>-</button>
                <span>{quantity}</span>
                <button type="button" onClick={() => setQuantity(q => q + 1)}>+</button>
              </div>
            </div>
            <div className="purchase-action-buttons">
              <button
                type="button"
                className="btn-add-to-cart-large"
                onClick={handleAdd}
                disabled={!addToCartEnabled}
              >
                {addToCartEnabled ? 'Add Package To Cart' : 'Cart Purchasing Unavailable'}
              </button>
              <a
                className="btn-buy-now-large"
                href={product.purchaseUrl}
                aria-label={`View ${product.colorName} V900, SKU ${product.purchaseSku}, in the store`}
              >
                <span>Buy on Store — {product.colorName}</span>
                <span className="store-subtext">SKU {product.purchaseSku} → Store Product</span>
              </a>
            </div>
          </div>

          <div className="product-share-inline">
            <span className="share-label">SHARE THIS PRODUCT</span>
            <div className="share-buttons">
              <SocialShareButtons url={getSocialShareUrl()} title={`Check out the ${product.name} on Happy Machinery`} image={activeImage} />
              <button type="button" className="share-btn print" onClick={printProduct} title="Print Product" aria-label="Print Product">
                <svg viewBox="0 0 24 24" width="18" height="18"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
              </button>
              <button type="button" className="share-btn pdf" onClick={downloadPDF} title="Download PDF" aria-label="Download/Save PDF">
                <svg viewBox="0 0 24 24" width="18" height="18"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3.5h-3v1.5h2.5V11H17v1.5h-1.5V7h5v1.5zM9 9.5h1v-1H9v1zm5.5 3h1v-3h-1v3zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z"/></svg>
              </button>
            </div>
          </div>

          {/* Quick Specs Highlight Box */}
          <div className="quick-specs-highlight">
            <div className="quick-spec-item">
              <strong>Engine</strong>
              <span>Kubota Diesel Option</span>
            </div>
            <div className="quick-spec-item">
              <strong>Capacity</strong>
              <span>{product.capacity}</span>
            </div>
            <div className="quick-spec-item">
              <strong>Tracks</strong>
              <span>Anti-Slip Rubber</span>
            </div>
          </div>

          {/* Supplier Verification Card */}
          <div className="supplier-verification-card">
            <div className="sup-logo-wrap">
              <img src="/images/header-logo.png" alt="Happy Machinery" className="sup-logo-img" />
            </div>
            <div className="sup-info-text">
              <strong>Official TYPHON Heavy Equipment Supplier</strong>
              <span>US Nationwide Logistics & Warehouse Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==============================================================================
          FULL SCREEN LIGHTBOX MODAL (DOUBLE CLICK OR ZOOM CLICK)
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
            {/* Lightbox Header Bar */}
            <div className="lightbox-top-bar">
              <div className="lightbox-meta">
                <h3>{product.name}</h3>
                <span className="lightbox-count">Angle {activeImageIndex + 1} of {galleryImages.length}</span>
              </div>

              <div className="lightbox-zoom-actions">
                <button
                  type="button"
                  className="lb-tool-btn"
                  onClick={() => setZoomScale((z) => Math.max(1, +(z - 0.5).toFixed(1)))}
                  title="Zoom Out"
                  aria-label="Zoom Out"
                  disabled={zoomScale <= 1}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                </button>

                <span className="lb-zoom-level">{Math.round(zoomScale * 100)}%</span>

                <button
                  type="button"
                  className="lb-tool-btn"
                  onClick={() => setZoomScale((z) => Math.min(3, +(z + 0.5).toFixed(1)))}
                  title="Zoom In"
                  aria-label="Zoom In"
                  disabled={zoomScale >= 3}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
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
                  title="Close viewer (Esc)"
                  aria-label="Close full screen viewer"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Lightbox Viewing Stage */}
            <div className="lightbox-main-stage">
              <button
                type="button"
                className="lightbox-stage-arrow prev"
                onClick={handlePrevImage}
                title="Previous (Left Arrow)"
                aria-label="Previous image"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <div className="lightbox-img-wrapper">
                <img
                  src={activeImage}
                  alt={`High resolution view of ${product.name}`}
                  style={{ transform: `scale(${zoomScale})` }}
                  className="lightbox-zoom-img"
                />
              </div>

              <button
                type="button"
                className="lightbox-stage-arrow next"
                onClick={handleNextImage}
                title="Next (Right Arrow)"
                aria-label="Next image"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            {/* Bottom Thumbnail Strip in Lightbox */}
            <div className="lightbox-bottom-strip">
              {galleryImages.map((img, idx) => (
                <button
                  key={`lb-thumb-${img}-${idx}`}
                  type="button"
                  className={`lb-thumb-chip ${activeImageIndex === idx ? 'active' : ''}`}
                  onClick={() => {
                    setActiveImageIndex(idx)
                    setZoomScale(1)
                  }}
                  title={`View Angle ${idx + 1}`}
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
