# Spec — Exigences Katalyst

> Chaque exigence porte un identifiant `REQ-xxx` et est **traçable** vers une phase de `tasks.md`.
> Aucune exigence ne doit rester orpheline (sans tâche) ni aucune tâche sans exigence.

## Conventions

- `REQ-<domaine>-<n>` — domaine en 3 lettres.
- **Critère d'acceptation** : testable, observable, sans ambiguïté.
- Priorité : `MUST` (bloquant) · `SHOULD` (important) · `MAY` (confort).

---

## FND — Fondations

| ID | Exigence | Critère d'acceptation | Prio | Phase |
|---|---|---|---|---|
| REQ-FND-01 | Le projet passe le typecheck sans erreur | `npm run typecheck` → 0 erreur | MUST | 0 |
| REQ-FND-02 | Le lint est configuré et non interactif | `npm run lint` s'exécute sans prompt | MUST | 0 |
| REQ-FND-03 | Une CI vérifie typecheck, lint, tests et build | CI verte sur PR | MUST | 0 |
| REQ-FND-04 | Un PostgreSQL local démarre en une commande | `docker compose up -d` + `pg_isready` OK | MUST | 0 |
| REQ-FND-05 | Aucun secret n'est versionné | `.env*` gitignoré, `.env.example` fourni | MUST | 0 |
| REQ-FND-06 | Une tranche verticale valide toute la pile | 1 page RSC lit une donnée Postgres, 1 test node vert | MUST | 0.5 |

## MDL — Modèle de référence

| ID | Exigence | Critère d'acceptation | Prio | Phase |
|---|---|---|---|---|
| REQ-MDL-01 | Un registre unique catalogue tous les composants | `registry.ts` liste 37 composants avec type et description | MUST | 1 |
| REQ-MDL-02 | L'UI résout les composants via le registre | `LessonView.tsx` ne contient plus d'imports en dur | MUST | 1 |
| REQ-MDL-03 | L'IA ne peut proposer qu'un composant existant | Nom inconnu → erreur explicite | MUST | 1 |
| REQ-MDL-04 | Les schémas Zod sont la source unique des contrats | Aucune duplication serveur/client | MUST | 1 |
| REQ-MDL-05 | Hiérarchie : Formation → Semaine → Jour → Leçon | Numérotation `S.1.J.2` | MUST | 1 |
| REQ-MDL-06 | Un chapitre se termine sur une semaine (lundi→vendredi) | Une semaine = 5 jours | MUST | 1 |

## DAT — Données

| ID | Exigence | Critère d'acceptation | Prio | Phase |
|---|---|---|---|---|
| REQ-DAT-01 | Le schéma Postgres couvre contenu, utilisateurs, progression, auth, orgs | `schema.sql` s'applique sans erreur | MUST | 2 |
| REQ-DAT-02 | Les migrations sont rejouables et réversibles | Rejouer 2× est idempotent | MUST | 2 |
| REQ-DAT-03 | Le contenu est seedé depuis `src/data/*.json` | 6 formations, 26 chapitres, 26 quiz, 2 formules | MUST | 2 |
| REQ-DAT-04 | Le contenu 2 niveaux est converti vers 3 niveaux (+semaine) | `audit:content` → 6/6 intactes | MUST | 2 |
| REQ-DAT-05 | Les 12 comptes Firebase Auth sont importés | 12 lignes dans `users` | MUST | 2 |
| REQ-DAT-06 | Aucune lecture ne dépend d'un fournisseur dans la couche métier | `grep` : 0 `Firestore` hors `providers/` | MUST | 3 |
| REQ-DAT-07 | Toute dépendance externe est derrière une interface | 9 providers, sélection par env | MUST | 3 |

## AUTH — Authentification

