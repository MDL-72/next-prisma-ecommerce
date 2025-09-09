import { ProductGrid, ProductSkeletonGrid } from '@/components/native/Product'
import { Heading } from '@/components/native/heading'
import { Separator } from '@/components/native/separator'
import prisma from '@/lib/prisma'
import { queryProducts } from '@/lib/products-query'
import { isVariableValid } from '@/lib/utils'

import { Filters } from './components/filters'

export default async function Products({ searchParams }) {
   const {
      q,
      sort,
      isAvailable,
      brand,
      categories,
      minPrice,
      maxPrice,
      page = '1',
      pageSize = '12',
   } = searchParams ?? {}

   // Preload options (SS)
   const [brands, cats] = await Promise.all([
      prisma.brand.findMany({ orderBy: { title: 'asc' } }),
      prisma.category.findMany({ orderBy: { title: 'asc' } }),
   ])

   // Data (SS/Prisma)
   const data = await queryProducts({
      q,
      sort,
      brand,
      categories: categories ? String(categories).split(',') : [],
      isAvailable:
         isAvailable === 'true'
            ? true
            : isAvailable === 'false'
              ? false
              : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      page: Number(page),
      pageSize: Number(pageSize),
   })

   return (
      <>
         <Heading
            title="Products"
            description="Below is a list of products you have in your cart."
         />
         <Filters
            brands={brands.map((b) => b.title)}
            categories={cats.map((c) => c.title)}
            initial={{
               q: q ?? '',
               brand: brand ?? '',
               categories: categories ? String(categories).split(',') : [],
               isAvailable: isAvailable ?? '',
               sort: sort ?? 'title_asc',
               minPrice: minPrice ?? '',
               maxPrice: maxPrice ?? '',
            }}
         />
         <Separator />
         {isVariableValid(data.items) ? (
            <ProductGrid products={data.items} />
         ) : (
            <ProductSkeletonGrid />
         )}
      </>
   )
}
