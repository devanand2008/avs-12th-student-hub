"use client";

import { Download, Smartphone } from "lucide-react";
import { usePwa } from "./PwaContext";

interface InstallButtonProps {
  variant?: "pill" | "icon" | "nav" | "card";
  className?: string;
  showWhenInstalled?: boolean;
}

export default function InstallButton({
  variant = "pill",
  className = "",
  showWhenInstalled = false,
}: InstallButtonProps) {
  const { isInstalled, isStandalone, promptInstall } = usePwa();

  if ((isInstalled || isStandalone) && !showWhenInstalled) {
    return null;
  }

  if (variant === "icon") {
    return (
      <button
        onClick={promptInstall}
        className={`touch-target p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors relative group cursor-pointer ${className}`}
        title="Install Mobile App"
        aria-label="Install Mobile App"
      >
        <Smartphone className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
        </span>
      </button>
    );
  }

  if (variant === "nav") {
    return (
      <button
        onClick={promptInstall}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100/90 border border-blue-200/90 transition-all active:scale-95 cursor-pointer ${className}`}
        title="Install SkillUp on this device"
      >
        <Download className="w-3.5 h-3.5 text-blue-600" />
        <span>Install App</span>
      </button>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={`p-4 rounded-2xl bg-gradient-to-br from-[#071A3D] to-[#123D7D] text-white shadow-lg space-y-3 ${className}`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-cyan-300">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white">
              Install SkillUp Mobile App
            </h3>
            <p className="text-[11px] text-blue-200">
              Offline notes & quick 1-tap practice
            </p>
          </div>
        </div>
        <button
          onClick={promptInstall}
          className="w-full py-2.5 px-3 bg-white text-blue-900 hover:bg-blue-50 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-98 shadow-sm cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-blue-600" />
          <span>Get Free App</span>
        </button>
      </div>
    );
  }

  // default "pill" variant
  return (
    <button
      onClick={promptInstall}
      className={`touch-target inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer ${className}`}
    >
      <Download className="w-3.5 h-3.5" />
      <span>Install App</span>
    </button>
  );
}
