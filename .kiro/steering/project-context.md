# Steering — Contexte projet Katalyst

## Qu'est-ce que Katalyst

Plateforme d'apprentissage en ligne (francophone) qui enseigne la maîtrise des **outils professionnels** (Git/GitHub, Jira, n8n, marketing digital, prompt engineering, closing) par la **pratique simulée**, et non par la théorie.

Principe fondateur : **la compétence naît de la pratique délibérée**. L'apprenant manipule (simulateurs, terminaux, interfaces) au lieu de seulement lire.

## Positionnement produit cible

Inspiré du modèle **REWORK** (`app.rework.school`) : microlearning structuré en semaines/jours, déblocage progressif, gamification (points), cohortes, messagerie formateur ↔ apprenants, application mobile.

## Stack

| Couche | Actuel | Cible |
|---|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript strict | inchangé |
| UI | Tailwind 3.4, shadcn/ui, lucide-react | + charte 1 accent |
| Données | Firestore (Admin SDK + Web SDK) | **PostgreSQL** |
| Auth | Firebase Auth | **JWT + bcrypt + Google OAuth + MFA + SAML** |
| IA | Genkit + Gemini 2.0 Flash (`src/ai/genkit.ts`) | inchangé |
| Paiement | — | **Stripe** (abstrait) |
| Temps réel | — | **SSE** |
| Mobile | — | **Capacitor** |
| Tests | Jest 29 + MSW + Testing Library (jsdom) | + projet `node` pour la DB |
| Déploiement | Firebase App Hosting | **Docker portable** (GCP/AWS/Azure/VPS) |

## Structure

```
src/
├─ app/            pages (RSC) + api/ route handlers
├─ actions/        server actions (mutations)
├─ lib/            couche données (→ providers/)
├─ ai/flows/       5 flows Genkit
├─ components/     ui/ (shadcn), interactive/, specialized/, visualizations/
├─ contexts/       AuthContext, TutorialContext
├─ types/          types métier
├─ data/           JSON de seed (source de vérité du contenu)
└─ tests/          miroir de src/
.kiro/             suivi (steering, specs, workflows, hooks)
```

## Commandes

```bash
npm run dev:turbo     # dev (Turbopack) — recommandé
npm run dev           # dev (webpack)
npm run build         # build (syntaxe Windows cmd)
npm run lint          # ESLint (config à créer en phase 0)
npm run typecheck     # tsc --noEmit
npm test              # Jest
npm run genkit:dev    # Genkit UI (port 4000)
```

## Contraintes durables

- **Aucune facturation GCP.** Ne jamais réintroduire une dépendance qui en exige.
- **Zero vendor lock-in** : toute dépendance externe passe par une abstraction sélectionnée par variable d'environnement.
- **Un seul `next dev` à la fois** sur ce dossier (sinon EPERM + conflit de port).
- Projet frère **`masterplan365` en LECTURE SEULE** — jamais modifié.
- L'app est en **français** (`lang="fr"`).
