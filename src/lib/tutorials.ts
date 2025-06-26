import type { Tutorial } from '@/types/tutorial.types';
import { StagingAreaVisualizer } from '@/components/specialized/part-2/StagingAreaVisualizer';
import { VersioningDemo } from '@/components/specialized/part-1/VersioningDemo';
import { GitFlowDiagram } from '@/components/visualizations/GitGraph';
import { ConceptExplanation } from '@/components/tutorial/ConceptExplanation';

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
        content: "La commande `git status` est votre meilleure amie. Elle est essentielle pour savoir où vous en êtes. Elle vous montre :\n- Les fichiers qui ont été modifiés.\n- Les nouveaux fichiers que Git ne suit pas encore (untracked).\n- Les changements qui sont dans la zone de staging, prêts à être validés.\n\nUtilisez-la tout le temps !\n\n\`\`\`bash\ngit status\n\`\`\`",
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
        content: 'Pour voir l\'historique de tous vos commits, utilisez la commande `git log`. Elle affiche la liste des commits du plus récent au plus ancien.\n\n\`\`\`bash\ngit log\n\`\`\`\n\nPour une vue plus compacte et lisible, essayez ces options populaires :\n\n\`\`\`bash\n# Affiche chaque commit sur une seule ligne\ngit log --oneline\n\n# Affiche un graphe des branches et des fusions\ngit log --graph --oneline --decorate --all\n\`\`\`',
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
        content: "Pour créer une nouvelle branche, utilisez la commande `git branch <nom-de-la-branche>`. Cela crée la branche, mais ne vous déplace pas dessus.\n\n\`\`\`bash\ngit branch feature-nouvelle-page\n\`\`\`\n\nPour lister toutes les branches de votre dépôt local, exécutez simplement `git branch`. L'astérisque (\*) indique la branche sur laquelle vous vous trouvez actuellement.\n\n\`\`\`bash\ngit branch\n\`\`\`",
      },
      {
        id: '3-3',
        title: 'Changer de branche',
        objective: 'Apprendre à naviguer entre les différentes branches d\'un projet.',
        content: "Pour commencer à travailler sur votre nouvelle branche, vous devez vous y déplacer. Utilisez `git checkout <nom-de-la-branche>` ou la commande plus moderne et recommandée `git switch <nom-de-la-branche>`.\n\n\`\`\`bash\ngit switch feature-nouvelle-page\n\`\`\`\n> L'utilisation de `git switch` est préférée à `git checkout` pour changer de branche, car `checkout` est une commande plus ancienne qui a plusieurs responsabilités (changer de branche, restaurer des fichiers), ce qui peut prêter à confusion.",
      },
      {
        id: '3-4',
        title: 'Créer et basculer en une commande',
        objective: 'Utiliser un raccourci pour créer une branche et s\'y déplacer immédiatement.',
        content: "Le cas le plus courant est de créer une nouvelle branche et de basculer immédiatement dessus. Vous pouvez le faire en une seule commande avec l'option \`-b\` de \`git checkout\` ou avec la commande `git switch -c`.\n\nAvec `switch` (recommandé) :\n\`\`\`bash\ngit switch -c correction-bug-affichage\n\`\`\`\n\nAvec `checkout` (plus ancien) :\n\`\`\`bash\ngit checkout -b correction-bug-affichage\n\`\`\`",
      }
    ],
  },
];
