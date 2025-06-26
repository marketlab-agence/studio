# Architecture des Composants - Tutoriel GitHub Interactif

## 🏗️ Structure des Dossiers
```
src/
├── components/
│   ├── layout/
│   ├── ui/
│   ├── tutorial/
│   ├── interactive/
│   ├── visualizations/
│   └── providers/
├── hooks/
├── contexts/
├── utils/
├── types/
├── tests/
│   ├── components/
│   ├── hooks/
│   └── utils/
├── stories/
│   ├── components/
│   └── pages/
├── mocks/
│   ├── handlers/
│   └── data/
└── queries/
    ├── mutations/
    └── queries/
```

## 📱 Composants de Layout

### `components/layout/`
- **`TutorialLayout.tsx`** - Layout principal avec navigation et progression
- **`SidebarNavigation.tsx`** - Menu latéral avec chapitres et sous-sections
- **`ProgressBar.tsx`** - Barre de progression générale du tutoriel
- **`ChapterHeader.tsx`** - En-tête de chapitre avec titre et objectifs
- **`BreadcrumbNavigation.tsx`** - Fil d'Ariane pour la navigation

## 🎨 Composants UI Réutilisables

### `components/ui/`
- **`Button.tsx`** - Bouton avec variantes (primary, secondary, danger, etc.)
- **`Card.tsx`** - Carte avec header, body, footer optionnels
- **`Modal.tsx`** - Modale réutilisable avec overlay
- **`Tooltip.tsx`** - Info-bulle contextuelle
- **`Badge.tsx`** - Badge de statut/catégorie
- **`Tabs.tsx`** - Onglets horizontaux
- **`Accordion.tsx`** - Accordéon pour sections expandables
- **`Alert.tsx`** - Messages d'alerte (succès, erreur, info)
- **`CodeBlock.tsx`** - Bloc de code avec coloration syntaxique
- **`Terminal.tsx`** - Simulateur de terminal
- **`LoadingSpinner.tsx`** - Indicateur de chargement
- **`AnimatedIcon.tsx`** - Icônes animées (Git, GitHub, etc.)

## 📚 Composants de Tutoriel

### `components/tutorial/`
- **`ChapterIntro.tsx`** - Introduction de chapitre avec objectifs
- **`LessonContent.tsx`** - Contenu de leçon avec texte et médias
- **`StepByStep.tsx`** - Guide étape par étape numéroté
- **`ConceptExplanation.tsx`** - Explication de concept avec visuels
- **`QuizQuestion.tsx`** - Question de quiz interactif
- **`PracticeExercise.tsx`** - Exercice pratique guidé
- **`ChapterSummary.tsx`** - Résumé de fin de chapitre
- **`NavigationControls.tsx`** - Boutons précédent/suivant
- **`BookmarkButton.tsx`** - Marque-page pour sauvegarder la progression

## 🎮 Composants Interactifs

### `components/interactive/`
- **`GitCommandSimulator.tsx`** - Simulateur de commandes Git
- **`GitRepositoryPlayground.tsx`** - Bac à sable Git interactif
- **`BranchCreator.tsx`** - Créateur de branches interactif
- **`MergeSimulator.tsx`** - Simulateur de fusion de branches
- **`ConflictResolver.tsx`** - Résolveur de conflits interactif
- **`PullRequestCreator.tsx`** - Créateur de Pull Request simulé
- **`WorkflowDesigner.tsx`** - Designer de workflow Git
- **`GitTimeTravel.tsx`** - Machine à remonter le temps Git
- **`CollaborationSimulator.tsx`** - Simulateur de collaboration
- **`GitDoctorTool.tsx`** - Outil de récupération d'erreurs

## 📊 Composants de Visualisation

### `components/visualizations/`
- **`CommitTimeline.tsx`** - Frise chronologique des commits
- **`BranchDiagram.tsx`** - Diagramme de branches animé
- **`GitGraph.tsx`** - Graphe Git interactif
- **`RepoComparison.tsx`** - Comparaison local vs distant
- **`DiffViewer.tsx`** - Visualiseur de différences
- **`FileTreeViewer.tsx`** - Arborescence de fichiers
- **`NetworkGraph.tsx`** - Graphe de réseau des contributeurs
- **`StatisticsChart.tsx`** - Graphiques de statistiques Git
- **`AnimatedFlow.tsx`** - Flux animés (push/pull/fetch)
- **`ConceptDiagram.tsx`** - Diagrammes de concepts

## 🎯 Composants Spécialisés par Chapitre

