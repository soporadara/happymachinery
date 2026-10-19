export default function AboutUs() {
  return (
    <div className="page about-page">
      <div className="page-hero">
        <p className="eyebrow">About Happy Machinery</p>
        <h1>Experts in Mini Excavators, Skid Steers, and Heavy Machinery Solutions.</h1>
        <p>
          We provide construction professionals with state-of-the-art, reliable, high-performance equipment that increases productivity and fosters success on every job site.
        </p>
      </div>

      <section className="split-section">
        <div>
          <h2>Our Vision</h2>
          <p>
            Our vision is to provide construction professionals with state-of-the-art, reliable, high-performance equipment that increases productivity and fosters success. Providing top-notch tools backed by top-notch technical support and a commitment to excellence are our top goals. We want to set the standard in the heavy machinery industry by consistently focusing on quality, customer satisfaction, and continuous improvement.
          </p>
        </div>
        <div className="metric-panel">
          <span>1 Year</span>
          <p>Warranty on all major machinery parts and support</p>
        </div>
      </section>

      <section className="split-section">
        <div className="metric-panel" style={{ background: 'linear-gradient(135deg, #1d7ff3, #0c2b5c)' }}>
          <span>USA</span>
          <p>Nationwide distribution centers & localized support</p>
        </div>
        <div>
          <h2>Our Mission</h2>
          <p>
            Our mission is to become the leading global provider of modern construction tools, setting benchmarks for quality, longevity, and technological advancement. We want to revolutionize the construction industry by offering machinery that not only meets but exceeds customer expectations. Through promoting innovation, sustainability, and outstanding service after the sale, we envision a future marked by trust, reliability, and the highest level of performance on every job site.
          </p>
        </div>
      </section>

      <section className="values-section" style={{ margin: '48px 0' }}>
        <h2>Our Core Products</h2>
        <div className="values-grid">
          <article className="value-card">
            <div className="value-icon" style={{ fontSize: '2.2rem', marginBottom: '12px' }}>🚜</div>
            <h3>Mini Excavators</h3>
            <p>Our compact and versatile mini excavators are expertly designed for efficient digging in tight spaces, making them perfect for a wide range of construction and landscaping projects.</p>
          </article>
          <article className="value-card">
            <div className="value-icon" style={{ fontSize: '2.2rem', marginBottom: '12px' }}>⚙️</div>
            <h3>Skid Steer Loaders</h3>
            <p>Our strong and flexible skid steer loaders are designed to handle a variety of construction and loading jobs with ease, providing outstanding dependability and flexibility.</p>
          </article>
          <article className="value-card">
            <div className="value-icon" style={{ fontSize: '2.2rem', marginBottom: '12px' }}>🔧</div>
            <h3>Attachments & Spares</h3>
            <p>Upgrade your excavators and skid steer loaders with our wide range of unique attachments, made to boost productivity and expand versatility on any job site.</p>
          </article>
        </div>
      </section>

      <section className="values-section" style={{ margin: '48px 0' }}>
        <h2>Why Choose Happy Machinery?</h2>
        <div className="values-grid">
          <article className="value-card">
            <div className="value-icon" style={{ fontSize: '2.2rem', marginBottom: '12px' }}>💎</div>
            <h3>Quality Assurance</h3>
            <p>We emphasize quality at every stage, from production to delivery. Each piece of equipment is rigorously tested to ensure it meets top-tier standards for durability and performance.</p>
          </article>
          <article className="value-card">
            <div className="value-icon" style={{ fontSize: '2.2rem', marginBottom: '12px' }}>🚚</div>
            <h3>Reliable Delivery</h3>
            <p>Our carefully selected warehouses across the USA help us to ensure fast delivery to our customers and efficiently handle orders.</p>
          </article>
          <article className="value-card">
            <div className="value-icon" style={{ fontSize: '2.2rem', marginBottom: '12px' }}>📞</div>
            <h3>Customer Support</h3>
            <p>Our dedicated USA-based team is always available to assist with any inquiries, offering outstanding customer service and technical support at support@happymachinery.com.</p>
          </article>
        </div>
      </section>

      <section className="values-section" style={{ margin: '48px 0' }}>
        <h2>Our Team & Operations</h2>
        <p style={{ marginBottom: '24px', textAlign: 'center', color: '#52708a' }}>
          At Happy Machinery, collaboration, innovation, and unity drive our success in delivering top-tier construction equipment.
        </p>
        <div className="values-grid">
          <article className="value-card" style={{ padding: '0', overflow: 'hidden', textAlign: 'left' }}>
            <img src="/images/about-team-1.png" alt="Happy Machinery Team Unity" style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }} />
            <div style={{ padding: '20px' }}>
              <h3 style={{ marginTop: '0' }}>Team Unity</h3>
              <p style={{ margin: '0' }}>Working closely with our dealers, operators, and staff to build strong, reliable bonds and deliver lasting machinery results.</p>
            </div>
          </article>
          <article className="value-card" style={{ padding: '0', overflow: 'hidden', textAlign: 'left' }}>
            <img src="/images/about-team-2.jpg" alt="Happy Machinery Collaboration" style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }} />
            <div style={{ padding: '20px' }}>
              <h3 style={{ marginTop: '0' }}>Collaboration</h3>
              <p style={{ margin: '0' }}>Our dedicated engineering, sales, and USA-based support teams coordinate daily to solve challenges and optimize fleet delivery.</p>
            </div>
          </article>
          <article className="value-card" style={{ padding: '0', overflow: 'hidden', textAlign: 'left' }}>
            <img src="/images/about-team-3.png" alt="Happy Machinery Expert Planning" style={{ width: '100%', height: '220px', objectFit: 'cover', display: 'block' }} />
            <div style={{ padding: '20px' }}>
              <h3 style={{ marginTop: '0' }}>Expert Planning</h3>
              <p style={{ margin: '0' }}>Leveraging modern technology, rigorous testing, and data-driven analysis to design advanced products for demanding conditions.</p>
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