| ID | Exigence | Critère d'acceptation | Prio | Phase |
|---|---|---|---|---|
| REQ-AUTH-01 | Inscription et connexion email/mot de passe | bcrypt vérifié, JWT émis | MUST | 4 |
| REQ-AUTH-02 | Connexion via compte Google | OAuth aboutit, compte lié | MUST | 4 |
| REQ-AUTH-03 | Sessions par refresh token, révocables | Rotation + révocation effectives | MUST | 4 |
| REQ-AUTH-04 | MFA/TOTP disponible | Code TOTP validé | MUST | 4 |
| REQ-AUTH-05 | SSO SAML opérationnel | Gate **G1** levé | MUST | 4 |
| REQ-AUTH-06 | Les 10 comptes importés peuvent se reconnecter | Reset forcé → nouveau mot de passe | MUST | 4 |
| REQ-AUTH-07 | Les 2 comptes Google se reconnectent sans friction | Connexion Google directe | MUST | 4 |
| REQ-AUTH-08 | Aucun import `firebase/*` dans le client | `grep` → 0 | MUST | 4 |
| REQ-AUTH-09 | Les routes privées sont protégées | Accès non authentifié → redirection | MUST | 4 |
| REQ-AUTH-10 | L'email transactionnel est possible | Reset envoyé et reçu | MUST | 4 |

## PROG — Progression

| ID | Exigence | Critère d'acceptation | Prio | Phase |
|---|---|---|---|---|
| REQ-PROG-01 | L'avancement d'une leçon est persisté | Coché → visible après rechargement | MUST | 5 |
| REQ-PROG-02 | La reprise se fait au bon endroit | Retour sur la bonne leçon/vue | SHOULD | 5 |

## CNT — Conformité du contenu

| ID | Exigence | Critère d'acceptation | Prio | Phase |
|---|---|---|---|---|
| REQ-CNT-01 | Un audit de contenu est reproductible | `npm run audit:content` produit un rapport | MUST | 6 |
| REQ-CNT-02 | **100 % des leçons ont un composant interactif** | Audit → 100 % sur 6/6 formations | MUST | 6 |
| REQ-CNT-03 | Chaque formation a au moins un quiz | Audit → 6/6 | MUST | 6 |
| REQ-CNT-04 | L'outil de création produit un contenu conforme | Création IA → conforme | MUST | 6 |

## I18N — Internationalisation & transatlantique

| ID | Exigence | Critère d'acceptation | Prio | Phase |
|---|---|---|---|---|
| REQ-I18N-01 | **FR et EN obligatoires** | Les deux langues couvrent toute l'interface | MUST | 8 |
| REQ-I18N-02 | ES optionnel | Activé si le planning le permet | MAY | 8 |
| REQ-I18N-03 | Routage par locale (`/fr`, `/en`) | Navigation et liens localisés | MUST | 8 |
| REQ-I18N-04 | Aucune chaîne en dur dans les composants | `grep` : 0 libellé non clé | MUST | 8 |
| REQ-I18N-05 | Clé manquante dans une langue obligatoire → build en erreur | CI échoue si FR/EN incomplets | MUST | 8 |
| REQ-I18N-06 | Formats localisés (dates, nombres, devises, fuseaux) | Affichage conforme à la locale | MUST | 8 |
| REQ-I18N-07 | Langue persistée par utilisateur | Choix conservé entre sessions | MUST | 8 |
| REQ-I18N-08 | **Contenu traduisible** (formations, leçons) | Une formation existe en FR et EN | MUST | 8 |
| REQ-I18N-09 | Traduction du contenu assistée par IA | Usage du studio (famille TTT) | SHOULD | 17 |

## API — API centrale

| ID | Exigence | Critère d'acceptation | Prio | Phase |
|---|---|---|---|---|
| REQ-API-01 | Surface unique versionnée `/api/v1/*` | Toute donnée client passe par là | MUST | 9 |
| REQ-API-02 | Chaîne obligatoire : auth → scope → autorisation → validation → handler | Aucune route ne contourne la chaîne | MUST | 9 |
| REQ-API-03 | Spécification OpenAPI générée depuis les schémas Zod | `/api/v1/openapi.json` valide | MUST | 9 |
| REQ-API-04 | Aucune logique métier dans les routes | Les routes délèguent aux providers | MUST | 9 |
| REQ-API-05 | Limitation de débit par IP et par utilisateur | Seuils distincts par endpoint | MUST | 9 |
| REQ-API-06 | Réponses d'erreur normalisées | Format unique, sans fuite interne | MUST | 9 |

## SEC — Sécurité

