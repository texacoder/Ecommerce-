import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function placeholder(text: string, bg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
    <rect width="100%" height="100%" fill="${bg}"/>
    <text x="50%" y="50%" font-size="34" font-family="sans-serif" fill="white" text-anchor="middle" dominant-baseline="middle">${escapeXml(text)}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// All prices are in paise (₹1 = 100 paise), matching what Razorpay expects.
const rupees = (n: number) => n * 100;

export async function seedDatabase(prisma: PrismaClient, adminEmail: string) {
  const log: string[] = [];
  log.push(`Seeding NEXORA database (admin: ${adminEmail})...`);

  const adminPasswordHash = await bcrypt.hash("Admin123!", 10);
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN", status: "ACTIVE" },
    create: {
      email: adminEmail,
      name: "NEXORA Admin",
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
      name: "Priya Sharma",
      role: "CUSTOMER",
      status: "ACTIVE",
      passwordHash: customerPasswordHash,
    },
  });

  const secondCustomer = await prisma.user.upsert({
    where: { email: "rahul@example.com" },
    update: {},
    create: {
      email: "rahul@example.com",
      name: "Rahul Verma",
      role: "CUSTOMER",
      status: "ACTIVE",
      passwordHash: await bcrypt.hash("Customer123!", 10),
    },
  });

  await prisma.address.upsert({
    where: { id: "seed-address-1" },
    update: {},
    create: {
      id: "seed-address-1",
      userId: customer.id,
      fullName: "Priya Sharma",
      line1: "402, Lotus Heights",
      line2: "Andheri West",
      city: "Mumbai",
      state: "Maharashtra",
      postalCode: "400058",
      country: "India",
      phone: "9876543210",
      isDefault: true,
    },
  });

  const categoryDefs: { name: string; color: string; children: string[] }[] = [
    { name: "Electronics", color: "#0e7c6b", children: ["Headphones", "Laptops", "Smart Home", "Mobiles"] },
    { name: "Fashion", color: "#b33a1f", children: ["Men", "Women", "Footwear"] },
    { name: "Home & Kitchen", color: "#8a5a2b", children: ["Cookware", "Furniture", "Decor"] },
    { name: "Beauty", color: "#c2417a", children: ["Skincare", "Haircare"] },
    { name: "Accessories", color: "#5b6472", children: ["Bags", "Watches"] },
    { name: "Sports", color: "#1f7a3d", children: ["Fitness", "Outdoor"] },
  ];

  const categories: Record<string, string> = {};
  for (const def of categoryDefs) {
    const parent = await prisma.category.upsert({
      where: { slug: slugify(def.name) },
      update: { imageUrl: placeholder(def.name, def.color) },
      create: {
        name: def.name,
        slug: slugify(def.name),
        visible: true,
        imageUrl: placeholder(def.name, def.color),
      },
    });
    categories[def.name] = parent.id;
    for (const childName of def.children) {
      const child = await prisma.category.upsert({
        where: { slug: slugify(`${def.name}-${childName}`) },
        update: { imageUrl: placeholder(childName, def.color) },
        create: {
          name: childName,
          slug: slugify(`${def.name}-${childName}`),
          visible: true,
          parentId: parent.id,
          imageUrl: placeholder(childName, def.color),
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
      price: rupees(2999),
      originalPrice: rupees(3999),
      discountPercent: 25,
      stock: 40,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      color: "#0ea5e9",
      description: "Over-ear wireless headphones with active noise cancellation and 30-hour battery life.",
      specifications: JSON.stringify({ "Battery Life": "30 hours", Bluetooth: "5.3", Weight: "250g" }),
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
      price: rupees(64999),
      originalPrice: rupees(74999),
      discountPercent: 13,
      stock: 15,
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: true,
      color: "#334155",
      description: "14-inch ultralight laptop with 16GB RAM, 512GB SSD, and all-day battery.",
      specifications: JSON.stringify({ RAM: "16GB", Storage: "512GB SSD", Display: "14in 2.8K" }),
      variants: [],
    },
    {
      name: "Halo Smart Speaker",
      sku: "HAL-SS-002",
      brand: "Halo",
      category: "Smart Home",
      price: rupees(1499),
      originalPrice: rupees(1899),
      discountPercent: 21,
      stock: 3,
      isFeatured: false,
      isBestSeller: true,
      isNewArrival: false,
      color: "#f59e0b",
      description: "Voice-controlled smart speaker with rich bass and smart home integration.",
      specifications: JSON.stringify({ Connectivity: "Wi-Fi, Bluetooth", "Voice Assistant": "Built-in" }),
      variants: [],
    },
    {
      name: "Pulse 5G Smartphone",
      sku: "PLS-MB-050",
      brand: "Pulse",
      category: "Mobiles",
      price: rupees(18999),
      originalPrice: rupees(21999),
      discountPercent: 14,
      stock: 25,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: true,
      color: "#1d4ed8",
      description: "6.5-inch AMOLED display, 5G ready, 128GB storage with a 5000mAh all-day battery.",
      specifications: JSON.stringify({ Display: "6.5in AMOLED", Storage: "128GB", Battery: "5000mAh" }),
      variants: [
        { name: "Storage: 128GB", sku: "PLS-MB-050-128", stock: 15, priceOverride: null as number | null },
        { name: "Storage: 256GB", sku: "PLS-MB-050-256", stock: 10, priceOverride: rupees(21999) as number | null },
      ],
    },
    {
      name: "Everyday Crewneck Tee",
      sku: "EDT-TS-100",
      brand: "Everyday",
      category: "Men",
      price: rupees(499),
      originalPrice: null,
      discountPercent: null,
      stock: 120,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: true,
      color: "#16a34a",
      description: "Soft, breathable 100% cotton crewneck t-shirt for everyday wear.",
      specifications: JSON.stringify({ Material: "100% Cotton", Fit: "Regular" }),
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
      price: rupees(1799),
      originalPrice: rupees(2299),
      discountPercent: 22,
      stock: 0,
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: true,
      color: "#db2777",
      description: "Flowy midi dress with a flattering silhouette, perfect for any occasion.",
      specifications: JSON.stringify({ Material: "Viscose blend" }),
      variants: [],
    },
    {
      name: "Strider Running Shoes",
      sku: "STR-FW-300",
      brand: "Strider",
      category: "Footwear",
      price: rupees(2199),
      originalPrice: rupees(2999),
      discountPercent: 27,
      stock: 55,
      isFeatured: false,
      isBestSeller: true,
      isNewArrival: false,
      color: "#ea580c",
      description: "Lightweight running shoes with breathable mesh upper and cushioned sole.",
      specifications: JSON.stringify({ Material: "Mesh", "Sole": "EVA cushioned" }),
      variants: [
        { name: "Size: 8", sku: "STR-FW-300-8", stock: 15 },
        { name: "Size: 9", sku: "STR-FW-300-9", stock: 20 },
        { name: "Size: 10", sku: "STR-FW-300-10", stock: 20 },
      ],
    },
    {
      name: "CastIron Pro Skillet",
      sku: "CIP-SK-010",
      brand: "CastIron Pro",
      category: "Cookware",
      price: rupees(1299),
      originalPrice: null,
      discountPercent: null,
      stock: 60,
      isFeatured: false,
      isBestSeller: true,
      isNewArrival: false,
      color: "#78716c",
      description: "Pre-seasoned 12-inch cast iron skillet built to last a lifetime.",
      specifications: JSON.stringify({ Size: "12 inch", Material: "Cast Iron" }),
      variants: [],
    },
    {
      name: "Sable Oak Coffee Table",
      sku: "SBL-CT-020",
      brand: "Sable",
      category: "Furniture",
      price: rupees(8999),
      originalPrice: rupees(10999),
      discountPercent: 18,
      stock: 8,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: false,
      color: "#92400e",
      description: "Solid oak coffee table with a hand-finished natural grain top.",
      specifications: JSON.stringify({ Material: "Solid Oak", Dimensions: "120x60x45 cm" }),
      variants: [],
    },
    {
      name: "Linen Weave Cushion Set",
      sku: "LNW-DC-021",
      brand: "Linen Weave",
      category: "Decor",
      price: rupees(899),
      originalPrice: rupees(1199),
      discountPercent: 25,
      stock: 45,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: true,
      color: "#a16207",
      description: "Set of 2 linen-blend cushion covers to freshen up any living room.",
      specifications: JSON.stringify({ Material: "Linen blend", Set: "2 pieces" }),
      variants: [],
    },
    {
      name: "Pulse Fitness Tracker",
      sku: "PLS-FT-030",
      brand: "Pulse",
      category: "Fitness",
      price: rupees(2499),
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
    {
      name: "TrailBlaze Yoga Mat",
      sku: "TRB-FT-031",
      brand: "TrailBlaze",
      category: "Fitness",
      price: rupees(799),
      originalPrice: rupees(999),
      discountPercent: 20,
      stock: 80,
      isFeatured: false,
      isBestSeller: true,
      isNewArrival: false,
      color: "#65a30d",
      description: "Non-slip 6mm yoga mat with carry strap, ideal for yoga and home workouts.",
      specifications: JSON.stringify({ Thickness: "6mm", Material: "TPE" }),
      variants: [],
    },
    {
      name: "Basecamp 40L Backpack",
      sku: "BSC-OD-040",
      brand: "Basecamp",
      category: "Outdoor",
      price: rupees(2799),
      originalPrice: rupees(3499),
      discountPercent: 20,
      stock: 30,
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: true,
      color: "#166534",
      description: "Weather-resistant 40L trekking backpack with padded straps and multiple compartments.",
      specifications: JSON.stringify({ Capacity: "40L", Material: "Ripstop nylon" }),
      variants: [],
    },
    {
      name: "GlowDew Vitamin C Serum",
      sku: "GLD-SK-060",
      brand: "GlowDew",
      category: "Skincare",
      price: rupees(599),
      originalPrice: rupees(799),
      discountPercent: 25,
      stock: 100,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      color: "#f97316",
      description: "Brightening vitamin C serum with hyaluronic acid for daily glow.",
      specifications: JSON.stringify({ Volume: "30ml", "Skin Type": "All" }),
      variants: [],
    },
    {
      name: "Silksmith Argan Hair Oil",
      sku: "SLK-HC-061",
      brand: "Silksmith",
      category: "Haircare",
      price: rupees(449),
      originalPrice: null,
      discountPercent: null,
      stock: 90,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: true,
      color: "#a21caf",
      description: "Nourishing argan oil blend for frizz-free, shiny hair.",
      specifications: JSON.stringify({ Volume: "100ml" }),
      variants: [],
    },
    {
      name: "Voyager Canvas Tote Bag",
      sku: "VYG-BG-070",
      brand: "Voyager",
      category: "Bags",
      price: rupees(699),
      originalPrice: rupees(899),
      discountPercent: 22,
      stock: 65,
      isFeatured: false,
      isBestSeller: false,
      isNewArrival: true,
      color: "#57534e",
      description: "Durable canvas tote bag with leather handles, perfect for daily use.",
      specifications: JSON.stringify({ Material: "Canvas & leather" }),
      variants: [],
    },
    {
      name: "Meridian Chronograph Watch",
      sku: "MRD-WT-080",
      brand: "Meridian",
      category: "Watches",
      price: rupees(3499),
      originalPrice: rupees(4499),
      discountPercent: 22,
      stock: 20,
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: false,
      color: "#1e293b",
      description: "Stainless steel chronograph watch with sapphire-coated glass and 5ATM water resistance.",
      specifications: JSON.stringify({ "Case Material": "Stainless steel", "Water Resistance": "5ATM" }),
      variants: [],
    },
  ];

  const created: Record<string, string> = {};
  for (const def of productDefs) {
    const slug = slugify(def.name);
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      created[slug] = existing.id;
      continue;
    }

    const product = await prisma.product.create({
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
            { url: placeholder(def.brand, def.color), position: 1 },
          ],
        },
        variants: {
          create: def.variants.map((v) => ({
            name: v.name,
            sku: v.sku,
            stock: v.stock,
            priceOverride: (v as { priceOverride?: number | null }).priceOverride ?? null,
          })),
        },
      },
    });
    created[slug] = product.id;
  }

  const reviewSeeds: { slug: string; userId: string; rating: number; title: string; body: string }[] = [
    {
      slug: "aurora-wireless-headphones",
      userId: customer.id,
      rating: 5,
      title: "Fantastic sound",
      body: "The noise cancellation is excellent and battery life is as advertised.",
    },
    {
      slug: "aurora-wireless-headphones",
      userId: secondCustomer.id,
      rating: 4,
      title: "Great value",
      body: "Comfortable for long listening sessions, bass could be a touch stronger.",
    },
    {
      slug: "strider-running-shoes",
      userId: secondCustomer.id,
      rating: 5,
      title: "Perfect fit",
      body: "Lightweight and breathable — great for my morning runs.",
    },
    {
      slug: "glowdew-vitamin-c-serum",
      userId: customer.id,
      rating: 5,
      title: "Noticeable glow in a week",
      body: "Absorbs quickly and doesn't feel sticky. Will repurchase.",
    },
    {
      slug: "pulse-5g-smartphone",
      userId: customer.id,
      rating: 4,
      title: "Solid mid-range phone",
      body: "Camera is great in daylight, battery easily lasts a full day.",
    },
  ];

  for (const r of reviewSeeds) {
    const productId = created[r.slug];
    if (!productId) continue;
    await prisma.review.upsert({
      where: { productId_userId: { productId, userId: r.userId } },
      update: {},
      create: { productId, userId: r.userId, rating: r.rating, title: r.title, body: r.body, status: "PUBLISHED" },
    });
  }

  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: {
      code: "WELCOME10",
      type: "PERCENT",
      value: 10,
      minOrderValue: rupees(500),
      usageLimit: 500,
      perCustomerLimit: 1,
      active: true,
    },
  });

  const dressId = created["willow-midi-dress"];
  if (dressId) {
    await prisma.coupon.upsert({
      where: { code: "DRESS200" },
      update: {},
      create: {
        code: "DRESS200",
        type: "FIXED",
        value: rupees(200),
        productId: dressId,
        active: true,
      },
    });
  }

  const electronicsId = categories["Electronics"];
  if (electronicsId) {
    await prisma.coupon.upsert({
      where: { code: "TECH15" },
      update: {},
      create: {
        code: "TECH15",
        type: "PERCENT",
        value: 15,
        categoryId: electronicsId,
        minOrderValue: rupees(1000),
        active: true,
      },
    });
  }

  const headphonesId = created["aurora-wireless-headphones"];
  if (headphonesId) {
    await prisma.promotion.upsert({
      where: { id: "seed-banner-1" },
      update: {},
      create: {
        id: "seed-banner-1",
        type: "BANNER",
        title: "Big Savings on Audio",
        subtitle: "Save up to 25% on select headphones this week only",
        imageUrl: placeholder("Audio Sale", "#0e7c6b"),
        linkUrl: `/products/${"aurora-wireless-headphones"}`,
        productId: headphonesId,
        position: 0,
        active: true,
      },
    });
  }

  const phoneId = created["pulse-5g-smartphone"];
  if (phoneId) {
    await prisma.promotion.upsert({
      where: { id: "seed-banner-2" },
      update: {},
      create: {
        id: "seed-banner-2",
        type: "BANNER",
        title: "New: Pulse 5G Smartphone",
        subtitle: "128GB storage, 5000mAh battery — now available",
        imageUrl: placeholder("Pulse 5G", "#1d4ed8"),
        linkUrl: `/products/pulse-5g-smartphone`,
        productId: phoneId,
        position: 1,
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
      subtitle: "Halo Smart Speaker at 21% off",
      position: 0,
      active: true,
    },
  });

  log.push("Seed complete.");
  log.push(`Admin login: ${adminEmail} / Admin123!`);
  log.push(`Customer login: customer@example.com / Customer123!`);
  log.push(`Customer login: rahul@example.com / Customer123!`);
  return log;
}
