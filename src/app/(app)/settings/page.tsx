'use client'

import { useState, useEffect, useCallback } from 'react'
import { getProfile, updateProfile, createCheckout, getCustomerPortal } from '@/lib/api'

type Tab = 'profile' | 'billing' | 'account'

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('profile')
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null)
  const [subscription, setSubscription] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ full_name: '', company: '', title: '', phone: '', sender_email: '', twilio_phone_number: '' })

  const load = useCallback(async () => {
    try {
      const data = await getProfile()
      setProfile(data.profile)
      setSubscription(data.subscription)
      const p = data.profile
      setForm({
        full_name: (p.full_name as string) || '',
        company: (p.company as string) || '',
        title: (p.title as string) || '',
        phone: (p.phone as string) || '',
        sender_email: (p.sender_email as string) || '',
        twilio_phone_number: (p.twilio_phone_number as string) || '',
      })
    } catch { /* handled */ }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSave = async () => {
    setSaving(true)
    try { await updateProfile(form); await load() }
    catch { /* handled */ }
    setSaving(false)
  }

  const handleUpgrade = async (tier: string) => {
    try {
      const { url } = await createCheckout({ tier })
      window.location.href = url
    } catch { /* handled */ }
  }

  const handleManageBilling = async () => {
    try {
      const { url } = await getCustomerPortal()
      window.location.href = url
    } catch { /* handled */ }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'billing', label: 'Billing' },
    { key: 'account', label: 'Account' },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="flex gap-1 border-b border-border">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="space-y-4 p-5 rounded-xl bg-card border border-border">
          {[
            { key: 'full_name', label: 'Full name', type: 'text' },
            { key: 'company', label: 'Company', type: 'text' },
            { key: 'title', label: 'Job title', type: 'text' },
            { key: 'phone', label: 'Phone', type: 'tel' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium mb-1">{f.label}</label>
              <input type={f.type} value={(form as Record<string, string>)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
            </div>
          ))}
          <button onClick={handleSave} disabled={saving} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      )}

      {tab === 'billing' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-card border border-border">
            <h2 className="font-semibold mb-2">Current Plan</h2>
            <p className="text-2xl font-bold capitalize">{(subscription?.tier as string) || (profile?.current_tier as string) || 'Free'}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {profile?.scan_credits_remaining as number}/{subscription?.scan_credits_limit as number || 5} scan credits remaining
            </p>
            {!!subscription?.stripe_subscription_id && (
              <button onClick={handleManageBilling} className="mt-3 px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted">Manage Subscription</button>
            )}
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { tier: 'starter', price: '$29/mo', credits: '50 scans' },
              { tier: 'pro', price: '$79/mo', credits: '200 scans' },
              { tier: 'agency', price: '$199/mo', credits: '1,000 scans' },
            ].map(p => (
              <div key={p.tier} className="p-4 rounded-xl border border-border bg-card">
                <p className="font-semibold capitalize">{p.tier}</p>
                <p className="text-lg font-bold">{p.price}</p>
                <p className="text-xs text-muted-foreground mb-3">{p.credits}</p>
                <button onClick={() => handleUpgrade(p.tier)} className="w-full py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Upgrade</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'account' && (
        <div className="space-y-4 p-5 rounded-xl bg-card border border-border">
          <div>
            <label className="block text-sm font-medium mb-1">Sender email</label>
            <input type="email" value={form.sender_email} onChange={e => setForm(prev => ({ ...prev, sender_email: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
            <p className="text-xs text-muted-foreground mt-1">Must match a verified domain in Resend</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Twilio phone number</label>
            <input type="tel" value={form.twilio_phone_number} onChange={e => setForm(prev => ({ ...prev, twilio_phone_number: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:ring-2 focus:ring-primary focus:outline-none" />
          </div>
          <button onClick={handleSave} disabled={saving} className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      )}
    </div>
  )
}
