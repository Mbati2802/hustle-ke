import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import LiveChatWidget from "./components/LiveChatWidget";
import ScrollToTop from "./components/ScrollToTop";
import CookieConsent from "./components/CookieConsent";
import InactivityMonitor from "./components/InactivityMonitor";
import { AuthProvider } from "@/contexts/AuthContext";
import { AuthModalProvider } from "./components/AuthModalContext";
import AuthModal from "./components/AuthModal";
import { PostJobModalProvider } from "./components/PostJobModalContext";
import { ApplyJobModalProvider } from "./components/ApplyJobModalContext";
import IncompleteApplicationNotifier from "./components/IncompleteApplicationNotifier";
import { ApplyJobModalWrapper } from "./components/ApplyJobModal";
import { RecaptchaProvider } from "@/contexts/RecaptchaContext";
import CSRFProvider from "./components/CSRFProvider";
import PWAInstallPrompt from "./components/PWAInstallPrompt";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "HustleKE — Kenya's #1 Freelance Marketplace",
    template: "%s | HustleKE",
  },
  description: "Kenya's #1 freelance marketplace. Find work, hire talent, and get paid via M-Pesa. Secure escrow, AI-powered matching, and verified professionals.",
  keywords: ["freelance", "Kenya", "M-Pesa", "jobs", "hustle", "remote work", "African talent", "freelance marketplace", "hire freelancers Kenya", "gig economy Kenya"],
  authors: [{ name: "HustleKE", url: "https://hustleke.com" }],
  creator: "HustleKE",
  publisher: "HustleKE",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://hustleke.com"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large" as const, "max-snippet": -1 },
  },
  openGraph: {
    title: "HustleKE — Kenya's #1 Freelance Marketplace",
    description: "Find work, hire talent, and get paid via M-Pesa. Secure escrow, AI-powered matching, and verified professionals.",
    type: "website",
    locale: "en_KE",
    siteName: "HustleKE",
  },
  twitter: {
    card: "summary_large_image",
    title: "HustleKE — Kenya's #1 Freelance Marketplace",
    description: "Find work, hire talent, and get paid via M-Pesa. Secure escrow, AI-powered matching, and verified professionals.",
    creator: "@hustleke",
  },
  other: {
    "msapplication-TileColor": "#16a34a",
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#16a34a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="HustleKE" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CSRFProvider />
        <RecaptchaProvider>
          <AuthProvider>
            <AuthModalProvider>
              <PostJobModalProvider>
                <ApplyJobModalProvider>
                  {children}
                  <LiveChatWidget />
                  <ScrollToTop />
                  <CookieConsent />
                  <InactivityMonitor />
                  <IncompleteApplicationNotifier />
                  <ApplyJobModalWrapper />
                  <AuthModal />
                  <PWAInstallPrompt />
                </ApplyJobModalProvider>
              </PostJobModalProvider>
            </AuthModalProvider>
          </AuthProvider>
        </RecaptchaProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/service-worker.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
