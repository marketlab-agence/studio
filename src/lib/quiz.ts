
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
      {
        id: 'q5',
        text: "Quelle commande est utilisée pour configurer votre nom d'utilisateur dans Git, qui sera associé à vos commits ?",
        answers: [
          { id: 'a1', text: 'git config --global user.name "Votre Nom"', isCorrect: true },
          { id: 'a2', text: 'git user --name "Votre Nom"' },
          { id: 'a3', text: 'git config --name "Votre Nom"' },
          { id: 'a4', text: 'git profile --user "Votre Nom"' },
        ],
      },
      {
        id: 'q6',
        text: "Parmi les affirmations suivantes sur Git, lesquelles sont vraies ? (plusieurs réponses possibles)",
        isMultipleChoice: true,
        answers: [
          { id: 'a1', text: 'Git est un système de contrôle de version distribué.', isCorrect: true },
          { id: 'a2', text: 'Git a été créé par Linus Torvalds.', isCorrect: true },
          { id: 'a3', text: 'Le dossier .git peut être supprimé sans risque.' },
          { id: 'a4', text: "Git ne fonctionne que si vous êtes connecté à Internet." },
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
        },
        {
          id: 'q5',
          text: 'À quoi sert le fichier `.gitignore` ?',
          answers: [
            { id: 'a1', text: 'À ignorer les erreurs Git.' },
            { id: 'a2', text: 'À spécifier les fichiers et dossiers que Git doit ignorer et ne pas suivre.', isCorrect: true },
            { id: 'a3', text: 'À lister les utilisateurs qui ne peuvent pas faire de commit.' },
            { id: 'a4', text: 'À configurer les paramètres de Git.' },
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
        },
        {
          id: 'q5',
          text: "Quelle commande est utilisée pour supprimer une branche locale nommée 'old-feature' en toute sécurité (seulement si elle a été fusionnée) ?",
          answers: [
            { id: 'a1', text: 'git branch -d old-feature', isCorrect: true },
            { id: 'a2', text: 'git branch -D old-feature' },
            { id: 'a3', text: 'git delete branch old-feature' },
            { id: 'a4', text: 'git remove old-feature' },
          ]
        },
        {
          id: 'q6',
          text: "Quels sont les avantages de l'utilisation des branches dans Git ? (plusieurs réponses possibles)",
          isMultipleChoice: true,
          answers: [
            { id: 'a1', text: 'Isoler le développement de nouvelles fonctionnalités.', isCorrect: true },
            { id: 'a2', text: 'Permettre à plusieurs personnes de travailler sur le même projet sans se gêner.', isCorrect: true },
            { id: 'a3', text: 'Rendre le projet plus lourd et plus lent.' },
            { id: 'a4', text: 'Créer des sauvegardes automatiques du projet.' },
          ],
        },
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
      {
        id: 'q5',
        text: 'Quelle commande permet de lister tous les dépôts distants configurés pour votre projet, avec leurs URLs ?',
        answers: [
          { id: 'a1', text: 'git list remotes' },
          { id: 'a2', text: 'git remote -v', isCorrect: true },
          { id: 'a3', text: 'git show urls' },
          { id: 'a4', text: 'git config --remotes' },
        ]
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
      },
      {
        id: 'q5',
        text: 'Comment maintenez-vous votre fork à jour avec les derniers changements du projet original (upstream) ?',
        answers: [
          { id: 'a1', text: 'En le supprimant et en le recréant.' },
          { id: 'a2', text: 'En configurant un distant \'upstream\', en faisant un \'fetch\' dessus, puis en fusionnant les changements dans votre branche \'main\'.', isCorrect: true },
          { id: 'a3', text: 'GitHub le met à jour automatiquement.' },
          { id: 'a4', text: 'En faisant \'git push --update\'.' },
        ]
      }
    ],
    passingScore: 80,
  },
  'workflows': {
    id: 'workflows',
    title: 'Quiz: Workflows Git',
    questions: [
      {
        id: 'q1',
        text: "Dans le workflow GitFlow, quelle est la fonction principale d'une branche de 'release' ?",
        answers: [
          { id: 'a1', text: 'Développer des fonctionnalités nouvelles et expérimentales.' },
          { id: 'a2', text: 'Contenir la version de production stable et historique.' },
          { id: 'a3', text: 'Préparer une nouvelle version pour la production, en y agrégeant les fonctionnalités de `develop` et en y appliquant des corrections mineures.', isCorrect: true },
          { id: 'a4', text: "Appliquer des correctifs urgents directement sur la production." },
        ],
      },
      {
        id: 'q2',
        text: 'Dans GitFlow, de quelle branche les branches de fonctionnalité (`feature/*`) partent-elles et vers laquelle sont-elles fusionnées ?',
        answers: [
          { id: 'a1', text: 'Elles partent de `main` et sont fusionnées dans `main`.' },
          { id: 'a2', text: 'Elles partent de `develop` et sont fusionnées dans `develop`.', isCorrect: true },
          { id: 'a3', text: 'Elles partent de `main` et sont fusionnées dans `develop`.' },
          { id: 'a4', text: 'Elles partent de `develop` et sont fusionnées dans `main`.' },
        ],
      },
      {
        id: 'q3',
        text: 'Quel est l\'inconvénient principal de GitFlow ?',
        answers: [
          { id: 'a1', text: 'Il est trop simple pour les gros projets.' },
          { id: 'a2', text: 'Il ne permet pas de gérer les hotfixes.' },
          { id: 'a3', text: 'Sa complexité peut ralentir le cycle de développement.', isCorrect: true },
          { id: 'a4', text: 'Il n\'est pas compatible avec GitHub.' },
        ],
      },
      {
        id: 'q4',
        text: "Quelle est la principale conséquence de l'utilisation de `git rebase` pour intégrer des changements ?",
        answers: [
          { id: 'a1', text: 'Crée un commit de fusion.' },
          { id: 'a2', text: "Réécrit l'historique pour le rendre linéaire.", isCorrect: true },
          { id: 'a3', text: 'Est plus sûr que `git merge` pour les branches publiques.' },
          { id: 'a4', text: 'Ne fonctionne que avec GitFlow.' },
        ],
      },
      {
        id: 'q5',
        text: "Dans GitHub Flow, quelle est la règle d'or pour la branche `main` ?",
        answers: [
          { id: 'a1', text: 'Elle doit toujours être déployable.', isCorrect: true },
          { id: 'a2', text: 'Elle ne doit être mise à jour qu\'une fois par semaine.' },
          { id: 'a3', text: 'Seul le chef de projet peut y pusher.' },
          { id: 'a4', text: 'Elle doit être supprimée après chaque release.' },
        ]
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
      },
      {
        id: 'q5',
        text: 'Si vous êtes au milieu d\'une fusion avec des conflits et que vous souhaitez annuler complètement la fusion et revenir à l\'état d\'avant, quelle commande utilisez-vous ?',
        answers: [
          { id: 'a1', text: 'git merge --undo' },
          { id: 'a2', text: 'git merge --abort', isCorrect: true },
          { id: 'a3', text: 'git reset --hard' },
          { id: 'a4', text: 'git cancel merge' },
        ]
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
      },
      {
        id: 'q5',
        text: "Vous venez de faire un commit, mais vous réalisez que vous avez oublié d'inclure un fichier ou que le message du commit contient une faute de frappe. Quelle commande pouvez-vous utiliser pour modifier le dernier commit sans créer un nouveau commit ?",
        answers: [
          { id: 'a1', text: 'git fixup' },
          { id: 'a2', text: 'git commit --amend', isCorrect: true },
          { id: 'a3', text: 'git edit commit' },
          { id: 'a4', text: 'git revert --soft' },
        ]
      },
      {
        id: 'q6',
        text: "Quelles sont les situations où l'utilisation de `git reset --hard` peut être dangereuse et entraîner une perte de travail ? (plusieurs réponses possibles)",
        isMultipleChoice: true,
        answers: [
          { id: 'a1', text: 'Quand vous avez des modifications non commitées dans votre répertoire de travail.', isCorrect: true },
          { id: 'a2', text: 'Quand le commit que vous annulez a déjà été poussé vers un dépôt partagé.', isCorrect: true },
          { id: 'a3', text: 'Quand vous voulez simplement retirer un fichier de la zone de staging.' },
          { id: 'a4', text: 'Quand vous voulez annuler un commit public.' },
        ],
      },
    ],
    passingScore: 80,
  },
  'github-features': {
    id: 'github-features',
    title: 'Quiz: Fonctionnalités de GitHub',
    questions: [
      {
        id: 'q1',
        text: 'Quelle fonctionnalité de GitHub est principalement utilisée pour suivre les bugs et les demandes de fonctionnalités ?',
        answers: [
          { id: 'a1', text: 'Pull Requests' },
          { id: 'a2', text: 'Actions' },
          { id: 'a3', text: 'Issues', isCorrect: true },
          { id: 'a4', text: 'Projects' },
        ],
      },
      {
        id: 'q2',
        text: 'À quoi sert principalement GitHub Actions ?',
        answers: [
          { id: 'a1', text: 'À discuter du code avec d\'autres développeurs.' },
          { id: 'a2', text: 'À automatiser les flux de travail comme les tests et le déploiement (CI/CD).', isCorrect: true },
          { id: 'a3', text: 'À héberger la documentation du projet.' },
          { id: 'a4', text: 'À suivre les statistiques d\'utilisation du projet.' },
        ],
      },
      {
        id: 'q3',
        text: 'Dans quel dossier de votre projet les fichiers de configuration de GitHub Actions doivent-ils être placés ?',
        answers: [
          { id: 'a1', text: '.github/workflows', isCorrect: true },
          { id: 'a2', text: '.actions/' },
          { id: 'a3', text: 'workflows/' },
          { id: 'a4', text: '.github/actions' },
        ],
      },
      {
        id: 'q4',
        text: 'Qu\'est-ce qu\'un "assignee" dans une Issue GitHub ?',
        answers: [
          { id: 'a1', text: 'La personne qui a trouvé le bug.' },
          { id: 'a2', text: 'Une étiquette de catégorie.' },
          { id: 'a3', text: 'Le jalon auquel l\'issue est rattachée.' },
          { id: 'a4', text: 'La personne responsable du traitement de l\'issue.', isCorrect: true },
        ],
      },
      {
        id: 'q5',
        text: "Quel est le nom du fichier qui, s'il est placé à la racine de votre dépôt, sera automatiquement affiché sur la page d'accueil de votre projet sur GitHub ?",
        answers: [
          { id: 'a1', text: 'HOME.md' },
          { id: 'a2', text: 'index.md' },
          { id: 'a3', text: 'README.md', isCorrect: true },
          { id: 'a4', text: 'PROJECT.txt' },
        ]
      }
    ],
    passingScore: 80,
  },
  'best-practices': {
    id: 'best-practices',
    title: 'Quiz: Bonnes Pratiques',
    questions: [
      {
        id: 'q1',
        text: 'Quelle est la bonne pratique pour la première ligne (sujet) d\'un message de commit ?',
        answers: [
          { id: 'a1', text: 'Être très détaillée et longue.' },
          { id: 'a2', text: 'Ne pas dépasser 50 caractères et utiliser l\'impératif.', isCorrect: true },
          { id: 'a3', text: 'Toujours se terminer par un point.' },
          { id: 'a4', text: 'Être écrite au passé (ex: "J\'ai ajouté...")' },
        ],
      },
      {
        id: 'q2',
        text: 'Où devriez-vous stocker des informations sensibles comme des clés d\'API ?',
        answers: [
          { id: 'a1', text: 'Directement dans le code pour un accès facile.' },
          { id: 'a2', text: 'Dans un fichier de configuration commité, mais chiffré.' },
          { id: 'a3', text: 'Dans des variables d\'environnement et un fichier `.env` ajouté au `.gitignore`.', isCorrect: true },
          { id: 'a4', text: 'Dans le message d\'un commit privé.' },
        ],
      },
      {
        id: 'q3',
        text: 'À quoi sert un alias Git ?',
        answers: [
          { id: 'a1', text: 'À créer un pseudonyme pour votre nom d\'utilisateur.' },
          { id: 'a2', text: 'À créer un raccourci pour une commande Git longue ou fréquente.', isCorrect: true },
          { id: 'a3', text: 'À ignorer certains fichiers.' },
          { id: 'a4', 'text': 'À changer de branche rapidement.' },
        ],
      },
      {
        id: 'q4',
        text: 'Que faut-il faire si vous commitez accidentellement un fichier sensible sur une branche locale non encore partagée ?',
        answers: [
          { id: 'a1', text: 'Le supprimer et faire un nouveau commit.' },
          { id: 'a2', text: 'Utiliser `git reset` pour retirer le commit, puis refaire un commit propre.', isCorrect: true },
          { id: 'a3', text: 'Pousser la branche et la supprimer ensuite.' },
          { id: 'a4', text: 'Utiliser `git revert`.' },
        ],
      },
      {
        id: 'q5',
        text: 'Quels types de fichiers sont de bons candidats pour être ajoutés au `.gitignore` ? (plusieurs réponses possibles)',
        isMultipleChoice: true,
        answers: [
          { id: 'a1', text: 'Le dossier `node_modules/`.', isCorrect: true },
          { id: 'a2', text: 'Les fichiers contenant des secrets comme `.env`.', isCorrect: true },
          { id: 'a3', text: 'Les fichiers de log (`*.log`).', isCorrect: true },
          { id: 'a4', text: 'Le code source principal de l\'application comme `index.js`.' },
        ],
      }
    ],
    passingScore: 80,
  },
  'final-project': {
    id: 'final-project',
    title: 'Quiz: Révision Finale',
    questions: [
      {
        id: 'q1',
        text: 'Quel est le premier réflexe à avoir lorsque l\'on veut contribuer à un projet open source sur lequel on n\'a pas les droits d\'écriture ?',
        answers: [
          { id: 'a1', text: 'Cloner le projet' },
          { id: 'a2', text: 'Créer une Pull Request' },
          { id: 'a3', text: 'Forker le projet', isCorrect: true },
          { id: 'a4', text: 'Créer une issue' },
        ],
      },
      {
        id: 'q2',
        text: 'Quelle commande est la plus SÛRE pour annuler un commit public (déjà "pushé") ?',
        answers: [
          { id: 'a1', text: 'git reset --hard' },
          { id: 'a2', text: 'git revert', isCorrect: true },
          { id: 'a3', text: 'git rebase' },
          { id: 'a4', text: 'git checkout' },
        ],
      },
      {
        id: 'q3',
        text: 'Après avoir résolu manuellement un conflit de fusion, quelle est la prochaine étape cruciale avant de faire le commit de fusion ?',
        answers: [
          { id: 'a1', text: 'git pull' },
          { id: 'a2', text: 'git merge --continue' },
          { id: 'a3', text: 'git add <fichiers-résolus>', isCorrect: true },
          { id: 'a4', text: 'git status' },
        ],
      },
      {
        id: 'q4',
        text: 'Quelle est la commande qui combine `git fetch` et `git merge` en une seule étape ?',
        answers: [
          { id: 'a1', text: 'git push' },
          { id: 'a2', text: 'git sync' },
          { id: 'a3', text: 'git clone' },
          { id: 'a4', text: 'git pull', isCorrect: true },
        ],
      },
      {
        id: 'q5',
        text: "Vous avez cloné un dépôt, créé une branche 'fix/typo', fait un commit, et maintenant vous voulez le partager. Quelle est la prochaine commande à exécuter ?",
        answers: [
          { id: 'a1', text: 'git pull' },
          { id: 'a2', text: 'git merge main' },
          { id: 'a3', text: 'git push origin fix/typo', isCorrect: true },
          { id: 'a4', text: 'git commit --push' },
        ]
      }
    ],
    passingScore: 80,
  }
};

    