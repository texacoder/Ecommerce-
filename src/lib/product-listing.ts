import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { ProductCardData } from "@/components/ProductCard";

export type ListingParams = {
  q?: string;
  category?: string;
  sort?: string;
  page?: number;
};

const PAGE_SIZE = 24;

export async function getProductListing(params: ListingParams) {
  const where: Prisma.ProductWhereInput = { deletedAt: null, status: "PUBLISHED", visible: true };
  if (params.category) where.category = { slug: params.category };
  if (params.q) {
    where.OR = [
      { name: { contains: params.q } },
      { brand: { contains: params.q } },
      { description: { contains: params.q } },
    ];
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    params.sort === "price_asc"
      ? { price: "asc" }
      : params.sort === "price_desc"
      ? { price: "desc" }
      : params.sort === "name"
      ? { name: "asc" }
      : { createdAt: "desc" };

  const page = Math.max(1, params.page ?? 1);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { images: { orderBy: { position: "asc" }, take: 1 }, _count: { select: { variants: true } } },
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);

  const cards: ProductCardData[] = products.map((p) => ({
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
  }));

  return { products: cards, total, page, pageSize: PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
