"use client";

import Image from "next/image";
import {
  Download,
  Share2,
  PlusSquare,
  Sparkles,
  WifiOff,
  Zap,
  CheckCircle2,
  X,
  Smartphone,
  ShieldCheck,
} from "lucide-react";
import { usePwa } from "./PwaContext";

export default function PwaInstallModal() {
  const {
    isGuideOpen,
    closeInstallGuide,
    isIOS,
    promptInstall,
    isInstalled,
  } = usePwa();

  if (!isGuideOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pwa-install-title"
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeInstallGuide();
      }}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-blue-100 overflow-hidden max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-2 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="relative bg-gradient-to-br from-[#071A3D] via-[#123D7D] to-[#1D4ED8] p-5 sm:p-6 text-white overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-40 h-40 bg-cyan-400/15 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={closeInstallGuide}
            className="absolute top-4 right-4 p-2 rounded-full text-blue-200 hover:text-white hover:bg-white/10 transition-colors touch-target"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative flex items-center gap-3.5 pr-8">
            <div className="relative w-14 h-14 rounded-2xl bg-white p-1.5 shadow-lg flex-shrink-0 border border-blue-200/50">
              <Image
                src="/icon-192.png"
                alt="AVS 12 Hub App Icon"
                width={56}
                height={56}
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/25 border border-blue-400/30 text-[10px] font-bold text-cyan-200 uppercase tracking-wider mb-1">
                <ShieldCheck className="w-3 h-3 text-cyan-300" />
                AVS Official PWA
              </div>
              <h2
                id="pwa-install-title"
                className="text-lg sm:text-xl font-extrabold text-white leading-snug"
              >
                Install AVS 12th Hub
              </h2>
              <p className="text-xs text-blue-200/90 font-medium">
                Install on your phone for lightning-fast 1-tap study access.
              </p>
            </div>
          </div>

          {/* Feature Highlights Strip */}
          <div className="mt-4 pt-3.5 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className="bg-white/10 rounded-xl p-2 flex flex-col items-center backdrop-blur-xs">
              <Zap className="w-4 h-4 text-amber-300 mb-1" />
              <span className="font-bold text-white">Instant Load</span>
              <span className="text-[10px] text-blue-200">Zero lag</span>
            </div>
            <div className="bg-white/10 rounded-xl p-2 flex flex-col items-center backdrop-blur-xs">
              <WifiOff className="w-4 h-4 text-emerald-300 mb-1" />
              <span className="font-bold text-white">Offline Ready</span>
              <span className="text-[10px] text-blue-200">Cached notes</span>
            </div>
            <div className="bg-white/10 rounded-xl p-2 flex flex-col items-center backdrop-blur-xs">
              <Smartphone className="w-4 h-4 text-cyan-300 mb-1" />
              <span className="font-bold text-white">Full Screen</span>
              <span className="text-[10px] text-blue-200">No browser bars</span>
            </div>
          </div>
        </div>

        {/* Modal Body: Instructions depending on OS */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {isInstalled ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Already Installed!
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                AVS 12th Hub is already installed on this device. You can launch
                it anytime from your home screen or app drawer.
              </p>
            </div>
          ) : isIOS ? (
            /* iOS Safari Step-by-Step Guide */
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Easy iPhone / iPad Setup
                </span>
                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                  Safari Required
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                {/* Step 1 */}
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Tap the Safari Share button</span>
                      <span className="inline-flex items-center justify-center p-1 bg-white border border-slate-200 rounded-md shadow-xs text-blue-600">
                        <Share2 className="w-3.5 h-3.5" />
                      </span>
                    </p>
                    <p className="text-slate-500 mt-0.5 text-[11px]">
                      Located at the bottom of your screen in Safari toolbar (or
                      top bar on iPad).
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Scroll down & select</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-slate-200 rounded-md shadow-xs text-slate-800 font-semibold text-[11px]">
                        <PlusSquare className="w-3.5 h-3.5 text-blue-600" />
                        Add to Home Screen
                      </span>
                    </p>
                    <p className="text-slate-500 mt-0.5 text-[11px]">
                      This saves AVS 12th Hub as a standalone application on your
                      iPhone.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">
                      Tap <span className="font-extrabold text-blue-600">&ldquo;Add&rdquo;</span> in the top right corner
                    </p>
                    <p className="text-slate-500 mt-0.5 text-[11px]">
                      The app icon will immediately appear on your home screen
                      for fast, one-tap study sessions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Tip:</strong> If you are opening this inside Instagram,
                  WhatsApp, or Chrome on iOS, tap the menu and choose <strong>&ldquo;Open in Safari&rdquo;</strong> first.
                </p>
              </div>
            </div>
          ) : (
            /* Android / Chrome / Desktop Flow */
            <div className="space-y-4">
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>One-Click Android & Mobile Install</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  No Play Store download required! AVS 12th Hub uses standard
                  Progressive Web App technology to install directly to your app
                  drawer, taking less than 2 MB of storage.
                </p>
              </div>

              <button
                onClick={async () => {
                  await promptInstall();
                }}
                className="w-full py-3.5 px-5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-2xl font-bold text-sm shadow-electric flex items-center justify-center gap-2 transition-transform active:scale-98 touch-target cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Install AVS 12th Hub Now</span>
              </button>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p className="font-semibold text-slate-700">
                  Didn&apos;t see the prompt?
                </p>
                <p>
                  Tap the three dots (<strong>⋮</strong>) in the top-right corner of Chrome / your mobile browser and select <strong>&ldquo;Install app&rdquo;</strong> or <strong>&ldquo;Add to Home screen&rdquo;</strong>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 text-xs">
          <span className="text-[11px] text-slate-500 font-medium">
            AVS Engineering College (Autonomous)
          </span>
          <button
            onClick={closeInstallGuide}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 font-bold rounded-xl hover:bg-slate-200/60 transition-colors touch-target"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
