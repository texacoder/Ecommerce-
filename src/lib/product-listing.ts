import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { ProductCardData } from "@/components/ProductCard";

export type ListingParams = {
  q?: string;
  category?: string;
  sort?: string;
  page?: number;
  priceMin?: number;
  priceMax?: number;
  brand?: string;
  minRating?: number;
  inStockOnly?: boolean;
  minDiscount?: number;
  featured?: boolean;
  bestSeller?: boolean;
};

const PAGE_SIZE = 24;

export async function getProductListing(params: ListingParams) {
  const where: Prisma.ProductWhereInput = { deletedAt: null, status: "PUBLISHED", visible: true };
  if (params.category) where.category = { slug: params.category };
  if (params.brand) where.brand = params.brand;
  if (params.inStockOnly) where.stock = { gt: 0 };
  if (params.minDiscount) where.discountPercent = { gte: params.minDiscount };
  if (params.featured) where.isFeatured = true;
  if (params.bestSeller) where.isBestSeller = true;
  if (params.priceMin !== undefined || params.priceMax !== undefined) {
    where.price = {
      ...(params.priceMin !== undefined ? { gte: params.priceMin } : {}),
      ...(params.priceMax !== undefined ? { lte: params.priceMax } : {}),
    };
  }
  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: "insensitive" } },
      { brand: { contains: params.q, mode: "insensitive" } },
      { description: { contains: params.q, mode: "insensitive" } },
    ];
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    params.sort === "price_asc"
      ? { price: "asc" }
      : params.sort === "price_desc"
      ? { price: "desc" }
      : params.sort === "newest"
      ? { createdAt: "desc" }
      : params.sort === "popularity"
      ? { isBestSeller: "desc" }
      : { createdAt: "desc" };

  const page = Math.max(1, params.page ?? 1);

  const [products, total, brands] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: { orderBy: { position: "asc" }, take: 1 },
        _count: { select: { variants: true } },
        reviews: { where: { status: "PUBLISHED" }, select: { rating: true } },
      },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
    prisma.product.findMany({
      where: { deletedAt: null, status: "PUBLISHED", visible: true, brand: { not: null } },
      select: { brand: true },
      distinct: ["brand"],
      take: 30,
    }),
  ]);

  let cards: ProductCardData[] = products.map((p) => {
    const ratings = p.reviews.map((r) => r.rating);
    const avgRating = ratings.length ? ratings.reduce((s, r) => s + r, 0) / ratings.length : null;
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice,
      discountPercent: p.discountPercent,
      stock: p.stock,
      isNewArrival: p.isNewArrival,
      isBestSeller: p.isBestSeller,
      image: p.images[0]?.url ?? null,
      hasVariants: p._count.variants > 0,
      rating: avgRating,
      reviewCount: ratings.length,
    };
  });

  if (params.sort === "rating") {
    cards = cards.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }
  if (params.minRating) {
    cards = cards.filter((c) => (c.rating ?? 0) >= params.minRating!);
  }

  return {
    products: cards,
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    availableBrands: brands.map((b) => b.brand).filter(Boolean) as string[],
  };
}
