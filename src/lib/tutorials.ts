
import type { Tutorial } from '@/types/tutorial.types';
import { StagingAreaVisualizer } from '@/components/specialized/part-2/StagingAreaVisualizer';
import { VersioningDemo } from '@/components/specialized/part-1/VersioningDemo';
import { GitFlowDiagram } from '@/components/visualizations/GitGraph';
import { ConceptExplanation } from '@/components/tutorial/ConceptExplanation';
import { BranchCreator } from '@/components/interactive/BranchCreator';
import { MergeSimulator } from '@/components/interactive/MergeSimulator';
import { PushPullAnimator } from '@/components/specialized/part-4/PushPullAnimator';
import { ForkVsCloneDemo } from '@/components/specialized/part-5/ForkVsCloneDemo';
import { PRWorkflowSimulator } from '@/components/specialized/part-5/PRWorkflowSimulator';
import { ConflictVisualizer } from '@/components/specialized/part-7/ConflictVisualizer';
import { ResolutionGuide } from '@/components/specialized/part-7/ResolutionGuide';
import { ConflictPlayground } from '@/components/specialized/part-7/ConflictPlayground';
import { UndoCommandComparison } from '@/components/specialized/part-8/UndoCommandComparison';
import { TimelineNavigator } from '@/components/specialized/part-8/TimelineNavigator';
import { ReflogExplorer } from '@/components/specialized/part-8/ReflogExplorer';
import { GitHubInterfaceSimulator } from '@/components/specialized/part-9/GitHubInterfaceSimulator';
import { IssueTracker } from '@/components/specialized/part-9/IssueTracker';
import { ActionsWorkflowBuilder } from '@/components/specialized/part-9/ActionsWorkflowBuilder';
import { OpenSourceSimulator } from '@/components/specialized/part-10/OpenSourceSimulator';
import { ProjectDashboard } from '@/components/specialized/part-10/ProjectDashboard';
import { WorkflowComparisonTable } from '@/components/specialized/part-6/WorkflowComparisonTable';
import { WorkflowSimulator } from '@/components/specialized/part-6/WorkflowSimulator';
import { CommitMessageLinter } from '@/components/specialized/part-11/CommitMessageLinter';
import { GitignoreTester } from '@/components/specialized/part-11/GitignoreTester';
import { AliasCreator } from '@/components/specialized/part-11/AliasCreator';
import { SecurityScanner } from '@/components/specialized/part-11/SecurityScanner';
import { TrunkBasedDevelopmentVisualizer } from '@/components/specialized/part-6/TrunkBasedDevelopmentVisualizer';


