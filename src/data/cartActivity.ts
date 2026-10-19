import type { Product } from '../components/CartDrawer'
import { appendSharedContent } from './sharedContentStorage'

export interface CartActivity {
  id: string
  productId: number
  productName: string
  image?: string
  quantity: number
  unitPrice: number
  total: number
  occurredAt: string
  sessionId: string
  page: string
}

const getCartSessionId = () => {
  const storageKey = 'happy-machinery-cart-session'
  const existing = sessionStorage.getItem(storageKey)
  if (existing) return existing
  const created = crypto.randomUUID()
  sessionStorage.setItem(storageKey, created)
  return created
}

export const recordCartActivity = async (product: Product, quantity: number) => {
  const activity: CartActivity = {
    id: crypto.randomUUID(),
    productId: product.id,
    productName: product.name,
    image: product.image,
    quantity,
    unitPrice: product.price,
    total: product.price * quantity,
    occurredAt: new Date().toISOString(),
    sessionId: getCartSessionId(),
    page: window.location.pathname
  }

  await appendSharedContent('cart-activity', activity)
}
