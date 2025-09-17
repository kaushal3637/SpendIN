"use client";

import { useState, useEffect, useRef } from "react";
import {
  Wallet,
  IndianRupee,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

const steps = [
  {
    icon: Wallet,
    title: "Connect Wallet",
    description: "Connect your Web3 wallet securely to StableUPI platform",
    details: "Support for MetaMask, WalletConnect, and other popular wallets",
  },
  {
    icon: IndianRupee,
    title: "Enter INR Amount",
    description: "Scan merchant QR code and enter the payment amount in INR",
    details: "Real-time conversion rates instantly",
  },
  {
    icon: CheckCircle,
    title: "Confirm Payment",
    description: "Review and confirm - We handle gas fees and USDC conversion",
    details: "Transaction completed in under 1 minute",
  },
];

export default function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);
  const sectionRef = useRef<HTMLElement>(null);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  const AUTO_ADVANCE_MS = 5000;
  const INTERACTION_PAUSE_MS = 7000;

  const scheduleNext = (delay: number) => {
    if (autoplayRef.current) clearTimeout(autoplayRef.current);
    autoplayRef.current = setTimeout(() => {
      animateTo((activeStep + 1) % steps.length);
    }, delay);
  };

  const animateTo = (index: number) => {
    setContentVisible(false);
    setTimeout(() => {
      setActiveStep(index);
      setContentVisible(true);
    }, 180);
  };

  const goNext = (manual = false) => {
    animateTo((activeStep + 1) % steps.length);
    scheduleNext(manual ? INTERACTION_PAUSE_MS : AUTO_ADVANCE_MS);
  };
  const goPrev = (manual = false) => {
    animateTo((activeStep - 1 + steps.length) % steps.length);
    scheduleNext(manual ? INTERACTION_PAUSE_MS : AUTO_ADVANCE_MS);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setIsVisible(true);
        });
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    if (autoplayRef.current) clearTimeout(autoplayRef.current);
    autoplayRef.current = setTimeout(() => {
      setContentVisible(false);
      setTimeout(() => {
        setActiveStep((prev) => (prev + 1) % steps.length);
        setContentVisible(true);
      }, 180);
    }, AUTO_ADVANCE_MS);
    return () => {
      if (autoplayRef.current) clearTimeout(autoplayRef.current);
    };
  }, [isVisible, activeStep]);

  const StepIcon = steps[activeStep].icon;

  return (
    <section
      ref={sectionRef}
      className="w-full flex items-center justify-center px-4 sm:px-6 md:px-8 py-16 md:py-24"
    >
      <div
        className={`relative w-[95%] max-w-6xl mx-auto rounded-3xl bg-white text-slate-800 border border-black/5 shadow-md overflow-hidden transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[420px]">
          {/* Left panel */}
          <div className="md:col-span-6 p-6 sm:p-8 lg:p-12 flex flex-col justify-between bg-gradient-to-br from-emerald-50 to-teal-50">
            <div>
              <h1 className="text-7xl font-extrabold uppercase tracking-widest text-emerald-600">
                How
                <br />
                it works
              </h1>
            </div>
            <div className="mt-6 flex items-center gap-4">
              <Link href="/scan">
                <button className="inline-flex items-center justify-center px-5 py-3 rounded-2xl bg-emerald-600 text-white font-semibold shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 transition">
                  Try it now
                </button>
              </Link>
            </div>
          </div>

          {/* Right panel */}
          <div className="relative md:col-span-6 p-6 sm:p-8 lg:p-12 pb-24 flex flex-col justify-between bg-white">
            <div
              className={`flex flex-col items-start gap-4 transition-all duration-500 ${
                contentVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2"
              }`}
            >
              <h3
                className="mt-3 text-3xl sm:text-4xl font-extrabold leading-tight flex items-center gap-2"
                style={{ color: "#0b3d2e" }}
              >
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <StepIcon className="h-6 w-6" />
                </div>
                {steps[activeStep].title}
              </h3>

              <div>
                <p className="text-base sm:text-lg leading-relaxed text-slate-700 py-5">
                  {steps[activeStep].description}
                </p>
                {steps[activeStep].details && (
                  <p className="mt-2 text-sm text-slate-500">
                    {steps[activeStep].details}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom controls - full width arrows pinned */}
            <div className="absolute left-0 right-0 bottom-0">
              <div className="w-full border-t border-black/10">
                <div className="grid grid-cols-2">
                  <button
                    aria-label="Previous step"
                    onClick={() => goPrev(true)}
                    className="h-14 sm:h-16 w-full inline-flex items-center justify-center bg-white hover:bg-black/5 transition"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    aria-label="Next step"
                    onClick={() => goNext(true)}
                    className="h-14 sm:h-16 w-full inline-flex items-center justify-center bg-white hover:bg-black/5 transition border-l border-black/10"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Big counter */}
            <div className="pointer-events-none absolute bottom-6 right-6 select-none text-5xl sm:text-6xl md:text-7xl font-black text-black/5">
              {activeStep + 1}/{steps.length}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
