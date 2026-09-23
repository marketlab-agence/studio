'use client';

import { StepByStepRunner } from '@/components/interactive/primitives/StepByStepRunner';
import { CaseDiagnosis } from '@/components/interactive/primitives/CaseDiagnosis';
import { CompareContrast } from '@/components/interactive/primitives/CompareContrast';
import { SortingGame } from '@/components/interactive/primitives/SortingGame';
import { MatchingPairs } from '@/components/interactive/primitives/MatchingPairs';
import { DecisionScenario } from '@/components/interactive/primitives/DecisionScenario';
import { GuidedProcedure } from '@/components/interactive/primitives/GuidedProcedure';
import { BuilderCanvas } from '@/components/interactive/primitives/BuilderCanvas';
import { DraftCoach } from '@/components/interactive/primitives/DraftCoach';

/**
 * Configurations Git des primitives pédagogiques (étape 16).
 *
 * ⚠️ **Ce fichier contient des DONNÉES, pas des composants de domaine.** Chaque export est une
 * **configuration** : les données Git branchées sur une primitive générique.
 *
 * ⚠️ **Pourquoi cette approche et non « réparer » chaque placeholder.**
 * Les 12 placeholders Git (`GitDoctorTool`, `MergeSimulator`, `WorkflowDesigner`…) étaient des
 * coquilles : interface sans interaction, donc **aucune trace** — l'indicateur 19 du RNQ n'était
 * pas satisfait. Les réparer un par un aurait produit 12 composants Git-spécifiques, à
 * réécrire le jour où l'on ajoute n8n ou Docker.
 *
 * Ici, **chaque configuration réutilise une primitive** : le socle reste générique, et le
 * contenu Git n'est que des données. La règle d'admissibilité
 * (`@docs/katalyst/primitives-pedagogiques.md`) est respectée : la **structure** se transpose,
 * seul le **sujet** change.
 *
 * ⚠️ **Ce fichier porte le « test de validité » du socle** (étape 14). Si une configuration ne
 * peut pas s'exprimer avec les primitives existantes, c'est le **socle** qui est à revoir.
 */

interface ConfigurationProps {
  lessonId?: string;
}

// --- 1. GitDoctorTool → CaseDiagnosis ----------------------------------------

/**
 * `GitDoctorTool` : diagnostiquer un dépôt en état anormal.
 * Primitive : `CaseDiagnosis` (Analyser) — la démarche compte autant que la conclusion.
 */
export function GitDoctorTool({ lessonId = 'unknown' }: ConfigurationProps) {
  return (
    <CaseDiagnosis
      lessonId={lessonId}
      title="Diagnostiquer un dépôt Git en difficulté"
      description="Examine les indices, écarte les leurres, puis identifie la cause la plus probable."
      situation="Un collègue te transmet un dépôt sur lequel il ne peut plus travailler. Les commandes habituelles échouent et il ne comprend pas pourquoi. Tu disposes des observations ci-dessous."
      clues={[
        {
          id: 'detached',
          label: '`git status` affiche « HEAD detached at a1b2c3d »',
          relevant: true,
          significance: 'Tu n’es plus sur une branche : les commits créés ici seront perdus.',
        },
        {
          id: 'diverged',
          label: '`git status` indique « Your branch and origin/main have diverged »',
          relevant: false,
          significance: 'Une divergence est normale après quelques commits locaux.',
        },
        {
          id: 'no-branch',
          label: '`git branch` n’affiche aucune branche marquée d’une étoile',
          relevant: true,
          significance: 'Confirme l’état détaché : aucun commit ne sera rattaché à une branche.',
        },
        {
          id: 'wifi',
          label: 'La connexion Wi-Fi du poste a été instable ce matin',
          relevant: false,
          significance: 'Sans rapport avec un état de dépôt local.',
        },
      ]}
      causes={[
        { id: 'detached-head', label: 'La tête est détachée (detached HEAD)' },
        { id: 'corrupt', label: 'Le dépôt est corrompu et doit être recloné' },
        { id: 'permissions', label: 'Des droits d’écriture manquent sur le dossier' },
      ]}
      correctCauseId="detached-head"
    />
  );
}

// --- 2. GitRepositoryPlayground → BuilderCanvas -------------------------------

/**
 * `GitRepositoryPlayground` : construire un dépôt de A à Z.
 * Primitive : `BuilderCanvas` (Créer) — l'apprenant **produit**, il ne choisit pas.
 */
