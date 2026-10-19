/**
 * Happy Machinery - First-Party Private Website Analytics Tracker
 * Safe, privacy-preserving, deduplicated client-side event tracking.
 */

import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import type { AnalyticsViewEvent } from './cmsTypes'
import { appendSharedContent } from './sharedContentStorage'

const DEDUPLICATION_WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const STORAGE_PREFIX = 'hm_view_'

const isBot = (): boolean => {
  if (typeof navigator === 'undefined') return true
  const ua = navigator.userAgent.toLowerCase()
  return /bot|crawler|spider|crawling|googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|pinterest|linkedinbot/i.test(ua)
}

const getDeviceType = (): 'desktop' | 'mobile' | 'tablet' => {
  if (typeof window === 'undefined') return 'desktop'
  const width = window.innerWidth
  if (width < 640) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

export const trackPageView = async (path: string, title?: string, type: 'page' | 'article' | 'product' = 'page', itemId?: string | number) => {
  if (isBot()) return
  // Exclude CMS internal routes from tracking
  if (path.startsWith('/ourcmskiuq') || path.startsWith('/hm-ops')) return

  const normalizedPath = path.toLowerCase()
  const storageKey = `${STORAGE_PREFIX}${normalizedPath}`
  const now = Date.now()

  // Deduplication check
  try {
    const lastTracked = sessionStorage.getItem(storageKey)
    if (lastTracked) {
      const elapsed = now - parseInt(lastTracked, 10)
      if (elapsed < DEDUPLICATION_WINDOW_MS) {
        return // Already tracked within the window
      }
    }
    sessionStorage.setItem(storageKey, now.toString())
  } catch {
    // If sessionStorage is restricted, proceed gracefully
  }

  const pageTitle = title || document.title || 'Happy Machinery'

  const event: AnalyticsViewEvent = {
    id: `ev-${now}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    path: normalizedPath,
    title: pageTitle,
    type,
    itemId,
    ipHash: 'client', // Actual IP hashed server-side
    device: getDeviceType(),
    referrer: typeof document !== 'undefined' ? (document.referrer || undefined) : undefined
  }

  try {
    await appendSharedContent<AnalyticsViewEvent>('analytics-events', event)
  } catch (err) {
    // Fail silently in public view
    console.debug('Analytics recording queued.', err)
  }
}

/**
 * Hook to automatically track route changes in the public application
 */
export const usePageTracking = () => {
  const location = useLocation()
  const lastPath = useRef<string>('')

  useEffect(() => {
    const currentPath = location.pathname
    if (currentPath === lastPath.current) return
    lastPath.current = currentPath

    // Determine type
    let type: 'page' | 'article' | 'product' = 'page'
    if (currentPath.startsWith('/blog/') && currentPath !== '/blog') {
      type = 'article'
    } else if (currentPath.startsWith('/product/')) {
      type = 'product'
    }

    // Small delay to allow document.title to update
    const timer = setTimeout(() => {
      void trackPageView(currentPath, document.title, type)
    }, 200)

    return () => clearTimeout(timer)
  }, [location.pathname])
}
