import { ImageResponse } from "next/og";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { SITE_NAME } from "@/lib/seo";

export const alt = `${SITE_NAME}: Shop Everything You Need`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const logoData = await readFile(join(process.cwd(), "src/app/icon.png"), "base64");
const logoSrc = `data:image/png;base64,${logoData}`;

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 32,
          background: "#101a2c",
          fontFamily: "sans-serif",
        }}
      >
        <img src={logoSrc} width={220} height={220} alt="" />
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ color: "#ffffff", fontSize: 72, fontWeight: 800, letterSpacing: -1 }}>
            EXORASTORE
          </span>
        </div>
        <span style={{ color: "#94a3b8", fontSize: 30 }}>Everything you need, delivered to your door.</span>
      </div>
    ),
    { ...size }
  );
}
