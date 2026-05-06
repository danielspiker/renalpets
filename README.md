# RenalPets

Web app for tracking meals of cats with Chronic Kidney Disease (CKD).

University project — UNIFACISA, ADS

Dev: Daniel Marques do Nascimento

## Roles

- **Tutor** — cat owner; full control, grants access to others.
- **Caregiver** — family member or pet sitter; per-cat access; cannot edit schedules.
- **Veterinarian** — prescribes diet protocols, receives critical alerts.

## Tech Stack

- **Next.js 16** (App Router) + **TypeScript** + **React 19**
- **Tailwind CSS 4**
- **Supabase** — PostgreSQL, Auth, Realtime, Storage (RLS-secured)
- **Vercel** — deploy

> **Note:** Next.js 16 has breaking changes (e.g. `proxy.ts` replaces `middleware.ts`). Refer to `node_modules/next/dist/docs/` before changing infra-level files.

## Getting Started

Install deps and run dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Database

Apply SQL migrations from `supabase/migrations/` in order, via Supabase Studio SQL Editor (or `supabase db push` if linked).

## Scripts

```bash
npm run dev     # dev server
npm run build   # production build
npm run start   # serve production build
npm run lint    # eslint
```

## Project Structure

```text
app/
  (app)/              # authenticated route group
    dashboard/        # tutor + vet dashboards
    cats/[id]/        # cat detail, history, schedules, meal logs, access
  login/  signup/  auth/
  icon.jpeg           # favicon (Next 16 file convention)
components/           # shared UI (DailyProgressBar, etc.)
lib/
  supabase/           # server + browser clients
  date.ts             # BRT timezone helpers
proxy.ts              # auth proxy (replaces middleware.ts)
supabase/migrations/  # SQL schema + RLS + RPCs
```

## Key Business Rules

- **Daily progress:** undereating is the failure mode — exceeding the goal is allowed (bar turns blue, no alert).
- **Meal log ≤ 3 taps** (NRF03).
- **Alerts** when a cat hasn't eaten for X hours go to tutor + vet, **not** caregiver.
- **Caregiver access** is per-cat, granted by tutor.
- **Vet account** is linked to a cat by the tutor (no self-service).
- **Feeding tips** surface automatically when a meal is logged as not consumed.

## Deploy

Push to `main` → Vercel auto-builds. Configure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel project env vars.
