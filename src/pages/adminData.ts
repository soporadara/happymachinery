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
  date: string
  readTime: string
  author: string
}

export interface MediaItem {
  id: string
  title: string
  url: string
  dateAdded: string
  size?: string
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
  text: string
  date: string
  isSeller?: boolean
}

export interface BlogComment {
  id: number
  postId: number
  postTitle: string
  author: string
  text: string
  date: string
  status: 'Pending' | 'Approved' | 'Spam'
  reply?: { author: string; text: string; date: string }
  replies?: BlogReply[]
  likes?: number
}

// Initial Default Posts
export const DEFAULT_POSTS: BlogPost[] = [
  {
    id: 100,
    title: 'Maximizing Skid Steer Efficiency & Safety on Residential Jobsites',
    slug: 'maximizing-skid-steer-efficiency-and-safety-on-residential-jobsites',
    category: 'Jobsite Productivity',
    excerpt: 'Key strategies and essential attachments to maximize efficiency, protect turf, and boost operator safety when operating compact skid steers on tight residential lots.',
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
    image: '/images/why-choose-v900-jobsite.png',
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
    image: '/images/fork-red-jobsite.png',
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
    image: '/images/fork-blue-jobsite.png',
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
    image: '/images/why-choose-v900-jobsite.png',
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
    image: '/images/loader-yellow.jpg',
    date: 'August 10, 2026',
    readTime: '4 min read',
    author: 'Happy Machinery'
  },
  {
    id: 1,
    title: 'How to Choose the Right Mini Track Loader for Your Jobsite',
    category: 'Equipment Guide',
    excerpt: 'Operating weight, hydraulic flow, track contact length, and attachment compatibility are critical parameters to consider before purchasing.',
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
    image: '/images/why-choose-v900-jobsite.png',
    date: 'July 18, 2026',
    readTime: '5 min read',
    author: 'Antigravity Machinery Team'
  },
  {
    id: 2,
    title: 'Stand-On Track Loaders vs. Wheeled Skid Steers',
    category: 'Equipment Comparison',
    excerpt: 'Understand ground pressure dynamics, grading capabilities, and track durability differences under residential and industrial soil conditions.',
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
    image: '/images/fork-red-jobsite.png',
    date: 'July 12, 2026',
    readTime: '6 min read',
    author: 'Field Engineering Dept.'
  },
  {
    id: 3,
    title: 'Daily Preventive Maintenance Checklist for Track Loaders',
    category: 'Maintenance & Service',
    excerpt: 'Keep your machinery running through every shift. Essential checks for hydraulic fluid, track tension, and grease points that save thousands.',
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
    image: '/images/fork-blue-jobsite.png',
    date: 'July 05, 2026',
    readTime: '4 min read',
    author: 'Technical Service Division'
  }
]

const EXISTING_PRODUCTS: AdminProduct[] = [
  {
    id: 901,
    name: 'Skid Steer V900 — Crimson Red',
    sku: 'V900-RED',
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
    name: 'Skid Steer V900 — Industrial Yellow',
    sku: 'V900-YELLOW',
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
    name: 'Skid Steer V900 — Cobalt Blue',
    sku: 'V900-BLUE',
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

// Default Media Assets
export const DEFAULT_MEDIA: MediaItem[] = [
  { id: '1', title: 'V900 Jobsite Operations', url: '/images/why-choose-v900-jobsite.png', dateAdded: '2026-07-18', size: '3.0 MB' },
  { id: '2', title: 'V900 Red Edition Pallet Fork', url: '/images/fork-red-jobsite.png', dateAdded: '2026-07-12', size: '2.7 MB' },
  { id: '3', title: 'V900 Blue Edition Jobsite', url: '/images/fork-blue-jobsite.png', dateAdded: '2026-07-05', size: '2.7 MB' },
  { id: '4', title: 'V900 Yellow Edition Jobsite', url: '/images/fork-yellow-jobsite.png', dateAdded: '2026-07-01', size: '2.7 MB' },
  { id: '5', title: 'Crimson Red Loader Studio', url: '/images/loader-red.jpg', dateAdded: '2026-06-25', size: '491 KB' },
  { id: '6', title: 'Industrial Yellow Loader Studio', url: '/images/loader-yellow.jpg', dateAdded: '2026-06-25', size: '302 KB' },
  { id: '7', title: 'Cobalt Blue Loader Studio', url: '/images/loader-blue.jpg', dateAdded: '2026-06-25', size: '541 KB' },
  { id: '8', title: 'V900 Transport Delivery', url: '/images/v900-delivery.png', dateAdded: '2026-06-20', size: '2.2 MB' }
]

// Default inquiries
export const DEFAULT_INQUIRIES: Inquiry[] = [
  { id: 1, name: 'Jason Miller', email: 'jason@millerbuilt.com', phone: '214-555-0182', company: 'Miller Landscaping Services', message: 'Looking for a quote on the V900 loader in yellow with the pallet fork and auger attachments. Need delivery to Dallas.', date: '2026-07-22', status: 'New', productInterest: 'TYPHON V900 Mini Track Loader' },
  { id: 2, name: 'Sarah Jenkins', email: 's.jenkins@epiccontractors.com', phone: '312-555-9831', company: 'Epic Infrastructure Group', message: 'Need bulk pricing for 3 units of the V900 loader. Do you offer warranty extensions for commercial fleets?', date: '2026-07-21', status: 'In Progress', productInterest: 'TYPHON V900 Mini Track Loader' },
  { id: 3, name: 'Robert Chen', email: 'rchen@pacificbuilders.org', phone: '650-555-2245', company: 'Pacific Builders LLC', message: 'Interested in the mini excavator attachments. Will the standard auger plate fit older bobcat models?', date: '2026-07-20', status: 'Contacted', productInterest: 'Universal Pallet Forks' },
  { id: 4, name: 'David Vance', email: 'dvance@vanceconcrete.com', phone: '305-555-8812', company: 'Vance Concrete Contractors', message: 'Are the tracks non-marking rubber? We do indoor warehouse slab work and want to avoid track lines.', date: '2026-07-18', status: 'Resolved', productInterest: 'TYPHON V900 Mini Track Loader' }
]

// Default comments
export const DEFAULT_COMMENTS: BlogComment[] = [
  { id: 1, postId: 1, postTitle: 'How to Choose the Right Mini Track Loader', author: 'Markus T.', text: 'Very detailed breakdown. The 12.7 GPM flow on the D1105 makes a massive difference for high-speed drilling.', date: '2026-07-22', status: 'Pending' },
  { id: 2, postId: 2, postTitle: 'Stand-On Track Loaders vs. Wheeled Skid Steers', author: 'Alisha Ramirez', text: 'We replaced two of our older skid steers with stand-on tracks and saved a lot of yard clean-up repair time.', date: '2026-07-21', status: 'Approved' },
  { id: 3, postId: 1, postTitle: 'How to Choose the Right Mini Track Loader', author: 'Anonymous Vendor', text: 'Check out cheap equipment deals on this link! spam-link.xyz', date: '2026-07-20', status: 'Spam' }
]