export function GitRepositoryPlayground({ lessonId = 'unknown' }: ConfigurationProps) {
  return (
    <BuilderCanvas
      lessonId={lessonId}
      title="Construire un dépôt Git de bout en bout"
      description="Crée un dépôt pour un projet et documente chaque étape : ta production est conservée comme trace."
      sections={[
        {
          id: 'project',
          label: 'Nom du projet',
          placeholder: 'mon-projet',
          required: true,
        },
        {
          id: 'init',
          label: 'Commande d’initialisation',
          prompt: 'Quelle commande crée le dépôt local et pourquoi est-elle suffisante ?',
          placeholder: 'git init — …',
          required: true,
        },
        {
          id: 'ignore',
          label: 'Fichiers à exclure du suivi',
          prompt: 'Que places-tu dans `.gitignore` et pourquoi ? Un fichier ignoré en trop peut casser la collaboration.',
          required: true,
        },
        {
          id: 'first-commit',
          label: 'Préparation du premier commit',
          prompt: 'Comment t’assures-tu que le premier commit ne contient que ce qui doit y être ?',
          required: true,
        },
        {
          id: 'remote',
          label: 'Liaison au dépôt distant',
          prompt: 'Explique la différence entre créer un dépôt distant et y publier tes commits.',
        },
      ]}
      repeatable={{ label: 'Fichier sous suivi', max: 6 }}
    />
  );
}

// --- 3. MergeSimulator (reconfigure) → CompareContrast ------------------------

/**
 * `MergeSimulator` : choisir une stratégie de fusion.
 * Primitive : `CompareContrast` (Analyser) — comparer deux stratégies selon des critères.
 */
export function MergeStrategyComparison({ lessonId = 'unknown' }: ConfigurationProps) {
  return (
    <CompareContrast
      lessonId={lessonId}
      title="Fast-forward ou merge commit : quelle stratégie ?"
      description="Compare les deux approches selon chaque critère, puis conclus sur un cas concret."
      optionA={{
        id: 'ff',
        label: 'Fast-forward',
        description: 'L’historique reste linéaire : HEAD avance simplement.',
      }}
      optionB={{
        id: 'merge-commit',
        label: 'Merge commit',
        description: 'Un commit de fusion est créé et matérialise le regroupement.',
      }}
      criteria={[
        {
          id: 'history',
          label: 'Lisibilité de l’historique',
          guidance: 'Que voit-on en parcourant `git log` dans chaque cas ?',
        },
        {
          id: 'traceability',
          label: 'Traçabilité du travail',
          guidance: 'Peut-on identifier qu’une branche a existé et ce qu’elle apportait ?',
        },
        {
          id: 'revert',
          label: 'Réversibilité',
          guidance: 'Qu’est-ce qui est le plus simple à annuler d’un bloc ?',
        },
        {
          id: 'team',
          label: 'Effet sur un travail d’équipe',
          guidance: 'Que se passe-t-il si plusieurs personnes travaillent en parallèle ?',
        },
      ]}
      expectedConclusion="Le fast-forward garde un historique linéaire mais efface la trace de la branche ; le merge commit conserve le regroupement, donc la traçabilité — au prix d’un historique plus ramifié."
    />
  );
}

// --- 4. UndoCommandComparison → CompareContrast -------------------------------

/**
 * `UndoCommandComparison` : choisir la bonne commande d'annulation.
 * Primitive : `CompareContrast` (Analyser) — trois commandes, un cas à trancher.
 */
export function UndoCommandComparison({ lessonId = 'unknown' }: ConfigurationProps) {
  return (
    <CompareContrast
      lessonId={lessonId}
      title="Annuler un changement : quelle commande ?"
      description="Compare `revert`, `reset` et `restore` avant de choisir."
      optionA={{ id: 'revert', label: 'git revert', description: 'Crée un commit qui annule un commit précédent.' }}
      optionB={{ id: 'reset', label: 'git reset', description: 'Déplace HEAD et peut réécrire l’historique.' }}
      criteria={[
        { id: 'shared', label: 'Danger sur un historique partagé', guidance: 'Que voient les collègues après l’opération ?' },
        { id: 'scope', label: 'Portée de l’annulation', guidance: 'Annule-t-on un commit, une mise en scène, ou un fichier ?' },
        { id: 'recovery', label: 'Possibilité de revenir en arrière', guidance: 'L’opération est-elle réversible en cas d’erreur ?' },
      ]}
      expectedConclusion="Sur un historique partagé, `revert` est le seul choix sûr : il ajoute un commit au lieu de réécrire l’historique. `reset` ne convient qu’en local, avant publication."
    />
  );
}

