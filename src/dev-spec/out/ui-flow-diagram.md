# Diagramme de Flux de l'Interface Utilisateur - Tutoriel Git & GitHub

Ce document décrit le flux de navigation et l'interaction entre les composants pour le tutoriel interactif.

## Légende
- `(Page)`: Une page complète accessible via une URL.
- `[Composant]`: Un composant React réutilisable.
- `-->`: Navigation ou interaction de l'utilisateur.
- `...`: Contenu ou état interne.

## Flux Principal

1.  **(Page) Accueil / Liste des Cours**
    - `[CourseCard]` pour "Git & GitHub"
    - `-->` Clic sur le cours

2.  **(Page) Tableau de Bord / Démarrage du Tutoriel**
    - Affiche `[TutorialLayout]`
    - `[SidebarNavigation]` liste les chapitres/leçons.
    - `[ProgressBar]` montre la progression globale.
    - Contenu principal affiche `[ChapterIntro]` ou la dernière leçon visitée.
    - `-->` Clic sur une leçon dans `[SidebarNavigation]`

3.  **(Page) Vue d'une Leçon**
    - Le `[TutorialLayout]` est actif.
    - `[ChapterHeader]` affiche le titre du chapitre.
    - Le contenu principal affiche `[LessonContent]`.
        - Peut inclure des `[CodeBlock]`.
        - Peut inclure un `[InteractiveComponent]` (ex: `[GitCommandSimulator]`).
        - Peut inclure un `[VisualComponent]` (ex: `[BranchDiagram]`).
    - `[NavigationControls]` ("Précédent" / "Suivant").
    - `-->` Clic sur "Suivant" charge la leçon suivante.
    - `-->` Si dernière leçon du chapitre, "Suivant" devient "Passer le Quiz".

4.  **(Page) Vue du Quiz**
    - Le `[TutorialLayout]` est actif.
    - Le contenu principal affiche `[QuizView]`.
        - `[QuizQuestion]` s'affiche une par une.
    - `-->` Après la dernière question, affiche les résultats.
    - `-->` Si réussi, débloque le chapitre suivant.

## Flux Secondaires

- **(Composant) Terminal Interactif** `[Terminal]`
    - Utilisé dans `[GitCommandSimulator]`.
    - `Input` --> `Output` basé sur une logique de commande simulée.

- **(Composant) Aide IA** `[AiHelper]`
    - Peut être invoqué depuis n'importe quelle leçon.
    - Ouvre une `[Modal]` ou un `[Popover]`.
    - `Input (question)` --> `Output (explication)`.
