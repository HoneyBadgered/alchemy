import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { QueryProvider } from "@/components/QueryProvider";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "The Alchemy Table",
  description: "A gamified e-commerce platform for building blends at an alchemy table",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Alchemy Table",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://alchemy.yourdomain.com",
    siteName: "The Alchemy Table",
    title: "The Alchemy Table - Craft Your Perfect Tea Blend",
    description: "Create custom tea blends with magical ingredients. Join thousands of blend enthusiasts and craft something extraordinary.",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "The Alchemy Table - Custom Tea Blending",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@AlchemyTable",
    creator: "@AlchemyTable",
    title: "The Alchemy Table - Craft Your Perfect Tea Blend",
    description: "Create custom tea blends with magical ingredients. Join thousands of blend enthusiasts and craft something extraordinary.",
    images: ["/images/twitter-image.jpg"],
  },
  keywords: ["tea", "custom blends", "tea blending", "alchemy", "organic tea", "artisan tea", "craft tea"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#14513A",
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
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="antialiased font-sans">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ToastProvider>
          <ThemeProvider>
            <QueryProvider>
              <AuthProvider>
                <CartProvider>
                  {children}
                </CartProvider>
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
