# **App Name**: Git Explorer

> **⚠️ DOCUMENT ARCHIVÉ — NE PAS SUIVRE**
>
> **Nature** : blueprint initial généré par Firebase Studio, à l'époque où
> l'application s'appelait « Git Explorer » et ne traitait que Git/GitHub.
>
> **Pourquoi il est ici et non à la racine** : il documente l'origine du projet,
> mais **contredit la charte cible de Katalyst** — il prescrit un fond sombre
> (`#303030`), là où la charte retenue est « 1 seul accent (navy), fond blanc,
> neutres ». Il n'est plus référencé par aucun document du plan.
>
> **Ne pas s'en servir comme référence de conception.** Conservé pour la
> traçabilité historique uniquement. Voir `@.kiro/steering/project-context.md`
> pour le contexte réel du projet.
>
> Archivé le 2026-09-23.

## Core Features:

- Interactive Tutorials: Interactive tutorial content on Git and GitHub.
- Command Guides: Step-by-step guides for common Git commands.
- Contextual AI Help: AI-powered tool that provides context-aware help for each Git command based on the user's current state in the tutorial.
- Simulated Git Environment: A console-like UI, embedded in the application, where users can directly input and execute Git commands.
- File Explorer Panel: A local file explorer interface.
- Progress Tracking: Progress tracking to show completed tutorials and mastered commands.

## Style Guidelines:

- Primary color: Dark blue (#3F51B5) for a professional and focused feel.
- Background color: Dark gray (#303030) to reduce eye strain in a dark mode environment.
- Accent color: Cyan (#00BCD4) for interactive elements and highlights, creating contrast and clarity.
- Body and headline font: 'Inter', a grotesque-style sans-serif, will give a modern and neutral look to the app's text, making it suitable for both headlines and body text.
- Code font: 'Source Code Pro' for displaying Git commands and file contents.
- Minimalist icons representing Git commands, file types, and tutorial progress.
- Split-screen layout: tutorial content on the left, and simulated Git environment on the right.