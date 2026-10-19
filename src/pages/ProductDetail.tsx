import { useState, useEffect } from 'react'
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
  const [activeImage, setActiveImage] = useState('')
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'shipping'>('description')
  const [quantity, setQuantity] = useState(1)

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

  const galleryImages = product
    ? Array.from(new Set([
        product.bucketImage,
        ...(adminProduct?.galleryImages ?? []),
        product.forkImage,
      ].filter(Boolean)))
    : []

  useEffect(() => {
    setActiveImage(galleryImages[0] || '')
  }, [id, adminProduct])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  useEffect(() => {
    if (id && productKey !== V900_PRODUCT_SLUGS[id]) {
      navigate(getV900ProductPath(id), { replace: true })
    }
  }, [id, navigate, productKey])

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
        <Link to="/" className="back-link">&larr; Back to Fleet Catalog</Link>
      </div>

      <div className="product-layout-container">
        {/* Gallery / Image Panel */}
        <div className="product-gallery-panel">
          <div className="main-display-view">
            <img 
              src={activeImage || galleryImages[0]}
              alt={`TYPHON STOMP V900 ${product.colorName} mini skid steer — ${product.name}`}
              title={`TYPHON STOMP V900 ${product.colorName} — ${product.name}`}
            />
          </div>
          <div className="gallery-thumbnails">
            {galleryImages.map((image, index) => (
              <button
                key={image}
                className={`thumbnail-btn${(activeImage || galleryImages[0]) === image ? ' active' : ''}`}
                onClick={() => setActiveImage(image)}
              >
                <img
                  src={image}
                  alt={`TYPHON STOMP V900 ${product.colorName} ${image === product.forkImage ? 'with TYPH-5005M pallet fork' : `mini skid steer view ${index + 1}`} — ${product.name}`}
                  title={`TYPHON STOMP V900 ${product.colorName} — ${product.name}`}
                />
                <span>
                  {index === 0
                    ? 'Main Image'
                    : image === product.forkImage
                      ? 'Optional Pallet Fork'
                      : `Gallery ${index}`}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Configurations & Cart Panel */}
        <div className="product-purchase-panel">
          <span className="detail-badge">{product.colorName} Edition</span>
          <h1>{product.name}</h1>
          <p className="detail-sku">
            SKU: <strong>{product.purchaseSku}</strong>
          </p>
          <p className="detail-price">
            {product.originalPrice && (
              <>
                <span className="original-price">${product.originalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="sale-price">${product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="sale-badge-pill">Sale!</span>
              </>
            )}
            {!product.originalPrice && (
              <span>${product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            )}
          </p>
          
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
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}>-</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)}>+</button>
              </div>
            </div>
            <div className="purchase-action-buttons">
              <button className="btn-add-to-cart-large" onClick={handleAdd} disabled={!addToCartEnabled}>
                {addToCartEnabled ? 'Add Package To Cart' : 'Cart Purchasing Unavailable'}
              </button>
              <a
                className="btn-buy-now-large"
                href={product.purchaseUrl}
                aria-label={`View ${product.colorName} V900, SKU ${product.purchaseSku}, in the store`}
              >
                Buy on Store — {product.colorName}
                <span>SKU {product.purchaseSku} → Store Product</span>
              </a>
            </div>
          </div>

          <div className="product-share-inline">
            <span className="share-label">SHARE THIS PRODUCT</span>
            <div className="share-buttons">
              <SocialShareButtons url={getSocialShareUrl()} title={`Check out the ${product.name} on Happy Machinery`} image={activeImage} />
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
        </div>
      </div>

      {/* Social Share Bar */}
      <div className="blog-share-bar product-share-bar">
        <div className="blog-share-provider">
          <span className="provider-label">SUPPLIED BY</span>
          <span className="provider-name">Happy Machinery</span>
          <span className="provider-date">Official TYPHON Fleet Supplier</span>
        </div>
        <div className="blog-share-actions">
          <span className="share-label">SHARE THIS PRODUCT</span>
          <div className="share-buttons">
            <SocialShareButtons url={getSocialShareUrl()} title={`Check out the ${product.name} on Happy Machinery`} image={activeImage} />
            <button className="share-btn print" onClick={printProduct} title="Print Product" aria-label="Print Product">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
            </button>
            <button className="share-btn pdf" onClick={downloadPDF} title="Download PDF" aria-label="Download/Save PDF">
              <svg viewBox="0 0 24 24" width="18" height="18"><path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3.5h-3v1.5h2.5V11H17v1.5h-1.5V7h5v1.5zM9 9.5h1v-1H9v1zm5.5 3h1v-3h-1v3zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs description section */}
      <section className="product-info-tabs-section">
        <div className="tabs-header">
          <button 
            className={`tab-title-btn${activeTab === 'description' ? ' active' : ''}`}
            onClick={() => setActiveTab('description')}
          >
            Overview
          </button>
          <button 
            className={`tab-title-btn${activeTab === 'specifications' ? ' active' : ''}`}
            onClick={() => setActiveTab('specifications')}
          >
            Full Spec Sheet
          </button>
          <button 
            className={`tab-title-btn${activeTab === 'shipping' ? ' active' : ''}`}
            onClick={() => setActiveTab('shipping')}
          >
            Warranty & Shipping
          </button>
        </div>

        <div className="tab-body-content">
          {activeTab === 'description' && (
            <div className="tab-pane-content">
              <h3>Industrial Utility Redefined</h3>
              <p>{product.fullDesc}</p>
              <p style={{ marginTop: '16px' }}>
                Every machine is shipped fully compiled, field-tested, and topped with engine fluid. Simply unlock the controls, attach the pallet forks or the bucket, and you are ready to begin grading or loading.
              </p>
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="tab-pane-content">
              <h3>Technical Specification Grid</h3>
              <table className="details-specs-table">
                <tbody>
                  <tr>
                    <td>Engine Model & Config</td>
                    <td>{product.engine}</td>
                  </tr>
                  <tr>
                    <td>Lifting Operating Capacity</td>
                    <td>{product.capacity}</td>
                  </tr>
                  <tr>
                    <td>Machine Operating Weight</td>
                    <td>{product.weight}</td>
                  </tr>
                  <tr>
                    <td>Auxiliary Hydraulic Flow</td>
                    <td>{product.flow}</td>
                  </tr>
                  <tr>
                    <td>Traction Track Type</td>
                    <td>{product.tracks}</td>
                  </tr>
                  <tr>
                    <td>Maximum Chassis Width</td>
                    <td>{product.width}</td>
                  </tr>
                  <tr>
                    <td>Universal Plate Standard</td>
                    <td>SAE J2513 Skid Steer Spec</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="tab-pane-content">
              <h3>Warranty Policies</h3>
              <p>
                All brand-new heavy machinery purchases include a **1-Year Warranty** on major drive components, engines, and hydraulic pumps. Technical support is always available directly via support@happymachinery.com.
              </p>
              <h3 style={{ marginTop: '24px' }}>Shipping & Lead Times</h3>
              <p>
                We distribute across North America. Deliveries are made via flatbed freight service. Residential liftgate deliveries are supported. Local warehouse pickup options can be coordinated by contacting sales at inquiry time.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
