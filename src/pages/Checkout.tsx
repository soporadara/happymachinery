import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { IMPORTED_PRODUCTS } from '../data/importedProducts'
import './Checkout.css'

interface CheckoutItem {
  id: number
  quantity: number
  name: string
  price: number
  image: string
}

const LOADER_LOOKUP: Record<number, { name: string; price: number; image: string }> = {
  849053936: { name: 'Skid Steer V900 (Red Edition)', price: 11999, image: '/images/loader-red.png' },
  849060904: { name: 'Skid Steer V900 (Yellow Edition)', price: 11999, image: '/images/loader-yellow.png' },
  849057653: { name: 'Skid Steer V900 (Blue Edition)', price: 11999, image: '/images/loader-blue.png' },
  553910423: { name: 'TYPH-5005M Heavy-Duty Pallet Fork', price: 1764, image: '/images/fork-yellow.jpg' }
}

const findProductByEcwidId = (ecwidId: number) => {
  if (LOADER_LOOKUP[ecwidId]) {
    return LOADER_LOOKUP[ecwidId]
  }
  
  if (typeof IMPORTED_PRODUCTS !== 'undefined' && Array.isArray(IMPORTED_PRODUCTS)) {
    const found = IMPORTED_PRODUCTS.find((p) => {
      const url = p.buyUrl || ''
      const match = url.match(/\/p\/(\d+)/) || url.match(/-p(\d+)/)
      return match && Number(match[1]) === ecwidId
    })

    if (found) {
      return {
        name: found.name,
        price: found.price,
        image: found.image
      }
    }
  }

  return null
}

export default function Checkout() {
  const [items, setItems] = useState<CheckoutItem[]>([])

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const createParam = searchParams.get('create')
    const storedCheckout = sessionStorage.getItem('happy-machinery-checkout')
    let resolvedItems: CheckoutItem[] = []

    if (createParam || storedCheckout) {
      try {
        const decoded = createParam
          ? JSON.parse(decodeURIComponent(createParam))
          : JSON.parse(storedCheckout || '{}')
        if (decoded && Array.isArray(decoded.items)) {
          resolvedItems = decoded.items
            .map((item: any) => {
              if (!item || typeof item !== 'object') return null
              const itemId = Number(item.id)
              const details = findProductByEcwidId(itemId)
              return {
                id: itemId || Math.random(),
                quantity: Number(item.quantity) || 1,
                name: details ? details.name : `Product #${itemId}`,
                price: details ? details.price : 0,
                image: details ? details.image : ''
              }
            })
            .filter(Boolean) as CheckoutItem[]
          setItems(resolvedItems)
        }
      } catch (e) {
        console.error('Error parsing prefilled checkout items:', e)
      }
    }

    // Ecwid's native prefilled-cart route consumes a `products` array and can
    // advance directly into checkout with `gotoCheckout`.
    if (resolvedItems.length > 0) {
      const ecwidCart = {
        gotoCheckout: true,
        products: resolvedItems.map(({ id, quantity }) => ({ id, quantity }))
      }
      const ecwidCartHash = `!/~/cart/create=${encodeURIComponent(JSON.stringify(ecwidCart))}`
      window.history.replaceState(
        window.history.state,
        '',
        `${window.location.pathname}#${ecwidCartHash}`
      )
    }

    const scriptId = 'ecwid-script';
    const storeContainer = document.getElementById('my-store-80100025')
    const keepCheckoutUrlClean = () => {
      const isEcwidRoute = window.location.hash.startsWith('#!/~')
      const checkoutIsReady = storeContainer?.textContent?.includes('Shopping cart')
        || storeContainer?.textContent?.includes('Checkout')

      if (isEcwidRoute && checkoutIsReady) {
        window.history.replaceState(window.history.state, '', window.location.pathname)
      }
    }
    const checkoutObserver = new MutationObserver(keepCheckoutUrlClean)
    if (storeContainer) {
      checkoutObserver.observe(storeContainer, { childList: true, subtree: true })
    }
    window.addEventListener('hashchange', keepCheckoutUrlClean);

    // Configure Ecwid dynamic widgets
    (window as any).ecwid_script_defer = true;
    (window as any).ecwid_dynamic_widgets = true;
    (window as any)._xnext_initialization_scripts = (window as any)._xnext_initialization_scripts || [];

    const initScript = {
      widgetType: 'ProductBrowser',
      id: 'my-store-80100025',
      arg: [
        "categoriesPerRow=3",
        "views=grid(20,3) list(60) table(60)",
        "categoryView=grid",
        "searchView=list",
        "id=my-store-80100025"
      ]
    };

    (window as any)._xnext_initialization_scripts.push(initScript);

    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script')
      script.id = scriptId
      script.src = "https://app.ecwid.com/script.js?80100025&data_platform=code&data_date=2026-02-23"
      script.async = true;
      script.charset = 'utf-8'
      script.setAttribute('data-cfasync', 'false')
      document.body.appendChild(script)
    } else {
      if (typeof (window as any).xProductBrowser === 'function') {
        try {
          (window as any).xProductBrowser(
            "categoriesPerRow=3",
            "views=grid(20,3) list(60) table(60)",
            "categoryView=grid",
            "searchView=list",
            "id=my-store-80100025"
          )
        } catch (e) {
          console.error("Error executing Ecwid xProductBrowser:", e)
        }
      }
    }

    return () => {
      checkoutObserver.disconnect()
      window.removeEventListener('hashchange', keepCheckoutUrlClean)
      // Clean up dynamic widget on unmount
      if ((window as any)._xnext_initialization_scripts) {
        (window as any)._xnext_initialization_scripts = (window as any)._xnext_initialization_scripts.filter(
          (s: any) => s !== initScript
        )
      }
      const ecwid = (window as any).Ecwid
      if (ecwid && typeof ecwid.destroy === 'function') {
        try {
          ecwid.destroy()
        } catch (e) {
          console.error("Error destroying Ecwid widget:", e)
        }
      }
    }
  }, [])

  const totalPrice = items.reduce((acc, item) => acc + item.price * item.quantity, 0)

  return (
    <div className="page checkout-page">
      <div className="checkout-hero">
        <div className="checkout-hero-container">
          <span className="checkout-kicker">Secure Checkout</span>
          <h1>Complete Your Purchase</h1>
          <p>You are checking out your cart items. The store loads only on this checkout page after Proceed to Checkout is selected.</p>
          <Link to="/store" className="btn btn-outline btn-back">
            Back to store
          </Link>
        </div>
      </div>

      <div className="checkout-layout-grid">
        {/* Left Column: SELECTED ITEMS */}
        <div className="selected-items-panel">
          <div className="selected-items-card">
            <h3>Selected Items</h3>
            <ul className="selected-items-list">
              {items.map((item) => (
                <li key={item.id} className="selected-item-row">
                  <img src={item.image || '/images/header-logo.png'} alt="" className="selected-item-thumb" />
                  <div className="selected-item-details">
                    <h4>{item.name}</h4>
                    <span className="selected-item-meta">
                      Qty: {item.quantity} &bull; ${item.price.toLocaleString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="selected-items-total">
              <span>Total Estimated:</span>
              <strong>${totalPrice.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* Right Column: STORE CHECKOUT */}
        <div className="store-checkout-panel">
          <div className="store-checkout-card">
            <span className="store-checkout-kicker">Store Checkout</span>
            <h2>Checkout for Cart Items</h2>
            <div id="my-store-80100025" className="ecwid-store-container"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
