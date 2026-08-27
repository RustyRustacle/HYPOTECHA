import { useState, useEffect, useRef, type ReactNode } from 'react'
import { Bank } from '@phosphor-icons/react/Bank'
import { ChartLineUp } from '@phosphor-icons/react/ChartLineUp'
import { ShippingContainer } from '@phosphor-icons/react/ShippingContainer'
import { HouseLine } from '@phosphor-icons/react/HouseLine'
import { FloatingCoins } from '@/components/FloatingCoins'
import { ParticlesBackground } from '@/components/ParticlesBackground'
import { SectionBackground } from '@/components/SectionBackground'
import { LiveTicker } from '@/components/LiveTicker'
import { useTyping } from '@/lib/useTyping'
import { useCounter } from '@/lib/useCounter'

interface LandingProps {
  onLaunchApp: () => void
}

function useSectionReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold, rootMargin: '0px 0px -40px 0px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border border-border/50 text-[11px] text-text-muted uppercase tracking-[0.2em] mb-5">
      {children}
    </div>
  )
}

function StatCard({ value, label, sub, delay }: { value: string; label: string; sub: string; delay: string }) {
  const { ref, visible } = useSectionReveal()
  const num = /^\$?[\d.,]+[T%+<k]*$/.test(value) ? parseFloat(value.replace(/[^0-9.]/g, '')) : 0
  const counter = useCounter(num, 1600, visible)
  const prefix = value.startsWith('$') ? '$' : ''
  const suffix = value.replace(/[0-9.,$]/g, '')
  const display = num ? prefix + counter.toLocaleString(undefined, { maximumFractionDigits: 0 }) + suffix : value
  return (
    <div ref={ref} className={`glass-strong rounded-2xl p-6 text-center card-hover transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: delay }}>
      <div className="text-3xl md:text-4xl font-bold font-mono gradient-text-numbers mb-2">{display}</div>
      <div className="text-sm font-medium text-text-secondary mb-1">{label}</div>
      <div className="text-xs text-text-muted">{sub}</div>
    </div>
  )
}

function FeatureCard({ icon, title, desc, accent, delay, featured, bars }: { icon: ReactNode; title: string; desc: string; accent: string; delay: string; featured?: boolean; bars?: number[] }) {
  const { ref, visible } = useSectionReveal()
  return (
    <div ref={ref} className={`group relative glass-strong rounded-2xl p-8 card-hover transition-all duration-500 overflow-hidden ${featured ? 'md:row-span-2 md:flex md:flex-col md:justify-center' : ''} ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`} style={{ transitionDelay: delay }}>
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-surface-raised border border-border/60 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 group-hover:border-primary/30 transition-all duration-300">{icon}</div>
        {featured && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-[11px] font-medium mb-4">
            <span className="w-1 h-1 rounded-full bg-primary animate-pulse" /> Core Guard
          </div>
        )}
        <h3 className="text-lg font-semibold text-text mb-3">{title}</h3>
        <p className="text-sm text-text-secondary leading-relaxed">{desc}</p>
        {featured ? (
          <div className="mt-6 h-2 rounded-full bg-surface-raised overflow-hidden">
            <div className="h-full w-3/5 bg-gradient-to-r from-primary to-info-light rounded-full" />
          </div>
        ) : (
          bars && (
            <div className="mt-6 flex items-end gap-1.5 h-10">
              {bars.map((h, i) => (
                <div key={i} className="w-2 mx-auto rounded-t-md bg-gradient-to-t from-primary/30 to-primary/70 transition-all duration-500 group-hover:from-primary/60 group-hover:to-info-light" style={{ height: `${h}%` }} />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}

function StepCard({ step, title, desc, active, onClick }: { step: string; title: string; desc: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-left relative transition-all duration-500 group text-center focus:outline-none ${active ? 'scale-[1.03]' : 'opacity-70 hover:opacity-100'}`}
    >
      <div className={`relative w-16 h-16 rounded-2xl border flex items-center justify-center font-mono font-bold text-lg mx-auto mb-6 transition-all duration-300 ${active ? 'bg-primary/15 border-primary/40 shadow-lg shadow-primary/20' : 'bg-surface border-border/60 hover:border-primary/30'}`}>
        <span className={active ? 'text-primary' : 'gradient-text'}>{step}</span>
        <div className={`absolute inset-0 rounded-2xl ${active ? 'bg-primary/10 animate-pulse' : 'bg-primary/5 opacity-0 group-hover:opacity-100'} transition-opacity duration-300`} />
        {active && <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />}
      </div>
      <h3 className="text-lg font-semibold text-text mb-3">{title}</h3>
      <p className="text-sm text-text-secondary leading-relaxed max-w-xs mx-auto">{desc}</p>
    </button>
  )
}

