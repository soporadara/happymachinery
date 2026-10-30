export interface HomeHeroContent {
  visible: boolean
  videoUrl: string
  posterUrl: string
  eyebrow: string
  titleRed: string
  titleYellow: string
  titleBlue: string
  description: string
  primaryBtnText: string
  primaryBtnUrl: string
  secondaryBtnText: string
  secondaryBtnUrl: string
  highlights: { tag: string; label: string }[]
}

export interface HomeFeaturesOverviewContent {
  visible: boolean
  eyebrow: string
  title: string
  subtitle: string
  features: {
    kicker: string
    title: string
    text: string
  }[]
}

export interface HomePromoContent {
  visible: boolean
  kicker: string
  title: string
  titleHighlight: string
  discountBadgeText: string
  nowPriceText: string
  originalPriceText: string
  buttonText: string
  buttonUrl: string
  imageUrl: string
  colorLabel: string
}

export interface HomeFeaturedFleetContent {
  visible: boolean
  eyebrow: string
  title: string
  description: string
}

export interface HomeForkShowcaseContent {
  visible: boolean
  eyebrow: string
  title: string
  price: string
  intro: string
  redImageUrl: string
  yellowImageUrl: string
  blueImageUrl: string
  quickSpecs: { label: string; value: string }[]
  highlights: { icon: string; title: string; desc: string }[]
  btnText: string
  btnUrl: string
}

export interface HomeWhyContent {
  visible: boolean
  eyebrow: string
  title: string
  description: string
  imageUrl: string
  specs: {
    stat: string
    unit: string
    title: string
    desc: string
    x: string
    y: string
    label: string
  }[]
}

export interface HomePerformanceContent {
  visible: boolean
  eyebrow: string
  title: string
  lead: string
  ctaText: string
  ctaUrl: string
  videos: {
    src: string
    poster: string
    number: string
    tag: string
    title: string
    text: string
  }[]
}

export interface HomeFaqContent {
  visible: boolean
  eyebrow: string
  title: string
  description: string
  contactPromptText: string
  contactLinkText: string
  contactLinkUrl: string
  faqs: {
    question: string
    answer: string
  }[]
}

export interface HomeAdvantagesContent {
  visible: boolean
  eyebrow: string
  title: string
  description: string
  advantages: {
    title: string
    text: string
  }[]
}

export interface HomeDeliveryContent {
  visible: boolean
  eyebrow: string
  title: string
  intro: string
  imageUrl: string
  badgeTitle: string
  badgeSubtitle: string
  steps: {
    number: string
    title: string
    text: string
  }[]
  btnText: string
  btnUrl: string
  note: string
}

export interface HomeYoutubeContent {
  visible: boolean
  eyebrow: string
  title: string
  description: string
  videos: {
    embedUrl: string
    tag: string
    title: string
  }[]
}

export interface HomeFeedbackContent {
  visible: boolean
  eyebrow: string
  title: string
  description: string
  bottomPrompt: string
  bottomLinkText: string
  bottomLinkUrl: string
  testimonials: {
    stars: string
    quote: string
    avatar: string
    name: string
    role: string
  }[]
}

export interface HomeCtaStripContent {
  visible: boolean
  title: string
  titleHighlight: string
  subtitle: string
  primaryBtnText: string
  primaryBtnUrl: string
  secondaryBtnText: string
  secondaryBtnUrl: string
}

export interface HomeLatestArticlesContent {
  visible?: boolean
  eyebrow?: string
  title?: string
  description?: string
  viewAllText?: string
  viewAllUrl?: string
}

export interface HomePageContent {
  hero: HomeHeroContent
  featuresOverview: HomeFeaturesOverviewContent
  promo: HomePromoContent
  featuredFleet: HomeFeaturedFleetContent
  forkShowcase: HomeForkShowcaseContent
  why: HomeWhyContent
  performance: HomePerformanceContent
  faq: HomeFaqContent
  advantages: HomeAdvantagesContent
  delivery: HomeDeliveryContent
  youtube: HomeYoutubeContent
  latestArticles?: HomeLatestArticlesContent
  feedback: HomeFeedbackContent
  ctaStrip: HomeCtaStripContent
  updatedAt?: string
}

