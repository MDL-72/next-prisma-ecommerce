import prisma from '@/lib/prisma'

export type DateRange = { start?: string; end?: string }
export type Filters = DateRange & { categoryId?: string; brandId?: string; limit?: number }

function toDateBoundary({ start, end }: DateRange) {
    const s = start ? new Date(start) : new Date(0)   // 1970-01-01
    const e = end ? new Date(end) : new Date()      // now
    return { s, e }
}

/** Orders grouped by day — revenue from Order.payable (paid orders only) */
export async function getOrdersByDate(range: DateRange) {
    const { s, e } = toDateBoundary(range)

    const rows = await prisma.$queryRaw<
        Array<{ day: Date; orders: bigint; revenue: number }>
    >`
    SELECT
      date_trunc('day', o."createdAt") AS day,
      COUNT(*) AS orders,
      COALESCE(SUM(o."payable"), 0) AS revenue
    FROM "Order" o
    WHERE o."createdAt" BETWEEN ${s} AND ${e}
      AND o."isPaid" = true
    GROUP BY 1
    ORDER BY 1 ASC;
  `
    return rows.map(r => ({ ...r, orders: Number(r.orders) }))
}

/** Top products — units + revenue from items (count * (price - discount)) */
export async function getTopSellingProducts(filters: Filters) {
    const { s, e } = toDateBoundary(filters)
    const limit = filters.limit ?? 10
    const brandId = filters.brandId ?? null
    const categoryId = filters.categoryId ?? null

    const rows = await prisma.$queryRaw<
        Array<{ id: string; title: string; brand: string | null; units: number; revenue: number; categories: string[] }>
    >`
    SELECT
      p.id,
      p.title,
      b.title AS brand,
      COALESCE(SUM(oi.count), 0) AS units,
      COALESCE(SUM(oi.count * (oi.price - COALESCE(oi.discount, 0))), 0) AS revenue,
      ARRAY_REMOVE(ARRAY_AGG(DISTINCT c.title), NULL) AS categories
    FROM "OrderItem" oi
    JOIN "Order" o ON o.id = oi."orderId"
    JOIN "Product" p ON p.id = oi."productId"
    LEFT JOIN "Brand" b ON b.id = p."brandId"
    LEFT JOIN "_CategoryToProduct" cp ON cp."B" = p.id
    LEFT JOIN "Category" c ON c.id = cp."A"
    WHERE o."createdAt" BETWEEN ${s} AND ${e}
      AND o."isPaid" = true
      AND (${brandId}::text IS NULL OR p."brandId" = ${brandId})
      AND (${categoryId}::text IS NULL OR EXISTS (
        SELECT 1 FROM "_CategoryToProduct" cp2
        WHERE cp2."B" = p.id AND cp2."A" = ${categoryId}
      ))
    GROUP BY p.id, p.title, b.title
    ORDER BY units DESC, revenue DESC
    LIMIT ${limit};
  `
    return rows
}

/** For the dropdowns */
export async function getAllBrandsAndCategories() {
    const [brands, categories] = await Promise.all([
        prisma.brand.findMany({ select: { id: true, title: true }, orderBy: { title: 'asc' } }),
        prisma.category.findMany({ select: { id: true, title: true }, orderBy: { title: 'asc' } }),
    ])
    return { brands, categories }
}
