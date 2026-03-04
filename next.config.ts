import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable component caching to allow routes to opt into dynamic
  // rendering (e.g., server-side auth checks that mustn't be cached).
  cacheComponents: false,
};

export default nextConfig;
