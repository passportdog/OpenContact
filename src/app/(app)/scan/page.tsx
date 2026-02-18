'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'
import { processCard } from '@/lib/api'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/contexts/auth-context'

const PIPELINE_STEPS = [
  { key: 'ocr', label: 'Reading Card', icon: '👁️' },
  { key: 'transcribing', label: 'Voice Memo', icon: '🎤' },
  { key: 'enriching', label: 'Enriching', icon: '🔍' },
  { key: 'analyzing', label: 'Scoring', icon: '📊' },
  { key: 'drafting', label: 'Drafting', icon: '✍️' },
  { key: 'ready', label: 'Ready!', icon: '✅' },
]

export default function ScanPage() {
  const [cardFile, setCardFile] = useState<File | null>(null)
  const [voiceFile, setVoiceFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [eventName, setEventName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [uploading, setUploading] = useState(false)
  const [pipelineStatus, setPipelineStatus] = useState<string | null>(null)
  const [pipelineRunId, setPipelineRunId] = useState<string | null>(null)
  const [contactId, setContactId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const voiceRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { user } = useAuth()

  // Subscribe to pipeline progress via Realtime
  useRealtime({
    channel: `pipeline-${pipelineRunId || 'none'}`,
    table: 'pipeline_runs',
    event: 'UPDATE',
    filter: pipelineRunId ? `id=eq.${pipelineRunId}` : undefined,
    onUpdate: (payload) => {
      const newStatus = (payload.new as Record<string, unknown>).status as string
      setPipelineStatus(newStatus)
    },
  })

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setCardFile(file)
    setPreview(URL.createObjectURL(file))
    setError('')
  }, [])

  const handleSubmit = async () => {
    if (!cardFile || !user) return
    setUploading(true)
    setError('')
    setPipelineStatus('uploading')

    try {
      const supabase = getSupabaseBrowserClient()
      const ts = Date.now()
      const ext = cardFile.name.split('.').pop() || 'jpg'
      const cardPath = `${user.id}/${ts}.${ext}`

      // Upload card image
      const { error: uploadError } = await supabase.storage.from('cards').upload(cardPath, cardFile, { contentType: cardFile.type })
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

      // Upload voice memo if present
      let voicePath: string | undefined
      if (voiceFile) {
        const vExt = voiceFile.name.split('.').pop() || 'webm'
        voicePath = `${user.id}/${ts}_voice.${vExt}`
        await supabase.storage.from('cards').upload(voicePath, voiceFile, { contentType: voiceFile.type })
      }

      // Start pipeline
      setPipelineStatus('ocr')
      const result = await processCard({
        card_image_path: cardPath,
        voice_memo_path: voicePath,
        event_name: eventName || undefined,
        event_date: eventDate || undefined,
      })

      setPipelineRunId(result.pipeline_run_id)
      setContactId(result.contact_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setPipelineStatus(null)
    } finally {
      setUploading(false)
    }
  }

  const isDone = pipelineStatus === 'ready' || pipelineStatus === 'complete'
  const currentStepIndex = PIPELINE_STEPS.findIndex(s => s.key === pipelineStatus)

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Scan a Business Card</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload a photo and optionally add a voice note for context</p>
      </div>

      {/* Card Upload */}
      {!pipelineStatus && (
        <>
          <div
            onClick={() => fileRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-colors ${preview ? 'border-primary' : 'border-border hover:border-muted-foreground'} overflow-hidden`}
          >
            {preview ? (
              <img src={preview} alt="Card preview" className="w-full h-64 object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <span className="text-4xl mb-3">📷</span>
                <p className="text-sm font-medium">Click to upload or take a photo</p>
                <p className="text-xs mt-1">JPG, PNG, HEIC up to 10MB</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
          </div>

          {/* Voice Memo */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Voice memo (optional)</label>
            <div className="flex items-center gap-3">
              <button onClick={() => voiceRef.current?.click()} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted transition-colors">
                🎤 {voiceFile ? voiceFile.name : 'Add voice note'}
              </button>
              {voiceFile && <button onClick={() => setVoiceFile(null)} className="text-xs text-muted-foreground hover:text-foreground">Remove</button>}
            </div>
            <input ref={voiceRef} type="file" accept="audio/*" onChange={e => setVoiceFile(e.target.files?.[0] || null)} className="hidden" />
            <p className="text-xs text-muted-foreground mt-1">Add context like &quot;Met at the booth, interested in API pricing&quot;</p>
          </div>

          {/* Event Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Event name</label>
              <input type="text" value={eventName} onChange={e => setEventName(e.target.value)} placeholder="e.g. CES 2025" className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Date</label>
              <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button onClick={handleSubmit} disabled={!cardFile || uploading} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {uploading ? 'Uploading...' : '⚡ Start AI Pipeline'}
          </button>
        </>
      )}

      {/* Pipeline Progress */}
      {pipelineStatus && (
        <div className="rounded-2xl bg-card border border-border p-6 space-y-4">
          <h2 className="font-semibold text-lg">{isDone ? '✅ Pipeline Complete!' : '⚡ Processing...'}</h2>
          <div className="space-y-3">
            {PIPELINE_STEPS.map((step, i) => {
              const isActive = step.key === pipelineStatus
              const isDone = i < currentStepIndex || pipelineStatus === 'ready' || pipelineStatus === 'complete'
              return (
                <div key={step.key} className={`flex items-center gap-3 p-3 rounded-lg transition-all ${isActive ? 'bg-primary/10 border border-primary/30' : isDone ? 'opacity-60' : 'opacity-30'}`}>
                  <span className="text-xl">{isDone && !isActive ? '✅' : step.icon}</span>
                  <span className={`text-sm font-medium ${isActive ? 'text-primary' : ''}`}>{step.label}</span>
                  {isActive && <div className="ml-auto w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />}
                </div>
              )
            })}
          </div>

          {pipelineStatus === 'error' && (
            <p className="text-sm text-red-400">Pipeline failed. You can retry from the contact detail page.</p>
          )}

          {isDone && contactId && (
            <div className="flex gap-3 pt-2">
              <button onClick={() => router.push(`/contacts/${contactId}`)} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-700 transition-colors">
                Review & Send →
              </button>
              <button onClick={() => { setPipelineStatus(null); setPipelineRunId(null); setContactId(null); setCardFile(null); setPreview(null); setVoiceFile(null); setEventName(''); setEventDate('') }} className="px-4 py-2.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors">
                Scan Another
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
