# Steering — Normes applicables & patterns réutilisables

> Référentiel des normes retenues pour Katalyst et des patterns à réutiliser depuis `masterplan365` (**lecture seule** — jamais modifié).
> Principe : « le juste nécessaire ». Chaque norme retenue doit produire un **contrôle concret**, pas de la documentation décorative.

---

## 1. Normes retenues

| Norme | Pourquoi elle s'applique | Phase |
|---|---|---|
| **OWASP ASVS** (Application Security Verification Standard) | Référentiel de vérification sécurité des applications web. Sert de **grille de contrôle** pour l'API et l'authentification. | 9, 10 |
| **OWASP Top 10** (2021) | Vulnérabilités les plus courantes : contrôle d'accès défaillant, injection, mauvaise configuration, composants vulnérables… | 10 |
| **OWASP API Security Top 10** | Spécifique aux API : autorisation au niveau objet, allocation de ressources, limitation de débit. | 9, 10 |
| **OWASP LLM Top 10** | **Le référentiel clé du volet IA.** LLM01 = Prompt Injection, LLM02 = traitement non sécurisé des sorties, LLM06 = divulgation d'informations sensibles. | 17, 18 |
| **RGPD** | Données personnelles d'apprenants, multi-tenant, transferts transatlantiques. | 10, 21, 25 |
| **WCAG 2.2 niveau AA** | Accessibilité — exigée par Qualiopi (C.1/C.3/C.4) **et** par la loi. | 11, 20, 22 |
| **SOC 2 (Trust Services Criteria)** | Attendu par les clients institutionnels (instituts, académies). | 21 |
| **NIS2** (directive UE 2022/2555) | Gestion du risque, chaîne d'approvisionnement, incidents, continuité. | 21 |
| **ISO/IEC 27001** (référence) | Grille de contrôles de sécurité de l'information — utilisée comme **catalogue**, sans certification. | 10, 21 |
| **EU AI Act** | Transparence du contenu généré, niveaux de risque, signalement. | 17, 18 |
| **NIST AI RMF** (référence) | Cadre de gestion du risque IA : gouverner, cartographier, mesurer, gérer. | 18 |
| **PCI DSS SAQ A** | Checkout **hébergé** par Stripe → périmètre PCI minimal (aucune donnée carte ne transite). | 24 |
| **ISO/IEC 25010** (référence) | Qualité logicielle : sécurité, fiabilité, maintenabilité, portabilité. | 26 |

> **Non retenu** : certification SOC 2 / ISO 27001 formelle (non-goal `NG-09`). Les contrôles sont mis en place, l'audit n'est pas lancé.

---

## 2. Mapping normes → contrôles → phases

| Contrôle | Norme(s) | Phase |
|---|---|---|
| Chaîne obligatoire auth → scope → autorisation → validation | ASVS, API Top 10 | 9 |
| Autorisation **au niveau objet** (scope organisation) | API Top 10 (BOLA) | 9 |
| Limitation de débit (IP + utilisateur) | API Top 10, ASVS | 9 |
| En-têtes de sécurité (CSP, HSTS, nosniff, frame-options) | OWASP Top 10 (A05) | 10 |
| Protection CSRF | OWASP Top 10 (A01) | 10 |
| Anti-force brute + MFA | ASVS | 4, 10 |
| Journal d'audit | SOC 2, NIS2, ISO 27001 | 10 |
| Chiffrement transit + repos | SOC 2, RGPD, ISO 27001 | 10 |
| Analyse de dépendances (`npm audit`, `gitleaks`) | OWASP Top 10 (A06), NIS2 (chaîne d'appro.) | 10 |
| Rétention / suppression / export des données | RGPD | 10, 21 |
| Procédure de réponse à incident | NIS2, SOC 2 | 21 |
| Hiérarchie d'instructions, données inertes | **OWASP LLM01** | 18 |
| Validation de sortie par schéma | **OWASP LLM02** | 18 |
| Pas d'écriture directe depuis l'IA | **OWASP LLM02/LLM06** | 18 |
| Outils IA en liste blanche, scopés | OWASP LLM06, API Top 10 | 18 |
| Transparence du contenu généré | AI Act | 17 |
| Accessibilité (contraste, sous-titres, transcription, alt, lecteurs d'écran) | WCAG 2.2 AA, Qualiopi C.3 | 11, 20 |
| Checkout hébergé (aucune donnée carte) | PCI DSS SAQ A | 24 |
| Localisation et transferts de données | RGPD (transatlantique) | 25 |

---

## 3. Patterns à réutiliser depuis `masterplan365`

> **Lecture seule.** On réutilise les *patterns*, on ne copie pas le code tel quel — Katalyst est un Next.js natif, masterplan365 est un Express séparé.

| Pattern masterplan365 | Ce qu'on en retient | Phase Katalyst |
|---|---|---|
| `server/middleware/authenticate.ts` | Middleware JWT + RBAC + permissions granulaires + cache TTL | 4, 10 |
| `server/routes/auth.ts` | Endpoints `register`/`login`/`refresh`/`logout`/`google`/`mfa`/`sessions`, rate-limiters par endpoint | 4 |
| `server/middleware/{rateLimiter,sanitizeInput,validation}.ts` | Séparation des préoccupations : débit, assainissement, validation Zod | 9, 10 |
| `server/middleware/{aiGuard,featurePermissionGuard,tierQuotaGuard}.ts` | **Garde-fous IA** et quotas par niveau — directement transposables au studio à crédits | 10, 17 |
| `lib/audit` (journal d'audit) | Traçabilité des actions sensibles | 10 |
| `server/services/storageProvider.ts` | Interface + implémentations local/S3 **via fetch, sans SDK AWS** | 3 |
| `server/services/llmProvider.ts` | Types normalisés multi-fournisseurs (`LLMMessage`, `LLMChatResponse`) | 17 |
| `server/services/oemProviders/provider.ts` | Pattern « interface + implémentations par fournisseur » | 3 |
| `docker-compose.dev.yml` | **`pgvector/pgvector:pg16`** — l'extension vectorielle est déjà éprouvée | 0, 16 |
| `server/schema.sql` | Modèle `users` + `refresh_tokens` + `organizations` + `platform_settings` | 2 |
| `.gitleaks.toml` | Détection de secrets en CI | 10 |
| `.github/workflows/deploy-{aws,gcp,azure}.yml` | Déploiement multi-cible depuis une image | 25 |
| `_t('fr','en')` + `public/locales/{lang}/translation.json` | Système i18n simple et éprouvé | 8 |
| `passport-saml` | SSO SAML — ⚠️ **Express-oriented**, spike obligatoire (gate G1) | 4 |
| `.kiro/{steering,specs,workflows,hooks}` | Modèle de suivi — **déjà adapté** dans Katalyst | — |
| `docs/ref/{commands,impact-checklists,e2e-tests,operations}.md` | Documentation de référence par type de changement | — |
| `npm run check:version` (SSoT 16 sources) | Détection de dérive de version | 0 |

---

## 4. Règles

1. **Une norme sans contrôle n'est pas retenue.** Si elle ne produit pas de tâche, elle sort du référentiel.
2. **`masterplan365` reste en lecture seule** — aucune écriture, aucun commit.
3. **Pas de certification revendiquée** sans audit (`NG-09`, REQ-CMP-06).
4. Toute nouvelle norme invoquée doit être ajoutée ici **avec son contrôle et sa phase**.
