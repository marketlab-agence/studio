import type { Tutorial } from '@/types/tutorial.types';
import { CommitTimeline } from '@/components/visualizations/CommitTimeline';

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
        `,
      },
      {
        id: '1-2',
        title: 'Initialiser un dépôt',
        content: 'Chaque projet Git réside dans un "dépôt" (repository). Pour en démarrer un, naviguez dans votre dossier de projet et utilisez la commande `git init`.',
        command: 'git init',
      },
      {
        id: '1-3',
        title: 'Vérifier le statut',
        content: 'La commande `git status` est votre meilleure amie. Elle affiche l\'état actuel de votre dépôt, vous informant sur les fichiers modifiés, les nouveaux fichiers non suivis, etc.',
        command: 'git status',
      },
    ],
  },
  {
    id: 'making-commits',
    title: '2. Faire des commits',
    description: 'Apprenez à sauvegarder vos modifications en effectuant des "commits".',
    lessons: [
      {
        id: '2-1',
        title: 'Créer un fichier',
        content: "Commençons par créer un fichier dans notre projet. Utilisez la commande `touch` pour créer un fichier vide. Cela ne fait pas partie de Git, c'est une commande système courante.",
        command: 'touch README.md',
      },
      {
        id: '2-2',
        title: 'La zone de préparation (Staging Area)',
        content: "Avant de valider (commit), vous devez 'préparer' (stage) vos modifications. C'est une étape intermédiaire où vous rassemblez les changements pour le prochain commit. Utilisez `git add` pour ajouter des fichiers à cette zone.",
        command: 'git add README.md',
      },
      {
        id: '2-3',
        title: 'Valider les modifications (Commit)',
        content: 'Un commit est un "instantané" de vos modifications préparées. Chaque commit a un ID unique et un message descriptif. Utilisez `git commit -m "Votre message"` pour en créer un.',
        command: 'git commit -m "Commit initial avec README"',
      },
      {
        id: '2-4',
        title: 'Voir l\'historique',
        content: 'Vous pouvez voir l\'historique de tous vos commits en utilisant la commande `git log`. Cela montre qui a fait la modification, quand, et leur message de commit.',
        command: 'git log',
        component: CommitTimeline
      },
    ],
  },
];
