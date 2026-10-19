export interface Product {
  id: number
  name: string
  price: number
  description: string
  tag: string
  image?: string
}

export interface CartItem {
  product: Product
  quantity: number
}

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  cartItems: CartItem[]
  onUpdateQuantity: (productId: number, quantity: number) => void
  onRemoveItem: (productId: number) => void
  onCheckout: () => void
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: CartDrawerProps) {
  const totalPrice = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0)

  if (!isOpen) return null

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h2>Shopping Cart</h2>
          <button className="close-cart" onClick={onClose} aria-label="Close cart">&times;</button>
        </div>

        <div className="cart-body">
          {cartItems.length === 0 ? (
            <div className="empty-cart-state">
              <p>Your cart is empty.</p>
            </div>
          ) : (
            <ul className="cart-items-list">
              {cartItems.map((item) => (
                <li key={item.product.id} className="cart-item-row">
                  <div className="cart-item-left">
                    {item.product.image && (
                      <img src={item.product.image} alt={item.product.name} className="cart-item-image" />
                    )}
                    <div className="cart-item-info">
                      <h3>{item.product.name}</h3>
                      <p className="cart-item-tag">{item.product.tag}</p>
                      <p className="cart-item-price">${item.product.price.toLocaleString()} each</p>
                    </div>
                  </div>

                  <div className="cart-item-controls">
                    <div className="quantity-selector">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}>+</button>
                    </div>
                    <button className="remove-btn" onClick={() => onRemoveItem(item.product.id)}>Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-summary-row">
              <span>Total:</span>
              <span className="total-price">${totalPrice}</span>
            </div>
            <button className="checkout-btn" onClick={onCheckout}>Checkout</button>
          </div>
        )}
      </div>
    </div>
  )
}
