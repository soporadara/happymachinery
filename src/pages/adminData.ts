import { IMPORTED_PRODUCTS } from '../data/importedProducts'

export interface BlogPost {
  id: number
  slug?: string
  title: string
  category: string
  excerpt: string
  content: string[]
  keyTakeaways: string[]
  image: string
  imageAlt?: string
  alt?: string
  date: string
  readTime: string
  author: string
  status?: 'Published' | 'Draft'
  content_raw?: string
  seoTitle?: string
  metaDescription?: string
  tags?: string[]
}

export interface MediaItem {
  id: string
  title: string
  url: string
  dateAdded: string
  size?: string
  folder?: 'features' | 'galleries' | 'profileimg' | string
}

export interface AdminProduct {
  id: number
  name: string
  sku: string
  category: string
  description: string
  shortDescription?: string
  slug?: string
  brand?: string
  buyUrl?: string
  featured?: boolean
  addToCartEnabled?: boolean
  galleryImages?: string[]
  specifications?: { name: string; value: string }[]
  image: string
  price: number
  salePrice?: number
  stock: number
  status: 'Published' | 'Draft'
  updatedAt: string
}

export interface Inquiry {
  id: number
  name: string
  email: string
  phone: string
  company: string
  message: string
  date: string
  status: 'New' | 'Contacted' | 'In Progress' | 'Resolved'
  productInterest?: string
}

export interface BlogReply {
  id: number
  author: string
  email?: string
  avatar?: string
  text: string
  date: string
  isSeller?: boolean
  replyToAuthor?: string
}

export interface BlogComment {
  id: number
  postId: number
  postTitle: string
  author: string
  email?: string
  avatar?: string
  text: string
  date: string
  status: 'Pending' | 'Approved' | 'Spam'
  reply?: { author: string; text: string; date: string }
  replies?: BlogReply[]
  likes?: number
}

export const getUserProfileAvatar = (email?: string, name?: string): string => {
  if (!email || typeof email !== 'string') {
    const fallbackName = name ? encodeURIComponent(name.trim()) : 'User'
    return `https://ui-avatars.com/api/?name=${fallbackName}&background=0284c7&color=fff&bold=true&size=128`
  }

  const cleanEmail = email.trim().toLowerCase()
  const fallbackName = name ? encodeURIComponent(name.trim()) : encodeURIComponent(cleanEmail.split('@')[0])

  // 1. Check logged-in CMS admin session
  try {
    const raw = typeof localStorage !== 'undefined' ? (localStorage.getItem('hm_admin_session') || sessionStorage.getItem('hm_admin_session')) : null
    if (raw) {
      const session = JSON.parse(raw)
      if (session?.user && (session.user.email?.toLowerCase() === cleanEmail || session.user.username?.toLowerCase() === cleanEmail)) {
        if (session.user.avatar) return session.user.avatar
      }
    }
  } catch {}

  // 2. Check Firebase Authentication user object stored in localStorage
  if (typeof localStorage !== 'undefined') {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i) || ''
        if (key.startsWith('firebase:authUser') || key.includes('firebase:user') || key.includes('authUser')) {
          const raw = localStorage.getItem(key)
          if (raw) {
            const parsed = JSON.parse(raw)
            if (parsed.email?.toLowerCase() === cleanEmail && parsed.photoURL) {
              return parsed.photoURL
            }
          }
        }
      }
    } catch {}
  }

  // 3. Known administrator accounts
  if (cleanEmail === 'soporadara@kiuq.com' || cleanEmail === 'admin@happymachinery.com') {
    return 'https://lightcyan-weasel-711536.hostingersite.com/storage/avatars/UNOQP8Qv0cfy6L3twxNormAHlv7UnrVPV0Xs9k1c.jpg'
  }
  if (cleanEmail === 'support@happymachinery.com') {
    return '/images/favicon.webp'
  }

  // 4. Resolve via Unavatar (automatically searches Gravatar, Google, GitHub, and Firebase connected profiles)
  const defaultFallback = encodeURIComponent(`https://ui-avatars.com/api/?name=${fallbackName}&background=0284c7&color=fff&bold=true&size=128`)
  return `https://unavatar.io/${encodeURIComponent(cleanEmail)}?fallback=${defaultFallback}`
}

export interface CartOrder {
  id: string
  customer: string
  email: string
  phone: string
  items: string
  amount: number
  status: 'Completed' | 'Processing' | 'Pending' | 'Abandoned'
  date: string
}

export interface ProductAttribute {
  id: string
  name: string
  slug: string
  type: 'select' | 'pills' | 'text' | 'number'
  terms: string[]
  description?: string
  isRequired?: boolean
  isFilterable?: boolean
  productsCount?: number
}

