'use client'

import { MapPin } from 'lucide-react'

export default function Footer() {
    return (
        <footer className="relative py-8 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8 bg-transparent">
            <div className="relative max-w-7xl mx-auto">
                {/* Bottom Bar */}
                <div className="pt-2 sm:pt-3 lg:pt-4 border-t border-emerald-300">

                    {/* Mobile Layout (Stacked) */}
                    <div className="flex flex-col items-center gap-4 sm:hidden">
                        <div className="text-slate-600 text-sm text-center">
                            © 2024 StableUPI. All rights reserved.
                        </div>

                        <div className="flex flex-col items-center gap-3 text-sm text-slate-600">
                            <span className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Built in India
                            </span>

                            <span>Made with ❤️ for Web3</span>

                            <div className="flex items-center gap-2">
                                <span className="relative">
                                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                    <div className="absolute inset-0 w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
                                </span>
                                <span>Live & Operational</span>
                            </div>
                        </div>
                    </div>

                    {/* Tablet Layout (Wrapped) */}
                    <div className="hidden sm:flex lg:hidden flex-col gap-4">
                        <div className="text-slate-600 text-sm text-center">
                            © 2024 StableUPI. All rights reserved.
                        </div>

                        <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
                            <span className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Built in India
                            </span>

                            <span className="hidden sm:inline">|</span>

                            <span>Made with ❤️ for Web3</span>

                            <span className="hidden sm:inline">|</span>

                            <div className="flex items-center gap-2">
                                <span className="relative">
                                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                    <div className="absolute inset-0 w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
                                </span>
                                <span>Live & Operational</span>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Layout (Side by Side) */}
                    <div className="hidden lg:flex items-center justify-between gap-4">
                        <div className="text-slate-600 text-sm">
                            © 2024 StableUPI. All rights reserved.
                        </div>

                        <div className="flex items-center text-sm text-slate-600">
                            <span className="flex items-center gap-2 mr-2">
                                <MapPin className="w-4 h-4" />
                                Built in India
                            </span>
                            <span className="mx-2">|</span>
                            <span className="mx-2">Made with ❤️ for Web3</span>
                            <span className="mx-2">|</span>
                            <div className="flex items-center gap-2 ml-2">
                                <span className="relative">
                                    <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                    <div className="absolute inset-0 w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
                                </span>
                                <span>Live & Operational</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}