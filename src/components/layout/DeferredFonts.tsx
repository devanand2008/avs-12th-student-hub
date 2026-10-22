"use client";

import { useEffect } from "react";

/** Optional branding fonts must not block sign-in, Tamil fallback text or hydration. */
export default function DeferredFonts() {
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&family=Noto+Sans+Tamil:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap";
    const attach = () => document.head.append(link);
    if (document.readyState === "complete") attach();
    else window.addEventListener("load", attach, { once: true });
    return () => {
      window.removeEventListener("load", attach);
      link.remove();
    };
  }, []);
  return null;
}