export const DEFAULT_PRODUCT_ATTRIBUTES: ProductAttribute[] = [
  {
    id: 'attr-engine',
    name: 'Engine Model',
    slug: 'engine-model',
    type: 'select',
    terms: ['Kubota D1105 (25 HP)', 'Kubota V1505 (24.8 HP)', 'Yanmar 3TNV80 (20 HP)', 'Briggs & Stratton Vanguard (23 HP)', 'Rato R740D (23 HP)'],
    description: 'Original manufacturer diesel/gas engine power plant.',
    isRequired: true,
    isFilterable: true,
    productsCount: 68
  },
  {
    id: 'attr-horsepower',
    name: 'Horsepower (HP)',
    slug: 'horsepower',
    type: 'pills',
    terms: ['25 HP', '24.8 HP', '23 HP', '20 HP', '13.5 HP'],
    description: 'Gross rated engine output horsepower.',
    isRequired: true,
    isFilterable: true,
    productsCount: 84
  },
  {
    id: 'attr-track',
    name: 'Track & Undercarriage',
    slug: 'track-type',
    type: 'select',
    terms: ['Triangular High-Drive Rubber Track', 'Standard Dual Rubber Track', 'Heavy-Duty Steel Track', 'Non-Marking Turf Track'],
    description: 'Undercarriage track configuration and traction system.',
    isRequired: false,
    isFilterable: true,
    productsCount: 42
  },
  {
    id: 'attr-color',
    name: 'Machine Color',
    slug: 'machine-color',
    type: 'pills',
    terms: ['Crimson Red', 'Industrial Yellow', 'Cobalt Blue', 'Stealth Black', 'Safety Orange'],
    description: 'Protective industrial powder-coated chassis finish.',
    isRequired: false,
    isFilterable: true,
    productsCount: 56
  },
  {
    id: 'attr-operating-weight',
    name: 'Operating Weight',
    slug: 'operating-weight',
    type: 'select',
    terms: ['1,400 kg (1.4 Ton / 3,086 lbs)', '1,000 kg (1.0 Ton / 2,204 lbs)', '800 kg (0.8 Ton / 1,763 lbs)', '500 kg (1,102 lbs)'],
    description: 'Total operational equipment weight with standard attachments.',
    isRequired: false,
    isFilterable: true,
    productsCount: 39
  },
  {
    id: 'attr-hydraulic-flow',
    name: 'Hydraulic Flow Rate',
    slug: 'hydraulic-flow',
    type: 'pills',
    terms: ['48 L/min (12.7 GPM)', '32 L/min (8.5 GPM)', '24 L/min (6.3 GPM)'],
    description: 'Auxiliary hydraulic pump flow rate for demanding attachments.',
    isRequired: false,
    isFilterable: true,
    productsCount: 35
  },
  {
    id: 'attr-roc',
    name: 'Rated Operating Capacity (ROC)',
    slug: 'rated-operating-capacity',
    type: 'pills',
    terms: ['1,102 lbs (500 kg)', '1,014 lbs (460 kg)', '800 lbs (363 kg)', '600 lbs (272 kg)'],
    description: 'Safe SAE working lift load capacity.',
    isRequired: false,
    isFilterable: true,
    productsCount: 48
  },
  {
    id: 'attr-coupler',
    name: 'Attachment Coupler',
    slug: 'attachment-coupler',
    type: 'select',
    terms: ['Universal Skid Steer Quick-Attach (Bob-Tach style)', 'Mini Universal Mounting Plate', 'Direct Pin-On'],
    description: 'Front hitch mounting bracket mechanism for tools and attachments.',
    isRequired: false,
    isFilterable: true,
    productsCount: 62
  }
]

export const DEFAULT_CART_ORDERS: CartOrder[] = [
  {
    id: 'HM-9821',
    customer: 'Jason Miller',
    email: 'jason@millerbuilt.com',
    phone: '214-555-0182',
    items: 'TYPHON V900 Mini Track Loader — Industrial Yellow (1x)',
    amount: 11999.00,
    status: 'Processing',
    date: 'Oct 19, 2026'
  },
  {
    id: 'HM-9820',
    customer: 'Sarah Jenkins',
    email: 's.jenkins@epiccontractors.com',
    phone: '312-555-9831',
    items: 'TYPH-5005M Heavy-Duty Pallet Fork (2x)',
    amount: 3528.00,
    status: 'Completed',
    date: 'Oct 18, 2026'
  },
  {
    id: 'HM-9819',
    customer: 'Robert Chen',
    email: 'rchen@pacificbuilders.org',
    phone: '650-555-2245',
    items: 'Budget Style Hydraulic Thumb Clip Attachment (1x)',
    amount: 315.00,
    status: 'Pending',
    date: 'Oct 17, 2026'
  },
  {
    id: 'HM-9818',
    customer: 'David Vance',
    email: 'dvance@vanceconcrete.com',
    phone: '305-555-8812',
    items: 'TYPHON STOMP V900 1.4 Ton Skid Steer Loader with 25HP Kubota D1105 Engine, 1,102 lb Max Load — Cobalt Blue (1x)',
    amount: 11999.00,
    status: 'Completed',
    date: 'Oct 15, 2026'
  },
  {
    id: 'HM-9817',
    customer: 'Carlos Mendez',
    email: 'carlos@mendezexcavation.com',
    phone: '713-555-3490',
    items: 'TYPHON V900 Skid Steer Loader — Crimson Red (1x), Heavy-Duty Pallet Fork (1x)',
    amount: 13763.00,
    status: 'Abandoned',
    date: 'Oct 14, 2026'
  }
]

