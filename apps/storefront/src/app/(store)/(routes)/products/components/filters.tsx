'use client'

import { Input } from '@/components/ui/input'
import {
   MultiSelect,
   MultiSelectContent,
   MultiSelectGroup,
   MultiSelectItem,
   MultiSelectTrigger,
   MultiSelectValue,
} from '@/components/ui/multi-select'
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

type Props = {
   brands: string[]
   categories: string[]
   initial: {
      q: string
      brand?: string // use undefined when empty
      categories: string[]
      isAvailable?: 'true' | 'false' // use undefined when empty
      sort: 'price_desc' | 'price_asc' | 'title_asc' | 'title_desc'
      minPrice: string
      maxPrice: string
   }
}

export function Filters({ brands, categories, initial }: Props) {
   const router = useRouter()
   const pathname = usePathname()
   const search = useSearchParams()

   // Lazy-init ensures SSR/CSR start from the exact same object
   const [state, setState] = useState(() => initial)

   function push(next: Partial<typeof state>, resetPage = true) {
      const s = new URLSearchParams(search?.toString())
      const merged = { ...state, ...next }

      setOrDelete(s, 'q', merged.q)
      setOrDelete(s, 'brand', merged.brand) // undefined => delete
      setOrDelete(s, 'categories', merged.categories.join(','))
      setOrDelete(s, 'isAvailable', merged.isAvailable) // undefined => delete
      setOrDelete(s, 'minPrice', merged.minPrice)
      setOrDelete(s, 'maxPrice', merged.maxPrice)
      setOrDelete(s, 'sort', merged.sort)

      if (resetPage) s.set('page', '1')

      setState(merged)
      router.push(`${pathname}?${s.toString()}`)
   }

   return (
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-6">
         {/* Text search (controlled) */}
         <Input
            className="col-span-2 px-3 py-2 rounded border"
            placeholder="Search products..."
            value={state.q}
            onChange={(e) => push({ q: e.target.value })}
         />

         {/* Price min/max (controlled) */}
         <Input
            type="number"
            className="px-3 py-2 rounded border"
            placeholder="Min price"
            value={state.minPrice}
            onChange={(e) => push({ minPrice: e.target.value })}
         />
         <Input
            type="number"
            className="px-3 py-2 rounded border"
            placeholder="Max price"
            value={state.maxPrice}
            onChange={(e) => push({ maxPrice: e.target.value })}
         />

         {/* Brand — no empty-string value; undefined shows the placeholder */}
         <Select
            value={state.brand ?? undefined}
            onValueChange={(val) => push({ brand: val })}
         >
            <SelectTrigger className="w-full">
               <SelectValue placeholder="All brands" />
            </SelectTrigger>
            <SelectContent>
               {brands.map((b) => (
                  <SelectItem key={b} value={b}>
                     {b}
                  </SelectItem>
               ))}
            </SelectContent>
         </Select>

         {/* Categories (multi) — already good & controlled */}
         <MultiSelect
            values={state.categories}
            onValuesChange={(vals: string[]) => push({ categories: vals })}
         >
            <MultiSelectTrigger className="w-full md:col-span-2">
               <MultiSelectValue placeholder="Filter by categories..." />
            </MultiSelectTrigger>

            <MultiSelectContent>
               <MultiSelectGroup>
                  {categories.map((c) => (
                     <MultiSelectItem key={c} value={c}>
                        {c}
                     </MultiSelectItem>
                  ))}
               </MultiSelectGroup>
            </MultiSelectContent>
         </MultiSelect>

         {/* Availability — no empty-string value; undefined shows the placeholder */}
         <Select
            value={state.isAvailable ?? undefined}
            onValueChange={(val) =>
               push({ isAvailable: val as 'true' | 'false' })
            }
         >
            <SelectTrigger className="w-full">
               <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
               <SelectItem value="true">Available only</SelectItem>
               <SelectItem value="false">Unavailable only</SelectItem>
            </SelectContent>
         </Select>

         {/* Sort (controlled) */}
         <Select
            value={state.sort}
            onValueChange={(val) =>
               push({ sort: val as Props['initial']['sort'] })
            }
         >
            <SelectTrigger className="w-full">
               <SelectValue placeholder="Sort by…" />
            </SelectTrigger>
            <SelectContent>
               <SelectItem value="price_desc">Most expensive</SelectItem>
               <SelectItem value="price_asc">Cheapest</SelectItem>
               <SelectItem value="title_asc">Title (A–Z)</SelectItem>
               <SelectItem value="title_desc">Title (Z–A)</SelectItem>
            </SelectContent>
         </Select>
      </div>
   )
}

function setOrDelete(
   s: URLSearchParams,
   key: string,
   val?: string | undefined
) {
   const v = val === undefined || val === null ? '' : String(val).trim()
   if (!v) s.delete(key)
   else s.set(key, v)
}
