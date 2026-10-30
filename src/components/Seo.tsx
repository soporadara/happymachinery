import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getV900ProductId, getV900ProductPath } from '../data/v900Urls'
import { DEFAULT_POSTS, BlogPost } from '../pages/adminData'

const SITE_URL = 'https://happymachinery.com'
const DEFAULT_IMAGE = `${SITE_URL}/images/v900/v900-compact-track-loader-hero.webp`

const productSeo: Record<string, {
  name: string
  sku: string
  color: string
  description: string
  image: string
}> = {
  '901': {
    name: 'TYPHON STOMP V900 American Skid Steer – Red Edition',
    sku: 'TYPH-V900R',
    color: 'Crimson Red',
    description: 'Shop the red TYPHON STOMP V900 American skid steer compact track loader with a 25 HP Kubota D1105 diesel engine, 1,102 lb maximum load, universal attachments, and nationwide USA delivery.',
    image: `${SITE_URL}/images/loader-red.png`,
  },
  '902': {
    name: 'TYPHON STOMP V900 American Skid Steer – Yellow Edition',
    sku: 'TYPH-V900Y',
    color: 'Industrial Yellow',
    description: 'Shop the yellow TYPHON STOMP V900 American skid steer compact track loader with a 25 HP Kubota D1105 diesel engine, 1,102 lb maximum load, universal attachments, and nationwide USA delivery.',
    image: `${SITE_URL}/images/loader-yellow.png`,
  },
  '903': {
    name: 'TYPHON STOMP V900 American Skid Steer – Blue Edition',
    sku: 'TYPH-V900B',
    color: 'Cobalt Blue',
    description: 'Shop the blue TYPHON STOMP V900 American skid steer compact track loader with a 25 HP Kubota D1105 diesel engine, 1,102 lb maximum load, universal attachments, and nationwide USA delivery.',
    image: `${SITE_URL}/images/loader-blue.png`,
  },
}

const setMeta = (selector: string, attribute: 'name' | 'property', key: string, content: string) => {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  element.content = content
}

