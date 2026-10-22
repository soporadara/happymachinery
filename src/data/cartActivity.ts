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

const safeUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'cart-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9)
}

const getCartSessionId = () => {
  const storageKey = 'happy-machinery-cart-session'
  const existing = sessionStorage.getItem(storageKey)
  if (existing) return existing
  const created = safeUUID()
  sessionStorage.setItem(storageKey, created)
  return created
}

export const recordCartActivity = async (product: Product, quantity: number) => {
  try {
    const activity: CartActivity = {
      id: safeUUID(),
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
  } catch (err) {
    console.warn('recordCartActivity notice:', err)
  }
}
