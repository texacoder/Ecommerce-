import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

const schema = z.object({
  fullName: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().optional().nullable(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().min(1),
  isDefault: z.boolean().optional().default(false),
});

export async function GET() {
  try {
    const user = await requireUser();
    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ addresses });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());

    if (body.isDefault) {
      await prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }

    const address = await prisma.address.create({ data: { ...body, userId: user.id } });
    return NextResponse.json({ address }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
