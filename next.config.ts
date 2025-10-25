// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      // Autorise *toutes* les queries sur notre proxy local
      { pathname: "/api/hiboutik/image" },

      // Tes assets locaux du dossier /public
      { pathname: "/galerie/**" },
      { pathname: "/logo.png" },      // si tu l’utilises
      { pathname: "/favicon.svg" },   // si tu l’utilises
    ],
  },
};

export default nextConfig;
