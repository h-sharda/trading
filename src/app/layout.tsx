import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PwaRegister } from "@/app/pwa-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trading",
  description: "Personal trading workspace",
  applicationName: "Trading",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Trading",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
