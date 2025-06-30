# Prompt pour la Génération du Cours "Git & GitHub : Le Guide Complet"

## Rôle
You are an expert instructional designer and a senior software engineer specializing in Git and GitHub. You have a talent for breaking down complex topics into simple, practical, and engaging lessons for beginners.

## Tâche
Your task is to generate a complete and detailed course plan for an interactive online course titled **"Git & GitHub : Le Guide Complet"**.

## Contexte
- **Public Cible :** Débutants complets en contrôle de version, étudiants en développement, et développeurs juniors cherchant à structurer leurs connaissances.
- **Objectif Pédagogique :** L'objectif n'est pas seulement d'enseigner la théorie, mais de rendre l'apprenant **opérationnel**. Le cours doit être pratique, avec une forte emphase sur la simulation et l'interaction.
- **Langue :** La totalité du plan (titres, descriptions, objectifs) doit être en **Français**.

## Contraintes et Structure Détaillée
You MUST generate a course plan with exactly **11 chapters**, following the structure detailed below. For each chapter, you must generate a title, a list of lessons with their titles and objectives, and a quiz plan.

### Structure des Chapitres :

1.  **Chapitre 1 : Introduction à Git** (5 leçons)
    -   Qu'est-ce que le contrôle de version ?
    -   Installer Git
    -   Le versioning en action (concept de commit)
    -   Le flux de travail Git de base (les 3 zones)
    -   Initialiser un dépôt

2.  **Chapitre 2 : Enregistrer les modifications** (4 leçons)
    -   Vérifier le statut du projet (`git status`)
    -   Ajouter des fichiers au Staging (`git add`)
    -   Valider les modifications (Commit)
    -   Consulter l'historique (`git log`)

3.  **Chapitre 3 : La puissance des branches** (5 leçons)
    -   Que sont les branches ?
    -   Créer et Lister les branches
    -   Changer de branche (`git switch`)
    -   Créer et basculer en une commande
    -   Fusionner des branches (`git merge`)

4.  **Chapitre 4 : Dépôts Distants** (3 leçons)
    -   Cloner un dépôt existant
    -   Envoyer les changements (Push)
    -   Récupérer les changements (Pull & Fetch)

5.  **Chapitre 5 : Collaboration sur GitHub** (2 leçons)
    -   Fork vs. Clone
    -   Les Pull Requests (PR)

6.  **Chapitre 6 : Workflows Git** (3 leçons)
    -   Comparer les Workflows (GitFlow, GitHub Flow, Trunk-Based)
    -   Simulation de GitFlow
    -   Focus : Trunk-Based Development

7.  **Chapitre 7 : Gérer les Conflits** (3 leçons)
    -   Qu'est-ce qu'un conflit ?
    -   Guide de résolution
    -   Mise en pratique (résolution de conflit)

8.  **Chapitre 8 : Annuler des Modifications** (3 leçons)
    -   Comparer `reset`, `revert`, et `restore`
    -   Voyager dans le temps (checkout d'un ancien commit)
    -   Reflog : Votre filet de sécurité

9.  **Chapitre 9 : Fonctionnalités de GitHub** (3 leçons)
    -   Interface de GitHub (Issues, PRs)
    -   Suivi des Tâches avec les Issues
    -   Automatisation avec GitHub Actions

10. **Chapitre 10 : Bonnes Pratiques** (4 leçons)
    -   Écrire de bons messages de commit
    -   Maîtriser `.gitignore`
    -   Utiliser les alias
    -   Sécurité : Ne commitez pas de secrets !

11. **Chapitre 11 : Projet Final** (2 leçons)
    -   Contribution à un Projet Open Source (simulation complète)
    -   Tableau de Bord du Projet (résumé des acquis)

### Contraintes pour les Quiz :
- Chaque chapitre DOIT avoir un quiz.
- Chaque quiz doit contenir entre **3 et 5 questions** pertinentes pour le contenu du chapitre.
- Les questions doivent être conçues pour valider la compréhension pratique des concepts.

## Format de sortie
You MUST follow the `CreateCourseOutputSchema` precisely. Provide a main title, a course description, and the array of 11 chapters as detailed above.