// --- 5. ForkVsCloneDemo → CompareContrast -------------------------------------

/**
 * `ForkVsCloneDemo` : distinguer fork et clone.
 * Primitive : `CompareContrast` (Comprendre/Analyser) — deux notions souvent confondues.
 */
export function ForkVsCloneDemo({ lessonId = 'unknown' }: ConfigurationProps) {
  return (
    <CompareContrast
      lessonId={lessonId}
      title="Fork ou clone : quelle différence ?"
      description="Deux opérations qui copient un dépôt, mais avec des liens très différents à l’origine."
      optionA={{ id: 'fork', label: 'Fork', description: 'Opération côté serveur : crée une copie sous ton compte.' }}
      optionB={{ id: 'clone', label: 'Clone', description: 'Opération locale : copie le dépôt sur ta machine.' }}
      criteria={[
        { id: 'location', label: 'Où la copie existe-t-elle ?', guidance: 'Sur un serveur, ou sur ton disque ?' },
        { id: 'link', label: 'Lien avec le dépôt d’origine', guidance: 'Peut-on encore recevoir les mises à jour d’origine ?' },
        { id: 'contribution', label: 'Comment proposer ses changements ?', guidance: 'Quel chemin passe par une Pull Request ?' },
      ]}
      expectedConclusion="Un fork vit sur le serveur et rompt le lien d’écriture avec l’origine (d’où la Pull Request) ; un clone vit en local et reste relié à l’origine par `origin`."
    />
  );
}

// --- 6. TrunkBasedDevelopmentVisualizer → CompareContrast ---------------------

/**
 * `TrunkBasedDevelopmentVisualizer` : comparer deux modèles de branches.
 * Primitive : `CompareContrast` (Analyser).
 */
export function TrunkBasedDevelopmentVisualizer({ lessonId = 'unknown' }: ConfigurationProps) {
  return (
    <CompareContrast
      lessonId={lessonId}
      title="Trunk-based ou GitFlow ?"
      description="Deux organisations du travail, pour un même objectif : livrer sans casser."
      optionA={{
        id: 'trunk',
        label: 'Trunk-based development',
        description: 'Une branche principale, des branches très courtes, intégration fréquente.',
      }}
      optionB={{
        id: 'gitflow',
        label: 'GitFlow',
        description: 'Plusieurs branches durables : develop, release, hotfix.',
      }}
      criteria={[
        { id: 'frequency', label: 'Fréquence d’intégration', guidance: 'À quelle cadence le travail rejoint-il la branche principale ?' },
        { id: 'risk', label: 'Risque de conflit', guidance: 'Qu’est-ce qui fait diverger longtemps des branches ?' },
        { id: 'release', label: 'Gestion des versions', guidance: 'Comment prépare-t-on une livraison dans chaque modèle ?' },
        { id: 'team-size', label: 'Adaptation à la taille de l’équipe', guidance: 'Quel modèle convient à une petite équipe ? à une grande ?' },
      ]}
      expectedConclusion="Le trunk-based réduit le risque de conflit par l’intégration fréquente ; GitFlow structure les livraisons au prix de branches durables, donc de fusions plus lourdes."
    />
  );
}

// --- 7. ReflogExplorer → StepByStepRunner ------------------------------------

/**
 * `ReflogExplorer` : retrouver un commit perdu.
 * Primitive : `StepByStepRunner` (Appliquer) — une procédure de récupération.
 */
