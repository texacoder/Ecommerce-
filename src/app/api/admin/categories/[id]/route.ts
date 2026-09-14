import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { errorResponse, slugify } from "@/lib/api";

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  visible: z.boolean().optional(),
  parentId: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = updateSchema.parse(await req.json());

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    if (body.parentId === id) {
      return NextResponse.json({ error: "A category cannot be its own parent" }, { status: 400 });
    }

    const data: Record<string, unknown> = { ...body };
    if (body.name && body.name !== existing.name) {
      const slug = slugify(body.name);
      let suffix = 0;
      while (
        await prisma.category.findFirst({
          where: { slug: suffix ? `${slug}-${suffix}` : slug, NOT: { id } },
        })
      ) {
        suffix += 1;
      }
      data.slug = suffix ? `${slug}-${suffix}` : slug;
    }

    const category = await prisma.category.update({ where: { id }, data });
    return NextResponse.json({ category });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    if (searchParams.get("confirm") !== "true") {
      return NextResponse.json(
        { error: "Deletion requires confirm=true to prevent accidental deletion" },
        { status: 400 }
      );
    }

    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true, children: true } } },
    });
    if (!existing) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    if (existing._count.children > 0) {
      return NextResponse.json(
        { error: "Delete or reassign subcategories before deleting this category" },
        { status: 409 }
      );
    }

    // Unassign products rather than blocking deletion outright; product rows
    // (and any historical order snapshots) are unaffected.
    await prisma.$transaction([
      prisma.product.updateMany({ where: { categoryId: id }, data: { categoryId: null } }),
      prisma.category.delete({ where: { id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
