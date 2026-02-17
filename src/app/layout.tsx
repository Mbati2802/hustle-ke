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
  title: "HustleKE - Kenyan Freelance Marketplace",
  description: "Connect with global clients. Get paid instantly via M-Pesa. Only 6% service fee. The future of work is Kenyan.",
  keywords: ["freelance", "Kenya", "M-Pesa", "jobs", "hustle", "remote work", "African talent"],
  authors: [{ name: "HustleKE" }],
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
  openGraph: {
    title: "HustleKE - Kenyan Freelance Marketplace",
    description: "Connect with global clients. Get paid instantly via M-Pesa. Only 6% service fee.",
    type: "website",
    locale: "en_KE",
  },
  twitter: {
    card: "summary_large_image",
    title: "HustleKE - Kenyan Freelance Marketplace",
    description: "Connect with global clients. Get paid instantly via M-Pesa. Only 6% service fee.",
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
