import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import PrivyProviderWrapper from "@/components/PrivyProvider";
import { Toaster } from 'react-hot-toast';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StableUPI - Web3 Payments Made Simple",
  description: "Pay with USDC, merchants get INR seamlessly. Zero gas fees for users with instant conversions.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PrivyProviderWrapper>
          <Navbar />
          <main className="pt-16">
            {children}
            <Toaster position="top-center" reverseOrder={false} />
          </main>
        </PrivyProviderWrapper>
      </body>
    </html>
  );
}
