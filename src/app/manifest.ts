import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "myQR — your shop and QR code",
    short_name: site.name,
    description: site.description,
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f3f4f0",
    theme_color: "#2546F0",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
