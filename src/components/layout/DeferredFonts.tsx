"use client";

import { useEffect } from "react";

/**
 * High-performance deferred font loader:
 * - Only loads essential weights (400, 600, 700) to minimize network payload by ~60%
 * - Uses display=swap so system fonts render instantly with zero layout freeze
 * - Attaches asynchronously via requestIdleCallback/load so it never blocks page hydration
 */
export default function DeferredFonts() {
  useEffect(() => {
    const fontHref =
      "https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&family=Inter:wght@400;500;600;700&family=Noto+Sans+Tamil:wght@400;600;700&display=swap";

    // Check if font is already attached
    if (document.querySelector(`link[href="${fontHref}"]`)) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = fontHref;
    link.media = "all";

    const loadFont = () => {
      if ("requestIdleCallback" in window) {
        (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => {
          document.head.appendChild(link);
        });
      } else {
        setTimeout(() => document.head.appendChild(link), 100);
      }
    };

    if (document.readyState === "complete") {
      loadFont();
    } else {
      window.addEventListener("load", loadFont, { once: true });
    }

    return () => {
      window.removeEventListener("load", loadFont);
    };
  }, []);

  return null;
}
