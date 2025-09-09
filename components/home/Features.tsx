'use client'

import { useState, useEffect, useRef } from 'react'
import { Fuel, Zap, QrCode, Shield } from 'lucide-react'

const features = [
    {
        icon: Fuel,
        title: "Gas Sponsorship",
        description: "We sponsor ETH for smooth transactions, so you don't need to hold ETH. Payment covers all costs in USDC.",
        color: "from-emerald-500 to-teal-500"
    },
    {
        icon: Zap,
        title: "Instant Conversion",
        description: "Real-time INR to USDC conversion with live market rates for transparent pricing.",
        color: "from-teal-500 to-emerald-500"
    },
    {
        icon: QrCode,
        title: "QR Payments",
        description: "Simple scan-and-pay experience. No complex wallet addresses or manual entry required.",
        color: "from-emerald-500 to-teal-500"
    },
    {
        icon: Shield,
        title: "Secure Integration",
        description: "High security with Web3 wallet integration. Your funds remain in your control.",
        color: "from-emerald-500 to-teal-500"
    }
]

export default function Features() {
    const [visibleCards, setVisibleCards] = useState<number[]>([])
    const sectionRef = useRef<HTMLElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        // Animate cards with stagger effect
                        features.forEach((_, index) => {
                            setTimeout(() => {
                                setVisibleCards(prev => [...prev, index])
                            }, index * 200)
                        })
                    }
                })
            },
            { threshold: 0.1 }
        )

        if (sectionRef.current) {
            observer.observe(sectionRef.current)
        }

        return () => observer.disconnect()
    }, [])

    return (
        <section ref={sectionRef} className="min-h-screen flex flex-col justify-center items-center pt-16 sm:pt-20 pb-8 sm:pb-12 md:pb-16 lg:pb-20 px-3 sm:px-4 md:px-6 lg:px-8 bg-transparent">
            <div className="max-w-7xl mx-auto w-full">
                {/* Section Header */}
                <div className="text-center mb-8 sm:mb-12 md:mb-16 lg:mb-20">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 sm:mb-4 md:mb-6 px-2">
                        Why Choose <span className="text-emerald-600">StableUPI</span>
                    </h2>
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto px-3 sm:px-4 leading-relaxed">
                        Experience the next generation of payments with StableUPI
                        that makes cryptocurrency payments as easy as traditional UPI.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="relative flex-1 flex flex-col justify-center">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
                        {features.map((feature, index) => {
                            const Icon = feature.icon
                            const isVisible = visibleCards.includes(index)

                            return (
                                <div
                                    key={index}
                                    className={`group relative transition-all duration-700 ${isVisible
                                        ? 'opacity-100 translate-y-0'
                                        : 'opacity-0 translate-y-10'
                                        }`}
                                    style={{ transitionDelay: `${index * 100}ms` }}
                                >
                                    {/* Card */}
                                    <div className="relative h-full p-4 sm:p-6 md:p-8 rounded-2xl bg-white shadow-md border border-emerald-100 transition-all duration-500 hover:shadow-lg hover:scale-105 hover:shadow-emerald-200/50 min-h-[180px] sm:min-h-[200px] md:min-h-[220px] flex flex-col touch-manipulation">
                                        {/* Gradient overlay on hover */}
                                        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

                                        {/* Icon */}
                                        <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-r ${feature.color} mb-3 sm:mb-4 md:mb-6 transition-transform duration-500 group-hover:scale-110 flex-shrink-0`}>
                                            <Icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 flex flex-col">
                                            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 mb-2 sm:mb-3 md:mb-4 group-hover:text-emerald-600 transition-all duration-500">
                                                {feature.title}
                                            </h3>
                                            <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors duration-500 flex-1">
                                                {feature.description}
                                            </p>
                                        </div>

                                        {/* Hover glow effect */}
                                        <div className={`absolute -inset-1 rounded-2xl bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 -z-10`}></div>
                                    </div>

                                    {/* Floating particles effect */}
                                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-ping"></div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Spacer to ensure full height utilization */}
                <div className="flex-grow min-h-[2rem] sm:min-h-[3rem] md:min-h-[4rem]"></div>
            </div>
        </section>
    )
}