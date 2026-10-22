import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import './LegalPage.css'

export default function TermsOfService() {
  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = 'Terms of Service | Happy Machinery'
  }, [])

  return (
    <div className="legal-page">
      <div className="legal-hero">
        <span className="legal-eyebrow">📜 Commercial Agreement & Conditions</span>
        <h1>Terms of Service</h1>
        <p className="legal-hero-lead">
          These Terms of Service govern your access to and use of Happy Machinery's website, heavy equipment catalog, 
          quotation systems, payment gateways, and freight delivery services. Please read these terms carefully before placing an order.
        </p>
        <div className="legal-meta-bar">
          <span className="legal-meta-item">
            <strong>Entity:</strong> Happy Machinery
          </span>
          <span className="legal-meta-item">
            <strong>Website:</strong> https://happymachinery.com
          </span>
          <span className="legal-meta-item">
            <strong>Effective Date:</strong> October 20, 2026
          </span>
          <span className="legal-meta-item">
            <strong>Governing Law:</strong> State of Texas, USA
          </span>
        </div>
      </div>

      <div className="legal-layout">
        <aside className="legal-sidebar">
          <h3 className="legal-sidebar-title">Table of Contents</h3>
          <ul className="legal-nav-list">
            <li><a href="#acceptance" className="legal-nav-link">1. Acceptance of Terms</a></li>
            <li><a href="#machinery-orders" className="legal-nav-link">2. Equipment Sales & Orders</a></li>
            <li><a href="#pricing-payments" className="legal-nav-link">3. Pricing & Payments</a></li>
            <li><a href="#freight-delivery" className="legal-nav-link">4. Freight Shipping & Delivery</a></li>
            <li><a href="#inspection" className="legal-nav-link">5. Inspection & Delivery Claims</a></li>
            <li><a href="#warranty" className="legal-nav-link">6. Factory Warranty Policy</a></li>
            <li><a href="#returns" className="legal-nav-link">7. Returns & Cancellations</a></li>
            <li><a href="#safety" className="legal-nav-link">8. Operational Safety & Liability</a></li>
            <li><a href="#ip" className="legal-nav-link">9. Intellectual Property</a></li>
            <li><a href="#disputes" className="legal-nav-link">10. Governing Law & Disputes</a></li>
            <li><a href="#contact" className="legal-nav-link">11. Legal Inquiries</a></li>
          </ul>
          <div className="legal-sidebar-contact">
            <strong>Questions regarding terms?</strong><br />
            Email: <a href="mailto:support@happymachinery.com">support@happymachinery.com</a><br />
            Phone: <a href="tel:+18885550199">+1 (888) 555-0199</a>
          </div>
        </aside>

        <article className="legal-content">
          <section id="acceptance" className="legal-section">
            <h2><span className="legal-section-num">1</span> Acceptance of Terms</h2>
            <p>
              By visiting, browsing, registering for an account, or purchasing commercial heavy equipment from 
              <strong> Happy Machinery</strong> ("we", "our", or "us") via 
              <strong> https://happymachinery.com</strong> (the "Site"), you agree to be bound by these Terms of Service 
              and all incorporated policies, including our <Link to="/privacy-policy">Privacy & Cookie Policy</Link>. 
              If you do not agree to these terms in their entirety, you must discontinue use of the Site immediately.
            </p>
          </section>

          <section id="machinery-orders" className="legal-section">
            <h2><span className="legal-section-num">2</span> Equipment Sales, Specifications & Orders</h2>
            <p>
              Happy Machinery is an authorized dealer of compact heavy equipment, mini skid steers (including the TYPHON V900 Series), 
              mini excavators, genuine Kubota diesel engines, hydraulic attachments, and original replacement components.
            </p>
            <ul>
              <li><strong>Specification Accuracy:</strong> We endeavor to display technical specifications, dimensions, hydraulic flow rates, and operating capacities as accurately as possible. However, manufacturers continuously improve engineering designs; minor variations in factory hardware or paint hue may occur without prior notice.</li>
              <li><strong>Order Confirmation:</strong> Submission of an order or quotation request does not constitute final binding acceptance. We reserve the right to verify commercial shipping feasibility, stock availability, and fraud screening prior to order fulfillment.</li>
              <li><strong>Commercial Use:</strong> Equipment purchased from Happy Machinery is engineered for commercial, industrial, landscaping, agricultural, and residential contractor applications.</li>
            </ul>
          </section>

          <section id="pricing-payments" className="legal-section">
            <h2><span className="legal-section-num">3</span> Pricing, Quotations & Payment Terms</h2>
            <p>
              All prices displayed on the website are listed in United States Dollars (USD) unless explicitly stated otherwise.
            </p>
            <ul>
              <li><strong>Price Changes:</strong> Advertised prices are subject to adjustment due to raw material adjustments, freight market fluctuations, or tariff updates before order confirmation.</li>
              <li><strong>Accepted Methods of Payment:</strong> We accept major credit cards (Visa, MasterCard, American Express, Discover), bank wire transfers (ACH), certified cashier's checks, and approved commercial equipment financing partners.</li>
              <li><strong>Taxes:</strong> Customers are responsible for applicable state, municipal, or local sales taxes based on the destination jurisdiction, unless a valid sales tax exemption certificate is provided prior to billing.</li>
            </ul>
          </section>

          <section id="freight-delivery" className="legal-section">
            <h2><span className="legal-section-num">4</span> Nationwide Freight Shipping & Logistics</h2>
            <p>
              Due to the substantial weight and size of compact heavy equipment (e.g. mini skid steers exceeding 2,000 lbs), shipping is coordinated via specialized commercial LTL or dedicated flatbed freight carriers:
            </p>
            <ul>
              <li><strong>Delivery Area:</strong> We ship across the contiguous 48 United States. Alaska, Hawaii, Puerto Rico, and international shipments require customized logistics quotes.</li>
              <li><strong>Delivery Type:</strong> Standard freight quotes include residential or commercial delivery with hydraulic liftgate service (where weight permits) or terminal dock pickup.</li>
              <li><strong>Accessibility:</strong> The delivery recipient must ensure the jobsite or residence can accommodate standard 53-foot commercial freight trucks. If access is obstructed, delivery may be redirected to the nearest freight terminal.</li>
            </ul>
          </section>

          <section id="inspection" className="legal-section">
            <h2><span className="legal-section-num">5</span> Delivery Inspection & Freight Claims</h2>
            <div className="compliance-callout warning">
              <h4>⚠️ Mandatory Delivery Inspection Protocol</h4>
              <p>
                You or your authorized representative must inspect all machinery and attachments upon delivery BEFORE signing the Bill of Lading (BOL).
              </p>
            </div>
            <ul>
              <li><strong>Visual Damage:</strong> If crate or machinery damage is discovered upon delivery, you MUST note the damage clearly on the carrier's Bill of Lading and capture photographic evidence immediately.</li>
              <li><strong>Concealed Damage:</strong> Any concealed freight transit damage must be reported to Happy Machinery in writing within 48 hours of delivery at <strong>support@happymachinery.com</strong>.</li>
            </ul>
          </section>

          <section id="warranty" className="legal-section">
            <h2><span className="legal-section-num">6</span> Factory Warranty & Service Policy</h2>
            <p>
              Happy Machinery stands behind every piece of equipment sold:
            </p>
            <ul>
              <li><strong>Chassis & Structure:</strong> 1-Year limited manufacturer warranty against structural steel and fabrication defects under normal operating conditions.</li>
              <li><strong>Kubota Engine Warranty:</strong> Genuine Kubota diesel powerplants (e.g. Kubota D1105) carry manufacturer backed warranty coverage honoring authorized Kubota engine service centers across North America.</li>
              <li><strong>Hydraulic & Electrical Components:</strong> Covered under limited factory warranty against defect in materials and workmanship.</li>
              <li><strong>Exclusions:</strong> Consumable wear items (rubber tracks, hydraulic hoses, filters, teeth, fluids, operator abuse, inadequate maintenance, or unauthorized aftermarket modifications) are excluded from warranty coverage.</li>
            </ul>
          </section>

          <section id="returns" className="legal-section">
            <h2><span className="legal-section-num">7</span> Returns, Refunds & Cancellations</h2>
            <ul>
              <li><strong>Order Cancellation:</strong> Orders may be cancelled without penalty prior to freight carrier dispatch. Once an equipment order has been loaded onto a freight carrier, standard shipping and return restocking fees apply.</li>
              <li><strong>Return Window:</strong> Returns of unused equipment in original factory crating must be initiated within 14 days of delivery and require an official Return Merchandise Authorization (RMA) from our support team.</li>
              <li><strong>Restocking & Freight Fees:</strong> Returns of non-defective machinery are subject to a 15% restocking fee. The customer is responsible for all round-trip freight shipping charges.</li>
            </ul>
          </section>

          <section id="safety" className="legal-section">
            <h2><span className="legal-section-num">8</span> Operational Safety & Limitation of Liability</h2>
            <p>
              Heavy construction and earthmoving equipment involves inherent risks. Operators must review operating manuals, 
              wear required personal protective equipment (PPE), and operate within specified load charts.
            </p>
            <p>
              To the maximum extent permitted by applicable law, Happy Machinery and its affiliates shall not be liable for any indirect, 
              incidental, consequential, punitive, or exemplary damages, including lost jobsite profits, equipment downtime, or property damage 
              arising out of machinery operation or delayed delivery.
            </p>
          </section>

          <section id="ip" className="legal-section">
            <h2><span className="legal-section-num">9</span> Intellectual Property & Trademarks</h2>
            <p>
              All trademarks, service marks, trade names, logos, product photography, video footage, and text on 
              <strong> https://happymachinery.com</strong> are the property of Happy Machinery, TYPHON Machinery, 
              Kubota Corporation, or their respective copyright holders. Unauthorized reproduction, scraping, or branding 
              impersonation is strictly prohibited.
            </p>
          </section>

          <section id="disputes" className="legal-section">
            <h2><span className="legal-section-num">10</span> Governing Law & Dispute Resolution</h2>
            <p>
              These Terms of Service and any commercial dispute arising out of equipment transactions shall be governed by 
              and construed in accordance with the substantive laws of the <strong>State of Texas, United States</strong>, 
              without regard to its conflict of law principles. Any legal proceeding shall be instituted exclusively in the 
              state or federal courts situated in Dallas County, Texas.
            </p>
          </section>

          <section id="contact" className="legal-section">
            <h2><span className="legal-section-num">11</span> Legal & Corporate Inquiries</h2>
            <div className="compliance-callout">
              <h4>Happy Machinery — Corporate Counsel & Sales Office</h4>
              <p>
                <strong>Company:</strong> Happy Machinery<br />
                <strong>Address:</strong> Dallas, TX, United States<br />
                <strong>Email:</strong> <a href="mailto:support@happymachinery.com">support@happymachinery.com</a><br />
                <strong>Phone:</strong> <a href="tel:+18885550199">+1 (888) 555-0199</a><br />
                <strong>Website:</strong> <a href="https://happymachinery.com">https://happymachinery.com</a>
              </p>
            </div>
            <p>
              Related documents: Review our <Link to="/privacy-policy">Privacy & Cookie Policy</Link> or check our <Link to="/faq">Frequently Asked Questions (FAQ)</Link>.
            </p>
          </section>
        </article>
      </div>
    </div>
  )
}