| ID | Exigence | Critère d'acceptation | Prio | Phase |
|---|---|---|---|---|
| REQ-SEC-01 | En-têtes de sécurité (CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy) | Vérifiés sur toutes les réponses | MUST | 10 |
| REQ-SEC-02 | Protection CSRF sur les mutations | Requête sans jeton → rejetée | MUST | 10 |
| REQ-SEC-03 | Anti-force brute sur login / reset / MFA | Verrouillage progressif effectif | MUST | 10 |
| REQ-SEC-04 | Journal d'audit des actions sensibles | Qui, quoi, quand, depuis où | MUST | 10 |
| REQ-SEC-05 | Chiffrement en transit et au repos | TLS + chiffrement des données sensibles | MUST | 10 |
| REQ-SEC-06 | Analyse des dépendances en CI (`npm audit`, `gitleaks`) | CI échoue sur vulnérabilité critique | MUST | 10 |
| REQ-SEC-07 | Moindre privilège pour les comptes techniques | Droits minimaux documentés | MUST | 10 |
| REQ-SEC-08 | Politique de rétention et suppression des données | Procédure applicable | MUST | 10 |
| REQ-SEC-09 | Procédure de réponse à incident documentée | Document disponible | MUST | 10 |

## PINJ — Défenses contre l'injection de prompt

| ID | Exigence | Critère d'acceptation | Prio | Phase |
|---|---|---|---|---|
| REQ-PINJ-01 | Hiérarchie d'instructions explicite (système > utilisateur > **contenu = donnée inerte**) | Le contenu importé n'est jamais exécuté comme instruction | MUST | 18 |
| REQ-PINJ-02 | Délimitation et échappement du contenu non fiable | Séparateurs explicites dans chaque prompt | MUST | 18 |
| REQ-PINJ-03 | **Validation de sortie par schéma Zod** | Sortie non conforme → rejetée, jamais rendue | MUST | 18 |
| REQ-PINJ-04 | **Aucune exécution ni écriture directe** depuis la sortie IA | Aperçu + édition humaine obligatoires | MUST | 18 |
| REQ-PINJ-05 | Outils IA en liste blanche, limités au `OrgScope` | Aucun outil ne lit hors organisation | MUST | 18 |
| REQ-PINJ-06 | Détection et journalisation des motifs d'injection | Tentatives tracées + alerte sur pic | MUST | 18 |
| REQ-PINJ-07 | Marquage de provenance du contenu généré | Mention de transparence (AI Act) | MUST | 18 |
| REQ-PINJ-08 | Test de résistance documenté (jeu de tentatives connues) | Suite de tests d'injection exécutée | MUST | 18 |

## ORG — Organisations autonomes (multi-tenant)

> Voir `adr/0007` — ce domaine **remplace** l'ancien non-goal `NG-01`.

| ID | Exigence | Critère d'acceptation | Prio | Phase |
|---|---|---|---|---|
| REQ-ORG-01 | Une organisation regroupe formateurs, apprenants, formations, cohortes | Table `organizations` + `organization_id` | MUST | 2 |
| REQ-ORG-02 | **Isolation stricte** : aucune donnée hors organisation | Tests d'isolation inter-organisations verts | MUST | 3 |
| REQ-ORG-03 | Le scope est **obligatoire** dans l'interface des providers | Impossible de requêter sans `organization_id` | MUST | 3 |
| REQ-ORG-04 | **Inscription libre-service** : créer un compte crée une organisation | Espace obtenu sans intervention | MUST | 4 |
| REQ-ORG-05 | Invitation de formateurs et d'apprenants | Invitation par email fonctionnelle | MUST | 4 |
| REQ-ORG-06 | Rôles : Propriétaire → Admin → Modérateur → Utilisateur (+ Super Admin) | Permissions distinctes | MUST | 4 |
| REQ-ORG-07 | **Marque propre** : logo, nom, couleur d'accent | Espace personnalisé | SHOULD | 22 |
| REQ-ORG-08 | **Facturation au niveau organisation** | Abonnement et crédits portés par l'organisation | MUST | 24 |
| REQ-ORG-09 | **Autonomie complète** sans intervention du propriétaire plateforme | Parcours de bout en bout autonome | MUST | 27 |
| REQ-ORG-10 | Onboarding guidé et documentation intégrée | Nouveau formateur opérationnel seul | MUST | 27 |
| REQ-ORG-11 | Personas : formateur, coach, professeur, institut, académie | Même modèle, aucun code spécifique | MUST | 27 |