function UseCaseCard({ icon, name, desc, metric, sub, active, onClick }: { icon: ReactNode; name: string; desc: string; metric: string; sub: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`glass rounded-xl p-5 card-hover group cursor-pointer text-left transition-all duration-300 focus:outline-none relative overflow-hidden ${active ? 'ring-1 ring-primary/50 border-primary/30' : ''}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="w-10 h-10 rounded-lg bg-surface-raised border border-border/60 flex items-center justify-center text-primary group-hover:scale-110 group-hover:bg-primary/10 transition-all duration-300">{icon}</div>
          <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${active ? 'bg-primary/15 text-primary' : 'bg-surface-raised text-text-muted'}`}>{metric}</span>
        </div>
        <div className="text-sm font-semibold text-text mb-1">{name}</div>
        <div className="text-xs text-text-secondary leading-relaxed">{desc}</div>
        <div className={`text-[10px] text-primary mt-2 font-medium transition-all duration-300 ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-60'}`}>{sub}</div>
      </div>
    </button>
  )
}

const partners = [
  { name: 'Hedera', sub: 'Network' },
  { name: 'ATS', sub: 'SDK' },
  { name: 'Diamond', sub: 'EIP-2535' },
  { name: 'ERC-1400', sub: 'Token' },
  { name: 'HashScan', sub: 'Explorer' },
  { name: 'Hedera', sub: 'Network' },
  { name: 'ATS', sub: 'SDK' },
  { name: 'Diamond', sub: 'EIP-2535' },
  { name: 'ERC-1400', sub: 'Token' },
  { name: 'HashScan', sub: 'Explorer' },
]

