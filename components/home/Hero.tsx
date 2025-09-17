"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronRight,
  ArrowRightLeft,
  QrCode,
  Fuel,
  Timer,
  ShieldCheck,
} from "lucide-react";
// import { stableBold } from "@/lib/fonts";

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className="min-h-screen w-full flex items-center justify-center overflow-hidden pt-24 pb-16 md:py-[120px]">
      <div
        className={`w-[90%] transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch">
          {/* Left: headline + CTA */}
          <div className="lg:col-span-5 flex flex-col justify-center px-4 sm:px-0">
            <h1
              className="text-3xl sm:text-5xl md:text-6xl font-black leading-[1.1] sm:leading-[1.05]"
              style={{ color: "#0b3d2e" }}
            >
              Pay with USDC, merchants receive INR
            </h1>
            <p className="mt-3 sm:mt-4 text-slate-700 text-sm sm:text-lg max-w-prose">
              StableUPI bridges crypto and UPI in one tap — no ETH gas, no
              delays.
            </p>
            <div className="mt-5 sm:mt-6 flex gap-3">
              <Link href="/scan">
                <button className="w-full sm:w-auto group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white font-bold shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-95">
                  Get started
                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
            </div>
          </div>

          {/* Right: feature mosaic */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 px-4 sm:px-0">
            <div className="rounded-3xl p-5 sm:p-6 bg-white border border-black/5 shadow-md flex flex-col justify-between min-h-[150px] sm:min-h-[200px]">
              <div>
                <p className="text-xl font-extrabold text-[#0b3d2e]">
                  Pay USDC → Receive INR
                </p>
                <p className="mt-2 text-slate-700 text-sm">
                  Automatic FX conversion at checkout.
                </p>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white text-sm">
                  $
                </span>
                <ArrowRightLeft className="h-5 w-5 text-[#0b3d2e]" />
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white text-xs">
                  ₹
                </span>
              </div>
            </div>
            <div className="rounded-3xl p-5 sm:p-6 bg-white border border-black/5 shadow-md flex flex-col justify-between min-h-[150px] sm:min-h-[200px]">
              <div>
                <p className="text-xl font-extrabold text-[#0b3d2e]">
                  Scan any UPI QR
                </p>
                <p className="mt-2 text-slate-700 text-sm">
                  Works with existing merchant QRs.
                </p>
              </div>
              <div className="mt-4 inline-flex items-center gap-3 text-sm font-semibold text-[#0b3d2e]">
                <QrCode className="h-5 w-5" /> Scan to pay
              </div>
            </div>
            <div className="rounded-3xl p-5 sm:p-6 bg-white border border-black/5 shadow-md flex flex-col justify-between min-h-[150px] sm:min-h-[200px]">
              <div>
                <p className="text-xl font-extrabold text-[#0b3d2e]">
                  1 Minute
                </p>
                <p className="mt-2 text-slate-700 text-sm inline-flex items-center gap-2">
                  <Timer className="h-5 w-5" /> Transaction Time
                </p>
              </div>
              <div className="text-xs text-slate-500">
                Typical end-to-end settlement
              </div>
            </div>
            <div className="rounded-3xl p-5 sm:p-6 bg-white border border-black/5 shadow-md flex flex-col justify-between min-h-[150px] sm:min-h-[200px]">
              <div>
                <p className="text-xl font-extrabold text-[#0b3d2e]">100%</p>
                <p className="mt-2 text-slate-700 text-sm inline-flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" /> Secure
                </p>
              </div>
              <div className="inline-flex items-center gap-2 text-sm text-[#0b3d2e]">
                <Fuel className="h-5 w-5" /> No ETH gas
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
