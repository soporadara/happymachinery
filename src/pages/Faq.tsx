import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './Faq.css'

type FaqItem = {
  id: string
  category: 'Equipment' | 'Shipping' | 'Warranty' | 'Payment' | 'Maintenance'
  question: string
  answer: string
}

const FAQ_DATA: FaqItem[] = [
  {
    id: 'faq-1',
    category: 'Equipment',
    question: 'What engine powers the Happy Machinery Skid Steer V900?',
    answer: 'The Skid Steer V900 is equipped with a genuine Kubota D1105 3-cylinder liquid-cooled diesel engine delivering 25 HP. Kubota engines are globally renowned for fuel efficiency, low vibration, and widespread service/parts availability across North America.'
  },
  {
    id: 'faq-2',
    category: 'Equipment',
    question: 'What is the operating load capacity and track system on the V900?',
    answer: 'The V900 boasts an operating load capacity of up to 900 lbs (408 kg) with a tipping load of approximately 1,800 lbs. It rides on reinforced heavy-duty rubber tracks with sealed roller bearings, providing low ground pressure (approx. 4.2 PSI) to protect established turf, lawns, and finished surfaces.'
  },
  {
    id: 'faq-3',
    category: 'Equipment',
    question: 'Are Happy Machinery attachments universal standard quick-tach?',
    answer: 'Yes. The V900 features an industry-standard mini universal quick-attach mounting plate. It is compatible with a wide assortment of attachments including pallet forks, post hole augers, hydraulic trenchers, grapple buckets, 4-in-1 buckets, snow blowers, and hydraulic sweepers.'
  },
  {
    id: 'faq-4',
    category: 'Shipping',
    question: 'How does nationwide freight shipping work for heavy equipment?',
    answer: 'We provide door-to-door commercial and residential freight shipping across all contiguous 48 US states. Equipment is securely crated and strapped on heavy-duty wooden skids. Freight deliveries include liftgate service where weight parameters permit, or can be scheduled for local commercial terminal pickup with forklift assistance.'
  },
  {
    id: 'faq-6',
    category: 'Warranty',
    question: 'What warranty is included with Happy Machinery equipment?',
    answer: 'Every machine comes with a 1-Year Limited Manufacturer Warranty covering structural steel defects, hydraulic pumps, drive motors, and electrical harnesses. The Kubota diesel engine is backed by Kubota manufacturer warranties honored at certified Kubota service centers across the USA.'
  },
  {
    id: 'faq-7',
    category: 'Warranty',
    question: 'How do I request replacement parts or warranty service?',
    answer: 'We maintain a dedicated spare parts warehouse in Dallas, Texas stocking replacement filters, hydraulic hoses, rubber tracks, seals, and electrical switches. To initiate a parts request or warranty claim, contact support@happymachinery.com or call +1 (888) 555-0199 with your serial number and invoice.'
  },
  {
    id: 'faq-8',
    category: 'Payment',
    question: 'What payment methods and commercial financing do you accept?',
    answer: 'We accept major credit cards (Visa, MasterCard, Amex, Discover), bank wire transfers (ACH), and certified cashier checks. We also partner with commercial equipment lenders offering flexible leasing, tax-deductible Section 179 equipment financing, and affordable monthly contractor plans.'
  },
  {
    id: 'faq-9',
    category: 'Payment',
    question: 'Can I purchase tax-exempt if I am a farm or business reseller?',
    answer: 'Yes. If your business qualifies for agricultural, resale, or manufacturing sales tax exemption in your state, email your valid exemption certificate to support@happymachinery.com prior to placing your order, and our billing department will process your invoice tax-free.'
  },
  {
    id: 'faq-10',
    category: 'Maintenance',
    question: 'What routine maintenance is required for the Skid Steer V900?',
    answer: 'Routine maintenance includes daily grease point lubrication, hydraulic fluid inspection, and track tension checks. Engine oil and oil filter changes are recommended at the initial 50-hour break-in period, and every 100 hours thereafter. A comprehensive operation and maintenance manual is provided with every shipment.'
  }
]

export default function Faq() {
  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [openIds, setOpenIds] = useState<string[]>(['faq-1', 'faq-4'])

  useEffect(() => {
    window.scrollTo(0, 0)
    document.title = 'Frequently Asked Questions (FAQ) | Happy Machinery'
  }, [])

  const toggleItem = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const categories = ['All', 'Equipment', 'Shipping', 'Warranty', 'Payment', 'Maintenance']

  const filteredFaqs = FAQ_DATA.filter((item) => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className="faq-page">
      <div className="faq-hero">
        <span className="faq-eyebrow">💡 Help Center & Knowledge Base</span>
        <h1>Frequently Asked Questions</h1>
        <p>
          Find clear answers regarding the Kubota V900 Skid Steer, nationwide freight delivery, factory warranties, commercial financing, and genuine parts support.
        </p>

        <div className="faq-search-box">
          <span className="faq-search-icon">🔍</span>
          <input
            type="text"
            className="faq-search-input"
            placeholder="Search questions by keyword (e.g. Kubota, shipping, warranty, tracks)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="faq-categories">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`faq-cat-btn ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat === 'All' && '📋 '}
            {cat === 'Equipment' && '🚜 '}
            {cat === 'Shipping' && '🚚 '}
            {cat === 'Warranty' && '🛡️ '}
            {cat === 'Payment' && '💳 '}
            {cat === 'Maintenance' && '⚙️ '}
            {cat}
          </button>
        ))}
      </div>

      {/* FAQ Accordion List */}
      <div className="faq-list">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq) => {
            const isOpen = openIds.includes(faq.id)
            return (
              <div key={faq.id} className={`faq-item ${isOpen ? 'is-open' : ''}`}>
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => toggleItem(faq.id)}
                  aria-expanded={isOpen}
                >
                  <span className="faq-question-text">
                    <span className="faq-category-tag">{faq.category}</span>
                    {faq.question}
                  </span>
                  <span className="faq-toggle-icon">{isOpen ? '×' : '+'}</span>
                </button>
                {isOpen && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="faq-empty-state">
            <h3>No questions found matching "{searchQuery}"</h3>
            <p>Try searching with different terms or select "All" categories above.</p>
          </div>
        )}
      </div>

      {/* Bottom CTA Card */}
      <div className="faq-cta-card">
        <div className="faq-cta-copy">
          <h3>Still have questions or need custom machinery specs?</h3>
          <p>
            Our heavy machinery engineers and freight dispatch team in Dallas, Texas are ready to assist with equipment sizing, attachment compatibility, and commercial quotes.
          </p>
        </div>
        <div className="faq-cta-actions">
          <Link to="/contact" className="faq-btn-primary">
            Contact Machinery Team
          </Link>
          <a href="tel:+18885550199" className="faq-btn-secondary">
            Call +1 (888) 555-0199
          </a>
        </div>
      </div>
    </div>
  )
}