## LRN — Expérience d'apprentissage

| ID | Exigence | Critère d'acceptation | Prio | Phase |
|---|---|---|---|---|
| REQ-LRN-01 | 9 types de leçon supportés | Enum + Zod + rendu par type | MUST | 11 |
| REQ-LRN-02 | **L'audio est un contenu de première classe** | Leçon audio créable, lisible, téléchargeable | MUST | 11 |
| REQ-LRN-03 | Les liens vidéo (YouTube, Vevo) sont lisibles | Lecteur intégré fonctionnel | MUST | 11 |
| REQ-LRN-04 | Images et fichiers sont supportés | Upload + affichage | MUST | 11 |
| REQ-LRN-05 | Chaque leçon affiche sa durée et ses points | Conforme aux captures | SHOULD | 11 |
| REQ-LRN-06 | Les types sont signalés par un badge coloré | Conforme aux captures | SHOULD | 11 |
| REQ-LRN-07 | Tout média porte ses métadonnées d'accessibilité | Transcription/sous-titres/alt présents | MUST | 11 |

## UNL — Déblocage

| ID | Exigence | Critère d'acceptation | Prio | Phase |
|---|---|---|---|---|
| REQ-UNL-01 | Déblocage par date de sortie | Badge date, contenu fermé avant | MUST | 12 |
| REQ-UNL-02 | Déblocage conditionnel (chapitre précédent, quiz réussi) | Accès refusé si condition non remplie | MUST | 12 |
| REQ-UNL-03 | Trois états visuels de leçon | ✅ / ▶ / 🔒 | MUST | 12 |
| REQ-UNL-04 | Les règles sont évaluées côté serveur | Contournement client impossible | MUST | 12 |
| REQ-UNL-05 | **Granularité configurable** : jour / semaine / mois / personnalisé | La cadence choisie s'applique | MUST | 12 |
| REQ-UNL-06 | **Échéance de fin** par chapitre/leçon/quiz | Période limite appliquée | MUST | 12 |

## GAM — Gamification

| ID | Exigence | Critère d'acceptation | Prio | Phase |
|---|---|---|---|---|
| REQ-GAM-01 | Les points sont stockés dans un ledger | Solde recalculable | MUST | 13 |
| REQ-GAM-02 | Points attribués une seule fois | Rejeu → pas de double crédit | MUST | 13 |
| REQ-GAM-03 | Écran de fin de leçon avec points gagnés | « Félicitations ! … ⭐ 20 points » | MUST | 13 |
| REQ-GAM-04 | Effet visuel de fin de chapitre | Animation déclenchée | SHOULD | 13 |
| REQ-GAM-05 | Récapitulatif de complétion par type | `Vidéo 8/8`, `Capsule 27/27` | SHOULD | 13 |

## SOC — Cohortes et messagerie

| ID | Exigence | Critère d'acceptation | Prio | Phase |
|---|---|---|---|---|
| REQ-SOC-01 | Un admin crée des cohortes | Nommage type `IAFORMATEUR_20260803G1` | MUST | 14 |
| REQ-SOC-02 | Un apprenant peut appartenir à plusieurs cohortes | 2 cohortes simultanées | MUST | 14 |
| REQ-SOC-03 | Chat temps réel par cohorte | Message reçu sans rechargement | MUST | 14 |
| REQ-SOC-04 | Pièces jointes et emoji | Envoi et réception OK | SHOULD | 14 |
| REQ-SOC-05 | Compteur de messages non lus | Badge visible | SHOULD | 14 |
| REQ-SOC-06 | Nombre de participants visible | Conforme aux captures | SHOULD | 14 |

## NOT — Notifications

