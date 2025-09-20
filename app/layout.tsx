import type { Metadata } from "next";
import { Albert_Sans, Nunito_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import PrivyProviderWrapper from "@/components/PrivyProvider";

const albertSans = Albert_Sans({
  variable: "--font-albert-sans",
  subsets: ["latin"],
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  display: "swap",
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
    <html lang="en" className="font-sans">
      <body
        className={`${nunitoSans.variable} ${albertSans.variable} ${geistMono.variable} antialiased`}
      >
        <PrivyProviderWrapper>
          {children}
        </PrivyProviderWrapper>
      </body>
    </html>
  );
}
