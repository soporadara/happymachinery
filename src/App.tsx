import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navigation from './components/Navigation'
import Footer from './components/Footer'
import CartDrawer from './components/CartDrawer'
import EquipmentAssistant from './components/EquipmentAssistant'
import Seo from './components/Seo'
import type { CartItem, Product } from './components/CartDrawer'
import Home from './pages/Home'
import Store from './pages/Store'
import AboutUs from './pages/AboutUs'
import ContactUs from './pages/ContactUs'
import Blog from './pages/Blog'
import ProductDetail from './pages/ProductDetail'
import AdminDashboard from './pages/AdminDashboard'
import Checkout from './pages/Checkout'
import PrivacyPolicy from './pages/PrivacyPolicy'
import TermsOfService from './pages/TermsOfService'
import Faq from './pages/Faq'
import { recordCartActivity } from './data/cartActivity'
import { usePageTracking } from './data/analyticsTracker'
import './App.css'

type Theme = 'light' | 'dark'
const ADMIN_PATH = '/ourcmskiuq'

function AppContent({
  theme,
  toggleTheme,
  cartItems,
  isCartOpen,
  setIsCartOpen,
  searchQuery,
  setSearchQuery,
  handleAddToCart,
  handleUpdateQuantity,
  handleRemoveItem,
  handleCheckout
}: any) {
  const location = useLocation()
  usePageTracking()
  const isAdminPage = location.pathname === ADMIN_PATH || location.pathname === '/hm-ops-7f3a9c2e8b41'
  const totalCartCount = cartItems.reduce((acc: number, item: any) => acc + item.quantity, 0)

  useEffect(() => {
    try {
      localStorage.removeItem('hm_cms_maintenance_config')
    } catch {}
  }, [])

  return (
    <div className={`app-shell ${theme} ${isAdminPage ? 'admin-console-mode' : ''}`}>
      <Seo />
      {!isAdminPage && (
        <Navigation 
          theme={theme} 
          onToggleTheme={toggleTheme} 
          cartItemCount={totalCartCount}
          onOpenCart={() => setIsCartOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      )}
      <main className={isAdminPage ? 'admin-main-reset' : ''}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:productKey" element={<ProductDetail onAddToCart={handleAddToCart} onOpenCart={() => setIsCartOpen(true)} />} />
          <Route
            path="/store/*"
            element={<Store onAddToCart={handleAddToCart} searchQuery={searchQuery} />} 
          />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<Blog />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/faq" element={<Faq />} />
          <Route path="/cookie-policy" element={<Navigate to="/privacy-policy#cookies" replace />} />
          <Route path="/hm-ops-7f3a9c2e8b41" element={<Navigate to={ADMIN_PATH} replace />} />
          <Route path="/profile" element={<Navigate to={`${ADMIN_PATH}?tab=profile`} replace />} />
          <Route path="/security" element={<Navigate to={`${ADMIN_PATH}?tab=security`} replace />} />
          <Route path={ADMIN_PATH} element={<AdminDashboard />} />
        </Routes>
      </main>
      {!isAdminPage && <Footer />}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
      />
      {!isAdminPage && <EquipmentAssistant isCartOpen={isCartOpen} />}
    </div>
  )
}

function ScrollToTop() {
  const { pathname, search, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const elementId = hash.replace(/^#/, '')
      const scrollToTarget = () => {
        const el = document.getElementById(elementId)
        if (el) {
          const headerOffset = 90
          const elementPosition = el.getBoundingClientRect().top
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset
          window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: 'smooth'
          })
          return true
        }
        return false
      }

      if (!scrollToTarget()) {
        const t1 = setTimeout(scrollToTarget, 60)
        const t2 = setTimeout(scrollToTarget, 220)
        return () => {
          clearTimeout(t1)
          clearTimeout(t2)
        }
      }
    } else {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      })
    }
  }, [pathname, search, hash])

  return null
}

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('happy-theme') || localStorage.getItem('nova-theme')
    return savedTheme === 'dark' ? 'dark' : 'light'
  })

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('hm_cart_items')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    try {
      localStorage.setItem('hm_cart_items', JSON.stringify(cartItems))
    } catch (e) {
      console.warn('Could not save cart items to localStorage', e)
    }
  }, [cartItems])

  useEffect(() => {
    localStorage.setItem('nova-theme', theme)
    localStorage.setItem('happy-theme', theme)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.body.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.body.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'))
  }

  const handleAddToCart = (product: Product, quantity = 1) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.id === product.id)
      if (existingItem) {
        return prevItems.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        )
      }
      return [...prevItems, { product, quantity }]
    })
    void recordCartActivity(product, quantity).catch((error) => {
      console.error('Could not record cart activity.', error)
    })
  }

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    )
  }

  const handleRemoveItem = (productId: number) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.product.id !== productId))
  }

  const handleCheckout = () => {
    if (cartItems.length === 0) return

    const getEcwidId = (product: any) => {
      const url = product.purchaseUrl || product.buyUrl
      if (!url) {
        if (product.id === 901) return 849053936
        if (product.id === 902) return 849060904
        if (product.id === 903) return 849057653
        if (product.id === 5005) return 553910423
        return product.id
      }
      const match = url.match(/\/p\/(\d+)/) || url.match(/-p(\d+)/)
      return match ? Number(match[1]) : product.id
    }

    const items = cartItems.map((item) => ({
      id: getEcwidId(item.product),
      quantity: item.quantity
    }))

    const cartData = { items }
    sessionStorage.setItem('happy-machinery-checkout', JSON.stringify(cartData))

    // Clear local cart
    setCartItems([])
    setIsCartOpen(false)

    // Redirect to the new custom Checkout page
    window.location.href = '/checkout'
  }

  return (
    <Router>
      <ScrollToTop />
      <AppContent
        theme={theme}
        toggleTheme={toggleTheme}
        cartItems={cartItems}
        isCartOpen={isCartOpen}
        setIsCartOpen={setIsCartOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleAddToCart={handleAddToCart}
        handleUpdateQuantity={handleUpdateQuantity}
        handleRemoveItem={handleRemoveItem}
        handleCheckout={handleCheckout}
      />
    </Router>
  )
}

export default App
