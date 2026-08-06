import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // API proxy to backend during development
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8080/api/:path*",
      },
    ];
  },
};

export default nextConfig;
