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
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressFillRef = useRef<HTMLDivElement>(null);
  const percentageRef = useRef<HTMLDivElement>(null);
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    if (!containerRef.current || !isLoading) return;

    const tl = gsap.timeline();

    gsap.set([logoRef.current, progressBarRef.current, percentageRef.current], {
      opacity: 0,
      y: 200,
    });
    gsap.set(progressFillRef.current, { width: "0%" });

    tl.to(logoRef.current, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      ease: "power2.out",
      delay: 0.1,
    });

    tl.to(
      progressBarRef.current,
      {
        opacity: 1,
        y: 0,
        duration: 0.2,
        ease: "power2.out",
      },
      "-=0.4"
    );

    tl.to(
      percentageRef.current,
      {
        opacity: 1,
        y: 0,
        duration: 0.2,
        ease: "power2.out",
      },
      "-=0.6"
    );

    tl.to(
      {},
      {
        duration: 1,
        ease: "power2.out",
        onUpdate: function () {
          const progress = this.progress();
          const currentPercentage = Math.round(progress * 100);

          if (progressFillRef.current) {
            progressFillRef.current.style.width = `${currentPercentage}%`;
          }

          setPercentage(currentPercentage);
        },
      }
    );

    tl.to([logoRef.current, progressBarRef.current, percentageRef.current], {
      opacity: 0,
      y: -100,
      duration: 0.4,
      ease: "power2.in",
      delay: 0,
    });

    tl.to(containerRef.current, {
      opacity: 0,
      duration: 0.4,
      ease: "power2.in",
      onComplete: () => {
        if (onComplete) onComplete();
      },
    });

    return () => {
      tl.kill();
    };
  }, [isLoading, onComplete]);

  if (!isLoading) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-2 p-4 pb-20"
      style={{ width: "100vw", height: "100vh" }}
    >
      <div ref={logoRef} className="w-full text-center">
        <h1 className={`text-[13vw] text-center tracking-tight text- select-none`}>
          SPENDIN
        </h1>
      </div>
      </div>
  );
}
