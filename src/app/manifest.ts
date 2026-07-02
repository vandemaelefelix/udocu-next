import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "udocu",
    short_name: "udocu",
    description: "So as not to forget who you were",
    start_url: "/nl",
    display: "standalone",
    background_color: "#686121",
    theme_color: "#686121",
    icons: [
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