export const DEFAULT_HOME_CONTENT: HomePageContent = {
  hero: {
    visible: true,
    videoUrl: '/images/home-hero-optimized.m4v',
    posterUrl: '/images/hero-v900-three-colors.png',
    eyebrow: 'American Heavy Equipment & Machinery',
    titleRed: 'Skid Steer',
    titleYellow: 'V900',
    titleBlue: 'by TYPHON',
    description: 'Discover the premier American skid steer V900 from Happy Machinery. Built by TYPHON Machinery with genuine Kubota diesel power, this compact tracked loader delivers heavy-duty earthmoving and excavation capability, with universal attachments, mini excavator pairing, and nationwide USA delivery.',
    primaryBtnText: 'Explore Featured Fleet',
    primaryBtnUrl: '#featured-fleet',
    secondaryBtnText: 'Get Specs & Pricing',
    secondaryBtnUrl: '/contact',
    highlights: [
      { tag: '★ 4.9/5', label: '120+ Reviews' },
      { tag: 'Kubota EPA', label: 'Diesel Power' },
      { tag: 'Quick-Tach', label: 'Plate Std' },
      { tag: 'USA', label: 'Direct Delivery' }
    ]
  },
  featuresOverview: {
    visible: true,
    eyebrow: 'V900 Engineering',
    title: 'Compact machine. Serious capability.',
    subtitle: 'Three systems working together to deliver full-size productivity in an agile, American skid steer and mini excavator work footprint.',
    features: [
      {
        kicker: 'High-Flow Performance',
        title: 'Faster Cycles. More Work Done.',
        text: 'Responsive hydraulics provide smooth attachment control and faster loading cycles, helping crews stay productive throughout the day.'
      },
      {
        kicker: 'Stable Lifting Power',
        title: 'Lift More with Confidence.',
        text: 'A balanced tracked platform keeps heavy loads composed, giving operators greater control from pickup through placement.'
      },
      {
        kicker: 'Go-Anywhere Agility',
        title: 'Work Where Others Cannot.',
        text: 'The ultra-slim footprint moves through tight gates and confined job sites while tracked traction keeps movement steady.'
      }
    ]
  },
  promo: {
    visible: true,
    kicker: 'Limited-time fleet offer',
    title: 'Save 23% on the',
    titleHighlight: 'V900 Fleet',
    discountBadgeText: 'Save 23%',
    nowPriceText: '$11,999',
    originalPriceText: '$15,500',
    buttonText: 'Shop V900 packages →',
    buttonUrl: '#featured-fleet',
    imageUrl: '/images/v900-promo.webp',
    colorLabel: 'Three signature colors'
  },
  featuredFleet: {
    visible: true,
    eyebrow: 'Featured Fleet',
    title: 'Skid Steer V900',
    description: 'The power and flexibility your job site demands. Built by TYPHON Machinery and available in 3 signature colors with a standard utility bucket. Compatible with American skid steer and mini excavator universal quick-tach attachments.'
  },
  forkShowcase: {
    visible: true,
    eyebrow: 'Optional Attachment',
    title: 'TYPH-5005M Pallet Fork',
    price: '$1,299',
    intro: 'Turn the compact V900 into a confident material handler. The quick-attach pallet fork package delivers controlled lifting, stable transport, and faster changeovers on busy job sites. Hover over the loader hotspots to inspect the system.',
    redImageUrl: '/images/fork-red-jobsite.png',
    yellowImageUrl: '/images/fork-yellow-jobsite.png',
    blueImageUrl: '/images/fork-blue-jobsite.png',
    quickSpecs: [
      { label: 'Hydraulic Response', value: '12.7 GPM Flow' },
      { label: 'Rated Capacity', value: '1,014 lbs' },
      { label: 'Attachment Swap', value: 'Under 2 Minutes' }
    ],
    highlights: [
      { icon: '💪', title: 'Forged Steel Strength', desc: 'Heavy-duty structural steel tines optimized to support loads up to 1,500 lbs without bending.' },
      { icon: '↕️', title: 'Slide-Adjustable Spacing', desc: 'Forks slide smoothly on locking rails from 8" to 36" wide, adjusting instantly for standard pallets, logs, and pipes.' },
      { icon: '⚡', title: 'Quick-Tach Mounting', desc: 'Universal quick-attach system allows quick changeovers from bucket to forks in under 2 minutes.' },
      { icon: '🛡️', title: 'Integrated Spill Guard', desc: 'High-strength safety backrest prevents sliding materials from slipping backwards, ensuring safe operations.' }
    ],
    btnText: '',
    btnUrl: ''
  },
  why: {
    visible: true,
    eyebrow: 'The V900 Advantage',
    title: 'Why choose the TYPHON V900?',
    description: 'Five reasons crews are replacing full-sized skid steers with an agile American skid steer machine that fits through a backyard gate and still moves like one twice its size. Hover or tap a spec to see where it lives on the machine.',
    imageUrl: '/images/why-choose-v900-jobsite.png',
    specs: [
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
  },
  performance: {
    visible: true,
    eyebrow: 'Performance in Action',
    title: 'See what the V900 can do.',
    lead: 'Real machine. Real terrain. Watch the V900 turn compact dimensions, hydraulic power, and tracked stability into productive work.',
    ctaText: '',
    ctaUrl: '',
    videos: [
      {
        src: '/videos/v900-lift-performance.mp4',
        poster: '/images/fork-red-jobsite.png',
        number: '01',
        tag: 'Lift & Carry',
        title: 'Confident material handling',
        text: 'Responsive hydraulics and a stable tracked stance keep every lift controlled from pickup to placement.'
      },
      {
        src: '/videos/v900-jobsite-performance.mp4',
        poster: '/images/why-choose-v900-jobsite.png',
        number: '02',
        tag: 'Job-Site Agility',
        title: 'Built to work in tight spaces',
        text: 'A compact footprint gives operators the freedom to move through narrow access points without sacrificing capability.'
      },
      {
        src: '/videos/v900-ground-performance.mp4',
        poster: '/images/v900-equipment-layout.png',
        number: '03',
        tag: 'Tracked Control',
        title: 'Traction you can count on',
        text: 'Low ground-pressure tracks deliver composed movement and dependable grip across demanding work surfaces.'
      }
    ]
  },
  faq: {
    visible: true,
    eyebrow: 'Questions, Answered',
    title: 'Everything you need to know before choosing a V900.',
    description: 'Clear answers about capability, attachments, ordering, and delivery. For live pricing or inventory, our team can prepare a current quote.',
    contactPromptText: 'Still have a question?',
    contactLinkText: 'Talk to our team →',
    contactLinkUrl: '/contact',
    faqs: [
      {
        question: 'What mini excavators and skid steers does TYPHON Machinery offer?',
        answer: 'TYPHON Machinery manufactures heavy-duty commercial equipment, including the TYPHON KUVUO 4.0 Mini Excavator (4-ton class with Kubota D1703 diesel and True Zero Tail Swing), the TYPHON KUVUO 2.7 Mini Excavator (2.7-ton class with Kubota D1105 diesel, retractable metal tracks, and protected inverted boom), and the flagship STOMP V900 American Skid Steer Compact Track Loader with 25 HP Kubota power and 1,102 lb capacity. All units are supported with nationwide USA delivery and commercial warranty.'
      },
      {
        question: 'Can mini excavator attachments be shared with skid steers?',
        answer: 'Yes. TYPHON Machinery skid steers and compact equipment utilize universal quick-attach mounting plates (standard SAE J2513) and auxiliary high-flow hydraulic connections (up to 12.7 GPM on V900, 20.9 GPM on KUVUO 4.0), allowing operators to share hydraulic augers, trenchers, pallet forks, and breaker attachments across compatible equipment.'
      },
      {
        question: 'How much can the V900 lift?',
        answer: 'The V900 has a rated operating capacity of 1,014 lbs (460 kg). Actual safe handling depends on the attachment, load position, terrain, and operating conditions.'
      },
      {
        question: 'Will it fit through a standard backyard gate?',
        answer: 'The machine is 35.9 inches (911 mm) wide, allowing it to pass through many 36-inch openings. Always measure the complete access route and allow suitable clearance before delivery.'
      },
      {
        question: 'Which attachment should I choose?',
        answer: 'Choose the standard bucket for digging, grading, and loose material. Choose the TYPH-5005M pallet fork for pallets, blocks, logs, and job-site supplies.'
      },
      {
        question: 'Can I purchase the machine directly?',
        answer: 'Yes. Visit the Store to select a package, or request a quote with your preferred color, attachment, and delivery ZIP code for an accurate total.'
      },
      {
        question: 'Is nationwide delivery available?',
        answer: 'Nationwide US shipping is available. The machine is prepared and secured for transport, and the team coordinates delivery details before dispatch.'
      },
      {
        question: 'What warranty is included?',
        answer: 'The website lists a 1-year commercial warranty. Request the complete written warranty terms, exclusions, and claim process from the sales team before purchasing.'
      }
    ]
  },
  advantages: {
    visible: true,
    eyebrow: 'Key Advantages',
    title: 'Built For The Field.',
    description: 'Every engineering decision on the TYPHON Machinery V900 focuses on productivity, component lifespan, and ease of service.',
    advantages: [
      {
        title: 'Kubota Power',
        text: 'Equipped with a Japanese 25 HP Kubota D1105 diesel engine, renowned worldwide for longevity and fuel economy.'
      },
      {
        title: 'Universal Quick-Attach',
        text: 'Standard SAE J2513 plate fits American skid steer attachments and tools, interchangeable with mini excavator worksite equipment including augers, breakers, and trenches.'
      },
      {
        title: 'Pilot Controls',
        text: 'Highly responsive dual-joystick pilot controls provide comfortable, zero-fatigue steering and loader hydraulics operation.'
      },
      {
        title: 'High-Flow Hydraulics',
        text: 'Delivers 12.7 GPM pump flow at 2,321 psi operating pressure to fuel heavy-duty attachment systems.'
      }
    ]
  },
  delivery: {
    visible: true,
    eyebrow: 'From Our Yard to Yours',
    title: 'Delivery, handled.',
    intro: 'Your V900 is prepared, secured, and coordinated for dependable delivery across all 48 contiguous U.S. states. Our team keeps the process clear from order confirmation through arrival.',
    imageUrl: '/images/v900-delivery.png',
    badgeTitle: 'Load secured',
    badgeSubtitle: 'Ready for dispatch',
    steps: [
      {
        number: '01',
        title: 'Machine preparation',
        text: 'Your loader is checked and prepared with its selected package before dispatch.'
      },
      {
        number: '02',
        title: 'Secure transport',
        text: 'Equipment is carefully positioned and tied down for safe, stable transportation across the 48 contiguous U.S. states.'
      },
      {
        number: '03',
        title: 'Coordinated arrival',
        text: 'We confirm delivery details and help you plan for a smooth equipment handoff.'
      }
    ],
    btnText: 'Get a Delivery Quote',
    btnUrl: '/contact',
    note: 'Shipping available across 48 contiguous U.S. states'
  },
  youtube: {
    visible: true,
    eyebrow: 'Watch the V900 Work',
    title: 'See the skid steer in action.',
    description: 'Explore real V900 walkarounds, operating highlights, and equipment details from the field.',
    videos: [
      {
        embedUrl: 'https://www.youtube-nocookie.com/embed/ohPfpKb1KBY',
        tag: 'Fleet Introduction',
        title: 'Meet the TYPHON STOMP V900'
      },
      {
        embedUrl: 'https://www.youtube-nocookie.com/embed/NRtbw6hlbIs',
        tag: 'Machine Walkaround',
        title: '25 HP Kubota-Powered Skid Steer'
      },
      {
        embedUrl: 'https://www.youtube-nocookie.com/embed/TESbJHPzlOQ',
        tag: 'Product Highlight',
        title: 'Introducing the All-New STOMP V900'
      }
    ]
  },
  feedback: {
    visible: true,
    eyebrow: 'Customer Reviews ★★★★★ 4.9 / 5.0 Rated',
    title: 'Rated 4.9/5 by 120+ Contractors Nationwide',
    description: 'From tight-access residential landscaping to demanding commercial excavation, contractors rely on the TYPHON V900 for durable Kubota diesel power, responsive controls, and dedicated USA warranty support.',
    bottomPrompt: 'Own a TYPHON machine? Share your jobsite experience with our team.',
    bottomLinkText: 'Submit Your Review →',
    bottomLinkUrl: '/contact',
    testimonials: [
      {
        stars: '★★★★★ 5.0',
        quote: 'The compact 35.9-inch width is the reason we chose the TYPHON V900. We move through backyard gates, finish grading work, and load material without bringing a full-size machine onto residential property. 4.9 out of 5 easily!',
        avatar: 'LC',
        name: 'Landscaping Crew Leader',
        role: 'Residential Earthworks, Ohio'
      },
      {
        stars: '★★★★★ 5.0',
        quote: 'The pilot joystick controls are silky responsive and the tracked stance feels rock-solid composed carrying 1,000 lb paver pallets. Switching from the bucket to pallet forks keeps the day moving fast.',
        avatar: 'PM',
        name: 'Property Maintenance Pro',
        role: 'Material Handling, Texas'
      },
      {
        stars: '★★★★★ 5.0',
        quote: 'The delivery process was clear from scheduling through arrival. The machine was secured properly, and our team knew what to prepare before it reached the site. Exceptional equipment and support.',
        avatar: 'FO',
        name: 'Fleet Operations Manager',
        role: 'Commercial Fleet, Florida'
      }
    ]
  },
  latestArticles: {
    visible: true,
    eyebrow: 'Equipment Insights & Field Guides',
    title: 'Mini Excavator & Skid Steer Knowledge Hub',
    description: 'Explore heavy compact excavator sizing guides, Kubota diesel maintenance checklists, American skid steer jobsite tips, and equipment ROI breakdowns.',
    viewAllText: 'View All Blogs & Guides',
    viewAllUrl: '/blog'
  },
  ctaStrip: {
    visible: true,
    title: 'Ready to upgrade your fleet?',
    titleHighlight: 'TYPHON V900',
    subtitle: 'In stock now · 1-Year Commercial Warranty · US Shipping',
    primaryBtnText: 'Order Package',
    primaryBtnUrl: '/store',
    secondaryBtnText: 'Inquire Now',
    secondaryBtnUrl: '/contact'
  }
}
