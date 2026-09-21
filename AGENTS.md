# AGENTS.md

## Stack
- Next.js 15 (App Router), React 19, TypeScript strict, Tailwind CSS 3.4
- shadcn/ui (Radix primitives, lucide-react icons, CSS variables, neutral base)
- Firebase: Firestore (Admin SDK server-side, Web SDK client-side), Firebase Auth
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
npm run migrate          # Seed Firestore from src/data/*.json
npm run storybook        # Storybook on port 6006
```
The `build` script (`rmdir /s /q .next 2>nul & next build`) uses Windows `cmd` syntax. On Mac/Linux, run `next build` directly.

## Path alias
`@/*` maps to `./src/*` (configured in both `tsconfig.json` and `jest.config.mjs`).

## Firebase setup
- Project: `git-explorer-2tcnx` (from `.firebaserc`)
- Hosting region: `europe-west1`, fixed at 1 instance (`apphosting.yaml`)

**Server-side** (`src/lib/firebase-admin.ts`):
- Uses Firebase Admin SDK with service account credentials
- Required env vars: `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`
- Private key `\n` escaping handled in `initializeFirebaseAdmin()`
- Lazy-init via `getFirebaseAdmin()` which returns `{ db, auth }`
- Firestore setting: `ignoreUndefinedProperties: true`

**Client-side** (`src/lib/firebase.ts`):
- Uses Firebase Web SDK with `NEXT_PUBLIC_*` prefixed env vars
- Gracefully disables Firebase features if config is missing (logs warning, exports `null`)

## Architecture

### Server / Client split
- **Server Components** (`.page.tsx`, `.layout.tsx`) fetch data directly from Firestore via `getFirebaseAdmin()`
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
| `src/data/` | JSON seed data (migratable to Firestore via `npm run migrate`) |
| `src/contexts/` | AuthContext, TutorialContext providers |
| `scripts/migrate-data.js` | JSON-to-Firestore migration script |

### Provider hierarchy (root layout)
`ThemeProvider` (next-themes) → `AuthProvider` → `TutorialProvider`

## Testing
- Tests live in `src/tests/` (mirrors source structure: `components/`, `hooks/`, `utils/`)
- MSW auto-starts in `src/tests/setup.ts` — all tests get mocked API handlers by default
- Mock handlers in `src/mocks/handlers/`
- Run single test: `npm test -- --testPathPattern=FileName`

## UI language
The app is in French (`lang="fr"` in root layout, French copy throughout).

## No CI
No `.github/workflows` or CI configuration exists. Deployment is via Firebase App Hosting.
