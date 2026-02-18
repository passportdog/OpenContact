export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          first_name: string | null
          last_name: string | null
          company: string | null
          title: string | null
          phone: string | null
          physical_address: string | null
          avatar_url: string | null
          twilio_phone_number: string | null
          sender_email: string | null
          scan_credits_remaining: number | null
          scan_credits_used: number | null
          current_tier: string | null
          onboarding_completed: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      contacts: {
        Row: {
          id: string
          user_id: string
          first_name: string | null
          last_name: string | null
          email: string | null
          phone: string | null
          company: string | null
          title: string | null
          website: string | null
          address: string | null
          linkedin_url: string | null
          other_info: string | null
          ocr_confidence: number | null
          card_image_url: string | null
          card_image_path: string | null
          voice_memo_url: string | null
          voice_memo_path: string | null
          voice_transcript: string | null
          voice_context: Json | null
          event_name: string | null
          event_date: string | null
          meeting_location: string | null
          lead_score: number | null
          lead_temperature: string | null
          pipeline_stage: string | null
          tags: string[] | null
          is_favorite: boolean | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['contacts']['Row']> & { user_id: string }
        Update: Partial<Database['public']['Tables']['contacts']['Row']>
      }
      intelligence_profiles: {
        Row: {
          id: string
          contact_id: string
          user_id: string
          company_size: string | null
          company_revenue: string | null
          industry: string | null
          seniority: string | null
          social_profiles: Json | null
          apollo_data: Json | null
          website_score: number | null
          pagespeed_mobile: number | null
          pagespeed_desktop: number | null
          has_analytics: boolean | null
          has_crm: boolean | null
          has_email_marketing: boolean | null
          has_ad_pixels: boolean | null
          has_chat_widget: boolean | null
          tech_stack: Json | null
          tracking_pixels: Json | null
          google_rating: number | null
          google_review_count: number | null
          google_place_id: string | null
          digital_presence_score: number | null
          pain_signals: Json | null
          pain_signals_count: number | null
          raw_enrichment: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['intelligence_profiles']['Row']> & { contact_id: string; user_id: string }
        Update: Partial<Database['public']['Tables']['intelligence_profiles']['Row']>
      }
      pipeline_runs: {
        Row: {
          id: string
          contact_id: string
          user_id: string
          status: string
          started_at: string | null
          ocr_completed_at: string | null
          transcription_completed_at: string | null
          enrichment_completed_at: string | null
          analysis_completed_at: string | null
          drafting_completed_at: string | null
          completed_at: string | null
          error_message: string | null
          retry_count: number | null
          processing_time_ms: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['pipeline_runs']['Row']> & { contact_id: string; user_id: string }
        Update: Partial<Database['public']['Tables']['pipeline_runs']['Row']>
      }
      outreach_messages: {
        Row: {
          id: string
          contact_id: string
          user_id: string
          sms_body: string
          sms_body_draft: string | null
          from_number: string | null
          to_number: string | null
          twilio_sid: string | null
          sms_status: string | null
          sent_at: string | null
          delivered_at: string | null
          failed_at: string | null
          error_code: string | null
          error_message: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['outreach_messages']['Row']> & { contact_id: string; user_id: string; sms_body: string }
        Update: Partial<Database['public']['Tables']['outreach_messages']['Row']>
      }
      outreach_emails: {
        Row: {
          id: string
          contact_id: string
          user_id: string
          sequence_number: number
          sequence_day: number
          subject: string
          body_text: string
          body_html: string | null
          from_email: string | null
          to_email: string | null
          resend_id: string | null
          status: string | null
          scheduled_for: string | null
          sent_at: string | null
          opened_at: string | null
          clicked_at: string | null
          replied_at: string | null
          bounced_at: string | null
          unsubscribe_token: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['outreach_emails']['Row']> & { contact_id: string; user_id: string; sequence_number: number; sequence_day: number; subject: string; body_text: string }
        Update: Partial<Database['public']['Tables']['outreach_emails']['Row']>
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_price_id: string | null
          tier: string
          status: string | null
          scan_credits_limit: number | null
          sms_credits_limit: number | null
          current_period_start: string | null
          current_period_end: string | null
          cancel_at: string | null
          cancelled_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['subscriptions']['Row']> & { user_id: string }
        Update: Partial<Database['public']['Tables']['subscriptions']['Row']>
      }
      reciprocal_profiles: {
        Row: {
          id: string
          contact_id: string
          scanned_by_user_id: string
          email: string | null
          phone: string | null
          first_name: string | null
          last_name: string | null
          company: string | null
          claim_token: string | null
          claimed: boolean | null
          claimed_by_user_id: string | null
          claimed_at: string | null
          claim_notification_sent: boolean | null
          claim_notification_sent_at: string | null
          claim_notification_scheduled_for: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['reciprocal_profiles']['Row']> & { contact_id: string; scanned_by_user_id: string }
        Update: Partial<Database['public']['Tables']['reciprocal_profiles']['Row']>
      }
      consent_records: {
        Row: {
          id: string
          contact_id: string | null
          user_id: string | null
          consent_type: string
          consented_at: string | null
          ip_address: unknown
          user_agent: string | null
          metadata: Json | null
          created_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['consent_records']['Row']> & { consent_type: string }
        Update: Partial<Database['public']['Tables']['consent_records']['Row']>
      }
      opt_outs: {
        Row: {
          id: string
          email: string | null
          phone: string | null
          reason: string | null
          source: string | null
          opted_out_at: string | null
          created_at: string | null
        }
        Insert: Partial<Database['public']['Tables']['opt_outs']['Row']>
        Update: Partial<Database['public']['Tables']['opt_outs']['Row']>
      }
    }
  }
}

// Convenience type aliases
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Contact = Database['public']['Tables']['contacts']['Row']
export type IntelligenceProfile = Database['public']['Tables']['intelligence_profiles']['Row']
export type PipelineRun = Database['public']['Tables']['pipeline_runs']['Row']
export type OutreachMessage = Database['public']['Tables']['outreach_messages']['Row']
export type OutreachEmail = Database['public']['Tables']['outreach_emails']['Row']
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type ReciprocalProfile = Database['public']['Tables']['reciprocal_profiles']['Row']

// API Response types
export type PipelineStatus = 'ocr' | 'transcribing' | 'enriching' | 'analyzing' | 'drafting' | 'ready' | 'complete' | 'error'
export type PipelineStage = 'scanned' | 'processing' | 'enriched' | 'analyzed' | 'ready' | 'outreach_sent' | 'responded' | 'meeting_booked' | 'closed' | 'lost'
export type LeadTemperature = 'hot' | 'warm' | 'cold'
export type Tier = 'free' | 'starter' | 'pro' | 'agency'