### Partie 1 - Introduction
- **`GitVsGitHubComparison.tsx`** - Comparaison visuelle Git vs GitHub
- **`VersioningDemo.tsx`** - Démonstration du versioning
- **`LocalVsRemoteVisual.tsx`** - Visualisation local vs distant

### Partie 2 - Repositories & Commits
- **`RepoCreationWizard.tsx`** - Assistant de création de dépôt
- **`StagingAreaVisualizer.tsx`** - Visualiseur de zone de staging
- **`CommitHistoryExplorer.tsx`** - Explorateur d'historique

### Partie 3 - Branches & Fusions
- **`BranchAnimator.tsx`** - Animateur de branches
- **`MergeTypeComparison.tsx`** - Comparaison types de fusion
- **`BranchSandbox.tsx`** - Bac à sable de branches

### Partie 4 - Dépôts Distants
- **`RemoteConnectionVisual.tsx`** - Visualisation connexions distantes
- **`PushPullAnimator.tsx`** - Animateur push/pull
- **`SyncStatusIndicator.tsx`** - Indicateur de synchronisation

### Partie 5 - Collaboration
- **`ForkVsCloneDemo.tsx`** - Démonstration Fork vs Clone
- **`PRWorkflowSimulator.tsx`** - Simulateur de workflow PR
- **`CodeReviewInterface.tsx`** - Interface de revue de code

### Partie 6 - Workflows
- **`WorkflowComparisonTable.tsx`** - Tableau comparatif workflows
- **`FlowDiagramBuilder.tsx`** - Constructeur de diagrammes
- **`WorkflowSimulator.tsx`** - Simulateur de workflow

### Partie 7 - Conflits
- **`ConflictVisualizer.tsx`** - Visualiseur de conflits
- **`ConflictPlayground.tsx`** - Terrain de jeu pour conflits
- **`ResolutionGuide.tsx`** - Guide de résolution

### Partie 8 - Annulation
- **`UndoCommandComparison.tsx`** - Comparaison commandes d'annulation
- **`TimelineNavigator.tsx`** - Navigateur de timeline
- **`ReflogExplorer.tsx`** - Explorateur reflog

### Partie 9 - Fonctionnalités GitHub
- **`GitHubInterfaceSimulator.tsx`** - Simulateur interface GitHub
- **`IssueTracker.tsx`** - Traqueur d'issues
- **`ActionsWorkflowBuilder.tsx`** - Constructeur GitHub Actions

### Partie 10 - Projet Final
- **`OpenSourceSimulator.tsx`** - Simulateur contribution open source
- **`ProjectDashboard.tsx`** - Tableau de bord de projet
- **`CertificateGenerator.tsx`** - Générateur de certificat

## 🔧 Composants de Contexte et Providers

### `components/providers/`
- **`TutorialProvider.tsx`** - Contexte de progression du tutoriel
- **`ThemeProvider.tsx`** - Contexte de thème (clair/sombre)
- **`NotificationProvider.tsx`** - Contexte de notifications
- **`UserProgressProvider.tsx`** - Contexte de progression utilisateur
- **`QueryProvider.tsx`** - Provider React Query pour gestion d'état

## 🎣 Hooks Personnalisés

### `hooks/`
- **`useTutorialProgress.ts`** - Gestion de la progression
- **`useAnimations.ts`** - Gestion des animations avec Framer Motion
- **`useLocalStorage.ts`** - Persistance locale
- **`useKeyboardShortcuts.ts`** - Raccourcis clavier
- **`useGitSimulation.ts`** - Simulation Git
- **`useNotifications.ts`** - Gestion des notifications
- **`useResponsive.ts`** - Gestion responsive
- **`useDebounce.ts`** - Debouncing pour les interactions
- **`useQuery.ts`** - Hooks React Query personnalisés
- **`useMutation.ts`** - Hooks de mutation React Query
- **`useInfiniteQuery.ts`** - Pagination avec React Query

## 📋 Types et Interfaces

### `types/`
- **`tutorial.types.ts`** - Types du tutoriel
- **`git.types.ts`** - Types Git/GitHub
- **`ui.types.ts`** - Types UI
- **`animation.types.ts`** - Types d'animations

## 🛠️ Utilitaires

### `utils/`
- **`git-commands.ts`** - Utilitaires commandes Git
- **`animations.ts`** - Utilitaires d'animations Framer Motion
- **`progress-tracking.ts`** - Suivi de progression
- **`code-highlighting.ts`** - Coloration syntaxique
- **`validation.ts`** - Validation des entrées utilisateur
- **`test-utils.tsx`** - Utilitaires de test React Testing Library
- **`mock-handlers.ts`** - Gestionnaires MSW pour les tests

## 🧪 Testing & Documentation

