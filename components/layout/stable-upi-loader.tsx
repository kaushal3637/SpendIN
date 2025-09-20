"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

interface StableUPILoaderProps {
  isLoading?: boolean;
  onComplete?: () => void;
}

export default function StableUPILoader({
  isLoading = true,
  onComplete,
}: StableUPILoaderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !isLoading) return;

    const tl = gsap.timeline();

    // Set initial states - start from bottom at medium size
    gsap.set(logoRef.current, {
      opacity: 0,
      y: 200,
      scale: 0.7,
    });

    // Entrance from bottom at medium size
    tl.to(logoRef.current, {
      opacity: 1,
      y: 0,
      scale: 0.7,
      duration: 0.3,
      ease: "power2.out",
    });

    // Zoom in effect
    tl.to(logoRef.current, {
      scale: 1.1,
      duration: 0.2,
      ease: "power2.out",
    });

    // Brief pause at zoomed size
    tl.to({}, {
      duration: 0.4,
    });

    // Reduce size and go to top
    tl.to(logoRef.current, {
      scale: 0.5,
      y: -200,
      opacity: 0,
      duration: 0.4,
      ease: "power2.in",
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });

    tl.to(containerRef.current, {
      opacity: 0,
      duration: 0.2,
      ease: "power2.in",
    });

    return () => {
      tl.kill();
    };
  }, [isLoading, onComplete]);

  if (!isLoading) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-white"
      style={{ width: "100vw", height: "100vh" }}
    >
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-emerald-50 opacity-30"></div>

      <div ref={logoRef} className="text-center relative z-10">
        {/* Modern logo styling */}
        <div className="relative">
          <h1 className="text-[13vw] text-center tracking-tight text-emerald-600 select-none font-bold">
            SPENDIN
          </h1>
        </div>
        
        {/* Modern tagline */}
        <div className="mt-6 space-y-4">
          <p className="text-xs md:text-base text-gray-600 font-light tracking-wide">
            The future of Web3 payments in India
          </p>
          
          {/* Modern loading indicator */}
          <div className="flex items-center justify-center space-x-1">
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>

    </div>
  );
}