// Initial Default Posts
export const DEFAULT_POSTS: BlogPost[] = [
  {
    id: 100,
    title: 'Maximizing Skid Steer Efficiency & Safety on Residential Jobsites',
    slug: 'maximizing-skid-steer-efficiency-and-safety-on-residential-jobsites',
    category: 'Jobsite Productivity',
    excerpt: 'Key strategies and essential attachments to maximize efficiency, protect turf, and boost operator safety when operating compact skid steers on tight residential lots.',
    seoTitle: 'Maximizing Skid Steer Efficiency & Safety | Happy Machinery',
    metaDescription: 'Discover expert strategies and attachments to maximize compact skid steer productivity, protect residential turf, and enhance operator sightlines.',
    image: '/images/why-choose-v900-jobsite.png',
    imageAlt: 'Compact stand-on mini skid steer loader operating with attachments on residential lawn',
    alt: 'Compact stand-on mini skid steer loader operating with attachments on residential lawn',
    tags: ['Skid Steer', 'Residential Jobsites', 'Turf Protection', 'Attachments', 'Operator Safety'],
    content: [
      'Operating compact skid steers on residential job sites requires balancing high performance with strict noise, space, and turf protection requirements.',
      '## 1. Navigating Tight Access Points',
      'Residential gates and narrow side yards often limit equipment access. Utilizing a compact tracked loader under 36 inches wide ensures smooth passage without damaging fences or existing structures. [Explore V900 compact loader specifications](/store)',
      '## 2. Choosing the Right Hydraulic Attachment',
      'Matching auxiliary hydraulic flow to attachments such as augers, trenchers, and hydraulic breakers guarantees maximum breakout force without engine strain. Check out our [Universal Attachment line](/store).',
      '![V900 Jobsite Operations](/images/why-choose-v900-jobsite.png)',
      '## 3. Daily Safety & Operator Sightline Practices',
      'Stand-on operator platforms afford 360-degree clear visibility around tight residential obstacles, allowing quick stepping on and off to verify ground clearance.'
    ],
    keyTakeaways: [
      'Verify gate clearance width before moving heavy machinery onto residential property',
      'Match auxiliary hydraulic pressure (12.7 GPM) to demanding attachment tasks',
      'Utilize rubber tracks to minimize turf displacement and ground disturbance'
    ],
    date: 'August 15, 2026',
    readTime: '5 min read',
    author: 'Happy Machinery'
  },
  {
    id: 101,
    title: 'Wheel loader pallet forks vs buckets for material handling',
    slug: 'wheel-loader-pallet-forks-vs-buckets-for-material-handling',
    category: 'Jobsite Productivity',
    excerpt: 'Compare wheel loader pallet forks vs buckets to choose the right attachment for pallets, lumber, gravel, soil, sand, debris, and more.',
    seoTitle: 'Wheel Loader Pallet Forks vs Buckets Guide | Happy Machinery',
    metaDescription: 'Choosing between wheel loader pallet forks and buckets? Compare payload stability, cycle times, and attachment versatility for construction material handling.',
    image: '/images/fork-red-jobsite.png',
    imageAlt: 'Heavy-duty crimson red wheel loader equipped with pallet fork attachment lifting cargo',
    alt: 'Heavy-duty crimson red wheel loader equipped with pallet fork attachment lifting cargo',
    tags: ['Wheel Loader', 'Pallet Forks', 'Loader Buckets', 'Material Handling', 'Attachments'],
    content: [
      'Selecting between pallet forks and standard utility buckets depends on payload geometry, material density, and site placement goals.',
      '## Pallet Forks for Precision Placement',
      'Heavy-duty pallet forks provide superior stability for lifting palletized turf, pavers, and lumber across uneven jobsite terrain.',
      '## Excavator & Utility Buckets for Bulk Transfer',
      'Standard utility buckets remain unmatched for scooping soil, gravel, sand, and aggregate materials quickly into dump trucks.'
    ],
    keyTakeaways: [
      'Pallet forks deliver precise pallet and unitized payload placement',
      'Utility buckets optimize high-volume loose material loading',
      'Universal quick-attach mechanisms enable 60-second attachment swaps'
    ],
    date: 'August 14, 2026',
    readTime: '5 min read',
    author: 'Happy Machinery'
  },
  {
    id: 102,
    title: 'Can a Compact Excavator Work All Day?',
    slug: 'can-a-compact-excavator-work-all-day',
    category: 'Maintenance & Service',
    excerpt: 'How to Maximize Compact Excavator Productivity on long work shifts.',
    seoTitle: 'Can a Compact Excavator Work All Day? | Happy Machinery',
    metaDescription: 'Can mini excavators handle full-day heavy digging? Learn thermal management, fuel planning, and maintenance intervals for reliable all-day excavator shifts.',
    image: '/images/fork-blue-jobsite.png',
    imageAlt: 'Compact mini excavator performing deep foundation digging during all-day operation',
    alt: 'Compact mini excavator performing deep foundation digging during all-day operation',
    tags: ['Mini Excavator', 'Shift Productivity', 'Thermal Management', 'Equipment Duty Cycle', 'Maintenance'],
    content: [
      'Modern diesel engine cooling systems and high-efficiency hydraulic pumps allow compact excavators to operate continuously through full 10-to-12 hour work shifts.',
      '## Engine Thermal & Hydraulic Cooling',
      'High-capacity radiators combined with heavy-duty hydraulic oil coolers maintain safe operating temperatures under non-stop digging cycles.',
      '## Shift Fuel Consumption & Tank Capacity',
      'Proven 3-cylinder diesel engines like the Kubota D1105 maximize fuel economy, running up to a full work day on a single tank.'
    ],
    keyTakeaways: [
      'Monitor hydraulic oil temperature during continuous heavy digging',
      'Ensure air filters and radiator screens stay free of fine site dust',
      'Perform mid-day grease passes on high-wear bucket linkage pins'
    ],
    date: 'July 25, 2026',
    readTime: '4 min read',
    author: 'Happy Machinery'
  },
  {
    id: 103,
    title: '7 Essential Wheel Loader Bucket Capacity Tips for Better Performance',
    slug: '7-essential-wheel-loader-bucket-capacity-tips-for-better-performance',
    category: 'Equipment Guide',
    excerpt: 'Discover wheel loader bucket capacity, bucket types, material density, loading limits, and 7 essential tips for safer, more efficient performance.',
    seoTitle: '7 Wheel Loader Bucket Capacity Tips | Happy Machinery',
    metaDescription: 'Calculate correct wheel loader bucket capacity. 7 expert tips on material density, tipping load margins, and matched sizing to maximize payload efficiency.',
    image: '/images/why-choose-v900-jobsite.png',
    imageAlt: 'Compact industrial wheel loader bucket loaded with construction aggregate',
    alt: 'Compact industrial wheel loader bucket loaded with construction aggregate',
    tags: ['Wheel Loader', 'Bucket Capacity', 'Payload Optimization', 'Tipping Load', 'Equipment Sizing'],
    content: [
      'Matching wheel loader bucket capacity to material density is vital for preventing hydraulic overload and optimizing cycle times on busy jobsites.',
      '## 1. Understand Heaped vs. Struck Capacity',
      'Struck capacity measures the volume inside the bucket when leveled flat, while heaped capacity accounts for material piled above the bucket sides.',
      '## 2. Factoring Material Weight and Density',
      'Wet soil and crushed rock weigh significantly more per cubic yard than dry wood chips. Adjust bucket volume accordingly to stay within tipping load limits.'
    ],
    keyTakeaways: [
      'Calculate material density before selecting bucket attachment size',
      'Never exceed machine rated operating capacity or tipping load limits',
      'Inspect bucket teeth and cutting edges weekly to preserve breakout force'
    ],
    date: 'August 11, 2026',
    readTime: '5 min read',
    author: 'Happy Machinery'
  },
  {
    id: 104,
    title: 'Signs Your Forklift Needs Immediate Maintenance',
    slug: 'signs-your-forklift-needs-immediate-maintenance',
    category: 'Maintenance & Service',
    excerpt: 'Discover 5 critical forklift maintenance signs, including unusual noises, hydraulic leaks, warning lights, brake problems, and battery issues.',
    seoTitle: 'Signs Your Forklift Needs Immediate Service | Happy Machinery',
    metaDescription: 'Prevent forklift breakdowns and OSHA safety violations. Learn 5 critical warning signs that indicate your forklift requires immediate mechanical maintenance.',
    image: '/images/loader-yellow.jpg',
    imageAlt: 'Industrial warehouse forklift undergoing routine hydraulic mast inspection',
    alt: 'Industrial warehouse forklift undergoing routine hydraulic mast inspection',
    tags: ['Forklift Maintenance', 'Hydraulic Leaks', 'Workplace Safety', 'Fleet Inspection', 'Preventive Service'],
    content: [
      'Ignoring early warning signs in material handling equipment leads to catastrophic breakdown and unsafe warehouse operation.',
      '## 1. Hydraulic Fluid Leaks and Pressure Drops',
      'Puddles beneath the mast or slow tilt response indicate worn hydraulic cylinder seals or compromised pressure hoses.',
      '## 2. Mast Chain Squeal and Unbalanced Lift',
      'Squealing mast chains mean lubrication depletion or uneven link stretch, which can cause erratic load lifting under weight.'
    ],
    keyTakeaways: [
      'Stop operation immediately if hydraulic pressure drops unexpectedly',
      'Inspect lift chains and mast roller bearings every 50 hours',
      'Keep daily operator inspection logs for compliance and safety'
    ],
    date: 'August 10, 2026',
    readTime: '4 min read',
    author: 'Happy Machinery'
  },
  {
    id: 1,
    title: 'How to Choose the Right Mini Track Loader for Your Jobsite',
    slug: 'how-to-choose-the-right-mini-track-loader-for-your-jobsite',
    category: 'Equipment Guide',
    excerpt: 'Operating weight, hydraulic flow, track contact length, and attachment compatibility are critical parameters to consider before purchasing.',
    seoTitle: 'How to Choose the Right Mini Track Loader | Happy Machinery',
    metaDescription: 'Buyer guide: compare mini track loader operating weight, auxiliary hydraulic flow, ground pressure, and attachment compatibility for your jobsite.',
    image: '/images/why-choose-v900-jobsite.png',
    imageAlt: 'Mini track loader navigating residential jobsite with auxiliary hydraulic attachment',
    alt: 'Mini track loader navigating residential jobsite with auxiliary hydraulic attachment',
    tags: ['Mini Track Loader', 'Buyer Guide', 'Hydraulic Flow', 'Ground Pressure', 'Compact Equipment'],
    content: [
      'When selecting a mini track loader for commercial or residential job sites, machine footprint and hydraulic output directly dictate job performance.',
      '## 1. Compact Width & Gate Access',
      'Compact width (under 36 inches) enables zero-clearance navigation through standard backyard fence gates and tight alleyways. [View V900 compact loader specifications](/store)',
      '## 2. Power and Hydraulics',
      'Auxiliary hydraulic pump flow (such as 12.7 GPM on 2,321 psi systems) ensures full attachment functionality for heavy-duty augers, trenchers, and pallet forks without hydraulic pressure drop. Check out the official [Kubota D1105 diesel specs](https://www.kubota-engine.co.jp/en/) for further torque curves.',
      '![V900 Yellow Edition Studio](/images/loader-yellow.jpg)',
      '## 3. Stability and Slopes',
      'Always evaluate track contact length and rubber tread profile to ensure minimal ground disturbance on manicured turf while maintaining 25° slope climbing stability.'
    ],
    keyTakeaways: [
      'Check vehicle width (under 36" fits standard gate entrances)',
      'Verify auxiliary hydraulic flow (minimum 12 GPM for high-flow attachments)',
      'Ensure EPA / Stage V engine compliance for commercial worksite operations'
    ],
    date: 'July 18, 2026',
    readTime: '5 min read',
    author: 'Happy Machinery'
  },
  {
    id: 2,
    title: 'Stand-On Track Loaders vs. Wheeled Skid Steers',
    slug: 'stand-on-track-loaders-vs-wheeled-skid-steers',
    category: 'Equipment Comparison',
    excerpt: 'Understand ground pressure dynamics, grading capabilities, and track durability differences under residential and industrial soil conditions.',
    seoTitle: 'Stand-On Track Loaders vs Wheeled Skid Steers | Happy Machinery',
    metaDescription: 'Compare stand-on track loaders vs wheeled skid steers. Learn which delivers superior ground pressure, traction, turning agility, and turf preservation.',
    image: '/images/fork-red-jobsite.png',
    imageAlt: 'Side-by-side comparison of stand-on track loader and traditional wheeled skid steer',
    alt: 'Side-by-side comparison of stand-on track loader and traditional wheeled skid steer',
    tags: ['Track Loader vs Skid Steer', 'Ground Pressure', 'Traction', 'Turf Preservation', 'Machinery Comparison'],
    content: [
      'Ground pressure is a fundamental distinction between rubber track loaders and traditional wheeled skid steers. Track loaders distribute operating weight over a wider surface area, reducing turf damage by up to 60%.',
      '## 1. Continuous Traction',
      'In soft mud, wet clay, or loose gravel, tracks maintain continuous traction where pneumatic tires easily sink and spin out. For help choosing tires vs tracks, visit our [Contact Us page](/contact).',
      '![Pallet Fork Attachment on Site](/images/fork-red-jobsite.png)',
      '## 2. Platform Sightlines',
      'Stand-on loader operator platforms provide 360-degree visibility, letting operators step on and off quickly to adjust attachments or clear jobsite obstacles.',
      'For contractors working in tight residential lots or landscaping renovations, stand-on track loaders deliver skid-steer power with half the footprint.'
    ],
    keyTakeaways: [
      'Rubber tracks reduce ground pressure and prevent site rutting',
      'Stand-on platforms offer superior 360° operator sightlines',
      'Universal Quick-Attach plates accept standard skid steer attachments'
    ],
    date: 'July 12, 2026',
    readTime: '6 min read',
    author: 'Happy Machinery'
  },
  {
    id: 3,
    title: 'Daily Preventive Maintenance Checklist for Track Loaders',
    slug: 'daily-preventive-maintenance-checklist-for-track-loaders',
    category: 'Maintenance & Service',
    excerpt: 'Keep your machinery running through every shift. Essential checks for hydraulic fluid, track tension, and grease points that save thousands.',
    seoTitle: 'Daily Track Loader Maintenance Checklist | Happy Machinery',
    metaDescription: 'Daily preventative maintenance checklist for compact track loaders: inspect track tension, hydraulic fluid, engine filters, and grease points.',
    image: '/images/fork-blue-jobsite.png',
    imageAlt: 'Service technician performing daily lubrication and fluid checks on compact track loader',
    alt: 'Service technician performing daily lubrication and fluid checks on compact track loader',
    tags: ['Maintenance Checklist', 'Track Loader Care', 'Hydraulic Fluid', 'Grease Points', 'Preventive Service'],
    content: [
      'Preventive maintenance is the single most effective way to maximize machine lifespan and prevent costly jobsite downtime.',
      '## Daily Under-carriage Inspections',
      'Inspect track tension daily: properly tensioned rubber tracks reduce sprocket wear and prevent track derailment under heavy side-load turning.',
      '## Hydraulic Fluid Seals',
      'Check hydraulic oil fluid levels and inspect quick-coupler seals for debris before connecting auxiliary attachment lines. [Contact Technical Support](/contact)',
      '![Blue V900 Loader Studio](/images/loader-blue.jpg)',
      '## Joint Greasing Point Matrix',
      'Grease all pivot pins on loader arms and quick-tach locking pins every 10 operating hours to maintain smooth hydraulic articulation.'
    ],
    keyTakeaways: [
      'Inspect track tension and clear undercarriage debris daily',
      'Check hydraulic fluid level and seal integrity before every shift',
      'Grease loader arm pivot points every 10 operating hours'
    ],
    date: 'July 05, 2026',
    readTime: '4 min read',
    author: 'Happy Machinery'
  }
]

