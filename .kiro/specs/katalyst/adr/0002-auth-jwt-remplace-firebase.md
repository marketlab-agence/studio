# ADR 0002 — Auth JWT remplace Firebase Auth

- **Statut** : accepté
- **Date** : 2026-09-21
- **Phases concernées** : 4, 7, 14

## Contexte

Firebase Auth gère aujourd'hui inscription, connexion email/mot de passe, Google et GitHub. Il est utilisé **directement dans le client** (`AuthContext`, `login`, `signup`, `account`, `Header`) — soit 7 fichiers couplés.

L'objectif d'agnosticité (ADR 0001) impose de retirer Firebase de l'architecture. Le projet frère `masterplan365` fournit un modèle éprouvé : `jsonwebtoken` + `bcrypt` + `pg` (SQL brut), Google OAuth direct, refresh tokens en table, rate-limiters et validation Zod par endpoint, MFA/TOTP, gestion de sessions.

**Contrainte découverte et vérifiée** : Firebase Auth **n'exporte jamais les hashes de mots de passe**. Aucun contournement n'existe.

Interrogation du Admin SDK (lecture seule) :

```
AUTH ADMIN SDK: OK (aucune facturation requise)
Comptes recuperables: 12
Fournisseurs: {"password":10,"google.com":2}
```

Les comptes (emails, noms, UID, fournisseurs) sont exportables **sans facturation** ; les mots de passe, non.

## Décision

Remplacer Firebase Auth par un **`AuthProvider` applicatif** calqué sur masterplan365 :

- **Mots de passe** : `bcrypt`.
- **Session** : JWT d'accès court + **refresh token** en base (rotation, révocable), cookie **httpOnly**.
- **Google OAuth** : flux direct (`/api/auth/google` + `/callback`), liaison de compte par email.
- **MFA/TOTP** : `setup` / `verify` / `challenge` / `status`.
- **SSO SAML** : à implémenter — ⚠️ **spike obligatoire** (`passport-saml` est conçu pour Express ; les route handlers Next ne sont pas un drop-in). Repli : `@node-saml/node-saml` appelé directement.
- **Rate limiting** + validation **Zod** par endpoint.
- **Migration des comptes** : les 12 comptes importés ; `password_hash = NULL` et `must_reset_password = true` pour les 10 comptes email.

## Conséquences

### Positives
- Fin du couplage client à Firebase : les composants consomment `useAuth()`, jamais un SDK.
- Contrôle total des sessions (révocation, liste, expiration) — impossible avec Firebase Auth.
- MFA et SSO intégrés au modèle de données, sans dépendance externe.
- Alignement sur un modèle déjà éprouvé en production (masterplan365).

### Négatives / coûts
- **🔴 Les 10 comptes email devront réinitialiser leur mot de passe.** Inévitable. Les 2 comptes Google se reconnectent directement.
- Responsabilité de la sécurité portée par le projet : hachage, rotation de tokens, protection CSRF, rate limiting.
- `passport-saml` inadapté à Next → risque technique sur le SSO (gate G1).
- Un `EmailProvider` devient indispensable (reset de mot de passe) — **capacité absente aujourd'hui** de Katalyst.

## Alternatives écartées

| Alternative | Raison du rejet |
|---|---|
| **Conserver Firebase Auth** | Maintient une dépendance GCP ; l'objectif est l'agnosticité |
| **NextAuth / Auth.js** | Ajoute une couche d'abstraction supplémentaire au-dessus de fournisseurs ; ne résout pas le stockage en Postgres ni MFA/SAML selon nos besoins |
| **Clerk / Auth0 / WorkOS** | Dépendance forte à un tiers payant ; contraire à l'agnosticité |
| **Migration des hashes Firebase** | **Techniquement impossible** — Firebase ne les expose pas |

## Références

- `@.kiro/specs/katalyst/design.md` §4
- `@.kiro/specs/katalyst/tasks.md` phase 4
- `@.kiro/steering/domain-glossary.md`
