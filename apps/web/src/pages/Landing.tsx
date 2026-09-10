import { useState, useEffect } from 'react'
import { FloatingCoins } from '@/components/FloatingCoins'
import { ParticlesBackground } from '@/components/ParticlesBackground'
import { SectionBackground } from '@/components/SectionBackground'
import { LiveTicker } from '@/components/LiveTicker'
import { BenefitRow } from '@/components/landing/BenefitRow'
import { EventLog as LandingEventLog } from '@/components/landing/EventLog'
import { FeatureCard } from '@/components/landing/FeatureCard'
import { SectionLabel } from '@/components/landing/SectionLabel'
import { StepCard } from '@/components/landing/StepCard'
import { UseCaseCard } from '@/components/landing/UseCaseCard'
import { useTyping } from '@/lib/useTyping'
import { useSectionReveal } from '@/lib/useSectionReveal'

interface LandingProps {
  onLaunchApp: () => void
}

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
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'liquid-glass-nav' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Hypotheca" className="w-8 h-8 rounded-lg object-cover shadow-lg shadow-black/50" />
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
            className="liquid-glass liquid-cta liquid-glass-button px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-300"
          >
            Launch App
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section ref={heroRef} className="relative pt-28 pb-16 px-6 overflow-hidden min-h-screen">
        <SectionBackground kind="video" src="/bg/hero-main.mp4" opacity={70} overlay="linear-gradient(to bottom, rgba(4,6,13,0.55) 0%, rgba(4,6,13,0.38) 40%, rgba(4,6,13,0.5) 72%, rgba(4,6,13,0.6) 100%)" />

        {/* Floating crypto coins */}
        <FloatingCoins />

        {/* Decorative ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-primary/[0.06] rounded-full spin-slow pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-info/[0.04] rounded-full spin-slow pointer-events-none" style={{ animationDirection: 'reverse', animationDuration: '30s' }} />

        <div className="max-w-7xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full liquid-glass text-primary text-xs font-medium mb-6 transition-all duration-700 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <img src="/HederaLogoFix.webp" alt="Hedera" className="h-3.5 w-auto" />
            Hedera Testnet Live
          </div>

          {/* Heading */}
          <h1 className={`text-5xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tight mb-5 leading-[1.05] transition-all duration-700 delay-100 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <span className="text-text">On-Chain</span>
            <br />
            <span className="gradient-text-shimmer">{typedText}</span>
          </h1>

          {/* Subtitle */}
          <p className={`text-lg md:text-xl text-text-secondary max-w-2xl mx-auto mb-8 leading-relaxed transition-all duration-700 delay-200 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            One shared on-chain registry across every lending platform — so no asset
            ever backs two loans, anywhere. Built on{' '}
            <span className="text-text font-medium">Hedera Asset Tokenization Studio</span>.
          </p>

          {/* CTA buttons */}
          <div className={`flex items-center justify-center gap-4 mb-10 transition-all duration-700 delay-300 ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <button
              onClick={onLaunchApp}
              className="liquid-glass liquid-cta liquid-glass-button group px-8 py-3.5 rounded-xl text-base font-semibold transition-all duration-300 flex items-center gap-2"
            >
              Launch Dashboard
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            </button>
            <a
              href="https://github.com/RustyRustacle/HYPOTECHA"
              target="_blank"
              className="liquid-glass liquid-glass-button px-8 py-3.5 rounded-xl text-text-secondary text-base font-medium hover:text-text transition-all duration-300 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              View Source
            </a>
          </div>

          {/* Hero card - Encumbrance bar preview */}
          <div className={`max-w-3xl mx-auto transition-all duration-700 delay-[400ms] ${heroVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <div className="liquid-glass-strong rounded-2xl p-6 relative">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm">US</div>
                    <div className="text-left">
                      <div className="text-sm font-semibold text-text">US Treasury Bond #123</div>
                      <div className="text-xs font-mono text-text-muted">UST-123 · $1,000,000</div>
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
                      <span className="font-mono text-text-muted">{'[ALPHA]'} $600K</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary/50 shadow-sm shadow-primary/30" />
                      <span className="text-text-secondary">Available</span>
                      <span className="font-mono text-text-muted">[ALL]</span>
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

      {/* FEATURES · HOW IT WORKS — shared wave background */}
      <div className="relative overflow-hidden">
        <SectionBackground kind="video" src="/bg/wave.mp4" opacity={62} overlay="linear-gradient(to bottom, rgba(4,6,13,0.72), rgba(4,6,13,0.55) 50%, rgba(4,6,13,0.82))" />

        <section id="features" className="py-24 px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/[0.03] rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl mb-14">
            <SectionLabel>The Problem</SectionLabel>
            <h2 className="text-3xl md:text-5xl font-bold text-text mb-5 leading-tight">
              The Same Asset,<br className="hidden md:block" /> Financed Twice.
            </h2>
            <p className="text-text-secondary text-lg leading-relaxed">
              Collateral is meant to be trusted. But banks don't all use the same
              ledger — and nothing stops the same bond from quietly backing two loans
              on two different platforms — until someone defaults and everyone finds
              out too late.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
            {/* Problem narrative */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              <div className="liquid-glass rounded-2xl p-6 md:p-8 flex-1">
                <div className="text-[10px] uppercase tracking-[0.2em] text-text-muted mb-5">What happens without a registry</div>
                <div className="flex flex-col gap-2.5 font-mono text-xs">
                  <div className="flex items-center justify-between rounded-lg bg-surface-raised/60 border border-border/50 px-4 py-3">
                    <span className="text-text-secondary">BANK A · Treasury #123 <span className="text-text-muted text-[10px]">[ALPHA]</span></span>
                    <span className="text-text font-medium">$600,000 · SIGNED</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-surface-raised/60 border border-border/50 px-4 py-3">
                    <span className="text-text-secondary">BANK B · Treasury #123 <span className="text-text-muted text-[10px]">[BETA]</span></span>
                    <span className="text-text font-medium">$500,000 · SIGNED</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-danger/10 border border-danger/25 px-4 py-3">
                    <span className="text-text-secondary">Combined &gt; asset value</span>
                    <span className="text-danger font-medium">$1,100,000 / $1,000,000</span>
                  </div>
                </div>
                <p className="mt-5 text-sm text-text-secondary leading-relaxed">
                  Two banks, two platforms, one bond — and both hold paper saying they
                  are first in line. No single ledger can see the conflict.
                </p>
              </div>
              <figure className="liquid-glass rounded-2xl p-6 md:p-8">
                <blockquote className="text-lg md:text-2xl font-semibold gradient-text leading-snug">
                  “The worst fraud in finance isn’t flashy. It’s the same asset, quietly financed twice.”
                </blockquote>
              </figure>
            </div>

            {/* The answer */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <FeatureCard
                featured
                icon={<svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
                title="The registry never blinks"
                desc="When Bank B tries to pledge the same treasury on Platform Beta, the registry spots Bank A's hold on Platform Alpha and turns the request away — automatically, in under 50ms."
                accent="from-primary/5 to-transparent"
                delay="0ms"
              />
              <BenefitRow
                icon={<svg className="w-6 h-6 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                title="Cross-Platform Registry"
                desc="Every hold, free balance, and release across every participating platform is live — auditable by anyone, anywhere."
                delay="100ms"
              />
              <BenefitRow
                icon={<svg className="w-6 h-6 text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                title="Immutable Audit Trail"
                desc="Created, released, or executed — a permanent HCS history that never disappears."
                delay="200ms"
              />
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
        <section id="how-it-works" className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <SectionLabel>The Journey</SectionLabel>
            <h2 className="text-3xl md:text-5xl font-bold text-text mb-4">How It Works</h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Think of Hypotheca as a shared digital notary for every lender. It
              makes sure one asset is never promised to two people at the same time
              — on any platform — in three simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative mb-10">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-[18%] right-[18%] h-px">
              <div className="w-full h-full bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            </div>

            <StepCard step="01" title="Mint Your Asset" desc="Bring a bond, building, or cargo shipment on-chain in minutes. It gets a permanent digital identity that no one can forge." active={activeStep === 0} onClick={() => setActiveStep(0)} />
            <StepCard step="02" title="Pledge From Any Platform" desc="Lenders register their claim from any platform. The registry checks the value is free across every platform — if not, the pledge is rejected on the spot." active={activeStep === 1} onClick={() => setActiveStep(1)} />
            <StepCard step="03" title="Repay & Release" desc="Settle the loan and the claim is released, returning your full balance. Every step stays on the shared ledger, open for anyone to verify." active={activeStep === 2} onClick={() => setActiveStep(2)} />
          </div>

          {/* Active step detail panel */}
          <div className="max-w-4xl mx-auto liquid-glass-strong rounded-2xl p-6 md:p-10 relative overflow-hidden">
            {activeStep === 0 && (
              <div key="step-0" className="text-center animate-fade-in-up">
                <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21h18M4 18h16M6 18V10m4 8V10m4 8V10m4 8V10M3 7l9-4 9 4-9 4-9-4z" /></svg>
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-text-muted mb-2">Step 01 · Mint the Asset</div>
                <h4 className="text-xl font-semibold text-text mb-2">Mint a $1,000,000 treasury</h4>
                <p className="text-sm text-text-secondary max-w-2xl mx-auto leading-relaxed">A treasury bond is turned into a digital token on Hedera in seconds. Ownership becomes a single, tamper-proof record — and it gets a shared registry identity that every platform can see.</p>
                <div className="mt-8 max-w-xl mx-auto">
                  <LandingEventLog
                    events={[
                      { msg: 'MINT Treasury #123 @ ALPHA · $1,000,000', type: 'mint' },
                      { msg: 'OWNER Company A confirmed on-chain', type: 'mint' },
                      { msg: 'REGISTRY projection synced to HCS topic', type: 'info' },
                    ]}
                  />
                </div>
              </div>
            )}
            {activeStep === 1 && (
              <div key="step-1" className="text-center animate-fade-in-up">
                <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-text-muted mb-2">Step 02 · Registry Check</div>
                <h4 className="text-xl font-semibold text-text mb-4">Bank A pledges $600,000 on Alpha</h4>
                <div className="max-w-md mx-auto mb-4">
                  <div className="flex items-center justify-between text-xs font-mono text-text-secondary mb-2">
                    <span>60% covered</span>
                    <span className="text-primary">$400K free across platforms</span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-raised overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-info-light rounded-full" style={{ width: '60%' }} />
                  </div>
                </div>
                <p className="text-sm text-text-secondary max-w-2xl mx-auto leading-relaxed">Before anything is locked in, the registry checks the shared projection automatically. 60% of the asset now belongs to Bank A's claim on Alpha — when Bank B tries to pledge the same bond on Beta, the registry rejects it on the spot.</p>
                <div className="mt-8 max-w-xl mx-auto">
                  <LandingEventLog
                    events={[
                      { msg: 'HOLD UST-123 @ ALPHA · BANK_A $600,000 → PASS', type: 'pass' },
                      { msg: 'HOLD UST-123 @ BETA · BANK_B $500,000 → CONFLICT #REGISTRY-001', type: 'reject' },
                      { msg: 'HOLD UST-123 @ BETA · BANK_B $400,000 → PASS', type: 'pass' },
                      { msg: 'FREE across all platforms · $400,000', type: 'info' },
                    ]}
                  />
                </div>
              </div>
            )}
            {activeStep === 2 && (
              <div key="step-2" className="text-center animate-fade-in-up">
                <div className="mx-auto mb-5 w-14 h-14 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-text-muted mb-2">Step 03 · Repay & Release</div>
                <h4 className="text-xl font-semibold text-text mb-2">Repay the loan → release the claim</h4>
                <p className="text-sm text-text-secondary max-w-2xl mx-auto leading-relaxed">The moment the loan is settled, the hold is released and the full balance is free again on every platform. Borrowers, lenders, and regulators can look back at every decision — forever, on the shared ledger.</p>
                <div className="mt-8 max-w-xl mx-auto">
                  <LandingEventLog
                    events={[
                      { msg: 'HOLD_RELEASED UST-123 @ ALPHA · BANK_A $600,000 → OK', type: 'pass' },
                      { msg: 'RELEASE published → HCS topic', type: 'info' },
                      { msg: 'FREE across all platforms restored · $1,000,000', type: 'info' },
                    ]}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        </section>
      </div>

      {/* USE CASES · CTA · FOOTER — shared background down to the footer */}
      <div className="relative overflow-hidden">
        <SectionBackground
          kind="image"
          src="/bg/silver-lines.jpg"
          opacity={24}
          overlay="linear-gradient(to bottom, rgba(4,6,13,0.85) 0%, rgba(4,6,13,0.6) 45%, rgba(4,6,13,0.45) 100%)"
        />

        {/* USE CASES */}
        <section id="use-cases" className="py-24 px-6 relative">
          <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <SectionLabel>Where It Fits</SectionLabel>
            <h2 className="text-3xl md:text-5xl font-bold text-text mb-4">A Fit for Every Market</h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              If something holds value, it deserves protection. Hypotheca keeps
              collateral honest across every corner of finance — from Wall Street
              to the warehouse.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <UseCaseCard image="/scenes/repo.jpg" name="Repo Markets" desc="Banks repurchase and lend against the same treasuries — never the same bond backing two loans at once." metric="$1.2T" sub="Treasury-backed" active={activeCase === 0} onClick={() => setActiveCase(0)} />
            <UseCaseCard image="/scenes/securities.jpg" name="Securities Lending" desc="Lending a stock becomes as transparent as holding one — no hidden double-use, ever." metric="$4.5T" sub="Stocks & bonds" active={activeCase === 1} onClick={() => setActiveCase(1)} />
            <UseCaseCard image="/scenes/trade.jpg" name="Trade Finance" desc="Ship, invoice, and finance cargo with liens locked on-chain, so financing can never be duplicated." metric="$8.6T" sub="Global trade" active={activeCase === 2} onClick={() => setActiveCase(2)} />
            <UseCaseCard image="/scenes/realestate.jpg" name="Real Estate & Mortgages" desc="One clean, verifiable record for property, mortgages, and liens — no more title disputes." metric="$13T" sub="Global REITs" active={activeCase === 3} onClick={() => setActiveCase(3)} />
          </div>

          {/* Active use-case detail panel */}
          <div className="max-w-4xl mx-auto liquid-glass-strong rounded-2xl p-6 md:p-8 relative overflow-hidden">
            {activeCase === 0 && (
              <div key="case-0" className="animate-fade-in-up">
                <div className="relative h-32 md:h-40 rounded-xl overflow-hidden mb-6">
                  <img src="/scenes/repo.jpg" alt="Repo Markets" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-[#0b1120]/10 to-transparent" />
                  <span className="absolute top-3 left-3 text-xs font-mono px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-primary-light">$1.2T · Global repo market</span>
                </div>
                <div className="text-center mb-6">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-text-muted mb-2">Applications · Repo & Treasury</div>
                  <h4 className="text-xl font-semibold text-text mb-2">Repurchase Agreements</h4>
                  <p className="text-sm text-text-secondary max-w-2xl mx-auto leading-relaxed">The same treasury moves between many repo legs every day. Hypotheca makes sure no single bond ever backs two loans — banks can lend faster, confident the collateral is real.</p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[['$1.2T', 'Global repo market'], ['<50ms', 'Guard latency'], ['0', 'Double-pledges']].map(([v, l]) => (
                    <div key={l} className="rounded-xl bg-surface-raised/60 p-4"><div className="text-lg font-mono gradient-text-numbers">{v}</div><div className="text-[11px] text-text-muted mt-1">{l}</div></div>
                  ))}
                </div>
              </div>
            )}
            {activeCase === 1 && (
              <div key="case-1" className="animate-fade-in-up">
                <div className="relative h-32 md:h-40 rounded-xl overflow-hidden mb-6">
                  <img src="/scenes/securities.jpg" alt="Securities Lending" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-[#0b1120]/10 to-transparent" />
                  <span className="absolute top-3 left-3 text-xs font-mono px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-primary-light">$4.5T · Securities on loan</span>
                </div>
                <div className="text-center mb-6">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-text-muted mb-2">Applications · Securities Lending</div>
                  <h4 className="text-xl font-semibold text-text mb-2">Securities Lending</h4>
                  <p className="text-sm text-text-secondary max-w-2xl mx-auto leading-relaxed">Lenders and borrowers share one clear picture. A stock can never be loaned out beyond what is actually available — no surprises, no hidden double-use.</p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[['$4.5T', 'Securities on loan'], ['100%', 'Lending visibility'], ['On-chain', 'Immutable ledger']].map(([v, l]) => (
                    <div key={l} className="rounded-xl bg-surface-raised/60 p-4"><div className="text-lg font-mono gradient-text-numbers">{v}</div><div className="text-[11px] text-text-muted mt-1">{l}</div></div>
                  ))}
                </div>
              </div>
            )}
            {activeCase === 2 && (
              <div key="case-2" className="animate-fade-in-up">
                <div className="relative h-32 md:h-40 rounded-xl overflow-hidden mb-6">
                  <img src="/scenes/trade.jpg" alt="Trade Finance" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-[#0b1120]/10 to-transparent" />
                  <span className="absolute top-3 left-3 text-xs font-mono px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-primary-light">$8.6T · Trade finance gap</span>
                </div>
                <div className="text-center mb-6">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-text-muted mb-2">Applications · Trade Finance</div>
                  <h4 className="text-xl font-semibold text-text mb-2">Trade Finance</h4>
                  <p className="text-sm text-text-secondary max-w-2xl mx-auto leading-relaxed">Cargo, invoices, and trade documents carry enforceable liens on-chain. Financiers get real-time proof that the collateral is pledged nowhere else — so trade can flow faster and safer.</p>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[['$8.6T', 'Trade finance gap'], ['Rapid', 'Invoice discounting'], ['Low', 'Fraud exposure']].map(([v, l]) => (
                    <div key={l} className="rounded-xl bg-surface-raised/60 p-4"><div className="text-lg font-mono gradient-text-numbers">{v}</div><div className="text-[11px] text-text-muted mt-1">{l}</div></div>
                  ))}
                </div>
              </div>
            )}
            {activeCase === 3 && (
              <div key="case-3" className="animate-fade-in-up">
                <div className="relative h-32 md:h-40 rounded-xl overflow-hidden mb-6">
                  <img src="/scenes/realestate.jpg" alt="Real Estate" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-[#0b1120]/10 to-transparent" />
                  <span className="absolute top-3 left-3 text-xs font-mono px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-primary-light">$13T · Global REIT market</span>
                </div>
                <div className="text-center mb-6">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-text-muted mb-2">Applications · Real Estate & Mortgages</div>
                  <h4 className="text-xl font-semibold text-text mb-2">Real Estate & Mortgages</h4>
                  <p className="text-sm text-text-secondary max-w-2xl mx-auto leading-relaxed">Every mortgage and lien on a property lives in one verifiable record. Buyers, banks, and regulators finally see the exact same truth — no more title disputes.</p>
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
      <section className="py-24 px-6 relative">
        <div className="max-w-4xl mx-auto">
          <div className="liquid-glass-strong rounded-3xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-56 h-56 bg-info/10 rounded-full blur-[80px] pointer-events-none" />

            <div className="relative p-12 md:p-16 text-center z-10">
              <h2 className="text-3xl md:text-5xl font-bold text-text mb-4">Connect to the Registry</h2>
              <p className="text-text-secondary max-w-lg mx-auto mb-10 leading-relaxed">
                Join the shared Encumbrance Registry and stop double-pledging across institutions today. Deploy on Hedera testnet in minutes.
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <button
                  onClick={onLaunchApp}
                  className="liquid-glass liquid-cta liquid-glass-button group px-8 py-4 rounded-xl text-base font-semibold transition-all duration-300 flex items-center gap-2"
                >
                  Launch Dashboard
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                </button>
                <a
                  href="https://docs.hedera.com/hedera/open-source-solutions/asset-tokenization-studio-ats"
                  target="_blank"
                  className="liquid-glass liquid-glass-button px-8 py-4 rounded-xl text-text-secondary text-base font-medium hover:text-text transition-all duration-300"
                >
                  Read Docs
                </a>
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
            <img src="/logo.png" alt="Hypotheca" className="w-7 h-7 rounded-md object-cover" />
            <span className="font-semibold text-text text-sm">HYPOTECHA</span>
            <span className="text-xs text-text-muted">· Universal Encumbrance Registry</span>
            <span className="text-xs text-text-muted">· ETHGlobal Hedera Bounty Track</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-text-muted">
            <a href="https://github.com/RustyRustacle/HYPOTECHA" target="_blank" className="hover:text-text transition-colors duration-200">GitHub</a>
            <a href="https://hedera.com/discord" target="_blank" className="hover:text-text transition-colors duration-200">Discord</a>
            <a href="https://docs.hedera.com/" target="_blank" className="hover:text-text transition-colors duration-200">Hedera Docs</a>
            <a href="https://hashscan.io/testnet" target="_blank" className="hover:text-text transition-colors duration-200">HashScan</a>
          </div>
          <div className="text-xs text-text-muted">
            Built for ETHGlobal · Hedera Testnet
          </div>
        </div>
      </footer>
      </div>

      </div>
  )
}