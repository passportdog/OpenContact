import Link from 'next/link'

const steps = [
  { num: '01', title: 'Scan', desc: 'Point your camera at any business card. AI extracts every detail in seconds.' },
  { num: '02', title: 'Enrich', desc: 'We pull company data, tech stack, social profiles, and lead scores automatically.' },
  { num: '03', title: 'Follow Up', desc: 'AI drafts personalized SMS + 4-email sequences. Review, edit, and send.' },
]

const tiers = [
  { name: 'Free', price: '$0', period: '/mo', credits: '5 scans/month', features: ['OCR + voice memo', 'Basic enrichment', 'SMS draft', 'Email draft'], cta: 'Get Started', href: '/signup', highlight: false },
  { name: 'Starter', price: '$29', period: '/mo', credits: '50 scans/month', features: ['Everything in Free', 'Full enrichment (Apollo + PageSpeed)', '4-email sequences', 'Lead scoring', 'CSV export'], cta: 'Start Free Trial', href: '/signup?tier=starter', highlight: false },
  { name: 'Pro', price: '$79', period: '/mo', credits: '200 scans/month', features: ['Everything in Starter', 'Pain signal detection', 'Priority processing', 'Team sharing (coming soon)', 'Slack integration (coming soon)'], cta: 'Start Free Trial', href: '/signup?tier=pro', highlight: true },
  { name: 'Agency', price: '$199', period: '/mo', credits: '1,000 scans/month', features: ['Everything in Pro', 'White-label emails', 'API access (coming soon)', 'Dedicated support', 'Custom integrations'], cta: 'Contact Sales', href: '/signup?tier=agency', highlight: false },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight">Open<span className="text-primary">Contact</span>.ai</span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Log in</Link>
            <Link href="/signup" className="text-sm px-4 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary-700 transition-colors">Sign up free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-24 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="max-w-3xl mx-auto relative">
          <div className="inline-block mb-4 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
            AI-Powered Networking
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-4">
            Turn Business Cards Into <span className="text-primary">Revenue</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Scan a card. AI enriches the contact with company intelligence. Personalized follow-ups send automatically. Close deals faster.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/signup" className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary-700 transition-colors shadow-lg shadow-primary/25">
              Start Scanning Free →
            </Link>
            <Link href="#how-it-works" className="px-6 py-3 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Three steps. Zero friction.</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.num} className="relative p-6 rounded-2xl bg-card border border-border">
                <span className="text-5xl font-extrabold text-primary/10">{s.num}</span>
                <h3 className="text-xl font-bold mt-2 mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-card/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Simple pricing</h2>
          <p className="text-center text-muted-foreground mb-12">Start free. Upgrade when you&apos;re ready.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map((t) => (
              <div key={t.name} className={`p-5 rounded-2xl border ${t.highlight ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border bg-card'} flex flex-col`}>
                <h3 className="font-bold text-lg">{t.name}</h3>
                <div className="mt-2 mb-1"><span className="text-3xl font-extrabold">{t.price}</span><span className="text-muted-foreground text-sm">{t.period}</span></div>
                <p className="text-xs text-muted-foreground mb-4">{t.credits}</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {t.features.map((f) => (
                    <li key={f} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary mt-0.5">✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Link href={t.href} className={`block text-center py-2 rounded-lg text-sm font-semibold transition-colors ${t.highlight ? 'bg-primary text-primary-foreground hover:bg-primary-700' : 'border border-border hover:bg-muted'}`}>
                  {t.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-muted-foreground">
          <span>© 2025 OpenContact.ai</span>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-foreground transition-colors">Login</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
