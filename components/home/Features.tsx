"use client";

import { useState, useEffect, useRef } from "react";
import {
  Fuel,
  Zap,
  QrCode,
  Shield,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const features = [
  {
    icon: Fuel,
    title: "Gas Sponsorship",
    description:
      "We sponsor ETH for smooth transactions, so you don't need to hold ETH. Payment covers all costs in USDC.",
    gradient: "from-emerald-500 to-teal-500",
    bgGradient: "from-emerald-50 to-teal-50",
  },
  {
    icon: Zap,
    title: "Instant Conversion",
    description:
      "Real-time INR to USDC conversion with live market rates for transparent pricing.",
    gradient: "from-teal-500 to-cyan-500",
    bgGradient: "from-teal-50 to-cyan-50",
  },
  {
    icon: QrCode,
    title: "QR Payments",
    description:
      "Simple scan-and-pay experience. No complex wallet addresses or manual entry required.",
    gradient: "from-emerald-600 to-teal-600",
    bgGradient: "from-emerald-50 to-teal-50",
  },
  {
    icon: Shield,
    title: "Secure Integration",
    description:
      "High security with Web3 wallet integration. Your funds remain in your control.",
    gradient: "from-teal-600 to-emerald-600",
    bgGradient: "from-teal-50 to-emerald-50",
  },
];

export default function Features() {
  const [visibleCards, setVisibleCards] = useState<number[]>([]);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            features.forEach((_, index) => {
              setTimeout(() => {
                setVisibleCards((prev) => [...prev, index]);
              }, index * 150);
            });
          }
        });
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle scroll events for pagination dots
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScrollUpdate);
      return () => container.removeEventListener('scroll', handleScrollUpdate);
    }
  }, [isMobile]);

  // Handle horizontal scroll
  const handleScroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const cardWidth = container.offsetWidth * 0.85; // Account for 85% width
    const newSlide =
      direction === "right"
        ? Math.min(currentSlide + 1, features.length - 1)
        : Math.max(currentSlide - 1, 0);

    setCurrentSlide(newSlide);
    container.scrollTo({
      left: newSlide * cardWidth,
      behavior: "smooth",
    });
  };

  // Handle touch scroll - simplified approach
  const handleTouchStart = (e: React.TouchEvent) => {
    // Let the browser handle native scrolling
    // We'll just update the current slide based on scroll position
  };

  // Update current slide based on scroll position
  const handleScrollUpdate = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const cardWidth = container.offsetWidth * 0.85;
      const newSlide = Math.round(container.scrollLeft / cardWidth);
      setCurrentSlide(Math.max(0, Math.min(newSlide, features.length - 1)));
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes shine {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shine {
          animation: shine 1.5s ease-in-out;
        }
        
        /* Smooth scroll improvements */
        .scroll-container {
          -webkit-overflow-scrolling: touch;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
          overscroll-behavior-x: contain;
          touch-action: pan-x;
        }
        
        .scroll-container::-webkit-scrollbar {
          display: none;
        }
        
        /* Ensure smooth scrolling on all devices */
        .scroll-container {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
      `}</style>
      <section
        ref={sectionRef}
        className="relative py-20 lg:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden"
      >
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 lg:mb-16">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
              Meet SpendIN 🔥
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
              Built for the{" "}
              <span className="block sm:inline bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Future of Payments
              </span>
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-[90%] mx-auto leading-relaxed">
              Experience seamless cryptocurrency payments that feel as natural as
              traditional UPI
            </p>
          </div>

          {/* Features Grid - Desktop */}
          {!isMobile && (
            <div className="relative">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-teal-500 rounded-full blur-3xl"></div>
              </div>

              {/* Asymmetric Grid Layout */}
              <div className="relative grid grid-cols-12 gap-6 lg:gap-8">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  const isVisible = visibleCards.includes(index);
                  const isHovered = hoveredCard === index;

                  // Create asymmetric layout
                  const getGridClasses = (index: number) => {
                    switch (index) {
                      case 0: return "col-span-12 md:col-span-6 lg:col-span-5";
                      case 1: return "col-span-12 md:col-span-6 lg:col-span-7";
                      case 2: return "col-span-12 md:col-span-7 lg:col-span-6";
                      case 3: return "col-span-12 md:col-span-5 lg:col-span-6";
                      default: return "col-span-12";
                    }
                  };

                  return (
                    <div
                      key={index}
                      className={`group relative transition-all duration-700 ${getGridClasses(index)} ${isVisible
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-8"
                        }`}
                      style={{ transitionDelay: `${index * 150}ms` }}
                      onMouseEnter={() => setHoveredCard(index)}
                      onMouseLeave={() => setHoveredCard(null)}
                    >
                      {/* Card with different styles based on position */}
                      <div
                        className={`relative h-full transition-all duration-500 ${index === 0
                            ? 'rounded-3xl bg-gradient-to-br from-slate-50 to-emerald-50/30 border-2 border-emerald-300/60'
                            : index === 1
                              ? 'rounded-2xl bg-white/95 backdrop-blur-sm border-2 border-emerald-300/60 shadow-lg'
                              : index === 2
                                ? 'rounded-3xl bg-gradient-to-br from-slate-50 to-emerald-50/30 border-2 border-emerald-300/60'
                                : 'rounded-2xl bg-white/95 backdrop-blur-sm border-2 border-emerald-300/60 shadow-lg'
                          } p-6 lg:p-8 hover:bg-white hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-1`}
                      >
                        {/* Shining Border Animation */}
                        <div className="absolute inset-0 rounded-2xl overflow-hidden">
                          {/* Shining effect only */}
                          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700 ${isHovered ? 'animate-shine' : ''
                            }`} style={{
                              background: index === 2
                                ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)'
                                : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
                              transform: 'translateX(-100%)',
                              animation: isHovered ? 'shine 1.5s ease-in-out' : 'none'
                            }}></div>
                        </div>

                        {/* Content */}
                        <div className="relative z-10">
                          {/* Icon Container with different styles */}
                          <div className={`mb-4 ${index === 1 ? 'flex justify-end' : index === 3 ? 'flex justify-center' : ''}`}>
                            <div
                              className={`inline-flex items-center justify-center transition-all duration-500 group-hover:shadow-lg group-hover:shadow-emerald-500/20 ${isHovered
                                  ? "scale-105"
                                  : "group-hover:scale-105"
                                } ${index === 0
                                  ? 'w-16 h-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg'
                                  : index === 1
                                    ? 'w-12 h-12 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 shadow-md'
                                    : index === 2
                                      ? 'w-14 h-14 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg'
                                      : 'w-15 h-15 rounded-3xl bg-gradient-to-r from-teal-600 to-emerald-600 shadow-lg'
                                }`}
                            >
                              <Icon
                                className={`text-white transition-all duration-300 ${index === 0 ? 'w-8 h-8' : index === 1 ? 'w-6 h-6' : 'w-7 h-7'
                                  }`}
                              />
                            </div>
                          </div>

                          {/* Text Content with different alignments */}
                          <div className={`space-y-3 ${index === 1 ? 'text-right' : index === 3 ? 'text-center' : ''
                            }`}>
                            <h3
                              className={`font-bold text-slate-900 transition-all duration-300 ${index === 0 ? 'text-2xl lg:text-3xl' :
                                  index === 1 ? 'text-lg lg:text-xl' :
                                    index === 2 ? 'text-xl lg:text-2xl' :
                                      'text-lg lg:text-xl'
                                }`}
                            >
                              {feature.title}
                            </h3>
                            <p
                              className={`text-slate-600 leading-relaxed transition-all duration-300 ${index === 0 ? 'text-base' :
                                  index === 1 ? 'text-sm' :
                                    index === 2 ? 'text-sm' :
                                      'text-sm'
                                }`}
                            >
                              {feature.description}
                            </p>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mobile Horizontal Scroll */}
          {isMobile && (
            <div className="relative">
              {/* Scroll Container */}
              <div
                ref={scrollContainerRef}
                className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-4 pb-4 scroll-container"
                onScroll={handleScrollUpdate}
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  scrollBehavior: "smooth",
                  overscrollBehavior: "contain",
                  touchAction: "pan-x",
                  WebkitOverflowScrolling: "touch"
                }}
              >
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  const isVisible = visibleCards.includes(index);

                  return (
                    <div
                      key={index}
                      className={`flex-shrink-0 w-[85%] snap-center transition-all duration-700 ${isVisible
                          ? "opacity-100 translate-y-0"
                          : "opacity-0 translate-y-8"
                        }`}
                      style={{ transitionDelay: `${index * 150}ms` }}
                    >
                      {/* Mobile Card */}
                      <div
                        className={`relative h-full rounded-3xl bg-white/90 backdrop-blur-sm border border-slate-200/50 transition-all duration-700 p-6 active:scale-95`}
                      >
                        {/* Mobile Background Effects */}
                        <div className="absolute inset-0 rounded-3xl overflow-hidden">
                          <div
                            className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.bgGradient
                              } opacity-0 transition-all duration-500`}
                          ></div>
                        </div>

                        {/* Content */}
                        <div className="relative z-10">
                          {/* Icon */}
                          <div className="mb-4">
                            <div
                              className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-r ${feature.gradient
                                } shadow-lg transition-all duration-500`}
                            >
                              <Icon className="w-7 h-7 text-white" />
                            </div>
                          </div>

                          {/* Text */}
                          <div className="space-y-3">
                            <h3
                              className={`text-xl font-bold text-slate-900 transition-all duration-500`}
                            >
                              {feature.title}
                            </h3>
                            <p
                              className={`text-slate-600 leading-relaxed transition-all duration-500 text-sm`}
                            >
                              {feature.description}
                            </p>
                          </div>

                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Pagination Dots */}
              <div className="flex justify-center mt-2 space-x-2">
                {features.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentSlide(index);
                      if (scrollContainerRef.current) {
                        const cardWidth = scrollContainerRef.current.offsetWidth * 0.85;
                        scrollContainerRef.current.scrollTo({
                          left: index * cardWidth,
                          behavior: "smooth",
                        });
                      }
                    }}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${currentSlide === index
                        ? "bg-emerald-500 w-8"
                        : "bg-slate-300 hover:bg-slate-400"
                      }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Bottom CTA */}
          <div className="text-center mt-20">
            <div className="inline-flex items-center space-x-2 text-slate-600">
              <div className="w-8 h-px bg-gradient-to-r from-transparent to-emerald-500"></div>
              <span className="text-sm font-medium">Ready to get started?</span>
              <div className="w-8 h-px bg-gradient-to-l from-transparent to-teal-500"></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}