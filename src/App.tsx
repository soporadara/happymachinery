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
          <Route path="/hm-ops-7f3a9c2e8b41" element={<Navigate to={ADMIN_PATH} replace />} />
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

function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('happy-theme') || localStorage.getItem('nova-theme')
    return savedTheme === 'dark' ? 'dark' : 'light'
  })

  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    localStorage.setItem('nova-theme', theme)
    localStorage.setItem('happy-theme', theme)
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