| ID | Exigence | Critère d'acceptation | Prio | Phase |
|---|---|---|---|---|
| REQ-NOT-01 | Notification à l'ouverture d'un chapitre/leçon | Apprenant notifié à l'ouverture | MUST | 15 |
| REQ-NOT-02 | Notification à l'accès (rappel de disponibilité) | Notification reçue | MUST | 15 |
| REQ-NOT-03 | **Rappel si un contenu n'est pas entamé** avant échéance | Rappel envoyé si inactivité | MUST | 15 |
| REQ-NOT-04 | Rappel d'échéance de fin de formation | Rappel programmé | MUST | 15 |
| REQ-NOT-05 | Canaux : in-app + email (+ push mobile) | Reçu sur les canaux configurés | MUST | 15 |
| REQ-NOT-06 | Préférences de notification par apprenant | Réglages appliqués | SHOULD | 15 |

## DOC — Base documentaire du formateur

> Voir `adr/0012` — content prompting à 3 niveaux.

| ID | Exigence | Critère d'acceptation | Prio | Phase |
|---|---|---|---|---|
| REQ-DOC-01 | Le formateur attache sa documentation à une **formation** | Document disponible pour toutes ses leçons | MUST | 16 |
| REQ-DOC-02 | Le formateur attache sa documentation à un **chapitre** | Document disponible pour ses leçons | MUST | 16 |
| REQ-DOC-03 | Le formateur attache sa documentation à une **leçon** | Document disponible pour cette leçon | MUST | 16 |
| REQ-DOC-04 | **Héritage** : leçon + chapitre + formation, le plus spécifique prioritaire | Récupération respecte la priorité | MUST | 16 |
| REQ-DOC-05 | Formats supportés : PDF, DOCX, TXT, Markdown, HTML | Ingestion réussie pour chaque format | MUST | 16 |
| REQ-DOC-06 | Extraction, découpage et **vectorisation** (pgvector) | Recherche sémantique opérationnelle | MUST | 16 |
| REQ-DOC-07 | **Récupération ciblée** : seuls les segments pertinents entrent dans le prompt | Le prompt ne dépasse pas la fenêtre | MUST | 16 |
| REQ-DOC-08 | **Traçabilité des sources** utilisées par génération | `source_document_ids` enregistrés | MUST | 16 |
| REQ-DOC-09 | La recherche est **limitée au `OrgScope`** | Aucun segment hors organisation | MUST | 16 |
| REQ-DOC-10 | Statuts : `EN_ATTENTE` → `INDEXE` → `ERREUR` | Statut visible par le formateur | SHOULD | 16 |
| REQ-DOC-11 | Suppression d'un document → segments et vecteurs supprimés | Aucun résidu | MUST | 16 |
| REQ-DOC-12 | Limites de taille et de volume par organisation | Dépassement refusé proprement | SHOULD | 16 |

## AIC — Studio IA et crédits

| ID | Exigence | Critère d'acceptation | Prio | Phase |
|---|---|---|---|---|
| REQ-AIC-01 | Les formateurs génèrent du contenu dans l'app | Génération déclenchée depuis l'éditeur | MUST | 17 |
| REQ-AIC-02 | Familles couvertes : TTT, TTI, TTS, STT, TTV | Les 5 familles disponibles | MUST | 17 |
| REQ-AIC-03 | **Crédits IA consommables**, achetables par le formateur | Solde débité, rechargeable | MUST | 17 |
| REQ-AIC-04 | Coût affiché **avant** génération | Estimation visible et validée | MUST | 17 |
| REQ-AIC-05 | Génération **contextualisée** (méthodologie REWORK + documentation du formateur) | Le contenu généré s'appuie sur les sources | MUST | 17 |
| REQ-AIC-06 | Le résultat est **éditable** avant intégration | Aperçu + édition + acceptation | MUST | 17 |
| REQ-AIC-07 | Le contenu généré par IA est **signalé** | Mention de transparence (AI Act) | MUST | 17 |
| REQ-AIC-08 | Ergonomie : parcours guidé, sans rupture | L'auteur ne quitte pas son flux | SHOULD | 17 |

## MTH — Méthodologie REWORK

