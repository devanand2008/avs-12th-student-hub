import type { NextConfig } from "next";
import catalog from "./src/lib/textbooks-catalog.json";
import { officialTextbookRewrite } from "./src/lib/textbook-delivery";
import type { TextbookCatalog } from "./src/lib/textbooks";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["localhost", "127.0.0.1", "10.120.145.229"],
  rewrites() {
    if (process.env.TEXTBOOK_DELIVERY !== "official") return [];
    return (catalog as TextbookCatalog).books.flatMap((book) => {
      const rewrite = officialTextbookRewrite(book);
      return rewrite ? [rewrite] : [];
    });
  },
  experimental: {
    // Include multipart headers beyond the 50 MiB application upload limit.
    proxyClientMaxBodySize: "51mb",
  },
};

export default nextConfig;
