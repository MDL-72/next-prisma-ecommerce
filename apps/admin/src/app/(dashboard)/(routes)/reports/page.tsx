import {
   getAllBrandsAndCategories,
   getOrdersByDate,
   getTopSellingProducts,
} from '@/lib/reports'

import { ReportsFilters } from './components/filters'

type SearchParams = {
   view?: 'orders' | 'products'
   start?: string
   end?: string
   categoryId?: string
   brandId?: string
}

export default async function ReportsPage({
   searchParams,
}: {
   searchParams: SearchParams
}) {
   const view = (searchParams.view ?? 'orders') as 'orders' | 'products'
   const { brands, categories } = await getAllBrandsAndCategories()

   const [ordersByDate, topProducts] = await Promise.all([
      view === 'orders' ? getOrdersByDate(searchParams) : Promise.resolve(null),
      view === 'products'
         ? getTopSellingProducts(searchParams)
         : Promise.resolve(null),
   ])

   return (
      <div className="space-y-6">
         <div>
            <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
            <p className="text-sm text-muted-foreground">
               Filter by date, category, and brand.
            </p>
         </div>

         <ReportsFilters
            initial={searchParams}
            brands={brands}
            categories={categories}
         />

         <div className="rounded-2xl border p-4">
            {view === 'orders' && ordersByDate && (
               <OrdersTable rows={ordersByDate} />
            )}
            {view === 'products' && topProducts && (
               <TopProductsTable rows={topProducts} />
            )}
         </div>
      </div>
   )
}

function OrdersTable({
   rows,
}: {
   rows: Array<{ day: Date; orders: number; revenue: number }>
}) {
   return (
      <div className="overflow-x-auto">
         <table className="w-full text-sm">
            <thead className="text-left border-b">
               <tr>
                  <th className="py-2">Day</th>
                  <th className="py-2">Orders</th>
                  <th className="py-2">Revenue</th>
               </tr>
            </thead>
            <tbody>
               {rows.map((r) => (
                  <tr key={String(r.day)} className="border-b last:border-0">
                     <td className="py-2">
                        {new Date(r.day).toLocaleDateString()}
                     </td>
                     <td className="py-2">{r.orders}</td>
                     <td className="py-2">
                        ₱{(r.revenue ?? 0).toLocaleString()}
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
   )
}

function TopProductsTable({
   rows,
}: {
   rows: Array<{
      id: string
      title: string
      brand: string | null
      units: number
      revenue: number
      categories: string[]
   }>
}) {
   return (
      <div className="overflow-x-auto">
         <table className="w-full text-sm">
            <thead className="text-left border-b">
               <tr>
                  <th className="py-2">Product</th>
                  <th className="py-2">Brand</th>
                  <th className="py-2">Categories</th>
                  <th className="py-2">Units</th>
                  <th className="py-2">Revenue</th>
               </tr>
            </thead>
            <tbody>
               {rows.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                     <td className="py-2 font-medium">{p.title}</td>
                     <td className="py-2">{p.brand ?? '-'}</td>
                     <td className="py-2">{p.categories?.join(', ') ?? '-'}</td>
                     <td className="py-2">{p.units}</td>
                     <td className="py-2">
                        ₱{(p.revenue ?? 0).toLocaleString()}
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>
   )
}
