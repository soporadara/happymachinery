import { useRef, useState, useEffect } from 'react'
import { Contact } from 'lucide-react'
import './EquipmentAssistant.css'

type Message = {
  id: number
  from: 'assistant' | 'user'
  text: string
}

const starterOptions = [
  'I want to buy a V900',
  'V900 specifications',
  'Delivery & shipping',
  'Get pricing',
]

function getReply(message: string) {
  const value = message.toLowerCase().replace(/[^a-z0-9.'"\s-]/g, ' ')
  const has = (...words: string[]) => words.some((word) => value.includes(word))

  // Purchase intent must be handled before broad words such as "machine".
  if (has('buy', 'purchase', 'order', 'checkout', 'want one', 'get one', 'just machine', 'not service', 'not serve')) {
    return 'Absolutely — you can buy the V900 without discussing your work first. Open the Store to select a V900 package, or choose “Get a quote” for the current price and delivery cost. The sales team will only need your preferred color, attachment, and delivery ZIP code.'
  }
  if (has('hello', ' hi ', 'hey', 'good morning', 'good afternoon')) {
    return 'Hello! Ask me any direct question about the V900, buying, specifications, attachments, delivery, or support. I’ll answer directly.'
  }
  if (has('thank', 'thanks', 'okay', 'got it')) {
    return 'You’re welcome. If you are ready to purchase, use “Get a quote” below for current pricing and delivery.'
  }
  if (has('lift', 'capacity', 'how much weight', 'rated load', 'payload')) {
    return 'The V900 has a rated operating capacity of 1,014 lbs (460 kg). Its tracked stance helps keep loads composed, while the pallet-fork package is ideal for moving pallets, blocks, logs, and supplies.'
  }
  if (has('operating weight', 'machine weight', 'how heavy', 'weigh')) {
    return 'The V900 operating weight is approximately 3,086 lbs (1,400 kg). The rated operating capacity is 1,014 lbs (460 kg). Confirm transport and trailer requirements with the sales team before pickup.'
  }
  if (has('deliver', 'delivery', 'shipping', 'ship', 'freight', 'zip code')) {
    return 'Nationwide US shipping is available. We prepare and secure the machine, coordinate the delivery details, and help you plan for a smooth handoff. Use “Get a quote” below for delivery pricing to your location.'
  }
  if (has('price', 'quote', 'cost', 'how much', 'discount', 'sale')) {
    return 'I don’t have access to live pricing, so I won’t guess. Current pricing depends on the V900 package, attachment, and delivery ZIP code. Select “Get a quote” below for an accurate total from the sales team.'
  }
  if (has('in stock', 'available', 'availability', 'inventory')) {
    return 'I can’t see live inventory. Please use “Get a quote” to confirm which V900 colors and attachment packages are currently available.'
  }
  if (has('spec', 'dimension', 'details', 'information', 'tell me about v900')) {
    return 'Key V900 specifications: 1,014 lbs (460 kg) rated capacity, 3,086 lbs (1,400 kg) operating weight, 35.9 in (911 mm) machine width, and 12.7 GPM (48 L/min) auxiliary hydraulic flow. Ask about any specification for more detail.'
  }
  if (has('fork', 'pallet')) {
    return 'Choose the TYPH-5005M pallet fork package for pallets and job-site materials. It offers adjustable fork spacing, secure load support, and quick attachment changes.'
  }
  if (has('bucket', 'dig', 'grade', 'grading', 'dirt', 'soil')) {
    return 'For digging, grading, backfilling, and moving loose material, the standard bucket setup is the best starting point. The compact V900 can work through narrow access points while retaining useful pushing power.'
  }
  if (has('width', 'gate', 'small space', 'tight', 'narrow', 'fit through')) {
    return 'The V900 is only 35.9 inches (911 mm) wide, making it suitable for many 36-inch gates, alleys, yards, and confined work areas.'
  }
  if (has('hydraulic', 'flow', 'gpm', 'attachment power')) {
    return 'The V900 provides 12.7 GPM (48 L/min) auxiliary hydraulic flow for compatible attachments. Always confirm an attachment’s required flow, pressure, mounting plate, and operating limits before purchase.'
  }
  if (has('color', 'red', 'blue', 'yellow')) {
    return 'The V900 is shown in Crimson Red, Industrial Yellow, and Cobalt Blue. Live color availability must be confirmed with the sales team when ordering.'
  }
  if (has('warranty', 'guarantee')) {
    return 'The website lists a 1-year commercial warranty. Ask the sales team for the complete written warranty terms, exclusions, and claim process before purchasing.'
  }
  if (has('finance', 'payment plan', 'monthly', 'credit')) {
    return 'Financing availability and terms must be confirmed by the sales team. I won’t estimate a monthly payment without the current machine price, down payment, rate, term, taxes, and delivery cost.'
  }
  if (has('visit', 'warehouse', 'location', 'address', 'pickup')) {
    return 'Warehouse visits and pickup should be scheduled in advance so the team can confirm the location, machine availability, and loading arrangements. Use the Contact page to arrange your visit.'
  }
  if (has('service', 'repair', 'parts', 'maintenance', 'support')) {
    return 'Parts and service support are available through the team. For an exact part or repair answer, provide the machine model, serial number, and the component or issue through the Contact page.'
  }
  if (has('choose', 'recommend', 'which attachment', 'which one', 'best for')) {
    return 'Tell me the task — for example pallets, grading, digging, logs, or tight-access work — and I’ll recommend the suitable V900 setup. You do not need to explain anything unrelated to the purchase.'
  }

  return 'I’m not sure I understood that question, and I don’t want to give you a wrong answer. Please ask it in a short sentence, or use “Get a quote” to speak with the team about pricing, inventory, delivery, or anything not listed on the website.'
}

interface EquipmentAssistantProps {
  isCartOpen?: boolean
}

export default function EquipmentAssistant({ isCartOpen }: EquipmentAssistantProps = {}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [input, setInput] = useState('')

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      from: 'assistant',
      text: 'Hi — ask me a direct question about buying the V900, specifications, attachments, delivery, warranty, or support. I’ll answer directly and won’t ask about your work unless you want a recommendation.',
    },
  ])
  const nextId = useRef(2)

  // Close popups on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        setIsContactOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (isCartOpen) {
    return null
  }

  const sendMessage = (text: string) => {
    const cleanText = text.trim()
    if (!cleanText) return

    const userMessage: Message = { id: nextId.current++, from: 'user', text: cleanText }
    const assistantMessage: Message = { id: nextId.current++, from: 'assistant', text: getReply(cleanText) }
    setMessages((current) => [...current, userMessage, assistantMessage])
    setInput('')
  }

  return (
    <aside className="equipment-assistant-dock" aria-label="Customer contact & assistance">
      {/* 1. Direct Contact Support Widget (Shown on all pages) */}
      <div className="floating-widget-wrapper contact-widget-wrapper">
          {isContactOpen && (
            <div className="quick-contact-panel" role="dialog" aria-modal="true" aria-label="Direct Contact Support">
              <header className="quick-contact-header">
                <div className="quick-contact-title-group">
                  <span className="quick-contact-badge-dot" />
                  <div>
                    <h3>TYPHON Machinery Support</h3>
                    <p>Live contractor sales & logistics channels</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="quick-contact-close-btn"
                  onClick={() => setIsContactOpen(false)}
                  aria-label="Close Contact Support"
                >
                  ×
                </button>
              </header>

              <div className="quick-contact-channels">
                {/* Channel 1: WhatsApp Support */}
                <a
                  href="https://wa.me/13235325703"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="quick-contact-channel-card whatsapp"
                >
                  <div className="channel-icon-bubble whatsapp-bubble">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.79 14.07c-.24.68-1.4 1.28-1.93 1.34-.51.06-1.16.08-3.71-.97-2.18-.89-3.58-3.13-3.69-3.27-.11-.15-.89-1.18-.89-2.26 0-1.07.56-1.61.76-1.83.2-.22.44-.28.59-.28.15 0 .3 0 .43.01.14.01.32-.05.5.38.19.45.64 1.57.7 1.69.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.25.31-.36.42-.12.12-.24.25-.1.5.14.24.63 1.04 1.36 1.69.94.84 1.73 1.1 1.98 1.22.25.12.39.1.53-.06.14-.17.62-.72.78-.97.17-.25.33-.21.56-.12.23.08 1.45.68 1.7.81.25.12.42.19.48.3.06.11.06.66-.18 1.34z" />
                    </svg>
                  </div>
                  <div className="channel-info">
                    <span className="channel-kicker">WhatsApp Support</span>
                    <strong className="channel-val">United States: +1 323-532-5703</strong>
                    <span className="channel-sub">Live chat with dispatch team &rarr;</span>
                  </div>
                </a>

                {/* Channel 2: Phone Support */}
                <a
                  href="tel:+12132142203"
                  className="quick-contact-channel-card phone"
                >
                  <div className="channel-icon-bubble phone-bubble">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </div>
                  <div className="channel-info">
                    <span className="channel-kicker">Phone Support</span>
                    <strong className="channel-val">United States: +1 213-214-2203</strong>
                    <span className="channel-sub">Toll-free contractor equipment hotline &rarr;</span>
                  </div>
                </a>

                {/* Channel 3: Sales Enquiries */}
                <a
                  href="mailto:sales@typhonmachinery.com"
                  className="quick-contact-channel-card email"
                >
                  <div className="channel-icon-bubble email-bubble">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                  <div className="channel-info">
                    <span className="channel-kicker">Sales Enquiries</span>
                    <strong className="channel-val">sales@typhonmachinery.com</strong>
                    <span className="channel-sub">Official RFQ & pricing estimates &rarr;</span>
                  </div>
                </a>
              </div>
            </div>
          )}

          {/* Contact Circle Button with Hover Tooltip Pill (Image 3) & Radar Pulse Wave (Image 4) */}
          <div className="floating-btn-container">
            <span className="floating-btn-tooltip">Contact Us</span>
            <button
              type="button"
              className={`floating-circle-btn contact-btn ${isContactOpen ? 'is-active' : ''}`}
              onClick={() => {
                setIsContactOpen((prev) => !prev)
                if (isOpen) setIsOpen(false)
              }}
              aria-expanded={isContactOpen}
              aria-label={isContactOpen ? 'Close contact channels' : 'Open contact channels'}
            >
              <span className="radar-wave-ring ring-1" aria-hidden="true" />
              <span className="radar-wave-ring ring-2" aria-hidden="true" />
              {isContactOpen ? (
                <span className="floating-close-cross">×</span>
              ) : (
                <Contact size={22} color="#ffffff" strokeWidth={2.2} />
              )}
            </button>
          </div>
        </div>

      {/* 2. Need Help Choosing Assistant Widget - Circle UI with Hover Tooltip Pill & Radar Pulse Wave */}
      <div className="floating-widget-wrapper assistant-widget-wrapper">
        {isOpen && (
          <div className="assistant-panel">
            <header className="assistant-header">
              <div className="assistant-identity">
                <span className="assistant-avatar" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 3a7 7 0 0 0-7 7v2a3 3 0 0 0 3 3h1v-5H5m14 0v2a3 3 0 0 1-3 3h-1v-5h4" />
                    <path d="M9 19h4a3 3 0 0 0 3-3v-1" />
                  </svg>
                </span>
                <span><strong>Equipment Assistant</strong><small><i></i> Online · Equipment guide</small></span>
              </div>
              <button type="button" className="assistant-close" onClick={() => setIsOpen(false)} aria-label="Close equipment assistant">×</button>
            </header>

            <div className="assistant-conversation" aria-live="polite">
              <div className="assistant-day">Today</div>
              {messages.map((message) => (
                <div className={`assistant-message ${message.from}`} key={message.id}>
                  {message.from === 'assistant' && <span className="message-mark">V</span>}
                  <p>{message.text}</p>
                </div>
              ))}
            </div>

            <div className="assistant-suggestions" aria-label="Suggested questions">
              {starterOptions.map((option) => (
                <button type="button" onClick={() => sendMessage(option)} key={option}>{option}</button>
              ))}
            </div>

            <form className="assistant-compose" onSubmit={(event) => { event.preventDefault(); sendMessage(input) }}>
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about your job or machine..."
                aria-label="Message the V900 assistant"
              />
              <button type="submit" disabled={!input.trim()} aria-label="Send message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m4 4 17 8-17 8 3-8-3-8Z"/><path d="M7 12h14"/></svg>
              </button>
            </form>
            <div className="assistant-footer">
              <span>Need a person?</span><a href="/contact">Get a quote →</a>
            </div>
          </div>
        )}

        <div className="floating-btn-container">
          <span className="floating-btn-tooltip">Need help choosing?</span>
          <button
            type="button"
            className={`floating-circle-btn assistant-launcher ${isOpen ? 'is-active' : ''}`}
            onClick={() => {
              setIsOpen((prev) => !prev)
              if (isContactOpen) setIsContactOpen(false)
            }}
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Close equipment assistant' : 'Open equipment assistant'}
          >
            <span className="radar-wave-ring ring-1" aria-hidden="true" />
            <span className="radar-wave-ring ring-2" aria-hidden="true" />
            {isOpen ? (
              <span className="floating-close-cross">×</span>
            ) : (
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </aside>
  )
}
