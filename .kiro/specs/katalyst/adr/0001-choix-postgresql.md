# ADR 0001 — PostgreSQL auto-hébergé remplace Firestore

- **Statut** : accepté
- **Date** : 2026-09-21
- **Décideurs** : propriétaire du projet
- **Phases concernées** : 2, 3, 7, 15

## Contexte

Katalyst repose intégralement sur Firestore (Admin SDK côté serveur, Web SDK côté client). Cet état de fait a produit un incident concret et mesurable : la **facturation GCP désactivée** sur le projet `git-explorer-2tcnx` a rendu l'application **entièrement inutilisable** — accueil, formations, quiz, tarifs, connexion — avec l'erreur `7 PERMISSION_DENIED: This API method requires billing to be enabled`.

Le couplage est structurel : 41 imports `firebase*` répartis sur ~25 fichiers, dont le type `Firestore` qui traverse la couche métier (`getCourses(db: Firestore)`).

Par ailleurs, le projet frère `masterplan365` démontre qu'une architecture agnostique est tenable : `StorageProvider` (S3-compatible via fetch, sans SDK), `LLMProvider` multi-fournisseurs, `pg` + SQL brut, et des workflows de déploiement AWS/GCP/Azure depuis la même image.

## Décision

Migrer vers **PostgreSQL auto-hébergé**, accessible **côté serveur uniquement**, derrière une couche de providers interchangeables.

- Base : PostgreSQL 16, en Docker (dev) et sur serveur dédié/VPS ou cloud (prod).
- Accès : SQL brut via `pg`, requêtes ciblées, transactions.
- Abstraction : `ContentProvider`, `UserProvider`, `SettingsProvider` — aucun type de fournisseur dans la couche métier.
- Migration : **Strangler Fig** (coexistence Firestore/Postgres, bascule par domaine, pas de big-bang).
- Déploiement : Docker portable → GCP / AWS / Azure **ou** VPS/dédié.

## Conséquences

### Positives
- Fin du verrou GCP : l'application fonctionne sans aucune facturation tierce.
- Portabilité réelle (image Docker identique sur 4 cibles).
- SQL relationnel adapté aux besoins réels : déblocage conditionnel, ledger de points, agrégats de progression, cohortes.
- L'idempotence des points est garantie par contrainte SQL, pas par du code applicatif.
- Écosystème open-source, sauvegardable et inspectable.

### Négatives / coûts
- **Perte des profils Firestore** (plan, rôle, progression) : irrécupérables sans facturation. Rejoués depuis `src/data/*.json` + valeurs par défaut.
- Réécriture de la couche d'accès (phases 2-3).
- Nouvelle charge opérationnelle : sauvegardes, migrations, supervision.
- Nécessité d'une infra de test DB (aujourd'hui inexistante — les tests sont jsdom uniquement).

## Alternatives écartées

| Alternative | Raison du rejet |
|---|---|
| **Rester sur Firestore** | Verrou maintenu ; l'incident se reproduirait à l'identique |
| **Activer la facturation GCP** | Refusé explicitement par le propriétaire |
| **Émulateur Firestore** | Résout le dev local, pas la production |
| **Supabase / Neon (Postgres managé)** | Réintroduit une dépendance à un fournisseur unique ; contraire à l'objectif d'agnosticité |
| **MongoDB / base NoSQL** | Ne résout pas les besoins relationnels (déblocage conditionnel, ledger, cohortes) |

## Références

- `@.kiro/specs/katalyst/design.md` §2, §3
- `@.kiro/specs/katalyst/tasks.md` phases 2, 3, 7, 15
- Preuve de l'incident : `MEMORY.md` §Bugs résolus
