import type { Tutorial } from '@/types/tutorial.types';
import { StagingAreaVisualizer } from '@/components/specialized/part-2/StagingAreaVisualizer';

export const TUTORIALS: Tutorial[] = [
  {
    id: 'intro-to-git',
    title: '1. Introduction à Git',
    description: 'Apprenez les bases de Git et comment démarrer un nouveau projet.',
    lessons: [
      {
        id: '1-1',
        title: 'Qu\'est-ce que le contrôle de version ?',
        content: `
Le contrôle de version est un système qui enregistre les modifications d'un fichier ou d'un ensemble de fichiers au fil du temps, vous permettant de revenir à des versions spécifiques plus tard.
C'est comme avoir une machine à remonter le temps pour votre projet.

Avec un système de contrôle de version distribué (DVCS) comme **Git**, chaque développeur dispose d'une copie complète de l'historique du projet sur sa machine locale. Cela rend les opérations rapides et permet de travailler hors ligne.
        `,
      },
      {
        id: '1-2',
        title: 'Initialiser un dépôt',
        content: `Chaque projet Git réside dans un "dépôt" (repository). Pour en démarrer un, naviguez dans votre dossier de projet et utilisez la commande \`git init\`.

Cette commande crée un nouveau sous-dossier nommé **.git** qui contient tous les fichiers nécessaires à votre dépôt – c’est là que Git stocke la base de données des modifications et les métadonnées.`,
        command: 'git init',
      },
      {
        id: '1-3',
        title: 'Vérifier le statut',
        content: `La commande \`git status\` est votre meilleure amie. Elle affiche l'état actuel de votre dépôt.

Utilisez-la fréquemment pour voir quels fichiers ont été modifiés, quels nouveaux fichiers ne sont pas encore suivis par Git (untracked), et quels changements sont prêts à être validés.`,
        command: 'git status',
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
        title: 'Créer et modifier des fichiers',
        content: "Commençons par créer un fichier. La commande `touch` crée un fichier vide (ce n'est pas une commande Git). Ensuite, nous vérifierons le statut pour voir comment Git réagit.",
        command: 'touch README.md',
      },
      {
        id: '2-2',
        title: 'Les 3 zones de Git',
        content: `Git gère les fichiers selon trois états principaux :
1.  **Répertoire de travail (Working Directory)** : Les fichiers tels que vous les voyez dans votre explorateur.
2.  **Zone de staging (Index)** : Une zone intermédiaire où vous préparez la prochaine "photo" de votre projet.
3.  **Dépôt (.git)** : L'endroit où Git stocke définitivement ces photos (les commits).

La commande \`git add\` déplace les changements du répertoire de travail vers la zone de staging.`,
        command: 'git add README.md',
        component: StagingAreaVisualizer
      },
      {
        id: '2-3',
        title: 'Valider les modifications (Commit)',
        content: `Un commit est un "instantané" de votre zone de staging à un instant T. Chaque commit a un identifiant unique et un message descriptif.

Il est crucial d'écrire de **bons messages de commit** : clairs, concis et décrivant le *pourquoi* du changement, pas seulement le *quoi*. Utilisez \`git commit -m "Votre message"\` pour créer un commit.`,
        command: 'git commit -m "Ajout du fichier README"',
      },
      {
        id: '2-4',
        title: 'Voir l\'historique',
        content: 'Vous pouvez voir l\'historique de tous vos commits en utilisant la commande `git log`. Pour une vue plus compacte, essayez `git log --oneline`.',
        command: 'git log',
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
        content: `Une branche dans Git est simplement un pointeur léger et mobile vers un de vos commits. La branche par défaut est nommée \`main\` (ou \`master\` dans les anciens projets).

Travailler avec des branches vous permet de développer des fonctionnalités, de corriger des bugs, ou d'expérimenter de nouvelles idées dans un espace isolé sans affecter la ligne principale de développement.`,
      },
      {
        id: '3-2',
        title: 'Créer une branche',
        content: "Pour créer une nouvelle branche, utilisez la commande `git branch <nom-de-la-branche>`. Cela crée la branche, mais ne vous déplace pas dessus.",
        command: 'git branch nouvelle-fonctionnalite',
      },
      {
        id: '3-3',
        title: 'Changer de branche',
        content: "Pour commencer à travailler sur votre nouvelle branche, vous devez vous y déplacer. Utilisez `git checkout <nom-de-la-branche>` ou la commande plus moderne `git switch <nom-de-la-branche>`.",
        command: 'git checkout nouvelle-fonctionnalite',
      },
      {
        id: '3-4',
        title: 'Créer et basculer en une commande',
        content: "Le cas le plus courant est de créer une nouvelle branche et de basculer immédiatement dessus. Vous pouvez le faire en une seule commande avec l'option `-b` de `git checkout`.",
        command: 'git checkout -b autre-fonctionnalite',
      }
    ],
  },
];
