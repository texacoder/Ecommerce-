import { ImageResponse } from "next/og";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { SITE_NAME } from "@/lib/seo";

export const alt = `${SITE_NAME}: Shop Everything You Need`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logoData = await readFile(join(process.cwd(), "src/app/icon.png"), "base64");
const logoSrc = `data:image/png;base64,${logoData}`;

// Satori (the renderer behind ImageResponse) doesn't reliably decode WebP,
// unlike every real browser - a JPEG copy exists just for this file so the
// actual site keeps serving the smaller WebP everywhere else.
const heroData = await readFile(join(process.cwd(), "public/hero-banner-og.jpg"), "base64");
const heroSrc = `data:image/jpeg;base64,${heroData}`;

export default async function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", position: "relative", display: "flex" }}>
        <img
          src={heroSrc}
          alt=""
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "linear-gradient(to right, rgba(16,26,44,0.94), rgba(16,26,44,0.72) 55%, rgba(16,26,44,0.35))",
          }}
        />
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 24,
            padding: "0 80px",
            width: "100%",
            height: "100%",
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <img src={logoSrc} width={72} height={72} alt="" />
            <span style={{ color: "#ffffff", fontSize: 64, fontWeight: 800, letterSpacing: -1 }}>
              EXORASTORE
            </span>
          </div>
          <span style={{ color: "#93c5fd", fontSize: 34, fontWeight: 700, maxWidth: 760 }}>
            Everything You Need, Delivered to Your Door.
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
