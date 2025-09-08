'use client'

import Link from 'next/link'
import { Home, ScanLine, QrCode } from 'lucide-react'

export default function NotFound() {

    return (
        <div className="h-[calc(100vh-4rem)] bg-transparent overflow-hidden">
            {/* Animated background elements - Mobile optimized */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-4 -right-2 w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-r from-emerald-400/6 to-teal-400/6 blur-2xl animate-pulse"></div>
                <div className="absolute -bottom-4 -left-2 w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-r from-teal-400/6 to-emerald-400/6 blur-2xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 rounded-full bg-gradient-to-r from-emerald-400/3 to-teal-400/3 blur-2xl animate-pulse delay-500"></div>
            </div>

            <div className="relative z-10 h-full w-full overflow-hidden">

                {/* Main Content Container */}
                <div className="flex flex-col items-center justify-center h-full px-3 sm:px-4 md:px-6 py-2 sm:py-4 md:py-6">

                    {/* 404 Display - Mobile optimized */}
                    <div className="relative mb-2 sm:mb-3 md:mb-4 flex-shrink-0">
                        <div className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl xl:text-[10rem] font-black text-slate-900/20 animate-gradient-x select-none">
                            404
                        </div>
                        {/* Floating QR Code Icon */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                            <QrCode className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-emerald-600/30 animate-float" />
                        </div>
                    </div>

                    {/* Error Message */}
                    <div className="text-center mb-2 sm:mb-3 md:mb-4 max-w-md sm:max-w-lg md:max-w-xl mx-auto flex-shrink-0">
                        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 mb-1 sm:mb-2 md:mb-3 leading-tight">
                            Page Not Found
                        </h1>
                        <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed px-2">
                            The page you&apos;re looking for does not exist or has been moved.
                        </p>
                    </div>

                    {/* Action Buttons - Mobile optimized */}
                    <div className="flex flex-col gap-1.5 sm:gap-2 md:gap-3 justify-center items-center w-full max-w-sm sm:max-w-xs md:max-w-sm mx-auto flex-shrink-0">

                        {/* Primary: Go Home Button */}
                        <Link href="/" className="w-full">
                            <button className="group relative w-full inline-flex items-center justify-center px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-bold text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/30 active:scale-95 min-h-[48px] touch-manipulation">
                                <Home className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2 flex-shrink-0" />
                                <span>Go Home</span>
                                {/* Enhanced hover overlay */}
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                                {/* Subtle glow effect */}
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400/20 to-teal-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl -z-20"></div>
                            </button>
                        </Link>

                        {/* Secondary: Start Scanning Button */}
                        <Link href="/scan" className="w-full">
                            <button className="group relative w-full inline-flex items-center justify-center px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-5 text-sm sm:text-base md:text-lg font-bold text-slate-700 bg-white border-2 border-emerald-300 rounded-xl transition-all duration-300 hover:border-emerald-400 hover:bg-emerald-50 hover:shadow-xl hover:shadow-emerald-200/50 active:scale-95 min-h-[48px] touch-manipulation">
                                <ScanLine className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2 flex-shrink-0" />
                                <span>Start Scanning</span>
                                {/* Subtle hover effect */}
                                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-50/0 to-teal-50/0 group-hover:from-emerald-50/50 group-hover:to-teal-50/50 transition-all duration-300"></div>
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
