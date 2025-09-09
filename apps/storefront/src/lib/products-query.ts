// lib/products-query.ts
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export type ProductQuery = {
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;               // brand title (or slug if you have one)
  categories?: string[];        // array of category titles/slugs
  isAvailable?: boolean;
  sort?: "price_desc" | "price_asc" | "title_asc" | "title_desc";
  page?: number;
  pageSize?: number;
};

export function getOrderBy(sort?: ProductQuery["sort"]) {
  switch (sort) {
    case "price_desc":
      return { price: "desc" } as const;
    case "price_asc":
      return { price: "asc" } as const;
    case "title_desc":
      return { title: "desc" } as const;
    default:
      return { title: "asc" } as const;
  }
}

export function buildWhere(q: ProductQuery) {
  const AND: any[] = [];

  if (q.q?.trim()) {
    AND.push({
      OR: [
        { title: { contains: q.q, mode: "insensitive" } },
        { description: { contains: q.q, mode: "insensitive" } },
      ],
    });
  }

  if (q.isAvailable !== undefined) {
    AND.push({ isAvailable: q.isAvailable });
  }

  if (q.brand?.trim()) {
    AND.push({
      brand: { title: { contains: q.brand, mode: "insensitive" } },
    });
  }

  if (q.categories && q.categories.length) {
    AND.push({
      categories: {
        some: {
          title: { in: q.categories, mode: "insensitive" },
        },
      },
    });
  }

  if (q.minPrice !== undefined || q.maxPrice !== undefined) {
    AND.push({
      price: {
        gte: q.minPrice ?? undefined,
        lte: q.maxPrice ?? undefined,
      },
    });
  }

  return AND.length ? { AND } : {};
}

// ---- Include cross-sells so callers get the property typed correctly
const include = {
  brand: true,
  categories: true,
  crossSellProducts: {
    select: {
      id: true,
      title: true,
      price: true,
      // image: true,
      // slug: true,
    },
  },
} satisfies Prisma.ProductInclude;

export type ProductWithCrossSells = Prisma.ProductGetPayload<{
  include: typeof include;
}>;

export async function queryProducts(params: ProductQuery) {
  const pageSize = Math.min(Math.max(params.pageSize ?? 12, 1), 60);
  const page = Math.max(params.page ?? 1, 1);
  const where = buildWhere(params);
  const [items, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      orderBy: getOrderBy(params.sort),
      include: {
        brand: true,
        categories: true,
        crossSellProducts: { select: { id: true, title: true, price: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ])
  

  return {
    items,
    total,
    page,
    pageSize,
    pages: Math.max(Math.ceil(total / pageSize), 1),
  };
}
