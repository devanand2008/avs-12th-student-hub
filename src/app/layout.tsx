import BottomNav from "@/components/layout/BottomNav";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { PwaProvider } from "@/components/pwa/PwaContext";
import PwaInstallBanner from "@/components/pwa/PwaInstallBanner";
import PwaInstallModal from "@/components/pwa/PwaInstallModal";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkillUp | Handwritten Notes & One Mark Practice",
  description:
    "SkillUp Class 12 Learning Portal. Comprehensive handwritten notes, unit-wise one-mark MCQs, NotebookLM videos, and AI Study Assistant for 12th standard students.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SkillUp",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "application-name": "SkillUp",
  },
  keywords: [
    "SkillUp",
    "12th standard",
    "handwritten notes",
    "one mark MCQ",
    "Tamil Nadu state board",
    "NotebookLM",
    "AI study assistant",
    "Salem",
    "Dr. Joshua",
  ],
};

export const viewport: Viewport = {
  themeColor: "#1b3574",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SkillUp" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="SkillUp" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#eff5ff] text-slate-900 selection:bg-blue-600 selection:text-white antialiased font-sans">
        <PwaProvider>
          <Navbar />
          <div className="flex-1 flex flex-col">{children}</div>
          <BottomNav />
          <Footer />
          <PwaInstallBanner />
          <PwaInstallModal />
        </PwaProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('SW registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

