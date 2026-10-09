import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // static site for GitHub Pages
  basePath: "/paddle-score",
  images: { unoptimized: true },
};

export default nextConfig;
