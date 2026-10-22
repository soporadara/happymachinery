import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { renderMarkdownToReact } from './Blog'
import { getBlogPostPath, getBlogPostSlug, slugify } from '../data/blogUrls'
import './AdminDashboard.css'
import { IMPORTED_CATEGORY_PATHS, IMPORTED_PRODUCTS } from '../data/importedProducts'
import {
  readPersistentContent,
  requestPersistentBrowserStorage,
  writePersistentContent
} from '../data/persistentStorage'
import { readSharedContent, writeSharedContent } from '../data/sharedContentStorage'
import type { CartActivity } from '../data/cartActivity'

import {
  BlogPost,
  AdminProduct,
  MediaItem,
  Inquiry,
  BlogComment,
  DEFAULT_POSTS,
  DEFAULT_PRODUCTS,
  DEFAULT_MEDIA,
  DEFAULT_INQUIRIES,
  DEFAULT_COMMENTS
} from './adminData'

type ProductSection = 'all' | 'add' | 'brands' | 'categories' | 'tags' | 'product-brands' | 'attributes' | 'reviews' | 'size-charts' | 'product-tabs'
type ProductMetaSection = Exclude<ProductSection, 'all' | 'add' | 'reviews'>

const DEFAULT_PRODUCT_META: Record<ProductMetaSection, string[]> = {
  brands: ['TYPHON'],
  categories: IMPORTED_CATEGORY_PATHS,
  tags: ['V900', 'Kubota Diesel', 'Compact Equipment'],
  'product-brands': ['Happy Machinery', 'TYPHON Machinery'],
  attributes: ['Color', 'Engine', 'Operating Capacity', 'Attachment Type'],
  'size-charts': ['V900 Machine Dimensions', 'Attachment Compatibility'],
  'product-tabs': ['Specifications', 'Standard Package', 'Delivery', 'Warranty']
}

const PRODUCT_META_LABELS: Record<ProductMetaSection, { title: string; singular: string; description: string }> = {
  brands: { title: 'Brands', singular: 'brand', description: 'Manage manufacturer names used across product listings.' },
  categories: { title: 'Categories', singular: 'category', description: 'Organize machines, attachments, buckets, and service parts.' },
  tags: { title: 'Tags', singular: 'tag', description: 'Create searchable labels for equipment and product features.' },
  'product-brands': { title: 'Product Brands', singular: 'product brand', description: 'Control the branded collections displayed in the catalog.' },
  attributes: { title: 'Attributes', singular: 'attribute', description: 'Manage reusable product options such as color, engine, and capacity.' },
  'size-charts': { title: 'Size Charts', singular: 'size chart', description: 'Create dimension and compatibility charts for equipment.' },
  'product-tabs': { title: 'Product Tabs', singular: 'product tab', description: 'Control reusable information tabs shown on product pages.' }
}

const parseStoredValue = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