const EXISTING_PRODUCTS: AdminProduct[] = [
  {
    id: 901,
    name: 'TYPHON STOMP V900 1.4 Ton Skid Steer Loader with 25HP Kubota D1105 Engine, 1,102 lb Max Load — Crimson Red',
    sku: 'TYPH-V900R',
    category: 'Equipment > Skid Steer Loaders',
    description: 'Crimson Red V900 with Kubota D1105 diesel power and standard utility bucket.',
    image: '/images/loader-red.png',
    price: 12630.53,
    salePrice: 11999,
    stock: 4,
    status: 'Published',
    updatedAt: 'July 24, 2026'
  },
  {
    id: 902,
    name: 'TYPHON STOMP V900 1.4 Ton Skid Steer Loader with 25HP Kubota D1105 Engine, 1,102 lb Max Load — Industrial Yellow',
    sku: 'TYPH-V900Y',
    category: 'Equipment > Skid Steer Loaders',
    description: 'Industrial Yellow V900 with Kubota D1105 diesel power and standard utility bucket.',
    image: '/images/loader-yellow.png',
    price: 12630.53,
    salePrice: 11999,
    stock: 3,
    status: 'Published',
    updatedAt: 'July 24, 2026'
  },
  {
    id: 903,
    name: 'TYPHON STOMP V900 1.4 Ton Skid Steer Loader with 25HP Kubota D1105 Engine, 1,102 lb Max Load — Cobalt Blue',
    sku: 'TYPH-V900B',
    category: 'Equipment > Skid Steer Loaders',
    description: 'Cobalt Blue V900 with Kubota D1105 diesel power and standard utility bucket.',
    image: '/images/loader-blue.png',
    price: 12630.53,
    salePrice: 11999,
    stock: 2,
    status: 'Published',
    updatedAt: 'July 24, 2026'
  },
  {
    id: 5005,
    name: 'TYPH-5005M Heavy-Duty Pallet Fork',
    sku: 'TYPH-5005M',
    category: 'Attachment & Parts > Skid Steer Attachments > Compact Series (501–507)',
    description: 'Optional heavy-duty pallet fork attachment. Sold separately from the V900.',
    image: '/images/fork-yellow.jpg',
    price: 1764,
    stock: 8,
    status: 'Published',
    updatedAt: 'July 24, 2026'
  }
]

