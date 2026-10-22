export const V900_PRODUCT_SLUGS: Record<string, string> = {
  '901': 'typhon-stomp-v900-mini-track-loader-kubota-d1105-red',
  '902': 'typhon-stomp-v900-mini-track-loader-kubota-d1105',
  '903': 'typhon-stomp-v900-mini-track-loader-kubota-d1105-blue',
}

export const ECWID_TO_V900_ID: Record<string, string> = {
  '849053936': '901',
  '849060904': '902',
  '849057653': '903',
}

export const getV900ProductId = (productKey: string | undefined) => {
  if (!productKey) return undefined
  if (V900_PRODUCT_SLUGS[productKey]) return productKey
  if (ECWID_TO_V900_ID[productKey]) return ECWID_TO_V900_ID[productKey]

  return Object.entries(V900_PRODUCT_SLUGS)
    .find(([, slug]) => slug === productKey)?.[0]
}

export const getV900ProductPath = (productId: string | number) => {
  const raw = String(productId)
  const id = ECWID_TO_V900_ID[raw] || raw
  const slug = V900_PRODUCT_SLUGS[id]
  return slug ? `/product/${slug}` : `/product/${id}`
}

export const isV900Equipment = (identifier: string | number | undefined | null): boolean => {
  if (!identifier) return false
  const str = String(identifier).toLowerCase()
  if (ECWID_TO_V900_ID[str] || V900_PRODUCT_SLUGS[str]) return true
  if (str.includes('849053936') || str.includes('849060904') || str.includes('849057653')) return true
  if (str.includes('v900') || str.includes('stomp-v900') || str.includes('typh-v900') || str.includes('skid steer v900')) return true
  return false
}

export const resolveV900Path = (identifier: string | number | undefined | null): string => {
  if (!identifier) return '/product/typhon-stomp-v900-mini-track-loader-kubota-d1105-red'
  const str = String(identifier).toLowerCase()
  if (str.includes('849060904') || str.includes('yellow')) {
    return getV900ProductPath('902')
  }
  if (str.includes('849057653') || str.includes('blue')) {
    return getV900ProductPath('903')
  }
  return getV900ProductPath('901')
}
