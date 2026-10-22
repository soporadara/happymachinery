<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0"
  xmlns:html="http://www.w3.org/TR/REC-html40"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>

  <xsl:template match="/">
    <html xmlns="http://www.w3.org/1999/xhtml" lang="en">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Happy Machinery — XML Sitemap Index</title>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin=""/>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&amp;display=swap" rel="stylesheet"/>
        <style>
          :root {
            --bg: #071527;
            --surface: #0c213d;
            --surface-hover: #122d52;
            --card-border: rgba(56, 189, 248, 0.2);
            --primary: #0066ff;
            --primary-glow: rgba(0, 102, 255, 0.4);
            --cyan: #38bdf8;
            --emerald: #10b981;
            --amber: #f59e0b;
            --rose: #f43f5e;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --text-dim: #64748b;
          }

          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          body {
            font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
            background: linear-gradient(180deg, #050d18 0%, #071527 60%, #0a1c33 100%);
            color: var(--text-main);
            min-height: 100vh;
            padding: 32px 20px 80px;
            line-height: 1.5;
            -webkit-font-smoothing: antialiased;
          }

          .container {
            max-width: 1200px;
            margin: 0 auto;
          }

          /* Header Card */
          .header-card {
            background: linear-gradient(135deg, rgba(12, 33, 61, 0.95) 0%, rgba(7, 21, 39, 0.98) 100%);
            border: 1px solid var(--card-border);
            border-radius: 20px;
            padding: 32px;
            margin-bottom: 24px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4), 0 0 30px rgba(0, 102, 255, 0.12);
            position: relative;
            overflow: hidden;
          }

          .header-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #0066ff 0%, #38bdf8 50%, #10b981 100%);
          }

          .brand-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 16px;
            margin-bottom: 20px;
          }

          .brand-title {
            display: flex;
            align-items: center;
            gap: 14px;
          }

          .brand-logo {
            height: 40px;
            width: auto;
            border-radius: 8px;
          }

          .brand-name {
            font-size: 1.45rem;
            font-weight: 800;
            letter-spacing: -0.02em;
            background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .sitemap-tag {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(0, 102, 255, 0.18);
            border: 1px solid rgba(56, 189, 248, 0.35);
            color: #38bdf8;
            padding: 6px 14px;
            border-radius: 999px;
            font-size: 0.8rem;
            font-weight: 700;
            letter-spacing: 0.04em;
            text-transform: uppercase;
          }

          .sitemap-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #10b981;
            box-shadow: 0 0 10px #10b981;
          }

          .header-desc {
            color: var(--text-muted);
            font-size: 0.95rem;
            max-width: 820px;
            margin-bottom: 24px;
          }

          /* KPI Stats Row */
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 14px;
          }

          .stat-pill {
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 14px;
            padding: 14px 18px;
            transition: all 0.2s ease;
          }

          .stat-pill:hover {
            border-color: rgba(56, 189, 248, 0.4);
            background: rgba(0, 102, 255, 0.08);
          }

          .stat-value {
            font-size: 1.5rem;
            font-weight: 800;
            color: #ffffff;
            line-height: 1.1;
            margin-bottom: 4px;
          }

          .stat-label {
            font-size: 0.78rem;
            color: var(--text-dim);
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.04em;
          }

          /* Controls Bar */
          .controls-bar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 14px;
            flex-wrap: wrap;
            margin-bottom: 18px;
          }

          .filter-tabs {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }

          .filter-btn {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            color: var(--text-muted);
            padding: 8px 16px;
            border-radius: 10px;
            font-size: 0.84rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.18s ease;
            font-family: inherit;
          }

          .filter-btn:hover {
            color: #ffffff;
            background: rgba(255, 255, 255, 0.1);
          }

          .filter-btn.active {
            background: #0066ff;
            color: #ffffff;
            border-color: #38bdf8;
            box-shadow: 0 4px 14px rgba(0, 102, 255, 0.4);
          }

          .search-box {
            position: relative;
            flex: 1;
            max-width: 380px;
            min-width: 240px;
          }

          .search-input {
            width: 100%;
            background: rgba(12, 33, 61, 0.85);
            border: 1px solid var(--card-border);
            border-radius: 12px;
            padding: 10px 14px 10px 38px;
            color: #ffffff;
            font-size: 0.88rem;
            outline: none;
            font-family: inherit;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
          }

          .search-input:focus {
            border-color: #38bdf8;
            box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
          }

          .search-icon {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            width: 16px;
            height: 16px;
            fill: none;
            stroke: var(--text-dim);
            stroke-width: 2.2;
            pointer-events: none;
          }

          /* Table Card */
          .table-card {
            background: rgba(12, 33, 61, 0.8);
            border: 1px solid var(--card-border);
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35);
            backdrop-filter: blur(12px);
          }

          table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 0.88rem;
          }

          thead {
            background: rgba(7, 21, 39, 0.95);
            border-bottom: 1px solid var(--card-border);
          }

          th {
            padding: 14px 18px;
            font-size: 0.76rem;
            font-weight: 800;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            color: var(--text-muted);
            white-space: nowrap;
          }

          tbody tr {
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            transition: background 0.15s ease;
          }

          tbody tr:hover {
            background: rgba(0, 102, 255, 0.08);
          }

          tbody tr.is-hidden {
            display: none;
          }

          td {
            padding: 16px 18px;
            vertical-align: middle;
          }

          .url-cell {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .url-img-preview {
            width: 44px;
            height: 44px;
            border-radius: 8px;
            object-fit: cover;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            flex-shrink: 0;
          }

          .url-img-placeholder {
            width: 44px;
            height: 44px;
            border-radius: 8px;
            background: rgba(0, 102, 255, 0.12);
            border: 1px dashed rgba(56, 189, 248, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #38bdf8;
            font-size: 1rem;
            flex-shrink: 0;
          }

          .url-info {
            display: flex;
            flex-direction: column;
            gap: 3px;
            min-width: 0;
          }

          .url-title {
            color: #ffffff;
            font-weight: 700;
            font-size: 0.92rem;
            text-decoration: none;
            line-height: 1.3;
          }

          .url-title:hover {
            color: #38bdf8;
            text-decoration: underline;
          }

          .url-link {
            color: var(--text-dim);
            font-size: 0.78rem;
            text-decoration: none;
            word-break: break-all;
            display: inline-flex;
            align-items: center;
            gap: 4px;
          }

          .url-link:hover {
            color: var(--cyan);
          }

          /* Type Badge */
          .badge-type {
            display: inline-flex;
            align-items: center;
            padding: 4px 10px;
            border-radius: 999px;
            font-size: 0.74rem;
            font-weight: 750;
            letter-spacing: 0.03em;
            text-transform: uppercase;
            white-space: nowrap;
          }

          .badge-blog {
            background: rgba(56, 189, 248, 0.15);
            color: #38bdf8;
            border: 1px solid rgba(56, 189, 248, 0.3);
          }

          .badge-product {
            background: rgba(245, 158, 11, 0.15);
            color: #fbbf24;
            border: 1px solid rgba(245, 158, 11, 0.3);
          }

          .badge-core {
            background: rgba(0, 102, 255, 0.15);
            color: #60a5fa;
            border: 1px solid rgba(0, 102, 255, 0.3);
          }

          /* Priority Chip */
          .priority-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-weight: 750;
            font-size: 0.82rem;
          }

          .priority-bar-wrap {
            width: 48px;
            height: 6px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 999px;
            overflow: hidden;
          }

          .priority-bar-fill {
            height: 100%;
            border-radius: 999px;
            background: linear-gradient(90deg, #0066ff, #38bdf8);
          }

          /* Changefreq Pill */
          .changefreq-pill {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 6px;
            background: rgba(255, 255, 255, 0.05);
            color: var(--text-muted);
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: capitalize;
          }

          .date-cell {
            color: var(--text-muted);
            font-size: 0.82rem;
            white-space: nowrap;
          }

          /* Empty State */
          .no-results {
            padding: 48px 24px;
            text-align: center;
            color: var(--text-dim);
            font-size: 0.95rem;
            display: none;
          }

          .no-results.is-visible {
            display: block;
          }

          /* Footer */
          .sitemap-footer {
            margin-top: 32px;
            text-align: center;
            color: var(--text-dim);
            font-size: 0.8rem;
          }

          .sitemap-footer a {
            color: #38bdf8;
            text-decoration: none;
          }

          .sitemap-footer a:hover {
            text-decoration: underline;
          }

          @media (max-width: 768px) {
            body { padding: 16px 12px 60px; }
            .header-card { padding: 20px; }
            .hide-mobile { display: none; }
            th, td { padding: 12px 10px; }
            .url-cell { gap: 8px; }
            .url-img-preview, .url-img-placeholder { width: 36px; height: 36px; }
            .url-title { font-size: 0.84rem; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header Banner -->
          <header class="header-card">
            <div class="brand-row">
              <div class="brand-title">
                <img src="/images/header-logo.png" alt="Happy Machinery" class="brand-logo"/>
                <div class="brand-name">Happy Machinery</div>
              </div>
              <div class="sitemap-tag">
                <span class="sitemap-dot"></span>
                <span>Google XML Sitemap Protocol 0.9</span>
              </div>
            </div>

            <p class="header-desc">
              Comprehensive XML Index engineered for high-frequency crawling and accelerated indexing by <strong>Googlebot</strong>, <strong>Bingbot</strong>, and major search engine spiders. Includes canonical endpoints, last modified timestamps, media assets, and crawl priorities.
            </p>

            <div class="stats-grid">
              <div class="stat-pill">
                <div class="stat-value" id="count-total">
                  <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/>
                </div>
                <div class="stat-label">Total URLs Indexed</div>
              </div>

              <div class="stat-pill">
                <div class="stat-value" id="count-blogs">
                  <xsl:value-of select="count(sitemap:urlset/sitemap:url[contains(sitemap:loc, '/blog/')])"/>
                </div>
                <div class="stat-label">Blog Articles (Fast Index)</div>
              </div>

              <div class="stat-pill">
                <div class="stat-value" id="count-products">
                  <xsl:value-of select="count(sitemap:urlset/sitemap:url[contains(sitemap:loc, '/product/')])"/>
                </div>
                <div class="stat-label">Machinery Models</div>
              </div>

              <div class="stat-pill">
                <div class="stat-value">100%</div>
                <div class="stat-label">Crawl Priority Optimized</div>
              </div>
            </div>
          </header>

          <!-- Interactive Controls: Filter & Search -->
          <div class="controls-bar">
            <div class="filter-tabs" role="tablist">
              <button type="button" class="filter-btn active" data-filter="all">All Pages</button>
              <button type="button" class="filter-btn" data-filter="blog">Blog Articles</button>
              <button type="button" class="filter-btn" data-filter="product">Equipment Models</button>
              <button type="button" class="filter-btn" data-filter="core">Core Site Pages</button>
            </div>

            <div class="search-box">
              <svg class="search-icon" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" id="sitemap-search" class="search-input" placeholder="Quick search URLs or titles..."/>
            </div>
          </div>

          <!-- Table Container -->
          <div class="table-card">
            <table id="sitemap-table">
              <thead>
                <tr>
                  <th style="width: 50px;">#</th>
                  <th>URL &amp; Page Identity</th>
                  <th style="width: 140px;">Category</th>
                  <th style="width: 130px;" class="hide-mobile">Priority</th>
                  <th style="width: 120px;" class="hide-mobile">Frequency</th>
                  <th style="width: 130px;">Last Modified</th>
                </tr>
              </thead>
              <tbody>
                <xsl:for-each select="sitemap:urlset/sitemap:url">
                  <xsl:variable name="loc" select="sitemap:loc"/>
                  <xsl:variable name="prio" select="sitemap:priority"/>
                  <xsl:variable name="cat">
                    <xsl:choose>
                      <xsl:when test="contains($loc, '/blog/')">blog</xsl:when>
                      <xsl:when test="contains($loc, '/product/')">product</xsl:when>
                      <xsl:otherwise>core</xsl:otherwise>
                    </xsl:choose>
                  </xsl:variable>

                  <tr data-type="{$cat}" data-url="{$loc}" data-title="{image:image/image:title}">
                    <td style="color: var(--text-dim); font-size: 0.8rem; font-weight: 700;">
                      <xsl:value-of select="position()"/>
                    </td>

                    <td>
                      <div class="url-cell">
                        <xsl:choose>
                          <xsl:when test="image:image/image:loc">
                            <img src="{image:image/image:loc}" alt="" class="url-img-preview" loading="lazy" onerror="this.style.display='none'"/>
                          </xsl:when>
                          <xsl:otherwise>
                            <div class="url-img-placeholder">
                              <xsl:choose>
                                <xsl:when test="$cat = 'blog'">📝</xsl:when>
                                <xsl:when test="$cat = 'product'">🚜</xsl:when>
                                <xsl:otherwise>⚡</xsl:otherwise>
                              </xsl:choose>
                            </div>
                          </xsl:otherwise>
                        </xsl:choose>

                        <div class="url-info">
                          <a href="{$loc}" class="url-title" target="_blank" rel="noopener">
                            <xsl:choose>
                              <xsl:when test="image:image/image:title">
                                <xsl:value-of select="image:image/image:title"/>
                              </xsl:when>
                              <xsl:when test="$loc = 'https://happymachinery.com/'">Happy Machinery — Mini Skid Steers &amp; Heavy Equipment</xsl:when>
                              <xsl:when test="$loc = 'https://happymachinery.com/store'">Store — Official TYPHON Catalog &amp; Attachments</xsl:when>
                              <xsl:when test="$loc = 'https://happymachinery.com/blog'">Commercial Machinery &amp; Contractor Resource Blog</xsl:when>
                              <xsl:when test="$loc = 'https://happymachinery.com/about'">About Us — Commercial Heavy Machinery Specialists</xsl:when>
                              <xsl:when test="$loc = 'https://happymachinery.com/contact'">Contact Us — Machinery Sales &amp; Technical Support</xsl:when>
                              <xsl:when test="$loc = 'https://happymachinery.com/faq'">Frequently Asked Questions &amp; Support</xsl:when>
                              <xsl:when test="$loc = 'https://happymachinery.com/terms-of-service'">Terms of Service</xsl:when>
                              <xsl:when test="$loc = 'https://happymachinery.com/privacy-policy'">Privacy Policy</xsl:when>
                              <xsl:otherwise>
                                <xsl:value-of select="$loc"/>
                              </xsl:otherwise>
                            </xsl:choose>
                          </a>
                          <a href="{$loc}" class="url-link" target="_blank" rel="noopener">
                            <xsl:value-of select="$loc"/>
                            <span>↗</span>
                          </a>
                        </div>
                      </div>
                    </td>

                    <td>
                      <xsl:choose>
                        <xsl:when test="$cat = 'blog'">
                          <span class="badge-type badge-blog">Blog Article</span>
                        </xsl:when>
                        <xsl:when test="$cat = 'product'">
                          <span class="badge-type badge-product">Equipment</span>
                        </xsl:when>
                        <xsl:otherwise>
                          <span class="badge-type badge-core">Core Page</span>
                        </xsl:otherwise>
                      </xsl:choose>
                    </td>

                    <td class="hide-mobile">
                      <div class="priority-chip">
                        <div class="priority-bar-wrap">
                          <div class="priority-bar-fill" style="width: {number($prio) * 100}%;"></div>
                        </div>
                        <span><xsl:value-of select="$prio"/></span>
                      </div>
                    </td>

                    <td class="hide-mobile">
                      <span class="changefreq-pill">
                        <xsl:value-of select="sitemap:changefreq"/>
                      </span>
                    </td>

                    <td>
                      <span class="date-cell">
                        <xsl:value-of select="sitemap:lastmod"/>
                      </span>
                    </td>
                  </tr>
                </xsl:for-each>
              </tbody>
            </table>

            <div id="no-results" class="no-results">
              No matching pages found for your query.
            </div>
          </div>

          <!-- Footer Information -->
          <footer class="sitemap-footer">
            <p>
              Generated by <a href="https://happymachinery.com">Happy Machinery Content Management System</a>.
              Verified with <a href="https://search.google.com/search-console" target="_blank" rel="noopener">Google Search Console</a> &amp; Bing Webmaster Tools.
            </p>
          </footer>
        </div>

        <script>
          <![CDATA[
          (function() {
            var searchInput = document.getElementById('sitemap-search');
            var filterButtons = document.querySelectorAll('.filter-btn');
            var rows = document.querySelectorAll('#sitemap-table tbody tr');
            var noResults = document.getElementById('no-results');
            var activeFilter = 'all';

            function applyFilters() {
              var query = (searchInput.value || '').trim().toLowerCase();
              var visibleCount = 0;

              rows.forEach(function(row) {
                var rowType = row.getAttribute('data-type');
                var rowUrl = (row.getAttribute('data-url') || '').toLowerCase();
                var rowTitle = (row.getAttribute('data-title') || '').toLowerCase();

                var matchesFilter = (activeFilter === 'all') || (rowType === activeFilter);
                var matchesSearch = !query || rowUrl.indexOf(query) !== -1 || rowTitle.indexOf(query) !== -1;

                if (matchesFilter && matchesSearch) {
                  row.classList.remove('is-hidden');
                  visibleCount++;
                } else {
                  row.classList.add('is-hidden');
                }
              });

              if (visibleCount === 0) {
                noResults.classList.add('is-visible');
              } else {
                noResults.classList.remove('is-visible');
              }
            }

            if (searchInput) {
              searchInput.addEventListener('input', applyFilters);
            }

            filterButtons.forEach(function(btn) {
              btn.addEventListener('click', function() {
                filterButtons.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                activeFilter = btn.getAttribute('data-filter') || 'all';
                applyFilters();
              });
            });
          })();
          ]]>
        </script>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
