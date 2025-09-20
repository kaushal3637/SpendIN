'use client'

import { useState } from "react";
import Hero from "@/components/home/Hero";
import Features from "@/components/home/Features";
import HowItWorks from "@/components/home/HowItWorks";
import Footer from "@/components/layout/Footer";
import StableUPILoader from "../layout/stable-upi-loader";
import Navbar from "../layout/Navbar";

export default function Homepage() {
  const [isLoading, setIsLoading] = useState(true);

  const handleLoaderComplete = () => {
    setIsLoading(false);
  };

  return (
    <>
      <StableUPILoader
        isLoading={isLoading}
        onComplete={handleLoaderComplete}
      />
      {!isLoading && (
        <div className="min-h-screen bg-transparent">
          <div className="flex items-center justify-center"><Navbar /></div>
          <section id="hero">
            <Hero />
          </section>
          <section id="features">
            <Features />
          </section>
          <section id="how-it-works">
            <HowItWorks />
          </section>
          <section id="footer">
            <Footer />
          </section>
        </div>
      )}
    </>
  );
}
