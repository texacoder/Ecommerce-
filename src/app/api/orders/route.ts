import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { computeQuote, recordCouponUsage, PricingError } from "@/lib/pricing";
import { errorResponse, generateOrderNumber } from "@/lib/api";
import { getRazorpayClient, isRazorpayConfigured } from "@/lib/razorpay";

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
  paymentMethod: z.enum(["online", "cod"]).optional().default("online"),
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

    // Re-checked here rather than trusted from the client - the client only
    // decides whether to show the COD option, not whether it's actually
    // allowed.
    if (body.paymentMethod === "cod" && !quote.codAvailable) {
      return NextResponse.json(
        { error: "Cash on Delivery isn't available for one or more items in your cart" },
        { status: 400 }
      );
    }

    const order = await prisma.$transaction(async (tx) => {
      // Atomic conditional decrement: the stock check and the write happen
      // in the same UPDATE statement (WHERE stock >= quantity), so two
      // concurrent checkouts racing for the last unit can't both pass a
      // stale read and oversell — the second one's WHERE simply matches
      // zero rows once the first has committed its decrement.
      for (const item of quote.items) {
        if (item.variantId) {
          const result = await tx.productVariant.updateMany({
            where: { id: item.variantId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (result.count === 0) {
            throw new PricingError(`"${item.name}" no longer has enough stock`);
          }
        } else {
          const result = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (result.count === 0) {
            throw new PricingError(`"${item.name}" no longer has enough stock`);
          }
        }
      }

      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: user.id,
          // A COD order has nothing to wait on payment-wise, so it's
          // confirmed immediately; an online order stays PENDING until
          // verify-payment/webhook marks it paid.
          status: body.paymentMethod === "cod" ? "CONFIRMED" : "PENDING",
          subtotal: quote.subtotal,
          discount: quote.discount,
          shipping: quote.shipping,
          tax: quote.tax,
          total: quote.total,
          couponCode: quote.couponCode,
          addressId,
          addressSnapshot: JSON.stringify(addressSnapshot),
          paymentProvider: body.paymentMethod === "cod" ? "cod" : "razorpay",
          paymentStatus: "PENDING",
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

    // A COD order needs no payment gateway step at all - it's already
    // CONFIRMED, and payment is collected in cash at delivery.
    if (body.paymentMethod === "cod") {
      return NextResponse.json(
        { order, payment: null, paymentConfigured: false, paymentMethod: "cod" },
        { status: 201 }
      );
    }

    // Stock is already reserved (decremented above). Now open a payment
    // attempt: create a real Razorpay order server-side so the amount the
    // customer is charged can never be manipulated from the client.
    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        {
          order,
          payment: null,
          paymentConfigured: false,
          message:
            "Payment gateway is not configured in this environment. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to enable real checkout.",
        },
        { status: 201 }
      );
    }

    const razorpay = getRazorpayClient()!;
    const razorpayOrder = await razorpay.orders.create({
      amount: order.total,
      currency: order.currency,
      receipt: order.orderNumber,
      notes: { orderId: order.id },
    });

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "razorpay",
        providerOrderId: razorpayOrder.id,
        amount: order.total,
        currency: order.currency,
        status: "PENDING",
      },
    });

    return NextResponse.json(
      {
        order,
        payment,
        paymentConfigured: true,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        razorpayOrderId: razorpayOrder.id,
      },
      { status: 201 }
    );
  } catch (err) {
    return errorResponse(err);
  }
}
