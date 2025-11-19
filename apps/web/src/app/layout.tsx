import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Alchemy Table",
  description: "A gamified e-commerce platform for building blends at an alchemy table",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
