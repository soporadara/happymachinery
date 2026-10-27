/**
 * Happy Machinery - Global Site Branding & Favicon Management
 */
import { useEffect, useState } from 'react'
import { readSharedContent } from './sharedContentStorage'
import { DEFAULT_SITE_SETTINGS } from './cmsDefaults'
import type { SiteSettings } from './cmsTypes'

const BRANDING_STORAGE_KEY = 'hm_site_settings_cache'

export const updateBrowserFavicon = (faviconUrl?: string) => {
  if (typeof document === 'undefined') return
  const url = faviconUrl || '/favicon.png'
  const isBrandDefault = url === '/favicon.png' || url.includes('/images/favicon.')
  const versionParam = '?v=20'

  // Update or create standard icon
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']")
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }

  if (!isBrandDefault) {
    // Custom favicon: remove the static sized/shortcut icon links so they can't override it
    document
      .querySelectorAll<HTMLLinkElement>("link[rel='icon'], link[rel='shortcut icon']")
      .forEach((el) => { if (el !== link) el.remove() })
    link.removeAttribute('sizes')
    link.href = url
    link.type = url.endsWith('.ico')
      ? 'image/x-icon'
      : url.endsWith('.svg')
      ? 'image/svg+xml'
      : url.endsWith('.webp')
      ? 'image/webp'
      : 'image/png'
  } else {
    // Brand default: update all icon links with cache buster so browser tab refreshes immediately
    document.querySelectorAll<HTMLLinkElement>("link[rel='icon'], link[rel='shortcut icon']").forEach((el) => {
      const currentHref = el.getAttribute('href') || ''
      const base = currentHref.split('?')[0] || '/favicon.png'
      el.href = `${base}${versionParam}`
    })
  }

  // Update or create apple-touch-icon
  let appleLink = document.querySelector<HTMLLinkElement>("link[rel='apple-touch-icon']")
  if (!appleLink) {
    appleLink = document.createElement('link')
    appleLink.rel = 'apple-touch-icon'
    document.head.appendChild(appleLink)
  }
  appleLink.href = isBrandDefault ? `/apple-touch-icon.png${versionParam}` : url
}

export const getSiteSettingsSync = (): SiteSettings => {
  try {
    const raw = localStorage.getItem(BRANDING_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SiteSettings>
      return {
        ...DEFAULT_SITE_SETTINGS,
        ...parsed,
        logo: (!parsed.logo || parsed.logo === '/logo.png' || parsed.logo.includes('Happy_Machinery_Logo.webp')) ? '/images/header-logo.webp' : parsed.logo,
        favicon: (!parsed.favicon || parsed.favicon === '/logo.png' || parsed.favicon.includes('Happy_Machinery_Logo.webp')) ? DEFAULT_SITE_SETTINGS.favicon : parsed.favicon
      }
    }
  } catch {}
  return DEFAULT_SITE_SETTINGS
}

export const cacheSiteSettings = (settings: SiteSettings) => {
  try {
    localStorage.setItem(BRANDING_STORAGE_KEY, JSON.stringify(settings))
    window.dispatchEvent(new CustomEvent('hm-branding-updated', { detail: settings }))
    updateBrowserFavicon(settings.favicon || DEFAULT_SITE_SETTINGS.favicon)
  } catch {}
}

export const useSiteBranding = () => {
  const [settings, setSettings] = useState<SiteSettings>(() => getSiteSettingsSync())

  useEffect(() => {
    let isMounted = true
    readSharedContent<SiteSettings>('site-settings')
      .then((remote) => {
        if (remote && isMounted) {
          const merged: SiteSettings = {
            ...DEFAULT_SITE_SETTINGS,
            ...remote,
            logo: (!remote.logo || remote.logo === '/logo.png' || remote.logo.includes('Happy_Machinery_Logo.webp')) ? '/images/header-logo.webp' : remote.logo,
            favicon: (!remote.favicon || remote.favicon === '/logo.png' || remote.favicon.includes('Happy_Machinery_Logo.webp')) ? DEFAULT_SITE_SETTINGS.favicon : remote.favicon
          }
          setSettings(merged)
          cacheSiteSettings(merged)
        }
      })
      .catch(() => {})

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<SiteSettings>
      if (customEvent.detail) {
        setSettings(customEvent.detail)
      } else {
        setSettings(getSiteSettingsSync())
      }
    }

    window.addEventListener('hm-branding-updated', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      isMounted = false
      window.removeEventListener('hm-branding-updated', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  return settings
}
