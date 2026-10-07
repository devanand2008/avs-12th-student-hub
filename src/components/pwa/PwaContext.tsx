"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PwaContextType {
  canInstall: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  isGuideOpen: boolean;
  isBannerDismissed: boolean;
  promptInstall: () => Promise<void>;
  openInstallGuide: () => void;
  closeInstallGuide: () => void;
  dismissBanner: () => void;
}

const PwaContext = createContext<PwaContextType | null>(null);

const STORAGE_KEY_DISMISSED = "avs_pwa_banner_dismissed_until";

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://")
    );
  });
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://")
    );
  });
  const [isIOS] = useState(() => {
    if (typeof window === "undefined") return false;
    const userAgent = window.navigator.userAgent.toLowerCase();
    return (
      /iphone|ipad|ipod/.test(userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  });
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Show banner after brief delay if not dismissed
    const timer = setTimeout(() => {
      try {
        const dismissedUntil = localStorage.getItem(STORAGE_KEY_DISMISSED);
        if (!dismissedUntil || Number(dismissedUntil) <= Date.now()) {
          setIsBannerDismissed(false);
        }
      } catch {
        setIsBannerDismissed(false);
      }
    }, 1500);

    // Capture beforeinstallprompt for Android / Chromium browsers
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsStandalone(true);
      setDeferredPrompt(null);
      setIsGuideOpen(false);
      try {
        localStorage.removeItem(STORAGE_KEY_DISMISSED);
      } catch {
        // ignore
      }
    };

    const matchStandalone = window.matchMedia("(display-mode: standalone)");
    const handleDisplayChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsStandalone(true);
        setIsInstalled(true);
      }
    };

    matchStandalone.addEventListener("change", handleDisplayChange);
    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt as EventListener
    );
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      clearTimeout(timer);
      matchStandalone.removeEventListener("change", handleDisplayChange);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt as EventListener
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsInstalled(true);
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.error("PWA prompt error:", err);
        setIsGuideOpen(true);
      }
    } else {
      // Fallback: Show guided modal (especially for iOS Safari or browsers where prompt was already handled)
      setIsGuideOpen(true);
    }
  }, [deferredPrompt]);

  const openInstallGuide = useCallback(() => {
    setIsGuideOpen(true);
  }, []);

  const closeInstallGuide = useCallback(() => {
    setIsGuideOpen(false);
  }, []);

  const dismissBanner = useCallback(() => {
    setIsBannerDismissed(true);
    try {
      // Dismiss for 4 days before reminding again
      const expiry = Date.now() + 4 * 24 * 60 * 60 * 1000;
      localStorage.setItem(STORAGE_KEY_DISMISSED, String(expiry));
    } catch {
      // ignore
    }
  }, []);

  const canInstall = !isInstalled && !isStandalone && (!!deferredPrompt || isIOS);

  return (
    <PwaContext.Provider
      value={{
        canInstall,
        isInstalled,
        isIOS,
        isStandalone,
        isGuideOpen,
        isBannerDismissed,
        promptInstall,
        openInstallGuide,
        closeInstallGuide,
        dismissBanner,
      }}
    >
      {children}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (!context) {
    throw new Error("usePwa must be used within a PwaProvider");
  }
  return context;
}
