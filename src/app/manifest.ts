import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#101a2c",
    theme_color: "#101a2c",
    // The only source art on hand is 180x180 - declaring a larger size
    // here without a matching higher-resolution image would just make
    // Chrome upscale (and blur) it on an Android home screen, which looks
    // worse than being honest about the real size.
    icons: [{ src: "/icon.png", sizes: "180x180", type: "image/png" }],
  };
}
