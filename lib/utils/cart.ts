export interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  imageUrl?: string | null
}

export interface CartTotals {
  subtotal: number
  tax: number
  total: number
}

export function calculateCartTotals(
  cart: CartItem[],
  taxRate = 0.1
): CartTotals {
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  const tax = subtotal * taxRate

  return {
    subtotal,
    tax,
    total: subtotal + tax,
  }
}

/**
 * Get cart from localStorage
 */
export function getCart(): CartItem[] {
  if (typeof window === 'undefined') {
    return []
  }
  
  const cart = localStorage.getItem('cart')
  return cart ? JSON.parse(cart) : []
}

/**
 * Dispatch cart update event
 */
function dispatchCartUpdate(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('cartUpdated'))
  }
}

/**
 * Add item to cart
 */
export function addToCart(item: CartItem): void {
  if (typeof window === 'undefined') {
    return
  }

  const cart = getCart()
  const existingItemIndex = cart.findIndex((cartItem) => cartItem.id === item.id)

  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += item.quantity
  } else {
    cart.push(item)
  }

  localStorage.setItem('cart', JSON.stringify(cart))
  dispatchCartUpdate()
}

/**
 * Update cart item quantity
 */
export function updateCartItemQuantity(id: string, quantity: number): void {
  if (typeof window === 'undefined') {
    return
  }

  const cart = getCart()
  const updatedCart = cart.map((item) =>
    item.id === id ? { ...item, quantity } : item
  )

  localStorage.setItem('cart', JSON.stringify(updatedCart))
  dispatchCartUpdate()
}

/**
 * Remove item from cart
 */
export function removeFromCart(id: string): void {
  if (typeof window === 'undefined') {
    return
  }

  const cart = getCart()
  const updatedCart = cart.filter((item) => item.id !== id)
  localStorage.setItem('cart', JSON.stringify(updatedCart))
  dispatchCartUpdate()
}

/**
 * Clear cart
 */
export function clearCart(): void {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.removeItem('cart')
  dispatchCartUpdate()
}

