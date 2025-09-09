export function writeLocalCart(items) {
   window.localStorage.setItem('Cart', JSON.stringify(items))
}

export function getLocalCart() {
   if (typeof window !== 'undefined' && window.localStorage) {
      try {
         const raw = window.localStorage.getItem('Cart')
         if (!raw) {
            const empty = { items: [] }
            writeLocalCart(empty)
            return empty
         }
         const parsed = JSON.parse(raw)
         if (!parsed || !Array.isArray(parsed.items)) {
            const empty = { items: [] }
            writeLocalCart(empty)
            return empty
         }
         return parsed
      } catch (error) {
         const empty = { items: [] }
         writeLocalCart(empty)
         return empty
      }
   }
   return { items: [] }
}

export function getCountInCart({ cartItems, productId }) {
   try {
      for (let i = 0; i < cartItems.length; i++) {
         if (cartItems[i]?.productId === productId) {
            return cartItems[i]?.count
         }
      }

      return 0
   } catch (error) {
      console.error({ error })
      return 0
   }
}
