import type { NextConfig } from "next";
import catalog from "./src/lib/textbooks-catalog.json";
import { officialTextbookRewrite } from "./src/lib/textbook-delivery";
import type { TextbookCatalog } from "./src/lib/textbooks";

const nextConfig: NextConfig = {
  // Isolate this local QA server from concurrent default builds in the workspace.
  distDir:
    process.env.AVS_PORTAL_QA_BUILD === "true" ? ".next-portal" : ".next",
  allowedDevOrigins: ["localhost", "127.0.0.1", "10.120.145.229"],
  outputFileTracingIncludes: {
    "/api/supplied-practice": ["./src/lib/supplied-practice/data.json"],
    "/api/admin/supplied-practice/export": [
      "./src/lib/supplied-practice/data.json",
    ],
  },
  rewrites() {
    if (process.env.TEXTBOOK_DELIVERY !== "official") return [];
    return (catalog as TextbookCatalog).books.flatMap((book) => {
      const rewrite = officialTextbookRewrite(book);
      return rewrite ? [rewrite] : [];
    });
  },
  experimental: {
    ...(process.env.AVS_PORTAL_QA_BUILD === "true"
      ? { cpus: 1, webpackMemoryOptimizations: true }
      : {}),
    // Include multipart headers beyond the 50 MiB application upload limit.
    proxyClientMaxBodySize: "51mb",
  },
};

export default nextConfig;