// CSV catalog products intentionally remain drafts until they are reviewed and
// explicitly published from the admin dashboard.
export const DEFAULT_PRODUCTS: AdminProduct[] = [
  ...EXISTING_PRODUCTS,
  ...IMPORTED_PRODUCTS
]

// Default Media Assets organized by Media Library folder tree (galleries, features, profileimg)
export const DEFAULT_MEDIA: MediaItem[] = [
  // galleries folder
  { id: '1', title: 'V900 Jobsite Operations', url: '/images/why-choose-v900-jobsite.png', dateAdded: '2026-07-18', size: '3.0 MB', folder: 'galleries' },
  { id: '2', title: 'V900 Red Edition Pallet Fork', url: '/images/fork-red-jobsite.png', dateAdded: '2026-07-12', size: '2.7 MB', folder: 'galleries' },
  { id: '3', title: 'V900 Blue Edition Jobsite', url: '/images/fork-blue-jobsite.png', dateAdded: '2026-07-05', size: '2.7 MB', folder: 'galleries' },
  { id: '4', title: 'V900 Yellow Edition Jobsite', url: '/images/fork-yellow-jobsite.png', dateAdded: '2026-07-01', size: '2.7 MB', folder: 'galleries' },
  { id: '5', title: 'Crimson Red Loader Studio', url: '/images/loader-red.jpg', dateAdded: '2026-06-25', size: '491 KB', folder: 'galleries' },
  { id: '6', title: 'Industrial Yellow Loader Studio', url: '/images/loader-yellow.jpg', dateAdded: '2026-06-25', size: '302 KB', folder: 'galleries' },
  { id: '7', title: 'Cobalt Blue Loader Studio', url: '/images/loader-blue.jpg', dateAdded: '2026-06-25', size: '541 KB', folder: 'galleries' },
  { id: '8', title: 'V900 Transport Delivery', url: '/images/v900-delivery.png', dateAdded: '2026-06-20', size: '2.2 MB', folder: 'galleries' },
  { id: '9', title: 'V900 Equipment Layout Overview', url: '/images/v900-equipment-layout.png', dateAdded: '2026-06-15', size: '2.6 MB', folder: 'galleries' },
  { id: '10', title: 'Hero V900 Three Colors Lineup', url: '/images/hero-v900-three-colors.png', dateAdded: '2026-06-10', size: '2.8 MB', folder: 'galleries' },

  // features folder
  { id: '11', title: 'Happy Machinery Brand Logo', url: '/logo.png', dateAdded: '2026-10-20', size: '1.65 MB', folder: 'features' },
  { id: '12', title: 'V900 Promotional Graphic', url: '/images/v900-promo.webp', dateAdded: '2026-07-15', size: '108 KB', folder: 'features' },
  { id: '13', title: 'Why Choose Equipment Collage', url: '/images/why-choose-collage.jpg', dateAdded: '2026-07-08', size: '477 KB', folder: 'features' },

  // profileimg folder
  { id: '14', title: 'Executive Operations Specialist', url: '/images/about-team-1.png', dateAdded: '2026-07-16', size: '608 KB', folder: 'profileimg' },
  { id: '15', title: 'Chief Field Engineer', url: '/images/about-team-2.jpg', dateAdded: '2026-07-14', size: '350 KB', folder: 'profileimg' },
  { id: '16', title: 'Client Logistics Manager', url: '/images/about-team-3.png', dateAdded: '2026-07-10', size: '672 KB', folder: 'profileimg' },
  { id: '17', title: 'Verified Customer Feedback Portraits', url: '/images/customer-feedback-portraits.png', dateAdded: '2026-07-02', size: '2.1 MB', folder: 'profileimg' }
]

