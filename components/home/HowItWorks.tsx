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
  const [isPaused, setIsPaused] = useState(false);
  const [stepProgress, setStepProgress] = useState([0, 0, 0]);
  const sectionRef = useRef<HTMLElement>(null);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const AUTO_ADVANCE_MS = 5000;
  const INTERACTION_PAUSE_MS = 7000;
  const PROGRESS_UPDATE_INTERVAL = 50; // Update progress every 50ms

  const startProgressAnimation = (stepIndex: number) => {
    if (progressRef.current) clearInterval(progressRef.current);
    
    // Calculate the correct start time based on current progress
    const currentProgress = stepProgress[stepIndex];
    const duration = AUTO_ADVANCE_MS;
    const elapsedTime = (currentProgress / 100) * duration;
    const startTime = Date.now() - elapsedTime;
    startTimeRef.current = startTime;
    
    progressRef.current = setInterval(() => {
      if (isPaused) return;
      
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      
      setStepProgress(prev => {
        const newProgress = [...prev];
        newProgress[stepIndex] = progress;
        return newProgress;
      });
      
      if (progress >= 100) {
        if (progressRef.current) clearInterval(progressRef.current);
        if (!isPaused) {
          animateTo((stepIndex + 1) % steps.length);
        }
      }
    }, PROGRESS_UPDATE_INTERVAL);
  };

  const scheduleNext = (delay: number) => {
    if (isPaused) return; // Don't schedule if paused
    if (autoplayRef.current) clearTimeout(autoplayRef.current);
    autoplayRef.current = setTimeout(() => {
      if (!isPaused) { // Double check before animating
        animateTo((activeStep + 1) % steps.length);
      }
    }, delay);
  };

  const animateTo = (index: number) => {
    setContentVisible(false);
    setTimeout(() => {
      setActiveStep(index);
      setContentVisible(true);
      
      // Reset progress for all steps and start progress for current step
      setStepProgress(prev => prev.map((_, i) => i < index ? 100 : 0));
      
      if (!isPaused) {
        startProgressAnimation(index);
      }
    }, 180);
  };

  const goNext = (manual = false) => {
    animateTo((activeStep + 1) % steps.length);
  };
  const goPrev = (manual = false) => {
    animateTo((activeStep - 1 + steps.length) % steps.length);
  };

  const goToStep = (stepIndex: number) => {
    animateTo(stepIndex);
  };

  // Touch events for mobile
  const handleTouchStart = () => {
    setIsPaused(true);
    if (autoplayRef.current) clearTimeout(autoplayRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    startProgressAnimation(activeStep);
  };

  // Mouse events for desktop
  const handleMouseEnter = () => {
    setIsPaused(true);
    if (autoplayRef.current) clearTimeout(autoplayRef.current);
    if (progressRef.current) clearInterval(progressRef.current);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
    startProgressAnimation(activeStep);
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
    
    // Start progress animation for current step
    if (!isPaused) {
      startProgressAnimation(activeStep);
    }
    
    return () => {
      if (autoplayRef.current) clearTimeout(autoplayRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [isVisible, activeStep, isPaused]);

  const StepIcon = steps[activeStep].icon;

  return (
    <section
      ref={sectionRef}
      className="w-full flex items-center justify-center px-3 sm:px-4 md:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={`relative w-full max-w-7xl mx-auto rounded-2xl sm:rounded-3xl bg-white text-slate-800 border border-black/5 shadow-md overflow-hidden transition-all duration-700 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[400px] ">
          {/* Left panel */}
          <div className="md:col-span-5 p-8 lg:p-10 xl:p-12 flex flex-col justify-between bg-gradient-to-br from-emerald-50 to-teal-50">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[3.5vw] xl:text-[3vw] font-extrabold uppercase tracking-wider sm:tracking-widest text-emerald-600 leading-tight">
                How{" "}
                <br className="hidden md:block"/>
                it works?
              </h1>
            </div>
            <div className="mt-4 sm:mt-6 flex items-center gap-3 sm:gap-4">
              <Link href="/scan">
                <button className="inline-flex items-center justify-center px-6 sm:px-8 lg:px-9 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-emerald-600 text-white font-semibold text-sm sm:text-base shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 transition-all duration-200">
                  Try it now
                </button>
              </Link>
            </div>
          </div>

          {/* Right panel */}
          <div className="relative md:col-span-7 p-8 lg:p-10 xl:p-12 pb-20 sm:pb-24 lg:pb-24 flex flex-col justify-between bg-white">
            <div
              className={`flex flex-col items-start gap-0.5 md:gap-3 transition-all duration-500 ${
                contentVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2"
              }`}
            >
              <h3
                className="mt-2 sm:mt-3 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold leading-tight flex items-center gap-3 md:gap-3"
                style={{ color: "#0b3d2e" }}
              >
                <div className="inline-flex h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex-shrink-0">
                  <StepIcon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                </div>
                <span className="break-words">{steps[activeStep].title}</span>
              </h3>

              <div>
                <p className="text-sm sm:text-base md:text-lg leading-relaxed text-slate-700 py-1 sm:py-4 lg:py-5">
                  {steps[activeStep].description}
                </p>
                {steps[activeStep].details && (
                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-slate-500">
                    {steps[activeStep].details}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom controls - individual step progress bars */}
            <div className="absolute left-0 right-0 bottom-0">
            <div className="w-full">
                <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden flex gap-1">
                  {/* Step 1 */}
                  <div 
                    className="h-full bg-gray-300 rounded-full flex-1 relative overflow-hidden cursor-pointer"
                    onClick={() => goToStep(0)}
                  >
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-100 ease-linear"
                      style={{ 
                        width: `${stepProgress[0]}%`,
                        opacity: activeStep === 0 ? 1 : stepProgress[0] > 0 ? 1 : 0.5
                      }}
                    />
                  </div>
                  {/* Step 2 */}
                  <div 
                    className="h-full bg-gray-300 rounded-full flex-1 relative overflow-hidden cursor-pointer"
                    onClick={() => goToStep(1)}
                  >
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-100 ease-linear"
                      style={{ 
                        width: `${stepProgress[1]}%`,
                        opacity: activeStep === 1 ? 1 : stepProgress[1] > 0 ? 1 : 0.5
                      }}
                    />
                  </div>
                  {/* Step 3 */}
                  <div 
                    className="h-full bg-gray-300 rounded-full flex-1 relative overflow-hidden cursor-pointer"
                    onClick={() => goToStep(2)}
                  >
                    <div 
                      className="h-full bg-emerald-500 rounded-full transition-all duration-100 ease-linear"
                      style={{ 
                        width: `${stepProgress[2]}%`,
                        opacity: activeStep === 2 ? 1 : stepProgress[2] > 0 ? 1 : 0.5
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="w-full border-t border-black/10">
                <div className="grid grid-cols-2">
                  <button
                    aria-label="Previous step"
                    onClick={() => goPrev(true)}
                    className="h-12 w-full inline-flex items-center justify-center bg-white hover:bg-black/5 transition-colors duration-200"
                  >
                    <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                  <button
                    aria-label="Next step"
                    onClick={() => goNext(true)}
                    className="h-12 w-full inline-flex items-center justify-center bg-white hover:bg-black/5 transition-colors duration-200 border-l border-black/10"
                  >
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Big counter */}
            <div className="pointer-events-none absolute bottom-14 right-3  select-none text-4xl font-black text-black/5">
              {activeStep + 1}/{steps.length}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
