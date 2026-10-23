import React, { useState } from 'react'
import type { HomePageContent } from '../data/homeContent'
import type { MediaItem } from '../pages/adminData'
import './HomePageCmsEditor.css'

interface HomePageCmsEditorProps {
  content: HomePageContent
  onChange: (updated: HomePageContent) => void
  onSave: () => Promise<void>
  onReset: () => void
  isSaving: boolean
  mediaList: MediaItem[]
  showToast: (message: string, type?: 'success' | 'error' | 'warning') => void
}

interface SectionMeta {
  id: keyof Omit<HomePageContent, 'updatedAt'>
  name: string
  icon: string
  badge: string
  desc: string
}

const SECTIONS_LIST: SectionMeta[] = [
  { id: 'hero', name: 'Video Hero Banner', icon: '🎬', badge: 'HERO', desc: 'Main headline, background video, badges & CTA buttons' },
  { id: 'featuresOverview', name: 'Engineering Overview', icon: '⚡', badge: 'PILLARS', desc: '3 core engineering capability cards' },
  { id: 'promo', name: 'Fleet Promo Offer', icon: '🏷️', badge: 'PROMO', desc: 'Discount banner, savings badge & pricing' },
  { id: 'featuredFleet', name: 'Featured Equipment Grid', icon: '🚜', badge: 'FLEET', desc: 'Equipment collection intro header' },
  { id: 'forkShowcase', name: 'Attachment Spotlight', icon: '📦', badge: 'ATTACH', desc: 'Pallet fork specs, highlights & 3 color machines' },
  { id: 'why', name: 'Why Choose & Specs', icon: '🎯', badge: 'SPECS', desc: 'Interactive blueprint diagram & key specs' },
  { id: 'performance', name: 'Field Video Showcase', icon: '🎥', badge: 'VIDEOS', desc: 'Job-site demo videos & features' },
  { id: 'faq', name: 'Frequently Asked Questions', icon: '❓', badge: 'FAQS', desc: 'Accordion questions, answers & support link' },
  { id: 'advantages', name: 'Key Advantages', icon: '🛡️', badge: 'TRUST', desc: 'Core business strengths & guarantees' },
  { id: 'delivery', name: 'Nationwide Delivery', icon: '🚚', badge: 'LOGISTICS', desc: 'Delivery process steps, map/diagram & notes' },
  { id: 'youtube', name: 'YouTube Walkarounds', icon: '📺', badge: 'YOUTUBE', desc: 'Embedded video reviews & walkthroughs' },
  { id: 'feedback', name: 'Customer Testimonials', icon: '💬', badge: 'REVIEWS', desc: 'Verified buyer reviews, ratings & feedback' },
  { id: 'ctaStrip', name: 'Bottom Action Banner', icon: '🚀', badge: 'FOOTER CTA', desc: 'Full-width call to action strip' },
]