| ID | Exigence | Critère d'acceptation | Prio | Phase |
|---|---|---|---|---|
| REQ-MTH-01 | Le pipeline à gates est appliqué dans l'outil | Aucun saut de phase possible | MUST | 19 |
| REQ-MTH-02 | Objectifs pédagogiques au format Bloom imposé | Formule validée automatiquement | MUST | 19 |
| REQ-MTH-03 | Déroulé 6 colonnes avec contrôle arithmétique | Dépassement signalé avant validation | MUST | 19 |
| REQ-MTH-04 | Fiche programme 17 rubriques générée | Document commercial produit | MUST | 19 |
| REQ-MTH-05 | Identimètre (5 piliers) dans le cahier des charges | Formulaire présent | MUST | 19 |
| REQ-MTH-06 | QQOQCCP appliqué à l'analyse de la demande | 7 axes tracés | MUST | 19 |
| REQ-MTH-07 | Évaluations : formative, sommative (80 %), à chaud, à froid | Types configurables | MUST | 19 |
| REQ-MTH-08 | Donnée non fournie marquée `[À COMPLÉTER]`, jamais inventée | Aucun contenu inventé | MUST | 19 |
| REQ-MTH-09 | Chaque usage IA est **justifié** (C.2/C.3) | Justification enregistrée | MUST | 19 |

## QLF — Conformité Qualiopi

> Référentiel applicable : **RNQ V10** — décret **n° 2026-728 du 1er août 2026**, **33 indicateurs**, en vigueur au **1er novembre 2026** (source : Légifrance JORFTEXT000054608509, lu le 2026-09-21).

| ID | Exigence | Critère d'acceptation | Prio | Phase |
|---|---|---|---|---|
| REQ-QLF-01 | Mapping Qualiopi ↔ fonctionnalités (**33 indicateurs**) | Table de correspondance complète | MUST | 20 |
| REQ-QLF-02 | **Preuves conservées et exportables** par formation | Export d'un dossier de preuves | MUST | 20 |
| REQ-QLF-03 | **Accessibilité handicap systématique** (C.1/C.3/C.4) | Checklist handicap bloquante | MUST | 20 |
| REQ-QLF-04 | Traçabilité des évaluations | Historique consultable | MUST | 20 |
| REQ-QLF-05 | Référentiel C.1-C.8 couvert | Chaque compétence adossée | MUST | 20 |
| REQ-QLF-06 | Veille réglementaire documentée | Sources officielles citées | SHOULD | 20 |
| REQ-QLF-07 | **Transparence des indicateurs de résultats** (modalités de calcul) — nouveau RNQ V10 | Indicateurs calculés et diffusés avec leur méthode | MUST | 20 |
| REQ-QLF-08 | **Prévention des VSS, harcèlement et discriminations** — nouveau RNQ V10 | Procédure intégrée et traçable | MUST | 20 |
| REQ-QLF-09 | **Traçabilité de la sous-traitance / portage salarial** — nouveau RNQ V10 | Conformité des sous-traitants enregistrée | MUST | 20 |

## CMP — Conformité SOC 2 / NIS2

| ID | Exigence | Critère d'acceptation | Prio | Phase |
|---|---|---|---|---|
| REQ-CMP-01 | Contrôles documentés (accès, audit, chiffrement, sauvegardes, incidents) | Documentation des contrôles produite | MUST | 21 |
| REQ-CMP-02 | Registre des fournisseurs et dépendances | Liste maintenue | MUST | 21 |
| REQ-CMP-03 | Gestion de changement tracée (CI, revue, réversibilité) | Historique auditable | MUST | 21 |
| REQ-CMP-04 | Procédure de réponse à incident | Document + responsable désigné | MUST | 21 |
| REQ-CMP-05 | Rétention et suppression conformes RGPD | Procédure applicable et testée | MUST | 21 |
| REQ-CMP-06 | Aucune certification revendiquée sans audit | Communication honnête | MUST | 21 |

## DSG — Design

| ID | Exigence | Critère d'acceptation | Prio | Phase |
|---|---|---|---|---|
| REQ-DSG-01 | Charte à un seul accent | Tokens CSS définis | MUST | 22 |
| REQ-DSG-02 | États verrouillé / progression / terminé homogènes | Cohérents partout | MUST | 22 |
| REQ-DSG-03 | États vides illustrés | Conforme aux captures | SHOULD | 22 |
| REQ-DSG-04 | Responsive 320 / 768 / 1024+ | Aucune régression | MUST | 22 |
| REQ-DSG-05 | Ergonomie du flux de création sans rupture | L'auteur reste dans son contexte | MUST | 22 |

