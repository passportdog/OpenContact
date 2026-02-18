export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          company_name: string | null
          job_title: string | null
          phone: string | null
          twilio_number: string | null
          sender_email: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          company_name?: string | null
          job_title?: string | null
          phone?: string | null
          twilio_number?: string | null
          sender_email?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          company_name?: string | null
          job_title?: string | null
          phone?: string | null
          twilio_number?: string | null
          sender_email?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          user_id: string
          first_name: string
          last_name: string
          email: string
          phone: string
          company: string | null
          job_title: string | null
          notes: string | null
          source: string | null
          status: string
          claimed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          last_name: string
          email: string
          phone: string
          company?: string | null
          job_title?: string | null
          notes?: string | null
          source?: string | null
          status?: string
          claimed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string
          company?: string | null
          job_title?: string | null
          notes?: string | null
          source?: string | null
          status?: string
          claimed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          contact_id: string
          user_id: string
          direction: 'inbound' | 'outbound'
          channel: 'sms' | 'email'
          content: string
          twilio_sid: string | null
          status: 'pending' | 'sent' | 'delivered' | 'failed'
          created_at: string
        }
        Insert: {
          id?: string
          contact_id: string
          user_id: string
          direction: 'inbound' | 'outbound'
          channel: 'sms' | 'email'
          content: string
          twilio_sid?: string | null
          status?: 'pending' | 'sent' | 'delivered' | 'failed'
          created_at?: string
        }
        Update: {
          id?: string
          contact_id?: string
          user_id?: string
          direction?: 'inbound' | 'outbound'
          channel?: 'sms' | 'email'
          content?: string
          twilio_sid?: string | null
          status?: 'pending' | 'sent' | 'delivered' | 'failed'
          created_at?: string
        }
      }
      claims: {
        Row: {
          id: string
          claim_code: string
          contact_id: string
          user_id: string | null
          claimed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          claim_code: string
          contact_id: string
          user_id?: string | null
          claimed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          claim_code?: string
          contact_id?: string
          user_id?: string | null
          claimed_at?: string | null
          created_at?: string
        }
      }
    }
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Contact = Database['public']['Tables']['contacts']['Row']
export type Conversation = Database['public']['Tables']['conversations']['Row']
export type Claim = Database['public']['Tables']['claims']['Row']
