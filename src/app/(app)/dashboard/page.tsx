'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { getDashboardStats } from '@/lib/api'
import { formatRelativeTime } from '@/lib/utils/formatters'

const tempColors: Record<string, string> = {
  hot: 'text-red-400 bg-red-400/10',
  warm: 'text-amber-400 bg-amber-400/10',
  cold: 'text-blue-400 bg-blue-400/10',
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getDashboardStats>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getDashboardStats()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-card rounded-xl border border-border animate-pulse" />)}
        </div>
        <div className="h-64 bg-card rounded-xl border border-border animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={load} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Retry</button>
      </div>
    )
  }

  if (!stats) return null

  const kpis = [
    { label: 'Total Contacts', value: stats.totals.contacts, icon: '👤' },
    { label: 'Credits Left', value: `${stats.user.credits_remaining}/${stats.user.credits_limit}`, icon: '⚡' },
    { label: 'Email Open Rate', value: `${Math.round(stats.rates.email_open_rate)}%`, icon: '📧' },
    { label: 'SMS Sent', value: stats.totals.sms_sent, icon: '💬' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back{stats.user.first_name ? `, ${stats.user.first_name}` : ''}</h1>
          <p className="text-sm text-muted-foreground">{stats.user.tier.charAt(0).toUpperCase() + stats.user.tier.slice(1)} plan</p>
        </div>
        <Link href="/scan" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary-700 transition-colors">
          + Scan Card
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <span>{k.icon}</span>
              <span className="text-xs text-muted-foreground">{k.label}</span>
            </div>
            <p className="text-2xl font-bold">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Pipeline Funnel */}
      <div className="p-5 rounded-xl bg-card border border-border">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Pipeline</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {['scanned', 'enriched', 'ready', 'outreach_sent', 'responded'].map((stage) => (
            <div key={stage} className="text-center">
              <p className="text-2xl font-bold">{stats.pipeline[stage] || 0}</p>
              <p className="text-xs text-muted-foreground capitalize">{stage.replace('_', ' ')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Scans */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Scans</h2>
          <Link href="/contacts" className="text-xs text-primary hover:underline">View all →</Link>
        </div>
        {stats.recent_scans.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-muted-foreground text-sm mb-3">No contacts yet</p>
            <Link href="/scan" className="text-sm text-primary hover:underline">Scan your first card →</Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {stats.recent_scans.map((c) => (
              <Link key={c.id} href={`/contacts/${c.id}`} className="flex items-center px-5 py-3 hover:bg-muted/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{[c.first_name, c.last_name].filter(Boolean).join(' ') || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.company || 'No company'}</p>
                </div>
                {c.lead_temperature && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tempColors[c.lead_temperature] || ''}`}>
                    {c.lead_temperature}
                  </span>
                )}
                {c.lead_score && (
                  <span className="ml-3 text-sm font-semibold text-muted-foreground">{c.lead_score}</span>
                )}
                <span className="ml-3 text-xs text-muted-foreground">{c.created_at ? formatRelativeTime(c.created_at) : ''}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
