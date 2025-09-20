'use client'

import { MapPin, Heart, Shield, Zap, Globe } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
    return (
        <footer className="relative py-12 px-4 sm:px-6 lg:px-8 bg-transparent">
            <div className="relative max-w-7xl mx-auto">
                {/* Main Content */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    {/* Brand Section */}
                    <div className="md:col-span-1">
                        <Link href="/" className="flex items-center mb-4">
                            <Image
                                src="/logo.svg"
                                alt="StableUPI Logo"
                                width={120}
                                height={40}
                                className="h-8 w-auto"
                                priority
                            />
                        </Link>
                        <p className="text-slate-600 text-sm leading-relaxed mb-4">
                            Pay with USDC, merchants get INR seamlessly with zero gas fees.
                        </p>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span className="relative">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                                <div className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
                            </span>
                            <span>Live & Operational</span>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-slate-800 font-semibold text-sm mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="#features" className="text-slate-600 hover:text-emerald-600 transition-colors text-sm">
                                    Features
                                </Link>
                            </li>
                            <li>
                                <Link href="#how-it-works" className="text-slate-600 hover:text-emerald-600 transition-colors text-sm">
                                    How It Works
                                </Link>
                            </li>
                            <li>
                                <Link href="/scan" className="text-slate-600 hover:text-emerald-600 transition-colors text-sm">
                                    QR Scanner
                                </Link>
                            </li>
                            <li>
                                <Link href="/beneficiary" className="text-slate-600 hover:text-emerald-600 transition-colors text-sm">
                                    Beneficiary
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Features */}
                    <div>
                        <h3 className="text-slate-800 font-semibold text-sm mb-4">Key Features</h3>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-2 text-slate-600 text-sm">
                                <Shield className="w-4 h-4 text-emerald-500" />
                                Secure Payments
                            </li>
                            <li className="flex items-center gap-2 text-slate-600 text-sm">
                                <Zap className="w-4 h-4 text-emerald-500" />
                                Zero Gas Fees
                            </li>
                            <li className="flex items-center gap-2 text-slate-600 text-sm">
                                <Globe className="w-4 h-4 text-emerald-500" />
                                Multi-Chain Support
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-6 border-t border-slate-200">
                    {/* Mobile Layout (Stacked) */}
                    <div className="flex flex-col items-center gap-4 sm:hidden">
                        <div className="text-slate-500 text-sm text-center">
                            © 2024 StableUPI. All rights reserved.
                        </div>

                        <div className="flex flex-col items-center gap-3 text-sm text-slate-500">
                            <span className="flex items-center gap-2">
                                <Heart className="w-4 h-4 text-red-400" />
                                Made with love for Web3
                            </span>

                            <span className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Built in India
                            </span>
                        </div>
                    </div>

                    {/* Tablet Layout (Wrapped) */}
                    <div className="hidden sm:flex lg:hidden flex-col gap-4">
                        <div className="text-slate-500 text-sm text-center">
                            © 2025 SpendIN. All rights reserved.
                        </div>

                        <div className="flex items-center justify-center flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                            <span className="flex items-center gap-2">
                                <Heart className="w-4 h-4 text-red-400" />
                                Made with love for Web3
                            </span>

                            <span className="hidden sm:inline">|</span>

                            <span className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                Built in India
                            </span>
                        </div>
                    </div>

                    {/* Desktop Layout (Side by Side) */}
                    <div className="hidden lg:flex items-center justify-between gap-4">
                        <div className="text-slate-500 text-sm">
                            © 2024 StableUPI. All rights reserved.
                        </div>

                        <div className="flex items-center text-sm text-slate-500">
                            <span className="flex items-center gap-2 mr-2">
                                <Heart className="w-4 h-4 text-red-400" />
                                Made with love for Web3
                            </span>
                            <span className="mx-2">|</span>
                            <span className="flex items-center gap-2 ml-2">
                                <MapPin className="w-4 h-4" />
                                Built in India
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}