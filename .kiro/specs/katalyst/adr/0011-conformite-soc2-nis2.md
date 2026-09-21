# ADR 0011 — Conformité SOC 2 et NIS2 : « le juste nécessaire »

- **Statut** : accepté
- **Date** : 2026-09-21
- **Phases concernées** : 20

## Contexte

L'utilisateur demande la conformité « SOC 2, NSI2, et consorts (le juste nécessaire) » pour rendre l'application transatlantique.

**Précision de lecture** : « NSI2 » est interprété comme **NIS2** (directive UE 2022/2555 sur la cybersécurité). À confirmer si l'intention diffère.

**Ce qui est demandé** : le **juste nécessaire**, pas un programme de certification. C'est la contrainte structurante de cet ADR.

Deux référentiels de nature différente :
- **SOC 2** — référentiel d'audit (AICPA), volontaire, orienté **preuve** : 5 catégories (Security, Availability, Confidentiality, Processing Integrity, Privacy).
- **NIS2** — directive européenne, orientée **gestion du risque** : gouvernance, sécurité de la chaîne d'approvisionnement, gestion des incidents, continuité d'activité.

Ils se recouvrent largement sur les contrôles techniques — c'est là que se trouve le « juste nécessaire ».

## Décision

### 1. Mettre en place les contrôles qui servent les deux référentiels

Aucun contrôle « pour la conformité » : chaque contrôle retenu a une **valeur opérationnelle directe**.

| Contrôle | SOC 2 | NIS2 | Valeur opérationnelle |
|---|---|---|---|
| Contrôle d'accès (RBAC + scope) | Security | Gestion du risque | Isolation multi-tenant |
| Journal d'audit | Security | Détection d'incident | Diagnostic, enquête |
| Chiffrement (transit + repos) | Confidentiality | Gestion du risque | Protection des données |
| Sauvegardes + restauration testée | Availability | Continuité | Reprise après sinistre |
| Supervision + alertes | Availability | Détection | Exploitation |
| Gestion des vulnérabilités (`npm audit`, `gitleaks`) | Security | Chaîne d'approvisionnement | Hygiène des dépendances |
| Gestion de changement (CI, revue, traçabilité) | Processing Integrity | Gestion du risque | Qualité et réversibilité |
| Politique de rétention et suppression | Privacy | Gestion du risque | **RGPD** |
| Procédure de réponse à incident | Security | **Obligation NIS2** | Réactivité |
| Registre des fournisseurs | Confidentiality | **Chaîne d'approvisionnement** | Maîtrise des dépendances |

### 2. Documenter, pas certifier

- Produire la **documentation des contrôles** (ce qui est fait, comment, où la preuve se trouve).
- **Ne pas** lancer d'audit SOC 2 ni de démarche de conformité NIS2 formelle à ce stade — ce serait disproportionné.
- La documentation est structurée pour qu'un audit devienne possible **plus tard**, sans refonte.

### 3. Écarts assumés

- **Pas de certification SOC 2** — le rapport d'audit n'est pas produit.
- **NIS2** : l'application n'est pas nécessairement une « entité essentielle » au sens de la directive ; les obligations dépendent du statut de l'exploitant. Les **contrôles** sont en place, le **cadre juridique** reste à la charge de l'exploitant.
- **Transatlanticité** : l'hébergement et les transferts de données hors UE (RGPD) relèvent de la phase 24 et du choix d'hébergement (gate **G2**).

### 4. Lien avec les autres ADR

- Sécurité et API centralisée : ADR 0009.
- Injection de prompt : ADR 0010.
- Isolation multi-tenant : ADR 0007.
- Qualiopi (volet qualité pédagogique) : ADR 0006.

## Conséquences

### Positives
- Les contrôles servent d'abord l'application, ensuite la conformité — pas l'inverse.
- La conformité devient **démontrable** sans programme coûteux.
- Prépare une commercialisation auprès d'instituts et d'académies soumis à des exigences de sécurité.
- Base solide pour un futur SOC 2 si un client l'exige.

### Négatives / coûts
- La documentation des contrôles est un travail réel (temps non négligeable).
- Certains contrôles imposent de la discipline continue (revue de dépendances, mise à jour de la procédure d'incident).
- L'absence de certification peut bloquer certains appels d'offres — assumé à ce stade.

## Alternatives écartées

| Alternative | Raison du rejet |
|---|---|
| **Lancer une certification SOC 2** | Coût et délais disproportionnés ; non demandé |
| **Ignorer les référentiels** | Contredit l'exigence ; et les contrôles ont une valeur réelle |
| **Adopter ISO 27001 à la place** | Encore plus lourd ; même logique de « juste nécessaire » |
| **Tout traiter via un prestataire de conformité** | Coût élevé, contraire à l'agnosticité, et ne remplace pas les contrôles techniques |

## Références

- `@.kiro/specs/katalyst/requirements.md` domaine `CMP`
- `@.kiro/specs/katalyst/design.md` §22
- `@.kiro/specs/katalyst/tasks.md` phase 20
- `@.kiro/specs/katalyst/adr/0009-api-centrale-securite.md`
