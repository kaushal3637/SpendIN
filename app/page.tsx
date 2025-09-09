import Hero from '@/components/home/Hero'
import Features from '@/components/home/Features'
import HowItWorks from '@/components/home/HowItWorks'
import Footer from '@/components/layout/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-transparent">
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
  )
}