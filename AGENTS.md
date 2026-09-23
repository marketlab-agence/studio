# AGENTS.md

## Stack
- Next.js 15 (App Router), React 19, TypeScript strict, Tailwind CSS 3.4
- shadcn/ui (Radix primitives, lucide-react icons, CSS variables, neutral base)
- Data & auth: PostgreSQL (self-hosted, port 5433) · JWT + Google OAuth + MFA/TOTP + SAML
- AI: Genkit + Gemini 2.0 Flash (`src/ai/genkit.ts`)
- Testing: Jest 29 + MSW + @testing-library/react
- Forms: react-hook-form + zod
- Data fetching: @tanstack/react-query v5

## Commands
```
npm run dev              # Next.js dev server
npm run build            # Build (Windows cmd syntax — won't work on Mac/Linux)
npm run lint             # ESLint via next lint
npm run typecheck        # tsc --noEmit
npm test                 # Jest (single run)
npm run genkit:dev       # Genkit dev UI on port 4000
npm run storybook        # Storybook on port 6006
```
The `build` script (`rmdir /s /q .next 2>nul & next build`) uses Windows `cmd` syntax. On Mac/Linux, run `next build` directly.

## Path alias
`@/*` maps to `./src/*` (configured in both `tsconfig.json` and `jest.config.mjs`).

## Architecture

### Server / Client split
- **Server Components** (`.page.tsx`, `.layout.tsx`) fetch data directly from PostgreSQL via the server-side providers
- **Server Actions** (`src/actions/*.ts`) handle all mutations — callable from client components
- **Client Components** use Server Actions + React Query for mutations/fetching

### Key directories
| Path | Purpose |
|---|---|
| `src/lib/` | Data access layer (courses, tutorials, users, settings, quizzes, blog) |
| `src/actions/` | Server Actions (courseActions, adminActions, planActions, fullCourseGenerationActions) |
| `src/ai/flows/` | 5 Genkit AI flows (create-course, contextual-helper, generate-lesson, etc.) |
| `src/components/ui/` | shadcn/ui components (auto-generated via `npx shadcn-ui add`) |
| `src/components/interactive/` | Git/dev simulation components |
| `src/components/visualizations/` | Chart/diagram components |
| `src/types/` | TypeScript type definitions |
| `src/data/` | JSON seed data (loaded by `npm run db:seed`) |
| `src/contexts/` | AuthContext, TutorialContext providers |

### Provider hierarchy (root layout)
`ThemeProvider` (next-themes) → `AuthProvider` → `TutorialProvider`

## Testing
- Tests live in `src/tests/` (mirrors source structure: `components/`, `hooks/`, `utils/`)
- MSW auto-starts in `src/tests/setup.ts` — all tests get mocked API handlers by default
- Mock handlers in `src/mocks/handlers/`
- Run single test: `npm test -- --testPathPattern=FileName`

## UI language
The app is in French (`lang="fr"` in root layout, French copy throughout).

## CI

A GitHub workflow exists at `.github/workflows/ci.yml` (typecheck, gitleaks, `test:e2e`, `check:version`).

## Deployment

**Multi-cloud, from a single container image** (REQ-DEP-02, phase 25): AWS, GCP and Azure.

The app ships as a **Next.js standalone** image built by a multi-stage `Dockerfile`, deployed
with `docker-compose.prod.yml` (app + PostgreSQL/pgvector). The three cloud targets are reached
from that **same image**, never from a platform-specific build.

Firebase App Hosting was used before phase 7bis and has been **removed**: it is a GCP-only
service requiring GCP billing, which NG-07 forbids as a durable dependency. The deployment
artifacts of that era (`.firebaserc`, `firebase.json`, `apphosting.yaml`, `firestore.rules`,
`.idx/`) are gone.

⚠️ **Nothing is deployed today.** Phase 25 is what will produce the `Dockerfile`, the prod
compose file and the three cloud workflows. Until then, `/health` is the only deployment-shaped
endpoint, and it runs locally.
