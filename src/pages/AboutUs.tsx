import PageBanner from '../components/PageBanner'
import './AboutUs.css'

export default function AboutUs() {
  return (
    <div className="page about-page">
      <PageBanner
        badgeText="ABOUT HAPPY MACHINERY"
        eyebrow="COMMERCIAL HEAVY MACHINERY SPECIALISTS"
        title="Experts in Mini Excavators, Skid Steers & Heavy Equipment"
        titleHighlight="Engineered for Reliability"
        description="We provide construction contractors, arborists, and landscapers with high-performance, compact machinery engineered for durability, agility in tight spaces, and maximum uptime."
        features={[
          { icon: '🇺🇸', text: 'USA Nationwide Warehousing' },
          { icon: '🛡️', text: '1-Year Comprehensive Warranty' },
          { icon: '🚜', text: '35.9" Tight-Access Agility' },
          { icon: '🔧', text: 'Full OEM Spare Parts Support' }
        ]}
        primaryBtn={{
          text: 'Explore Equipment Catalog',
          link: '/store'
        }}
        secondaryBtn={{
          text: 'Contact Our Specialists',
          link: '/contact'
        }}
        showColorOptions={true}
        imageSrc="/images/v900-promo.webp"
        imageAlt="Happy Machinery TYPHON Fleet in Industrial Yellow, Crimson Red, and Cobalt Blue"
      />

      <section className="split-section">
        <div className="split-content">
          <h2>Our Vision</h2>
          <p>
            Our vision is to provide construction professionals with state-of-the-art, reliable, high-performance equipment that increases productivity and fosters success. Providing top-notch tools backed by top-notch technical support and a commitment to excellence are our top goals. We want to set the standard in the heavy machinery industry by consistently focusing on quality, customer satisfaction, and continuous improvement.
          </p>
        </div>
        <div className="metric-panel metric-panel-light">
          <div className="metric-badge-icon">🛡️</div>
          <span className="metric-value">1 Year</span>
          <p className="metric-desc">Warranty on all major machinery parts and support</p>
        </div>
      </section>

      <section className="split-section">
        <div className="metric-panel metric-panel-usa">
          <div className="metric-badge-icon">🇺🇸</div>
          <span className="metric-value">USA</span>
          <p className="metric-desc">Nationwide distribution centers & localized support</p>
        </div>
        <div className="split-content">
          <h2>Our Mission</h2>
          <p>
            Our mission is to become the leading global provider of modern construction tools, setting benchmarks for quality, longevity, and technological advancement. We want to revolutionize the construction industry by offering machinery that not only meets but exceeds customer expectations. Through promoting innovation, sustainability, and outstanding service after the sale, we envision a future marked by trust, reliability, and the highest level of performance on every job site.
          </p>
        </div>
      </section>

      <section className="values-section">
        <h2>Our Core Products</h2>
        <div className="values-grid">
          <article className="value-card">
            <div className="value-icon">🚜</div>
            <h3>Mini Excavators</h3>
            <p>Our compact and versatile mini excavators are expertly designed for efficient digging in tight spaces, making them perfect for a wide range of construction and landscaping projects.</p>
          </article>
          <article className="value-card">
            <div className="value-icon">⚙️</div>
            <h3>Skid Steer Loaders</h3>
            <p>Our strong and flexible skid steer loaders are designed to handle a variety of construction and loading jobs with ease, providing outstanding dependability and flexibility.</p>
          </article>
          <article className="value-card">
            <div className="value-icon">🔧</div>
            <h3>Attachments & Spares</h3>
            <p>Upgrade your excavators and skid steer loaders with our wide range of unique attachments, made to boost productivity and expand versatility on any job site.</p>
          </article>
        </div>
      </section>

      <section className="values-section">
        <h2>Why Choose Happy Machinery?</h2>
        <div className="values-grid">
          <article className="value-card">
            <div className="value-icon">💎</div>
            <h3>Quality Assurance</h3>
            <p>We emphasize quality at every stage, from production to delivery. Each piece of equipment is rigorously tested to ensure it meets top-tier standards for durability and performance.</p>
          </article>
          <article className="value-card">
            <div className="value-icon">🚚</div>
            <h3>Reliable Delivery</h3>
            <p>Our carefully selected warehouses across the USA help us to ensure fast delivery to our customers and efficiently handle orders.</p>
          </article>
          <article className="value-card">
            <div className="value-icon">📞</div>
            <h3>Customer Support</h3>
            <p>Our dedicated USA-based team is always available to assist with any inquiries, offering outstanding customer service and technical support at support@happymachinery.com.</p>
          </article>
        </div>
      </section>

      <section className="values-section">
        <h2>Our Team & Operations</h2>
        <p className="team-intro-subtitle">
          At Happy Machinery, collaboration, innovation, and unity drive our success in delivering top-tier construction equipment.
        </p>
        <div className="values-grid team-grid">
          <article className="value-card team-card">
            <img src="/images/about-team-1.png" alt="Happy Machinery Team Unity" className="team-img" />
            <div className="team-body">
              <h3>Team Unity</h3>
              <p>Working closely with our dealers, operators, and staff to build strong, reliable bonds and deliver lasting machinery results.</p>
            </div>
          </article>
          <article className="value-card team-card">
            <img src="/images/about-team-2.jpg" alt="Happy Machinery Collaboration" className="team-img" />
            <div className="team-body">
              <h3>Collaboration</h3>
              <p>Our dedicated engineering, sales, and USA-based support teams coordinate daily to solve challenges and optimize fleet delivery.</p>
            </div>
          </article>
          <article className="value-card team-card">
            <img src="/images/about-team-3.png" alt="Happy Machinery Expert Planning" className="team-img" />
            <div className="team-body">
              <h3>Expert Planning</h3>
              <p>Leveraging modern technology, rigorous testing, and data-driven analysis to design advanced products for demanding conditions.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="promise-band">
        <h2>Our Commitment</h2>
        <p>
          Our team at Happy Machinery is dedicated to providing premium mini excavators and heavy equipment, redefining dependability, performance, and durability. Our machinery is built to satisfy the highest requirements of construction and excavation, therefore guaranteeing the power and accuracy required to approach any project with assurance. Learn more at http://happymachinery.com.
        </p>
      </section>
    </div>
  )
}
