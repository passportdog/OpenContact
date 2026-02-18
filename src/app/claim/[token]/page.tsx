'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getClaimProfile, claimProfile } from '@/lib/api'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client'

export default function ClaimPage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)
  const [error, setError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    async function init() {
      const supabase = getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)

      try {
        const result = await getClaimProfile(token)
        setData(result)
        if (result.already_claimed) setClaimed(true)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Invalid or expired link')
      }
      setLoading(false)
    }
    init()
  }, [token])

  const handleClaim = async () => {
    setClaiming(true)
    try {
      await claimProfile(token)
      setClaimed(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Claim failed')
    }
    setClaiming(false)
  }

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>

  if (error && !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 text-center">
        <div><p className="text-red-400 mb-4">{error}</p><Link href="/" className="text-sm text-primary hover:underline">Go home</Link></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="text-5xl">🤝</div>
        <h1 className="text-2xl font-bold">Someone scanned your card!</h1>
        {data && (
          <p className="text-sm text-muted-foreground">
            <strong>{(data.scanned_by_name as string) || 'Someone'}</strong> from <strong>{(data.scanned_by_company as string) || 'their company'}</strong> connected with you.
          </p>
        )}

        {claimed ? (
          <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-emerald-400 font-semibold">Profile claimed!</p>
            <Link href="/dashboard" className="text-sm text-primary hover:underline mt-2 block">Go to Dashboard →</Link>
          </div>
        ) : isLoggedIn ? (
          <button onClick={handleClaim} disabled={claiming} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50">
            {claiming ? 'Claiming...' : 'Claim Your Profile'}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Create an account to claim your profile and see who&apos;s connecting with you.</p>
            <Link href={`/signup?redirect=/claim/${token}`} className="block w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm">Create Account</Link>
            <Link href={`/login?redirect=/claim/${token}`} className="block text-sm text-muted-foreground hover:text-foreground">Already have an account? Sign in</Link>
          </div>
        )}
      </div>
    </div>
  )
}
