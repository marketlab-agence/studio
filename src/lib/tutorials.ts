export const TUTORIALS = [
  {
    id: 'intro-to-git',
    title: 'Introduction à Git',
    description: 'Apprenez les bases de Git et comment démarrer un nouveau projet.',
    steps: [
      {
        id: '1-1',
        title: 'Initialiser un dépôt',
        content: 'Chaque projet Git réside dans un dépôt. Pour en démarrer un, utilisez la commande `git init`.',
        command: 'git init',
      },
      {
        id: '1-2',
        title: 'Vérifier le statut',
        content: 'La commande `git status` affiche l\'état actuel de votre dépôt. Elle vous informe sur les fichiers non suivis, les modifications, etc.',
        command: 'git status',
      },
    ],
  },
  {
    id: 'making-commits',
    title: 'Faire des commits',
    description: 'Apprenez à sauvegarder vos modifications en effectuant des commits.',
    steps: [
      {
        id: '2-1',
        title: 'Préparer les fichiers (Staging)',
        content: "Avant de commiter, vous devez 'préparer' (stage) vos modifications. Cela indique à Git quels changements vous voulez inclure dans le prochain commit. Utilisez `git add`.",
        command: 'git add README.md',
      },
      {
        id: '2-2',
        title: 'Valider les modifications (Commit)',
        content: 'Un commit est un instantané de vos modifications préparées. Chaque commit a un ID unique et un message. Utilisez `git commit -m "Votre message"` pour en créer un.',
        command: 'git commit -m "Commit initial"',
      },
      {
        id: '2-3',
        title: 'Voir l\'historique',
        content: 'Vous pouvez voir l\'historique de tous vos commits en utilisant la commande `git log`. Cela montre qui a fait la modification, quand, et leur message de commit.',
        command: 'git log',
      },
    ],
  },
  {
    id: 'branching',
    title: 'Les branches et les fusions',
    description: 'Comprenez comment travailler sur différentes fonctionnalités en parallèle en utilisant des branches.',
    steps: [
      {
        id: '3-1',
        title: 'Créer une nouvelle branche',
        content: "Les branches vous permettent de développer des fonctionnalités sans affecter la base de code principale. Créez une nouvelle branche avec `git branch <nom-de-branche>`.",
        command: 'git branch nouvelle-fonctionnalite',
      },
      {
        id: '3-2',
        title: 'Changer de branche',
        content: "Pour commencer à travailler sur votre nouvelle branche, vous devez basculer dessus en utilisant `git checkout <nom-de-branche>` ou `git switch <nom-de-branche>`.",
        command: 'git switch nouvelle-fonctionnalite',
      },
      {
        id: '3-3',
        title: 'Fusionner une branche',
        content: "Une fois votre fonctionnalité terminée, vous pouvez la fusionner dans votre branche principale (par ex., `main` ou `master`). D'abord, revenez à la branche principale.",
        command: 'git switch main',
      },
      {
        id: '3-4',
        title: 'Effectuer la fusion',
        content: "Maintenant, utilisez `git merge <nom-de-branche>` pour combiner les modifications de votre branche de fonctionnalité dans la branche actuelle.",
        command: 'git merge nouvelle-fonctionnalite',
      },
    ],
  },
];