export default function Seo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const productKey = pathname.match(/^\/product\/([^/]+)\/?$/)?.[1]
    const productId = getV900ProductId(productKey)
    const product = productId ? productSeo[productId] : undefined

    let title = 'TYPHON Machinery | Mini Excavator & Skid Steer Loaders USA | Happy Machinery'
    let description = 'Official USA dealer for TYPHON Machinery. Discover American skid steer loaders, TYPHON KUVUO mini excavators (2.7T & 4.0T), compact track loaders & Kubota diesel equipment with nationwide shipping, parts, and full warranty support.'
    let keywords = 'mini excavator, skid steer, typhon machinery, american skid steer, mini excavator usa, compact excavator, typhon mini excavator, compact track loader, skid steer v900, typhon kuvuo, kubota diesel mini excavator, heavy equipment usa, mini excavator attachments, skid steer attachments, small excavator for sale usa'
    let image = DEFAULT_IMAGE
    let canonicalPath = pathname === '/' ? '/' : pathname.replace(/\/+$/, '')
    let robots = 'index, follow, max-image-preview:large'
    let pageType = 'website'
    let schema: Record<string, unknown> | { '@graph': Record<string, unknown>[] } = {
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${SITE_URL}/#organization`,
          name: 'Happy Machinery',
          alternateName: ['TYPHON Machinery USA', 'Happy Machinery - American Skid Steer & Mini Excavator', 'TYPHON Commercial Heavy Equipment'],
          url: `${SITE_URL}/`,
          logo: {
            '@type': 'ImageObject',
            url: `${SITE_URL}/logo.png`,
          },
          email: 'support@happymachinery.com',
          brand: {
            '@type': 'Brand',
            name: 'TYPHON Machinery',
          },
          description: 'Official USA distributor of TYPHON Machinery, American skid steers, mini excavators, and compact heavy equipment.',
          knowsAbout: [
            'Mini Excavator',
            'Skid Steer',
            'American Skid Steer',
            'American Excavator',
            'Mini Excavator USA',
            'TYPHON Machinery',
            'Compact Track Loaders',
            'Kubota Diesel Engines',
            'Heavy Machinery Attachments'
          ],
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9',
            reviewCount: '128',
            ratingCount: '128',
            bestRating: '5',
            worstRating: '1',
          },
        },
        {
          '@type': 'WebSite',
          '@id': `${SITE_URL}/#website`,
          url: `${SITE_URL}/`,
          name: 'Happy Machinery',
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${SITE_URL}/blog?q={search_term_string}`
            },
            'query-input': 'required name=search_term_string'
          },
          publisher: { '@id': `${SITE_URL}/#organization` },
        },
        {
          '@type': 'ItemList',
          '@id': `${SITE_URL}/#featured-fleet-list`,
          name: 'Featured TYPHON Machinery Heavy Equipment',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'TYPHON STOMP V900 American Skid Steer Loader (25 HP Kubota Diesel)',
              url: `${SITE_URL}/product/typhon-stomp-v900-mini-track-loader-kubota-d1105`
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'TYPHON KUVUO 4.0 Heavy Compact Mini Excavator (Kubota D1703, Zero Tail Swing)',
              url: `${SITE_URL}/blog/the-ultimate-guide-to-heavy-compact-excavators-sizing-hydraulics-and-performance-in-the-2-7-ton-to-4-ton`
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: 'TYPHON KUVUO 2.7 Mini Excavator KONSTRUCTZ Series (Inverted Boom, Retractable Tracks)',
              url: `${SITE_URL}/blog/the-ultimate-guide-to-heavy-compact-excavators-sizing-hydraulics-and-performance-in-the-2-7-ton-to-4-ton`
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: 'TYPH-5005M Heavy Duty Skid Steer Pallet Fork Attachment',
              url: `${SITE_URL}/product/typh-5005m-pallet-fork`
            }
          ]
        },
        {
          '@type': 'FAQPage',
          '@id': `${SITE_URL}/#faq`,
          mainEntity: [
            {
              '@type': 'Question',
              name: 'What mini excavators and skid steers does TYPHON Machinery manufacture?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'TYPHON Machinery manufactures commercial heavy equipment including the TYPHON KUVUO 4.0 Mini Excavator (4-ton class with Kubota D1703 diesel and True Zero Tail Swing), the TYPHON KUVUO 2.7 Mini Excavator (2.7-ton class with Kubota D1105 diesel, retractable metal tracks, and protected inverted boom), and the flagship STOMP V900 American Skid Steer Compact Track Loader with 25 HP Kubota power and 1,102 lb capacity.'
              }
            },
            {
              '@type': 'Question',
              name: 'Why choose TYPHON Machinery with Kubota diesel engines?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'TYPHON machines feature genuine EPA-certified Japanese Kubota diesel engines (D1105 and D1703) known globally for high torque at low RPM, fuel efficiency, and nationwide parts and technician availability across the United States.'
              }
            },
            {
              '@type': 'Question',
              name: 'Where can I buy TYPHON Machinery mini excavators and skid steers in the USA?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Happy Machinery is an official authorized USA dealer for TYPHON Machinery, providing direct factory packages, universal quick-attach accessories, commercial financing quotes, and secured freight delivery across all 48 contiguous U.S. states with standard 1-year commercial warranty support.'
              }
            }
          ]
        },
        {
          '@type': 'WebPage',
          '@id': `${SITE_URL}/#webpage`,
          url: `${SITE_URL}/`,
          name: 'TYPHON Machinery — Mini Excavator & Skid Steer Loaders USA | Happy Machinery',
          description: 'Official USA dealer for TYPHON Machinery. Discover American skid steer loaders, TYPHON KUVUO mini excavators (2.7T & 4.0T), compact track loaders & Kubota diesel equipment with nationwide shipping and full warranty support.',
          primaryImageOfPage: {
            '@type': 'ImageObject',
            contentUrl: `${SITE_URL}/images/why-choose-v900-jobsite.png`,
            name: 'TYPHON Machinery STOMP V900 American skid steer lineup',
            caption: 'Crimson Red, Industrial Yellow, and Cobalt Blue TYPHON STOMP V900 American skid steer machines on a jobsite.',
          },
          isPartOf: { '@id': `${SITE_URL}/#website` },
        },
        {
          '@type': 'VideoObject',
          '@id': `${SITE_URL}/#v900-lift-video`,
          name: 'TYPHON STOMP V900 Lift and Carry Performance',
          description: 'See the TYPHON STOMP V900 mini skid steer lift, carry, and place materials using responsive hydraulics and a stable tracked platform.',
          thumbnailUrl: `${SITE_URL}/images/fork-red-jobsite.png`,
          uploadDate: '2026-07-22T14:29:40+07:00',
          contentUrl: `${SITE_URL}/videos/v900-lift-performance.mp4`,
          mainEntityOfPage: `${SITE_URL}/#performance`,
        },
        {
          '@type': 'VideoObject',
          '@id': `${SITE_URL}/#v900-jobsite-video`,
          name: 'TYPHON STOMP V900 Jobsite Agility Performance',
          description: 'Watch the compact TYPHON STOMP V900 mini skid steer maneuver through confined jobsites and narrow access points.',
          thumbnailUrl: `${SITE_URL}/images/why-choose-v900-jobsite.png`,
          uploadDate: '2026-07-22T14:29:40+07:00',
          contentUrl: `${SITE_URL}/videos/v900-jobsite-performance.mp4`,
          mainEntityOfPage: `${SITE_URL}/#performance`,
        },
        {
          '@type': 'VideoObject',
          '@id': `${SITE_URL}/#v900-ground-video`,
          name: 'TYPHON STOMP V900 Tracked Ground Performance',
          description: 'See the TYPHON STOMP V900 compact track loader maintain traction and controlled movement across demanding work surfaces.',
          thumbnailUrl: `${SITE_URL}/images/v900-equipment-layout.png`,
          uploadDate: '2026-07-22T14:29:40+07:00',
          contentUrl: `${SITE_URL}/videos/v900-ground-performance.mp4`,
          mainEntityOfPage: `${SITE_URL}/#performance`,
        },
      ],
    }

    if (product) {
      canonicalPath = getV900ProductPath(productId!)
      title = `${product.name} | Happy Machinery`
      description = product.description
      image = product.image
      pageType = 'product'
      schema = {
        '@graph': [
          {
            '@type': 'Product',
            '@id': `${SITE_URL}${canonicalPath}#product`,
            name: product.name,
            description: product.description,
            sku: product.sku,
            mpn: product.sku,
            model: 'V900',
            color: product.color,
            image: [
              {
                '@type': 'ImageObject',
                contentUrl: product.image,
                name: product.name,
                caption: `${product.color} TYPHON STOMP V900 American skid steer compact track loader.`,
              },
              {
                '@type': 'ImageObject',
                contentUrl: `${SITE_URL}/images/why-choose-v900-jobsite.png`,
                name: 'TYPHON STOMP V900 jobsite lineup',
                caption: 'TYPHON STOMP V900 American skid steer machines working on a construction jobsite.',
              },
            ],
            category: 'Compact tracked skid steer loaders',
            brand: { '@type': 'Brand', name: 'TYPHON Machinery' },
            manufacturer: { '@type': 'Organization', name: 'TYPHON Machinery' },
            offers: {
              '@type': 'Offer',
              url: `${SITE_URL}${canonicalPath}`,
              price: '11999.00',
              priceCurrency: 'USD',
              availability: 'https://schema.org/InStock',
              itemCondition: 'https://schema.org/NewCondition',
              seller: { '@id': `${SITE_URL}/#organization` },
            },
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: '4.9',
              reviewCount: '48',
              ratingCount: '48',
              bestRating: '5',
              worstRating: '1',
            },
            review: [
              {
                '@type': 'Review',
                author: { '@type': 'Person', name: 'Mark Dawson' },
                datePublished: '2026-08-14',
                reviewBody: 'The Kubota D1105 diesel engine has incredible torque. Fits right through narrow 36-inch gates on our residential grading contracts. The hydraulic control response is silky smooth.',
                reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' }
              },
              {
                '@type': 'Review',
                author: { '@type': 'Person', name: 'Kevin Miller' },
                datePublished: '2026-08-22',
                reviewBody: 'We purchased the package with the TYPH-5005M pallet fork. Moving 1,000 lb paver pallets in tight backyards has cut our job times in half. Excellent machine!',
                reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' }
              },
              {
                '@type': 'Review',
                author: { '@type': 'Person', name: 'Dave Hendrickson' },
                datePublished: '2026-09-05',
                reviewBody: 'Solid heavy-gauge steel chassis, reliable hydraulics, and fast cold-start performance. Has logged over 420 hours without a hitch.',
                reviewRating: { '@type': 'Rating', ratingValue: '5', bestRating: '5' }
              }
            ],
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
              { '@type': 'ListItem', position: 2, name: 'Store', item: `${SITE_URL}/store` },
              { '@type': 'ListItem', position: 3, name: product.name, item: `${SITE_URL}${canonicalPath}` },
            ],
          },
        ],
      }
    } else if (pathname.startsWith('/store')) {
      title = 'TYPHON Machinery Store | Mini Excavators & Skid Steer Equipment USA'
      description = 'Shop official TYPHON Machinery heavy equipment in the USA. Browse compact track skid steers, mini excavator attachments, buckets, pallet forks, and Kubota parts with warranty.'
      keywords = 'buy mini excavator, skid steer for sale, typhon machinery store, mini excavator attachments usa, compact track loader price, typhon kuvuo, kubota excavator parts'
      canonicalPath = pathname
      schema = {
        '@type': 'CollectionPage',
        name: 'TYPHON Machinery Equipment Store',
        url: `${SITE_URL}${canonicalPath}`,
        description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
      }
    } else if (pathname === '/about') {
      title = 'About Happy Machinery | Official TYPHON Machinery USA Dealer'
      description = 'Learn about Happy Machinery, the premier USA supplier of TYPHON Machinery, American skid steers, mini excavators, attachments, and nationwide warranty support.'
      keywords = 'about typhon machinery, happy machinery usa, heavy equipment supplier, american skid steer dealer'
      schema = { '@type': 'AboutPage', name: 'About Happy Machinery', url: `${SITE_URL}/about`, description }
    } else if (pathname === '/contact') {
      title = 'Contact Happy Machinery | TYPHON Machinery Skid Steer & Excavator Support'
      description = 'Contact Happy Machinery for TYPHON Machinery pricing, American skid steer specifications, mini excavator attachments, freight delivery, and nationwide support.'
      keywords = 'contact typhon machinery, equipment quote, mini excavator price, skid steer quote usa'
      schema = { '@type': 'ContactPage', name: 'Contact Happy Machinery', url: `${SITE_URL}/contact`, description }
    } else if (pathname === '/blog') {
      title = 'TYPHON Machinery Blog | Mini Excavator USA & Skid Steer Guides'
      description = 'Technical equipment breakdowns, American skid steer comparisons, mini excavator USA insights, hydraulic maintenance, and expert field advice from Happy Machinery.'
      keywords = 'mini excavator guide, skid steer guide, typhon machinery blog, compact excavator tips, kubota diesel excavator, skid steer maintenance usa, excavator boom engineering'
      canonicalPath = '/blog'
      schema = {
        '@graph': [
          {
            '@type': 'Blog',
            '@id': `${SITE_URL}/blog#blog`,
            name: 'Happy Machinery Editorial & Technical Blog',
            url: `${SITE_URL}/blog`,
            description,
            publisher: { '@id': `${SITE_URL}/#organization` },
          },
          {
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
              { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
            ],
          },
        ],
      }
    } else if (pathname.startsWith('/blog/')) {
      const blogSlug = pathname.replace(/^\/blog\/?/, '').replace(/\/+$/, '')
      let post: BlogPost | undefined
      try {
        const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('happy-machinery-blog-posts') : null
        if (stored) {
          const list: BlogPost[] = JSON.parse(stored)
          post = list.find((p) => p.slug === blogSlug || String(p.id) === blogSlug)
        }
      } catch {}
      if (!post) {
        post = DEFAULT_POSTS.find((p) => p.slug === blogSlug || String(p.id) === blogSlug)
      }

      if (post) {
        title = post.seoTitle || `${post.title} | TYPHON Machinery`
        description = post.metaDescription || post.excerpt
        keywords = (post.tags && post.tags.length > 0 ? post.tags.join(', ') : '') || 'mini excavator, skid steer, typhon machinery, kubota diesel, heavy equipment usa'
        image = post.image?.startsWith('http') ? post.image : `${SITE_URL}${post.image || '/images/why-choose-v900-jobsite.png'}`
        pageType = 'article'
        canonicalPath = `/blog/${blogSlug}`
        schema = {
          '@graph': [
            {
              '@type': 'BlogPosting',
              '@id': `${SITE_URL}/blog/${blogSlug}#article`,
              isPartOf: { '@id': `${SITE_URL}/blog` },
              headline: post.title,
              name: post.title,
              description: post.metaDescription || post.excerpt,
              url: `${SITE_URL}/blog/${blogSlug}`,
              datePublished: post.date || '2026-08-01',
              dateModified: '2026-10-30',
              author: {
                '@type': 'Organization',
                name: post.author || 'Happy Machinery Technical Team',
                url: `${SITE_URL}/about`,
              },
              publisher: { '@id': `${SITE_URL}/#organization` },
              image: {
                '@type': 'ImageObject',
                url: image,
                caption: post.imageAlt || post.title,
              },
              mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': `${SITE_URL}/blog/${blogSlug}`,
              },
              articleSection: post.category || 'Equipment Guide',
              keywords: (post.tags || []).join(', ') || 'American Skid Steer, Mini Excavator, TYPHON Machinery, Heavy Equipment USA',
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
                { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
                { '@type': 'ListItem', position: 3, name: post.title, item: `${SITE_URL}/blog/${blogSlug}` },
              ],
            },
          ],
        }
      } else {
        title = 'TYPHON Machinery Blog | American Skid Steer & Mini Excavator Guides'
        description = 'Read American skid steer buying guides, mini excavator USA maintenance advice, attachment tips, comparisons, and jobsite information from Happy Machinery.'
        canonicalPath = `/blog/${blogSlug}`
        schema = { '@type': 'Blog', name: 'Happy Machinery Blog', url: `${SITE_URL}${canonicalPath}`, description }
      }
    } else if (pathname === '/checkout' || pathname === '/ourcmskiuq' || pathname === '/hm-ops-7f3a9c2e8b41') {
      title = pathname === '/checkout' ? 'Secure Checkout | Happy Machinery' : 'Admin Portal | Happy Machinery'
      description = pathname === '/checkout' ? 'Complete your Happy Machinery equipment purchase securely.' : 'Happy Machinery administrative access.'
      robots = 'noindex, nofollow'
      canonicalPath = pathname
      schema = { '@type': 'WebPage', name: title, url: `${SITE_URL}${canonicalPath}` }
    }

    const canonicalUrl = `${SITE_URL}${canonicalPath}`
    document.title = title
    setMeta('meta[name="description"]', 'name', 'description', description)
    setMeta('meta[name="keywords"]', 'name', 'keywords', keywords)
    setMeta('meta[name="robots"]', 'name', 'robots', robots)
    setMeta('meta[property="og:title"]', 'property', 'og:title', title)
    setMeta('meta[property="og:description"]', 'property', 'og:description', description)
    setMeta('meta[property="og:type"]', 'property', 'og:type', pageType)
    setMeta('meta[property="og:url"]', 'property', 'og:url', canonicalUrl)
    setMeta('meta[property="og:image"]', 'property', 'og:image', image)
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', title)
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', description)
    setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', image)

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = canonicalUrl

    let jsonLd = document.head.querySelector<HTMLScriptElement>('#seo-jsonld')
    if (!jsonLd) {
      jsonLd = document.createElement('script')
      jsonLd.id = 'seo-jsonld'
      jsonLd.type = 'application/ld+json'
      document.head.appendChild(jsonLd)
    }
    jsonLd.textContent = JSON.stringify({ '@context': 'https://schema.org', ...schema })
  }, [pathname])

  return null
}
