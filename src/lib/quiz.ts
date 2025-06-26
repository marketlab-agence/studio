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
            text: "Quelle option de la commande `git commit` permet d'inclure le message directement en ligne de commande ?",
            answers: [
                { id: 'a1', text: '-message "Votre message"' },
                { id: 'a2', text: '-m "Votre message"', isCorrect: true },
                { id: 'a3', text: '-c "Votre message"' },
                { id: 'a4', text: '--message "Votre message"' },
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
                { id: 'a4', text: 'git feature-login' },
            ]
        },
        {
            id: 'q2',
            text: 'Quelle commande est la plus moderne et recommandée pour changer de branche ?',
            answers: [
                { id: 'a1', text: 'git move develop' },
                { id: 'a2', text: 'git switch develop', isCorrect: true },
                { id: 'a3', text: 'git go develop' },
                { id: 'a4', text: 'git change-branch develop' },
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
        {
            id: 'q4',
            text: 'Quelle commande est utilisée pour lister toutes les branches de votre dépôt ?',
            answers: [
                { id: 'a1', text: 'git list --branches' },
                { id: 'a2', text: 'git show-branches' },
                { id: 'a3', text: 'git branch', isCorrect: true },
                { id: 'a4', text: 'git status --branches' },
            ]
        }
    ],
    passingScore: 80,
  },
  'remote-repositories': {
    id: 'remote-repositories',
    title: 'Quiz: Dépôts Distants',
    questions: [
      {
        id: 'q1',
        text: "Quelle commande est utilisée pour créer une copie locale complète d'un dépôt distant ?",
        answers: [
          { id: 'a1', text: 'git copy' },
          { id: 'a2', text: 'git clone', isCorrect: true },
          { id: 'a3', text: 'git download' },
          { id: 'a4', text: 'git remote get' },
        ],
      },
      {
        id: 'q2',
        text: "Quel est le nom par défaut que Git donne au dépôt distant lorsque vous clonez un projet ?",
        answers: [
          { id: 'a1', text: 'remote' },
          { id: 'a2', text: 'github' },
          { id: 'a3', text: 'origin', isCorrect: true },
          { id: 'a4', text: 'server' },
        ],
      },
      {
        id: 'q3',
        text: "Quelle est la différence entre `git pull` et `git fetch` ?",
        answers: [
          { id: 'a1', text: 'Il n\'y a aucune différence, ce sont des alias.' },
          { id: 'a2', text: '`git fetch` télécharge les changements et les fusionne, tandis que `git pull` ne fait que télécharger.' },
          { id: 'a3', text: '`git fetch` télécharge les changements sans les fusionner, tandis que `git pull` télécharge ET fusionne.', isCorrect: true },
          { id: 'a4', text: '`git pull` est pour télécharger, `git fetch` est pour envoyer.' },
        ],
      },
      {
        id: 'q4',
        text: "Quelle commande envoie vos commits locaux vers le dépôt distant `origin` sur la branche `main` ?",
        answers: [
          { id: 'a1', text: 'git upload origin main' },
          { id: 'a2', text: 'git send origin main' },
          { id: 'a3', text: 'git push origin main', isCorrect: true },
          { id: 'a4', text: 'git commit --remote' },
        ],
      },
    ],
    passingScore: 80,
  },
  'collaboration': {
    id: 'collaboration',
    title: 'Quiz: Collaboration sur GitHub',
    questions: [
      {
        id: 'q1',
        text: "Quand devriez-vous 'forker' un dépôt plutôt que le 'cloner' directement ?",
        answers: [
          { id: 'a1', text: 'Toujours, c\'est une meilleure pratique.' },
          { id: 'a2', text: 'Quand vous voulez contribuer à un projet sur lequel vous n\'avez pas les droits d\'écriture.', isCorrect: true },
          { id: 'a3', text: 'Seulement pour les projets privés.' },
          { id: 'a4', text: 'Quand le projet est très volumineux.' },
        ],
      },
      {
        id: 'q2',
        text: "Qu'est-ce qu'une 'Pull Request' (PR) ?",
        answers: [
          { id: 'a1', text: 'Une demande pour que quelqu\'un vous aide à résoudre un bug.' },
          { id: 'a2', text: 'Une notification indiquant que de nouveaux changements sont disponibles.' },
          { id: 'a3', text: 'Une demande formelle pour intégrer vos changements dans une autre branche.', isCorrect: true },
          { id: 'a4', text: 'Une commande pour forcer l\'envoi de vos changements.' },
        ],
      },
      {
        id: 'q3',
        text: "Quel est le flux typique pour contribuer à un projet open source via un fork ?",
        answers: [
          { id: 'a1', text: 'Clone > Push > Fork > Pull Request' },
          { id: 'a2', text: 'Fork > Clone > Push vers son fork > Pull Request', isCorrect: true },
          { id: 'a3', text: 'Pull Request > Clone > Push' },
          { id: 'a4', text: 'Push directement vers le projet original' },
        ],
      },
      {
        id: 'q4',
        text: "À quoi sert la revue de code dans une Pull Request ?",
        answers: [
          { id: 'a1', text: 'À critiquer le développeur.' },
          { id: 'a2', text: 'À approuver automatiquement tous les changements.' },
          { id: 'a3', text: 'À améliorer la qualité du code, partager des connaissances et s\'assurer que les changements sont pertinents.', isCorrect: true },
          { id: 'a4', text: 'À vérifier uniquement les fautes de frappe.' },
        ],
      }
    ],
    passingScore: 80,
  },
  'conflicts': {
    id: 'conflicts',
    title: 'Quiz: Gérer les Conflits',
    questions: [
      {
        id: 'q1',
        text: "Quand un conflit de fusion se produit-il le plus souvent ?",
        answers: [
          { id: 'a1', text: 'Quand deux branches ont modifié les mêmes lignes dans le même fichier.', isCorrect: true },
          { id: 'a2', text: 'Quand vous créez une nouvelle branche.' },
          { id: 'a3', text: 'Chaque fois que vous faites `git pull`.' },
          { id: 'a4', text: 'Quand vous renommez un fichier.' },
        ],
      },
      {
        id: 'q2',
        text: "Après avoir résolu manuellement un conflit dans un fichier, quelle est la première commande à exécuter ?",
        answers: [
          { id: 'a1', text: 'git commit' },
          { id: 'a2', text: 'git merge --continue' },
          { id: 'a3', text: 'git add <fichier-résolu>', isCorrect: true },
          { id: 'a4', text: 'git reset' },
        ],
      },
      {
        id: 'q3',
        text: "Que signifie `<<<<<<< HEAD` dans un fichier en conflit ?",
        answers: [
          { id: 'a1', text: 'C\'est le début du fichier.' },
          { id: 'a2', text: 'C\'est une erreur de syntaxe.' },
          { id: 'a3', text: 'Cela marque le début de la version du code provenant de votre branche actuelle (HEAD).', isCorrect: true },
          { id: 'a4', text: 'Cela marque la fin de la version du code de la branche entrante.' },
        ],
      },
      {
        id: 'q4',
        text: "Que se passe-t-il lorsque vous exécutez `git commit` après avoir résolu un conflit ?",
        answers: [
          { id: 'a1', text: 'Cela crée un commit normal.' },
          { id: 'a2', text: 'Cela finalise la fusion qui était en pause.', isCorrect: true },
          { id: 'a3', text: 'Cela annule la fusion.' },
          { id: 'a4', text: 'Cela demande à nouveau de résoudre le conflit.' },
        ],
      }
    ],
    passingScore: 80,
  },
  'undoing-changes': {
    id: 'undoing-changes',
    title: 'Quiz: Annuler des Modifications',
    questions: [
      {
        id: 'q1',
        text: "Quelle est la manière la plus SÛRE d'annuler un commit qui a déjà été partagé avec d'autres ?",
        answers: [
          { id: 'a1', text: '`git reset --hard <commit>`' },
          { id: 'a2', text: '`git revert <commit>`', isCorrect: true },
          { id: 'a3', text: 'Supprimer et recréer la branche.' },
          { id: 'a4', text: '`git checkout <commit>`' },
        ],
      },
      {
        id: 'q2',
        text: "À quoi sert la commande `git reflog` ?",
        answers: [
          { id: 'a1', text: 'À renommer le dernier commit.' },
          { id: 'a2', text: 'À lister toutes les références de branches et de tags.' },
          { id: 'a3', text: 'À afficher un journal de tous les mouvements de HEAD, agissant comme un filet de sécurité.', isCorrect: true },
          { id: 'a4', text: 'À rafraîchir le journal des logs.' },
        ],
      },
      {
        id: 'q3',
        text: "Quelle commande est utilisée pour retirer un fichier de la zone de staging sans annuler les modifications dans le fichier lui-même ?",
        answers: [
          { id: 'a1', text: '`git checkout -- <fichier>`' },
          { id: 'a2', text: '`git rm <fichier>`' },
          { id: 'a3', text: '`git reset HEAD <fichier>`', isCorrect: true },
          { id: 'a4', text: '`git revert <fichier>`' },
        ],
      },
      {
        id: 'q4',
        text: "Quelle est la principale différence entre `git reset` et `git revert` ?",
        answers: [
          { id: 'a1', text: 'Il n\'y en a pas, ce sont des alias.' },
          { id: 'a2', text: '`git reset` modifie l\'historique existant, tandis que `git revert` crée un nouveau commit qui annule les changements.', isCorrect: true },
          { id: 'a3', text: '`git reset` est plus sûr que `git revert`.' },
          { id: 'a4', text: '`git revert` supprime des commits, `git reset` les déplace.' },
        ],
      }
    ],
    passingScore: 80,
  }
};
