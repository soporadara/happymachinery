const endpoint = (key: string) => `/api/content.php?key=${encodeURIComponent(key)}`

export const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem('hm_admin_token') || sessionStorage.getItem('hm_admin_token') || null
  } catch {
    return null
  }
}

export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken()
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
      'X-CMS-Token': token
    }
  }
  return {}
}

export const readSharedContent = async <T>(key: string, options?: { fresh?: boolean }): Promise<T | undefined> => {
  try {
    const authHeaders = getAuthHeaders()
    const hasAuth = Object.keys(authHeaders).length > 0
    const response = await fetch(endpoint(key), {
      headers: {
        Accept: 'application/json',
        ...authHeaders
      },
      cache: options?.fresh || hasAuth ? 'no-store' : 'default'
    })

    if (response.status === 404) return undefined
    if (!response.ok) {
      return undefined
    }

    const payload = await response.json() as { value?: T }
    return payload.value
  } catch {
    return undefined
  }
}

export const writeSharedContent = async <T>(key: string, value: T): Promise<void> => {
  try {
    const response = await fetch(endpoint(key), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ value })
    })

    const payload = await response.json().catch(() => null) as { error?: string; saved?: boolean } | null
    if (!response.ok || payload?.saved !== true) {
      console.warn(`[SharedContent] write to ${key} failed (${response.status})`)
    }
  } catch (err) {
    console.warn(`[SharedContent] write to ${key} network error:`, err)
  }
}

export const appendSharedContent = async <T>(key: string, value: T): Promise<void> => {
  try {
    const response = await fetch(endpoint(key), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ value })
    })

    const payload = await response.json().catch(() => null) as { error?: string; saved?: boolean } | null
    if (!response.ok || payload?.saved !== true) {
      console.warn(`[SharedContent] append to ${key} failed (${response.status})`)
    }
  } catch (err) {
    console.warn(`[SharedContent] append to ${key} network error:`, err)
  }
}