## MOB — Mobile

| ID | Exigence | Critère d'acceptation | Prio | Phase |
|---|---|---|---|---|
| REQ-MOB-01 | Android et iOS via Capacitor | Build réussie | MUST | 23 |
| REQ-MOB-02 | Chat et notifications fonctionnent sur mobile | SSE + push actifs | MUST | 23 |
| REQ-MOB-03 | Publication sur les stores | Fiches soumises | SHOULD | 23 |

## PAY — Paiement

| ID | Exigence | Critère d'acceptation | Prio | Phase |
|---|---|---|---|---|
| REQ-PAY-01 | Checkout hébergé via abstraction | Session créée sans code Stripe dans l'UI | MUST | 24 |
| REQ-PAY-02 | Webhooks idempotents | Rejeu sans double effet | MUST | 24 |
| REQ-PAY-03 | Abonnement → plan utilisateur | Test → `premium` actif | MUST | 24 |
| REQ-PAY-04 | Accès restreint selon le plan | Entitlements corrects | MUST | 24 |
| REQ-PAY-05 | **Achat de crédits IA** | Solde crédité après paiement | MUST | 24 |

## DEP — Déploiement

| ID | Exigence | Critère d'acceptation | Prio | Phase |
|---|---|---|---|---|
| REQ-DEP-01 | Image Docker autonome | Démarre sans dépendance externe | MUST | 25 |
| REQ-DEP-02 | Déploiement multi-cible (GCP/AWS/Azure) | Depuis la même image | MUST | 25 |
| REQ-DEP-03 | Déploiement sur VPS/dédié possible | Gate **G2** levé | MUST | 25 |
| REQ-DEP-04 | Sauvegarde et restauration testées | Restauration réussie | MUST | 25 |
| REQ-DEP-05 | Localisation des données maîtrisée (transatlantique) | Région d'hébergement documentée | MUST | 25 |

## PERF — Efficience

| ID | Exigence | Critère d'acceptation | Prio | Phase |
|---|---|---|---|---|
| REQ-PERF-01 | Lectures mises en cache | Moins de requêtes répétées | SHOULD | 26 |
| REQ-PERF-02 | Bundle maîtrisé | Mesure avant/après | SHOULD | 26 |
| REQ-PERF-03 | Aucun code mort | 0 composant/route orpheline | SHOULD | 26 |

---

## Non-goals (YAGNI — hors périmètre)

| # | Non-goal | Raison |
|---|---|---|
| ~~NG-01~~ | ~~Multi-tenant `organizations`~~ | **SUPPRIMÉ — remplacé par `ORG`** (ADR 0007) |
| NG-02 | Nango, intégrations tierces | Non requis |
| NG-03 | SAML multi-IdP exhaustif | Google Workspace + Microsoft Entra ID |
| ~~NG-04~~ | ~~i18n multi-langue~~ | **SUPPRIMÉ — remplacé par `I18N`** (ADR 0008) |
| NG-05 | 7 rôles masterplan365 | Katalyst en garde 4 + Super Admin |
| NG-06 | Marketplace / forum public | Hors périmètre |
| NG-07 | Réintroduction d'une dépendance exigeant la facturation GCP | Contrainte durable |
| NG-08 | Marketplace d'assistants IA type Poe/GPTs | Le studio couvre le besoin |
| NG-09 | Certification SOC 2 / ISO 27001 formelle | « Juste nécessaire » — contrôles sans audit (ADR 0011) |
| NG-10 | ES obligatoire | Conditionné au temps disponible |
| NG-11 | Base vectorielle externe (Pinecone…) | pgvector suffit (ADR 0012) |

---

## Traçabilité

Chaque `REQ-` est mappé vers une phase dans `@.kiro/specs/katalyst/tasks.md`.
Méthodologie : `@.kiro/steering/rework-methodology.md`.
