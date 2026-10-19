import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getV900ProductId, getV900ProductPath } from '../data/v900Urls'

const SITE_URL = 'https://happymachinery.com'
const DEFAULT_IMAGE = `${SITE_URL}/images/why-choose-v900-jobsite.png`

const productSeo: Record<string, {
  name: string
  sku: string
  color: string
  description: string
  image: string
}> = {
  '901': {
    name: 'TYPHON STOMP V900 Skid Steer – Red Edition',
    sku: 'TYPH-V900R',
    color: 'Crimson Red',
    description: 'Shop the red TYPHON STOMP V900 compact tracked skid steer with a 25 HP Kubota D1105 diesel engine, 1,102 lb maximum load, bucket, and nationwide delivery.',
    image: `${SITE_URL}/images/loader-red.png`,
  },
  '902': {
    name: 'TYPHON STOMP V900 Skid Steer – Yellow Edition',
    sku: 'TYPH-V900Y',
    color: 'Industrial Yellow',
    description: 'Shop the yellow TYPHON STOMP V900 compact tracked skid steer with a 25 HP Kubota D1105 diesel engine, 1,102 lb maximum load, bucket, and nationwide delivery.',
    image: `${SITE_URL}/images/loader-yellow.png`,
  },
  '903': {
    name: 'TYPHON STOMP V900 Skid Steer – Blue Edition',
    sku: 'TYPH-V900B',
    color: 'Cobalt Blue',
    description: 'Shop the blue TYPHON STOMP V900 compact tracked skid steer with a 25 HP Kubota D1105 diesel engine, 1,102 lb maximum load, bucket, and nationwide delivery.',
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

    let title = 'TYPHON STOMP V900 Skid Steer | Happy Machinery'
    let description = 'Explore the TYPHON STOMP V900 compact skid steer with Kubota diesel power, attachments, specifications, field videos, and nationwide USA delivery.'
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
          url: `${SITE_URL}/`,
          logo: {
            '@type': 'ImageObject',
            url: `${SITE_URL}/images/header-logo.png`,
          },
          email: 'support@happymachinery.com',
          brand: {
            '@type': 'Brand',
            name: 'TYPHON Machinery',
          },
        },
          {
            '@type': 'WebSite',
          '@id': `${SITE_URL}/#website`,
          url: `${SITE_URL}/`,
          name: 'Happy Machinery',
            publisher: { '@id': `${SITE_URL}/#organization` },
          },
          {
            '@type': 'WebPage',
            '@id': `${SITE_URL}/#webpage`,
            url: `${SITE_URL}/`,
            name: 'TYPHON STOMP V900 Skid Steer | Happy Machinery',
            primaryImageOfPage: {
              '@type': 'ImageObject',
              contentUrl: `${SITE_URL}/images/why-choose-v900-jobsite.png`,
              name: 'TYPHON STOMP V900 mini skid steer lineup',
              caption: 'Crimson Red, Industrial Yellow, and Cobalt Blue TYPHON STOMP V900 mini skid steer machines on a jobsite.',
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
                caption: `${product.color} TYPHON STOMP V900 compact tracked skid steer loader.`,
              },
              {
                '@type': 'ImageObject',
                contentUrl: `${SITE_URL}/images/why-choose-v900-jobsite.png`,
                name: 'TYPHON STOMP V900 jobsite lineup',
                caption: 'TYPHON STOMP V900 skid steer machines working on a construction jobsite.',
              },
            ],
            category: 'Compact tracked skid steer loaders',
            brand: { '@type': 'Brand', name: 'TYPHON' },
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
      title = 'TYPHON Skid Steers, Attachments & Parts | Happy Machinery'
      description = 'Shop TYPHON skid steers, compact construction equipment, attachments, buckets, forks, and replacement parts from Happy Machinery.'
      canonicalPath = pathname
      schema = {
        '@type': 'CollectionPage',
        name: 'TYPHON Machinery Equipment Store',
        url: `${SITE_URL}${canonicalPath}`,
        description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
      }
    } else if (pathname === '/about') {
      title = 'About Happy Machinery | TYPHON Equipment Supplier'
      description = 'Learn about Happy Machinery, a USA supplier of TYPHON skid steers, compact machinery, attachments, parts, and nationwide equipment support.'
      schema = { '@type': 'AboutPage', name: 'About Happy Machinery', url: `${SITE_URL}/about`, description }
    } else if (pathname === '/contact') {
      title = 'Contact Happy Machinery | TYPHON Skid Steer Support'
      description = 'Contact Happy Machinery for TYPHON STOMP V900 pricing, skid steer specifications, attachments, delivery, parts, and equipment support.'
      schema = { '@type': 'ContactPage', name: 'Contact Happy Machinery', url: `${SITE_URL}/contact`, description }
    } else if (pathname === '/blog' || pathname.startsWith('/blog/')) {
      title = 'Skid Steer Guides & TYPHON Machinery Blog'
      description = 'Read skid steer buying guides, maintenance advice, attachment tips, comparisons, and jobsite information from Happy Machinery.'
      schema = { '@type': 'Blog', name: 'Happy Machinery Blog', url: `${SITE_URL}/blog`, description }
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
