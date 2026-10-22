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

export const readSharedContent = async <T>(key: string): Promise<T | undefined> => {
  const response = await fetch(endpoint(key), {
    headers: {
      Accept: 'application/json',
      ...getAuthHeaders()
    },
    cache: 'no-store'
  })

  if (response.status === 404) return undefined
  if (!response.ok) {
    throw new Error(`Shared content request failed (${response.status}).`)
  }

  const payload = await response.json() as { value?: T }
  return payload.value
}

export const writeSharedContent = async <T>(key: string, value: T): Promise<void> => {
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
    throw new Error(payload?.error || `Shared content save failed (${response.status}).`)
  }
}

export const appendSharedContent = async <T>(key: string, value: T): Promise<void> => {
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
    throw new Error(payload?.error || `Shared content append failed (${response.status}).`)
  }
}

