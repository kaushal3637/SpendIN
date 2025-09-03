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
        <section ref={sectionRef} className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-transparent">
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className="text-center mb-12 sm:mb-16 lg:mb-20">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-6">
                        Why Choose <span className="text-emerald-600">StableUPI</span>
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto px-4">
                        Experience the next generation of payments with StableUPI
                        that makes cryptocurrency payments as easy as traditional UPI.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
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
                                <div className="relative h-full p-6 sm:p-8 rounded-2xl bg-white shadow-md border border-emerald-100 transition-all duration-500 hover:shadow-lg hover:scale-105 hover:shadow-emerald-200/50">
                                    {/* Gradient overlay on hover */}
                                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>

                                    {/* Icon */}
                                    <div className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-r ${feature.color} mb-4 sm:mb-6 transition-transform duration-500 group-hover:scale-110`}>
                                        <Icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 sm:mb-4 group-hover:text-emerald-600 transition-all duration-500">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors duration-500">
                                        {feature.description}
                                    </p>

                                    {/* Hover glow effect */}
                                    <div className={`absolute -inset-1 rounded-2xl bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 -z-10`}></div>
                                </div>

                                {/* Floating particles effect */}
                                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-2 h-2 rounded-full bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-ping"></div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}