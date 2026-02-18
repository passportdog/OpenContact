'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile } from '@/lib/api'

const steps = ['About You', 'Communication Setup', 'Ready!']

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ company: '', title: '', phone: '', twilio_phone_number: '', sender_email: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const updateField = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }))

  const handleComplete = async () => {
    setLoading(true)
    setError('')
    try {
      await updateProfile({ ...form, onboarding_completed: true })
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Set up your account</h1>
          <p className="text-sm text-muted-foreground mt-1">Step {step + 1} of {steps.length}</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1">{steps.map((_, i) => <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-muted'}`} />)}</div>

        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Company name</label>
              <input type="text" value={form.company} onChange={e => updateField('company', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" placeholder="Acme Corp" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Job title</label>
              <input type="text" value={form.title} onChange={e => updateField('title', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" placeholder="VP of Sales" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Phone number</label>
              <input type="tel" value={form.phone} onChange={e => updateField('phone', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" placeholder="+1 555 123 4567" />
            </div>
            <button onClick={() => setStep(1)} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm">Continue →</button>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Twilio phone number</label>
              <input type="tel" value={form.twilio_phone_number} onChange={e => updateField('twilio_phone_number', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" placeholder="+1 555 000 0000" />
              <p className="text-xs text-muted-foreground mt-1">The Twilio number SMS will be sent from. Leave blank to skip SMS.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Sender email</label>
              <input type="email" value={form.sender_email} onChange={e => updateField('sender_email', e.target.value)} className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none" placeholder="you@yourdomain.com" />
              <p className="text-xs text-muted-foreground mt-1">Must match a verified domain in Resend. Leave blank to use default.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setStep(0)} className="px-4 py-2.5 rounded-lg border border-border text-sm">← Back</button>
              <button onClick={() => setStep(2)} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm">Continue →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 text-center">
            <div className="text-5xl">🚀</div>
            <h2 className="text-xl font-bold">You&apos;re all set!</h2>
            <p className="text-sm text-muted-foreground">Start scanning business cards and let AI handle the follow-up.</p>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-lg border border-border text-sm">← Back</button>
              <button onClick={handleComplete} disabled={loading} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50">
                {loading ? 'Saving...' : 'Go to Dashboard →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
