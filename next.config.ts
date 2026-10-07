import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1", "10.120.145.229"],
  experimental: {
    // Include multipart headers beyond the 50 MiB application upload limit.
    proxyClientMaxBodySize: "51mb",
  },
};

export default nextConfig;
