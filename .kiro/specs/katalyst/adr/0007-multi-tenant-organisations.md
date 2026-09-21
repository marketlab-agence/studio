# ADR 0007 — Multi-tenant léger : organisations autonomes

- **Statut** : accepté
- **Date** : 2026-09-21
- **Remplace** : `NG-01` (« Multi-tenant `organizations` » — non-goal de `requirements.md`)
- **Phases concernées** : 2, 3, 4, 18, 21

## Contexte

### La décision antérieure

Dans `requirements.md`, `NG-01` écartait explicitement le multi-tenant :

> NG-01 | Multi-tenant `organizations` | Katalyst utilise des **cohortes**, plus légères

Ce choix était fondé sur un usage mono-organisme : un propriétaire, ses formations, ses apprenants.

### Ce qui a changé

L'utilisateur précise l'objectif final :

> « La plateforme doit pouvoir être utilisée **au finish en toute autonomie** par les **formateurs, coachs, professeurs d'instituts, académies**, etc. »

Trois éléments rendent `NG-01` intenable :

1. **Isolation des données.** Un institut ou une académie ne peut pas partager son vivier d'apprenants, ses formations et ses résultats avec un concurrent. C'est une exigence professionnelle, et une exigence RGPD.
2. **Marque propre.** Un institut présente la plateforme sous sa propre identité, pas sous celle de Katalyst.
3. **Autonomie réelle.** « En toute autonomie » signifie **sans intervention du propriétaire de la plateforme** : inscription libre-service, création de l'espace, invitation des apprenants, achat de crédits IA, gestion des formateurs.

Les **cohortes** (déjà prévues) restent utiles — mais elles sont un regroupement **à l'intérieur** d'une organisation, pas un substitut à l'isolation.

## Décision

Adopter un **multi-tenant léger** par `organizations`, avec :

1. **Table `organizations`** (id, nom, slug, marque, propriétaire, plan, dates).
2. **`organization_id`** sur toutes les entités cloisonnées : `users`, `courses`, `cohorts`, `ai_credits`, `plans` (abonnement), `notifications`.
3. **Isolation appliquée au niveau des providers** : chaque requête est scopée par `organization_id`. Un provider ne retourne **jamais** une ligne hors de l'organisation du demandeur.
4. **Rôles étendus** : `Propriétaire` (d'une organisation) → `Admin` → `Modérateur` → `Utilisateur`. Le rôle plateforme existant (`Super Admin`) est conservé pour l'exploitation.
5. **Inscription libre-service** : créer un compte crée une organisation (ou rejoint par invitation).
6. **Marque par organisation** : logo, nom affiché, **couleur d'accent** (la charte sobre reste la base — REQ-DSG-01).
7. **Facturation au niveau organisation** : abonnement + crédits IA mutualisés pour l'organisation.
8. **Personas couverts** : formateur indépendant, coach, professeur, institut, académie — tous via le même modèle.

### Ce qui n'est PAS retenu (YAGNI maintenu)

- Sous-organisations / hiérarchies multi-niveaux.
- SSO par organisation avec IdP arbitraire (reste limité à Google Workspace + Microsoft Entra ID — `NG-03`).
- Marketplace inter-organisations.

## Conséquences

### Positives
- Katalyst devient un **produit commercialisable** à des organismes de formation, pas seulement un outil interne.
- Isolation RGPD-compatible par construction.
- La marque propre est un argument de vente pour les instituts.
- L'autonomie supprime le coût d'accompagnement manuel.

### Négatives / coûts
- **Révision du schéma** : `organization_id` traverse les tables et **chaque requête** des providers.
- **Risque de fuite inter-organisations** : une requête non scopée = incident grave. Mitigation : scope obligatoire dans l'interface des providers (non optionnel) + tests d'isolation dédiés.
- Complexité de facturation accrue (abonnement et crédits au niveau organisation).
- Le rôle `Super Admin` (exploitation plateforme) doit être distingué du rôle `Propriétaire` (organisation).
- Impact sur les phases déjà planifiées : 2 (schéma), 3 (providers), 4 (auth/inscription), 18 (paiement), + nouvelle phase 21.

## Alternatives écartées

| Alternative | Raison du rejet |
|---|---|
| **Rester mono-tenant (NG-01)** | Un institut partagerait ses apprenants avec d'autres — inacceptable |
| **Multi-tenant par bases séparées** | Complexité opérationnelle disproportionnée ; coût de migration et de sauvegarde multiplié |
| **Multi-tenant par schémas Postgres séparés** | Idem, sans bénéfice décisif à cette échelle |
| **Simple multi-auteur (sans isolation)** | Ne répond pas à l'exigence d'autonomie ni de confidentialité |
| **Cloisonnement applicatif uniquement (sans `organization_id` en base)** | Non fiable ; l'isolation doit être structurelle, pas déclarative |

## Exigences impactées

- `NG-01` : **supprimé** des non-goals (remplacé par le présent ADR).
- Nouveau domaine `ORG` dans `requirements.md`.
- Toutes les exigences `DAT`, `AUTH`, `PAY`, `SOC`, `AIC`, `NOT` deviennent **scopées par organisation**.

## Références

- `@.kiro/specs/katalyst/requirements.md` domaine `ORG`
- `@.kiro/specs/katalyst/design.md` §17
- `@.kiro/specs/katalyst/tasks.md` phases 2, 3, 4, 18, 21
- `@.kiro/specs/katalyst/adr/0006-conformite-qualiopi.md` (un organisme = un dossier de preuves)
