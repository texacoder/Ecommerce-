import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { errorResponse, slugify } from "@/lib/api";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  visible: z.boolean().optional().default(true),
  parentId: z.string().optional().nullable(),
});

export async function GET() {
  try {
    await requireAdmin();
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true, children: true } }, parent: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ categories });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = createSchema.parse(await req.json());

    // The rest of the app (breadcrumbs, homepage featured sections, category
    // pages) only ever looks one level deep - a category's own children, not
    // grandchildren. Nesting a subcategory under another subcategory would
    // create a level nothing displays or aggregates, so products placed
    // there would just silently never show up anywhere they're expected to.
    if (body.parentId) {
      const targetParent = await prisma.category.findUnique({ where: { id: body.parentId } });
      if (!targetParent) return NextResponse.json({ error: "Parent category not found" }, { status: 404 });
      if (targetParent.parentId) {
        return NextResponse.json(
          { error: "A subcategory cannot itself be used as a parent category" },
          { status: 400 }
        );
      }
    }

    let slug = slugify(body.name);
    let suffix = 0;
    while (await prisma.category.findUnique({ where: { slug: suffix ? `${slug}-${suffix}` : slug } })) {
      suffix += 1;
    }
    if (suffix) slug = `${slug}-${suffix}`;

    const category = await prisma.category.create({
      data: {
        name: body.name,
        slug,
        description: body.description ?? null,
        imageUrl: body.imageUrl ?? null,
        visible: body.visible,
        parentId: body.parentId ?? null,
      },
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
