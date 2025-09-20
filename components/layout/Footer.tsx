'use client'

import { MapPin, Heart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
    return (
        <footer className="relative py-4 px-4 sm:px-6 lg:px-8 bg-transparent">
            <div className="relative max-w-7xl mx-auto">
                {/* Main Content */}
                <div className="">
                    {/* Desktop Layout */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-2">
                        {/* Left Column - Logo and Copyright */}
                        <div className="flex flex-col items-center sm:items-start gap-3">
                            <Link href="/" className="flex items-center">
                                <Image
                                    src="/logo.svg"
                                    alt="SpendIN Logo"
                                    width={120}
                                    height={40}
                                    className="h-8 w-auto"
                                    priority
                                />
                            </Link>
                            <div className="text-slate-500 text-sm">
                                © 2025 SpendIN. All rights reserved.
                            </div>
                        </div>


                        {/* Right Column - Web3 and India */}
                        <div className="text-sm text-slate-500">
                            <span className="flex items-center gap-2">
                                <Heart className="w-4 h-4 text-red-400" />
                                Made with love for Web3{" "} | {" "}<MapPin className="w-4 h-4" />{""}
                                Built in India
                            </span>
                        </div>
                    </div>
                </div>

            </div>
        </footer>
    )
}