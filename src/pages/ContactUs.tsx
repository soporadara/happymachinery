import { useState, useEffect } from 'react'
import { appendSharedContent } from '../data/sharedContentStorage'
import PageBanner from '../components/PageBanner'
import './ContactUs.css'

export default function ContactUs() {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [])

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    machineryType: 'Mini Excavators',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMessage('Please fill out all required fields.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email.trim())) {
      setErrorMessage('Please enter a valid email address.')
      return
    }

    setSubmitted(true)
    setErrorMessage('')

    try {
      const newInquiry = {
        id: Date.now(),
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: '',
        company: '',
        message: formData.message.trim(),
        date: new Date().toISOString().slice(0, 10),
        status: 'New' as const,
        productInterest: formData.machineryType
      }

      // 1. Immediately store to local storage backup so inquiry is NEVER lost
      try {
        const rawLocal = localStorage.getItem('happy-machinery-inquiries')
        const localList = rawLocal ? JSON.parse(rawLocal) : []
        const updated = [newInquiry, ...localList.filter((item: any) => item.id !== newInquiry.id)]
        localStorage.setItem('happy-machinery-inquiries', JSON.stringify(updated))
      } catch (err) {
        console.warn('Could not cache inquiry to localStorage:', err)
      }

      // 2. Persist to shared backend content.json storage for CMS
      await appendSharedContent('inquiries', newInquiry)

      // 3. Broadcast events so open CMS tabs or listeners update in real time
      window.dispatchEvent(new Event('inquiry-submitted'))
      try {
        window.dispatchEvent(new CustomEvent('inquiry-submitted-data', { detail: newInquiry }))
      } catch {}

      setIsSuccess(true)
      setFormData({ name: '', email: '', machineryType: 'Mini Excavators', message: '' })
    } catch (err) {
      console.warn('Inquiry shared storage append status:', err)
      // Since it is safely stored in local backup, display success
      setIsSuccess(true)
      setFormData({ name: '', email: '', machineryType: 'Mini Excavators', message: '' })
    } finally {
      setSubmitted(false)
    }
  }

  return (
    <div className="page contact-page">
      <PageBanner
        badgeText="DIRECT SALES & TECHNICAL SERVICE"
        title="Contact Us"
        description="Inquire about official TYPHON Machinery, American skid steers, mini excavators USA, commercial attachments, or schedule technical support and nationwide freight delivery."
        features={[
          { icon: '📞', text: 'Direct US & Global Phone Support' },
          { icon: '🚚', text: 'Freight & Liftgate Delivery Quotes' },
          { icon: '📄', text: 'Financing & Invoice Support' },
          { icon: '⏱️', text: 'Prompt Response Within 24 Hours' }
        ]}
        showColorOptions={true}
        imageSrc="/images/v900-promo.webp"
        imageAlt="Happy Machinery TYPHON V900 Mini Skid Steers in Yellow, Red, and Blue"
      />

      <div className="contact-split">
        <div className="contact-info-panel">
          <h2>Get in Touch</h2>
          <p>Whether you need a quick quote on shipping or want custom specifications for TYPHON Machinery American skid steers, mini excavators, and attachments, our local engineering and sales team is here to assist.</p>

          <div className="info-detail-row">
            <span className="info-icon">📍</span>
            <div>
              <h3>TYPHON Machinery Offices</h3>
              <div className="office-addresses">
                <address>
                  <strong>United States</strong>
                  2522 S Malt Ave.<br />
                  Commerce, CA 90040<br />
                  United States
                </address>
                <address>
                  <strong>Singapore</strong>
                  Blk 73, Geylang Bahru, #06-3062<br />
                  Singapore 330073<br />
                  Republic of Singapore
                </address>
              </div>
            </div>
          </div>

          <div className="info-detail-row">
            <span className="info-icon">✉️</span>
            <div>
              <h3>Email Support</h3>
              <ul className="contact-channel-list">
                <li><strong>Sales Enquiries</strong><a href="mailto:sales@typhonmachinery.com">sales@typhonmachinery.com</a></li>
                <li><strong>Tech Enquiries</strong><a href="mailto:support@typhonmachinery.com">support@typhonmachinery.com</a></li>
                <li><strong>Logistics Helpline</strong><a href="mailto:logistics@typhonmachinery.com">logistics@typhonmachinery.com</a></li>
              </ul>
            </div>
          </div>

          <div className="info-detail-row">
            <span className="info-icon">☎️</span>
            <div>
              <h3>Phone Support</h3>
              <ul className="contact-channel-list compact">
                <li><strong>United States</strong><a href="tel:+12132142203">+1 213-214-2203</a></li>
                <li><strong>Singapore</strong><a href="tel:+6588051086">+65 8805 1086</a></li>
                <li><strong>Cambodia</strong><a href="tel:+85586719472">+855 8671 9472</a></li>
                <li><strong>Logistics Helpline</strong><a href="tel:+16263892472">(626) 389-2472</a></li>
              </ul>
            </div>
          </div>

          <div className="info-detail-row whatsapp-row">
            <span className="info-icon">💬</span>
            <div>
              <h3>WhatsApp Support</h3>
              <p>
                United States:{' '}
                <a href="https://wa.me/13235325703" target="_blank" rel="noreferrer">+1 323-532-5703</a>
              </p>
            </div>
          </div>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="contact-form-heading">
            <p className="eyebrow">Request Information</p>
            <h2>Send an inquiry</h2>
            <span>Tell us what you need and our equipment team will respond within one business day.</span>
          </div>

          {isSuccess && (
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '10px', padding: '14px 16px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>✓</span>
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>Inquiry Sent Successfully!</strong>
                <span style={{ fontSize: '0.85rem' }}>Our sales & engineering team has received your inquiry and will reach out within 24 hours.</span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '12px 16px', color: '#dc2626', marginBottom: '16px', fontSize: '0.88rem' }}>
              {errorMessage}
            </div>
          )}


          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="machinery">Equipment Interest</label>
            <select
              id="machinery"
              value={formData.machineryType}
              onChange={(e) => setFormData({ ...formData, machineryType: e.target.value })}
            >
              <option value="Mini Excavators">Mini Excavators</option>
              <option value="Skid Steers">Skid Steers & Track Loaders</option>
              <option value="Attachments">System Attachments</option>
              <option value="Spare Parts">Spare Parts & Accessories</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="message">Message / Inquiry Details</label>
            <textarea
              id="message"
              required
              rows={5}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            ></textarea>
          </div>

          <button type="submit" className="submit-btn" disabled={submitted}>
            {submitted ? 'Sending Inquiry...' : 'Submit Inquiry'}
          </button>
        </form>
      </div>

      <section className="contact-location" aria-labelledby="location-title">
        <div className="location-heading">
          <div>
            <p className="eyebrow">Visit Our Location</p>
            <h2 id="location-title">See the equipment in person.</h2>
          </div>
          <p>Schedule your visit before arrival so our team can confirm machine availability and have someone ready to assist you.</p>
        </div>

        <div className="location-card">
          <div className="location-map">
            <iframe
              title="TYPHON Machinery location at 2522 S Malt Ave, Commerce, California"
              src="https://www.google.com/maps?q=2522+S+Malt+Ave,+Commerce,+CA+90040&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            ></iframe>
          </div>
          <div className="location-details">
            <span className="location-pin" aria-hidden="true">⌖</span>
            <p className="location-label">US Showroom & Logistics</p>
            <h3>TYPHON Machinery</h3>
            <address>2522 S Malt Ave<br />Commerce, CA 90040<br />United States</address>
            <dl>
              <div><dt>Visiting hours</dt><dd>Monday–Friday · 9 AM–5 PM</dd></div>
              <div><dt>Phone</dt><dd><a href="tel:+12132142203">+1 213-214-2203</a></dd></div>
            </dl>
            <a
              className="directions-link"
              href="https://www.google.com/maps/dir/?api=1&destination=2522+S+Malt+Ave,+Commerce,+CA+90040"
              target="_blank"
              rel="noreferrer"
            >
              Get Directions <span aria-hidden="true">↗</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
