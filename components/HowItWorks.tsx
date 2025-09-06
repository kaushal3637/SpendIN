'use client'

import { useState, useEffect, useRef } from 'react'
import { Wallet, IndianRupee, CheckCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const steps = [
    {
        icon: Wallet,
        title: "Connect Wallet",
        description: "Connect your Web3 wallet securely to StableUPI platform",
        details: "Support for MetaMask, WalletConnect, and other popular wallets",
        color: "from-emerald-500 to-teal-500"
    },
    {
        icon: IndianRupee,
        title: "Enter INR Amount",
        description: "Scan merchant QR code and enter the payment amount in INR",
        details: "Real-time conversion rates instantly",
        color: "from-teal-500 to-emerald-500"
    },
    {
        icon: CheckCircle,
        title: "Confirm Payment",
        description: "Review and confirm - We handle gas fees and USDC conversion",
        details: "Transaction completed in under 1 minute",
        color: "from-emerald-500 to-teal-500"
    }
]

export default function HowItWorks() {
    const [activeStep, setActiveStep] = useState(0)
    const [isVisible, setIsVisible] = useState(false)
    const sectionRef = useRef<HTMLElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true)
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

    // Auto-advance steps
    useEffect(() => {
        if (isVisible) {
            const interval = setInterval(() => {
                setActiveStep((prev) => (prev + 1) % steps.length)
            }, 3000)
            return () => clearInterval(interval)
        }
    }, [isVisible])

    return (
        <section ref={sectionRef} className="min-h-[70vh] sm:min-h-screen flex items-start sm:items-center pt-20 pb-8 sm:py-12 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-transparent">
            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <div className={`text-center mb-12 sm:mb-16 lg:mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}>
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-6">
                        How It <span className="text-emerald-600">Works</span>
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto px-4">
                        Three simple steps to revolutionize your payment experience with StableUPI
                    </p>
                </div>

                {/* Steps Container */}
                <div className="relative">
                    {/* Progress Line - Hidden on mobile, visible on desktop */}
                    <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-emerald-100 transform -translate-y-1/2 z-0">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-1000 ease-out"
                            style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
                        ></div>
                    </div>

                    {/* Steps Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12 relative z-10">
                        {steps.map((step, index) => {
                            const Icon = step.icon
                            const isActive = index === activeStep
                            const isPassed = index < activeStep

                            return (
                                <div
                                    key={index}
                                    className={`relative transition-all duration-700 ${isVisible
                                        ? 'opacity-100 translate-y-0'
                                        : 'opacity-0 translate-y-10'
                                        } ${
                                        // Handle odd item in 2-column layout
                                        index === steps.length - 1 && steps.length % 2 !== 0
                                            ? 'sm:col-span-2 lg:col-span-1 sm:max-w-md sm:mx-auto lg:max-w-none'
                                            : ''
                                        }`}
                                    style={{ transitionDelay: `${index * 200}ms` }}
                                    onMouseEnter={() => setActiveStep(index)}
                                >
                                    {/* Step Card */}
                                    <div className={`relative p-6 sm:p-8 rounded-2xl transition-all duration-500 cursor-pointer ${isActive
                                        ? 'bg-white border-2 border-emerald-200 scale-105 shadow-lg shadow-emerald-200/50'
                                        : 'bg-white border-2 border-emerald-100 shadow-md hover:shadow-lg hover:border-emerald-200'
                                        }`}>
                                        {/* Step Number */}
                                        <div className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                                            {index + 1}
                                        </div>

                                        {/* Icon */}
                                        <div className={`inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl mb-4 sm:mb-6 transition-all duration-500 ${isActive || isPassed
                                            ? `bg-gradient-to-r ${step.color} scale-110 shadow-lg`
                                            : 'bg-emerald-50'
                                            }`}>
                                            <Icon className={`w-8 h-8 sm:w-10 sm:h-10 transition-colors duration-500 ${isActive || isPassed ? 'text-white' : 'text-emerald-600'
                                                }`} />
                                        </div>

                                        {/* Content */}
                                        <h3 className={`text-xl sm:text-2xl font-bold mb-3 sm:mb-4 transition-all duration-500 ${isActive
                                            ? 'text-emerald-600'
                                            : 'text-slate-900'
                                            }`}>
                                            {step.title}
                                        </h3>

                                        <p className="text-slate-600 text-base sm:text-lg leading-relaxed mb-3 sm:mb-4">
                                            {step.description}
                                        </p>

                                        <p className={`text-sm transition-all duration-500 ${isActive ? 'text-teal-600' : 'text-slate-500'
                                            }`}>
                                            {step.details}
                                        </p>

                                        {/* Progress Indicator */}
                                        <div className={`mt-4 sm:mt-6 h-1 bg-emerald-100 rounded-full overflow-hidden transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-50'
                                            }`}>
                                            <div
                                                className={`h-full bg-gradient-to-r ${step.color} transition-all duration-1000 ${isActive ? 'w-full' : isPassed ? 'w-full' : 'w-0'
                                                    }`}
                                            ></div>
                                        </div>

                                        {/* Active indicator glow */}
                                        {isActive && (
                                            <div className={`absolute -inset-1 rounded-3xl bg-gradient-to-r ${step.color} opacity-20 blur-xl -z-10`}></div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Bottom CTA */}
                <div className={`text-center mt-12 sm:mt-16 transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}>
                    <Link href="/scan">
                        <button className="group inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/25">
                            <span className="mr-2">Try It Now</span>
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
                        </button>
                    </Link>
                </div>
            </div>
        </section>
    )
}