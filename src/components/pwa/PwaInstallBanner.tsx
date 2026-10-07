"use client";

import Image from "next/image";
import { Download, X, Sparkles } from "lucide-react";
import { usePwa } from "./PwaContext";
import { usePathname } from "next/navigation";

export default function PwaInstallBanner() {
  const {
    isInstalled,
    isStandalone,
    isBannerDismissed,
    dismissBanner,
    promptInstall,
  } = usePwa();
  const pathname = usePathname();

  // If already installed or currently running in standalone PWA mode, don't show the banner
  if (isInstalled || isStandalone || isBannerDismissed) {
    return null;
  }

  // Check if BottomNav is present on this page
  const hasBottomNav = !(
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/textbooks/") ||
    pathname === "/change-password"
  );

  return (
    <aside
      aria-label="Install mobile app prompt"
      className={`fixed z-40 transition-all duration-300 px-3 sm:px-0 left-0 right-0 sm:left-auto sm:right-6 pointer-events-none ${
        hasBottomNav ? "bottom-[4.75rem] md:bottom-6" : "bottom-4 md:bottom-6"
      }`}
    >
      <div className="pointer-events-auto max-w-md mx-auto sm:w-[380px] bg-white/95 backdrop-blur-xl border border-blue-200/90 rounded-2xl p-3 sm:p-3.5 shadow-[0_12px_40px_-8px_rgba(27,53,116,0.25)] flex items-center justify-between gap-3 animate-in slide-in-from-bottom-4 duration-300">
        {/* App Icon */}
        <div className="relative w-11 h-11 rounded-xl bg-[#071A3D] p-1 flex-shrink-0 shadow-sm border border-blue-100 flex items-center justify-center">
          <Image
            src="/icon-192.png"
            alt="AVS Hub"
            width={40}
            height={40}
            className="w-full h-full object-contain rounded-lg"
          />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
          </span>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-heading font-extrabold text-xs sm:text-sm text-[#071A3D] truncate">
              Install AVS 12th Hub
            </span>
            <span className="hidden xs:inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-700 uppercase">
              Free App
            </span>
          </div>
          <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
            <Sparkles className="w-3 h-3 text-cyan-500 flex-shrink-0" />
            <span>Fast 1-tap study app · Works offline</span>
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={promptInstall}
            className="touch-target px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/25 active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Install</span>
          </button>
          <button
            onClick={dismissBanner}
            className="touch-target p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
