import './Footer.css'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <img
            src="https://img.miniexcavator.org/ebay/Dashboard-Icon/Happy_Machinery_Logo.webp"
            alt="Happy Machinery Logo"
            className="footer-logo"
            onError={(e) => { (e.target as HTMLImageElement).src = '/images/Happy_Machinery_Logo.webp' }}
          />
          <p className="footer-desc">
            Premium mini track loaders, skid steers, mini excavators, attachments, and spare parts. Reliably serving worksites and fleets across the USA.
          </p>
        </div>

        <div className="footer-links-grid">
          <div className="footer-column">
            <h4>Products</h4>
            <ul>
              <li><a href="/store">Mini Excavators</a></li>
              <li><a href="/store">Mini Skid Steers</a></li>
              <li><a href="/store">Attachments</a></li>
              <li><a href="/store">Spare Parts</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Support</h4>
            <ul>
              <li><a href="/contact">Contact Sales</a></li>
              <li><a href="/contact">Technical Service</a></li>
              <li><a href="/about">Shipping Policy</a></li>
              <li><a href="/about">Warranty Details</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Branding</h4>
            <ul>
              <li><span className="footer-domain">happymachinery.com</span></li>
              <li><a href="mailto:support@happymachinery.com">support@happymachinery.com</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {currentYear} Happy Machinery. All rights reserved.</p>
      </div>
    </footer>
  )
}
