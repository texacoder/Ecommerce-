import { ImageResponse } from "next/og";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { SITE_NAME } from "@/lib/seo";
import { prisma } from "@/lib/db";

export const alt = `${SITE_NAME}: Shop Everything You Need`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logoData = await readFile(join(process.cwd(), "src/app/icon.png"), "base64");
const logoSrc = `data:image/png;base64,${logoData}`;

// Satori (the renderer behind ImageResponse) doesn't reliably decode WebP,
// so product photos are re-requested from Cloudinary as JPEG (f_jpg)
// specifically for this image, rather than reusing the WebP the storefront
// serves everywhere else.
function toJpegThumb(url: string, width: number): string {
  const marker = "/upload/";
  const markerIndex = url.indexOf(marker);
  if (!url.includes("res.cloudinary.com") || markerIndex === -1) return url;
  const insertAt = markerIndex + marker.length;
  return `${url.slice(0, insertAt)}f_jpg,q_auto,w_${width}/${url.slice(insertAt)}`;
}

async function fetchAsDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    // Product images aren't guaranteed to be Cloudinary JPEGs - a local
    // /uploads fallback or a dev seed placeholder can be PNG, SVG, etc.
    // Satori only decodes JPEG/PNG, so anything else is skipped rather
    // than mislabeled and sent to it broken.
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/jpeg") && !contentType.startsWith("image/png")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${contentType};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

async function getProductThumbnails(): Promise<string[]> {
  const products = await prisma.product.findMany({
    where: { deletedAt: null, status: "PUBLISHED", visible: true, images: { some: {} } },
    orderBy: [{ isFeatured: "desc" }, { isBestSeller: "desc" }, { updatedAt: "desc" }],
    take: 3,
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
  });

  const results = await Promise.all(
    products.map((p) => fetchAsDataUri(toJpegThumb(p.images[0].url, 260)))
  );
  return results.filter((r): r is string => r !== null);
}

export default async function Image() {
  const thumbnails = await getProductThumbnails();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#101a2c",
        }}
      >
        <div
          style={{
            width: thumbnails.length ? "44%" : "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 22,
            padding: "0 56px",
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <img src={logoSrc} width={64} height={64} alt="" />
            <span style={{ color: "#ffffff", fontSize: 52, fontWeight: 800, letterSpacing: -1 }}>
              EXORASTORE
            </span>
          </div>
          <span style={{ color: "#93c5fd", fontSize: 28, fontWeight: 700, maxWidth: 480 }}>
            Everything You Need, Delivered to Your Door.
          </span>
        </div>
        {thumbnails.length > 0 && (
          <div
            style={{
              width: "56%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
              padding: "0 40px",
            }}
          >
            {thumbnails.map((src, i) => (
              <div
                key={i}
                style={{
                  width: 190,
                  height: 190,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#ffffff",
                  borderRadius: 20,
                  padding: 14,
                }}
              >
                <img
                  src={src}
                  width={162}
                  height={162}
                  alt=""
                  style={{ objectFit: "contain", borderRadius: 8 }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    { ...size }
  );
}
