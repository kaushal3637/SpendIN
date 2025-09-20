"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Feature = {
  image: string;
  title: string;
  description: string;
};

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <div className="flex items-center group">
      {/* Text content */}
      <div className="w-[150px] sm:w-[200px] md:w-[280px] text-left mx-4">
        <h3 className="text-sm sm:text-base font-bold text-[#0b3d2e] mb-1 sm:mb-2 group-hover:text-emerald-600 transition-colors duration-300">
          {feature.title}
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 group-hover:text-slate-700 transition-colors duration-300">
          {feature.description}
        </p>
      </div>
      
      {/* Enhanced pill-shaped image card with hover effects */}
      <div className="mx-6 w-[170px] sm:w-[200px] md:w-[280px] h-max rounded-full overflow-hidden bg-white flex items-center justify-center border border-teal-200 group-hover:border-emerald-300 group-hover:shadow-lg group-hover:shadow-emerald-100 transition-all duration-300 group-hover:scale-105">
        <Image
          src={feature.image}
          alt={feature.title}
          width={100}
          height={100}
          className="!w-full h-auto object-cover group-hover:scale-110 transition-transform duration-300"
        />
      </div>
    </div>
  );
}

function MarqueeRow({
  items,
  speed = 30,
  direction = "left",
  className = "",
}: {
  items: Feature[];
  speed?: number; // seconds
  direction?: "left" | "right";
  className?: string;
}) {
  // Duplicate content for seamless loop
  const track = useMemo(() => [...items, ...items, ...items], [items]);

  const animationName = direction === "left" ? "marqueeLeft" : "marqueeRight";

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <div
        className="flex will-change-transform hover:[animation-play-state:paused]"
        style={{
          animation: `${animationName} ${speed}s linear infinite`,
          width: "fit-content",
        }}
      >
        {track.map((f, i) => (
          <FeatureCard key={`${f.title}-${i}`} feature={f} />
        ))}
      </div>
    </div>
  );
}

// Floating decorative elements
function FloatingElement({ 
  className = "", 
  children, 
  delay = 0 
}: { 
  className?: string; 
  children: React.ReactNode; 
  delay?: number;
}) {
  return (
    <div 
      className={`absolute animate-float ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      {children}
    </div>
  );
}

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const rowOne: Feature[] = [
    {
      image: "/herosection/1.png",
      title: "Pay any UPI QR",
      description: "Scan existing merchant QRs across India.",
    },
    {
      image: "/herosection/2.png",
      title: "USDC → INR",
      description: "Automatic conversion at checkout.",
    },
    {
      image: "/herosection/3.png",
      title: "Zero gas fees",
      description: "No ETH gas required to complete payments.",
    },
    {
      image: "/herosection/4.png",
      title: "Instant & secure",
      description: "Fast confirmations with strong security through Arbitrum.",
    },
  ];

  const rowTwo: Feature[] = [
    {
      image: "/herosection/5.png",
      title: "Fast settlement",
      description: "Typical end-to-end completion time.",
    },
    {
      image: "/herosection/6.png",
      title: "No Surprises Pricing",
      description: "What you see is exactly what you pay — no hidden fees.",
    },
    {
      image: "/herosection/7.png",
      title: "Everywhere in India",
      description: "From high streets to hidden gems, make payments anywhere.",
    },
    {
      image: "/herosection/8.png",
      title: "Travel-friendly",
      description: "Perfect for international visitors in India.",
    },
  ];

  return (
    <section className="relative w-full flex items-center justify-center overflow-hidden pt-[170px]">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 animate-gradient-x"></div>
      
      {/* Floating decorative elements */}
      <FloatingElement 
        className="top-20 left-10 w-16 h-16 bg-emerald-200 rounded-full opacity-20" 
        delay={0}
      >
        <div className="w-full h-full bg-emerald-200 rounded-full"></div>
      </FloatingElement>
      <FloatingElement 
        className="top-40 right-20 w-12 h-12 bg-teal-200 rounded-full opacity-30" 
        delay={1}
      >
        <div className="w-full h-full bg-teal-200 rounded-full"></div>
      </FloatingElement>
      <FloatingElement 
        className="bottom-40 left-20 w-20 h-20 bg-cyan-200 rounded-full opacity-25" 
        delay={2}
      >
        <div className="w-full h-full bg-cyan-200 rounded-full"></div>
      </FloatingElement>
      <FloatingElement 
        className="bottom-20 right-10 w-14 h-14 bg-emerald-300 rounded-full opacity-20" 
        delay={0.5}
      >
        <div className="w-full h-full bg-emerald-300 rounded-full"></div>
      </FloatingElement>

      {/* Main content */}
      <div
        className={`relative z-10 w-full transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div className="w-[90%] mx-auto text-center">
          {/* Enhanced main heading with gradient text */}
          <h1 className="text-[5vw] font-black mb-6 bg-gradient-to-r from-[#0b3d2e] via-emerald-600 to-teal-600 bg-clip-text text-transparent animate-gradient-x">
            SpendIN - Spend in India
          </h1>
          
          {/* Enhanced subtitle with better typography */}
          <p className="mt-4 text-slate-700 text-sm md:text-lg w-[90%] md:w-[70%] mx-auto leading-relaxed font-medium">
            Seamlessly convert your USDC to INR and pay any merchant via
            UPI—instant, secure, and zero gas fees. Perfect for international
            visitors exploring India.
          </p>

          {/* Enhanced CTA section */}
          <div className="my-8 sm:my-12">
            <Link href="/scan">
              <button className="group relative inline-flex items-center justify-center gap-3 sm:px-8 px-6 sm:py-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white font-bold sm:text-lg text-base shadow-2xl hover:shadow-emerald-500/40 hover:scale-[1.05] active:scale-95 transition-all duration-300 overflow-hidden">
                {/* Animated background effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Button content */}
                <span className="relative z-10">Start Spending</span>
                <svg
                  className="h-6 w-6 transition-transform group-hover:translate-x-2 group-hover:scale-110"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                
                {/* Shine effect */}
                <div className="absolute inset-0 -top-2 -left-2 w-0 h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 group-hover:w-full transition-all duration-700 skew-x-12"></div>
              </button>
            </Link>
          </div>
        </div>

        {/* Enhanced marquee section with better spacing and effects */}
        <div className="relative">
          {/* Gradient overlays for smooth fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10"></div>
          
          <MarqueeRow
            items={rowOne}
            speed={32}
            direction="left"
            className="py-6"
          />

          <MarqueeRow
            items={rowTwo}
            speed={28}
            direction="right"
            className="py-6"
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes marqueeLeft {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.3333%);
          }
        }
        @keyframes marqueeRight {
          0% {
            transform: translateX(-33.3333%);
          }
          100% {
            transform: translateX(0);
          }
        }
        
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg); 
          }
          50% { 
            transform: translateY(-20px) rotate(5deg); 
          }
        }
        
        @keyframes gradient-x {
          0%, 100% { 
            background-position: 0% 50%; 
          }
          50% { 
            background-position: 100% 50%; 
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-gradient-x {
          background-size: 400% 400%;
          animation: gradient-x 4s ease infinite;
        }
      `}</style>
    </section>
  );
}