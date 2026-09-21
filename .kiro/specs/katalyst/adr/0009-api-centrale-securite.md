# ADR 0009 — API centrale, sécurité et durcissement

- **Statut** : accepté
- **Date** : 2026-09-21
- **Phases concernées** : 9, 10

## Contexte

L'application accède aujourd'hui aux données par trois chemins non coordonnés : Server Components (via `getFirebaseAdmin()`), Server Actions, et Route Handlers. Chacun refait sa propre validation, sa propre gestion d'erreur et son propre contrôle d'accès. Avec l'arrivée du **multi-tenant** (ADR 0007), du **mobile Capacitor** (phase 22) et d'un futur usage par des tiers, ce désordre devient un risque de sécurité : **une route oubliée = une fuite inter-organisations**.

L'utilisateur demande : « centraliser par une API et prendre toutes les mesures de sécurité ».

## Décision

### 1. API centrale versionnée

- **Surface unique** : `/api/v1/*` — toute donnée destinée à un client passe par là.
- **Server Components** conservent l'accès direct aux providers (interne, sans saut HTTP) — l'API n'est pas un détour inutile pour le rendu serveur.
- **Contrat unique** : les schémas **Zod** génèrent types, validation runtime **et** spécification **OpenAPI**.
- **Chaîne de traitement obligatoire** pour chaque route : `authentification → scope organisation → autorisation (rôle) → validation Zod → handler → sérialisation`.
- **Aucune logique métier dans les routes** : elles délèguent aux providers.

### 2. Sécurité — mesures structurelles

| Mesure | Mise en œuvre |
|---|---|
| **Authentification** | JWT httpOnly + refresh token rotatif (ADR 0002) |
| **Autorisation** | RBAC par rôle **et** scope organisation obligatoire |
| **CSRF** | Jeton anti-CSRF sur les mutations + `SameSite` strict |
| **Validation d'entrée** | Zod sur **toute** entrée, y compris les `params` d'URL |
| **En-têtes de sécurité** | CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` |
| **Limitation de débit** | Par IP **et** par utilisateur, seuils distincts selon l'endpoint |
| **Anti-force brute** | Verrouillage progressif sur `login` / `reset` / MFA |
| **Journal d'audit** | Toute action sensible tracée (qui, quoi, quand, depuis où) |
| **Chiffrement** | TLS en transit ; chiffrement au repos pour les données sensibles |
| **Secrets** | Jamais versionnés, jamais côté client, jamais journalisés |
| **Dépendances** | Analyse automatique (`npm audit`, `gitleaks`) en CI |
| **Moindre privilège** | Les comptes techniques n'ont que les droits nécessaires |
| **Isolation** | Test automatisé : org A ne lit **aucune** ligne d'org B |

### 3. Référentiels visés — « le juste nécessaire »

L'utilisateur demande SOC 2 et NIS2 **sans sur-ingénierie**. Principe retenu : **mettre en place les contrôles structurels qui servent les deux référentiels**, documenter, et ne pas lancer de programme de certification à ce stade.

Les contrôles ci-dessus couvrent l'essentiel de :
- **SOC 2** — Security (accès, chiffrement, audit), Availability (sauvegardes, supervision), Confidentiality (isolation, secrets), Processing Integrity (validation), Privacy (RGPD).
- **NIS2** — gestion du risque, sécurité de la chaîne d'approvisionnement, gestion des incidents, continuité.

Détail et mapping : ADR 0011.

## Conséquences

### Positives
- **Un seul point de contrôle** : la sécurité ne dépend plus de la vigilance sur chaque route.
- L'API unique sert web, mobile et futurs clients tiers.
- La conformité devient **démontrable** (journal d'audit, tests d'isolation, en-têtes vérifiés).
- Les schémas Zod uniques suppriment la divergence de validation entre chemins.

### Négatives / coûts
- Couche d'indirection supplémentaire pour les appels client (acceptable : les RSC gardent l'accès direct).
- Discipline requise : toute nouvelle route doit passer la chaîne complète.
- La limitation de débit en environnement auto-hébergé (multi-instances) nécessite un stockage partagé — à trancher en phase 24.

## Alternatives écartées

| Alternative | Raison du rejet |
|---|---|
| **Laisser les 3 chemins actuels** | Divergence de sécurité, risque de fuite, non auditable |
| **Backend Express séparé** | Déjà écarté (choix du backend natif Next) |
| **GraphQL** | Surdimensionné ; complexifie le contrôle d'accès et la limitation de débit |
| **tRPC** | Excellent mais couple fortement au client TypeScript — gêne l'usage mobile/tiers |
| **Lancer une certification SOC 2 maintenant** | Coût disproportionné à ce stade ; les contrôles suffisent |

## Références

- `@.kiro/specs/katalyst/requirements.md` domaines `API`, `SEC`
- `@.kiro/specs/katalyst/design.md` §19, §20
- `@.kiro/specs/katalyst/tasks.md` phases 9, 10
- `@.kiro/specs/katalyst/adr/0011-conformite-soc2-nis2.md`
