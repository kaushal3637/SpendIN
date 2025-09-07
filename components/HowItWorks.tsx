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
        <section ref={sectionRef} className="min-h-screen flex flex-col justify-center items-center pt-16 sm:pt-20 pb-8 sm:pb-12 md:pb-16 lg:pb-20 px-3 sm:px-4 md:px-6 lg:px-8 bg-transparent">
            <div className="max-w-7xl mx-auto w-full">
                {/* Section Header */}
                <div className={`text-center mb-8 sm:mb-12 md:mb-16 lg:mb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-3 sm:mb-4 md:mb-6 px-2">
                        How It <span className="text-emerald-600">Works</span>
                    </h2>
                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto px-3 sm:px-4 leading-relaxed">
                        Three simple steps to revolutionize your payment experience with StableUPI
                    </p>
                </div>

                {/* Steps Container */}
                <div className="relative flex-1 flex flex-col justify-center">
                    {/* Progress Line - Hidden on mobile, visible on desktop */}
                    <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-emerald-100 transform -translate-y-1/2 z-0">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-1000 ease-out"
                            style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
                        ></div>
                    </div>

                    {/* Steps Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 lg:gap-12 relative z-10 max-w-6xl mx-auto">
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
                                    <div className={`relative p-4 sm:p-6 md:p-8 rounded-2xl transition-all duration-500 cursor-pointer touch-manipulation ${isActive
                                        ? 'bg-white border-2 border-emerald-200 scale-105 shadow-lg shadow-emerald-200/50'
                                        : 'bg-white border-2 border-emerald-100 shadow-md hover:shadow-lg hover:border-emerald-200'
                                        } min-h-[200px] sm:min-h-[220px] md:min-h-[240px] flex flex-col`}>
                                        {/* Step Number */}
                                        <div className="absolute -top-2 -left-2 sm:-top-3 sm:-left-3 md:-top-4 md:-left-4 w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                                            {index + 1}
                                        </div>

                                        {/* Icon */}
                                        <div className={`inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-2xl mb-3 sm:mb-4 md:mb-6 transition-all duration-500 ${isActive || isPassed
                                            ? `bg-gradient-to-r ${step.color} scale-110 shadow-lg`
                                            : 'bg-emerald-50'
                                            } flex-shrink-0`}>
                                            <Icon className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 transition-colors duration-500 ${isActive || isPassed ? 'text-white' : 'text-emerald-600'
                                                }`} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 flex flex-col">
                                            <h3 className={`text-lg sm:text-xl md:text-2xl font-bold mb-2 sm:mb-3 md:mb-4 transition-all duration-500 ${isActive
                                                ? 'text-emerald-600'
                                                : 'text-slate-900'
                                                }`}>
                                                {step.title}
                                            </h3>

                                            <p className="text-slate-600 text-sm sm:text-base md:text-lg leading-relaxed mb-2 sm:mb-3 md:mb-4 flex-1">
                                                {step.description}
                                            </p>

                                            <p className={`text-xs sm:text-sm md:text-base transition-all duration-500 ${isActive ? 'text-teal-600' : 'text-slate-500'
                                                }`}>
                                                {step.details}
                                            </p>
                                        </div>

                                        {/* Progress Indicator */}
                                        <div className={`mt-3 sm:mt-4 md:mt-6 h-1 bg-emerald-100 rounded-full overflow-hidden transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-50'
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
                <div className={`text-center mt-8 sm:mt-10 md:mt-12 lg:mt-16 transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                    }`}>
                    <Link href="/scan">
                        <button className="group inline-flex items-center justify-center px-6 sm:px-8 md:px-10 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/25 min-h-[48px] touch-manipulation">
                            <span className="mr-2">Try It Now</span>
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1 flex-shrink-0" />
                        </button>
                    </Link>
                </div>

                {/* Spacer to ensure full height utilization */}
                <div className="flex-grow min-h-[2rem] sm:min-h-[3rem] md:min-h-[4rem]"></div>
            </div>
        </section>
    )
}