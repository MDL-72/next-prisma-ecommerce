import { NextResponse } from "next/server";
import { queryProducts } from "@/lib/products-query";

export async function GET(req: Request) {
   const { searchParams } = new URL(req.url);

   const categories = searchParams.get("categories")
      ?.split(",")
      .map(s => s.trim())
      .filter(Boolean) ?? [];

   const payload = await queryProducts({
      q: searchParams.get("q") ?? undefined,
      minPrice: searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined,
      maxPrice: searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined,
      brand: searchParams.get("brand") ?? undefined,
      categories,
      isAvailable: searchParams.get("isAvailable") === "true" ? true
         : searchParams.get("isAvailable") === "false" ? false
            : undefined,
      sort: (searchParams.get("sort") as any) ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      pageSize: searchParams.get("pageSize") ? Number(searchParams.get("pageSize")) : 12,
   });

   return NextResponse.json(payload);
}
