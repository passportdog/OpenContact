# OpenContact.ai — Frontend

Turn business cards into revenue. Scan → AI enriches → Auto follow-up.

## Tech Stack

- **Next.js 14** (App Router, Server Components)
- **Supabase** (Auth, Realtime, Storage, Edge Functions)
- **Tailwind CSS** + shadcn/ui primitives
- **TypeScript** (strict mode)

## Routes

| Route | Type | Description |
|-------|------|-------------|
| `/` | Static | Marketing landing page with pricing |
| `/login` | Dynamic | Email/password + Google OAuth |
| `/signup` | Dynamic | Account creation |
| `/onboarding` | Dynamic | Multi-step setup (company, Twilio, sender email) |
| `/dashboard` | Dynamic | Command Center — KPIs, pipeline funnel, recent scans |
| `/scan` | Dynamic | Camera capture, file upload, real-time pipeline progress |
| `/contacts` | Dynamic | Filterable contact list with search, pagination |
| `/contacts/[id]` | Dynamic | Contact detail — intelligence, SMS draft, email sequence |
| `/settings` | Dynamic | Profile, billing (Stripe), account management |
| `/claim/[token]` | Dynamic | Viral profile claim flow |
| `/api/agent` | API | Agent swarm proxy (Anthropic API) |
| `/callback` | API | Supabase OAuth callback handler |

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Authenticated routes (sidebar layout)
│   │   ├── dashboard/      # KPIs, pipeline funnel, recent scans
│   │   ├── scan/           # Camera capture + real-time pipeline
│   │   ├── contacts/       # List + [id] detail pages
│   │   ├── settings/       # Profile, billing, account
│   │   └── onboarding/     # Multi-step setup form
│   ├── (auth)/             # Auth routes (no sidebar)
│   │   ├── login/          # Email + Google OAuth
│   │   ├── signup/
│   │   └── callback/       # OAuth redirect handler
│   ├── claim/[token]/      # Public viral claim flow
│   └── page.tsx            # Landing page with pricing
├── lib/
│   ├── api.ts              # Edge Function client (all 25 endpoints)
│   ├── supabase/           # Browser, server, middleware clients
│   └── utils/              # cn(), date formatters
├── types/
│   └── database.ts         # Generated from Supabase (10 tables)
└── middleware.ts            # Auth guard + redirects
```

## Vercel Environment Variables

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://fetrcjatsxdnrzgxapqi.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(Supabase Dashboard → Settings → API)* |
| `ANTHROPIC_API_KEY` | *(optional — for agent swarm route)* |
| `NEXT_PUBLIC_APP_URL` | *(your Vercel deployment URL)* |

## Deploy

Push to `main` → Vercel auto-deploys.

```bash
npm install
npm run build   # verify locally
git push origin main
```
