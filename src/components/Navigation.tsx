import { useEffect, useState, useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { getV900ProductPath } from '../data/v900Urls'
import { useSiteBranding } from '../data/siteBranding'
import './Navigation.css'

type NavigationProps = {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  cartItemCount: number
  onOpenCart: () => void
  searchQuery: string
  onSearchChange: (query: string) => void
}

export default function Navigation({ 
  theme, 
  onToggleTheme, 
  cartItemCount, 
  onOpenCart,
  searchQuery,
  onSearchChange
}: NavigationProps) {
  const branding = useSiteBranding()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isCartBumping, setIsCartBumping] = useState(false)
  const prevCartCountRef = useRef(cartItemCount)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const links = [
    { to: '/', label: 'Home' },
    { to: '/store', label: 'Store' },
    { to: '/about', label: 'About Us' },
    { to: '/contact', label: 'Contact Us' },
    { to: '/blog', label: 'Blog' },
  ]
  const searchableProducts = [
    {
      id: 901,
      name: 'TYPHON STOMP V900 1.4 Ton Skid Steer Loader with 25HP Kubota D1105 Engine, 1,102 lb Max Load – Crimson Red',
      category: 'Equipment, Mini Skid Steer',
      image: '/images/loader-red.png',
      keywords: 'red crimson typhon v900 skid steer loader pallet fork'
    },
    {
      id: 902,
      name: 'TYPHON STOMP V900 1.4 Ton Skid Steer Loader with 25HP Kubota D1105 Engine, 1,102 lb Max Load – Industrial Yellow',
      category: 'Equipment, Mini Skid Steer',
      image: '/images/loader-yellow.png',
      keywords: 'yellow industrial typhon v900 skid steer loader pallet fork'
    },
    {
      id: 903,
      name: 'TYPHON STOMP V900 1.4 Ton Skid Steer Loader with 25HP Kubota D1105 Engine, 1,102 lb Max Load – Cobalt Blue',
      category: 'Equipment, Mini Skid Steer',
      image: '/images/loader-blue.png',
      keywords: 'blue cobalt typhon v900 skid steer loader pallet fork'
    }
  ]
  const normalizedQuery = searchQuery.trim().toLowerCase()
  const searchResults = normalizedQuery
    ? searchableProducts.filter((product) =>
        `${product.name} ${product.category} ${product.keywords}`.toLowerCase().includes(normalizedQuery)
      )
    : []

  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false)
  const mobileSearchInputRef = useRef<HTMLInputElement>(null)

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setIsSearchOpen(false)
    setIsMobileSearchOpen(false)
    navigate(`/store?search=${encodeURIComponent(searchQuery.trim())}`)
  }

  const openProduct = (productId: number) => {
    setIsSearchOpen(false)
    setIsMobileSearchOpen(false)
    navigate(getV900ProductPath(productId))
  }

  useEffect(() => {
    setIsMenuOpen(false)
    setIsSearchOpen(false)
    setIsSearchFocused(false)
    setIsMobileSearchOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (isMobileSearchOpen) {
      setIsMenuOpen(false)
      setTimeout(() => {
        mobileSearchInputRef.current?.focus()
      }, 60)
    }
  }, [isMobileSearchOpen])

  useEffect(() => {
    if (isMenuOpen) {
      setIsMobileSearchOpen(false)
    }
  }, [isMenuOpen])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (cartItemCount > prevCartCountRef.current) {
      setIsCartBumping(true)
      const timer = setTimeout(() => setIsCartBumping(false), 650)
      return () => clearTimeout(timer)
    }
    prevCartCountRef.current = cartItemCount
  }, [cartItemCount])

  return (
    <nav className={`navbar${isScrolled ? ' scrolled' : ''}${isMenuOpen ? ' menu-open' : ''}`}>
      <div className="nav-container">
        <NavLink to="/" className="nav-logo" aria-label="Happy Machinery home">
          <img
            src={(branding.logo && branding.logo !== '/logo.png') ? branding.logo : '/images/header-logo.webp'}
            alt={branding.siteName || 'Happy Machinery'}
            onError={(e) => { (e.target as HTMLImageElement).src = '/images/header-logo.png' }}
          />
        </NavLink>

        <ul id="primary-navigation" className={`nav-menu${isMenuOpen ? ' is-open' : ''}`}>
          {links.map((link) => (
            <li className="nav-item" key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="nav-actions">
          {/* Desktop Search (screens > 760px) */}
          <form
            className={`header-search desktop-only-search${isSearchFocused ? ' is-focused' : ''}`}
            role="search"
            onSubmit={handleSearchSubmit}
            onFocus={() => {
              setIsSearchFocused(true)
              if (normalizedQuery) setIsSearchOpen(true)
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setIsSearchFocused(false)
                setIsSearchOpen(false)
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setIsSearchFocused(false)
                setIsSearchOpen(false)
                searchInputRef.current?.blur()
              }
            }}
          >
            <button
              className="search-submit"
              type="submit"
              aria-label="Search products"
              onClick={(e) => {
                if (!searchQuery.trim()) {
                  e.preventDefault()
                  searchInputRef.current?.focus()
                }
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
            </button>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value)
                setIsSearchOpen(Boolean(e.target.value.trim()))
              }}
              onFocus={() => {
                setIsSearchFocused(true)
                if (normalizedQuery) setIsSearchOpen(true)
              }}
              aria-label="Search items"
              aria-expanded={isSearchOpen && Boolean(normalizedQuery)}
              aria-controls="product-search-results"
              autoComplete="off"
            />

            {isSearchOpen && normalizedQuery && (
              <div id="product-search-results" className="search-results-panel" role="listbox">
                {searchResults.length > 0 ? (
                  <div className="search-result-list">
                    {searchResults.map((product) => (
                      <button
                        className="search-result-item"
                        type="button"
                        role="option"
                        aria-selected="false"
                        key={product.id}
                        onClick={() => openProduct(product.id)}
                      >
                        <span className="search-result-image">
                          <img src={product.image} alt={`TYPHON STOMP V900 — ${product.name}`} />
                        </span>
                        <span className="search-result-copy">
                          <small>{product.category}</small>
                          <strong>{product.name}</strong>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="search-empty">No matching V900 products found.</p>
                )}

                <button className="search-all-button" type="submit">
                  Search all products for “{searchQuery.trim()}”
                </button>
              </div>
            )}
          </form>

          {/* Mobile Search Toggle Button (screens <= 760px) */}
          <button
            className={`mobile-search-toggle${isMobileSearchOpen ? ' active' : ''}`}
            type="button"
            onClick={() => setIsMobileSearchOpen((prev) => !prev)}
            aria-label={isMobileSearchOpen ? 'Close search' : 'Open product search'}
            aria-expanded={isMobileSearchOpen}
          >
            {isMobileSearchOpen ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7"></circle>
                <path d="m20 20-4-4"></path>
              </svg>
            )}
          </button>

          <button
            className={`cart-toggle${isCartBumping ? ' cart-bump' : ''}`}
            type="button"
            onClick={onOpenCart}
            aria-label={`View shopping cart (${cartItemCount} item${cartItemCount === 1 ? '' : 's'})`}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            {cartItemCount > 0 && (
              <span className="cart-badge" key={cartItemCount}>
                {cartItemCount}
              </span>
            )}
          </button>

          <button
            className="theme-toggle"
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle light or dark theme"
          >
            {theme === 'light' ? (
              <svg className="icon-moon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
            ) : (
              <svg className="icon-sun" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
              </svg>
            )}
          </button>

          <button
            className="menu-toggle"
            type="button"
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMenuOpen}
            aria-controls="primary-navigation"
            onClick={() => setIsMenuOpen((current) => !current)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>

      {/* Mobile Dedicated Search Panel */}
      {isMobileSearchOpen && (
        <div className="mobile-search-panel">
          <div className="mobile-search-inner">
            <form className="mobile-search-form" onSubmit={handleSearchSubmit}>
              <div className="mobile-search-input-box">
                <svg className="mobile-search-icon" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.4">
                  <circle cx="11" cy="11" r="7"></circle>
                  <path d="m20 20-4-4"></path>
                </svg>
                <input
                  ref={mobileSearchInputRef}
                  type="search"
                  placeholder="Search V900 loaders, attachments..."
                  value={searchQuery}
                  onChange={(e) => {
                    onSearchChange(e.target.value)
                  }}
                  aria-label="Search products"
                  autoComplete="off"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="mobile-search-clear"
                    onClick={() => {
                      onSearchChange('')
                      mobileSearchInputRef.current?.focus()
                    }}
                    aria-label="Clear search input"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button
                type="button"
                className="mobile-search-cancel-btn"
                onClick={() => {
                  setIsMobileSearchOpen(false)
                  onSearchChange('')
                }}
              >
                Cancel
              </button>
            </form>

            {normalizedQuery ? (
              <div className="mobile-search-results">
                {searchResults.length > 0 ? (
                  <div className="mobile-search-results-list">
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        className="mobile-search-card"
                        onClick={() => openProduct(product.id)}
                      >
                        <div className="mobile-search-card-thumb">
                          <img src={product.image} alt={product.name} />
                        </div>
                        <div className="mobile-search-card-details">
                          <span className="mobile-search-card-badge">{product.category}</span>
                          <h4 className="mobile-search-card-name">{product.name}</h4>
                          <span className="mobile-search-card-cta">View Machine Specs →</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="mobile-search-empty-state">
                    <p>No matching V900 products found for “{searchQuery.trim()}”.</p>
                  </div>
                )}

                <button
                  type="button"
                  className="mobile-search-view-all-button"
                  onClick={() => {
                    setIsMobileSearchOpen(false)
                    navigate(`/store?search=${encodeURIComponent(searchQuery.trim())}`)
                  }}
                >
                  Search full store catalog for “{searchQuery.trim()}” →
                </button>
              </div>
            ) : (
              <div className="mobile-search-suggestions">
                <span className="mobile-search-suggestions-title">Quick Search</span>
                <div className="mobile-search-chips">
                  <button type="button" onClick={() => onSearchChange('Yellow')}>V900 Yellow</button>
                  <button type="button" onClick={() => onSearchChange('Cobalt Blue')}>Cobalt Blue</button>
                  <button type="button" onClick={() => onSearchChange('Crimson Red')}>Crimson Red</button>
                  <button type="button" onClick={() => onSearchChange('Kubota D1105')}>Kubota Engine</button>
                  <button type="button" onClick={() => onSearchChange('Fork')}>Pallet Fork</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
