'use client'

import { useState, useEffect } from 'react'
import { ChevronRight, Wallet, QrCode, Banknote } from 'lucide-react'

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden py-12 sm:py-16 lg:py-0">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 sm:-top-40 -right-16 sm:-right-32 w-40 h-40 sm:w-80 sm:h-80 rounded-full bg-gradient-to-r from-emerald-400/10 to-teal-400/10 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 sm:-bottom-40 -left-16 sm:-left-32 w-40 h-40 sm:w-80 sm:h-80 rounded-full bg-gradient-to-r from-teal-400/10 to-emerald-400/10 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-96 sm:h-96 rounded-full bg-gradient-to-r from-emerald-400/5 to-teal-400/5 blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Floating icons - Responsive positioning */}
      <div className="absolute inset-0 pointer-events-none">
        <Wallet className="absolute top-16 sm:top-20 left-4 sm:left-10 w-6 h-6 sm:w-8 sm:h-8 text-black/40 sm:text-black/60 animate-float" />
        <QrCode className="absolute top-24 sm:top-32 right-8 sm:right-20 w-5 h-5 sm:w-6 sm:h-6 text-black/40 sm:text-black/60 animate-float-delayed" />
        <Banknote className="absolute bottom-24 sm:bottom-32 left-8 sm:left-20 w-6 h-6 sm:w-7 sm:h-7 text-black/40 sm:text-black/60 animate-float" />
      </div>

      <div className={`relative z-10 max-w-4xl mx-auto text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}>
        {/* Logo/Brand */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-slate-900 animate-gradient-x leading-tight">
            StableUPI
          </h1>
        </div>

        {/* Tagline */}
        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-slate-600 mb-6 sm:mb-8 leading-relaxed px-4 sm:px-0">
          Pay with <span className="text-emerald-600 font-semibold">USDC</span>,
          merchants get <span className="text-teal-600 font-semibold">INR</span> seamlessly
        </p>

        {/* Description */}
        <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-8 sm:mb-12 max-w-2xl mx-auto px-4 sm:px-0">
          The future of Web3 payments. No gas fees in ETH for users, instant conversions,
          and seamless merchant integration through simple QR codes.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-4 justify-center items-center px-4 sm:px-0">
          <button className="group relative inline-flex items-center justify-center w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/25">
            <span className="mr-2">Get Started</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-700 to-teal-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
          </button>

          <button className="inline-flex items-center justify-center w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-slate-700 border-2 border-emerald-200 rounded-full transition-all duration-300 hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-lg">
            Learn More
          </button>
        </div>

        {/* Stats */}
        <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-2xl mx-auto px-4 sm:px-0">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600 mb-2">No</div>
            <div className="text-sm sm:text-base text-slate-600">ETH Gas Fees</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-teal-600 mb-2">1 Minute</div>
            <div className="text-sm sm:text-base text-slate-600">Transaction Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-700 mb-2">100%</div>
            <div className="text-sm sm:text-base text-slate-600">Secure</div>
          </div>
        </div>
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