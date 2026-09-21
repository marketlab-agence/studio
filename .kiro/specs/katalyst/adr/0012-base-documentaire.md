# ADR 0012 — Base documentaire du formateur (content prompting à 3 niveaux)

- **Statut** : accepté
- **Date** : 2026-09-21
- **Phases concernées** : 16, 17, 18

## Contexte

La méthodologie REWORK prescrit le **content prompting** : « fournir un contenu spécifique (PDF, texte, vidéo) comme base de génération » — c'est le modèle d'échange n°4 du référentiel (`Grenier/Methodes.md`).

L'utilisateur en fait une capacité de premier ordre :

> « Le formateur peut donner sa documentation à l'IA **avant de créer une leçon, un chapitre ou l'ensemble d'une formation**. »

Trois niveaux d'attachement sont donc exigés. Cela implique une **base documentaire avec recherche sémantique** : les documents sont trop volumineux pour être injectés intégralement dans un prompt, et la méthode REWORK recommande d'ailleurs de fournir des documents **ciblés** (« extraire la page utile plutôt que 300 pages »).

Contrainte croisée : le même ADR 0010 identifie le content prompting comme **le principal vecteur d'injection de prompt**. Ingérer des documents tiers sur une plateforme multi-tenant (ADR 0007) est donc un choix à sécuriser explicitement.

## Décision

### 1. Base documentaire à trois niveaux, avec héritage

```
Formation  → documents attachés à la formation   (disponibles pour TOUTES ses leçons)
  Chapitre → documents attachés au chapitre      (disponibles pour ses leçons)
    Leçon  → documents attachés à la leçon       (les plus spécifiques)
```

**Règle d'héritage** : lors d'une génération pour une leçon, les documents disponibles sont **leçon + chapitre + formation**, dans cet ordre de priorité. Le plus spécifique prime.

### 2. Ingestion et recherche

- **Formats** : PDF, DOCX, TXT, Markdown, HTML (extensible).
- **Pipeline** : upload → stockage (`StorageProvider`) → extraction texte → découpage en segments → **vectorisation** → index.
- **Recherche** : similarité vectorielle via **pgvector** (extension PostgreSQL open-source, déjà utilisée par le projet frère `masterplan365` avec l'image `pgvector/pgvector:pg16`).
- **Récupération ciblée** : seuls les segments pertinents entrent dans le prompt — conforme à la recommandation REWORK.

### 3. Traçabilité

Chaque génération enregistre **les documents et segments utilisés** (`ai_generations.source_document_ids`). On peut donc répondre à : « d'où vient ce contenu ? » — exigence de traçabilité Qualiopi (ADR 0006) et de conformité (ADR 0011).

### 4. Sécurité — non négociable

Les documents sont **des données, jamais des instructions** (ADR 0010) :

- Hiérarchie d'instructions explicite ; le contenu récupéré est déclaré **inerte**.
- Délimitation stricte des segments injectés.
- **Scope obligatoire** : la recherche ne peut retourner que des segments de l'organisation du demandeur (`OrgScope`).
- Validation de sortie par schéma Zod.
- Aucune écriture directe en base depuis l'IA.
- Journalisation des ingestions et des récupérations.

### 5. Cycle de vie

- Statut par document : `EN_ATTENTE` → `INDEXE` → `ERREUR`.
- Suppression d'un document → suppression de ses segments **et** des vecteurs.
- Limites de taille et de nombre par organisation (protection des ressources).

## Conséquences

### Positives
- Rend le content prompting REWORK **réellement exploitable** sur des documents volumineux.
- Améliore fortement la qualité et la contextualisation des contenus générés.
- La traçabilité des sources est un atout commercial (Qualiopi) et de confiance.
- pgvector est open-source : cohérent avec le « zero vendor lock-in ».

### Négatives / coûts
- **Nouvelle brique technique** : pipeline d'ingestion, extraction, découpage, vectorisation.
- **Coût de vectorisation** : consomme des crédits IA (famille d'embeddings) — à intégrer à la tarification.
- **Risque de sécurité accru** : chaque document ingéré est une entrée non fiable. Mitigé par ADR 0010, mais le risque ne disparaît pas.
- **Complexité de l'héritage** : les règles de priorité doivent être comprises par les formateurs (enjeu d'ergonomie).
- Stockage et indexation à dimensionner (phase 25).

## Alternatives écartées

| Alternative | Raison du rejet |
|---|---|
| **Injecter le document entier dans le prompt** | Dépasse la fenêtre de contexte ; contraire à la recommandation REWORK de cibler |
| **Attachement au niveau leçon uniquement** | Ne répond pas aux 3 niveaux exigés ; duplication massive |
| **Recherche par mots-clés seule** | Insuffisante sur des documents hétérogènes (PDF, slides) |
| **Base vectorielle externe (Pinecone, etc.)** | Dépendance tierce payante ; contraire à l'agnosticité. pgvector suffit |
| **Ne pas tracer les sources** | Perte de l'atout Qualiopi et impossibilité d'audit |

## Références

- `@.kiro/specs/katalyst/requirements.md` domaine `DOC`
- `@.kiro/specs/katalyst/design.md` §23
- `@.kiro/specs/katalyst/tasks.md` phase 16
- `@.kiro/specs/katalyst/adr/0010-defense-prompt-injection.md`
- `@.kiro/steering/rework-methodology.md` §3 (content prompting)
