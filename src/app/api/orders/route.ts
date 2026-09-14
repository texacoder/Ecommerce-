import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { computeQuote, recordCouponUsage, PricingError } from "@/lib/pricing";
import { errorResponse, generateOrderNumber } from "@/lib/api";

const addressSchema = z.object({
  fullName: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional().nullable(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().min(1),
  saveAddress: z.boolean().optional().default(false),
});

const createSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantId: z.string().optional().nullable(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
  couponCode: z.string().optional().nullable(),
  addressId: z.string().optional(),
  address: addressSchema.optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") ?? "20")));

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: user.id },
        include: { items: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where: { userId: user.id } }),
    ]);

    return NextResponse.json({ orders, total, page, pageSize });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = createSchema.parse(await req.json());

    if (!body.addressId && !body.address) {
      return NextResponse.json({ error: "A delivery address is required" }, { status: 400 });
    }

    let addressId: string | null = null;
    let addressSnapshot: Record<string, unknown>;

    if (body.addressId) {
      const addr = await prisma.address.findFirst({ where: { id: body.addressId, userId: user.id } });
      if (!addr) return NextResponse.json({ error: "Address not found" }, { status: 404 });
      addressId = addr.id;
      addressSnapshot = addr;
    } else {
      const a = body.address!;
      if (a.saveAddress) {
        const saved = await prisma.address.create({
          data: {
            userId: user.id,
            fullName: a.fullName,
            line1: a.line1,
            line2: a.line2 ?? null,
            city: a.city,
            state: a.state,
            postalCode: a.postalCode,
            country: a.country,
            phone: a.phone,
          },
        });
        addressId = saved.id;
      }
      addressSnapshot = a;
    }

    // Compute + validate everything (prices, stock, coupon) server-side.
    const quote = await computeQuote(body.items, body.couponCode, user.id);
    if (body.couponCode && quote.couponError) {
      return NextResponse.json({ error: quote.couponError }, { status: 400 });
    }

    const order = await prisma.$transaction(async (tx) => {
      // Re-check stock inside the transaction to close the race window
      // between the quote and the actual write.
      for (const item of quote.items) {
        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
          if (!variant || variant.stock < item.quantity) {
            throw new PricingError(`"${item.name}" no longer has enough stock`);
          }
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        } else {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product || product.stock < item.quantity) {
            throw new PricingError(`"${item.name}" no longer has enough stock`);
          }
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: user.id,
          status: "PENDING",
          subtotal: quote.subtotal,
          discount: quote.discount,
          shipping: quote.shipping,
          tax: quote.tax,
          total: quote.total,
          couponCode: quote.couponCode,
          addressId,
          addressSnapshot: JSON.stringify(addressSnapshot),
          paymentProvider: "manual",
          paymentStatus: "PAID",
          items: {
            create: quote.items.map((i) => ({
              productId: i.productId,
              variantId: i.variantId,
              nameSnapshot: i.name,
              skuSnapshot: i.sku,
              priceSnapshot: i.unitPrice,
              imageSnapshot: i.image,
              quantity: i.quantity,
            })),
          },
        },
        include: { items: true },
      });

      if (quote.couponCode) {
        await recordCouponUsage(tx, quote.couponCode, user.id, created.id);
      }

      return created;
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
