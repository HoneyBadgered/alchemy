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
