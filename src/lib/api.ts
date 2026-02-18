import { getSupabaseBrowserClient } from './supabase/browser-client'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`

async function getAuthHeaders(): Promise<Record<string, string>> {
  const supabase = getSupabaseBrowserClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated')
  return {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}

async function callFunction<T = unknown>(name: string, body?: unknown, options?: { method?: string }): Promise<T> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: options?.method || 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `API error ${res.status}`)
  return data as T
}

// Public function calls (no JWT)

// ── SCAN PIPELINE ──
export const processCard = (body: {
  card_image_path: string
  voice_memo_path?: string
  event_name?: string
  event_date?: string
}) => callFunction<{
  contact_id: string
  pipeline_run_id: string
  ocr_result: Record<string, string>
  voice_context: Record<string, unknown>
}>('process-card', body)

export const retryPipeline = (body: { pipeline_run_id: string }) =>
  callFunction<{ restart_from: string; retry_count: number }>('retry-pipeline', body)

// ── OUTREACH ──
export const sendOutreach = (body: { contact_id: string; channels?: string[] }) =>
  callFunction<{ success: boolean; results: Record<string, unknown>; credits_remaining: number }>('send-outreach', body)

export const updateOutreachDraft = (body: {
  contact_id: string
  sms_body?: string
  email_id?: string
  subject?: string
  body_text?: string
  body_html?: string
}) => callFunction('update-outreach-draft', body)

export const regenerateDraft = (body: {
  contact_id: string
  type: 'sms' | 'email'
  email_id?: string
  instructions?: string
}) => callFunction('regenerate-draft', body)

// ── CONTACTS ──
export interface ContactsListParams {
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  search?: string
  pipeline_stage?: string | string[]
  lead_temperature?: string | string[]
  is_favorite?: boolean
  tag?: string
  event_name?: string
}

export const getContactsList = (params?: ContactsListParams) =>
  callFunction<{
    contacts: Array<{
      id: string; first_name: string | null; last_name: string | null
      email: string | null; phone: string | null; company: string | null
      title: string | null; lead_score: number | null; lead_temperature: string | null
      pipeline_stage: string | null; tags: string[] | null; is_favorite: boolean | null
      event_name: string | null; created_at: string | null; updated_at: string | null
    }>
    pagination: { page: number; per_page: number; total: number; total_pages: number }
  }>('contacts-list', params || {})

export const getContactDetail = (contact_id: string) =>
  callFunction<{
    contact: Record<string, unknown>
    intelligence: Record<string, unknown> | null
    pipeline_run: Record<string, unknown> | null
    sms_draft: Record<string, unknown> | null
    email_sequence: Array<Record<string, unknown>>
    reciprocal: Record<string, unknown> | null
  }>('contact-detail', { contact_id })

export const updateContact = (body: {
  contact_id?: string
  contact_ids?: string[]
  updates: Record<string, unknown>
}) => callFunction('update-contact', body)

export const exportContacts = (body?: {
  pipeline_stage?: string | string[]
  lead_temperature?: string | string[]
  contact_ids?: string[]
  include_intelligence?: boolean
}) => callFunction('export-contacts', body || {})

// ── DASHBOARD ──
export const getDashboardStats = () =>
  callFunction<{
    user: { first_name: string; tier: string; credits_remaining: number; credits_used: number; credits_limit: number }
    totals: { contacts: number; emails_sent: number; sms_sent: number }
    rates: { email_open_rate: number; email_response_rate: number }
    pipeline: Record<string, number>
    recent_scans: Array<{
      id: string; first_name: string | null; last_name: string | null
      company: string | null; lead_score: number | null; lead_temperature: string | null
      pipeline_stage: string | null; created_at: string | null
    }>
  }>('dashboard-stats', {})

// ── PROFILE ──
export const getProfile = () =>
  callFunction<{ profile: Record<string, unknown>; subscription: Record<string, unknown> | null }>('update-profile', undefined, { method: 'GET' })

export const updateProfile = (body: Record<string, unknown>) =>
  callFunction<{ success: boolean; profile: Record<string, unknown> }>('update-profile', body)

// ── BILLING ──
export const createCheckout = (body: { tier: string }) =>
  callFunction<{ url: string }>('create-checkout', body)

export const getCustomerPortal = () =>
  callFunction<{ url: string }>('customer-portal', {})

// ── COMPLIANCE ──
export const gdprErasure = (body: { contact_id: string }) =>
  callFunction('gdpr-erasure', body)

// ── CLAIM (PUBLIC) ──
export const getClaimProfile = async (token: string) => {
  const res = await fetch(`${FUNCTIONS_URL}/claim-profile?token=${token}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Invalid claim token')
  return data
}

export const claimProfile = (token: string) =>
  callFunction('claim-profile', { token })