const mergeContentById = <T extends { id: string | number }>(...collections: (T[] | undefined)[]) => {
  const merged = new Map<string | number, T>()
  collections.flatMap((collection) => collection ?? []).forEach((item) => {
    merged.set(item.id, item)
  })
  return Array.from(merged.values())
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [loginError, setLoginError] = useState('')

  useEffect(() => {
    let active = true
    void fetch('/api/admin-auth.php', { credentials: 'same-origin', cache: 'no-store' })
      .then((response) => response.ok ? response.json() : { authenticated: false })
      .then((payload: { authenticated?: boolean }) => {
        if (active) setIsAuthenticated(payload.authenticated === true)
      })
      .catch(() => {
        if (active) setIsAuthenticated(false)
      })
    return () => { active = false }
  }, [])
  
  // Console Tab State
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'cart-activity' | 'blog' | 'media' | 'inquiries' | 'comments' | 'tools'>('overview')

  // Product Management State
  const [products, setProducts] = useState<AdminProduct[]>(() => {
    const saved = localStorage.getItem('happy-machinery-products')
    const savedProducts = parseStoredValue<AdminProduct[]>(saved, DEFAULT_PRODUCTS).map((product) => {
      if (['V900-RED', 'V900-YELLOW', 'V900-BLUE'].includes(product.sku)) {
        return { ...product, category: 'Equipment > Skid Steer Loaders' }
      }
      if (product.sku === 'TYPH-5005M') {
        return {
          ...product,
          category: 'Attachment & Parts > Skid Steer Attachments > Compact Series (501–507)'
        }
      }
      return product
    })
    if (localStorage.getItem('happy-machinery-product-import-v1') === 'complete') {
      return savedProducts
    }
    const savedSkus = new Set(savedProducts.map((product) => product.sku))
    return [
      ...savedProducts,
      ...IMPORTED_PRODUCTS.filter((product) => !savedSkus.has(product.sku))
    ]
  })
  const [isEditingProduct, setIsEditingProduct] = useState(false)
  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  const [productSearch, setProductSearch] = useState('')
  const [productStatusFilter, setProductStatusFilter] = useState<'All' | 'Published' | 'Draft'>('All')
  const [productName, setProductName] = useState('')
  const [productSku, setProductSku] = useState('')
  const [productCategory, setProductCategory] = useState('Mini Skid Steer')
  const [productDescription, setProductDescription] = useState('')
  const [productShortDescription, setProductShortDescription] = useState('')
  const [productSlug, setProductSlug] = useState('')
  const [productBrand, setProductBrand] = useState('TYPHON')
  const [productBuyUrl, setProductBuyUrl] = useState('')
  const [productFeatured, setProductFeatured] = useState(false)
  const [productAddToCartEnabled, setProductAddToCartEnabled] = useState(true)
  const [productGalleryText, setProductGalleryText] = useState('')
  const [productSpecifications, setProductSpecifications] = useState<{ name: string; value: string }[]>([])
  const [productImage, setProductImage] = useState('')
  const [productPrice, setProductPrice] = useState('')
  const [productSalePrice, setProductSalePrice] = useState('')
  const [productStock, setProductStock] = useState('0')
  const [productStatus, setProductStatus] = useState<'Published' | 'Draft'>('Published')
  const [productSection, setProductSection] = useState<ProductSection>('all')
  const [productMeta, setProductMeta] = useState<Record<ProductMetaSection, string[]>>(() => {
    const saved = localStorage.getItem('happy-machinery-product-meta')
    const savedMeta = parseStoredValue<Record<ProductMetaSection, string[]>>(saved, DEFAULT_PRODUCT_META)
    return {
      ...DEFAULT_PRODUCT_META,
      ...savedMeta,
      categories: Array.from(new Set([
        ...(savedMeta.categories ?? []).filter((category) =>
          !['Mini Skid Steer', 'Attachment', 'Bucket', 'Service Part'].includes(category)
        ),
        ...IMPORTED_CATEGORY_PATHS
      ]))
    }
  })
  const [newMetaValue, setNewMetaValue] = useState('')
  const [cartActivity, setCartActivity] = useState<CartActivity[]>([])
  const [cartActivityLoading, setCartActivityLoading] = useState(false)

  // Blog Management State
  const [posts, setPosts] = useState<BlogPost[]>(() => {
    const saved = localStorage.getItem('happy-machinery-blog-posts')
    return parseStoredValue<BlogPost[]>(saved, DEFAULT_POSTS)
  })

  // Media Library State
  const [mediaList, setMediaList] = useState<MediaItem[]>(() => {
    const saved = localStorage.getItem('happy-machinery-media-library')
    return parseStoredValue<MediaItem[]>(saved, DEFAULT_MEDIA)
  })

  // Inquiries State
  const [inquiries, setInquiries] = useState<Inquiry[]>(() => {
    const saved = localStorage.getItem('happy-machinery-inquiries')
    return parseStoredValue<Inquiry[]>(saved, DEFAULT_INQUIRIES)
  })

  // Comments State
  const [comments, setComments] = useState<BlogComment[]>(() => {
    const saved = localStorage.getItem('happy-machinery-comments')
    return parseStoredValue<BlogComment[]>(saved, DEFAULT_COMMENTS)
  })

  // Blog Editor View States
  const [isWriting, setIsWriting] = useState(false)
  const [blogSearchQuery, setBlogSearchQuery] = useState('')
  const [blogFilterTab, setBlogFilterTab] = useState<'All' | 'Published' | 'Draft' | 'Scheduled'>('All')

  // Blog Form State
  const [editingId, setEditingId] = useState<number | null>(null)
  const [postTitle, setPostTitle] = useState('')
  const [postSlug, setPostSlug] = useState('')
  const [postCategory, setPostCategory] = useState('Equipment Guide')
  const [postExcerpt, setPostExcerpt] = useState('')
  const [postContentText, setPostContentText] = useState('')
  const [postTakeawaysText, setPostTakeawaysText] = useState('')
  const [postImage, setPostImage] = useState('')
  const [postAuthor, setPostAuthor] = useState('Antigravity Machinery Team')
  const [postReadTime, setPostReadTime] = useState('5 min read')
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  
  // Link Modal States
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [linkText, setLinkText] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [linkOpenNewTab, setLinkOpenNewTab] = useState(false)
  const [linkNofollow, setLinkNofollow] = useState(false)
  const [linkSponsored, setLinkSponsored] = useState(false)
  const [linkUgc, setLinkUgc] = useState(false)
  const [linkTitleAttribute, setLinkTitleAttribute] = useState('')

  // Media Upload State
  const [newMediaTitle, setNewMediaTitle] = useState('')
  const [newMediaUrl, setNewMediaUrl] = useState('')
  const [contentStorageReady, setContentStorageReady] = useState(false)
  const [productStorageReady, setProductStorageReady] = useState(false)

  // Keep product edits (including image galleries) in the shared server store.
  useEffect(() => {
    let cancelled = false

    const restoreProducts = async () => {
      try {
        const sharedProducts = await readSharedContent<AdminProduct[]>('products')
        if (cancelled) return
        if (sharedProducts !== undefined) {
          setProducts(sharedProducts)
          localStorage.setItem('happy-machinery-products', JSON.stringify(sharedProducts))
        } else {
          await writeSharedContent('products', products)
        }
      } catch (error) {
        console.error('Could not initialize shared product storage.', error)
      } finally {
        if (!cancelled) setProductStorageReady(true)
      }
    }

    void restoreProducts()
    return () => {
      cancelled = true
    }
  }, [])

  // Load the shared server database and migrate each browser's older local copy once.
  useEffect(() => {
    let cancelled = false

    const restorePersistentContent = async () => {
      try {
        const [serverPosts, serverMedia, browserPosts, browserMedia] = await Promise.all([
          readSharedContent<BlogPost[]>('blog-posts').catch(() => undefined),
          readSharedContent<MediaItem[]>('media-library').catch(() => undefined),
          readPersistentContent<BlogPost[]>('blog-posts'),
          readPersistentContent<MediaItem[]>('media-library')
        ])
        if (cancelled) return

        const needsMigration = localStorage.getItem('happy-machinery-shared-content-v1') !== 'complete'
        const restoredPosts = needsMigration
          ? mergeContentById(browserPosts ?? posts, serverPosts)
          : serverPosts ?? browserPosts ?? posts
        const restoredMedia = needsMigration
          ? mergeContentById(browserMedia ?? mediaList, serverMedia)
          : serverMedia ?? browserMedia ?? mediaList

        await Promise.all([
          writeSharedContent('blog-posts', restoredPosts),
          writeSharedContent('media-library', restoredMedia),
          writePersistentContent('blog-posts', restoredPosts),
          writePersistentContent('media-library', restoredMedia)
        ])

        setPosts(restoredPosts)
        setMediaList(restoredMedia)
        localStorage.setItem('happy-machinery-shared-content-v1', 'complete')

        await requestPersistentBrowserStorage()
      } catch (error) {
        console.error('Could not initialize persistent content storage.', error)
      } finally {
        if (!cancelled) setContentStorageReady(true)
      }
    }

    void restorePersistentContent()
    return () => {
      cancelled = true
    }
  }, [])

  // Persist State
  useEffect(() => {
    localStorage.setItem('happy-machinery-products', JSON.stringify(products))
    localStorage.setItem('happy-machinery-product-import-v1', 'complete')
    window.dispatchEvent(new Event('products-updated'))
    if (!productStorageReady) return
    void writeSharedContent('products', products).catch((error) => {
      console.error('Could not save products.', error)
      alert('The product could not be saved to the shared website database. Please try again.')
    })
  }, [products, productStorageReady])

  const refreshCartActivity = async () => {
    setCartActivityLoading(true)
    try {
      setCartActivity(await readSharedContent<CartActivity[]>('cart-activity') ?? [])
    } catch (error) {
      console.error('Could not load cart activity.', error)
    } finally {
      setCartActivityLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    void refreshCartActivity()
  }, [isAuthenticated])

  useEffect(() => {
    localStorage.setItem('happy-machinery-product-meta', JSON.stringify(productMeta))
  }, [productMeta])

  useEffect(() => {
    if (!contentStorageReady) return
    void Promise.all([
      writeSharedContent('blog-posts', posts),
      writePersistentContent('blog-posts', posts)
    ]).catch((error) => {
      console.error('Could not save blog posts to server database.', error)
    })
    try {
      localStorage.setItem('happy-machinery-blog-posts', JSON.stringify(posts))
    } catch {
      // IndexedDB remains the primary copy if localStorage is full.
    }
    window.dispatchEvent(new Event('blog-updated'))
  }, [posts, contentStorageReady])

  useEffect(() => {
    if (!contentStorageReady) return
    void Promise.all([
      writeSharedContent('media-library', mediaList),
      writePersistentContent('media-library', mediaList)
    ]).catch((error) => {
      console.error('Could not save the media library.', error)
    })
    try {
      localStorage.setItem('happy-machinery-media-library', JSON.stringify(mediaList))
    } catch {
      // Uploaded image data can exceed localStorage; IndexedDB is authoritative.
    }
  }, [mediaList, contentStorageReady])

  // Refresh shared content when returning to this browser after editing elsewhere.
  useEffect(() => {
    if (!contentStorageReady) return

    const refreshSharedContent = async () => {
      try {
        const [sharedPosts, sharedMedia] = await Promise.all([
          readSharedContent<BlogPost[]>('blog-posts'),
          readSharedContent<MediaItem[]>('media-library')
        ])
        if (sharedPosts && sharedPosts.length > 0) {
          setPosts((currentLocalPosts) => mergeContentById(currentLocalPosts, sharedPosts))
        }
        if (sharedMedia && sharedMedia.length > 0) {
          setMediaList((currentLocalMedia) => mergeContentById(currentLocalMedia, sharedMedia))
        }
      } catch (error) {
        console.error('Could not refresh shared content.', error)
      }
    }

    window.addEventListener('focus', refreshSharedContent)
    return () => window.removeEventListener('focus', refreshSharedContent)
  }, [contentStorageReady])

  useEffect(() => {
    localStorage.setItem('happy-machinery-inquiries', JSON.stringify(inquiries))
  }, [inquiries])

  useEffect(() => {
    localStorage.setItem('happy-machinery-comments', JSON.stringify(comments))
    window.dispatchEvent(new Event('comments-updated'))
  }, [comments])

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    try {
      const response = await fetch('/api/admin-auth.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ action: 'login', password: passcode })
      })
      const payload = await response.json().catch(() => ({})) as { authenticated?: boolean; error?: string }
      if (!response.ok || payload.authenticated !== true) {
        setLoginError(payload.error || 'Sign-in failed. Please try again.')
        return
      }
      setIsAuthenticated(true)
      setPasscode('')
    } catch {
      setLoginError('Could not connect to the authentication service. Please try again.')
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/admin-auth.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ action: 'logout' })
      })
    } finally {
      setIsAuthenticated(false)
      setPasscode('')
    }
  }

  const resetProductForm = () => {
    setEditingProductId(null)
    setProductName('')
    setProductSku('')
    setProductCategory('Mini Skid Steer')
    setProductDescription('')
    setProductShortDescription('')
    setProductSlug('')
    setProductBrand('TYPHON')
    setProductBuyUrl('')
    setProductFeatured(false)
    setProductAddToCartEnabled(true)
    setProductGalleryText('')
    setProductSpecifications([])
    setProductImage('')
    setProductPrice('')
    setProductSalePrice('')
    setProductStock('0')
    setProductStatus('Published')
  }

  const openNewProduct = () => {
    resetProductForm()
    setProductSection('add')
    setIsEditingProduct(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const openEditProduct = (product: AdminProduct) => {
    setProductSection('all')
    setEditingProductId(product.id)
    setProductName(product.name)
    setProductSku(product.sku)
    setProductCategory(product.category)
    setProductDescription(product.description)
    setProductShortDescription(product.shortDescription ?? '')
    setProductSlug(product.slug ?? getSlug(product.name))
    setProductBrand(product.brand ?? 'TYPHON')
    setProductBuyUrl(product.buyUrl ?? '')
    setProductFeatured(product.featured ?? false)
    setProductAddToCartEnabled(product.addToCartEnabled !== false)
    setProductGalleryText((product.galleryImages ?? []).join('\n'))
    setProductSpecifications(product.specifications ?? [])
    setProductImage(product.image)
    setProductPrice(String(product.price))
    setProductSalePrice(product.salePrice ? String(product.salePrice) : '')
    setProductStock(String(product.stock))
    setProductStatus(product.status)
    setIsEditingProduct(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault()
    const price = Number(productPrice)
    const salePrice = productSalePrice ? Number(productSalePrice) : undefined
    if (!productName.trim() || !productSku.trim() || !productImage.trim() || !Number.isFinite(price) || price <= 0) {
      alert('Please add a product name, SKU, image, and valid price.')
      return
    }
    if (salePrice !== undefined && (!Number.isFinite(salePrice) || salePrice <= 0 || salePrice >= price)) {
      alert('Sale price must be greater than $0 and lower than the regular price.')
      return
    }
    const normalizedSku = productSku.trim().toUpperCase()
    if (products.some((product) => product.sku.trim().toUpperCase() === normalizedSku && product.id !== editingProductId)) {
      alert('This SKU is already assigned to another product. Please use a unique SKU.')
      return
    }

    const savedProduct: AdminProduct = {
      id: editingProductId ?? Date.now(),
      name: productName.trim(),
      sku: normalizedSku,
      category: productCategory,
      description: productDescription.trim(),
      shortDescription: productShortDescription.trim(),
      slug: productSlug.trim() || getSlug(productName),
      brand: productBrand.trim(),
      buyUrl: productBuyUrl.trim(),
      featured: productFeatured,
      addToCartEnabled: productAddToCartEnabled,
      galleryImages: productGalleryText.split(/[\s,]+/).map((url) => url.trim()).filter(Boolean),
      specifications: productSpecifications.filter((spec) => spec.name.trim() || spec.value.trim()),
      image: productImage.trim(),
      price,
      salePrice: salePrice && salePrice > 0 ? salePrice : undefined,
      stock: Math.max(0, Number(productStock) || 0),
      status: productStatus,
      updatedAt: new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    }

    setProducts((current) =>
      editingProductId === null
        ? [savedProduct, ...current]
        : current.map((product) => product.id === editingProductId ? savedProduct : product)
    )
    setIsEditingProduct(false)
    setProductSection('all')
    resetProductForm()
  }

  const handleDeleteProduct = (id: number) => {
    if (confirm('Move this product out of the catalog?')) {
      setProducts((current) => current.filter((product) => product.id !== id))
    }
  }

  const handleToggleProductStatus = (id: number) => {
    setProducts((current) =>
      current.map((product) =>
        product.id === id
          ? { ...product, status: product.status === 'Published' ? 'Draft' : 'Published' }
          : product
      )
    )
  }

  const handleToggleAddToCart = (id: number) => {
    setProducts((current) =>
      current.map((product) =>
        product.id === id
          ? { ...product, addToCartEnabled: product.addToCartEnabled === false }
          : product
      )
    )
  }

  const openProductSection = (section: ProductSection) => {
    setActiveTab('products')
    setProductSection(section)
    setNewMetaValue('')
    if (section === 'add') {
      openNewProduct()
    } else {
      setIsEditingProduct(false)
    }
  }

  const handleAddProductMeta = (section: ProductMetaSection) => {
    const value = newMetaValue.trim()
    if (!value) return
    setProductMeta((current) => ({
      ...current,
      [section]: [...current[section], value]
    }))
    setNewMetaValue('')
  }

  const handleDeleteProductMeta = (section: ProductMetaSection, value: string) => {
    setProductMeta((current) => ({
      ...current,
      [section]: current[section].filter((item) => item !== value)
    }))
  }

  // Helper to generate slugs
  const getSlug = slugify

  // Blog Save
  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault()
    if (!postTitle.trim() || !postExcerpt.trim()) {
      alert('Please fill out at least Title and Excerpt.')
      return
    }

    const finalSlug = getSlug(postSlug.trim() || postTitle)
    if (posts.some((post) => post.id !== editingId && getBlogPostSlug(post) === finalSlug)) {
      alert('That URL slug is already used by another article. Please choose a unique slug.')
      return
    }

    const paragraphs = postContentText
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 0)

    const takeaways = postTakeawaysText
      .split('\n')
      .map((t) => t.trim().replace(/^✓\s*/, ''))
      .filter((t) => t.length > 0)

    const todayStr = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })

    const finalImage = postImage.trim() || '/images/why-choose-v900-jobsite.png'

    if (editingId !== null) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === editingId
            ? {
                ...p,
                slug: finalSlug,
                title: postTitle,
                category: postCategory,
                excerpt: postExcerpt,
                content: paragraphs.length ? paragraphs : [postExcerpt],
                keyTakeaways: takeaways,
                image: finalImage,
                author: postAuthor,
                readTime: postReadTime
              }
            : p
        )
      )
      alert('Blog post updated successfully!')
    } else {
      const newPost: BlogPost = {
        id: Date.now(),
        slug: finalSlug,
        title: postTitle,
        category: postCategory,
        excerpt: postExcerpt,
        content: paragraphs.length ? paragraphs : [postExcerpt],
        keyTakeaways: takeaways,
        image: finalImage,
        date: todayStr,
        readTime: postReadTime || '4 min read',
        author: postAuthor || 'Equipment Specialist'
      }
      setPosts((prev) => [newPost, ...prev])
      alert('New blog post published live!')
    }

    resetBlogForm()
    setIsWriting(false)
  }

  const handleEditClick = (post: BlogPost) => {
    setEditingId(post.id)
    setPostSlug(getBlogPostSlug(post))
    setPostTitle(post.title)
    setPostCategory(post.category)
    setPostExcerpt(post.excerpt)
    setPostContentText(post.content.join('\n\n'))
    setPostTakeawaysText(post.keyTakeaways.join('\n'))
    setPostImage(post.image)
    setPostAuthor(post.author)
    setPostReadTime(post.readTime)
    setIsWriting(true) // Open writing editor screen
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeletePost = (id: number) => {
    if (confirm('Are you sure you want to delete this blog post?')) {
      setPosts((prev) => prev.filter((p) => p.id !== id))
    }
  }

  const resetBlogForm = () => {
    setEditingId(null)
    setPostTitle('')
    setPostSlug('')
    setPostCategory('Equipment Guide')
    setPostExcerpt('')
    setPostContentText('')
    setPostTakeawaysText('')
    setPostImage('')
    setPostAuthor('Antigravity Machinery Team')
    setPostReadTime('5 min read')
  }

  // Link Modal Handlers
  const handleToolbarLinkClick = () => {
    const textarea = document.getElementById('post-content') as HTMLTextAreaElement
    let selectedText = ''
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      selectedText = textarea.value.substring(start, end)
    }
    setLinkText(selectedText || '')
    setLinkUrl('')
    setLinkOpenNewTab(false)
    setLinkNofollow(false)
    setLinkSponsored(false)
    setLinkUgc(false)
    setLinkTitleAttribute('')
    setIsLinkModalOpen(true)
  }

  const handleAddLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkUrl.trim()) return

    const text = linkText.trim() || 'Link'
    const url = linkUrl.trim()

    let linkCode = ''
    const rels = []
    if (linkNofollow) rels.push('nofollow')
    if (linkSponsored) rels.push('sponsored')
    if (linkUgc) rels.push('ugc')

    if (linkOpenNewTab || rels.length > 0 || linkTitleAttribute.trim()) {
      const targetAttr = linkOpenNewTab ? ' target="_blank"' : ''
      const relAttr = rels.length > 0 ? ` rel="${rels.join(' ')}"` : (linkOpenNewTab ? ' rel="noopener noreferrer"' : '')
      const titleAttr = linkTitleAttribute.trim() ? ` title="${linkTitleAttribute.trim()}"` : ''
      linkCode = `<a href="${url}"${targetAttr}${relAttr}${titleAttr}>${text}</a>`
    } else {
      linkCode = `[${text}](${url})`
    }

    const textarea = document.getElementById('post-content') as HTMLTextAreaElement
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const textBefore = postContentText.substring(0, start)
      const textAfter = postContentText.substring(end)
      setPostContentText(textBefore + linkCode + textAfter)
    } else {
      setPostContentText(prev => prev + '\n' + linkCode + '\n')
    }

    setIsLinkModalOpen(false)
  }

  // Media File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const newMedia: MediaItem = {
        id: Date.now().toString(),
        title: file.name.replace(/\.[^/.]+$/, ''),
        url: dataUrl,
        dateAdded: new Date().toISOString().split('T')[0],
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
      }
      setMediaList((prev) => [newMedia, ...prev])
      alert(`Image "${file.name}" uploaded to Store!`)
    }
    reader.readAsDataURL(file)
  }

  const handleAddMediaUrl = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMediaUrl.trim()) return

    const newMedia: MediaItem = {
      id: Date.now().toString(),
      title: newMediaTitle.trim() || 'Custom Machinery Asset',
      url: newMediaUrl.trim(),
      dateAdded: new Date().toISOString().split('T')[0],
      size: 'Web URL'
    }
    setMediaList((prev) => [newMedia, ...prev])
    setNewMediaTitle('')
    setNewMediaUrl('')
    alert('Image URL saved to Media Store!')
  }

  const handleDeleteMedia = (id: string) => {
    if (confirm('Remove this image from your Media Store?')) {
      setMediaList((prev) => prev.filter((m) => m.id !== id))
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  // Inquiries Actions
  const handleInquiryStatusChange = (id: number, status: Inquiry['status']) => {
    setInquiries((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status } : i))
    )
  }

  const handleDeleteInquiry = (id: number) => {
    if (confirm('Delete this inquiry record?')) {
      setInquiries((prev) => prev.filter((i) => i.id !== id))
    }
  }

  // Comments Actions
  const handleCommentStatusChange = (id: number, status: BlogComment['status']) => {
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    )
  }

  const handleReplyToComment = (id: number) => {
    const replyText = window.prompt('Reply as Happy Machinery')
    if (!replyText?.trim()) return
    setComments((prev) => prev.map((item) => item.id === id ? {
      ...item, replies: [...(item.replies || []), { id: Date.now(), author: 'Happy Machinery', text: replyText.trim(), date: new Date().toISOString().slice(0, 10), isSeller: true }]
    } : item))
  }

  const handleDeleteComment = (id: number) => {
    if (confirm('Delete this comment permanently?')) {
      setComments((prev) => prev.filter((c) => c.id !== id))
    }
  }

  // Export & Import Handlers (Hostinger styles)
  const handleExportData = () => {
    const dataStr = JSON.stringify({ products, productMeta, posts, mediaList, inquiries, comments }, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)
    const exportFileDefaultName = 'happymachinery_backup_' + new Date().toISOString().split('T')[0] + '.json'
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  const handleResetDefaults = () => {
    if (confirm('Reset website articles to factory default presets?')) {
      setPosts(DEFAULT_POSTS)
      alert('Articles database reset completed!')
    }
  }

  // Auth screen
  if (!isAuthenticated) {
    return (
      <div className="page admin-login-page">
        <div className="admin-login-card">
          <div className="admin-badge">Admin Access</div>
          <h2>Machinery Control Portal</h2>
          <p>Manage blog posts, upload jobsite media, and control content assets.</p>

          <form onSubmit={handleLogin} className="admin-login-form">
            <div className="form-group">
              <label htmlFor="admin-passcode">Password / Passcode</label>
              <input
                id="admin-passcode"
                type="password"
                placeholder="Enter admin password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                autoFocus
              />
            </div>
            {loginError && <p className="login-error-msg">{loginError}</p>}
            <button type="submit" className="btn btn-primary btn-login">
              Unlock Dashboard &rarr;
            </button>
          </form>
        </div>
      </div>
    )
  }

  const pendingCommentsCount = comments.filter(c => c.status === 'Pending').length
  const newInquiriesCount = inquiries.filter(i => i.status === 'New').length

  // Filter logic for full-width search
  const filteredPosts = posts.filter((post) => {
    const query = blogSearchQuery.toLowerCase()
    const matchesSearch =
      post.title.toLowerCase().includes(query) ||
      post.excerpt.toLowerCase().includes(query) ||
      post.category.toLowerCase().includes(query)
    
    return matchesSearch
  })

  const filteredProducts = products.filter((product) => {
    const query = productSearch.trim().toLowerCase()
    const matchesSearch =
      product.name.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    const matchesStatus = productStatusFilter === 'All' || product.status === productStatusFilter
    return matchesSearch && matchesStatus
  })

  const categoryProductCount = (category: string) =>
    products.filter((product) =>
      product.category === category || product.category.startsWith(`${category} > `)
    ).length

  const adminSectionCopy = {
    overview: ['Dashboard', 'Overview of catalog activity, content, inquiries, and moderation.'],
    products: ['Products', 'Create, edit, price, publish, and manage equipment listings.'],
    'cart-activity': ['Cart Activity', 'See which products customers are adding to their carts.'],
    blog: ['All Posts', 'Search, edit, publish, and manage your written articles.'],
    media: ['Media Library', 'Upload and organize product and jobsite imagery.'],
    inquiries: ['Customer Inquiries', 'Review quote requests and manage lead progress.'],
    comments: ['Comments', 'Moderate customer discussions and publish helpful replies.'],
    tools: ['Settings & Tools', 'Back up or restore website content and catalog data.']
  } as const

  return (
    <div className="console-wrapper">
      {/* Sidebar Navigation */}
      <aside className="console-sidebar">
        <div className="sidebar-brand">
          <span className="admin-brand-mark">V</span>
          <div>
            <span className="brand-eyebrow">Admin Portal</span>
            <h2>V900 Dashboard</h2>
          </div>
        </div>

        <nav className="sidebar-menu">
          <button
            className={`menu-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="menu-icon">📊</span> Overview
          </button>
          <div className={`product-menu-group ${activeTab === 'products' ? 'open' : ''}`}>
            <button
              className={`menu-item product-menu-parent ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => openProductSection('all')}
            >
              <span className="menu-icon">▰</span> Products
              <span className="product-menu-arrow">⌄</span>
            </button>
            {activeTab === 'products' && (
              <div className="product-submenu">
                <button className={productSection === 'all' ? 'active' : ''} onClick={() => openProductSection('all')}>All Products</button>
                <button className={productSection === 'add' ? 'active' : ''} onClick={() => openProductSection('add')}>Add new product</button>
                <button className={productSection === 'brands' ? 'active' : ''} onClick={() => openProductSection('brands')}>Brands</button>
                <button className={productSection === 'categories' ? 'active' : ''} onClick={() => openProductSection('categories')}>Categories</button>
                <button className={productSection === 'tags' ? 'active' : ''} onClick={() => openProductSection('tags')}>Tags</button>
                <button className={productSection === 'product-brands' ? 'active' : ''} onClick={() => openProductSection('product-brands')}>Product Brands</button>
                <button className={productSection === 'attributes' ? 'active' : ''} onClick={() => openProductSection('attributes')}>Attributes</button>
                <button className={productSection === 'reviews' ? 'active' : ''} onClick={() => openProductSection('reviews')}>Reviews</button>
                <button className={productSection === 'size-charts' ? 'active' : ''} onClick={() => openProductSection('size-charts')}>Size Charts</button>
                <button className={productSection === 'product-tabs' ? 'active' : ''} onClick={() => openProductSection('product-tabs')}>Product Tabs</button>
              </div>
            )}
          </div>
          <button
            className={`menu-item ${activeTab === 'cart-activity' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('cart-activity')
              void refreshCartActivity()
            }}
          >
            <span className="menu-icon">🛒</span> Cart Activity
            {cartActivity.length > 0 && <span className="sidebar-badge">{cartActivity.length}</span>}
          </button>
          <button
            className={`menu-item ${activeTab === 'blog' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('blog')
              setIsWriting(false) // always start at list view
            }}
          >
            <span className="menu-icon">📝</span> Blog Posts
          </button>
          <button
            className={`menu-item ${activeTab === 'media' ? 'active' : ''}`}
            onClick={() => setActiveTab('media')}
          >
            <span className="menu-icon">🖼️</span> Image Store
          </button>
          <button
            className={`menu-item ${activeTab === 'inquiries' ? 'active' : ''}`}
            onClick={() => setActiveTab('inquiries')}
          >
            <span className="menu-icon">📥</span> Inquiries {newInquiriesCount > 0 && <span className="sidebar-badge red">{newInquiriesCount}</span>}
          </button>
          <button
            className={`menu-item ${activeTab === 'comments' ? 'active' : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            <span className="menu-icon">💬</span> Comments {pendingCommentsCount > 0 && <span className="sidebar-badge">{pendingCommentsCount}</span>}
          </button>
          <button
            className={`menu-item ${activeTab === 'tools' ? 'active' : ''}`}
            onClick={() => setActiveTab('tools')}
          >
            <span className="menu-icon">🚨</span> Admin Tools
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="admin-user-card">
            <span className="admin-user-avatar">HM</span>
            <div>
              <strong>Administrator</strong>
              <small>Happy Machinery</small>
            </div>
          </div>
          <button className="btn-sidebar-logout" onClick={handleLogout}>
            ↪ Logout
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="console-main">
        {/* Header Bar */}
        <header className="console-header">
          <div>
            <span className="header-kicker">Dashboard Portal · Admin/{activeTab}</span>
            <h1>{adminSectionCopy[activeTab][0]}</h1>
            <p className="header-subtext">{adminSectionCopy[activeTab][1]}</p>
          </div>
          <div className="header-actions">
            <Link to="/" className="btn btn-secondary btn-sm" target="_blank">
              View Site ↗
            </Link>
            <span className="header-admin-label"><span>HM</span> Admin</span>
          </div>
        </header>

        {/* TAB 1: OVERVIEW SCREEN */}
        {activeTab === 'overview' && (
          <div className="console-content">
            {/* Stat Cards Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon-wrapper blue">📥</div>
                <div className="stat-details">
                  <span className="stat-label">Total Inquiries</span>
                  <strong className="stat-number">{inquiries.length}</strong>
                  <span className="stat-change positive">↑ 12% this week</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper green">💬</div>
                <div className="stat-details">
                  <span className="stat-label">Active Comments</span>
                  <strong className="stat-number">{comments.filter(c => c.status === 'Approved').length}</strong>
                  <span className="stat-change positive">↑ 4% this week</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper orange">📝</div>
                <div className="stat-details">
                  <span className="stat-label">Blog Articles</span>
                  <strong className="stat-number">{posts.length}</strong>
                  <span className="stat-sub">Published posts</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon-wrapper purple">⚙️</div>
                <div className="stat-details">
                  <span className="stat-label">Catalog Items</span>
                  <strong className="stat-number">{products.length}</strong>
                  <span className="stat-sub">{products.filter(product => product.status === 'Published').length} published</span>
                </div>
              </div>
            </div>

            {/* Quick Action Tiles */}
            <div className="quick-actions-row">
              <div className="action-tile" onClick={() => { setActiveTab('products'); openNewProduct(); }}>
                <span className="tile-tag sales">Catalog</span>
                <h4>Add a new product</h4>
                <p>Create equipment or attachment listings with pricing, stock, and status.</p>
              </div>

              <div className="action-tile" onClick={() => { setActiveTab('blog'); setIsWriting(false); }}>
                <span className="tile-tag write">Write</span>
                <h4>Post a new blog</h4>
                <p>Create articles with image, category, tags, SEO, and sections.</p>
              </div>

              <div className="action-tile" onClick={() => setActiveTab('comments')}>
                <span className="tile-tag moderate">Moderate</span>
                <h4>{pendingCommentsCount} pending comments</h4>
                <p>Approve useful comments or remove spam from blog posts.</p>
              </div>

              <div className="action-tile" onClick={() => setActiveTab('inquiries')}>
                <span className="tile-tag sales">Sales</span>
                <h4>{newInquiriesCount} customer inquiries</h4>
                <p>Track quote requests and update lead status.</p>
              </div>

            </div>

            {/* Analytics Lists */}
            <div className="analytics-layout-grid">
              <div className="analytics-card">
                <h3>Top Viewed Equipment (Analytics)</h3>
                <p className="card-subtext">Page views count per product</p>
                <div className="analytics-list">
                  <div className="analytics-row-item">
                    <span>TYPHON V900 Compact Track Loader</span>
                    <strong>1,894 views</strong>
                  </div>
                  <div className="analytics-row-item">
                    <span>Universal Pallet Fork Attachment</span>
                    <strong>1,241 views</strong>
                  </div>
                  <div className="analytics-row-item">
                    <span>Heavy Duty Trencher Attachment</span>
                    <strong>843 views</strong>
                  </div>
                  <div className="analytics-row-item">
                    <span>Industrial Augers & Drill Bits</span>
                    <strong>529 views</strong>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <h3>Top Viewed Blog Posts (Analytics)</h3>
                <p className="card-subtext">Page views count per article</p>
                <div className="analytics-list">
                  {posts.slice(0, 4).map((post) => (
                    <div key={post.id} className="analytics-row-item">
                      <span>{post.title}</span>
                      <strong>{Math.floor(post.id / 100000000) || 128} views</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCT MANAGER */}
        {activeTab === 'products' && (
          <div className="console-content">
            {!isEditingProduct && productSection === 'all' ? (
              <section className="product-manager">
                <div className="list-controls-header">
                  <div>
                    <span className="list-kicker">Store Catalog</span>
                    <h2 className="list-title">All Products</h2>
                    <span className="list-meta-info">
                      {products.length} total &bull; {products.filter(product => product.status === 'Published').length} published &bull; {products.filter(product => product.status === 'Draft').length} drafts
                    </span>
                  </div>
                  <button className="btn btn-primary" onClick={openNewProduct}>
                    + Add Product
                  </button>
                </div>

                <div className="product-admin-stats">
                  <div><span>Total Products</span><strong>{products.length}</strong></div>
                  <div><span>Published</span><strong>{products.filter(product => product.status === 'Published').length}</strong></div>
                  <div><span>Drafts</span><strong>{products.filter(product => product.status === 'Draft').length}</strong></div>
                  <div><span>Low Stock</span><strong>{products.filter(product => product.stock < 3).length}</strong></div>
                </div>

                <div className="product-filter-bar">
                  <input
                    type="search"
                    placeholder="Search by product name, SKU, or category..."
                    value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)}
                  />
                  <select
                    value={productStatusFilter}
                    onChange={(event) => setProductStatusFilter(event.target.value as 'All' | 'Published' | 'Draft')}
                  >
                    <option value="All">All statuses</option>
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>

                <div className="product-admin-table-wrap">
                  <table className="product-admin-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>SKU</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Status</th>
                        <th>Add to Cart</th>
                        <th>Updated</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id}>
                          <td>
                            <div className="product-admin-identity">
                              <img src={product.image} alt="" />
                              <div>
                                <strong>{product.name}</strong>
                                <span>{product.description || 'No description added.'}</span>
                              </div>
                            </div>
                          </td>
                          <td><code>{product.sku}</code></td>
                          <td>{product.category}</td>
                          <td>
                            <div className="product-admin-price">
                              <strong>${(product.salePrice ?? product.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                              {product.salePrice && <span>${product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>}
                            </div>
                          </td>
                          <td><span className={product.stock < 3 ? 'stock-low' : ''}>{product.stock}</span></td>
                          <td>
                            <button
                              className={`product-status ${product.status.toLowerCase()}`}
                              onClick={() => handleToggleProductStatus(product.id)}
                              title="Click to change status"
                            >
                              {product.status}
                            </button>
                          </td>
                          <td>
                            <button
                              className={`product-status ${product.addToCartEnabled === false ? 'draft' : 'published'}`}
                              onClick={() => handleToggleAddToCart(product.id)}
                              title="Click to enable or disable Add to Cart"
                            >
                              {product.addToCartEnabled === false ? 'Disabled' : 'Enabled'}
                            </button>
                          </td>
                          <td>{product.updatedAt}</td>
                          <td>
                            <div className="product-row-actions">
                              <button onClick={() => openEditProduct(product)}>Edit</button>
                              <button className="danger" onClick={() => handleDeleteProduct(product.id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredProducts.length === 0 && (
                    <div className="no-row-results">
                      <h4>No products found</h4>
                      <p>Change your filters or add a new product.</p>
                    </div>
                  )}
                </div>
              </section>
            ) : !isEditingProduct && productSection === 'reviews' ? (
              <section className="product-meta-manager">
                <div className="list-controls-header">
                  <div>
                    <span className="list-kicker">Product Menu</span>
                    <h2 className="list-title">Product Reviews</h2>
                    <span className="list-meta-info">Moderate ratings and feedback attached to products.</span>
                  </div>
                </div>
                <div className="admin-card product-review-summary">
                  <div><span>Total Reviews</span><strong>0</strong></div>
                  <div><span>Pending</span><strong>0</strong></div>
                  <div><span>Approved</span><strong>0</strong></div>
                  <div><span>Average Rating</span><strong>—</strong></div>
                </div>
                <div className="admin-card product-meta-empty">
                  <span>☆</span>
                  <h3>No product reviews yet</h3>
                  <p>Customer product reviews will appear here for moderation.</p>
                </div>
              </section>
            ) : !isEditingProduct && productSection !== 'add' ? (
              <section className="product-meta-manager">
                <div className="list-controls-header">
                  <div>
                    <span className="list-kicker">Product Menu</span>
                    <h2 className="list-title">{PRODUCT_META_LABELS[productSection as ProductMetaSection].title}</h2>
                    <span className="list-meta-info">{PRODUCT_META_LABELS[productSection as ProductMetaSection].description}</span>
                  </div>
                </div>
                <div className="product-meta-layout">
                  <form className="admin-card product-meta-create" onSubmit={(event) => {
                    event.preventDefault()
                    handleAddProductMeta(productSection as ProductMetaSection)
                  }}>
                    <h3>Add New {PRODUCT_META_LABELS[productSection as ProductMetaSection].singular}</h3>
                    <label htmlFor="new-product-meta-name">Name</label>
                    <input
                      id="new-product-meta-name"
                      value={newMetaValue}
                      onChange={(event) => setNewMetaValue(event.target.value)}
                      placeholder={`Enter ${PRODUCT_META_LABELS[productSection as ProductMetaSection].singular} name`}
                    />
                    <button className="btn btn-primary" type="submit">Add {PRODUCT_META_LABELS[productSection as ProductMetaSection].singular}</button>
                  </form>
                  <div className="admin-card product-meta-list">
                    <div className="product-meta-list-head">
                      <strong>Name</strong>
                      <span>Items</span>
                      <span>Actions</span>
                    </div>
                    {productMeta[productSection as ProductMetaSection].map((value) => {
                      const categoryParts = value.split(' > ')
                      const displayValue = productSection === 'categories' ? categoryParts[categoryParts.length - 1] : value
                      return (
                      <div
                        className={`product-meta-list-row ${productSection === 'categories' ? 'category-tree-row' : ''}`}
                        style={productSection === 'categories' ? { '--category-depth': categoryParts.length - 1 } as React.CSSProperties : undefined}
                        data-category-depth={productSection === 'categories' ? categoryParts.length - 1 : undefined}
                        key={value}
                      >
                        <strong>{displayValue}</strong>
                        <span>{productSection === 'categories' ? categoryProductCount(value) : 0}</span>
                        <button type="button" onClick={() => handleDeleteProductMeta(productSection as ProductMetaSection, value)}>Delete</button>
                      </div>
                      )
                    })}
                    {productMeta[productSection as ProductMetaSection].length === 0 && <p className="product-meta-list-empty">No items created yet.</p>}
                  </div>
                </div>
              </section>
            ) : (
              <form className="product-create-page" onSubmit={handleSaveProduct}>
                <div className="product-create-heading">
                  <button type="button" onClick={() => { setIsEditingProduct(false); setProductSection('all') }}>← Back to Products</button>
                  <div>
                    <h2>{editingProductId === null ? 'Create Product' : 'Edit Product'}</h2>
                    <span className={`product-status ${productStatus.toLowerCase()}`}>{productStatus}</span>
                  </div>
                </div>

                <div className="product-create-grid">
                  <div className="product-create-main">
                    <section className="admin-card product-form-section">
                      <div className="form-group">
                        <label htmlFor="product-name">Product Title</label>
                        <input id="product-name" value={productName} onChange={(event) => {
                          setProductName(event.target.value)
                          if (editingProductId === null) setProductSlug(getSlug(event.target.value))
                        }} required />
                      </div>
                      <div className="form-group">
                        <label htmlFor="product-slug">URL Slug</label>
                        <input id="product-slug" value={productSlug} onChange={(event) => setProductSlug(getSlug(event.target.value))} placeholder="skid-steer-v900-red" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="product-short-description">Short Description</label>
                        <textarea id="product-short-description" rows={2} value={productShortDescription} onChange={(event) => setProductShortDescription(event.target.value)} />
                      </div>
                      <div className="form-group">
                        <label htmlFor="product-description">Description</label>
                        <textarea id="product-description" rows={5} value={productDescription} onChange={(event) => setProductDescription(event.target.value)} />
                      </div>

                      <div className="specification-editor">
                        <div className="specification-heading">
                          <label>Specifications</label>
                          <button type="button" onClick={() => setProductSpecifications((current) => [...current, { name: '', value: '' }])}>+ Add Spec</button>
                        </div>
                        {productSpecifications.length === 0 && <p>No specifications added yet.</p>}
                        {productSpecifications.map((specification, index) => (
                          <div className="specification-row" key={`${index}-${specification.name}`}>
                            <input
                              aria-label="Specification name"
                              placeholder="Specification"
                              value={specification.name}
                              onChange={(event) => setProductSpecifications((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))}
                            />
                            <input
                              aria-label="Specification value"
                              placeholder="Value"
                              value={specification.value}
                              onChange={(event) => setProductSpecifications((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item))}
                            />
                            <button type="button" aria-label="Remove specification" onClick={() => setProductSpecifications((current) => current.filter((_, itemIndex) => itemIndex !== index))}>×</button>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="admin-card product-form-section">
                      <h3>Pricing & Inventory</h3>
                      <div className="product-pricing-grid">
                        <div className="form-group">
                          <label htmlFor="product-price">Regular Price</label>
                          <div className="currency-input"><span>$</span><input id="product-price" type="number" min="0" step="0.01" value={productPrice} onChange={(event) => setProductPrice(event.target.value)} required /></div>
                        </div>
                        <div className="form-group">
                          <label htmlFor="product-sale-price">Sale Price</label>
                          <div className="currency-input"><span>$</span><input id="product-sale-price" type="number" min="0" step="0.01" value={productSalePrice} onChange={(event) => setProductSalePrice(event.target.value)} /></div>
                        </div>
                        <div className="form-group">
                          <label htmlFor="product-stock">Stock Quantity</label>
                          <input id="product-stock" type="number" min="0" step="1" value={productStock} onChange={(event) => setProductStock(event.target.value)} />
                        </div>
                        <div className="form-group">
                          <label htmlFor="product-sku">SKU</label>
                          <input id="product-sku" value={productSku} onChange={(event) => setProductSku(event.target.value)} required />
                        </div>
                      </div>
                    </section>
                  </div>

                  <aside className="product-create-sidebar">
                    <section className="admin-card product-publish-card">
                      <button type="submit" className="btn btn-primary">{editingProductId === null ? 'Publish Product' : 'Save Product'}</button>
                      <select value={productStatus} onChange={(event) => setProductStatus(event.target.value as 'Published' | 'Draft')}>
                        <option value="Published">Publish immediately</option>
                        <option value="Draft">Save as draft</option>
                      </select>
                    </section>

                    <section className="admin-card product-form-section">
                      <h3>Organization</h3>
                      <div className="form-group"><label htmlFor="product-brand">Brand</label><input id="product-brand" value={productBrand} onChange={(event) => setProductBrand(event.target.value)} /></div>
                      <div className="form-group">
                        <label htmlFor="product-category">Category</label>
                        <select id="product-category" value={productCategory} onChange={(event) => setProductCategory(event.target.value)}>
                          {productMeta.categories.map((category) => {
                            const levels = category.split(' > ')
                            return (
                              <option value={category} key={category}>
                                {`${'— '.repeat(Math.max(0, levels.length - 1))}${levels[levels.length - 1]}`}
                              </option>
                            )
                          })}
                        </select>
                      </div>
                    </section>

                    <section className="admin-card product-form-section">
                      <h3>External Link</h3>
                      <div className="form-group"><label htmlFor="product-buy-url">Buy on Store URL</label><input id="product-buy-url" type="url" value={productBuyUrl} onChange={(event) => setProductBuyUrl(event.target.value)} placeholder="https://..." /></div>
                    </section>

                    <section className="admin-card product-form-section">
                      <h3>Visibility & Status</h3>
                      <label className="product-feature-check"><input type="checkbox" checked={productFeatured} onChange={(event) => setProductFeatured(event.target.checked)} /> Feature this product</label>
                      <label className="product-feature-check"><input type="checkbox" checked={productAddToCartEnabled} onChange={(event) => setProductAddToCartEnabled(event.target.checked)} /> Enable Add to Cart for customers</label>
                    </section>

                    <section className="admin-card product-form-section">
                      <h3>Media</h3>
                      <div className="form-group"><label htmlFor="product-image">Main Image URL</label><input id="product-image" value={productImage} onChange={(event) => setProductImage(event.target.value)} required /></div>
                      {productImage && <div className="compact-product-image"><img src={productImage} alt="" /></div>}
                      <div className="form-group"><label htmlFor="product-gallery">Gallery Images (one URL per line)</label><textarea id="product-gallery" rows={4} value={productGalleryText} onChange={(event) => setProductGalleryText(event.target.value)} placeholder="/images/image1.jpg&#10;/images/image2.jpg" /></div>
                      {productGalleryText.split(/[\s,]+/).map((url) => url.trim()).filter(Boolean).length > 0 && (
                        <div className="gallery-previews-container">
                          {productGalleryText.split(/[\s,]+/).map((url) => url.trim()).filter(Boolean).map((url, idx) => (
                            <div key={idx} className="gallery-preview-item">
                              <img src={url} alt={`Gallery Preview ${idx + 1}`} />
                            </div>
                          ))}
                        </div>
                      )}
                    </section>
                  </aside>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: BLOG POST MANAGER (List View or Editor toggle) */}
        {activeTab === 'cart-activity' && (
          <section className="admin-card cart-activity-panel">
            <div className="list-controls-header">
              <div>
                <span className="section-kicker">Customer intent</span>
                <h2 className="list-title">Recent Add-to-Cart Activity</h2>
                <p>Anonymous cart events from the Happy Machinery product pages. No customer personal information is collected here.</p>
              </div>
              <button className="btn-primary-admin" type="button" onClick={() => void refreshCartActivity()}>
                Refresh Activity
              </button>
            </div>

            <div className="cart-activity-summary">
              <div><span>Events</span><strong>{cartActivity.length}</strong></div>
              <div><span>Units Added</span><strong>{cartActivity.reduce((total, event) => total + event.quantity, 0)}</strong></div>
              <div><span>Cart Value</span><strong>${cartActivity.reduce((total, event) => total + event.total, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></div>
            </div>

            <div className="table-responsive">
              <table className="console-table cart-activity-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Value</th>
                    <th>Added</th>
                    <th>Session</th>
                  </tr>
                </thead>
                <tbody>
                  {cartActivity.map((event) => (
                    <tr key={event.id}>
                      <td>
                        <div className="cart-activity-product">
                          {event.image && <img src={event.image} alt="" />}
                          <div><strong>{event.productName}</strong><span>Product #{event.productId}</span></div>
                        </div>
                      </td>
                      <td>{event.quantity}</td>
                      <td>${event.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td>{new Date(event.occurredAt).toLocaleString()}</td>
                      <td><code>{event.sessionId.slice(0, 8)}</code></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!cartActivityLoading && cartActivity.length === 0 && (
                <div className="no-row-results"><h4>No cart activity yet</h4><p>New customer Add to Cart actions will appear here.</p></div>
              )}
              {cartActivityLoading && <div className="no-row-results"><p>Loading cart activity…</p></div>}
            </div>
          </section>
        )}

        {activeTab === 'blog' && (
          <div className="console-content">
            {!isWriting ? (
              /* VIEW 1: FULL WIDTH CONTENT LIST SCREEN (Matches Hostinger/Konstructz screenshot) */
              <div className="admin-full-list-view">
                {/* List Header controls */}
                <div className="list-controls-header">
                  <div>
                    <span className="list-kicker">Content List</span>
                    <h2 className="list-title">{posts.length} Articles</h2>
                    <span className="list-meta-info">
                      {posts.length} published &bull; 0 drafts &bull; 0 scheduled
                    </span>
                  </div>
                  <div className="list-action-buttons">
                    <button className="btn btn-primary" onClick={() => { resetBlogForm(); setIsWriting(true); }}>
                      + Write New Article
                    </button>
                    <button className="btn btn-outline" onClick={handleResetDefaults}>
                      Reset Default Posts
                    </button>
                    <button className="btn btn-outline" onClick={handleExportData}>
                      Export Blog Data
                    </button>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="list-search-filter-row">
                  <div className="search-input-wrapper">
                    <input
                      type="text"
                      placeholder="Search by title, category, or excerpt..."
                      value={blogSearchQuery}
                      onChange={(e) => setBlogSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="filter-pill-selector">
                    {(['All', 'Published', 'Draft', 'Scheduled'] as const).map((tab) => (
                      <button
                        key={tab}
                        className={`filter-tab-pill ${blogFilterTab === tab ? 'active' : ''}`}
                        onClick={() => setBlogFilterTab(tab)}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wide Card Rows */}
                <div className="wide-articles-list">
                  {filteredPosts.map((post) => (
                    <div key={post.id} className="wide-article-row">
                      <div className="row-thumbnail">
                        <img src={post.image} alt={post.title} />
                      </div>

                      <div className="row-details">
                        <div className="row-tag-line">
                          <span className="row-cat-tag">{post.category}</span>
                          <span className="row-status-badge">Published</span>
                        </div>
                        <h3 className="row-title">{post.title}</h3>
                        <p className="row-excerpt">{post.excerpt}</p>
                        <span className="row-slug-meta">
                          URL: <code>{getBlogPostPath(post)}</code> &bull; Updated: {post.date}
                        </span>
                      </div>

                      <div className="row-actions">
                        <button className="btn-row-edit" onClick={() => handleEditClick(post)}>
                          Edit
                        </button>
                        <button className="btn-row-delete" onClick={() => handleDeletePost(post.id)}>
                          Delete
                        </button>
                        <div className="row-hashtag-pills">
                          <span>#machinery</span>
                          <span>#operator</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredPosts.length === 0 && (
                    <div className="no-row-results">
                      <h4>No Articles Found</h4>
                      <p>Try modifying your search or check that your filter tab matches active posts.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* VIEW 2: WRITING/EDITOR VIEW (Full Width split page layout) */
              <div className="admin-split-layout">
                {/* Left: Blog Form Card */}
                <div className="admin-card blog-form-card">
                  <div className="card-header">
                    <h3>{editingId !== null ? '✏️ Edit Blog Post' : '➕ Create New Blog Post'}</h3>
                    <button className="btn-cancel-edit" onClick={() => setIsWriting(false)}>
                      ← Back to Articles List
                    </button>
                  </div>

                  <form onSubmit={handleSavePost} className="admin-form">
                    <div className="form-group">
                      <label htmlFor="post-title">Article Title</label>
                      <input
                        id="post-title"
                        type="text"
                        placeholder="e.g. How to Operating Mini Track Loaders Safely"
                        value={postTitle}
                        onChange={(e) => setPostTitle(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="post-slug">Readable URL Slug</label>
                      <input
                        id="post-slug"
                        type="text"
                        placeholder="wheel-loader-pallet-forks-vs-buckets"
                        value={postSlug}
                        onChange={(e) => setPostSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                        onBlur={(e) => setPostSlug(getSlug(e.target.value))}
                      />
                      <small>Public URL: /blog/{postSlug || getSlug(postTitle) || 'your-article-title'}</small>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="post-category">Category</label>
                        <select
                          id="post-category"
                          value={postCategory}
                          onChange={(e) => setPostCategory(e.target.value)}
                        >
                          <option value="Equipment Guide">Equipment Guide</option>
                          <option value="Equipment Comparison">Equipment Comparison</option>
                          <option value="Maintenance & Service">Maintenance & Service</option>
                          <option value="Jobsite Productivity">Jobsite Productivity</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="post-author">Author Name</label>
                        <input
                          id="post-author"
                          type="text"
                          placeholder="e.g. Antigravity Engineering"
                          value={postAuthor}
                          onChange={(e) => setPostAuthor(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Featured Image Selector */}
                    <div className="form-group">
                      <label>Featured Image URL / Selected Image</label>
                      <div className="image-input-picker">
                        <input
                          type="text"
                          placeholder="Paste image link or choose from library..."
                          value={postImage}
                          onChange={(e) => setPostImage(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn-select-media"
                          onClick={() => setShowImagePicker(!showImagePicker)}
                        >
                          {showImagePicker ? 'Close Store' : 'Pick from Image Store 🖼️'}
                        </button>
                      </div>

                      {showImagePicker && (
                        <div className="store-picker-drawer">
                          <p className="drawer-title">Click an image from your Media Store to select:</p>
                          <div className="drawer-grid">
                            {mediaList.map((item) => (
                              <div
                                key={item.id}
                                className={`drawer-item ${postImage === item.url ? 'selected' : ''}`}
                                onClick={() => {
                                  setPostImage(item.url)
                                  setShowImagePicker(false)
                                }}
                              >
                                <img src={item.url} alt={item.title} />
                                <span>{item.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {postImage && (
                        <div className="form-image-preview">
                          <img src={postImage} alt="Selected preview" />
                          <span>Preview Image</span>
                        </div>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="post-excerpt">Short Summary / Excerpt</label>
                      <textarea
                        id="post-excerpt"
                        rows={2}
                        placeholder="Brief overview shown on the card..."
                        value={postExcerpt}
                        onChange={(e) => setPostExcerpt(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <div className="form-label-row">
                        <label htmlFor="post-content">Article Content</label>
                        <span className="helper-tip">Supports Headings, Links & Images</span>
                      </div>
                      <div className="markdown-cheatsheet">
                        <div>
                          <button type="button" className="cheat-btn" onClick={() => setPostContentText(prev => prev + '\n# Heading 1\n')}># Heading 1</button>
                          <button type="button" className="cheat-btn" onClick={() => setPostContentText(prev => prev + '\n## Heading 2\n')}>## Heading 2</button>
                          <button type="button" className="cheat-btn" onClick={() => setPostContentText(prev => prev + '\n### Heading 3\n')}>### Heading 3</button>
                        </div>
                        <div>
                          <button type="button" className="cheat-btn link-btn-highlight" onClick={handleToolbarLinkClick}>Add Link 🔗</button>
                          <button type="button" className="cheat-btn" onClick={() => setPostContentText(prev => prev + '\n![Alt Text](url)\n')}>![Alt Text](url) (Image)</button>
                        </div>
                      </div>
                      <textarea
                        id="post-content"
                        rows={10}
                        placeholder="Write your article using headings, links, and image tags..."
                        value={postContentText}
                        onChange={(e) => setPostContentText(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="post-takeaways">Key Takeaways Checklist (One bullet per line)</label>
                      <textarea
                        id="post-takeaways"
                        rows={3}
                        placeholder="Check track pressure daily&#10;Verify hydraulic fluid level"
                        value={postTakeawaysText}
                        onChange={(e) => setPostTakeawaysText(e.target.value)}
                      />
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary">
                        {editingId !== null ? 'Update Published Article' : 'Publish Article Live 🚀'}
                      </button>
                      <button type="button" className="btn btn-secondary" onClick={() => setIsWriting(false)}>
                        Cancel & Return
                      </button>
                    </div>
                  </form>
                </div>

                {/* Right Live Preview Card */}
                <div className="admin-card blog-preview-card">
                  <div className="card-header">
                    <h3>👁️ Live Article Preview</h3>
                  </div>
                  <div className="preview-body-container">
                    {(postTitle || postContentText || postExcerpt || postImage) ? (
                      <div className="live-preview-content">
                        <h2>{postTitle || 'Untitled Article'}</h2>
                        {postExcerpt && <p className="preview-excerpt"><em>{postExcerpt}</em></p>}
                        {postImage && (
                          <div className="preview-featured-image">
                            <img src={postImage} alt={postTitle || 'Preview image'} />
                          </div>
                        )}
                        <div className="preview-markdown-parsed">
                          {postContentText.split('\n').map((paragraph, idx) => (
                            <div key={idx}>
                              {renderMarkdownToReact(paragraph, idx)}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="empty-preview-state">
                        <span className="empty-icon">📝</span>
                        <p>Start writing on the left to see live layout previews instantly.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MEDIA LIBRARY / IMAGE STORE */}
        {activeTab === 'media' && (
          <div className="console-content">
            <div className="media-upload-bar">
              <div className="upload-box file-upload-box">
                <label htmlFor="file-input" className="file-drop-area">
                  <span className="upload-icon">📁</span>
                  <div>
                    <strong>Upload Local Image File</strong>
                    <p>Select PNG, JPG, WebP images to store</p>
                  </div>
                  <input
                    id="file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              <form onSubmit={handleAddMediaUrl} className="upload-box url-upload-form">
                <strong>🔗 Add Image via URL</strong>
                <div className="url-inputs">
                  <input
                    type="text"
                    placeholder="Image Label"
                    value={newMediaTitle}
                    onChange={(e) => setNewMediaTitle(e.target.value)}
                  />
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={newMediaUrl}
                    onChange={(e) => setNewMediaUrl(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-sm">
                  Save to Store
                </button>
              </form>
            </div>

            <div className="media-gallery-header">
              <h3>Image Store Gallery ({mediaList.length} assets)</h3>
            </div>

            <div className="media-grid">
              {mediaList.map((media) => (
                <div key={media.id} className="media-card">
                  <div className="media-preview-container">
                    <img src={media.url} alt={media.title} />
                    <span className="media-size-tag">{media.size || 'Image'}</span>
                  </div>
                  <div className="media-card-body">
                    <h4>{media.title}</h4>
                    <p className="media-url-text">{media.url}</p>
                    <div className="media-card-actions">
                      <button className="btn-copy-url" onClick={() => copyToClipboard(media.url)}>
                        {copiedUrl === media.url ? '✓ Copied!' : 'Copy URL 📋'}
                      </button>
                      <button className="btn-delete-media" onClick={() => handleDeleteMedia(media.id)}>🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: INQUIRIES SCREEN */}
        {activeTab === 'inquiries' && (
          <div className="console-content">
            <div className="admin-card full-width">
              <div className="card-header">
                <h3>📥 Customer Quotes & Inquiries ({inquiries.length})</h3>
                <button className="btn-cancel-edit" onClick={() => {
                  if (confirm('Clear all inquiries database?')) {
                    setInquiries([])
                  }
                }}>Clear Database</button>
              </div>

              <div className="table-responsive">
                <table className="console-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Customer Details</th>
                      <th>Equipment Interest</th>
                      <th>Message</th>
                      <th>Lead Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inquiries.map((inq) => (
                      <tr key={inq.id}>
                        <td className="table-date">{inq.date}</td>
                        <td>
                          <strong>{inq.name}</strong>
                          <div className="subtext">{inq.email}</div>
                          <div className="subtext">{inq.phone} | {inq.company}</div>
                        </td>
                        <td>
                          <span className="interest-badge">{inq.productInterest || 'General inquiry'}</span>
                        </td>
                        <td className="table-message">{inq.message}</td>
                        <td>
                          <select
                            value={inq.status}
                            onChange={(e) => handleInquiryStatusChange(inq.id, e.target.value as Inquiry['status'])}
                            className={`status-select ${inq.status.toLowerCase().replace(' ', '-')}`}
                          >
                            <option value="New">New 🟢</option>
                            <option value="In Progress">In Progress 🟡</option>
                            <option value="Contacted">Contacted 🔵</option>
                            <option value="Resolved">Resolved ⚫</option>
                          </select>
                        </td>
                        <td>
                          <button className="btn-table-delete" onClick={() => handleDeleteInquiry(inq.id)}>🗑️ Delete</button>
                        </td>
                      </tr>
                    ))}
                    {inquiries.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                          No customer inquiries received yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: COMMENTS MODERATION */}
        {activeTab === 'comments' && (
          <div className="console-content">
            <div className="admin-card full-width">
              <div className="card-header">
                <h3>💬 Article Comments Moderation ({comments.length})</h3>
              </div>

              <div className="table-responsive">
                <table className="console-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Author</th>
                      <th>Article Path</th>
                      <th>Comment Content</th>
                      <th>Approval Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comments.map((comment) => (
                      <tr key={comment.id}>
                        <td className="table-date">{comment.date}</td>
                        <td><strong>{comment.author}</strong></td>
                        <td className="table-post-title">{comment.postTitle}</td>
                        <td className="table-message">{comment.text}</td>
                        <td>
                          <span className={`status-pill ${comment.status.toLowerCase()}`}>
                            {comment.status}
                          </span>
                        </td>
                        <td>
                          <div className="table-action-buttons">
                            <button className="btn-table-reply" onClick={() => handleReplyToComment(comment.id)}>
                              Reply ↩
                            </button>
                            {comment.status !== 'Approved' && (
                              <button
                                className="btn-table-approve"
                                onClick={() => handleCommentStatusChange(comment.id, 'Approved')}
                              >
                                Approve ✓
                              </button>
                            )}
                            {comment.status !== 'Spam' && (
                              <button
                                className="btn-table-spam"
                                onClick={() => handleCommentStatusChange(comment.id, 'Spam')}
                              >
                                Spam 🚨
                              </button>
                            )}
                            <button
                              className="btn-table-delete-sm"
                              onClick={() => handleDeleteComment(comment.id)}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: ADMIN TOOLS */}
        {activeTab === 'tools' && (
          <div className="console-content">
            <div className="admin-card">
              <h3>🚨 Console Database Backup & Admin Utilities</h3>
              <p>Download, backup, and restore website configurations instantly.</p>
              
              <div className="tools-grid" style={{ marginTop: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleExportData}
                >
                  📥 Export Database Backup (JSON)
                </button>

                <button
                  className="btn btn-secondary"
                  onClick={async () => {
                    if (confirm('Are you sure you want to restore the database to factory settings? All custom blog posts, inquiries and media library items will be reset.')) {
                      await Promise.all([
                        writeSharedContent('blog-posts', DEFAULT_POSTS),
                        writeSharedContent('media-library', DEFAULT_MEDIA),
                        writePersistentContent('blog-posts', DEFAULT_POSTS),
                        writePersistentContent('media-library', DEFAULT_MEDIA)
                      ])
                      localStorage.setItem('happy-machinery-blog-posts', JSON.stringify(DEFAULT_POSTS))
                      localStorage.setItem('happy-machinery-products', JSON.stringify(DEFAULT_PRODUCTS))
                      localStorage.setItem('happy-machinery-product-meta', JSON.stringify(DEFAULT_PRODUCT_META))
                      localStorage.setItem('happy-machinery-media-library', JSON.stringify(DEFAULT_MEDIA))
                      localStorage.setItem('happy-machinery-inquiries', JSON.stringify(DEFAULT_INQUIRIES))
                      localStorage.setItem('happy-machinery-comments', JSON.stringify(DEFAULT_COMMENTS))
                      window.location.reload()
                    }
                  }}
                >
                  🔄 Factory Reset Console Database
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ADD LINK MODAL OVERLAY (Matches Hostinger/Konstructz design) */}
      {isLinkModalOpen && (
        <div className="link-modal-overlay" onClick={() => setIsLinkModalOpen(false)}>
          <div className="link-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="link-modal-header">
              <h3>ADD LINK</h3>
            </div>
            
            <form onSubmit={handleAddLinkSubmit} className="link-modal-form">
              <div className="form-group">
                <label>Text</label>
                <input
                  type="text"
                  placeholder="e.g. read here"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>URL</label>
                <input
                  type="text"
                  placeholder="e.g. /store or https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="link-modal-checkboxes">
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={linkOpenNewTab}
                    onChange={(e) => setLinkOpenNewTab(e.target.checked)}
                  />
                  <span>Open in new tab</span>
                </label>

                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={linkNofollow}
                    onChange={(e) => setLinkNofollow(e.target.checked)}
                  />
                  <span>Add "nofollow" to link</span>
                </label>

                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={linkSponsored}
                    onChange={(e) => setLinkSponsored(e.target.checked)}
                  />
                  <span>Add "sponsored" to link</span>
                </label>

                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={linkUgc}
                    onChange={(e) => setLinkUgc(e.target.checked)}
                  />
                  <span>Add "ugc" to link</span>
                </label>
              </div>

              <div className="form-group">
                <label>Title Attribute</label>
                <input
                  type="text"
                  placeholder="e.g. About page"
                  value={linkTitleAttribute}
                  onChange={(e) => setLinkTitleAttribute(e.target.value)}
                />
              </div>

              <div className="link-modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-cancel"
                  onClick={() => setIsLinkModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-add-link">
                  ADD LINK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
