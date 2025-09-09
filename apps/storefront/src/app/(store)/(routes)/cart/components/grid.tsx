'use client'

import { Card, CardContent } from '@/components/ui/card'
import { isVariableValid } from '@/lib/utils'
import { useCartContext } from '@/state/Cart'
import { ProductGrid } from '@/components/native/Product'

import { Item } from './item'
import { Receipt } from './receipt'
import { Skeleton } from './skeleton'

export const CartGrid = () => {
   const { loading, cart, refreshCart, dispatchCart } = useCartContext()

   if (isVariableValid(cart?.items) && cart?.items?.length === 0) {
      return (
         <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
               <Card>
                  <CardContent className="p-4">
                     <p>Your Cart is empty...</p>
                  </CardContent>
               </Card>
            </div>
            <Receipt />
         </div>
      )
   }

   const suggested = isVariableValid(cart?.items)
      ? [
           ...new Map(
              (cart?.items ?? [])
                 .flatMap((i) => i?.product?.crossSellProducts ?? [])
                 .map((p) => [p.id, p])
           ).values(),
        ]
      : []

   return (
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
         <div className="md:col-span-2">
            {isVariableValid(cart?.items)
               ? cart?.items?.map((cartItem, index) => (
                    <Item cartItem={cartItem} key={index} />
                 ))
               : [...Array(5)].map((cartItem, index) => (
                    <Skeleton key={index} />
                 ))}

            {isVariableValid(suggested) && suggested.length > 0 && (
               <div className="mt-6">
                  <h3 className="mb-3 text-lg font-medium">Suggested for your cart</h3>
                  <ProductGrid products={suggested as any} />
               </div>
            )}
         </div>
         <Receipt />
      </div>
   )
}
