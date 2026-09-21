# ADR 0010 — Défenses contre l'injection de prompt

- **Statut** : accepté
- **Date** : 2026-09-21
- **Phases concernées** : 16, 17

## Contexte

Katalyst expose l'IA à des entrées **non fiables par conception** :

1. **Content prompting** — la méthodologie REWORK recommande explicitement de fournir des documents (PDF, textes) comme base de génération. Ces documents viennent de tiers.
2. **Le studio de génération** (phase 16) accepte les prompts libres des formateurs.
3. **L'aide contextuelle** (`contextual-helper-flow`) reçoit le contenu de la leçon et l'état de l'apprenant.
4. **Les documents importés** par un institut peuvent provenir de ses propres clients.

Or une **injection de prompt** se produit quand du contenu traité comme une *donnée* est interprété par le modèle comme une *instruction*. Dans une plateforme multi-tenant (ADR 0007), la conséquence est aggravée : un document piégé pourrait tenter d'exfiltrer des données d'une autre organisation, de produire du contenu trompeur, ou de détourner la génération.

L'utilisateur demande explicitement des « mesures contre le prompt-injection ».

## Décision

Appliquer une défense **en profondeur**, à sept niveaux. Aucun niveau n'est suffisant seul.

### 1. Hiérarchie d'instructions explicite
Le prompt système établit une **priorité non négociable** : instructions système > instructions utilisateur > **contenu fourni (jamais des instructions)**. Le contenu importé est déclaré comme *donnée inerte*.

### 2. Délimitation stricte
Tout contenu non fiable est encadré par des délimiteurs explicites et échappé. Le modèle est instruit de ne jamais exécuter ce qui se trouve dans la zone de données.

### 3. Validation de sortie par schéma
**Toute** sortie IA est validée par un schéma **Zod** (déjà la source unique des contrats). Une sortie non conforme au schéma attendu est **rejetée**, jamais rendue. Cela bloque les détournements de format.

### 4. Aucune exécution directe
La sortie IA **n'est jamais exécutée ni écrite directement en base**. Elle passe par : aperçu → **édition humaine** → acceptation (déjà prévu : REQ-AIC-06). L'IA n'a **aucun** privilège d'écriture.

### 5. Moindre privilège côté outils
Si des outils/function calling sont utilisés, chaque outil est **limité au périmètre de l'organisation** et à une liste blanche. Aucun outil ne peut lire hors du scope (`OrgScope`).

### 6. Détection et journalisation
Les motifs d'injection connus sont détectés et **journalisés** (tentatives, source, organisation). Un pic de tentatives déclenche une alerte. Les interactions IA sont conservées pour audit (SOC 2).

### 7. Limitation et provenance
Limitation de débit sur la génération (déjà prévu par les crédits). **Marquage de provenance** : tout contenu généré porte une mention de transparence (REQ-AIC-07, AI Act), et l'origine des documents importés est tracée.

## Conséquences

### Positives
- Réduit fortement la surface d'attaque d'une plateforme qui **doit** ingérer des documents tiers.
- La validation par schéma est déjà structurelle (Zod partout) — coût marginal faible.
- L'absence de privilège d'écriture pour l'IA rend l'impact maximal d'une injection **non destructif**.
- La journalisation sert à la fois la sécurité et la conformité (SOC 2).

### Négatives / coûts
- La défense par délimitation **réduit la souplesse** des prompts : certains cas légitimes seront refusés.
- Faux positifs possibles sur la détection de motifs → nécessite un réglage.
- La validation stricte de sortie peut rejeter des réponses valides mais de forme inattendue → prévoir des messages d'erreur clairs.
- Coût en tokens légèrement supérieur (instructions de sécurité dans chaque prompt).

## Ce que cette décision ne prétend pas faire

L'injection de prompt **n'est pas un problème résolu** dans l'état de l'art. Cette décision **réduit** le risque et le **rend non destructif** ; elle ne le supprime pas. Toute évolution du studio devra réévaluer ces défenses.

## Alternatives écartées

| Alternative | Raison du rejet |
|---|---|
| **Faire confiance au modèle** | Une injection réussie en multi-tenant = fuite inter-organisations |
| **Bloquer l'import de documents** | Détruirait la méthode REWORK (content prompting) |
| **Filtrer par expressions régulières seules** | Contournable trivialement ; insuffisant seul |
| **Donner à l'IA un accès direct en écriture** | Aggraverait l'impact d'une injection — refusé |

## Références

- `@.kiro/specs/katalyst/requirements.md` domaine `PINJ`
- `@.kiro/specs/katalyst/design.md` §21
- `@.kiro/specs/katalyst/tasks.md` phase 17
- `@.kiro/specs/katalyst/adr/0009-api-centrale-securite.md`