export function ReflogExplorer({ lessonId = 'unknown' }: ConfigurationProps) {
  return (
    <StepByStepRunner
      lessonId={lessonId}
      title="Retrouver un commit perdu"
      description="Procédure de récupération après un `reset` malencontreux. Le reflog conserve ce que `git log` ne montre plus."
      steps={[
        {
          id: 'reflog',
          instruction: 'Afficher l’historique des déplacements de HEAD',
          expected: 'git reflog',
          hint: 'C’est le journal des « où était HEAD » — utile quand `git log` n’affiche plus rien.',
          explanation:
            'Le reflog est un **journal local** : il enregistre chaque déplacement de HEAD pendant 90 jours. C’est le filet de sécurité de Git.',
        },
        {
          id: 'identify',
          instruction: 'Repérer dans la liste la ligne correspondant à l’état d’avant la perte',
          hint: 'Cherche une entrée antérieure à l’opération malheureuse.',
          explanation:
            'On identifie le commit par son **préfixe court** — les 7 premiers caractères suffisent à le désigner.',
        },
        {
          id: 'restore',
          instruction: 'Revenir à ce commit en créant une branche pour ne pas le reperdre',
          expected: 'git branch',
          hint: 'Une branche stabilise le commit : sans elle, il reste « flottant ».',
          explanation:
            'Créer une branche sur le commit retrouvé est la **bonne pratique** : on sécurise avant tout autre geste.',
        },
      ]}
      completionMessage="Le commit est retrouvé et sécurisé par une branche."
    />
  );
}

// --- 8. ResolutionGuide → GuidedProcedure ------------------------------------

/**
 * `ResolutionGuide` : checklist de résolution de conflit.
 * Primitive : `GuidedProcedure` (Appliquer) — des vérifications ordonnées, sans réponse à saisir.
 */
export function ResolutionGuide({ lessonId = 'unknown' }: ConfigurationProps) {
  return (
    <GuidedProcedure
      lessonId={lessonId}
      title="Résoudre un conflit de fusion"
      description="Procédure de vérification, étape par étape. Aucune étape ne peut être sautée."
      checkpoints={[
        { id: 'identify', label: 'Identifier les fichiers en conflit', detail: '`git status` les liste sous « Unmerged paths ».' },
        {
          id: 'understand',
          label: 'Comprendre les deux versions en présence',
          detail: 'Les marqueurs `<<<<<<<`, `=======`, `>>>>>>>` délimitent les deux côtés.',
          requiresInput: true,
        },
        { id: 'choose', label: 'Choisir le contenu à conserver', detail: 'Conserver un côté, l’autre, ou combiner les deux — selon l’intention, pas selon la facilité.' },
        { id: 'clean', label: 'Supprimer TOUS les marqueurs de conflit', detail: 'Un marqueur oublié casse le code silencieusement.' },
        { id: 'stage', label: 'Indexer les fichiers résolus', detail: 'C’est cette étape qui déclare le conflit résolu.' },
        { id: 'verify', label: 'Vérifier que le projet fonctionne encore', detail: 'Une fusion correcte syntaxiquement peut être fonctionnellement fausse.' },
        { id: 'commit', label: 'Finaliser la fusion', detail: 'Le message de commit doit expliquer ce qui a été tranché, et pourquoi.' },
      ]}
    />
  );
}

// --- 9. PullRequestCreator → DraftCoach --------------------------------------

/**
 * `PullRequestCreator` : rédiger une Pull Request.
 * Primitive : `DraftCoach` (Créer) — écrire, relire selon des critères, réviser.
 */
export function PullRequestCreator({ lessonId = 'unknown' }: ConfigurationProps) {
  return (
    <DraftCoach
      lessonId={lessonId}
      title="Rédiger une Pull Request utile"
      description="Une PR n’est pas un formulaire : c’est un message à destination d’un relecteur pressé."
      prompt="Rédige la description d’une Pull Request qui ajoute la validation des adresses email au formulaire d’inscription. Ton relecteur ne connaît pas ton contexte : il doit comprendre ce qui change et pourquoi, sans ouvrir le diff."
      example="« Contexte : les adresses mal formées passaient la validation et créaient des comptes inutilisables. »"
      criteria={[
        { id: 'why', label: 'Le pourquoi est expliqué', guidance: 'Un relecteur doit savoir quel problème est résolu, pas seulement ce qui a changé.', pattern: 'problème' },
        { id: 'what', label: 'Le changement est décrit sans jargon inutile', guidance: 'Évite « refacto divers » : nomme les fichiers ou comportements touchés.' },
        { id: 'test', label: 'La vérification est mentionnée', guidance: 'Comment as-tu vérifié que ça fonctionne ? Un test, une manipulation manuelle ?', pattern: 'test' },
        { id: 'scope', label: 'Le périmètre est borné', guidance: 'Signale ce que la PR ne fait PAS, pour éviter les attentes déçues.' },
      ]}
      minLength={120}
    />
  );
}

// --- 10. CollaborationSimulator → DecisionScenario ---------------------------