### `tests/`
#### `tests/components/`
- **`Button.test.tsx`** - Tests du composant Button
- **`Modal.test.tsx`** - Tests du composant Modal
- **`GitCommandSimulator.test.tsx`** - Tests du simulateur Git
- **`BranchAnimator.test.tsx`** - Tests de l'animateur de branches
- **`TutorialProvider.test.tsx`** - Tests du provider de tutoriel

#### `tests/hooks/`
- **`useTutorialProgress.test.ts`** - Tests du hook de progression
- **`useAnimations.test.ts`** - Tests du hook d'animations
- **`useGitSimulation.test.ts`** - Tests du hook de simulation Git

#### `tests/utils/`
- **`git-commands.test.ts`** - Tests des utilitaires Git
- **`progress-tracking.test.ts`** - Tests du suivi de progression

### `stories/`
#### `stories/components/`
- **`Button.stories.tsx`** - Stories du composant Button
- **`Card.stories.tsx`** - Stories du composant Card
- **`Modal.stories.tsx`** - Stories du composant Modal
- **`CodeBlock.stories.tsx`** - Stories du bloc de code
- **`Terminal.stories.tsx`** - Stories du terminal
- **`CommitTimeline.stories.tsx`** - Stories de la timeline
- **`BranchDiagram.stories.tsx`** - Stories du diagramme de branches
- **`GitGraph.stories.tsx`** - Stories du graphe Git

#### `stories/pages/`
- **`TutorialPage.stories.tsx`** - Stories des pages de tutoriel
- **`ChapterOverview.stories.tsx`** - Stories de l'aperçu des chapitres

### `mocks/`
#### `mocks/handlers/`
- **`tutorial.handlers.ts`** - Gestionnaires MSW pour le tutoriel
- **`github.handlers.ts`** - Gestionnaires MSW pour GitHub API
- **`progress.handlers.ts`** - Gestionnaires MSW pour la progression

#### `mocks/data/`
- **`tutorial-data.ts`** - Données de test du tutoriel
- **`git-repositories.ts`** - Données de test des dépôts
- **`user-progress.ts`** - Données de test de progression

## 🔄 Gestion d'État avec React Query

### `queries/`
#### `queries/queries/`
- **`tutorial.queries.ts`** - Requêtes pour les données de tutoriel
- **`progress.queries.ts`** - Requêtes pour la progression utilisateur
- **`github.queries.ts`** - Requêtes pour l'API GitHub

#### `queries/mutations/`
- **`progress.mutations.ts`** - Mutations pour la progression
- **`settings.mutations.ts`** - Mutations pour les paramètres
- **`completion.mutations.ts`** - Mutations pour les achèvements

## 🎨 Principes de Design Adoptés

### ✅ Réutilisabilité
- Composants UI atomiques et composables
- Props configurables et defaults sensés
- Système de variantes pour les styles
- **Storybook** pour documentation et développement isolé

### ✅ Maintenabilité
- Séparation claire des responsabilités
- Structure modulaire par fonctionnalité
- Types TypeScript stricts
- **ESLint/Prettier** pour la cohérence du code

### ✅ Testabilité
- Composants purs sans effets de bord
- Props injectables pour le testing
- Séparation logique métier / présentation
- **React Testing Library** pour tests comportementaux
- **MSW** pour mocker les API calls
- **Jest** pour les tests unitaires

### ✅ Performance
- Lazy loading des composants lourds
- Memoization des calculs coûteux
- Optimisation des re-renders
- **React Query** pour cache intelligent et synchronisation

### ✅ Accessibilité
- Support des lecteurs d'écran
- Navigation au clavier
- Contrastes et tailles adaptés
- **Testing Library** pour vérifier l'accessibilité

### ✅ Animations
- **Framer Motion** pour animations fluides et performantes
- Transitions cohérentes entre les états
- Animations accessibles (respect des préférences utilisateur)

## 📦 Configuration des Dépendances

### Package.json - Dépendances principales
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "framer-motion": "^10.16.0",
    "@tanstack/react-query": "^5.0.0",
    "typescript": "^5.0.0"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "@storybook/react": "^7.0.0",
    "@storybook/addon-essentials": "^7.0.0",
    "msw": "^2.0.0",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0"
  }
}
```

## ⚙️ Configuration des Outils

### `.storybook/main.js`
```javascript
module.exports = {
  stories: ['../src/stories/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y'
  ],
  framework: '@storybook/react'
}
```

### `jest.config.js`
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*): '<rootDir>/src/$1'
  }
}
```

### `src/tests/setup.ts`
```typescript
import '@testing-library/jest-dom'
import { server } from '../mocks/server'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```