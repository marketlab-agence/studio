import type { Quiz } from '@/types/tutorial.types';

export const QUIZZES: Record<string, Quiz> = {
  'intro-to-git': {
    id: 'intro-to-git',
    title: 'Quiz: Introduction à Git',
    questions: [
      {
        id: 'q1',
        text: "Quelle commande est utilisée pour initialiser un nouveau dépôt Git ?",
        answers: [
          { id: 'a1', text: 'git start' },
          { id: 'a2', text: 'git init', isCorrect: true },
          { id: 'a3', text: 'git new' },
        ],
      },
      {
        id: 'q2',
        text: "À quoi sert la commande `git status` ?",
        answers: [
          { id: 'a1', text: 'À afficher la liste des branches' },
          { id: 'a2', text: 'À voir les modifications et l\'état du répertoire de travail', isCorrect: true },
          { id: 'a3', text: 'À envoyer les modifications vers le dépôt distant' },
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
            text: 'Quelles commandes sont nécessaires pour sauvegarder un nouveau fichier `notes.txt` dans l\'historique du projet ? (Plusieurs réponses possibles)',
            isMultipleChoice: true,
            answers: [
                { id: 'a1', text: 'git add notes.txt', isCorrect: true },
                { id: 'a2', text: 'git commit -m "Ajout de notes"' , isCorrect: true },
                { id: 'a3', text: 'git save notes.txt' },
                { id: 'a4', text: 'git push' },
            ]
        },
        {
            id: 'q2',
            text: 'Laquelle des commandes suivantes permet de visualiser l\'historique des commits ?',
            answers: [
                { id: 'a1', text: 'git history' },
                { id: 'a2', text: 'git log', isCorrect: true },
                { id: 'a3', text: 'git show-commits' },
            ]
        }
    ],
    passingScore: 80,
  }
};