export const TUTORIALS: Tutorial[] = [
  {
    id: 'intro-to-git',
    title: '1. Introduction à Git',
    description: 'Apprenez les bases de Git et comment démarrer un nouveau projet.',
    lessons: [
      {
        id: '1-1',
        title: 'Qu\'est-ce que le contrôle de version ?',
        objective: 'Comprendre pourquoi les systèmes de contrôle de version sont essentiels dans le développement logiciel moderne.',
        content: `
Le contrôle de version est un système qui enregistre les modifications d'un fichier ou d'un ensemble de fichiers au fil du temps, vous permettant de revenir à des versions spécifiques plus tard.

C'est comme avoir un historique complet et détaillé de chaque changement dans votre projet.

Avec un système de contrôle de version distribué (DVCS) comme **Git**, chaque développeur dispose d'une copie complète de l'historique du projet sur sa machine locale. Cela rend les opérations rapides et permet de travailler hors ligne.
        `,
        component: ConceptExplanation,
      },
      {
        id: '1-2',
        title: 'Le versioning en action',
        objective: 'Observer de manière interactive comment les versions sont créées et comment on peut naviguer entre elles.',
        content: `
Chaque "sauvegarde" dans Git est appelée un **commit**. Un commit est un instantané (snapshot) de votre projet à un moment donné.

Utilisez la démonstration ci-dessous pour voir ce concept en action :

1.  **Modifiez** le contenu du fichier.
2.  **Rédigez un message** qui décrit votre changement.
3.  **Créez un commit** pour sauvegarder cette nouvelle version.
4.  **Naviguez** entre les commits pour voir comment le contenu du fichier change.
        `,
        component: VersioningDemo,
      },
      {
        id: '1-3',
        title: 'Le flux de travail Git de base',
        objective: 'Comprendre les trois zones principales de Git et comment les fichiers se déplacent entre elles.',
        content: `Le flux de travail de base dans Git implique trois zones principales :

1.  **Le Répertoire de Travail (Working Directory)** : C'est votre dossier de projet local où vous modifiez les fichiers.
2.  **La Zone de Staging (Staging Area)** : C'est une zone intermédiaire où vous préparez les modifications que vous souhaitez inclure dans votre prochain commit. Cela vous permet de créer des commits précis et logiques.
3.  **Le Dépôt Local (Local Repository)** : C'est là que Git stocke de manière permanente l'historique de vos commits.

Le diagramme ci-dessous illustre comment les commandes Git déplacent les changements entre ces zones et le dépôt distant.`,
        component: GitFlowDiagram,
      },
       {
        id: '1-4',
        title: 'Initialiser un dépôt',
        objective: 'Apprendre à créer un nouveau dépôt Git pour un projet existant ou nouveau.',
        content: `Pour commencer à utiliser Git dans un projet, vous devez l'initialiser. Cela crée un "dépôt" Git.

Ouvrez un terminal, naviguez jusqu'au dossier de votre projet, et exécutez :

\`\`\`bash
git init
\`\`\`

Cette commande crée un sous-dossier caché nommé **.git**. C'est le cerveau de votre dépôt ; il contient toute la base de données de l'historique, les branches, et les configurations. Ne le supprimez jamais !`,
      },
    ],
  },
  {
    id: 'making-commits',
    title: '2. Enregistrer les modifications',
    description: 'Apprenez à sauvegarder votre travail en effectuant des "commits".',
    lessons: [
      {
        id: '2-1',
        title: 'Vérifier le statut du projet',
        objective: 'Utiliser `git status` pour comprendre l\'état actuel de votre répertoire de travail et de la zone de staging.',
        content: `La commande \`git status\` est votre meilleure amie. Elle est essentielle pour savoir où vous en êtes. Elle vous montre :

- Les fichiers qui ont été modifiés.
- Les nouveaux fichiers que Git ne suit pas encore (untracked).
- Les changements qui sont dans la zone de staging, prêts à être validés.

Utilisez-la tout le temps !

\`\`\`bash
git status
\`\`\``,
      },
      {
        id: '2-2',
        title: 'Ajouter des fichiers au Staging',
        objective: 'Maîtriser la commande `git add` pour préparer les fichiers pour le prochain commit.',
        content: `Avant de pouvoir créer un commit, vous devez dire à Git *quelles* modifications vous voulez inclure. C'est le rôle de la zone de staging.

Pour ajouter un fichier spécifique à la zone de staging :

\`\`\`bash
git add nom_du_fichier.txt
\`\`\`

Pour ajouter tous les fichiers modifiés et nouveaux dans le répertoire courant :

\`\`\`bash
git add .
\`\`\`

> **Attention :** Utiliser \`git add .\` est pratique mais assurez-vous de ne pas inclure de fichiers non désirés. Un bon usage du fichier \`.gitignore\` est recommandé.`,
        component: StagingAreaVisualizer
      },
      {
        id: '2-3',
        title: 'Valider les modifications (Commit)',
        objective: 'Créer un commit pour sauvegarder un instantané de la zone de staging dans l\'historique du projet.',
        content: `Un commit est un "instantané" de votre zone de staging à un instant T. Chaque commit a un identifiant unique (un hash SHA-1) et un message descriptif.

Il est crucial d'écrire de **bons messages de commit** : clairs, concis et décrivant le *pourquoi* du changement.

Pour créer un commit, utilisez la commande suivante. L'option \`-m\` permet d'écrire le message directement.

\`\`\`bash
git commit -m "Ajout de la fonctionnalité d'authentification"
\`\`\`

Si vous n'utilisez pas \`-m\`, Git ouvrira votre éditeur de texte par défaut pour que vous puissiez écrire un message plus détaillé.`,
      },
      {
        id: '2-4',
        title: 'Consulter l\'historique',
        objective: 'Apprendre à utiliser `git log` pour visualiser la liste des commits passés.',
        content: `Pour voir l'historique de tous vos commits, utilisez la commande \`git log\`. Elle affiche la liste des commits du plus récent au plus ancien.

\`\`\`bash
git log
\`\`\`

Pour une vue plus compacte et lisible, essayez ces options populaires :

\`\`\`bash
# Affiche chaque commit sur une seule ligne
git log --oneline

# Affiche un graphe des branches et des fusions
git log --graph --oneline --decorate --all
\`\`\``,
      },
    ],
  },
  {
    id: 'branching',
    title: '3. La puissance des branches',
    description: "Isolez votre travail et expérimentez en toute sécurité avec les branches.",
    lessons: [
      {
        id: '3-1',
        title: 'Que sont les branches ?',
        objective: 'Comprendre le concept de branche et son utilité dans un flux de travail de développement.',
        content: `Une branche dans Git est simplement un pointeur léger et mobile vers un de vos commits. La branche par défaut est nommée \`main\` (ou \`master\` dans les anciens projets).

Travailler avec des branches vous permet de développer des fonctionnalités, de corriger des bugs, ou d'expérimenter de nouvelles idées dans un espace isolé sans affecter la ligne principale de développement. C'est une des fonctionnalités les plus puissantes de Git.`,
      },
      {
        id: '3-2',
        title: 'Créer et Lister les branches',
        objective: 'Savoir créer une nouvelle branche et lister toutes les branches existantes.',
        content: `Pour créer une nouvelle branche, utilisez la commande \`git branch <nom-de-la-branche>\`. Cela crée la branche, mais ne vous déplace pas dessus.

\`\`\`bash
git branch feature-nouvelle-page
\`\`\`

Pour lister toutes les branches de votre dépôt local, exécutez simplement \`git branch\`. L'astérisque (*) indique la branche sur laquelle vous vous trouvez actuellement.

\`\`\`bash
git branch
\`\`\``,
        component: BranchCreator
      },
      {
        id: '3-3',
        title: 'Changer de branche',
        objective: 'Apprendre à naviguer entre les différentes branches d\'un projet.',
        content: `Pour commencer à travailler sur votre nouvelle branche, vous devez vous y déplacer. Utilisez \`git checkout <nom-de-la-branche>\` ou la commande plus moderne et recommandée \`git switch <nom-de-la-branche>\`.

\`\`\`bash
git switch feature-nouvelle-page
\`\`\`

> L'utilisation de \`git switch\` est préférée à \`git checkout\` pour changer de branche, car \`checkout\` est une commande plus ancienne qui a plusieurs responsabilités (changer de branche, restaurer des fichiers), ce qui peut prêter à confusion.`,
      },
      {
        id: '3-4',
        title: 'Créer et basculer en une commande',
        objective: 'Utiliser un raccourci pour créer une branche et s\'y déplacer immédiatement.',
        content: `Le cas le plus courant est de créer une nouvelle branche et de basculer immédiatement dessus. Vous pouvez le faire en une seule commande avec l'option \`-b\` de \`git checkout\` ou avec la commande \`git switch -c\`.

Avec \`switch\` (recommandé) :

\`\`\`bash
git switch -c correction-bug-affichage
\`\`\`

Avec \`checkout\` (plus ancien) :

\`\`\`bash
git checkout -b correction-bug-affichage
\`\`\``,
      },
      {
        id: '3-5',
        title: 'Fusionner des branches',
        objective: 'Apprendre à combiner le travail de différentes branches avec `git merge`.',
        content: `Une fois que le travail sur votre branche est terminé et testé, vous voudrez l'intégrer dans votre branche principale (généralement \`main\`). C'est ce qu'on appelle une fusion (merge).

Pour fusionner une branche, vous devez d'abord vous placer sur la branche qui va *recevoir* les changements, puis exécuter \`git merge\`.

\`\`\`bash
# 1. Revenir sur la branche principale
git switch main

# 2. Fusionner la branche de fonctionnalité dans main
git merge feature-nouvelle-page
\`\`\`

Git créera un nouveau "commit de fusion" qui intègre l'historique des deux branches.`,
        component: MergeSimulator
      }
    ],
  },
  {
    id: 'remote-repositories',
    title: '4. Dépôts Distants',
    description: 'Apprenez à collaborer en synchronisant votre travail avec un serveur distant comme GitHub.',
    lessons: [
      {
        id: '4-1',
        title: 'Cloner un dépôt existant',
        objective: 'Apprendre à obtenir une copie locale d\'un projet distant existant.',
        content: `Jusqu'à présent, nous avons travaillé uniquement en local. Pour collaborer, vous devez interagir avec des dépôts hébergés sur un serveur (comme GitHub, GitLab, etc.).

La première étape est souvent de "cloner" un dépôt existant. Cela crée une copie complète du projet, y compris tout l'historique, sur votre machine.

\`\`\`bash
# Syntaxe: git clone <URL_DU_DÉPÔT>
git clone https://github.com/facebook/react.git
\`\`\`

Lorsque vous clonez un dépôt, Git configure automatiquement une connexion au dépôt d'origine, qu'il nomme par défaut **origin**. C'est votre "dépôt distant".`
      },
      {
        id: '4-2',
        title: 'Envoyer les changements (Push)',
        objective: 'Savoir comment envoyer vos commits locaux vers le dépôt distant.',
        content: `Une fois que vous avez effectué des commits locaux, vous devez les "pousser" (push) vers le dépôt distant pour les partager avec d'autres.

La commande est \`git push <nom-du-distant> <nom-de-la-branche>\`.

\`\`\`bash
# Envoie les commits de votre branche 'main' locale vers la branche 'main' du distant 'origin'
git push origin main
\`\`\`

> La première fois que vous poussez une nouvelle branche, vous devrez peut-être utiliser \`git push -u origin <nom-de-la-branche>\` pour lier votre branche locale à la branche distante.`,
        component: PushPullAnimator
      },
      {
        id: '4-3',
        title: 'Récupérer les changements (Pull & Fetch)',
        objective: 'Comprendre comment mettre à jour votre dépôt local avec les changements provenant du distant.',
        content: `Si des collaborateurs ont poussé des changements, votre copie locale sera en retard. Vous devez la mettre à jour.

Il y a deux commandes principales pour cela :

- \`git fetch\`: Récupère toutes les nouveautés du distant mais **ne les fusionne pas** dans votre branche de travail. C'est une façon sûre de voir ce qui a changé.
- \`git pull\`: Est une combinaison de \`git fetch\` suivi d'un \`git merge\`. Il récupère les changements et les fusionne immédiatement dans votre branche actuelle.

\`\`\`bash
# Option 1: Récupérer et fusionner manuellement (plus de contrôle)
git fetch origin
git merge origin/main

# Option 2: Récupérer et fusionner automatiquement (plus simple)
git pull origin main
\`\`\``
      }
    ]
  },
  {
    id: 'collaboration',
    title: '5. Collaboration sur GitHub',
    description: 'Découvrez le flux de travail standard pour contribuer à des projets sur GitHub.',
    lessons: [
      {
        id: '5-1',
        title: 'Fork vs. Clone',
        objective: 'Comprendre la différence entre "forker" et "cloner" et quand utiliser chaque approche.',
        content: `**Cloner** crée une copie liée d'un dépôt sur lequel vous avez les droits d'écriture.

**Forker** crée une copie personnelle d'un dépôt appartenant à quelqu'un d'autre sur votre propre compte GitHub. C'est la première étape pour contribuer à un projet open source sur lequel vous n'avez pas les droits de pousser directement.

Le flux est le suivant :

1.  **Fork** le dépôt original sur GitHub.
2.  **Clone** votre fork sur votre machine locale.
3.  Travaillez, faites des commits, et **push** vers votre fork.
4.  Créez une **Pull Request** de votre fork vers le dépôt original.`,
        component: ForkVsCloneDemo
      },
      {
        id: '5-2',
        title: 'Les Pull Requests (PR)',
        objective: 'Apprendre à proposer des changements à un projet en utilisant les Pull Requests.',
        content: `Une Pull Request (ou MergeRequest sur d'autres plateformes) est une demande formelle d'intégrer vos changements (commits) d'une branche à une autre (généralement de votre branche de fonctionnalité vers la branche \`main\` du projet).

C'est le cœur du travail collaboratif sur GitHub. C'est un espace de discussion où vous pouvez :

- Décrire vos changements.
- Discuter de l'implémentation.
- Recevoir des commentaires et des revues de code.
- Voir les résultats des tests automatisés.`,
        component: PRWorkflowSimulator
      }
    ]
  },
  {
    id: 'workflows',
    title: '6. Workflows Git',
    description: 'Explorez différentes stratégies d\'organisation des branches pour des projets de toutes tailles.',
    lessons: [
      {
        id: '6-1',
        title: 'Comparer les Workflows',
        objective: 'Comprendre les avantages et inconvénients des principaux workflows Git.',
        content: `Il n'y a pas une seule "bonne" façon d'utiliser Git. Différents workflows conviennent à différents types de projets et d'équipes. Les plus connus sont :

- **GitFlow**: Très structuré, idéal pour les projets avec des cycles de release planifiés.
- **GitHub Flow**: Simple et basé sur les Pull Requests, parfait pour le déploiement continu.
- **Trunk-Based Development**: Tous les développeurs travaillent sur une seule branche principale, favorisant une intégration très rapide.

Le tableau ci-dessous les compare en détail.`,
        component: WorkflowComparisonTable
      },
      {
        id: '6-2',
        title: 'Simulation de GitFlow',
        objective: 'Visualiser le flux complexe mais puissant de GitFlow en action.',
        content: `GitFlow est un modèle de branchement robuste qui utilise plusieurs branches permanentes (\`main\` et \`develop\`) et des branches de support pour les fonctionnalités, les releases et les corrections urgentes.

- \`main\` contient le code de production stable.
- \`develop\` est la branche d'intégration pour les nouvelles fonctionnalités.
- Les branches \`feature/*\` partent de \`develop\` et y sont fusionnées.
- Les branches \`release/*\` préparent une nouvelle version de production.
- Les branches \`hotfix/*\` corrigent des bugs urgents. Elles partent de \`main\` et doivent être fusionnées à la fois dans \`main\` et dans \`develop\`.

Utilisez le simulateur ci-dessous pour voir comment les branches de features et de releases interagissent.`,
        component: WorkflowSimulator
      },
      {
        id: '6-3',
        title: 'Focus : Trunk-Based Development',
        objective: 'Comprendre le flux de travail minimaliste et rapide du Trunk-Based Development.',
        content: `À l'opposé de la complexité de GitFlow, le Trunk-Based Development (TBD) est une pratique où tous les développeurs intègrent leurs changements directement dans une seule branche principale, le "trunk" (tronc), généralement \`main\`.

Les caractéristiques clés sont :

- **Petits commits fréquents**: Les développeurs intègrent leur travail au moins une fois par jour.
- **Forte culture de tests**: Une suite de tests automatisés (CI) est essentielle pour s'assurer que le trunk reste toujours stable.
- **Feature Flags**: Pour les fonctionnalités plus importantes, on utilise des "feature flags" (ou "feature toggles") pour activer ou désactiver une fonctionnalité en production sans avoir besoin d'une branche séparée.

Ce workflow est très populaire dans les environnements de déploiement continu.`,
        component: TrunkBasedDevelopmentVisualizer
      }
    ]
  },
  {
    id: 'conflicts',
    title: '7. Gérer les Conflits',
    description: 'Apprenez à résoudre les inévitables conflits de fusion.',
    lessons: [
      {
        id: '7-1',
        title: 'Qu\'est-ce qu\'un conflit ?',
        objective: 'Comprendre ce qui cause un conflit de fusion.',
        content: `Un conflit de fusion survient lorsque vous essayez de fusionner deux branches qui ont modifié la même ligne dans le même fichier, et Git ne sait pas quelle version choisir.

Le visualiseur ci-dessous montre un scénario typique : les deux branches (\`main\` et \`feature\`) ont modifié le même fichier, ce qui empêche une fusion automatique.`,
        component: ConflictVisualizer
      },
      {
        id: '7-2',
        title: 'Guide de résolution',
        objective: 'Apprendre le processus pour résoudre manuellement un conflit de fusion.',
        content: `La résolution d'un conflit suit un processus systématique. Git vous aide en marquant clairement les zones de conflit dans vos fichiers. Le guide ci-dessous décompose chaque étape, de l'identification à la finalisation de la fusion.`,
        component: ResolutionGuide
      },
      {
        id: '7-3',
        title: 'Mise en pratique',
        objective: 'Résoudre un conflit de fusion dans un simulateur interactif.',
        content: `C'est à votre tour de jouer ! Le simulateur ci-dessous présente un fichier en état de conflit. Modifiez le code directement dans l'éditeur pour résoudre le conflit, puis vérifiez votre solution.`,
        component: ConflictPlayground
      }
    ]
  },
  {
    id: 'undoing-changes',
    title: '8. Annuler des Modifications',
    description: 'Découvrez comment revenir en arrière en toute sécurité avec Git.',
    lessons: [
      {
        id: '8-1',
        title: 'Annuler des modifications',
        objective: 'Comparer les différentes stratégies pour annuler des changements : `reset`, `revert` et `restore`.',
        content: `Git offre plusieurs outils pour revenir en arrière, chacun ayant un usage spécifique. Il est crucial de comprendre leurs différences pour ne pas perdre de travail.

- \`git checkout -- <fichier>\` : Annule les modifications dans le répertoire de travail qui n'ont pas encore été stagées.
- \`git reset HEAD <fichier>\` : Retire un fichier de la zone de staging, mais conserve les modifications dans le répertoire de travail.
- \`git reset <commit>\` : Déplace le pointeur de la branche actuelle vers un commit précédent, modifiant ainsi l'historique. C'est puissant mais potentiellement dangereux, surtout si les commits ont déjà été partagés.
- \`git revert <commit>\` : Crée un *nouveau* commit qui annule les changements introduits par un commit spécifique. C'est la manière la plus sûre d'annuler des changements dans un historique partagé, car elle ne réécrit pas le passé.`,
        component: UndoCommandComparison
      },
      {
        id: '8-2',
        title: 'Voyager dans le temps',
        objective: 'Utiliser un navigateur de timeline pour visualiser l\'état du projet à différents moments.',
        content: `Parfois, il est utile de se "déplacer" dans l'historique pour voir à quoi ressemblait le projet à un commit précis, sans pour autant annuler les changements. La commande \`git checkout <hash-du-commit>\` vous place dans un état "détaché" (detached HEAD), vous permettant d'explorer le passé.

Le navigateur ci-dessous simule ce voyage dans le temps. Déplacez le curseur pour voir les détails d'un commit et l'état des fichiers à ce moment-là.`,
        component: TimelineNavigator
      },
      {
        id: '8-3',
        title: 'Reflog : Votre filet de sécurité',
        objective: 'Découvrir la commande `reflog` pour retrouver des commits perdus.',
        content: `Avez-vous déjà pensé avoir perdu un commit pour toujours, par exemple après un \`git reset\` trop agressif ? Pas de panique ! Git garde une trace de presque tout ce que vous faites.

La commande \`git reflog\` (référence log) affiche un journal de tous les endroits où votre \`HEAD\` (le pointeur de votre état actuel) a été. C'est un outil de récupération incroyable.

Si vous avez perdu un commit, vous pouvez :

1. Exécuter \`git reflog\` pour trouver le hash du commit que vous voulez restaurer.
2. Utiliser \`git reset --hard HEAD@{2}\` pour y revenir.`,
        component: ReflogExplorer
      }
    ]
  },
  {
    id: 'github-features',
    title: '9. Fonctionnalités de GitHub',
    description: 'Explorez les outils qui font de GitHub une plateforme si puissante.',
    lessons: [
      {
        id: '9-1',
        title: 'Interface de GitHub',
        objective: 'Se familiariser avec l\'interface de GitHub pour les Pull Requests et les Issues.',
        content: `GitHub n'est pas seulement un hébergement pour votre code, c'est une plateforme complète pour la gestion de projet. Les deux fonctionnalités principales que vous utiliserez quotidiennement sont les **Issues** et les **Pull Requests**.

- **Issues** : Permettent de suivre les bugs, les demandes de fonctionnalités et d'autres tâches.
- **Pull Requests** : En plus d'être des demandes de fusion, ce sont des espaces de discussion et de revue de code.

Le simulateur ci-dessous vous donne un aperçu de cette interface.`,
        component: GitHubInterfaceSimulator
      },
      {
        id: '9-2',
        title: 'Suivi des Tâches avec les Issues',
        objective: 'Apprendre à créer et gérer des tâches avec le système d\'issues de GitHub.',
        content: `Une bonne gestion de projet commence par un bon suivi des tâches. Les issues de GitHub sont parfaites pour cela. Vous pouvez les utiliser pour signaler un bug, proposer une nouvelle idée, ou simplement organiser votre travail.

Une issue peut contenir :

- Un titre descriptif et un corps détaillé (avec du Markdown).
- Des étiquettes (labels) pour la catégorisation (ex: 'bug', 'feature', 'documentation').
- Des personnes assignées (assignees).
- Des jalons (milestones) pour regrouper les issues par objectif.`,
        component: IssueTracker
      },
      {
        id: '9-3',
        title: 'Automatisation avec GitHub Actions',
        objective: 'Découvrir le potentiel de l\'automatisation de votre flux de travail avec GitHub Actions.',
        content: `GitHub Actions est un outil d'intégration et de déploiement continu (CI/CD) incroyablement puissant, directement intégré à votre dépôt. Il vous permet d'automatiser des tâches en réponse à des événements survenant sur GitHub (comme un \`push\` ou la création d'une PR).

Vous pouvez l'utiliser pour :

- Lancer vos tests automatiquement à chaque commit.
- Compiler votre code.
- Déployer votre site web en production.
- Et bien plus encore !

Les workflows sont définis dans des fichiers YAML situés dans le dossier \`.github/workflows\` de votre projet.`,
        component: ActionsWorkflowBuilder
      }
    ]
  },
  {
    id: 'best-practices',
    title: '10. Bonnes Pratiques',
    description: 'Affinez vos compétences avec des astuces et des pratiques de pro.',
    lessons: [
      {
        id: '10-1',
        title: 'Écrire de bons messages de commit',
        objective: 'Apprendre la convention pour rédiger des messages de commit clairs et utiles.',
        content: `Un bon message de commit est aussi important que le code lui-même. Il doit être concis et explicatif. La convention la plus populaire est :

- **Sujet court (max 50 car.)**: Commence par une majuscule, utilise l'impératif (ex: "Ajoute" et non "Ajouté").
- **Corps optionnel**: Séparé du sujet par une ligne vide, il explique le *pourquoi* et le *comment* du changement.

Le linter ci-dessous vous aidera à respecter ces règles.`,
        component: CommitMessageLinter
      },
      {
        id: '10-2',
        title: 'Maîtriser .gitignore',
        objective: 'Comprendre et tester efficacement les règles du fichier .gitignore.',
        content: `Le fichier \`.gitignore\` est essentiel pour garder votre dépôt propre en évitant de versionner des fichiers inutiles (fichiers de log, dépendances, secrets, etc.).

Chaque ligne du fichier est un motif qui spécifie quels fichiers ou dossiers ignorer. Utilisez le simulateur ci-dessous pour tester si un chemin de fichier serait ignoré par vos règles.`,
        component: GitignoreTester
      },
      {
        id: '10-3',
        title: 'Utiliser les alias',
        objective: 'Créer des raccourcis pour vos commandes Git les plus fréquentes.',
        content: `Si vous tapez souvent les mêmes commandes longues (comme \`git log --oneline --graph\`), les alias sont faits pour vous ! Un alias est un raccourci personnalisé que vous définissez dans votre configuration Git.

Par exemple, vous pouvez configurer \`git co\` pour qu'il exécute \`git checkout\`. Utilisez l'assistant ci-dessous pour générer la commande de configuration pour vos propres alias.`,
        component: AliasCreator
      },
      {
        id: '10-4',
        title: 'Sécurité : Ne commitez pas de secrets !',
        objective: 'Comprendre les risques liés à la publication de données sensibles et comment les éviter.',
        content: `Un des plus grands dangers est de commiter accidentellement des informations sensibles comme des clés d'API, des mots de passe ou des tokens d'accès. Une fois qu'un secret est dans l'historique Git, il est très difficile de l'enlever complètement.

**Règle d'or :** Ne stockez jamais de secrets directement dans votre code. Utilisez des variables d'environnement et un fichier \`.env\` qui est listé dans votre \`.gitignore\`.

Le scanner ci-dessous simule une recherche de secrets dans votre projet.`,
        component: SecurityScanner
      }
    ]
  },
  {
    id: 'final-project',
    title: '11. Projet Final',
    description: 'Mettez en pratique tout ce que vous avez appris en contribuant à un projet simulé.',
    lessons: [
      {
        id: '11-1',
        title: 'Contribution à un Projet Open Source',
        objective: 'Simuler le processus complet de contribution à un projet open source.',
        content: `C'est le moment de tout assembler ! Dans cet exercice final, vous allez suivre le flux de travail complet d'un contributeur open source :

1.  **Trouver une issue** à résoudre dans le projet.
2.  **Forker** le dépôt et le **cloner** localement.
3.  Créer une **branche** pour votre travail.
4.  Effectuer les modifications de code et les **commits**.
5.  **Pousser** votre branche vers votre fork.
6.  Ouvrir une **Pull Request** vers le projet original.
7.  Participer à la **revue de code** et apporter des modifications si nécessaire.`,
        component: OpenSourceSimulator
      },
      {
        id: '11-2',
        title: 'Tableau de Bord du Projet',
        objective: 'Visualiser l\'état d\'avancement d\'un projet à travers un tableau de bord.',
        content: `Un tableau de bord est un outil essentiel pour avoir une vue d'ensemble de l'état d'un projet. Sur des plateformes comme GitHub, vous trouverez des tableaux de bord sous les onglets 'Projects' ou 'Insights', qui vous aident à suivre les issues, les Pull Requests, et l'activité des contributeurs.

Dans le cadre de cette application, nous avons également créé un **Tableau de Bord personnalisé** pour suivre votre propre parcours d'apprentissage. Il centralise votre progression, vos scores aux quiz et vos statistiques. Vous pouvez y accéder à tout moment en cliquant sur le lien "Tableau de bord" dans la barre de navigation en haut de la page.

Le simulateur ci-dessous représente un exemple de tableau de bord de fin de projet, récapitulant toutes les compétences que vous avez acquises.`,
        component: ProjectDashboard
      }
    ]
  }
];
