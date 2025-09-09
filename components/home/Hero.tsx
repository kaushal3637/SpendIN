'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronRight, Wallet, QrCode, Banknote, InfoIcon } from 'lucide-react'

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="min-h-screen flex flex-col justify-center items-center px-3 sm:px-4 md:px-6 lg:px-8 overflow-hidden relative">
      {/* Animated background elements - Optimized for mobile */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-12 -right-8 w-32 h-32 sm:w-40 sm:h-40 md:w-80 md:h-80 rounded-full bg-gradient-to-r from-emerald-400/8 to-teal-400/8 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-12 -left-8 w-32 h-32 sm:w-40 sm:h-40 md:w-80 md:h-80 rounded-full bg-gradient-to-r from-teal-400/8 to-emerald-400/8 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-48 sm:h-48 md:w-96 md:h-96 rounded-full bg-gradient-to-r from-emerald-400/3 to-teal-400/3 blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Floating icons - Mobile optimized positioning */}
      <div className="absolute inset-0 pointer-events-none">
        <Wallet className="absolute top-12 sm:top-16 md:top-20 left-2 sm:left-4 md:left-10 w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-black/30 sm:text-black/40 md:text-black/60 animate-float" />
        <QrCode className="absolute top-16 sm:top-20 md:top-24 right-2 sm:right-4 md:right-8 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-black/30 sm:text-black/40 md:text-black/60 animate-float-delayed" />
        <Banknote className="absolute bottom-16 sm:bottom-20 md:bottom-24 left-2 sm:left-4 md:left-8 w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-black/30 sm:text-black/40 md:text-black/60 animate-float" />
      </div>

      <div className={`relative z-10 max-w-4xl mx-auto text-center transition-all duration-1000 w-full ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
        {/* Logo/Brand - Mobile optimized */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-slate-900 animate-gradient-x leading-tight px-2">
            StableUPI
          </h1>
        </div>

        {/* Tagline - Mobile optimized */}
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-slate-600 mb-4 sm:mb-6 md:mb-8 leading-relaxed px-2 sm:px-4">
          Pay with <span className="text-emerald-600 font-semibold">USDC</span>,<br className="sm:hidden" />
          merchants get <span className="text-teal-600 font-semibold">INR</span> seamlessly
        </p>

        {/* Description - Mobile optimized */}
        <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 mb-6 sm:mb-8 md:mb-10 lg:mb-12 max-w-2xl mx-auto px-3 sm:px-4 md:px-0 leading-relaxed">
          The future of Web3 payments. No gas fees in ETH for users, instant conversions,
          and seamless merchant integration through simple QR codes.
        </p>

        {/* CTA Buttons - Mobile optimized */}
        <div className="flex flex-col gap-3 sm:gap-4 md:gap-6 justify-center items-center px-3 sm:px-4 md:px-0 w-full max-w-lg mx-auto">
          {/* Primary CTA Button */}
          <Link href="/scan" className="w-full max-w-sm sm:max-w-xs">
            <button className="group relative w-full inline-flex items-center justify-center px-6 sm:px-8 md:px-10 py-4 sm:py-4 md:py-5 text-base sm:text-lg md:text-xl font-bold text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/30 active:scale-95 min-h-[56px] touch-manipulation">
              <span className="mr-2 sm:mr-3">Get Started</span>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 transition-transform group-hover:translate-x-1 group-active:translate-x-0 flex-shrink-0" />
              {/* Enhanced hover overlay */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
              {/* Subtle glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400/20 to-teal-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-20"></div>
            </button>
          </Link>

          {/* Secondary CTA Button */}
          <Link href="#features" className="w-full max-w-sm sm:max-w-xs">
            <button className="group relative w-full inline-flex items-center justify-center px-6 sm:px-8 md:px-10 py-4 sm:py-4 md:py-5 text-base sm:text-lg md:text-xl font-bold text-slate-700 bg-white border-2 border-emerald-300 rounded-2xl transition-all duration-300 hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-xl hover:shadow-emerald-200/50 active:scale-95 min-h-[56px] touch-manipulation">
              <InfoIcon className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2 flex-shrink-0" />
              <span>Learn More</span>
              {/* Subtle hover effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-50/0 to-teal-50/0 group-hover:from-emerald-50/50 group-hover:to-teal-50/50 transition-all duration-300"></div>
            </button>
          </Link>
        </div>

        {/* Stats - Mobile optimized */}
        <div className="mt-8 sm:mt-10 md:mt-12 lg:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-2xl mx-auto px-3 sm:px-4 md:px-0">
          <div className="text-center py-2 sm:py-0">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-600 mb-1 sm:mb-2">No</div>
            <div className="text-xs sm:text-sm md:text-base text-slate-600">ETH Gas Fees</div>
          </div>
          <div className="text-center py-2 sm:py-0">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-teal-600 mb-1 sm:mb-2">1 Minute</div>
            <div className="text-xs sm:text-sm md:text-base text-slate-600">Transaction Time</div>
          </div>
          <div className="text-center py-2 sm:py-0">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-700 mb-1 sm:mb-2">100%</div>
            <div className="text-xs sm:text-sm md:text-base text-slate-600">Secure</div>
          </div>
        </div>

        {/* Spacer to ensure full height utilization */}
        <div className="flex-grow min-h-[2rem] sm:min-h-[4rem] md:min-h-[6rem]"></div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        .animate-gradient-x {
          background-size: 400% 400%;
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </section>
  )
}