import type { Quiz } from '@/types/tutorial.types';

export const QUIZZES: Record<string, Quiz> = {
  'intro-to-git': {
    id: 'intro-to-git',
    title: 'Quiz: Introduction à Git',
    questions: [
      {
        id: 'q1',
        text: "Quelle est la principale fonction d'un système de contrôle de version (VCS) comme Git ?",
        answers: [
          { id: 'a1', text: 'Éditer des fichiers de code' },
          { id: 'a2', text: 'Compiler le code source en application' },
          { id: 'a3', text: 'Suivre et gérer les modifications de fichiers au fil du temps', isCorrect: true },
          { id: 'a4', text: "Héberger des sites web" },
        ],
      },
      {
        id: 'q2',
        text: "Quelle commande est utilisée pour initialiser un nouveau dépôt Git dans le répertoire courant ?",
        answers: [
          { id: 'a1', text: 'git start' },
          { id: 'a2', text: 'git init', isCorrect: true },
          { id: 'a3', text: 'git new repo' },
          { id: 'a4', text: 'git create' },
        ],
      },
      {
        id: 'q3',
        text: "À quoi sert la commande `git status` ?",
        answers: [
          { id: 'a1', text: 'À afficher la liste des branches' },
          { id: 'a2', text: "À voir l'état du répertoire de travail et de la zone de staging", isCorrect: true },
          { id: 'a3', text: 'À envoyer les modifications vers le dépôt distant' },
          { id: 'a4', text: "À afficher l'historique des commits" },
        ],
      },
      {
        id: 'q4',
        text: "Qu'est-ce que le dossier `.git` qui est créé après un `git init` ?",
        answers: [
          { id: 'a1', text: 'Un fichier de sauvegarde temporaire' },
          { id: 'a2', text: 'Un dossier contenant tous les fichiers du projet' },
          { id: 'a3', text: "Un dossier qui contient toute la base de données et l'historique de votre projet Git", isCorrect: true },
          { id: 'a4', text: "Un fichier de configuration pour l'éditeur de code" },
        ],
      },
    ],
    passingScore: 80,
  },
  'making-commits': {
    id: 'making-commits',
    title: 'Quiz: Faire des commits',
    questions: [
        {
            id: 'q1',
            text: 'Quelles sont les deux commandes principales (et dans l\'ordre) pour sauvegarder un nouveau fichier dans l\'historique du projet ?',
            answers: [
                { id: 'a1', text: '`git commit` puis `git add`' },
                { id: 'a2', text: '`git add` puis `git commit`' , isCorrect: true },
                { id: 'a3', text: '`git save` puis `git upload`' },
                { id: 'a4', text: '`git stage` puis `git history`' },
            ]
        },
        {
            id: 'q2',
            text: 'Quelle est la fonction de la zone de staging (ou index) ?',
            answers: [
                { id: 'a1', text: 'C\'est l\'endroit où les fichiers sont stockés à distance.' },
                { id: 'a2', text: 'C\'est une zone intermédiaire où vous préparez les modifications exactes que vous voulez inclure dans le prochain commit.', isCorrect: true },
                { id: 'a3', text: 'C\'est une copie de sauvegarde de votre répertoire de travail.' },
                { id: 'a4', text: 'C\'est là que Git stocke les anciens commits.' },
            ]
        },
        {
            id: 'q3',
            text: 'Laquelle des commandes suivantes permet de visualiser un historique clair et concis des commits ?',
            answers: [
                { id: 'a1', text: 'git history' },
                { id: 'a2', text: 'git log --oneline', isCorrect: true },
                { id: 'a3', text: 'git show-commits' },
                { id: 'a4', text: 'git status -v' },
            ]
        },
        {
          id: 'q4',
          text: "Pourquoi est-il important d'écrire de bons messages de commit ?",
          isMultipleChoice: true,
          answers: [
              { id: 'a1', text: "Pour que Git fonctionne correctement." },
              { id: 'a2', text: "Pour aider les autres (et vous-même) à comprendre rapidement pourquoi un changement a été fait.", isCorrect: true },
              { id: 'a3', text: "Pour passer le temps." },
              { id: 'a4', text: "Pour faciliter la recherche dans l'historique du projet.", isCorrect: true },
          ]
      }
    ],
    passingScore: 80,
  },
  'branching': {
    id: 'branching',
    title: 'Quiz: Les Branches',
    questions: [
        {
            id: 'q1',
            text: 'Quelle commande crée une nouvelle branche nommée "feature-login" ?',
            answers: [
                { id: 'a1', text: 'git new branch feature-login' },
                { id: 'a2', text: 'git branch feature-login', isCorrect: true },
                { id: 'a3', text: 'git create feature-login' },
                { id: 'a4', text: 'git checkout feature-login' },
            ]
        },
        {
            id: 'q2',
            text: 'Comment basculez-vous sur une branche existante nommée "develop" ?',
            answers: [
                { id: 'a1', text: 'git switch develop' },
                { id: 'a2', text: 'git checkout develop', isCorrect: true },
                { id: 'a3', text: 'git change-branch develop' },
                { id: 'a4', text: 'Les deux premières réponses sont correctes.', isCorrect: true },
            ]
        },
        {
            id: 'q3',
            text: 'Quelle commande crée une nouvelle branche et bascule dessus en une seule étape ?',
            answers: [
                { id: 'a1', text: 'git branch -c new-feature' },
                { id: 'a2', text: 'git new -s new-feature' },
                { id: 'a3', text: 'git checkout -b new-feature', isCorrect: true },
                { id: 'a4', text: 'git branch && git checkout' },
            ]
        },
    ],
    passingScore: 80,
  }
};
