export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  content: string; // Markdown
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: '5-astuces-jira',
    title: '5 Astuces Jira que même les Experts ignorent',
    description: 'Boostez votre productivité et celle de votre équipe avec ces fonctionnalités méconnues de Jira. Passez de simple utilisateur à véritable power-user.',
    date: '15 juillet 2024',
    author: 'L\'équipe Katalyst',
    content: `
Jira est un outil incroyablement puissant, mais la plupart des équipes n'en effleurent que la surface. Voici 5 astuces pour transformer votre gestion de projet.

### 1. La puissance du JQL (Jira Query Language)

Oubliez les filtres de base. Le JQL vous permet de créer des requêtes extrêmement précises.

**Exemple :** Trouver tous les bugs non résolus qui vous sont assignés depuis plus de 7 jours.
\`\`\`jql
project = "MonProjet" AND issuetype = Bug AND status != "Done" AND assignee = currentUser() AND updated <= -7d
\`\`\`

### 2. Les Workflows d'Automatisation

Saviez-vous que vous pouvez automatiser des actions ?
- **Quand** un ticket passe à "En revue"
- **Alors** assigner automatiquement le ticket au lead développeur.
- **Et** ajouter le commentaire "Prêt pour la revue".

Explorez les règles d'automatisation dans les paramètres de votre projet. C'est un gain de temps phénoménal.

### 3. Les Composants pour mieux organiser

Ne vous noyez plus dans les backlogs. Utilisez les "Composants" pour regrouper les tickets par fonctionnalité ou partie de votre application (ex: 'Authentification', 'API de paiement', 'Interface Utilisateur'). Cela simplifie le filtrage et la planification.

### 4. Le Suivi Temporel (Time Tracking)

Même si ce n'est pas toujours populaire, activer le suivi du temps peut révéler des goulots d'étranglement et aider à mieux estimer les futures tâches. Utilisez-le pour comprendre où va l'effort de l'équipe.

### 5. Les Tableaux de Bord Personnalisés

Ne vous contentez pas du tableau par défaut. Créez des tableaux de bord avec des gadgets personnalisés :
- Un graphique circulaire des tickets par personne assignée.
- Un filtre sur les tickets bloqués.
- Un flux d'activité des derniers changements.

Un bon tableau de bord donne une vue d'ensemble du projet en un clin d'œil.
`
  },
  {
    slug: 'aws-pour-debutants',
    title: 'AWS pour les Débutants : Par où commencer en 2024 ?',
    description: 'Le cloud AWS peut sembler intimidant. Nous vous guidons à travers les 3 services fondamentaux pour commencer votre aventure dans le cloud computing.',
    date: '10 juillet 2024',
    author: 'L\'équipe Katalyst',
    content: `
Amazon Web Services (AWS) offre des centaines de services, ce qui peut être paralysant pour un débutant. La clé est de ne pas essayer de tout apprendre d'un coup. Concentrez-vous sur les 3 piliers.

### 1. L'Hébergement : Amazon S3 (Simple Storage Service)

Pensez à S3 comme à un disque dur infiniment grand sur internet. C'est le point de départ de nombreux projets.
- **Usage principal :** Stocker et distribuer des fichiers statiques (images, vidéos, fichiers de site web, sauvegardes).
- **Pourquoi c'est fondamental :** C'est simple, peu coûteux et incroyablement fiable. Vous pouvez même héberger un site web statique entier directement depuis S3.

### 2. La Puissance de Calcul : Amazon EC2 (Elastic Compute Cloud)

EC2, c'est la location de serveurs virtuels. C'est ici que votre application "tournera".
- **Usage principal :** Lancer des serveurs (appelés "instances") avec le système d'exploitation de votre choix (Linux, Windows) pour y exécuter votre code, vos bases de données, etc.
- **Pourquoi c'est fondamental :** C'est la base du "Infrastructure as a Service" (IaaS). Comprendre EC2, c'est comprendre comment le web moderne fonctionne.

### 3. Les Bases de Données : Amazon RDS (Relational Database Service)

Gérer sa propre base de données est complexe. RDS vous simplifie la vie.
- **Usage principal :** Créer, gérer et mettre à l'échelle des bases de données relationnelles (comme MySQL, PostgreSQL, etc.) sans vous soucier de la maintenance du serveur.
- **Pourquoi c'est fondamental :** Il sépare la logique de votre application de la gestion de ses données, une pratique essentielle pour construire des applications robustes et scalables.

**Conclusion :** Maîtrisez S3, EC2, et RDS, et vous aurez les clés pour construire et déployer une grande variété d'applications sur le cloud.
`
  }
];