export function Landing({ onLaunchApp }: LandingProps) {
  const [scrolled, setScrolled] = useState(false)
  const [barWidth, setBarWidth] = useState(0)
  const [activeStep, setActiveStep] = useState(0)
  const [activeCase, setActiveCase] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setBarWidth(60), 800)
    return () => clearTimeout(timer)
  }, [])

  const { ref: heroRef, visible: heroVisible } = useSectionReveal(0.1)
  const typedText = useTyping(heroVisible)

  return (
    <div className="min-h-screen bg-background text-text relative">
      {/* Interactive particles background */}
      <ParticlesBackground />

      {/* Mesh gradient background */}
      <div className="fixed inset-0 mesh-gradient pointer-events-none" />

      {/* Grid dots */}
      <div className="fixed inset-0 grid-bg opacity-30 pointer-events-none" />

      {/* Floating orbs */}
      <div className="orb w-[600px] h-[600px] bg-primary/15 top-[-150px] left-[5%] pointer-events-none" />
      <div className="orb w-[400px] h-[400px] bg-info/10 top-[25%] right-[-80px] pointer-events-none" style={{ animationDelay: '2s', animationDuration: '8s' }} />
      <div className="orb w-[350px] h-[350px] bg-warning/[0.06] bottom-[15%] left-[-80px] pointer-events-none" style={{ animationDelay: '4s', animationDuration: '7s' }} />

      {/* NAV */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'glass-strong shadow-2xl shadow-black/40' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">H</div>
            <span className="font-semibold text-text text-lg tracking-tight">HYPOTECHA</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-text-secondary">
            <a href="#features" className="hover:text-text transition-colors duration-200">Features</a>
            <a href="#how-it-works" className="hover:text-text transition-colors duration-200">How It Works</a>
            <a href="#use-cases" className="hover:text-text transition-colors duration-200">Use Cases</a>
            <a href="https://github.com/RustyRustacle/HYPOTECHA" target="_blank" className="hover:text-text transition-colors duration-200 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              GitHub
            </a>
          </div>
          <button
            onClick={onLaunchApp}
            className="btn-primary px-5 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-light transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/40"
          >
            Launch App
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section ref={heroRef} className="relative pt-36 pb-24 px-6 overflow-hidden min-h-screen">
        <SectionBackground kind="video" src="/bg/plexus.mp4" opacity={70} overlay="linear-gradient(to bottom, rgba(4,6,13,0.55), rgba(4,6,13,0.42) 45%, rgba(4,6,13,0.75))" />

        {/* Floating crypto coins */}
        <FloatingCoins />

        {/* Decorative ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-primary/[0.06] rounded-full spin-slow pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-info/[0.04] rounded-full spin-slow pointer-events-none" style={{ animationDirection: 'reverse', animationDuration: '30s' }} />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/20 text-primary text-xs font-medium mb-8 transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <img src="/HederaLogoFix.webp" alt="Hedera" className="h-3.5 w-auto" />
            Hedera Testnet Live
          </div>

          {/* Heading */}
          <h1 className={`text-5xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tight mb-6 leading-[1.05] transition-all duration-700 delay-100 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <span className="text-text">On-Chain</span>
            <br />
            <span className="gradient-text-shimmer">{typedText}</span>
          </h1>

          {/* Subtitle */}
          <p className={`text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed transition-all duration-700 delay-200 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            Prevent double-pledging of tokenized assets. Record, enforce, and verify
            collateral claims on-chain â€” built on{' '}
            <span className="text-text font-medium">Hedera Asset Tokenization Studio</span>.
          </p>

          {/* CTA buttons */}
          <div className={`flex items-center justify-center gap-4 mb-16 transition-all duration-700 delay-300 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <button
              onClick={onLaunchApp}
              className="btn-primary group px-8 py-3.5 rounded-xl bg-primary text-white text-base font-semibold shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:bg-primary-light hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-2"
            >
              Launch Dashboard
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </button>
            <a
              href="https://github.com/RustyRustacle/HYPOTECHA"
              target="_blank"
              className="px-8 py-3.5 rounded-xl glass border border-border text-text-secondary text-base font-medium hover:text-text hover:border-text-muted/50 transition-all duration-300 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              View Source
            </a>
          </div>

          {/* Hero card - Encumbrance bar preview */}
          <div className={`max-w-3xl mx-auto transition-all duration-700 delay-[400ms] ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="glass-strong rounded-2xl p-6 glow-border shadow-2xl shadow-black/40 noise-overlay relative">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">US</div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-text">US Treasury Bond #123</div>
                      <div className="text-xs font-mono text-text-muted">UST-123 Â· $1,000,000</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">Live</span>
                  </div>
                </div>

                {/* Animated bar */}
                <div className="relative h-10 rounded-xl overflow-hidden flex bg-surface-raised mb-4 bar-animated">
                  <div
                    className="h-full bg-gradient-to-r from-slate-400 to-slate-300 relative overflow-hidden"
                    style={{ width: `${barWidth}%`, transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  </div>
                  <div
                    className="h-full bg-gradient-to-r from-primary/30 to-primary/20"
                    style={{ width: `${100 - barWidth}%`, transition: 'width 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400 shadow-sm shadow-slate-400/50" />
                      <span className="text-text-secondary">Bank A</span>
                      <span className="font-mono text-text-muted">$600K</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary/50 shadow-sm shadow-primary/30" />
                      <span className="text-text-secondary">Available</span>
                      <span className="font-mono text-primary">$400K</span>
                    </div>
                  </div>
                  <span className="font-mono text-text-muted">60% encumbered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE TICKER */}
      <LiveTicker />

      {/* MARQUEE - Built On */}
      <section className="py-14 border-y border-border/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.02] to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 relative mb-8">
          <p className="text-center text-[11px] text-text-muted uppercase tracking-[0.2em]">Built with</p>
        </div>
        <div className="marquee-container">
          <div className="marquee-track">
            {[...partners, ...partners].map((p, i) => (
              <div key={i} className="flex items-center gap-2 px-8 py-2 opacity-30 hover:opacity-70 transition-opacity duration-300 cursor-default shrink-0">
                {p.name === 'Hedera' ? (
                  <img src="/HederaLogoFix.webp" alt="Hedera" className="h-8 w-auto" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-surface-raised border border-border/60 flex items-center justify-center">
                    <span className="text-[9px] font-mono text-text-muted font-medium">{p.name.slice(0, 2)}</span>
                  </div>
                )}
                <div className="text-left">
                  <div className="text-sm font-semibold text-text-secondary leading-none">{p.name}</div>
                  <div className="text-[10px] text-text-muted">{p.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-24 px-6 relative overflow-hidden">
        <SectionBackground kind="image" src="/bg/stats-metal.jpg" opacity={40} overlay="linear-gradient(to bottom, rgba(4,6,13,0.8), rgba(4,6,13,0.62) 50%, rgba(4,6,13,0.86))" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <StatCard value="$16T+" label="Tokenized RWA Market" sub="Projected by 2030" delay="0ms" />
            <StatCard value="0" label="Double-Pledges" sub="With Hypotheca enforcement" delay="100ms" />
            <StatCard value="<50ms" label="On-Chain Verification" sub="Guard check latency" delay="200ms" />
            <StatCard value="100%" label="Audit Trail" sub="Full claim history on-chain" delay="300ms" />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-24 px-6 relative overflow-hidden">
        <SectionBackground kind="video" src="/bg/wave.mp4" opacity={62} overlay="linear-gradient(to bottom, rgba(4,6,13,0.72), rgba(4,6,13,0.55) 50%, rgba(4,6,13,0.82))" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/[0.03] rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <SectionLabel>Core Capabilities</SectionLabel>
            <h2 className="text-3xl md:text-5xl font-bold text-text mb-4">Why Hypotheca?</h2>
            <p className="text-text-secondary max-w-xl mx-auto leading-relaxed">
              The missing compliance layer for tokenized real-world assets. Prevent fraud, enforce claims, and build trust on-chain.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              featured
              icon={<svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
              title="Prevent Double-Pledging"
              desc="On-chain guard checks ensure the same asset cannot be pledged for more than its value. Rejected transactions are transparent and verifiable."
              accent="from-primary/5 to-transparent"
              delay="0ms"
            />
            <FeatureCard
              icon={<svg className="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              title="Real-Time Claim Registry"
              desc="Every encumbrance is recorded on-chain with full audit trail. Check available balance, active claims, and claim history in real-time."
              accent="from-info/5 to-transparent"
              delay="100ms"
              bars={[35, 55, 40, 70, 55, 85, 65]}
            />
            <FeatureCard
              icon={<svg className="w-6 h-6 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
              title="Institutional-Grade Enforcement"
              desc="Built on Hedera ATS with Diamond Pattern architecture. Inherits KYC/identity compliance from ERC-1400/3643 security token standards."
              accent="from-warning/5 to-transparent"
              delay="200ms"
              bars={[70, 45, 60, 35, 50, 40, 30]}
            />
            <FeatureCard
              icon={<svg className="w-6 h-6 text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
              title="Transparent Audit Trail"
              desc="Every create, release, and default event is permanently recorded on Hedera Mirror Node, verifiable by anyone."
              accent="from-primary-light/5 to-transparent"
              delay="300ms"
              bars={[25, 40, 35, 55, 45, 60, 50]}
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-6 relative overflow-hidden">
        <SectionBackground kind="video" src="/bg/vortex.mp4" opacity={52} overlay="linear-gradient(to bottom, rgba(4,6,13,0.78), rgba(4,6,13,0.6) 50%, rgba(4,6,13,0.85))" />
        <div className="absolute inset-0 bg-surface/30" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <SectionLabel>Workflow</SectionLabel>
            <h2 className="text-3xl md:text-5xl font-bold text-text mb-4">How It Works</h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Three simple steps to enforce collateral claims on tokenized assets.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative mb-10">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-[18%] right-[18%] h-px">
              <div className="w-full h-full bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            </div>

            <StepCard step="01" title="Issue Tokenized Asset" desc="Create a tokenized treasury, bond, or equity via Hedera ATS. Assets are ERC-1400 compliant with built-in identity registry." active={activeStep === 0} onClick={() => setActiveStep(0)} />
            <StepCard step="02" title="Pledge Collateral" desc="Lenders create encumbrance claims against the asset. The on-chain guard checks available balance and rejects over-pledges." active={activeStep === 1} onClick={() => setActiveStep(1)} />
            <StepCard step="03" title="Enforce & Release" desc="Claims are tracked in real-time. Repay loans and release claims. Full audit trail maintained on Hedera Mirror Node." active={activeStep === 2} onClick={() => setActiveStep(2)} />
          </div>

          {/* Active step detail panel */}
          <div className="max-w-4xl mx-auto glass-strong rounded-2xl p-6 md:p-8 glow-border relative overflow-hidden">
            {activeStep === 0 && (
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary text-xl shrink-0">ðŸ¦</div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Step 01 Â· Tokenization</div>
                  <h4 className="text-base font-semibold text-text mb-1">Tokenized Treasury $1,000,000</h4>
                  <p className="text-sm text-text-secondary">Asset issued on Hedera ATS with ERC-1400 identity registry and full compliance controls baked in.</p>
                </div>
              </div>
            )}
            {activeStep === 1 && (
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary text-xl shrink-0">ðŸ”’</div>
                <div className="flex-1">
                  <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Step 02 Â· Guard Check</div>
                  <h4 className="text-base font-semibold text-text mb-2">Bank A pledges $600,000</h4>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm font-mono text-text-secondary">60%</span>
                    <div className="h-2 flex-1 rounded-full bg-surface-raised overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-info-light rounded-full" style={{ width: '60%' }} />
                    </div>
                    <span className="text-sm font-mono text-primary">$400K available</span>
                  </div>
                  <p className="text-sm text-text-secondary">On-chain guard verifies available balance and transparently rejects any over-pledge.</p>
                </div>
              </div>
            )}
            {activeStep === 2 && (
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary text-xl shrink-0">âœ…</div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-text-muted mb-1">Step 03 Â· Settlement</div>
                  <h4 className="text-base font-semibold text-text mb-1">Repay loan â†’ release claim</h4>
                  <p className="text-sm text-text-secondary">Available balance restored on release. Every event permanently recorded on Hedera Mirror Node for audit.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* USE CASES */}
      <section id="use-cases" className="py-24 px-6 relative overflow-hidden">
        <SectionBackground kind="image" src="/bg/silver-lines.jpg" opacity={26} overlay="linear-gradient(to bottom, rgba(4,6,13,0.85), rgba(4,6,13,0.7) 50%, rgba(4,6,13,0.9))" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <SectionLabel>Applications</SectionLabel>
            <h2 className="text-3xl md:text-5xl font-bold text-text mb-4">Use Cases</h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              Any scenario that requires on-chain collateral verification for real-world assets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <UseCaseCard icon={<Bank weight="duotone" className="w-5 h-5" />} name="Repo Markets" desc="Repurchase agreements with on-chain collateral tracking" metric="$1.2T" sub="Treasury-backed" active={activeCase === 0} onClick={() => setActiveCase(0)} />
            <UseCaseCard icon={<ChartLineUp weight="duotone" className="w-5 h-5" />} name="Securities Lending" desc="Prevent re-hypothecation of tokenized securities" metric="$4.5T" sub="Stocks & bonds" active={activeCase === 1} onClick={() => setActiveCase(1)} />
            <UseCaseCard icon={<ShippingContainer weight="duotone" className="w-5 h-5" />} name="Trade Finance" desc="Enforce liens on tokenized trade documents" metric="$8.6T" sub="Global trade gap" active={activeCase === 2} onClick={() => setActiveCase(2)} />
            <UseCaseCard icon={<HouseLine weight="duotone" className="w-5 h-5" />} name="Real Estate" desc="Track mortgage claims on tokenized property" metric="$13T" sub="Global REITs" active={activeCase === 3} onClick={() => setActiveCase(3)} />
          </div>

          {/* Active use-case detail panel */}
          <div className="max-w-4xl mx-auto glass-strong rounded-2xl p-6 md:p-8 glow-border relative overflow-hidden">
            {activeCase === 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary"><Bank weight="duotone" className="w-6 h-6" /></span>
                  <div>
                    <h4 className="text-lg font-semibold text-text">Repurchase Agreements</h4>
                    <p className="text-sm text-text-primary">Track the same treasury collateral across multiple repo legs without double-pledging.</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[['$1.2T', 'Global repo market'], ['<50ms', 'Guard latency'], ['0', 'Double-pledges']].map(([v, l]) => (
                    <div key={l} className="rounded-xl bg-surface-raised/60 p-4"><div className="text-lg font-mono gradient-text-numbers">{v}</div><div className="text-[11px] text-text-muted mt-1">{l}</div></div>
                  ))}
                </div>
              </div>
            )}
            {activeCase === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary"><ChartLineUp weight="duotone" className="w-6 h-6" /></span>
                  <div>
                    <h4 className="text-lg font-semibold text-text">Securities Lending</h4>
                    <p className="text-sm text-text-primary">Verify a security isn't loaned out beyond available holdings across lenders.</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[['$4.5T', 'Securities on loan'], ['100%', 'Lending visibility'], ['On-chain', 'Immutable ledger']].map(([v, l]) => (
                    <div key={l} className="rounded-xl bg-surface-raised/60 p-4"><div className="text-lg font-mono gradient-text-numbers">{v}</div><div className="text-[11px] text-text-muted mt-1">{l}</div></div>
                  ))}
                </div>
              </div>
            )}
            {activeCase === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary"><ShippingContainer weight="duotone" className="w-6 h-6" /></span>
                  <div>
                    <h4 className="text-lg font-semibold text-text">Trade Finance</h4>
                    <p className="text-sm text-text-primary">Enforce liens on tokenized invoices and trade documents in real time.</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[['$8.6T', 'Trade finance gap'], ['Rapid', 'Invoice discounting'], ['Risk', 'Reduced fraud']].map(([v, l]) => (
                    <div key={l} className="rounded-xl bg-surface-raised/60 p-4"><div className="text-lg font-mono gradient-text-numbers">{v}</div><div className="text-[11px] text-text-muted mt-1">{l}</div></div>
                  ))}
                </div>
              </div>
            )}
            {activeCase === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary"><HouseLine weight="duotone" className="w-6 h-6" /></span>
                  <div>
                    <h4 className="text-lg font-semibold text-text">Real Estate</h4>
                    <p className="text-sm text-text-primary">Track mortgage and lien claims on tokenized property with full provenance.</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[['$13T', 'Global REIT market'], ['Secure', 'Title & lien registry'], ['Clear', 'Ownership history']].map(([v, l]) => (
                    <div key={l} className="rounded-xl bg-surface-raised/60 p-4"><div className="text-lg font-mono gradient-text-numbers">{v}</div><div className="text-[11px] text-text-muted mt-1">{l}</div></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-info/20 to-primary/30 rounded-3xl animate-pulse-slow" />
            <div className="absolute inset-[1px] bg-surface rounded-3xl" />
            <div className="absolute inset-0 noise-overlay" />

            <div className="relative p-12 md:p-16 text-center">
              <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-56 h-56 bg-info/10 rounded-full blur-[80px] pointer-events-none" />

              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold text-text mb-4">Ready to Enforce Collateral?</h2>
                <p className="text-text-secondary max-w-lg mx-auto mb-10 leading-relaxed">
                  Start preventing double-pledging today. Deploy your EncumbranceFacet on Hedera testnet in minutes.
                </p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <button
                    onClick={onLaunchApp}
                    className="btn-primary group px-8 py-4 rounded-xl bg-primary text-white text-base font-semibold shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:bg-primary-light hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center gap-2"
                  >
                    Launch Dashboard
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </button>
                  <a
                    href="https://docs.hedera.com/hedera/open-source-solutions/asset-tokenization-studio-ats"
                    target="_blank"
                    className="px-8 py-4 rounded-xl glass border border-border text-text-secondary text-base font-medium hover:text-text transition-all duration-300"
                  >
                    Read Docs
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border/50 py-12 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/[0.02] to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-[10px]">H</div>
            <span className="font-semibold text-text text-sm">HYPOTECHA</span>
            <span className="text-xs text-text-muted">Â· ETHGlobal Hedera Bounty Track</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-text-muted">
            <a href="https://github.com/RustyRustacle/HYPOTECHA" target="_blank" className="hover:text-text transition-colors duration-200">GitHub</a>
            <a href="https://hedera.com/discord" target="_blank" className="hover:text-text transition-colors duration-200">Discord</a>
            <a href="https://docs.hedera.com/" target="_blank" className="hover:text-text transition-colors duration-200">Hedera Docs</a>
            <a href="https://hashscan.io/testnet" target="_blank" className="hover:text-text transition-colors duration-200">HashScan</a>
          </div>
          <div className="text-xs text-text-muted">
            Built for ETHGlobal Â· Hedera Testnet
          </div>
        </div>
      </footer>

      {/* Floating network status toolbar */}
      <div className="fixed bottom-6 left-6 z-40 hidden md:flex items-center gap-3 glass-strong rounded-full px-4 py-2.5 shadow-xl shadow-black/40">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
        </span>
        <span className="text-xs font-medium text-text-secondary">Hedera Testnet</span>
        <span className="h-3 w-px bg-border/60" />
        <span className="text-xs font-mono text-primary">2,847,112 tx</span>
        <span className="h-3 w-px bg-border/60" />
        <span className="text-[11px] text-text-muted">TPS 4,206</span>
      </div>
    </div>
  )
}