// Default inquiries
export const DEFAULT_INQUIRIES: Inquiry[] = [
  { id: 1, name: 'Jason Miller', email: 'jason@millerbuilt.com', phone: '214-555-0182', company: 'Miller Landscaping Services', message: 'Looking for a quote on the V900 loader in yellow with the pallet fork and auger attachments. Need delivery to Dallas.', date: '2026-07-22', status: 'New', productInterest: 'TYPHON V900 Mini Track Loader' },
  { id: 2, name: 'Sarah Jenkins', email: 's.jenkins@epiccontractors.com', phone: '312-555-9831', company: 'Epic Infrastructure Group', message: 'Need bulk pricing for 3 units of the V900 loader. Do you offer warranty extensions for commercial fleets?', date: '2026-07-21', status: 'In Progress', productInterest: 'TYPHON V900 Mini Track Loader' },
  { id: 3, name: 'Robert Chen', email: 'rchen@pacificbuilders.org', phone: '650-555-2245', company: 'Pacific Builders', message: 'Interested in the mini excavator attachments. Will the standard auger plate fit older bobcat models?', date: '2026-07-20', status: 'Contacted', productInterest: 'Universal Pallet Forks' },
  { id: 4, name: 'David Vance', email: 'dvance@vanceconcrete.com', phone: '305-555-8812', company: 'Vance Concrete Contractors', message: 'Are the tracks non-marking rubber? We do indoor warehouse slab work and want to avoid track lines.', date: '2026-07-18', status: 'Resolved', productInterest: 'TYPHON V900 Mini Track Loader' },
  { id: 5, name: 'Marcus Sterling', email: 'msterling@apexearth.com', phone: '404-555-7721', company: 'Apex Earth & Grading LLC', message: 'Can we schedule an on-site demo for the Kubota D1105 25HP V900 skid steer loader in Atlanta next Tuesday?', date: '2026-10-21', status: 'New', productInterest: 'TYPHON V900 Mini Track Loader' },
  { id: 6, name: 'Elena Rostova', email: 'elena@summitcivils.com', phone: '206-555-4920', company: 'Summit Civil Contracting', message: 'Requesting formal commercial invoice for 1x TYPH-5005M Pallet Fork and 1x Hydraulic Breaker attachment with freight to Seattle.', date: '2026-10-20', status: 'In Progress', productInterest: 'TYPH-5005M Heavy-Duty Pallet Fork' }
]

