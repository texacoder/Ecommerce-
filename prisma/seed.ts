import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function placeholder(text: string, bg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
    <rect width="100%" height="100%" fill="${bg}"/>
    <text x="50%" y="50%" font-size="36" font-family="sans-serif" fill="white" text-anchor="middle" dominant-baseline="middle">${text}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("Seeding database...");

  const adminPasswordHash = await bcrypt.hash("Admin123!", 10);
  await prisma.user.upsert({
    where: { email: "texacoderzz@gmail.com" },
    update: { role: "ADMIN", status: "ACTIVE" },
    create: {
      email: "texacoderzz@gmail.com",
      name: "Store Admin",
      role: "ADMIN",
      status: "ACTIVE",
      passwordHash: adminPasswordHash,
    },
  });

  const customerPasswordHash = await bcrypt.hash("Customer123!", 10);
  const customer = await prisma.user.upsert({
    where: { email: "customer@example.com" },
    update: {},
    create: {
      email: "customer@example.com",
      name: "Jamie Rivera",
      role: "CUSTOMER",
      status: "ACTIVE",
      passwordHash: customerPasswordHash,
    },
  });

  await prisma.address.upsert({
    where: { id: "seed-address-1" },
    update: {},
    create: {
      id: "seed-address-1",
      userId: customer.id,
      fullName: "Jamie Rivera",
      line1: "123 Market Street",
      line2: "Apt 4B",
      city: "San Francisco",
      state: "CA",
      postalCode: "94103",
      country: "USA",
      phone: "555-0100",
      isDefault: true,
    },
  });

  const categoryDefs = [
    { name: "Electronics", children: ["Headphones", "Laptops", "Smart Home"] },
    { name: "Clothing", children: ["Men", "Women"] },
    { name: "Home & Kitchen", children: ["Cookware", "Furniture"] },
  ];

  const categories: Record<string, string> = {};
  for (const def of categoryDefs) {
    const parent = await prisma.category.upsert({
      where: { slug: slugify(def.name) },
      update: {},
      create: {
        name: def.name,
        slug: slugify(def.name),
        visible: true,
        imageUrl: placeholder(def.name, "#4f46e5"),
      },
    });
    categories[def.name] = parent.id;
    for (const childName of def.children) {
      const child = await prisma.category.upsert({
        where: { slug: slugify(`${def.name}-${childName}`) },
        update: {},
        create: {
          name: childName,
          slug: slugify(`${def.name}-${childName}`),
          visible: true,
          parentId: parent.id,
          imageUrl: placeholder(childName, "#6366f1"),
        },
      });
      categories[childName] = child.id;
    }
  }

  const productDefs = [
    {
      name: "Aurora Wireless Headphones",
      sku: "AUR-HP-001",
      brand: "Aurora",
      category: "Headphones",
      price: 12999,
      originalPrice: 15999,
      discountPercent: 19,
      stock: 40,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      color: "#0ea5e9",
      description: "Over-ear wireless headphones with active noise cancellation and 30-hour battery life.",
      specifications: JSON.stringify({ "Battery Life": "30 hours", "Bluetooth": "5.3", "Weight": "250g" }),
      variants: [
        { name: "Color: Black", sku: "AUR-HP-001-BLK", stock: 20 },
        { name: "Color: White", sku: "AUR-HP-001-WHT", stock: 20 },
      ],
    },
    {
      name: "Nimbus 14 Laptop",
      sku: "NIM-LT-014",
      brand: "Nimbus",
      category: "Laptops",
      price: 89999,
      originalPrice: null,
      discountPercent: null,
      stock: 15,
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: true,
      color: "#334155",
      description: "14-inch ultralight laptop with 16GB RAM, 512GB SSD, and all-day battery.",
      specifications: JSON.stringify({ "RAM": "16GB", "Storage": "512GB SSD", "Display": "14in 2.8K" }),
      variants: [],
    },
    {
      name: "Halo Smart Speaker",
      sku: "HAL-SS-002",
      brand: "Halo",
      category: "Smart Home",
      price: 4999,
      originalPrice: 5999,
      discountPercent: 17,
      stock: 3,
      isFeatured: false,
      isBestSeller: true,
      isNewArrival: false,
      color: "#f59e0b",
      description: "Voice-controlled smart speaker with rich bass and smart home integration.",
      specifications: JSON.stringify({ "Connectivity": "Wi-Fi, Bluetooth", "Voice Assistant": "Built-in" }),
      variants: [],
    },
    {
      name: "Everyday Crewneck Tee",
      sku: "EDT-TS-100",
      brand: "Everyday",
      category: "Men",
      price: 2499,
      originalPrice: null,
      discountPercent: null,
      stock: 120,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: true,
      color: "#16a34a",
      description: "Soft, breathable 100% cotton crewneck t-shirt for everyday wear.",
      specifications: JSON.stringify({ "Material": "100% Cotton", "Fit": "Regular" }),
      variants: [
        { name: "Size: S", sku: "EDT-TS-100-S", stock: 30 },
        { name: "Size: M", sku: "EDT-TS-100-M", stock: 40 },
        { name: "Size: L", sku: "EDT-TS-100-L", stock: 50 },
      ],
    },
    {
      name: "Willow Midi Dress",
      sku: "WIL-DR-200",
      brand: "Willow",
      category: "Women",
      price: 5999,
      originalPrice: 7499,
      discountPercent: 20,
      stock: 0,
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: true,
      color: "#db2777",
      description: "Flowy midi dress with a flattering silhouette, perfect for any occasion.",
      specifications: JSON.stringify({ "Material": "Viscose blend" }),
      variants: [],
    },
    {
      name: "CastIron Pro Skillet",
      sku: "CIP-SK-010",
      brand: "CastIron Pro",
      category: "Cookware",
      price: 3999,
      originalPrice: null,
      discountPercent: null,
      stock: 60,
      isFeatured: false,
      isBestSeller: true,
      isNewArrival: false,
      color: "#78716c",
      description: "Pre-seasoned 12-inch cast iron skillet built to last a lifetime.",
      specifications: JSON.stringify({ "Size": "12 inch", "Material": "Cast Iron" }),
      variants: [],
    },
    {
      name: "Sable Oak Coffee Table",
      sku: "SBL-CT-020",
      brand: "Sable",
      category: "Furniture",
      price: 24999,
      originalPrice: 29999,
      discountPercent: 17,
      stock: 8,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: false,
      color: "#92400e",
      description: "Solid oak coffee table with a hand-finished natural grain top.",
      specifications: JSON.stringify({ "Material": "Solid Oak", "Dimensions": "48x24x18 in" }),
      variants: [],
    },
    {
      name: "Pulse Fitness Tracker",
      sku: "PLS-FT-030",
      brand: "Pulse",
      category: "Smart Home",
      price: 7999,
      originalPrice: null,
      discountPercent: null,
      stock: 4,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: true,
      color: "#0891b2",
      description: "Track heart rate, sleep, and workouts with a bright always-on display.",
      specifications: JSON.stringify({ "Battery Life": "7 days", "Water Resistance": "5ATM" }),
      variants: [],
    },
  ];

  for (const def of productDefs) {
    const slug = slugify(def.name);
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) continue;

    await prisma.product.create({
      data: {
        name: def.name,
        slug,
        description: def.description,
        specifications: def.specifications,
        price: def.price,
        originalPrice: def.originalPrice,
        discountPercent: def.discountPercent,
        sku: def.sku,
        brand: def.brand,
        categoryId: categories[def.category],
        stock: def.stock,
        status: "PUBLISHED",
        isFeatured: def.isFeatured,
        isBestSeller: def.isBestSeller,
        isNewArrival: def.isNewArrival,
        visible: true,
        images: {
          create: [
            { url: placeholder(def.name, def.color), position: 0 },
            { url: placeholder(`${def.brand}`, def.color), position: 1 },
          ],
        },
        variants: { create: def.variants },
      },
    });
  }

  const headphones = await prisma.product.findUnique({ where: { slug: "aurora-wireless-headphones" } });
  const dress = await prisma.product.findUnique({ where: { slug: "willow-midi-dress" } });

  if (headphones) {
    await prisma.review.upsert({
      where: { productId_userId: { productId: headphones.id, userId: customer.id } },
      update: {},
      create: {
        productId: headphones.id,
        userId: customer.id,
        rating: 5,
        title: "Fantastic sound",
        body: "The noise cancellation is excellent and battery life is as advertised.",
        status: "PUBLISHED",
      },
    });
  }

  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      type: "PERCENT",
      value: 10,
      minOrderValue: 2000,
      usageLimit: 500,
      perCustomerLimit: 1,
      active: true,
    },
  });

  if (dress) {
    await prisma.coupon.upsert({
      where: { code: "DRESS20" },
      update: {},
      create: {
        code: "DRESS20",
        type: "FIXED",
        value: 1000,
        productId: dress.id,
        active: true,
      },
    });
  }

  if (headphones) {
    await prisma.promotion.upsert({
      where: { id: "seed-banner-1" },
      update: {},
      create: {
        id: "seed-banner-1",
        type: "BANNER",
        title: "Big Savings on Audio",
        subtitle: "Save up to 20% on select headphones this week only",
        imageUrl: placeholder("Audio Sale", "#4f46e5"),
        linkUrl: `/products/${headphones.slug}`,
        productId: headphones.id,
        position: 0,
        active: true,
      },
    });
  }

  await prisma.promotion.upsert({
    where: { id: "seed-deal-1" },
    update: {},
    create: {
      id: "seed-deal-1",
      type: "DEAL",
      title: "Deal of the Day",
      subtitle: "Halo Smart Speaker at 17% off",
      position: 0,
      active: true,
    },
  });

  console.log("Seed complete.");
  console.log(`Admin login: texacoderzz@gmail.com / Admin123!`);
  console.log(`Customer login: customer@example.com / Customer123!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
