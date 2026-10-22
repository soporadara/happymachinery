/**
 * Happy Machinery — Maintenance Mode Configuration & Route Guardian
 * Manages global and per-page route maintenance mode across all public pages.
 */

export interface MaintenanceConfig {
  global: boolean
  title: string
  message: string
  eta?: string
  progress: number
  routes: string[]
}

export const STORAGE_KEY_MAINTENANCE = 'hm_cms_maintenance_config'

export const DEFAULT_MAINTENANCE_CONFIG: MaintenanceConfig = {
  global: false,
  title: "We'll Be Right Back",
  message: "We're performing scheduled maintenance. Please check back soon.",
  eta: '',
  progress: 90,
  routes: ['/blog/*', '/equipment/*']
}

/**
 * Load current maintenance configuration from storage
 */
export const getMaintenanceConfig = (): MaintenanceConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MAINTENANCE)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        global: Boolean(parsed.global),
        title: parsed.title || DEFAULT_MAINTENANCE_CONFIG.title,
        message: parsed.message || DEFAULT_MAINTENANCE_CONFIG.message,
        eta: parsed.eta || '',
        progress: typeof parsed.progress === 'number' ? parsed.progress : 90,
        routes: Array.isArray(parsed.routes) ? parsed.routes : DEFAULT_MAINTENANCE_CONFIG.routes
      }
    }
  } catch (err) {
    console.warn('[Maintenance] Could not read maintenance config:', err)
  }
  return { ...DEFAULT_MAINTENANCE_CONFIG }
}

/**
 * Persist updated maintenance configuration and broadcast update event
 */
export const saveMaintenanceConfig = (config: MaintenanceConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY_MAINTENANCE, JSON.stringify(config))
    window.dispatchEvent(new CustomEvent('hm-maintenance-updated', { detail: config }))
  } catch (err) {
    console.error('[Maintenance] Could not save maintenance config:', err)
  }
}

/**
 * Match a specific URL path against configured maintenance routes.
 * Supports exact paths and wildcard routes like '/blog/*', '/products/*', '/equipment/*'.
 */
export const isRouteUnderMaintenance = (pathname: string, config: MaintenanceConfig): boolean => {
  // Admin CMS paths are always exempt
  if (
    pathname === '/ourcmskiuq' ||
    pathname === '/hm-ops-7f3a9c2e8b41' ||
    pathname.startsWith('/ourcmskiuq')
  ) {
    return false
  }

  // Global maintenance locks down all public routes
  if (config.global) {
    return true
  }

  if (!config.routes || config.routes.length === 0) {
    return false
  }

  const cleanPath = pathname.toLowerCase()

  for (const route of config.routes) {
    const cleanRoute = route.trim().toLowerCase()
    if (!cleanRoute) continue

    // Exact home page match
    if (cleanRoute === '/' && cleanPath === '/') {
      return true
    }

    // Wildcard matching (e.g. /blog/* or /equipment/* or /products/*)
    if (cleanRoute.endsWith('/*')) {
      const prefix = cleanRoute.slice(0, -2)
      if (cleanPath === prefix || cleanPath.startsWith(prefix + '/')) {
        return true
      }
      // Aliases for equipment / products
      if (prefix === '/equipment' || prefix === '/products') {
        if (
          cleanPath.startsWith('/product') ||
          cleanPath.startsWith('/store') ||
          cleanPath.startsWith('/equipment')
        ) {
          return true
        }
      }
    } else {
      // Exact path match (e.g. /about, /contact, /search)
      if (cleanPath === cleanRoute) {
        return true
      }
    }
  }

  return false
}
