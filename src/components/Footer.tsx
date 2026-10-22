import { Link } from 'react-router-dom'
import { useSiteBranding } from '../data/siteBranding'
import './Footer.css'

export default function Footer() {
  const branding = useSiteBranding()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      {/* Pre-Footer Highlight Bar: Value Propositions */}
      <div className="footer-highlights">
        <div className="footer-highlights-container">
          <div className="footer-highlight-item">
            <span className="footer-highlight-icon">🚚</span>
            <div>
              <strong>Nationwide Freight Delivery</strong>
              <p>Direct flatbed & liftgate delivery across all 48 US states</p>
            </div>
          </div>
          <div className="footer-highlight-item">
            <span className="footer-highlight-icon">🛡️</span>
            <div>
              <strong>1-Year Factory Warranty</strong>
              <p>Full chassis & Kubota diesel engine warranty coverage</p>
            </div>
          </div>
          <div className="footer-highlight-item">
            <span className="footer-highlight-icon">💬</span>
            <div>
              <strong>Contractor Support</strong>
              <p>Live equipment specialists ready to assist your jobsite</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Container */}
      <div className="footer-container">
        {/* Brand Column */}
        <div className="footer-brand-col">
          <Link to="/" className="footer-brand-logo-link" aria-label="Happy Machinery home">
            <img
              src={(branding.logo && branding.logo !== '/logo.png') ? branding.logo : '/images/header-logo.webp'}
              alt={branding.siteName || 'Happy Machinery'}
              className="footer-logo"
              onError={(e) => { (e.target as HTMLImageElement).src = '/images/header-logo.png' }}
            />
          </Link>
          <p className="footer-desc">
            Authorized distributor of high-performance mini skid steers, compact excavators, 
            and heavy-duty attachments. Engineered for contractor reliability and residential tight-access.
          </p>
        </div>

        {/* Navigation Links Columns */}
        <div className="footer-columns-group">
          {/* Column 1: Products */}
          <div className="footer-column footer-products-col">
            <h4>PRODUCTS</h4>
            <ul className="footer-category-list">
              <li><Link to="/store?search=Mini+Excavators">Mini Excavators</Link></li>
              <li><Link to="/store?search=Mini+Skid+Steers">Mini Skid Steers</Link></li>
              <li><Link to="/store?search=Attachments">Attachments</Link></li>
              <li><Link to="/store?search=Spare+Parts">Spare Parts</Link></li>
            </ul>

            <div className="footer-v900-models-header">V900 COLOR EDITIONS</div>
            <ul className="footer-v900-list">
              <li>
                <Link to="/product/typhon-stomp-v900-mini-track-loader-kubota-d1105" className="footer-v900-link" title="TYPHON STOMP V900 - Industrial Yellow">
                  <span className="v900-color-swatch yellow" aria-hidden="true"></span>
                  <span>V900 Skid Steer – Yellow</span>
                </Link>
              </li>
              <li>
                <Link to="/product/typhon-stomp-v900-mini-track-loader-kubota-d1105-red" className="footer-v900-link" title="TYPHON STOMP V900 - Crimson Red">
                  <span className="v900-color-swatch red" aria-hidden="true"></span>
                  <span>V900 Skid Steer – Red</span>
                </Link>
              </li>
              <li>
                <Link to="/product/typhon-stomp-v900-mini-track-loader-kubota-d1105-blue" className="footer-v900-link" title="TYPHON STOMP V900 - Cobalt Blue">
                  <span className="v900-color-swatch blue" aria-hidden="true"></span>
                  <span>V900 Skid Steer – Blue</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Support */}
          <div className="footer-column">
            <h4>SUPPORT</h4>
            <ul>
              <li><Link to="/contact">Contact Sales</Link></li>
              <li><Link to="/contact">Technical Service</Link></li>
              <li><Link to="/faq">Shipping Policy</Link></li>
              <li><Link to="/terms-of-service#warranty">Warranty Details</Link></li>
            </ul>
          </div>
        </div>

        {/* Column 3: Contact Column */}
        <div className="footer-contact-col">
          <h4>CONTACT US</h4>
          <div className="footer-contact-list">
            <div className="footer-contact-item">
              <span className="footer-contact-icon">📞</span>
              <div>
                <span className="footer-contact-label">Toll-Free Sales & Service</span>
                <a href={`tel:${branding.phone?.replace(/[^0-9+]/g, '') || '+18885550199'}`} className="footer-contact-value">
                  {branding.phone || '+1 (888) 555-0199'}
                </a>
              </div>
            </div>

            <div className="footer-contact-item">
              <span className="footer-contact-icon">✉️</span>
              <div>
                <span className="footer-contact-label">Email Support</span>
                <div style={{ marginTop: '3px' }}>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Sales Enquiries</span>
                  <a href="mailto:sales@typhonmachinery.com" className="footer-contact-value" style={{ display: 'block', marginBottom: '4px' }}>
                    sales@typhonmachinery.com
                  </a>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tech Enquiries</span>
                  <a href="mailto:support@typhonmachinery.com" className="footer-contact-value" style={{ display: 'block', marginBottom: '4px' }}>
                    support@typhonmachinery.com
                  </a>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Logistics Helpline</span>
                  <a href="mailto:logistics@typhonmachinery.com" className="footer-contact-value" style={{ display: 'block' }}>
                    logistics@typhonmachinery.com
                  </a>
                </div>
              </div>
            </div>

            <div className="footer-contact-item">
              <span className="footer-contact-icon">📍</span>
              <div>
                <span className="footer-contact-label">TYPHON Machinery Offices</span>
                <span className="footer-contact-value" style={{ lineHeight: 1.45 }}>
                  <strong>United States</strong><br />
                  2522 S Malt Ave.<br />
                  Commerce, CA 90040<br />
                  United States
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Bottom Bar */}
      <div className="footer-bottom">
        <div className="footer-bottom-container">
          <p className="footer-copyright">
            &copy; {currentYear} Happy Machinery. All rights reserved.
          </p>

          <div className="footer-bottom-links">
            <Link to="/privacy-policy">Privacy Policy</Link>
            <span className="footer-separator">•</span>
            <Link to="/terms-of-service">Terms of Service</Link>
            <span className="footer-separator">•</span>
            <Link to="/faq">FAQ</Link>
            <span className="footer-separator">•</span>
            <Link to="/privacy-policy#cookies">Cookies</Link>
            <span className="footer-separator">•</span>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
      </div>

      {/* Decorative Layered Organic Blue Waves (Matching Screenshot 5) */}
      <div className="footer-blue-waves-strip" aria-hidden="true">
        <svg
          viewBox="0 0 1440 90"
          preserveAspectRatio="none"
          className="footer-wave-svg"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,28 C280,62 520,10 780,38 C1040,66 1260,18 1440,34 L1440,90 L0,90 Z"
            fill="rgba(56, 189, 248, 0.35)"
          />
          <path
            d="M0,42 C320,16 620,58 920,30 C1180,10 1340,46 1440,36 L1440,90 L0,90 Z"
            fill="rgba(37, 99, 235, 0.55)"
          />
          <path
            d="M0,54 C240,36 540,70 840,48 C1120,26 1320,58 1440,48 L1440,90 L0,90 Z"
            fill="rgba(29, 78, 216, 0.85)"
          />
          <path
            d="M0,66 C360,52 720,76 1080,62 L1440,66 L1440,90 L0,90 Z"
            fill="#091b36"
          />
        </svg>
      </div>
    </footer>
  )
}
