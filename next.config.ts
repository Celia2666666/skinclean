import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permet de lancer un second serveur de dev en parallèle (ex. NEXT_DIST_DIR=.next-hub) sans conflit de verrou.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    formats: ["image/avif", "image/webp"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
