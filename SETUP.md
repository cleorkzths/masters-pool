# Masters Pool — Setup Guide

## Prerequisites
- Node.js 20+ (you have it at `/opt/homebrew/bin/node`)
- A free [Supabase](https://supabase.com) account

---

## Step 1 — Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Note your **Project URL** and **anon key** from Settings > API

---

## Step 2 — Set environment variables

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Step 3 — Run the database migrations

In Supabase Dashboard → SQL Editor, run each file **in order**:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_seed_rounds_and_pool.sql`
4. `supabase/migrations/004_seed_players_2025.sql`

---

## Step 4 — Create the photo storage bucket

In Supabase Dashboard → Storage:
1. Create bucket named `player-photos`
2. Set it to **Public**
3. Add a policy: anyone can read, authenticated admins can upload

---

## Step 5 — Make yourself admin

After signing in to the app once (generates your profile):

```sql
UPDATE profiles SET is_admin = true WHERE id = 'your-user-uuid';
```

---

## Step 6 — Run the app

```bash
# From the masters-pool directory
/opt/homebrew/bin/npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## How to use it

### Before the tournament
1. Sign in → you'll be redirected to `/pool/{id}`
2. Update the `pick_deadline` in the `pools` table to the tournament start time
3. Share the URL — users sign in with magic link (email only, no password)
4. Each user picks 6 players and names their team

### During the tournament
1. Go to `/admin/scores`
2. Enter each player's to_par score after each round
3. Click "Mark Round Complete" — the leaderboard updates automatically
4. Dropped scores show as strikethrough on each team's scorecard

### For 2026
- Re-run migration 003 with new dates
- Re-run migration 004 with the new field (or update players in `/admin/players`)
- Update the `pick_deadline` in the pool

---

## Key pages

| URL | Description |
|-----|-------------|
| `/` | Redirects to leaderboard |
| `/pool/{id}` | **Main leaderboard** — public |
| `/pool/{id}/pick` | Make/edit picks (requires login, before deadline) |
| `/pool/{id}/entry/{id}` | Team scorecard with per-round breakdown |
| `/pool/{id}/players` | Full field scores |
| `/admin` | Admin dashboard |
| `/admin/scores` | Enter round scores |
| `/admin/players` | Upload player photos |
| `/admin/entries` | View all entries |

---

## Scoring rules
- Each team = 6 players
- Each round: best 4 of 6 scores count, worst 2 are dropped
- Total = sum of best-4 scores across all 4 rounds
- Lower is better (standard golf scoring)
- WD/no score = treated as +99 (always dropped)
