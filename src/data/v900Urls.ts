export const V900_PRODUCT_SLUGS: Record<string, string> = {
  '901': 'typhon-stomp-v900-mini-track-loader-kubota-d1105-red',
  '902': 'typhon-stomp-v900-mini-track-loader-kubota-d1105',
  '903': 'typhon-stomp-v900-mini-track-loader-kubota-d1105-blue',
}

export const getV900ProductId = (productKey: string | undefined) => {
  if (!productKey) return undefined
  if (V900_PRODUCT_SLUGS[productKey]) return productKey

  return Object.entries(V900_PRODUCT_SLUGS)
    .find(([, slug]) => slug === productKey)?.[0]
}

export const getV900ProductPath = (productId: string | number) => {
  const id = String(productId)
  const slug = V900_PRODUCT_SLUGS[id]
  return slug ? `/product/${slug}` : `/product/${id}`
}
