'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'

type Option = { id: string; title: string }
type Initial = {
   view?: 'orders' | 'products'
   start?: string
   end?: string
   categoryId?: string
   brandId?: string
}

export function ReportsFilters({
   initial,
   brands,
   categories,
}: {
   initial: Initial
   brands: Option[]
   categories: Option[]
}) {
   const sp = useSearchParams()
   const router = useRouter()

   const [view, setView] = React.useState<'orders' | 'products'>(
      (initial.view ?? 'orders') as 'orders' | 'products'
   )
   const [start, setStart] = React.useState(initial.start ?? '')
   const [end, setEnd] = React.useState(initial.end ?? '')
   const [categoryId, setCategoryId] = React.useState(initial.categoryId ?? '')
   const [brandId, setBrandId] = React.useState(initial.brandId ?? '')

   function submit(next?: Partial<Record<string, string>>) {
      const params = new URLSearchParams(Object.fromEntries(sp.entries()))
      params.set('view', (next?.view as string) ?? view)
      start ? params.set('start', start) : params.delete('start')
      end ? params.set('end', end) : params.delete('end')
      categoryId
         ? params.set('categoryId', categoryId)
         : params.delete('categoryId')
      brandId ? params.set('brandId', brandId) : params.delete('brandId')
      router.push(`?${params.toString()}`)
   }

   return (
      <div className="flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-end">
         {/* Tabs (Orders / Products) */}
         <Tabs
            value={view}
            onValueChange={(val) => {
               const v = (val as 'orders' | 'products') ?? 'orders'
               setView(v)
               submit({ view: v })
            }}
            className="md:w-auto"
         >
            <TabsList>
               <TabsTrigger value="orders">Orders by Date</TabsTrigger>
               <TabsTrigger value="products">Top Selling Products</TabsTrigger>
            </TabsList>
         </Tabs>

         {/* Date range */}
         <div className="grid grid-cols-2 gap-3 md:ml-auto">
            <div className="flex flex-col gap-1">
               <Label htmlFor="start">Start</Label>
               <Input
                  id="start"
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="h-9"
               />
            </div>
            <div className="flex flex-col gap-1">
               <Label htmlFor="end">End</Label>
               <Input
                  id="end"
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="h-9"
               />
            </div>
         </div>

         {/* Category / Brand + Apply */}
         <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <div className="flex flex-col gap-1">
               <Label>Category</Label>
               <Select
                  value={categoryId || '__all__'}
                  onValueChange={(val) =>
                     setCategoryId(val === '__all__' ? '' : val)
                  }
               >
                  <SelectTrigger className="h-9">
                     <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="__all__">All categories</SelectItem>
                     {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                           {c.title}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>

            <div className="flex flex-col gap-1">
               <Label>Brand</Label>
               <Select
                  value={brandId || '__all__'}
                  onValueChange={(val) =>
                     setBrandId(val === '__all__' ? '' : val)
                  }
               >
                  <SelectTrigger className="h-9">
                     <SelectValue placeholder="All brands" />
                  </SelectTrigger>
                  <SelectContent>
                     <SelectItem value="__all__">All brands</SelectItem>
                     {brands.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                           {b.title}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>

            <div className="flex items-end">
               <Button
                  className="h-9 w-full md:w-auto"
                  onClick={() => submit()}
               >
                  Apply
               </Button>
            </div>
         </div>
      </div>
   )
}
