# EcoWars

EcoWars is a free, browser-based multiplayer card game that helps Year 7 students explore foundational economics concepts. Each student runs a mini country and races to hit 120 Happiness or reduce the opponent’s Stability to zero by balancing GDP, Stability, Cash, and Happiness.

## Highlights

- **Classroom safe** – no login, optional anonymous nicknames, Supabase Realtime for secure multiplayer sync.
- **Dual modes** – local practice vs. a SimEconomy bot, or real-time online matches once Supabase keys are configured.
- **Curriculum-aligned cards** – 30 seeded cards spanning Policies, Industries, Events, and Social Programs with clear tooltips.
- **Supabase Edge validation** – all networked moves route through `match-actions` to prevent cheating.
- **Touch-friendly UI** – large stat bars, accessible card tooltips, event log, and a single action tray for Chromebook/iPad use.

## Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS.
- **Realtime & DB**: Supabase (tables defined in `supabase/schema.sql`).
- **Edge Functions**: `supabase/functions/match-actions` (Deno) validates and persists every action.
- **Testing**: Vitest + Testing Library (unit), Playwright (browser smoke).

## Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:5173` for the UI. Practice mode works immediately; online mode requires Supabase configuration.

### Environment Variables

Copy `.env.example` to `.env` and set:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # only used locally for seeds/functions
```

The client only uses the `VITE_` values. Never expose the service role key in production builds.

## Supabase Setup

1. **Create project** on Supabase free tier.
2. **Enable Realtime** for the `matches` table (SQL schema below).
3. **Apply schema**: run `supabase/schema.sql` via the SQL editor.
4. **Deploy edge function**:
   ```bash
   supabase functions deploy match-actions --project-ref YOUR_REF
   ```
5. **Seed cards** (creates 30-card deck with duplicates):
   ```bash
   npm run seed:cards
   ```
   The seed script is idempotent and skips automatically when Supabase env vars are missing.
6. **Redeploy frontend** (Vercel recommended) with the two `VITE_` env vars.

## Development Workflow

- **Practice mode**: useful for demos and teaching, uses deterministic local engine plus a simple SimEconomy bot so you can explain turns offline.
- **Online mode**: enabled automatically once Supabase env vars are present. Players create 5-character codes and the state syncs via Supabase Realtime. All moves go through the `match-actions` edge function which reuses the same game-engine logic as the client.
- **Card deck**: `src/data/cards.ts` defines the canonical cards. `generateDeck()` ensures 30-card decks by duplicating entries evenly.

## Available Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server + local practice mode |
| `npm run build` | Seeds cards (if env ready), type-checks, builds production bundle |
| `npm run seed:cards` | Manually seed the cards table via service key |
| `npm run test` | Vitest unit suite (game engine logic) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:e2e` | Playwright smoke test (auto-starts dev server) |

## Testing Strategy

- **Unit** (`src/state/gameEngine.test.ts`): validates card effects, per-turn GDP/attack logic, and both win conditions.
- **E2E** (`e2e/practice.spec.ts`): runs Playwright against the dev server to ensure practice mode boots, renders hand controls, and respects action buttons.

## Deployment Notes

- Deploy the Vite build on Vercel (default settings work). Remember to set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables.
- The Supabase project hosts:
  - `matches`, `players`, `cards` tables (see `supabase/schema.sql`).
  - `match-actions` edge function (server validation + persistence).
- Students only enter nicknames; no personal data is stored beyond that temporary string.

## Project Structure

- `src/components/*` – UI building blocks: lobby, match board, stats, event log.
- `src/state/gameEngine.ts` – canonical rules engine used by both the client and edge function (mirrored under `supabase/functions/_shared`).
- `src/hooks/usePracticeMatch.ts` – sandbox/bot logic for demos.
- `src/hooks/useRealtimeMatch.ts` – Supabase Realtime orchestrator with optimistic updates + channel subscription.
- `supabase/functions` – deployable Deno functions.
- `scripts/seedCards.ts` – deterministic card seeding invoked during builds.

## Classroom Tips

- Teachers can project practice mode to walk through a sample turn (play two cards, attack, log updates).
- Students pair up, one creates a code, the other joins – no accounts or installs.
- Matches typically last 3–5 minutes thanks to the 2-card limit and quick victory checks.
