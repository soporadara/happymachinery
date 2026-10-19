import { useEffect, useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { getV900ProductPath } from '../data/v900Urls'
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
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
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
      name: 'Skid Steer V900 — Crimson Red',
      category: 'Equipment, Mini Skid Steer',
      image: '/images/loader-red.png',
      keywords: 'red crimson typhon v900 skid steer loader pallet fork'
    },
    {
      id: 902,
      name: 'Skid Steer V900 — Industrial Yellow',
      category: 'Equipment, Mini Skid Steer',
      image: '/images/loader-yellow.png',
      keywords: 'yellow industrial typhon v900 skid steer loader pallet fork'
    },
    {
      id: 903,
      name: 'Skid Steer V900 — Cobalt Blue',
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

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setIsSearchOpen(false)
    if (location.pathname !== '/store') {
      navigate('/store')
    }
  }

  const openProduct = (productId: number) => {
    setIsSearchOpen(false)
    navigate(getV900ProductPath(productId))
  }

  useEffect(() => {
    setIsMenuOpen(false)
    setIsSearchOpen(false)
  }, [location.pathname])

  return (
    <nav className="navbar">
      <div className="nav-container">
        <NavLink to="/" className="nav-logo" aria-label="Happy Machinery home">
          <img
            src="https://img.miniexcavator.org/ebay/Dashboard-Icon/Happy_Machinery_Logo.webp"
            alt="Happy Machinery"
            onError={(e) => { (e.target as HTMLImageElement).src = '/images/Happy_Machinery_Logo.webp' }}
          />
        </NavLink>

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
          <form
            className="header-search"
            role="search"
            onSubmit={handleSearchSubmit}
            onFocus={() => normalizedQuery && setIsSearchOpen(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setIsSearchOpen(false)
              }
            }}
            onKeyDown={(event) => event.key === 'Escape' && setIsSearchOpen(false)}
          >
            <button className="search-submit" type="submit" aria-label="Search products" disabled={!searchQuery.trim()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>
            </button>
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => {
                onSearchChange(e.target.value)
                setIsSearchOpen(Boolean(e.target.value.trim()))
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

          <button
            className="cart-toggle"
            type="button"
            onClick={onOpenCart}
            aria-label="View shopping cart"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
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
        </div>
      </div>
    </nav>
  )
}
