import { useRef, useState } from 'react'
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

export default function EquipmentAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      from: 'assistant',
      text: 'Hi — ask me a direct question about buying the V900, specifications, attachments, delivery, warranty, or support. I’ll answer directly and won’t ask about your work unless you want a recommendation.',
    },
  ])
  const nextId = useRef(2)

  const sendMessage = (text: string) => {
    const cleanText = text.trim()
    if (!cleanText) return

    const userMessage: Message = { id: nextId.current++, from: 'user', text: cleanText }
    const assistantMessage: Message = { id: nextId.current++, from: 'assistant', text: getReply(cleanText) }
    setMessages((current) => [...current, userMessage, assistantMessage])
    setInput('')
  }

  return (
    <aside className={`equipment-assistant${isOpen ? ' is-open' : ''}`} aria-label="Equipment assistant">
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

      <button
        type="button"
        className="assistant-launcher"
        onClick={() => setIsOpen((current) => !current)}
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close equipment assistant' : 'Open equipment assistant'}
      >
        {isOpen ? <span className="launcher-close">×</span> : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/></svg>
            <span><strong>Need help choosing?</strong><small>Ask our equipment assistant</small></span>
          </>
        )}
      </button>
    </aside>
  )
}
