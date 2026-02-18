'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { getContactsList, type ContactsListParams } from '@/lib/api'
import { formatRelativeTime } from '@/lib/utils/formatters'

const tempColors: Record<string, string> = {
  hot: 'text-red-400 bg-red-400/10 border-red-400/20',
  warm: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  cold: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
}

const stageLabels: Record<string, string> = {
  scanned: 'Scanned', processing: 'Processing', enriched: 'Enriched', analyzed: 'Analyzed',
  ready: 'Ready', outreach_sent: 'Outreach Sent', responded: 'Responded',
  meeting_booked: 'Meeting', closed: 'Closed', lost: 'Lost',
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Array<Record<string, unknown>>>([])
  const [pagination, setPagination] = useState({ page: 1, per_page: 20, total: 0, total_pages: 0 })
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [tempFilter, setTempFilter] = useState('')
  const [favFilter, setFavFilter] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const params: ContactsListParams = { page, per_page: 20, sort_by: 'created_at', sort_order: 'desc' }
      if (search) params.search = search
      if (stageFilter) params.pipeline_stage = stageFilter
      if (tempFilter) params.lead_temperature = tempFilter
      if (favFilter) params.is_favorite = true
      const data = await getContactsList(params)
      setContacts(data.contacts as unknown as Array<Record<string, unknown>>)
      setPagination(data.pagination)
    } catch { /* handled by empty state */ }
    setLoading(false)
  }, [search, stageFilter, tempFilter, favFilter])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contacts</h1>
        <Link href="/scan" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">+ Scan Card</Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input type="text" placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} className="px-3 py-1.5 rounded-lg bg-card border border-border text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary" />
        <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className="px-3 py-1.5 rounded-lg bg-card border border-border text-sm text-foreground">
          <option value="">All Stages</option>
          {Object.entries(stageLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={tempFilter} onChange={e => setTempFilter(e.target.value)} className="px-3 py-1.5 rounded-lg bg-card border border-border text-sm text-foreground">
          <option value="">All Temps</option>
          <option value="hot">🔥 Hot</option>
          <option value="warm">🌤️ Warm</option>
          <option value="cold">❄️ Cold</option>
        </select>
        <button onClick={() => setFavFilter(!favFilter)} className={`px-3 py-1.5 rounded-lg border text-sm ${favFilter ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'border-border text-muted-foreground hover:bg-muted'}`}>
          ★ Favorites
        </button>
      </div>

      {/* Contact List */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" /></div>
        ) : contacts.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-muted-foreground mb-2">No contacts found</p>
            <Link href="/scan" className="text-sm text-primary hover:underline">Scan your first card →</Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {contacts.map((c) => (
              <Link key={c.id as string} href={`/contacts/${c.id}`} className="flex items-center px-4 py-3 hover:bg-muted/50 transition-colors gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {((c.first_name as string)?.[0] || '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{[c.first_name, c.last_name].filter(Boolean).join(' ') || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground truncate">{(c.company as string) || (c.email as string) || ''}</p>
                </div>
                {!!c.is_favorite && <span className="text-amber-400">★</span>}
                {!!c.lead_temperature && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${tempColors[c.lead_temperature as string] || ''}`}>
                    {c.lead_temperature as string}
                  </span>
                )}
                {!!c.pipeline_stage && (
                  <span className="text-xs text-muted-foreground hidden sm:block">{stageLabels[c.pipeline_stage as string] || String(c.pipeline_stage)}</span>
                )}
                <span className="text-xs text-muted-foreground hidden md:block">{c.created_at ? formatRelativeTime(c.created_at as string) : ''}</span>
                <span className="text-muted-foreground">›</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{pagination.total} contacts</span>
          <div className="flex gap-2">
            <button disabled={pagination.page <= 1} onClick={() => load(pagination.page - 1)} className="px-3 py-1 rounded-lg border border-border text-sm disabled:opacity-30 hover:bg-muted">← Prev</button>
            <span className="px-3 py-1 text-muted-foreground">{pagination.page} / {pagination.total_pages}</span>
            <button disabled={pagination.page >= pagination.total_pages} onClick={() => load(pagination.page + 1)} className="px-3 py-1 rounded-lg border border-border text-sm disabled:opacity-30 hover:bg-muted">Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}
