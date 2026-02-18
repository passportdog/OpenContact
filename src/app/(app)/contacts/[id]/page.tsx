'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getContactDetail, sendOutreach, updateContact, regenerateDraft, retryPipeline, gdprErasure } from '@/lib/api'

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<Awaited<ReturnType<typeof getContactDetail>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const result = await getContactDetail(id)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const handleSend = async () => {
    setSending(true)
    try {
      await sendOutreach({ contact_id: id })
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed')
    }
    setSending(false)
  }

  const handleFavorite = async () => {
    if (!data) return
    const contact = data.contact as Record<string, unknown>
    await updateContact({ contact_id: id, updates: { is_favorite: !contact.is_favorite } })
    load()
  }

  const handleRetry = async () => {
    const pr = data?.pipeline_run as Record<string, unknown>
    if (!pr?.id) return
    await retryPipeline({ pipeline_run_id: pr.id as string })
    load()
  }

  const handleDelete = async () => {
    if (!confirm('Delete this contact and all associated data? This cannot be undone.')) return
    await gdprErasure({ contact_id: id })
    router.push('/contacts')
  }

  const handleRegenSms = async () => {
    await regenerateDraft({ contact_id: id, type: 'sms' })
    load()
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
  }

  if (error || !data) {
    return <div className="text-center py-20"><p className="text-red-400 mb-4">{error || 'Contact not found'}</p><button onClick={load} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm">Retry</button></div>
  }

  const contact = data.contact as Record<string, unknown>
  const intel = data.intelligence as Record<string, unknown> | null
  const sms = data.sms_draft as Record<string, unknown> | null
  const emails = data.email_sequence as Array<Record<string, unknown>>
  const pipelineRun = data.pipeline_run as Record<string, unknown> | null
  const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || 'Unknown'
  const isReady = contact.pipeline_stage === 'ready' || contact.pipeline_stage === 'analyzed'
  const isFailed = pipelineRun?.status === 'error'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <button onClick={() => router.back()} className="text-sm text-muted-foreground hover:text-foreground mb-2 block">← Back</button>
          <h1 className="text-2xl font-bold">{name}</h1>
          <p className="text-sm text-muted-foreground">{(contact.title as string) || ''}{!!contact.title && contact.company ? ' at ' : ''}{(contact.company as string) || ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleFavorite} className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-muted">{contact.is_favorite ? '★' : '☆'}</button>
          <button onClick={handleDelete} className="px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10">Delete</button>
        </div>
      </div>

      {/* Contact Info */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact Info</h2>
          {!!contact.email && <div><span className="text-xs text-muted-foreground">Email</span><p className="text-sm">{contact.email as string}</p></div>}
          {!!contact.phone && <div><span className="text-xs text-muted-foreground">Phone</span><p className="text-sm">{contact.phone as string}</p></div>}
          {!!contact.website && <div><span className="text-xs text-muted-foreground">Website</span><p className="text-sm">{contact.website as string}</p></div>}
          {!!contact.linkedin_url && <div><span className="text-xs text-muted-foreground">LinkedIn</span><a href={contact.linkedin_url as string} target="_blank" rel="noopener" className="text-sm text-primary hover:underline block truncate">{contact.linkedin_url as string}</a></div>}
          {!!contact.event_name && <div><span className="text-xs text-muted-foreground">Event</span><p className="text-sm">{contact.event_name as string}</p></div>}
          {!!contact.card_image_signed_url && <img src={contact.card_image_signed_url as string} alt="Card" className="w-full rounded-lg mt-2" />}
        </div>

        {/* Intelligence */}
        <div className="p-4 rounded-xl bg-card border border-border space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Intelligence</h2>
          {contact.lead_score != null && (
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold text-primary">{contact.lead_score as number}</div>
              <div><p className="text-sm font-medium capitalize">{(contact.lead_temperature as string) || 'Unknown'} Lead</p><p className="text-xs text-muted-foreground">Lead Score</p></div>
            </div>
          )}
          {intel && (
            <>
              {intel.digital_presence_score != null && (
                <div><span className="text-xs text-muted-foreground">Digital Presence</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${intel.digital_presence_score}%` }} /></div>
                    <span className="text-sm font-medium">{intel.digital_presence_score as number}/100</span>
                  </div>
                </div>
              )}
              {!!intel.industry && <div><span className="text-xs text-muted-foreground">Industry</span><p className="text-sm">{intel.industry as string}</p></div>}
              {!!intel.company_size && <div><span className="text-xs text-muted-foreground">Company Size</span><p className="text-sm">{intel.company_size as string}</p></div>}
              {intel.pagespeed_mobile != null && <div><span className="text-xs text-muted-foreground">PageSpeed (Mobile)</span><p className="text-sm">{intel.pagespeed_mobile as number}/100</p></div>}
              {!!(intel.pain_signals) && Array.isArray(intel.pain_signals) && (intel.pain_signals as string[]).length > 0 && (
                <div><span className="text-xs text-muted-foreground">Pain Signals</span>
                  <div className="flex flex-wrap gap-1 mt-1">{(intel.pain_signals as string[]).map((p, i) => <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20">{p}</span>)}</div>
                </div>
              )}
            </>
          )}
          {!intel && <p className="text-sm text-muted-foreground">No intelligence data yet</p>}
        </div>
      </div>

      {/* Pipeline Error */}
      {isFailed && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between">
          <div><p className="text-sm font-medium text-red-400">Pipeline failed</p><p className="text-xs text-muted-foreground">{pipelineRun?.error_message as string}</p></div>
          <button onClick={handleRetry} className="px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Retry</button>
        </div>
      )}

      {/* SMS Draft */}
      {sms && (
        <div className="p-4 rounded-xl bg-card border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">SMS Draft</h2>
            <button onClick={handleRegenSms} className="text-xs text-primary hover:underline">Regenerate</button>
          </div>
          <div className="p-3 rounded-lg bg-muted text-sm leading-relaxed whitespace-pre-wrap">{(sms.sms_body_draft || sms.sms_body) as string}</div>
        </div>
      )}

      {/* Email Sequence */}
      {emails.length > 0 && (
        <div className="p-4 rounded-xl bg-card border border-border space-y-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Sequence ({emails.length} emails)</h2>
          {emails.map((email, i) => (
            <div key={email.id as string} className="p-3 rounded-lg bg-muted space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Day {email.sequence_day as number} — Email {i + 1}</span>
                {!!email.status && <span className={`text-xs px-2 py-0.5 rounded-full ${email.status === 'sent' || email.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400' : email.status === 'opened' ? 'bg-blue-500/10 text-blue-400' : 'bg-muted-foreground/10 text-muted-foreground'}`}>{email.status as string}</span>}
              </div>
              <p className="text-sm font-medium">{email.subject as string}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{email.body_text as string}</p>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      {isReady && (
        <div className="flex gap-3">
          <button onClick={handleSend} disabled={sending} className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary-700 transition-colors disabled:opacity-50">
            {sending ? 'Sending...' : '⚡ Approve & Send Outreach'}
          </button>
        </div>
      )}
    </div>
  )
}