export default function HomePageCmsEditor({
  content,
  onChange,
  onSave,
  onReset,
  isSaving,
  mediaList,
  showToast
}: HomePageCmsEditorProps) {
  const [activeSecId, setActiveSecId] = useState<keyof Omit<HomePageContent, 'updatedAt'>>('hero')
  const [searchFilter, setSearchFilter] = useState('')
  const [mediaPickerTarget, setMediaPickerTarget] = useState<string | null>(null)

  const activeMeta = SECTIONS_LIST.find((s) => s.id === activeSecId) || SECTIONS_LIST[0]
  const currentSectionData = content[activeSecId] as any

  const filteredSections = SECTIONS_LIST.filter(
    (s) =>
      s.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.desc.toLowerCase().includes(searchFilter.toLowerCase()) ||
      s.badge.toLowerCase().includes(searchFilter.toLowerCase())
  )

  const totalSections = SECTIONS_LIST.length
  const visibleCount = SECTIONS_LIST.filter((s) => (content[s.id] as any)?.visible !== false).length

  // Quick visibility toggle helper
  const handleToggleVisibility = (secId: keyof Omit<HomePageContent, 'updatedAt'>, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const sec = content[secId] as any
    const updatedSec = { ...sec, visible: sec?.visible === false }
    onChange({
      ...content,
      [secId]: updatedSec
    })
    showToast(`${secId.toUpperCase()} visibility set to ${updatedSec.visible ? 'VISIBLE' : 'HIDDEN'}`, 'success')
  }

  const handleSelectMediaForTarget = (url: string) => {
    if (!mediaPickerTarget) return
    if (mediaPickerTarget === 'hero.videoUrl') {
      onChange({ ...content, hero: { ...content.hero, videoUrl: url } })
    } else if (mediaPickerTarget === 'hero.posterUrl') {
      onChange({ ...content, hero: { ...content.hero, posterUrl: url } })
    } else if (mediaPickerTarget === 'promo.imageUrl') {
      onChange({ ...content, promo: { ...content.promo, imageUrl: url } })
    } else if (mediaPickerTarget === 'forkShowcase.red') {
      onChange({ ...content, forkShowcase: { ...content.forkShowcase, redImageUrl: url } })
    } else if (mediaPickerTarget === 'forkShowcase.yellow') {
      onChange({ ...content, forkShowcase: { ...content.forkShowcase, yellowImageUrl: url } })
    } else if (mediaPickerTarget === 'forkShowcase.blue') {
      onChange({ ...content, forkShowcase: { ...content.forkShowcase, blueImageUrl: url } })
    } else if (mediaPickerTarget === 'why.imageUrl') {
      onChange({ ...content, why: { ...content.why, imageUrl: url } })
    } else if (mediaPickerTarget === 'delivery.imageUrl') {
      onChange({ ...content, delivery: { ...content.delivery, imageUrl: url } })
    }
    setMediaPickerTarget(null)
    showToast('Media selected from library.', 'success')
  }

  return (
    <div className="home-cms-builder">
      {/* Top WordPress-Style Control Bar */}
      <div className="home-cms-topbar">
        <div className="home-cms-topbar-left">
          <div className="home-cms-breadcrumbs">
            <span>LAYOUT & SYSTEM</span>
            <span className="sep">/</span>
            <span>HOME SECTIONS (WORDPRESS CMS)</span>
          </div>
          <div className="home-cms-heading-row">
            <h1 className="home-cms-title">Visual Homepage Builder</h1>
            <span className="home-cms-stat-pill">
              <span className="dot online"></span>
              {visibleCount} of {totalSections} Sections Live
            </span>
          </div>
          <p className="home-cms-subtitle">
            Configure, edit, replace, or reorder all homepage videos, titles, prices, images, and section visibility. All edits sync live to the public website.
          </p>
        </div>

        <div className="home-cms-topbar-actions">
          <button
            type="button"
            className="home-cms-btn home-cms-btn-secondary"
            onClick={onReset}
            title="Reset to factory default homepage template"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Reset Defaults
          </button>

          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="home-cms-btn home-cms-btn-preview"
            title="Open live homepage in a new tab"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            Preview Live Site
          </a>

          <button
            type="button"
            className="home-cms-btn home-cms-btn-primary"
            onClick={onSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="home-cms-spinner"></span>
                Publishing...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Save & Publish
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Two-Column WordPress Layout */}
      <div className="home-cms-workspace">
        {/* Left Column: Sections Navigator */}
        <aside className="home-cms-sidebar">
          <div className="home-cms-sidebar-header">
            <h3>Homepage Sections</h3>
            <span className="home-cms-badge">{totalSections}</span>
          </div>

          <div className="home-cms-search-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Filter sections..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
            {searchFilter && (
              <button
                type="button"
                className="home-cms-clear-search"
                onClick={() => setSearchFilter('')}
              >
                ✕
              </button>
            )}
          </div>

          <nav className="home-cms-nav-list">
            {filteredSections.map((sec, idx) => {
              const secData = content[sec.id] as any
              const isVisible = secData?.visible !== false
              const isActive = sec.id === activeSecId

              return (
                <div
                  key={sec.id}
                  className={`home-cms-nav-item ${isActive ? 'is-active' : ''} ${!isVisible ? 'is-hidden' : ''}`}
                  onClick={() => setActiveSecId(sec.id)}
                >
                  <div className="home-cms-nav-index">{idx + 1}</div>
                  <div className="home-cms-nav-icon">{sec.icon}</div>
                  <div className="home-cms-nav-info">
                    <div className="home-cms-nav-title-row">
                      <strong className="home-cms-nav-title">{sec.name}</strong>
                    </div>
                    <span className="home-cms-nav-desc">{sec.desc}</span>
                  </div>

                  <button
                    type="button"
                    className={`home-cms-quick-visibility ${isVisible ? 'visible' : 'hidden'}`}
                    title={isVisible ? 'Click to hide section on public website' : 'Click to show section on public website'}
                    onClick={(e) => handleToggleVisibility(sec.id, e)}
                  >
                    {isVisible ? (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    )}
                  </button>
                </div>
              )
            })}
          </nav>
        </aside>

        {/* Right Column: Live Section Visual Editor */}
        <main className="home-cms-editor-pane">
          {/* Section Header Card */}
          <div className="home-cms-card home-cms-section-meta-card">
            <div className="home-cms-section-meta-left">
              <span className="home-cms-section-hero-icon">{activeMeta.icon}</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h2 className="home-cms-section-heading">{activeMeta.name}</h2>
                  <span className="home-cms-chip">{activeMeta.badge}</span>
                </div>
                <p className="home-cms-section-lead">{activeMeta.desc}</p>
              </div>
            </div>

            {/* Master Visibility Switch */}
            <div className="home-cms-visibility-box">
              <label className="home-cms-switch-label">
                <span className="home-cms-switch-text">
                  Status: <strong>{currentSectionData?.visible !== false ? 'Live on Site' : 'Hidden from Site'}</strong>
                </span>
                <div
                  className={`home-cms-toggle-switch ${currentSectionData?.visible !== false ? 'active' : ''}`}
                  onClick={() => handleToggleVisibility(activeSecId)}
                >
                  <div className="home-cms-toggle-knob" />
                </div>
              </label>
            </div>
          </div>

          {/* Section Hidden Alert Banner if Hidden */}
          {currentSectionData?.visible === false && (
            <div className="home-cms-alert-banner">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <strong>Section is currently hidden.</strong> Visitors to the homepage will not see this section until you toggle visibility back on.
              </div>
            </div>
          )}

          {/* SECTION-SPECIFIC CUSTOMIZER FORMS */}

          {/* 1. HERO BANNER */}
          {activeSecId === 'hero' && (
            <div className="home-cms-card">
              <h3 className="home-cms-card-title">🎬 Video Banner & Hero Headline</h3>

              <div className="home-cms-grid-2">
                <div className="home-cms-field">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ margin: 0 }}>Background Video URL (mp4 / m4v / webm)</label>
                    <button
                      type="button"
                      className="home-cms-btn-mini"
                      onClick={() => setMediaPickerTarget('hero.videoUrl')}
                    >
                      📁 Library
                    </button>
                  </div>
                  <input
                    type="text"
                    value={content.hero.videoUrl || ''}
                    placeholder="/images/home-hero-optimized.m4v or https://..."
                    onChange={(e) =>
                      onChange({
                        ...content,
                        hero: { ...content.hero, videoUrl: e.target.value }
                      })
                    }
                  />
                  <span className="home-cms-hint">MP4 or M4V video file playing silently in loop behind the hero.</span>
                </div>

                <div className="home-cms-field">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ margin: 0 }}>Video Poster Image URL (Fallback)</label>
                    <button
                      type="button"
                      className="home-cms-btn-mini"
                      onClick={() => setMediaPickerTarget('hero.posterUrl')}
                    >
                      📁 Library
                    </button>
                  </div>
                  <input
                    type="text"
                    value={content.hero.posterUrl || ''}
                    placeholder="/images/hero-v900-three-colors.png"
                    onChange={(e) =>
                      onChange({
                        ...content,
                        hero: { ...content.hero, posterUrl: e.target.value }
                      })
                    }
                  />
                  <span className="home-cms-hint">Displayed while video is buffering or on mobile low-power mode.</span>
                </div>
              </div>

              {/* Live Video Preview Frame */}
              <div className="home-cms-preview-frame">
                <div className="home-cms-preview-header">
                  <span>🎥 Live Hero Video & Poster Preview</span>
                </div>
                <div className="home-cms-video-container">
                  {content.hero.videoUrl ? (
                    <video
                      key={content.hero.videoUrl}
                      src={content.hero.videoUrl}
                      poster={content.hero.posterUrl}
                      muted
                      autoPlay
                      loop
                      playsInline
                      controls
                      className="home-cms-live-video"
                    />
                  ) : (
                    <div className="home-cms-no-media">No video URL specified</div>
                  )}
                </div>
              </div>

              <div className="home-cms-divider" />

              <h4 className="home-cms-subheading">Headlines & Copy</h4>

              <div className="home-cms-field">
                <label>Eyebrow Tagline</label>
                <input
                  type="text"
                  value={content.hero.eyebrow || ''}
                  placeholder="Professional Grade Equipment"
                  onChange={(e) =>
                    onChange({
                      ...content,
                      hero: { ...content.hero, eyebrow: e.target.value }
                    })
                  }
                />
              </div>

              <div className="home-cms-grid-3">
                <div className="home-cms-field">
                  <label>Title Part 1 (Red Color)</label>
                  <input
                    type="text"
                    value={content.hero.titleRed || ''}
                    placeholder="Skid Steer"
                    onChange={(e) =>
                      onChange({
                        ...content,
                        hero: { ...content.hero, titleRed: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="home-cms-field">
                  <label>Title Part 2 (Yellow Color)</label>
                  <input
                    type="text"
                    value={content.hero.titleYellow || ''}
                    placeholder="V900"
                    onChange={(e) =>
                      onChange({
                        ...content,
                        hero: { ...content.hero, titleYellow: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="home-cms-field">
                  <label>Title Part 3 (Blue Color)</label>
                  <input
                    type="text"
                    value={content.hero.titleBlue || ''}
                    placeholder="by TYPHON"
                    onChange={(e) =>
                      onChange({
                        ...content,
                        hero: { ...content.hero, titleBlue: e.target.value }
                      })
                    }
                  />
                </div>
              </div>

              {/* Title Live Visual Preview Box */}
              <div className="home-cms-title-live-preview">
                <div className="home-cms-preview-label">Live Styled Title Preview:</div>
                <h1 className="home-hero-preview-heading">
                  <span className="red">{content.hero.titleRed} </span>
                  <span className="yellow">{content.hero.titleYellow} </span>
                  <span className="blue">{content.hero.titleBlue}</span>
                </h1>
              </div>

              <div className="home-cms-field">
                <label>Hero Description Paragraph</label>
                <textarea
                  rows={3}
                  value={content.hero.description || ''}
                  placeholder="Discover the skid steer V900 from Happy Machinery..."
                  onChange={(e) =>
                    onChange({
                      ...content,
                      hero: { ...content.hero, description: e.target.value }
                    })
                  }
                />
              </div>

              <div className="home-cms-divider" />

              <h4 className="home-cms-subheading">Call to Action Buttons</h4>
              <div className="home-cms-grid-2">
                <div className="home-cms-field">
                  <label>Primary Button Text</label>
                  <input
                    type="text"
                    value={content.hero.primaryBtnText || ''}
                    onChange={(e) =>
                      onChange({
                        ...content,
                        hero: { ...content.hero, primaryBtnText: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="home-cms-field">
                  <label>Primary Button URL</label>
                  <input
                    type="text"
                    value={content.hero.primaryBtnUrl || ''}
                    placeholder="#featured-fleet or /contact"
                    onChange={(e) =>
                      onChange({
                        ...content,
                        hero: { ...content.hero, primaryBtnUrl: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="home-cms-field">
                  <label>Secondary Button Text</label>
                  <input
                    type="text"
                    value={content.hero.secondaryBtnText || ''}
                    onChange={(e) =>
                      onChange({
                        ...content,
                        hero: { ...content.hero, secondaryBtnText: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="home-cms-field">
                  <label>Secondary Button URL</label>
                  <input
                    type="text"
                    value={content.hero.secondaryBtnUrl || ''}
                    placeholder="/contact"
                    onChange={(e) =>
                      onChange({
                        ...content,
                        hero: { ...content.hero, secondaryBtnUrl: e.target.value }
                      })
                    }
                  />
                </div>
              </div>

              <div className="home-cms-divider" />

              <div className="home-cms-repeater-header">
                <h4 className="home-cms-subheading" style={{ margin: 0 }}>Hero Key Highlights (Badges)</h4>
                <button
                  type="button"
                  className="home-cms-btn-mini"
                  onClick={() => {
                    const updated = [...(content.hero.highlights || []), { tag: 'New Spec', label: 'Feature' }]
                    onChange({ ...content, hero: { ...content.hero, highlights: updated } })
                  }}
                >
                  + Add Highlight
                </button>
              </div>

              <div className="home-cms-repeater-list">
                {(content.hero.highlights || []).map((hl, idx) => (
                  <div key={idx} className="home-cms-repeater-card">
                    <div className="home-cms-grid-2">
                      <div className="home-cms-field">
                        <label>Tag (Top Bold)</label>
                        <input
                          type="text"
                          value={hl.tag}
                          onChange={(e) => {
                            const updated = [...content.hero.highlights]
                            updated[idx].tag = e.target.value
                            onChange({ ...content, hero: { ...content.hero, highlights: updated } })
                          }}
                        />
                      </div>
                      <div className="home-cms-field">
                        <label>Label (Bottom Subtext)</label>
                        <input
                          type="text"
                          value={hl.label}
                          onChange={(e) => {
                            const updated = [...content.hero.highlights]
                            updated[idx].label = e.target.value
                            onChange({ ...content, hero: { ...content.hero, highlights: updated } })
                          }}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="home-cms-btn-danger-mini"
                      onClick={() => {
                        const updated = content.hero.highlights.filter((_, i) => i !== idx)
                        onChange({ ...content, hero: { ...content.hero, highlights: updated } })
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. ENGINEERING FEATURES OVERVIEW */}
          {activeSecId === 'featuresOverview' && (
            <div className="home-cms-card">
              <h3 className="home-cms-card-title">⚡ Engineering 3-Pillar Capability Section</h3>

              <div className="home-cms-field">
                <label>Section Eyebrow</label>
                <input
                  type="text"
                  value={content.featuresOverview.eyebrow}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      featuresOverview: { ...content.featuresOverview, eyebrow: e.target.value }
                    })
                  }
                />
              </div>

              <div className="home-cms-field">
                <label>Section Title</label>
                <input
                  type="text"
                  value={content.featuresOverview.title}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      featuresOverview: { ...content.featuresOverview, title: e.target.value }
                    })
                  }
                />
              </div>

              <div className="home-cms-field">
                <label>Section Subtitle</label>
                <textarea
                  rows={2}
                  value={content.featuresOverview.subtitle}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      featuresOverview: { ...content.featuresOverview, subtitle: e.target.value }
                    })
                  }
                />
              </div>

              <div className="home-cms-divider" />

              <h4 className="home-cms-subheading">3 Engineering Feature Cards</h4>
              <div className="home-cms-repeater-list">
                {(content.featuresOverview.features || []).map((feat, idx) => (
                  <div key={idx} className="home-cms-repeater-card">
                    <span className="home-cms-pill">Feature Card #{idx + 1}</span>
                    <div className="home-cms-field">
                      <label>Kicker / Badge</label>
                      <input
                        type="text"
                        value={feat.kicker}
                        onChange={(e) => {
                          const updated = [...content.featuresOverview.features]
                          updated[idx].kicker = e.target.value
                          onChange({ ...content, featuresOverview: { ...content.featuresOverview, features: updated } })
                        }}
                      />
                    </div>
                    <div className="home-cms-field">
                      <label>Card Title</label>
                      <input
                        type="text"
                        value={feat.title}
                        onChange={(e) => {
                          const updated = [...content.featuresOverview.features]
                          updated[idx].title = e.target.value
                          onChange({ ...content, featuresOverview: { ...content.featuresOverview, features: updated } })
                        }}
                      />
                    </div>
                    <div className="home-cms-field">
                      <label>Description Text</label>
                      <textarea
                        rows={2}
                        value={feat.text}
                        onChange={(e) => {
                          const updated = [...content.featuresOverview.features]
                          updated[idx].text = e.target.value
                          onChange({ ...content, featuresOverview: { ...content.featuresOverview, features: updated } })
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. PROMO OFFER BANNER */}
          {activeSecId === 'promo' && (
            <div className="home-cms-card">
              <h3 className="home-cms-card-title">🏷️ Limited-Time Fleet Promo Offer Banner</h3>

              <div className="home-cms-grid-2">
                <div className="home-cms-field">
                  <label>Kicker Text</label>
                  <input
                    type="text"
                    value={content.promo.kicker}
                    onChange={(e) =>
                      onChange({
                        ...content,
                        promo: { ...content.promo, kicker: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="home-cms-field">
                  <label>Discount Badge Text</label>
                  <input
                    type="text"
                    value={content.promo.discountBadgeText}
                    placeholder="Save 23%"
                    onChange={(e) =>
                      onChange({
                        ...content,
                        promo: { ...content.promo, discountBadgeText: e.target.value }
                      })
                    }
                  />
                </div>
              </div>

              <div className="home-cms-grid-2">
                <div className="home-cms-field">
                  <label>Title Prefix</label>
                  <input
                    type="text"
                    value={content.promo.title}
                    placeholder="Save 23% on the"
                    onChange={(e) =>
                      onChange({
                        ...content,
                        promo: { ...content.promo, title: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="home-cms-field">
                  <label>Title Highlight Word</label>
                  <input
                    type="text"
                    value={content.promo.titleHighlight}
                    placeholder="V900 Fleet"
                    onChange={(e) =>
                      onChange({
                        ...content,
                        promo: { ...content.promo, titleHighlight: e.target.value }
                      })
                    }
                  />
                </div>
              </div>

              <div className="home-cms-grid-2">
                <div className="home-cms-field">
                  <label>Now Price</label>
                  <input
                    type="text"
                    value={content.promo.nowPriceText}
                    placeholder="$11,999"
                    onChange={(e) =>
                      onChange({
                        ...content,
                        promo: { ...content.promo, nowPriceText: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="home-cms-field">
                  <label>Original Price</label>
                  <input
                    type="text"
                    value={content.promo.originalPriceText}
                    placeholder="$15,500"
                    onChange={(e) =>
                      onChange({
                        ...content,
                        promo: { ...content.promo, originalPriceText: e.target.value }
                      })
                    }
                  />
                </div>
              </div>

              <div className="home-cms-grid-2">
                <div className="home-cms-field">
                  <label>CTA Button Text</label>
                  <input
                    type="text"
                    value={content.promo.buttonText}
                    onChange={(e) =>
                      onChange({
                        ...content,
                        promo: { ...content.promo, buttonText: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="home-cms-field">
                  <label>CTA Button URL</label>
                  <input
                    type="text"
                    value={content.promo.buttonUrl}
                    placeholder="#featured-fleet"
                    onChange={(e) =>
                      onChange({
                        ...content,
                        promo: { ...content.promo, buttonUrl: e.target.value }
                      })
                    }
                  />
                </div>
              </div>

              <div className="home-cms-divider" />

              <div className="home-cms-field">
                <label>Promo Equipment Image URL</label>
                <input
                  type="text"
                  value={content.promo.imageUrl}
                  placeholder="/images/hero-v900-three-colors.png"
                  onChange={(e) =>
                    onChange({
                      ...content,
                      promo: { ...content.promo, imageUrl: e.target.value }
                    })
                  }
                />
              </div>

              <div className="home-cms-field">
                <label>Machine Color Option Label</label>
                <input
                  type="text"
                  value={content.promo.colorLabel}
                  placeholder="Red, Yellow, or Blue - same price"
                  onChange={(e) =>
                    onChange({
                      ...content,
                      promo: { ...content.promo, colorLabel: e.target.value }
                    })
                  }
                />
              </div>

              {content.promo.imageUrl && (
                <div className="home-cms-image-preview-box">
                  <img src={content.promo.imageUrl} alt="Promo Equipment" />
                </div>
              )}
            </div>
          )}

          {/* 4. FEATURED FLEET HEADER */}
          {activeSecId === 'featuredFleet' && (
            <div className="home-cms-card">
              <h3 className="home-cms-card-title">🚜 Featured Fleet Equipment Section Header</h3>
              <p className="home-cms-hint">
                The product cards in this section are dynamically loaded from your <strong>Products</strong> catalog. Here you can customize the section's intro header and marketing copy.
              </p>

              <div className="home-cms-field">
                <label>Section Eyebrow</label>
                <input
                  type="text"
                  value={content.featuredFleet.eyebrow}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      featuredFleet: { ...content.featuredFleet, eyebrow: e.target.value }
                    })
                  }
                />
              </div>

              <div className="home-cms-field">
                <label>Section Title</label>
                <input
                  type="text"
                  value={content.featuredFleet.title}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      featuredFleet: { ...content.featuredFleet, title: e.target.value }
                    })
                  }
                />
              </div>

              <div className="home-cms-field">
                <label>Section Description</label>
                <textarea
                  rows={3}
                  value={content.featuredFleet.description}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      featuredFleet: { ...content.featuredFleet, description: e.target.value }
                    })
                  }
                />
              </div>
            </div>
          )}

          {/* 5. ATTACHMENT SPOTLIGHT */}
          {activeSecId === 'forkShowcase' && (
            <div className="home-cms-card">
              <h3 className="home-cms-card-title">📦 Pallet Fork Attachment Spotlight & 3-Color Machine Showcase</h3>

              <div className="home-cms-grid-2">
                <div className="home-cms-field">
                  <label>Eyebrow</label>
                  <input
                    type="text"
                    value={content.forkShowcase.eyebrow}
                    onChange={(e) =>
                      onChange({
                        ...content,
                        forkShowcase: { ...content.forkShowcase, eyebrow: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="home-cms-field">
                  <label>Title</label>
                  <input
                    type="text"
                    value={content.forkShowcase.title}
                    onChange={(e) =>
                      onChange({
                        ...content,
                        forkShowcase: { ...content.forkShowcase, title: e.target.value }
                      })
                    }
                  />
                </div>
              </div>

              <div className="home-cms-grid-2">
                <div className="home-cms-field">
                  <label>Package Price Display</label>
                  <input
                    type="text"
                    value={content.forkShowcase.price}
                    placeholder="$1,299 or Includes Attachment"
                    onChange={(e) =>
                      onChange({
                        ...content,
                        forkShowcase: { ...content.forkShowcase, price: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="home-cms-field">
                  <label>Button Text</label>
                  <input
                    type="text"
                    value={content.forkShowcase.btnText}
                    onChange={(e) =>
                      onChange({
                        ...content,
                        forkShowcase: { ...content.forkShowcase, btnText: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="home-cms-field">
                  <label>Button URL</label>
                  <input
                    type="text"
                    value={content.forkShowcase.btnUrl || ''}
                    placeholder="/contact"
                    onChange={(e) =>
                      onChange({
                        ...content,
                        forkShowcase: { ...content.forkShowcase, btnUrl: e.target.value }
                      })
                    }
                  />
                </div>
              </div>

              <div className="home-cms-field">
                <label>Intro Paragraph</label>
                <textarea
                  rows={2}
                  value={content.forkShowcase.intro}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      forkShowcase: { ...content.forkShowcase, intro: e.target.value }
                    })
                  }
                />
              </div>

              <div className="home-cms-divider" />

              <h4 className="home-cms-subheading">3 Color Machine Images (Color Switcher on Public Site)</h4>
              <div className="home-cms-grid-3">
                <div className="home-cms-field">
                  <label>🔴 Red Machine Image URL</label>
                  <input
                    type="text"
                    value={content.forkShowcase.redImageUrl}
                    onChange={(e) =>
                      onChange({
                        ...content,
                        forkShowcase: { ...content.forkShowcase, redImageUrl: e.target.value }
                      })
                    }
                  />
                  {content.forkShowcase.redImageUrl && (
                    <div className="home-cms-mini-thumb">
                      <img src={content.forkShowcase.redImageUrl} alt="Red Machine" />
                    </div>
                  )}
                </div>

                <div className="home-cms-field">
                  <label>🟡 Yellow Machine Image URL</label>
                  <input
                    type="text"
                    value={content.forkShowcase.yellowImageUrl}
                    onChange={(e) =>
                      onChange({
                        ...content,
                        forkShowcase: { ...content.forkShowcase, yellowImageUrl: e.target.value }
                      })
                    }
                  />
                  {content.forkShowcase.yellowImageUrl && (
                    <div className="home-cms-mini-thumb">
                      <img src={content.forkShowcase.yellowImageUrl} alt="Yellow Machine" />
                    </div>
                  )}
                </div>

                <div className="home-cms-field">
                  <label>🔵 Blue Machine Image URL</label>
                  <input
                    type="text"
                    value={content.forkShowcase.blueImageUrl}
                    onChange={(e) =>
                      onChange({
                        ...content,
                        forkShowcase: { ...content.forkShowcase, blueImageUrl: e.target.value }
                      })
                    }
                  />
                  {content.forkShowcase.blueImageUrl && (
                    <div className="home-cms-mini-thumb">
                      <img src={content.forkShowcase.blueImageUrl} alt="Blue Machine" />
                    </div>
                  )}
                </div>
              </div>

              <div className="home-cms-divider" />

              <div className="home-cms-repeater-header">
                <h4 className="home-cms-subheading" style={{ margin: 0 }}>Quick Specifications</h4>
                <button
                  type="button"
                  className="home-cms-btn-mini"
                  onClick={() => {
                    const updated = [...(content.forkShowcase.quickSpecs || []), { label: 'Spec Name', value: 'Value' }]
                    onChange({ ...content, forkShowcase: { ...content.forkShowcase, quickSpecs: updated } })
                  }}
                >
                  + Add Spec
                </button>
              </div>

              <div className="home-cms-repeater-list">
                {(content.forkShowcase.quickSpecs || []).map((sp, idx) => (
                  <div key={idx} className="home-cms-repeater-card home-cms-inline-repeater">
                    <input
                      type="text"
                      placeholder="Label (e.g. Tine Length)"
                      value={sp.label}
                      onChange={(e) => {
                        const updated = [...content.forkShowcase.quickSpecs]
                        updated[idx].label = e.target.value
                        onChange({ ...content, forkShowcase: { ...content.forkShowcase, quickSpecs: updated } })
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. 42 in / 1070 mm)"
                      value={sp.value}
                      onChange={(e) => {
                        const updated = [...content.forkShowcase.quickSpecs]
                        updated[idx].value = e.target.value
                        onChange({ ...content, forkShowcase: { ...content.forkShowcase, quickSpecs: updated } })
                      }}
                    />
                    <button
                      type="button"
                      className="home-cms-btn-danger-mini"
                      onClick={() => {
                        const updated = content.forkShowcase.quickSpecs.filter((_, i) => i !== idx)
                        onChange({ ...content, forkShowcase: { ...content.forkShowcase, quickSpecs: updated } })
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. WHY CHOOSE & SPECS */}
          {activeSecId === 'why' && (
            <div className="home-cms-card">
              <h3 className="home-cms-card-title">🎯 Why Choose Advantage & Blueprint Diagram Specs</h3>

              <div className="home-cms-field">
                <label>Eyebrow</label>
                <input
                  type="text"
                  value={content.why.eyebrow}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      why: { ...content.why, eyebrow: e.target.value }
                    })
                  }
                />
              </div>

              <div className="home-cms-field">
                <label>Title</label>
                <input
                  type="text"
                  value={content.why.title}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      why: { ...content.why, title: e.target.value }
                    })
                  }
                />
              </div>

              <div className="home-cms-field">
                <label>Description</label>
                <textarea
                  rows={2}
                  value={content.why.description}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      why: { ...content.why, description: e.target.value }
                    })
                  }
                />
              </div>

              <div className="home-cms-field">
                <label>Machine Blueprint Diagram Image URL</label>
                <input
                  type="text"
                  value={content.why.imageUrl}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      why: { ...content.why, imageUrl: e.target.value }
                    })
                  }
                />
                {content.why.imageUrl && (
                  <div className="home-cms-image-preview-box">
                    <img src={content.why.imageUrl} alt="Machine Blueprint" />
                  </div>
                )}
              </div>

              <div className="home-cms-divider" />

              <div className="home-cms-repeater-header">
                <h4 className="home-cms-subheading" style={{ margin: 0 }}>Interactive Blueprint Hotspots & Specs</h4>
                <button
                  type="button"
                  className="home-cms-btn-mini"
                  onClick={() => {
                    const updated = [
                      ...(content.why.specs || []),
                      { stat: '1,400', unit: 'kg', title: 'New Spec', desc: 'Specification description', x: '50%', y: '50%', label: 'Pin Label' }
                    ]
                    onChange({ ...content, why: { ...content.why, specs: updated } })
                  }}
                >
                  + Add Spec Pin
                </button>
              </div>

              <div className="home-cms-repeater-list">
                {(content.why.specs || []).map((sp, idx) => (
                  <div key={idx} className="home-cms-repeater-card">
                    <div className="home-cms-grid-2">
                      <div className="home-cms-field">
                        <label>Stat Number</label>
                        <input
                          type="text"
                          value={sp.stat}
                          onChange={(e) => {
                            const updated = [...content.why.specs]
                            updated[idx].stat = e.target.value
                            onChange({ ...content, why: { ...content.why, specs: updated } })
                          }}
                        />
                      </div>
                      <div className="home-cms-field">
                        <label>Unit</label>
                        <input
                          type="text"
                          value={sp.unit}
                          placeholder="kg, mm, hp, %"
                          onChange={(e) => {
                            const updated = [...content.why.specs]
                            updated[idx].unit = e.target.value
                            onChange({ ...content, why: { ...content.why, specs: updated } })
                          }}
                        />
                      </div>
                    </div>

                    <div className="home-cms-grid-2">
                      <div className="home-cms-field">
                        <label>Spec Title</label>
                        <input
                          type="text"
                          value={sp.title}
                          onChange={(e) => {
                            const updated = [...content.why.specs]
                            updated[idx].title = e.target.value
                            onChange({ ...content, why: { ...content.why, specs: updated } })
                          }}
                        />
                      </div>
                      <div className="home-cms-field">
                        <label>Pin Label on Diagram</label>
                        <input
                          type="text"
                          value={sp.label}
                          onChange={(e) => {
                            const updated = [...content.why.specs]
                            updated[idx].label = e.target.value
                            onChange({ ...content, why: { ...content.why, specs: updated } })
                          }}
                        />
                      </div>
                    </div>

                    <div className="home-cms-field">
                      <label>Description</label>
                      <textarea
                        rows={2}
                        value={sp.desc}
                        onChange={(e) => {
                          const updated = [...content.why.specs]
                          updated[idx].desc = e.target.value
                          onChange({ ...content, why: { ...content.why, specs: updated } })
                        }}
                      />
                    </div>

                    <div className="home-cms-grid-2">
                      <div className="home-cms-field">
                        <label>Pin X Position (%)</label>
                        <input
                          type="text"
                          value={sp.x}
                          placeholder="38%"
                          onChange={(e) => {
                            const updated = [...content.why.specs]
                            updated[idx].x = e.target.value
                            onChange({ ...content, why: { ...content.why, specs: updated } })
                          }}
                        />
                      </div>
                      <div className="home-cms-field">
                        <label>Pin Y Position (%)</label>
                        <input
                          type="text"
                          value={sp.y}
                          placeholder="42%"
                          onChange={(e) => {
                            const updated = [...content.why.specs]
                            updated[idx].y = e.target.value
                            onChange({ ...content, why: { ...content.why, specs: updated } })
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className="home-cms-btn-danger-mini"
                      onClick={() => {
                        const updated = content.why.specs.filter((_, i) => i !== idx)
                        onChange({ ...content, why: { ...content.why, specs: updated } })
                      }}
                    >
                      Delete Spec Pin
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. PERFORMANCE FIELD VIDEOS */}
          {activeSecId === 'performance' && (
            <div className="home-cms-card">
              <h3 className="home-cms-card-title">🎥 Performance Field Video Showcase</h3>

              <div className="home-cms-grid-2">
                <div className="home-cms-field">
                  <label>Eyebrow</label>
                  <input
                    type="text"
                    value={content.performance.eyebrow}
                    onChange={(e) =>
                      onChange({
                        ...content,
                        performance: { ...content.performance, eyebrow: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="home-cms-field">
                  <label>Title</label>
                  <input
                    type="text"
                    value={content.performance.title}
                    onChange={(e) =>
                      onChange({
                        ...content,
                        performance: { ...content.performance, title: e.target.value }
                      })
                    }
                  />
                </div>
              </div>

              <div className="home-cms-field">
                <label>Lead Paragraph</label>
                <textarea
                  rows={2}
                  value={content.performance.lead}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      performance: { ...content.performance, lead: e.target.value }
                    })
                  }
                />
              </div>

              <div className="home-cms-grid-2">
                <div className="home-cms-field">
                  <label>CTA Button Text</label>
                  <input
                    type="text"
                    value={content.performance.ctaText}
                    onChange={(e) =>
                      onChange({
                        ...content,
                        performance: { ...content.performance, ctaText: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="home-cms-field">
                  <label>CTA Button URL</label>
                  <input
                    type="text"
                    value={content.performance.ctaUrl}
                    onChange={(e) =>
                      onChange({
                        ...content,
                        performance: { ...content.performance, ctaUrl: e.target.value }
                      })
                    }
                  />
                </div>
              </div>

              <div className="home-cms-divider" />

              <div className="home-cms-repeater-header">
                <h4 className="home-cms-subheading" style={{ margin: 0 }}>Field Performance Video Items</h4>
                <button
                  type="button"
                  className="home-cms-btn-mini"
                  onClick={() => {
                    const updated = [
                      ...(content.performance.videos || []),
                      {
                        src: '/images/home-hero-optimized.m4v',
                        poster: '/images/hero-v900-three-colors.png',
                        number: '04',
                        tag: 'NEW FEATURE',
                        title: 'Video Title',
                        text: 'Demonstration summary'
                      }
                    ]
                    onChange({ ...content, performance: { ...content.performance, videos: updated } })
                  }}
                >
                  + Add Video Item
                </button>
              </div>

              <div className="home-cms-repeater-list">
                {(content.performance.videos || []).map((vid, idx) => (
                  <div key={idx} className="home-cms-repeater-card">
                    <span className="home-cms-pill">Field Video #{vid.number || idx + 1}</span>

                    <div className="home-cms-grid-2">
                      <div className="home-cms-field">
                        <label>Video File URL (MP4 / M4V)</label>
                        <input
                          type="text"
                          value={vid.src}
                          onChange={(e) => {
                            const updated = [...content.performance.videos]
                            updated[idx].src = e.target.value
                            onChange({ ...content, performance: { ...content.performance, videos: updated } })
                          }}
                        />
                      </div>
                      <div className="home-cms-field">
                        <label>Poster Thumbnail Image URL</label>
                        <input
                          type="text"
                          value={vid.poster}
                          onChange={(e) => {
                            const updated = [...content.performance.videos]
                            updated[idx].poster = e.target.value
                            onChange({ ...content, performance: { ...content.performance, videos: updated } })
                          }}
                        />
                      </div>
                    </div>

                    <div className="home-cms-grid-3">
                      <div className="home-cms-field">
                        <label>Step Number</label>
                        <input
                          type="text"
                          value={vid.number}
                          placeholder="01, 02, etc."
                          onChange={(e) => {
                            const updated = [...content.performance.videos]
                            updated[idx].number = e.target.value
                            onChange({ ...content, performance: { ...content.performance, videos: updated } })
                          }}
                        />
                      </div>
                      <div className="home-cms-field">
                        <label>Badge Tag</label>
                        <input
                          type="text"
                          value={vid.tag}
                          placeholder="4,000 LBS CAPACITY"
                          onChange={(e) => {
                            const updated = [...content.performance.videos]
                            updated[idx].tag = e.target.value
                            onChange({ ...content, performance: { ...content.performance, videos: updated } })
                          }}
                        />
                      </div>
                      <div className="home-cms-field">
                        <label>Video Title</label>
                        <input
                          type="text"
                          value={vid.title}
                          onChange={(e) => {
                            const updated = [...content.performance.videos]
                            updated[idx].title = e.target.value
                            onChange({ ...content, performance: { ...content.performance, videos: updated } })
                          }}
                        />
                      </div>
                    </div>

                    <div className="home-cms-field">
                      <label>Video Description</label>
                      <textarea
                        rows={2}
                        value={vid.text}
                        onChange={(e) => {
                          const updated = [...content.performance.videos]
                          updated[idx].text = e.target.value
                          onChange({ ...content, performance: { ...content.performance, videos: updated } })
                        }}
                      />
                    </div>

                    {vid.src && (
                      <div className="home-cms-video-container" style={{ maxHeight: '180px', marginTop: '10px' }}>
                        <video src={vid.src} poster={vid.poster} controls playsInline style={{ maxHeight: '180px' }} />
                      </div>
                    )}

                    <button
                      type="button"
                      className="home-cms-btn-danger-mini"
                      onClick={() => {
                        const updated = content.performance.videos.filter((_, i) => i !== idx)
                        onChange({ ...content, performance: { ...content.performance, videos: updated } })
                      }}
                    >
                      Delete Video
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. FAQ ACCORDION */}
          {activeSecId === 'faq' && (
            <div className="home-cms-card">
              <h3 className="home-cms-card-title">❓ Frequently Asked Questions (FAQ) Accordion</h3>

              <div className="home-cms-grid-2">
                <div className="home-cms-field">
                  <label>Eyebrow</label>
                  <input
                    type="text"
                    value={content.faq.eyebrow}
                    onChange={(e) =>
                      onChange({
                        ...content,
                        faq: { ...content.faq, eyebrow: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="home-cms-field">
                  <label>Title</label>
                  <input
                    type="text"
                    value={content.faq.title}
                    onChange={(e) =>
                      onChange({
                        ...content,
                        faq: { ...content.faq, title: e.target.value }
                      })
                    }
                  />
                </div>
              </div>

              <div className="home-cms-field">
                <label>Description</label>
                <textarea
                  rows={2}
                  value={content.faq.description}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      faq: { ...content.faq, description: e.target.value }
                    })
                  }
                />
              </div>

              <div className="home-cms-grid-3">
                <div className="home-cms-field">
                  <label>Contact Prompt Text</label>
                  <input
                    type="text"
                    value={content.faq.contactPromptText}
                    placeholder="Still have questions? Reach out anytime."
                    onChange={(e) =>
                      onChange({
                        ...content,
                        faq: { ...content.faq, contactPromptText: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="home-cms-field">
                  <label>Contact Link Text</label>
                  <input
                    type="text"
                    value={content.faq.contactLinkText}
                    placeholder="Talk to a machinery specialist"
                    onChange={(e) =>
                      onChange({
                        ...content,
                        faq: { ...content.faq, contactLinkText: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="home-cms-field">
                  <label>Contact Link URL</label>
                  <input
                    type="text"
                    value={content.faq.contactLinkUrl}
                    placeholder="/contact"
                    onChange={(e) =>
                      onChange({
                        ...content,
                        faq: { ...content.faq, contactLinkUrl: e.target.value }
                      })
                    }
                  />
                </div>
              </div>

              <div className="home-cms-divider" />

              <div className="home-cms-repeater-header">
                <h4 className="home-cms-subheading" style={{ margin: 0 }}>Questions & Answers ({content.faq.faqs?.length || 0})</h4>
                <button
                  type="button"
                  className="home-cms-btn-mini"
                  onClick={() => {
                    const updated = [
                      ...(content.faq.faqs || []),
                      { question: 'New Question Title?', answer: 'Detailed response for customer inquiry.' }
                    ]
                    onChange({ ...content, faq: { ...content.faq, faqs: updated } })
                  }}
                >
                  + Add FAQ Item
                </button>
              </div>

              <div className="home-cms-repeater-list">
                {(content.faq.faqs || []).map((item, idx) => (
                  <div key={idx} className="home-cms-repeater-card">
                    <span className="home-cms-pill">Q#{idx + 1}</span>
                    <div className="home-cms-field">
                      <label>Question</label>
                      <input
                        type="text"
                        value={item.question}
                        onChange={(e) => {
                          const updated = [...content.faq.faqs]
                          updated[idx].question = e.target.value
                          onChange({ ...content, faq: { ...content.faq, faqs: updated } })
                        }}
                      />
                    </div>
                    <div className="home-cms-field">
                      <label>Answer Content</label>
                      <textarea
                        rows={3}
                        value={item.answer}
                        onChange={(e) => {
                          const updated = [...content.faq.faqs]
                          updated[idx].answer = e.target.value
                          onChange({ ...content, faq: { ...content.faq, faqs: updated } })
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className="home-cms-btn-danger-mini"
                      onClick={() => {
                        const updated = content.faq.faqs.filter((_, i) => i !== idx)
                        onChange({ ...content, faq: { ...content.faq, faqs: updated } })
                      }}
                    >
                      Delete FAQ
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. KEY ADVANTAGES */}
          {activeSecId === 'advantages' && (
            <div className="home-cms-card">
              <h3 className="home-cms-card-title">🛡️ Key Advantages & Trust Guarantees</h3>

              <div className="home-cms-field">
                <label>Eyebrow</label>
                <input
                  type="text"
                  value={content.advantages.eyebrow}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      advantages: { ...content.advantages, eyebrow: e.target.value }
                    })
                  }
                />
              </div>

              <div className="home-cms-field">
                <label>Title</label>
                <input
                  type="text"
                  value={content.advantages.title}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      advantages: { ...content.advantages, title: e.target.value }
                    })
                  }
                />
              </div>

              <div className="home-cms-field">
                <label>Description</label>
                <textarea
                  rows={2}
                  value={content.advantages.description}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      advantages: { ...content.advantages, description: e.target.value }
                    })
                  }
                />
              </div>

              <div className="home-cms-divider" />

              <div className="home-cms-repeater-header">
                <h4 className="home-cms-subheading" style={{ margin: 0 }}>Advantage Pillar Cards</h4>
                <button
                  type="button"
                  className="home-cms-btn-mini"
                  onClick={() => {
                    const updated = [
                      ...(content.advantages.advantages || []),
                      { title: 'New Advantage Pillar', text: 'Detailed description of this company strength.' }
                    ]
                    onChange({ ...content, advantages: { ...content.advantages, advantages: updated } })
                  }}
                >
                  + Add Advantage
                </button>
              </div>

              <div className="home-cms-repeater-list">
                {(content.advantages.advantages || []).map((adv, idx) => (
                  <div key={idx} className="home-cms-repeater-card">
                    <span className="home-cms-pill">Advantage #{idx + 1}</span>
                    <div className="home-cms-field">
                      <label>Title</label>
                      <input
                        type="text"
                        value={adv.title}
                        onChange={(e) => {
                          const updated = [...content.advantages.advantages]
                          updated[idx].title = e.target.value
                          onChange({ ...content, advantages: { ...content.advantages, advantages: updated } })
                        }}
                      />
                    </div>
                    <div className="home-cms-field">
                      <label>Description Text</label>
                      <textarea
                        rows={2}
                        value={adv.text}
                        onChange={(e) => {
                          const updated = [...content.advantages.advantages]
                          updated[idx].text = e.target.value
                          onChange({ ...content, advantages: { ...content.advantages, advantages: updated } })
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className="home-cms-btn-danger-mini"
                      onClick={() => {
                        const updated = content.advantages.advantages.filter((_, i) => i !== idx)
                        onChange({ ...content, advantages: { ...content.advantages, advantages: updated } })
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 10. NATIONWIDE DELIVERY */}
          {activeSecId === 'delivery' && (
            <div className="home-cms-card">
              <h3 className="home-cms-card-title">🚚 Nationwide Delivery & Dispatch Process</h3>

              <div className="home-cms-grid-2">
                <div className="home-cms-field">
                  <label>Eyebrow</label>
                  <input
                    type="text"
                    value={content.delivery.eyebrow}
                    onChange={(e) =>
                      onChange({
                        ...content,
                        delivery: { ...content.delivery, eyebrow: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="home-cms-field">
                  <label>Title</label>
                  <input
                    type="text"
                    value={content.delivery.title}
                    onChange={(e) =>
                      onChange({
                        ...content,
                        delivery: { ...content.delivery, title: e.target.value }
                      })
                    }
                  />
                </div>
              </div>

              <div className="home-cms-field">
                <label>Intro Paragraph</label>
                <textarea
                  rows={2}
                  value={content.delivery.intro}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      delivery: { ...content.delivery, intro: e.target.value }
                    })
                  }
                />
              </div>

              <div className="home-cms-field">
                <label>Delivery Map / Blueprint Image URL</label>
                <input
                  type="text"
                  value={content.delivery.imageUrl}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      delivery: { ...content.delivery, imageUrl: e.target.value }
                    })
                  }
                />
                {content.delivery.imageUrl && (
                  <div className="home-cms-image-preview-box">
                    <img src={content.delivery.imageUrl} alt="Delivery Map" />
                  </div>
                )}
              </div>

              <div className="home-cms-grid-2">
                <div className="home-cms-field">
                  <label>Badge Title</label>
                  <input
                    type="text"
                    value={content.delivery.badgeTitle}
                    placeholder="Direct Dispatch"
                    onChange={(e) =>
                      onChange({
                        ...content,
                        delivery: { ...content.delivery, badgeTitle: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="home-cms-field">
                  <label>Badge Subtitle</label>
                  <input
                    type="text"
                    value={content.delivery.badgeSubtitle}
                    placeholder="Coordinated freight nationwide"
                    onChange={(e) =>
                      onChange({
                        ...content,
                        delivery: { ...content.delivery, badgeSubtitle: e.target.value }
                      })
                    }
                  />
                </div>
              </div>

              <div className="home-cms-grid-2">
                <div className="home-cms-field">
                  <label>Button Text</label>
                  <input
                    type="text"
                    value={content.delivery.btnText}
                    onChange={(e) =>
                      onChange({
                        ...content,
                        delivery: { ...content.delivery, btnText: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="home-cms-field">
                  <label>Button URL</label>
                  <input
                    type="text"
                    value={content.delivery.btnUrl}
                    onChange={(e) =>
                      onChange({
                        ...content,
                        delivery: { ...content.delivery, btnUrl: e.target.value }
                      })
                    }
                  />
                </div>
              </div>

              <div className="home-cms-field">
                <label>Footer Note / Disclaimer</label>
                <input
                  type="text"
                  value={content.delivery.note}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      delivery: { ...content.delivery, note: e.target.value }
                    })
                  }
                />
              </div>

              <div className="home-cms-divider" />

              <div className="home-cms-repeater-header">
                <h4 className="home-cms-subheading" style={{ margin: 0 }}>Delivery Steps (Timeline)</h4>
                <button
                  type="button"
                  className="home-cms-btn-mini"
                  onClick={() => {
                    const updated = [
                      ...(content.delivery.steps || []),
                      { number: '04', title: 'Step Title', text: 'Step description' }
                    ]
                    onChange({ ...content, delivery: { ...content.delivery, steps: updated } })
                  }}
                >
                  + Add Step
                </button>
              </div>

              <div className="home-cms-repeater-list">
                {(content.delivery.steps || []).map((st, idx) => (
                  <div key={idx} className="home-cms-repeater-card">
                    <div className="home-cms-grid-2">
                      <div className="home-cms-field">
                        <label>Step Number</label>
                        <input
                          type="text"
                          value={st.number}
                          placeholder="01, 02, etc."
                          onChange={(e) => {
                            const updated = [...content.delivery.steps]
                            updated[idx].number = e.target.value
                            onChange({ ...content, delivery: { ...content.delivery, steps: updated } })
                          }}
                        />
                      </div>
                      <div className="home-cms-field">
                        <label>Step Title</label>
                        <input
                          type="text"
                          value={st.title}
                          onChange={(e) => {
                            const updated = [...content.delivery.steps]
                            updated[idx].title = e.target.value
                            onChange({ ...content, delivery: { ...content.delivery, steps: updated } })
                          }}
                        />
                      </div>
                    </div>
                    <div className="home-cms-field">
                      <label>Step Description</label>
                      <textarea
                        rows={2}
                        value={st.text}
                        onChange={(e) => {
                          const updated = [...content.delivery.steps]
                          updated[idx].text = e.target.value
                          onChange({ ...content, delivery: { ...content.delivery, steps: updated } })
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className="home-cms-btn-danger-mini"
                      onClick={() => {
                        const updated = content.delivery.steps.filter((_, i) => i !== idx)
                        onChange({ ...content, delivery: { ...content.delivery, steps: updated } })
                      }}
                    >
                      Delete Step
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 11. YOUTUBE WALKAROUNDS */}
          {activeSecId === 'youtube' && (
            <div className="home-cms-card">
              <h3 className="home-cms-card-title">📺 YouTube Walkaround Videos & In-Depth Reviews</h3>

              <div className="home-cms-field">
                <label>Eyebrow</label>
                <input
                  type="text"
                  value={content.youtube.eyebrow}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      youtube: { ...content.youtube, eyebrow: e.target.value }
                    })
                  }
                />
              </div>

              <div className="home-cms-field">
                <label>Title</label>
                <input
                  type="text"
                  value={content.youtube.title}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      youtube: { ...content.youtube, title: e.target.value }
                    })
                  }
                />
              </div>

              <div className="home-cms-field">
                <label>Description</label>
                <textarea
                  rows={2}
                  value={content.youtube.description}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      youtube: { ...content.youtube, description: e.target.value }
                    })
                  }
                />
              </div>

              <div className="home-cms-divider" />

              <div className="home-cms-repeater-header">
                <h4 className="home-cms-subheading" style={{ margin: 0 }}>Embedded YouTube Videos</h4>
                <button
                  type="button"
                  className="home-cms-btn-mini"
                  onClick={() => {
                    const updated = [
                      ...(content.youtube.videos || []),
                      {
                        embedUrl: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
                        tag: 'WALKTHROUGH',
                        title: 'New Video Title'
                      }
                    ]
                    onChange({ ...content, youtube: { ...content.youtube, videos: updated } })
                  }}
                >
                  + Add YouTube Video
                </button>
              </div>

              <div className="home-cms-repeater-list">
                {(content.youtube.videos || []).map((yt, idx) => (
                  <div key={idx} className="home-cms-repeater-card">
                    <span className="home-cms-pill">YouTube #{idx + 1}</span>

                    <div className="home-cms-field">
                      <label>YouTube Embed URL</label>
                      <input
                        type="text"
                        value={yt.embedUrl}
                        placeholder="https://www.youtube-nocookie.com/embed/VIDEO_ID"
                        onChange={(e) => {
                          const updated = [...content.youtube.videos]
                          updated[idx].embedUrl = e.target.value
                          onChange({ ...content, youtube: { ...content.youtube, videos: updated } })
                        }}
                      />
                      <span className="home-cms-hint">Use embed format: https://www.youtube-nocookie.com/embed/VIDEO_ID</span>
                    </div>

                    <div className="home-cms-grid-2">
                      <div className="home-cms-field">
                        <label>Category Tag</label>
                        <input
                          type="text"
                          value={yt.tag}
                          placeholder="OPERATOR WALKTHROUGH"
                          onChange={(e) => {
                            const updated = [...content.youtube.videos]
                            updated[idx].tag = e.target.value
                            onChange({ ...content, youtube: { ...content.youtube, videos: updated } })
                          }}
                        />
                      </div>
                      <div className="home-cms-field">
                        <label>Video Title</label>
                        <input
                          type="text"
                          value={yt.title}
                          onChange={(e) => {
                            const updated = [...content.youtube.videos]
                            updated[idx].title = e.target.value
                            onChange({ ...content, youtube: { ...content.youtube, videos: updated } })
                          }}
                        />
                      </div>
                    </div>

                    {yt.embedUrl && (
                      <div className="home-cms-embed-preview">
                        <iframe
                          src={yt.embedUrl}
                          title={yt.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      className="home-cms-btn-danger-mini"
                      onClick={() => {
                        const updated = content.youtube.videos.filter((_, i) => i !== idx)
                        onChange({ ...content, youtube: { ...content.youtube, videos: updated } })
                      }}
                    >
                      Delete Video
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 12. CUSTOMER REVIEWS / TESTIMONIALS */}
          {activeSecId === 'feedback' && (
            <div className="home-cms-card">
              <h3 className="home-cms-card-title">💬 Verified Customer Testimonials & Reviews</h3>

              <div className="home-cms-grid-2">
                <div className="home-cms-field">
                  <label>Eyebrow</label>
                  <input
                    type="text"
                    value={content.feedback.eyebrow}
                    onChange={(e) =>
                      onChange({
                        ...content,
                        feedback: { ...content.feedback, eyebrow: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="home-cms-field">
                  <label>Title</label>
                  <input
                    type="text"
                    value={content.feedback.title}
                    onChange={(e) =>
                      onChange({
                        ...content,
                        feedback: { ...content.feedback, title: e.target.value }
                      })
                    }
                  />
                </div>
              </div>

              <div className="home-cms-field">
                <label>Description</label>
                <textarea
                  rows={2}
                  value={content.feedback.description}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      feedback: { ...content.feedback, description: e.target.value }
                    })
                  }
                />
              </div>

              <div className="home-cms-grid-3">
                <div className="home-cms-field">
                  <label>Bottom Prompt</label>
                  <input
                    type="text"
                    value={content.feedback.bottomPrompt}
                    placeholder="Want to see more customer setups or submit your own review?"
                    onChange={(e) =>
                      onChange({
                        ...content,
                        feedback: { ...content.feedback, bottomPrompt: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="home-cms-field">
                  <label>Link Text</label>
                  <input
                    type="text"
                    value={content.feedback.bottomLinkText}
                    placeholder="Get in touch with our team"
                    onChange={(e) =>
                      onChange({
                        ...content,
                        feedback: { ...content.feedback, bottomLinkText: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="home-cms-field">
                  <label>Link URL</label>
                  <input
                    type="text"
                    value={content.feedback.bottomLinkUrl}
                    placeholder="/contact"
                    onChange={(e) =>
                      onChange({
                        ...content,
                        feedback: { ...content.feedback, bottomLinkUrl: e.target.value }
                      })
                    }
                  />
                </div>
              </div>

              <div className="home-cms-divider" />

              <div className="home-cms-repeater-header">
                <h4 className="home-cms-subheading" style={{ margin: 0 }}>Customer Testimonials ({content.feedback.testimonials?.length || 0})</h4>
                <button
                  type="button"
                  className="home-cms-btn-mini"
                  onClick={() => {
                    const updated = [
                      ...(content.feedback.testimonials || []),
                      {
                        stars: '★★★★★',
                        quote: 'Great equipment and fast delivery. Very satisfied with the build quality.',
                        avatar: '/images/hero-v900-three-colors.png',
                        name: 'Contractor Name',
                        role: 'Verified Buyer, State'
                      }
                    ]
                    onChange({ ...content, feedback: { ...content.feedback, testimonials: updated } })
                  }}
                >
                  + Add Testimonial
                </button>
              </div>

              <div className="home-cms-repeater-list">
                {(content.feedback.testimonials || []).map((t, idx) => (
                  <div key={idx} className="home-cms-repeater-card">
                    <div className="home-cms-grid-2">
                      <div className="home-cms-field">
                        <label>Rating Stars</label>
                        <input
                          type="text"
                          value={t.stars}
                          placeholder="★★★★★"
                          onChange={(e) => {
                            const updated = [...content.feedback.testimonials]
                            updated[idx].stars = e.target.value
                            onChange({ ...content, feedback: { ...content.feedback, testimonials: updated } })
                          }}
                        />
                      </div>
                      <div className="home-cms-field">
                        <label>Customer Avatar / Photo URL</label>
                        <input
                          type="text"
                          value={t.avatar}
                          onChange={(e) => {
                            const updated = [...content.feedback.testimonials]
                            updated[idx].avatar = e.target.value
                            onChange({ ...content, feedback: { ...content.feedback, testimonials: updated } })
                          }}
                        />
                      </div>
                    </div>

                    <div className="home-cms-field">
                      <label>Customer Quote</label>
                      <textarea
                        rows={3}
                        value={t.quote}
                        onChange={(e) => {
                          const updated = [...content.feedback.testimonials]
                          updated[idx].quote = e.target.value
                          onChange({ ...content, feedback: { ...content.feedback, testimonials: updated } })
                        }}
                      />
                    </div>

                    <div className="home-cms-grid-2">
                      <div className="home-cms-field">
                        <label>Customer Name</label>
                        <input
                          type="text"
                          value={t.name}
                          onChange={(e) => {
                            const updated = [...content.feedback.testimonials]
                            updated[idx].name = e.target.value
                            onChange({ ...content, feedback: { ...content.feedback, testimonials: updated } })
                          }}
                        />
                      </div>
                      <div className="home-cms-field">
                        <label>Role / Company / Location</label>
                        <input
                          type="text"
                          value={t.role}
                          placeholder="Landscape Contractor, Texas"
                          onChange={(e) => {
                            const updated = [...content.feedback.testimonials]
                            updated[idx].role = e.target.value
                            onChange({ ...content, feedback: { ...content.feedback, testimonials: updated } })
                          }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      className="home-cms-btn-danger-mini"
                      onClick={() => {
                        const updated = content.feedback.testimonials.filter((_, i) => i !== idx)
                        onChange({ ...content, feedback: { ...content.feedback, testimonials: updated } })
                      }}
                    >
                      Delete Testimonial
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 13. BOTTOM ACTION STRIP */}
          {activeSecId === 'ctaStrip' && (
            <div className="home-cms-card">
              <h3 className="home-cms-card-title">🚀 Bottom Full-Width Action Banner</h3>

              <div className="home-cms-grid-2">
                <div className="home-cms-field">
                  <label>Title Prefix</label>
                  <input
                    type="text"
                    value={content.ctaStrip.title}
                    placeholder="Ready to Put the V900 to"
                    onChange={(e) =>
                      onChange({
                        ...content,
                        ctaStrip: { ...content.ctaStrip, title: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="home-cms-field">
                  <label>Title Highlight Word</label>
                  <input
                    type="text"
                    value={content.ctaStrip.titleHighlight}
                    placeholder="Work?"
                    onChange={(e) =>
                      onChange({
                        ...content,
                        ctaStrip: { ...content.ctaStrip, titleHighlight: e.target.value }
                      })
                    }
                  />
                </div>
              </div>

              <div className="home-cms-field">
                <label>Subtitle / Description</label>
                <textarea
                  rows={2}
                  value={content.ctaStrip.subtitle}
                  onChange={(e) =>
                    onChange({
                      ...content,
                      ctaStrip: { ...content.ctaStrip, subtitle: e.target.value }
                    })
                  }
                />
              </div>

              <div className="home-cms-divider" />

              <h4 className="home-cms-subheading">Action Buttons</h4>
              <div className="home-cms-grid-2">
                <div className="home-cms-field">
                  <label>Primary Button Text</label>
                  <input
                    type="text"
                    value={content.ctaStrip.primaryBtnText}
                    onChange={(e) =>
                      onChange({
                        ...content,
                        ctaStrip: { ...content.ctaStrip, primaryBtnText: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="home-cms-field">
                  <label>Primary Button URL</label>
                  <input
                    type="text"
                    value={content.ctaStrip.primaryBtnUrl}
                    onChange={(e) =>
                      onChange({
                        ...content,
                        ctaStrip: { ...content.ctaStrip, primaryBtnUrl: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="home-cms-field">
                  <label>Secondary Button Text</label>
                  <input
                    type="text"
                    value={content.ctaStrip.secondaryBtnText}
                    onChange={(e) =>
                      onChange({
                        ...content,
                        ctaStrip: { ...content.ctaStrip, secondaryBtnText: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="home-cms-field">
                  <label>Secondary Button URL</label>
                  <input
                    type="text"
                    value={content.ctaStrip.secondaryBtnUrl}
                    onChange={(e) =>
                      onChange({
                        ...content,
                        ctaStrip: { ...content.ctaStrip, secondaryBtnUrl: e.target.value }
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sticky Bottom Save Bar */}
          <div className="home-cms-bottom-bar">
            <div className="home-cms-bottom-left">
              <span>Section: <strong>{activeMeta.name}</strong></span>
              <span className="sep">•</span>
              <span>{currentSectionData?.visible !== false ? '🟢 Visible' : '⚪ Hidden'}</span>
            </div>
            <div className="home-cms-bottom-right">
              <button
                type="button"
                className="home-cms-btn home-cms-btn-primary"
                onClick={onSave}
                disabled={isSaving}
              >
                {isSaving ? 'Publishing Changes...' : 'Save & Publish Homepage'}
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Media Picker Modal */}
      {mediaPickerTarget && (
        <div className="home-cms-modal-backdrop" onClick={() => setMediaPickerTarget(null)}>
          <div className="home-cms-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="home-cms-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>📁</span>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>Select Media Asset from Library</h3>
              </div>
              <button
                type="button"
                className="home-cms-btn-mini"
                onClick={() => setMediaPickerTarget(null)}
              >
                ✕ Close
              </button>
            </div>
            <div className="home-cms-modal-body">
              {mediaList && mediaList.length > 0 ? (
                <div className="home-cms-modal-grid">
                  {mediaList.map((item) => (
                    <div
                      key={item.id || item.url}
                      className="home-cms-modal-item"
                      onClick={() => handleSelectMediaForTarget(item.url)}
                    >
                      <div className="home-cms-modal-thumb">
                        {item.url.match(/\.(mp4|webm|m4v)$/i) ? (
                          <video src={item.url} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <img src={item.url} alt={item.title} />
                        )}
                      </div>
                      <span className="home-cms-modal-title">{item.title}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#a1a1aa', textAlign: 'center', padding: '30px' }}>
                  No media items available in media library. You can type or paste image/video paths directly into the URL input fields.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