/**
 * `CollaborationSimulator` : arbitrer une situation d'équipe.
 * Primitive : `DecisionScenario` (Évaluer) — plusieurs choix défendables.
 */
export function CollaborationSimulator({ lessonId = 'unknown' }: ConfigurationProps) {
  return (
    <DecisionScenario
      lessonId={lessonId}
      title="Arbitrer un conflit de collaboration"
      description="Deux personnes modifient le même fichier en parallèle. Que fais-tu ?"
      scenario="Deux développeurs ont travaillé trois semaines sur des branches séparées touchant le même module. La fusion produit 40 conflits. Les deux sont convaincus que leur approche est la bonne, et l’équipe doit livrer dans deux jours."
      options={[
        {
          id: 'merge-lot',
          label: 'Fusionner tout, résoudre les 40 conflits maintenant',
          pros: ['Livraison dans les délais', 'Aucun travail jeté'],
          cons: ['Risque élevé d’erreur de fusion', 'Relecture impossible en deux jours'],
          quality: 'poor',
          feedback:
            'Résoudre 40 conflits sous pression produit des régressions silencieuses : on tranche vite, donc mal. Le délai est tenu, mais la qualité ne l’est pas.',
        },
        {
          id: 'split',
          label: 'Découper en fusions intermédiaires et livrer une partie',
          pros: ['Chaque fusion reste relisible', 'Le risque est contenu et vérifiable'],
          cons: ['Ne livre pas tout', 'Demande d’expliquer le report'],
          quality: 'best',
          feedback:
            'Découper traite la cause (des branches trop longues) plutôt que le symptôme. C’est le seul choix qui préserve la lisibilité **et** permet de livrer quelque chose de vérifié.',
        },
        {
          id: 'choose-one',
          label: 'Retenir une seule branche et abandonner l’autre',
          pros: ['Fusion immédiate', 'Historique simple'],
          cons: ['Trois semaines de travail perdues', 'Décision prise sans critère technique'],
          quality: 'poor',
          feedback:
            'Jeter du travail sans évaluation technique transforme un problème d’organisation en conflit humain. Le coût est immédiat et difficile à rattraper.',
        },
      ]}
      minJustificationLength={80}
    />
  );
}

// --- 11. WorkflowDesigner → BuilderCanvas ------------------------------------

/**
 * `WorkflowDesigner` : concevoir un flux de branches.
 * Primitive : `BuilderCanvas` (Créer) — l'apprenant produit et documente.
 */
export function WorkflowDesigner({ lessonId = 'unknown' }: ConfigurationProps) {
  return (
    <BuilderCanvas
      lessonId={lessonId}
      title="Concevoir un flux de branches pour une équipe"
      description="Décris l’organisation des branches que tu mettrais en place, et justifie chaque choix."
      sections={[
        {
          id: 'context',
          label: 'Contexte de l’équipe',
          prompt: 'Taille de l’équipe, fréquence de livraison, contraintes (production continue, versions multiples…).',
          required: true,
        },
        {
          id: 'main',
          label: 'Rôle de la branche principale',
          prompt: 'Que contient-elle, et à quel moment reçoit-elle du code ?',
          required: true,
        },
        {
          id: 'working',
          label: 'Branches de travail',
          prompt: 'Durée de vie attendue, convention de nommage, et comment on les intègre.',
          required: true,
        },
        {
          id: 'release',
          label: 'Préparation des livraisons',
          prompt: 'Comment prépare-t-on et fige-t-on une version ? (laisse vide si ta stratégie n’en a pas)',
        },
        {
          id: 'safety',
          label: 'Que se passe-t-il en cas de bug critique en production ?',
          prompt: 'La procédure de correction d’urgence doit être décidée AVANT l’incident.',
          required: true,
        },
      ]}
      repeatable={{ label: 'Type de branche', max: 5 }}
    />
  );
}

// --- 12. ConflictVisualizer → SortingGame ------------------------------------

/**
 * `ConflictVisualizer` : trier les éléments d'un conflit.
 * Primitive : `SortingGame` (Comprendre) — classer par rôle.
 */
