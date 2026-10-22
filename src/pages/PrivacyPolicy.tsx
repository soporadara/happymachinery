import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import './LegalPage.css'

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = 'Privacy & Cookie Policy | Happy Machinery'
  }, [])

  return (
    <div className="legal-page">
      <div className="legal-hero">
        <span className="legal-eyebrow">🛡️ Official Legal Documentation</span>
        <h1>Privacy & Cookie Policy</h1>
        <p className="legal-hero-lead">
          Happy Machinery is committed to protecting your privacy and ensuring the security of your personal information. 
          This policy explains how we collect, process, safeguard, and disclose your data in compliance with United States privacy laws, 
          GDPR, CCPA/CPRA, and Google API / Firebase Identity verification standards.
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
            <strong>Jurisdiction:</strong> Dallas, Texas, USA
          </span>
        </div>
      </div>

      <div className="legal-layout">
        {/* Quick-Jump Table of Contents */}
        <aside className="legal-sidebar">
          <h3 className="legal-sidebar-title">Table of Contents</h3>
          <ul className="legal-nav-list">
            <li><a href="#overview" className="legal-nav-link">1. Overview & Scope</a></li>
            <li><a href="#data-collection" className="legal-nav-link">2. Information We Collect</a></li>
            <li><a href="#google-firebase" className="legal-nav-link">3. Google & Firebase Auth</a></li>
            <li><a href="#usage" className="legal-nav-link">4. How We Use Data</a></li>
            <li><a href="#cookies" className="legal-nav-link">5. Cookie Policy</a></li>
            <li><a href="#sharing" className="legal-nav-link">6. Third-Party Sharing</a></li>
            <li><a href="#security" className="legal-nav-link">7. Data Security & Storage</a></li>
            <li><a href="#user-rights" className="legal-nav-link">8. Your Rights (GDPR & CCPA)</a></li>
            <li><a href="#children" className="legal-nav-link">9. Children's Privacy</a></li>
            <li><a href="#contact" className="legal-nav-link">10. Contact Privacy Officer</a></li>
          </ul>
          <div className="legal-sidebar-contact">
            <strong>Need help with your data?</strong><br />
            Email: <a href="mailto:support@happymachinery.com">support@happymachinery.com</a><br />
            Phone: <a href="tel:+18885550199">+1 (888) 555-0199</a>
          </div>
        </aside>

        {/* Legal Policy Content */}
        <article className="legal-content">
          <section id="overview" className="legal-section">
            <h2><span className="legal-section-num">1</span> Overview & Scope</h2>
            <p>
              This Privacy & Cookie Policy outlines how <strong>Happy Machinery</strong> ("we", "us", or "our") 
              collects, uses, maintains, and discloses information collected from users (each, a "User" or "you") of the 
              <strong> https://happymachinery.com</strong> website, our digital machinery catalog, customer portals, quotation tools, 
              and associated cloud services.
            </p>
            <p>
              By accessing or using our website, purchasing mini skid steers, excavators, attachments, or requesting equipment freight quotes, 
              you consent to the data collection and usage practices described in this policy.
            </p>
          </section>

          <section id="data-collection" className="legal-section">
            <h2><span className="legal-section-num">2</span> Information We Collect</h2>
            <p>
              We collect information in several ways depending on how you interact with our heavy machinery platform:
            </p>
            <h3>A. Information You Voluntarily Provide</h3>
            <ul>
              <li><strong>Contact Information:</strong> Full name, company or business name, billing address, freight delivery address, telephone number, and email address.</li>
              <li><strong>Commercial Inquiries:</strong> Equipment specifications, requested attachments, fleet size, jobsite delivery requirements, and custom quotation requests.</li>
              <li><strong>Financial & Payment Data:</strong> Credit card, ACH, or bank wire payment details processed securely through PCI-DSS Level 1 certified payment processors (e.g. Stripe, Authorize.Net). Happy Machinery does not store raw credit card numbers on our servers.</li>
              <li><strong>Customer Support Communications:</strong> Transcripts of emails, contact forms, or live equipment assistant inquiries.</li>
            </ul>

            <h3>B. Automatically Collected Information</h3>
            <ul>
              <li><strong>Device & Connection Data:</strong> IP address, browser type and version, operating system, language settings, and referring URLs.</li>
              <li><strong>Usage Analytics:</strong> Equipment pages viewed, time spent on technical specs, product color selections (Red, Yellow, Blue V900 editions), and interaction telemetry.</li>
            </ul>
          </section>

          <section id="google-firebase" className="legal-section">
            <h2><span className="legal-section-num">3</span> Google & Firebase Authentication Disclosures</h2>
            <div className="compliance-callout highlight">
              <h4>🔒 Strict Compliance with Google API Services User Data Policy</h4>
              <p>
                Happy Machinery complies with the Google API Services User Data Policy, including the Limited Use requirements. 
                Our platform will never sell, lease, or monetize your Google account credentials, profile data, or authentication tokens.
              </p>
            </div>
            <p>
              When you choose to authenticate or access customer account features using <strong>Google Sign-In / Google Firebase Authentication</strong>:
            </p>
            <ul>
              <li><strong>Data Accessed:</strong> We access only basic public profile information provided by Google (your primary email address, full name, profile avatar URL, and unique Google OAuth user identifier).</li>
              <li><strong>Purpose of Access:</strong> This information is strictly utilized to authenticate your identity, prevent fraud, grant secure access to equipment order tracking, and maintain your machinery warranty documents.</li>
              <li><strong>Data Protection:</strong> All OAuth access tokens and session credentials exchanged with Google Firebase servers are encrypted in transit via Transport Layer Security (TLS 1.3) and stored securely in compliance with ISO/IEC 27001 standards.</li>
              <li><strong>No Commercial Transfer:</strong> We do not transfer Google user data to third parties, data brokers, advertising platforms, or credit reporting agencies.</li>
            </ul>
          </section>

          <section id="usage" className="legal-section">
            <h2><span className="legal-section-num">4</span> How We Use Your Information</h2>
            <p>We process personal information under lawful bases for legitimate business operations:</p>
            <ul>
              <li><strong>Fulfillment & Logistics:</strong> Processing equipment sales, arranging flatbed/liftgate freight delivery across the contiguous 48 US states, and coordinating with freight carriers.</li>
              <li><strong>Account Management:</strong> Verifying credentials, managing order history, and delivering factory warranty registrations for Kubota engines and Typhon chassis.</li>
              <li><strong>Customer Support:</strong> Providing technical assistance, diagnostic troubleshooting, and parts ordering.</li>
              <li><strong>Fraud Prevention & Security:</strong> Monitoring suspicious transactions, verifying billing authenticity, and defending against cyber threats.</li>
              <li><strong>Legal Compliance:</strong> Meeting tax reporting requirements, commercial sales regulations, and lawful governmental subpoenas.</li>
            </ul>
          </section>

          <section id="cookies" className="legal-section">
            <h2><span className="legal-section-num">5</span> Cookie Policy & Tracking Technologies</h2>
            <p>
              Cookies are small data files placed on your computer or mobile device when you visit our website. 
              We use both session cookies (which expire once you close your browser) and persistent cookies (which remain on your device until deleted).
            </p>
            <div className="legal-table-wrapper">
              <table className="legal-table">
                <thead>
                  <tr>
                    <th>Cookie Category</th>
                    <th>Purpose & Function</th>
                    <th>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Strictly Necessary</strong></td>
                    <td>Essential for navigating the store, remembering items in your cart, and user session authentication.</td>
                    <td>Session / 30 Days</td>
                  </tr>
                  <tr>
                    <td><strong>Performance & Analytics</strong></td>
                    <td>Aggregated, anonymous metrics on machinery catalog pageviews, search queries, and load times.</td>
                    <td>1 Year</td>
                  </tr>
                  <tr>
                    <td><strong>Preferences & Settings</strong></td>
                    <td>Stores your UI preferences such as Dark Mode or Light Mode theme selection and recent search queries.</td>
                    <td>Persistent</td>
                  </tr>
                  <tr>
                    <td><strong>Security & Anti-Fraud</strong></td>
                    <td>Detects automated scrapers, prevents unauthorized access, and secures payment checkout forms.</td>
                    <td>Session</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              <strong>Managing Cookies:</strong> You have the right to decide whether to accept or reject cookies. 
              Most web browsers (Google Chrome, Apple Safari, Mozilla Firefox, Microsoft Edge) allow you to configure cookie preferences, 
              block third-party cookies, or wipe stored cookies via your browser settings. Please note that disabling essential cookies 
              may impact your ability to use the shopping cart or complete equipment orders.
            </p>
          </section>

          <section id="sharing" className="legal-section">
            <h2><span className="legal-section-num">6</span> Third-Party Service Providers</h2>
            <p>
              We do not sell, rent, or trade your personal information. We disclose information only to vetted third-party service providers 
              who perform essential services on our behalf under strict non-disclosure and data protection contracts:
            </p>
            <ul>
              <li><strong>Freight & Logistics Partners:</strong> Freight carriers (e.g. R+L Carriers, Estes Express, TForce Freight) receive your delivery address, recipient name, and phone number solely for scheduling liftgate delivery.</li>
              <li><strong>Cloud & Authentication Infrastructure:</strong> Google Cloud Platform and Google Firebase for secure hosting and authentication.</li>
              <li><strong>Payment Processors:</strong> PCI-compliant payment gateways handling encrypted tokenized financial transactions.</li>
            </ul>
          </section>

          <section id="security" className="legal-section">
            <h2><span className="legal-section-num">7</span> Data Security & Storage</h2>
            <p>
              Happy Machinery maintains industry-standard administrative, physical, and technical safeguards designed to protect personal data:
            </p>
            <ul>
              <li><strong>Encryption:</strong> 256-bit TLS (Transport Layer Security) encryption for all data in transit across our website and APIs.</li>
              <li><strong>Access Control:</strong> Administrative access to customer databases is restricted to authorized personnel with multi-factor authentication (MFA).</li>
              <li><strong>Data Retention:</strong> We retain customer and transaction records only for as long as necessary to fulfill commercial orders, honor warranty obligations, and comply with state and federal tax record-keeping regulations.</li>
            </ul>
          </section>

          <section id="user-rights" className="legal-section">
            <h2><span className="legal-section-num">8</span> Your Rights (GDPR & CCPA/CPRA Compliance)</h2>
            <p>
              Depending on your location, you may have specific statutory rights regarding your personal information:
            </p>
            <ul>
              <li><strong>Right to Know / Access:</strong> You can request a copy of the specific personal data we hold about you.</li>
              <li><strong>Right to Rectification:</strong> You can ask us to correct inaccurate or incomplete customer information.</li>
              <li><strong>Right to Deletion ("Right to Be Forgotten"):</strong> You may request the deletion of your personal data, subject to legal record retention requirements for heavy machinery sales.</li>
              <li><strong>Right to Opt-Out of Sale or Sharing:</strong> Happy Machinery <strong>DOES NOT</strong> sell personal data. You are automatically opted out of any commercial data monetization.</li>
              <li><strong>Non-Discrimination:</strong> We will never deny services, charge different prices, or provide a lower quality of service for exercising your privacy rights.</li>
            </ul>
            <p>
              To exercise any of these rights, submit your request to <strong>support@happymachinery.com</strong> with the subject line <em>"Privacy Rights Request"</em>. 
              We respond to all verified inquiries within 30 days.
            </p>
          </section>

          <section id="children" className="legal-section">
            <h2><span className="legal-section-num">9</span> Children's Privacy</h2>
            <p>
              Happy Machinery's commercial equipment store and services are directed exclusively to adults and commercial businesses. 
              We do not knowingly collect personal information from individuals under the age of 18. If you believe a minor has submitted 
              personal information to our site, please contact us immediately for prompt deletion.
            </p>
          </section>

          <section id="contact" className="legal-section">
            <h2><span className="legal-section-num">10</span> Contact Privacy Officer</h2>
            <p>If you have questions, comments, or concerns regarding this Privacy & Cookie Policy, please contact our designated privacy department:</p>
            <div className="compliance-callout">
              <h4>Happy Machinery — Data Protection & Legal Inquiries</h4>
              <p>
                <strong>Attn:</strong> Privacy & Compliance Department<br />
                <strong>Address:</strong> Dallas, TX, United States<br />
                <strong>Email:</strong> <a href="mailto:support@happymachinery.com">support@happymachinery.com</a><br />
                <strong>Phone:</strong> <a href="tel:+18885550199">+1 (888) 555-0199</a><br />
                <strong>Website:</strong> <a href="https://happymachinery.com">https://happymachinery.com</a>
              </p>
            </div>
            <p>
              Need additional assistance? Explore our <Link to="/terms-of-service">Terms of Service</Link> or review our <Link to="/faq">Frequently Asked Questions</Link>.
            </p>
          </section>
        </article>
      </div>
    </div>
  )
}
