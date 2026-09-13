import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lists became the Library (2026-09-13); old links and bookmarks still land.
  async redirects() {
    return [{ source: "/lists", destination: "/library", permanent: true }];
  },
};

export default nextConfig;