export function ConflictVisualizer({ lessonId = 'unknown' }: ConfigurationProps) {
  return (
    <SortingGame
      lessonId={lessonId}
      title="Les éléments d’un conflit de fusion"
      description="Classe chaque élément selon sa fonction dans la résolution."
      categories={[
        {
          id: 'ours',
          label: 'Version de la branche courante',
          explanation: 'Le contenu entre `<<<<<<< HEAD` et `=======`.',
        },
        {
          id: 'theirs',
          label: 'Version de la branche entrante',
          explanation: 'Le contenu entre `=======` et `>>>>>>>`.',
        },
        {
          id: 'resolved',
          label: 'Étape de résolution',
          explanation: 'Ce qu’on fait pour sortir du conflit.',
        },
      ]}
      items={[
        { id: 'head-marker', label: 'Marqueur `<<<<<<< HEAD`', categoryId: 'ours', hint: 'Il ouvre la version de ta branche.' },
        { id: 'theirs-marker', label: 'Marqueur `>>>>>>>`', categoryId: 'theirs', hint: 'Il ferme la version entrante.' },
        { id: 'separator', label: 'Marqueur `=======`', categoryId: 'ours', hint: 'Il sépare les deux versions.' },
        { id: 'git-add', label: '`git add` sur le fichier résolu', categoryId: 'resolved', hint: 'C’est le geste qui déclare le conflit résolu.' },
        { id: 'verify', label: 'Vérifier que le projet compile', categoryId: 'resolved', hint: 'Avant de finaliser, on s’assure que rien n’a cassé.' },
      ]}
    />
  );
}

// --- 13. GitTimeTravel → MatchingPairs ---------------------------------------

/**
 * `GitTimeTravel` : associer une commande à son effet sur l'historique.
 * Primitive : `MatchingPairs` (Comprendre) — relier deux représentations.
 */
export function GitTimeTravel({ lessonId = 'unknown' }: ConfigurationProps) {
  return (
    <MatchingPairs
      lessonId={lessonId}
      title="Explorer l’historique : chaque commande et son effet"
      description="Associe chaque commande à ce qu’elle permet d’observer."
      pairs={[
        {
          id: 'log',
          left: '`git log`',
          right: 'L’historique complet des commits',
          explanation: 'Affiche la chaîne des commits, du plus récent au plus ancien.',
        },
        {
          id: 'show',
          left: '`git show <commit>`',
          right: 'Le détail d’un commit précis',
          explanation: 'Montre le message, l’auteur et les modifications apportées.',
        },
        {
          id: 'blame',
          left: '`git blame`',
          right: 'L’auteur de chaque ligne d’un fichier',
          explanation: 'Attribue chaque ligne au commit qui l’a introduite — utile pour comprendre un changement.',
        },
        {
          id: 'diff',
          left: '`git diff`',
          right: 'Les différences non encore indexées',
          explanation: 'Compare le répertoire de travail à l’index : ce que tu viens de modifier.',
        },
        {
          id: 'reflog',
          left: '`git reflog`',
          right: 'Les déplacements de HEAD, même sur des commits perdus',
          explanation: 'Journal local : le filet de sécurité après un `reset` malencontreux.',
        },
      ]}
    />
  );
}

// --- 14. StagingAreaVisualizer (reconfigure) → SortingGame --------------------

/**
 * `StagingAreaVisualizer` : trier les états d'un fichier dans le flux Git.
 * Primitive : `SortingGame` (Comprendre) — les trois zones de Git.
 */
export function StagingAreaVisualizer({ lessonId = 'unknown' }: ConfigurationProps) {
  return (
    <SortingGame
      lessonId={lessonId}
      title="Les trois zones de Git"
      description="Classe chaque état à la zone correspondante. C’est la confusion la plus fréquente chez les débutants."
      categories={[
        { id: 'working', label: 'Répertoire de travail', explanation: 'Ce que tu vois dans tes fichiers.' },
        { id: 'staging', label: 'Index (staging)', explanation: 'Ce qui partira dans le prochain commit.' },
        { id: 'history', label: 'Historique', explanation: 'Ce qui est enregistré de façon permanente.' },
      ]}
      items={[
        { id: 'modified', label: 'Un fichier que tu viens de modifier', categoryId: 'working', hint: 'La modification n’est pas encore signalée à Git.' },
        { id: 'added', label: 'Un fichier après `git add`', categoryId: 'staging', hint: 'Il est prêt, mais pas encore enregistré.' },
        { id: 'committed', label: 'Un fichier après `git commit`', categoryId: 'history', hint: 'Il fait partie de l’histoire du projet.' },
        { id: 'untracked', label: 'Un fichier jamais signalé à Git', categoryId: 'working', hint: 'Git ignore encore son existence.' },
      ]}
    />
  );
}