// Default comments
export const DEFAULT_COMMENTS: BlogComment[] = [
  {
    id: 1,
    postId: 1,
    postTitle: 'How to Choose the Right Mini Track Loader',
    author: 'Markus T.',
    email: 'markus.t@constructionpro.com',
    text: 'Very detailed breakdown. The 12.7 GPM flow on the D1105 makes a massive difference for high-speed drilling.',
    date: '2026-07-22',
    status: 'Approved',
    likes: 4,
    replies: [
      {
        id: 101,
        author: 'Happy Machinery Support',
        email: 'support@happymachinery.com',
        text: 'Glad you found it useful Markus! The high auxiliary hydraulic flow on the Kubota D1105 engine is definitely an industry highlight for demanding attachments.',
        date: '2026-07-22',
        isSeller: true
      },
      {
        id: 102,
        author: 'David Rodriguez',
        email: 'david@rodriguezlandscaping.com',
        text: 'Agree with Markus! We run an auger and trencher on ours every week and never experience hydraulic pressure drops.',
        date: '2026-07-23',
        replyToAuthor: 'Markus T.'
      }
    ]
  },
  {
    id: 2,
    postId: 2,
    postTitle: 'Stand-On Track Loaders vs. Wheeled Skid Steers',
    author: 'Alisha Ramirez',
    email: 'alisha@ramirezlandscape.com',
    text: 'We replaced two of our older skid steers with stand-on tracks and saved a lot of yard clean-up repair time.',
    date: '2026-07-21',
    status: 'Approved',
    likes: 2
  },
  {
    id: 3,
    postId: 1,
    postTitle: 'How to Choose the Right Mini Track Loader',
    author: 'Anonymous Vendor',
    email: 'vendor@spam.xyz',
    text: 'Check out cheap equipment deals on this link! spam-link.xyz',
    date: '2026-07-20',
    status: 'Spam'
  },
  {
    id: 4,
    postId: 100,
    postTitle: 'Maximizing Skid Steer Efficiency & Safety on Residential Jobsites',
    author: 'Tom Henderson',
    email: 'thenderson@hendersonbuild.com',
    text: 'Does the 36-inch gate width profile apply to both the Crimson Red and Cobalt Blue versions? We do historic residential renovations in Boston.',
    date: '2026-10-22',
    status: 'Pending',
    likes: 1
  }
]
