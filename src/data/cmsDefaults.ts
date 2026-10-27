import type { 
  AdminUser, 
  SecuritySettings, 
  SiteSettings, 
  SitePage
} from './cmsTypes'

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  maxFailedAttempts: 5,
  lockoutWindowMinutes: 15,
  lockoutDurationMinutes: 30,
  sessionTimeoutMinutes: 120,
  autoBanThreshold: 10,
  enableIpWhitelisting: false,
  whitelistedIps: ['127.0.0.1', '::1'],
  requirePasswordComplexity: true,
  autoSignOutEnabled: false,
  autoSignOutSeconds: 300
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: 'Happy Machinery',
  tagline: 'Compact Heavy Equipment & Attachments',
  contactEmail: 'support@typhonmachinery.com',
  phone: '+1 (213) 214-2203',
  address: '2522 S Malt Ave., Commerce, CA 90040, United States',
  businessHours: 'Monday – Friday: 8:00 AM – 6:00 PM CST',
  logo: '/images/header-logo.webp',
  favicon: 'https://lh3.googleusercontent.com/-UDuMZS2bji_GLgC69Z9-vrD4uLHxcqGQIYEHW3O85aWYN4nXhiAMjnQikFFbyOhUnfl',
  defaultSeoTitle: 'Happy Machinery | Compact Heavy Equipment Dealer',
  defaultSeoDescription: 'Discover compact excavators, mini track loaders, and electric machinery from Happy Machinery. Compare models, specs, and pricing today.',
  socialLinks: {
    facebook: 'https://facebook.com/happymachinery',
    twitter: 'https://twitter.com/happymachinery',
    youtube: 'https://youtube.com/@happymachinery'
  },
  footerCopyright: '© 2026 Happy Machinery. All rights reserved.',
  announcementBar: {
    enabled: true,
    text: 'Nationwide Delivery Available on All Skid Steer V900 Models',
    linkText: 'Explore Catalog',
    linkUrl: '/store'
  }
}

export const DEFAULT_ADMIN_USERS: AdminUser[] = [
  {
    id: 'usr-admin-primary',
    username: 'admin',
    name: 'Lead Administrator',
    email: 'soporadara@kiuq.com',
    googleLinked: true,
    googleEmail: 'soporadara@kiuq.com',
    role: 'Super Administrator',
    status: 'Active',
    avatar: 'https://lightcyan-weasel-711536.hostingersite.com/storage/avatars/UNOQP8Qv0cfy6L3twxNormAHlv7UnrVPV0Xs9k1c.jpg',
    createdAt: '2026-01-15T08:00:00Z',
    failedAttempts: 0,
    passwordHash: 'R@fel1802$$'
  }
]

export const DEFAULT_SITE_PAGES: SitePage[] = [
  {
    id: 'page-home',
    slug: '',
    title: 'Home Page',
    seoTitle: 'Happy Machinery | Compact Heavy Equipment Dealer',
    seoDescription: 'Discover compact excavators, mini track loaders, and electric machinery from Happy Machinery. Compare models, specs, and pricing today.',
    status: 'Published',
    updatedAt: '2026-08-18T00:00:00Z',
    sections: [
      {
        id: 'sec-hero',
        type: 'hero',
        title: 'Skid Steer V900 by TYPHON',
        subtitle: 'The ultimate compact track loader powered by Kubota D1105 Diesel. Built for residential tight access and rugged performance.',
        imageUrl: '/images/why-choose-v900-jobsite.png',
        buttons: [
          { id: 'btn-1', label: 'View Specifications', url: '/store', style: 'primary', actionType: 'link', enabled: true },
          { id: 'btn-2', label: 'Request Quote', url: '/contact', style: 'outline', actionType: 'quote', enabled: true }
        ],
        visible: true,
        order: 1
      },
      {
        id: 'sec-features',
        type: 'features',
        title: 'Engineered for Performance',
        subtitle: 'Heavy machinery features in an agile, stand-on compact frame.',
        visible: true,
        order: 2
      },
      {
        id: 'sec-products',
        type: 'products-grid',
        title: 'Featured Equipment & Colors',
        subtitle: 'Choose between Crimson Red, Desert Yellow, and Pacific Blue V900 editions.',
        visible: true,
        order: 3
      },
      {
        id: 'sec-cta',
        type: 'cta',
        title: 'Ready to Upgrade Your Jobsite Fleet?',
        subtitle: 'Nationwide freight shipping, full factory warranty, and dedicated parts support.',
        buttons: [
          { id: 'btn-3', label: 'Contact Sales Specialist', url: '/contact', style: 'amber', actionType: 'contact', enabled: true }
        ],
        visible: true,
        order: 4
      }
    ]
  },
  {
    id: 'page-about',
    slug: 'about',
    title: 'About Us',
    seoTitle: 'About Happy Machinery | Equipment Excellence',
    seoDescription: 'Learn about Happy Machinery, our heavy equipment standards, Kubota partnerships, and nationwide equipment delivery.',
    status: 'Published',
    updatedAt: '2026-08-18T00:00:00Z',
    sections: [
      {
        id: 'sec-about-hero',
        type: 'hero',
        title: 'About Happy Machinery',
        subtitle: 'Supplying heavy duty, job-tested compact construction machinery across the United States.',
        visible: true,
        order: 1
      }
    ]
  },
  {
    id: 'page-contact',
    slug: 'contact',
    title: 'Contact Us',
    seoTitle: 'Contact Happy Machinery | Sales & Support',
    seoDescription: 'Get in touch with Happy Machinery for equipment quotes, attachment specs, or maintenance inquiries.',
    status: 'Published',
    updatedAt: '2026-08-18T00:00:00Z',
    sections: [
      {
        id: 'sec-contact-hero',
        type: 'hero',
        title: 'Get In Touch',
        subtitle: 'Our machinery specialists are ready to answer technical and pricing questions.',
        visible: true,
        order: 1
      }
    ]
  }
]
