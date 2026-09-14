import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { errorResponse, slugify } from "@/lib/api";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  specifications: z.string().optional().nullable(),
  price: z.number().int().min(0),
  originalPrice: z.number().int().min(0).optional().nullable(),
  discountPercent: z.number().int().min(0).max(100).optional().nullable(),
  sku: z.string().min(1).max(80),
  brand: z.string().max(120).optional().nullable(),
  categoryId: z.string().optional().nullable(),
  stock: z.number().int().min(0).default(0),
  status: z.enum(["PUBLISHED", "DRAFT", "UNPUBLISHED"]).default("DRAFT"),
  isFeatured: z.boolean().optional().default(false),
  isBestSeller: z.boolean().optional().default(false),
  isNewArrival: z.boolean().optional().default(false),
  visible: z.boolean().optional().default(true),
  images: z.array(z.string()).optional().default([]),
});

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const status = searchParams.get("status");
    const includeDeleted = searchParams.get("includeDeleted") === "true";
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? "25")));

    const where: Record<string, unknown> = {};
    if (!includeDeleted) where.deletedAt = null;
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { sku: { contains: q } },
        { brand: { contains: q } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, images: { orderBy: { position: "asc" } }, variants: true },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({ products, total, page, pageSize });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = createSchema.parse(await req.json());

    const existingSku = await prisma.product.findUnique({ where: { sku: body.sku } });
    if (existingSku) {
      return NextResponse.json({ error: "A product with this SKU already exists" }, { status: 409 });
    }

    let slug = slugify(body.name);
    let suffix = 0;
    while (await prisma.product.findUnique({ where: { slug: suffix ? `${slug}-${suffix}` : slug } })) {
      suffix += 1;
    }
    if (suffix) slug = `${slug}-${suffix}`;

    const product = await prisma.product.create({
      data: {
        name: body.name,
        slug,
        description: body.description ?? null,
        specifications: body.specifications ?? null,
        price: body.price,
        originalPrice: body.originalPrice ?? null,
        discountPercent: body.discountPercent ?? null,
        sku: body.sku,
        brand: body.brand ?? null,
        categoryId: body.categoryId ?? null,
        stock: body.stock,
        status: body.status,
        isFeatured: body.isFeatured,
        isBestSeller: body.isBestSeller,
        isNewArrival: body.isNewArrival,
        visible: body.visible,
        images: {
          create: body.images.map((url, position) => ({ url, position })),
        },
      },
      include: { category: true, images: true, variants: true },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
