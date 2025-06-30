# Méta-Workflow de Création de Formation

Ce document décrit un workflow basé sur plusieurs prompts pour guider la création d'une nouvelle formation de A à Z. Ce processus a pour but de structurer la génération de contenu et de code, en assurant la cohérence et la qualité.

La variable `"{theme}"` doit être remplacée par le sujet de la formation (ex: "Docker", "Figma", "Closing de Vente").

---

### Prompt 1 : Génération du Plan de Cours

**Objectif :** Créer la structure pédagogique de haut niveau du tutoriel.

**Prompt :**
> Create a "{theme}" tutorial outline for beginners. This outline will be used to create an interactive/visual tutorial, visualizing confusing topics for beginners to grasp when it comes to learning "{theme}" in general. An example is how branching works. The interactive tutorial should be able to visualize the flow of history in a timeline. That's just an example. Feel free to provide what's best.

---

### Prompt 2 : Génération de l'Architecture des Composants

**Objectif :** Définir la liste des composants React/Next.js nécessaires pour construire l'interface du tutoriel, en se basant sur le plan de cours généré à l'étape 1.

**Prompt :**
> [Résultat du Prompt 1]
> +
> I'm developing an interactive "{theme}" tutorial. Based on the above outline, please generate the list (do not implement) of front-end Next.js/React components. Follow best practices in designing the component structure, utilizing reusability, maintainability, and testability.

---

### Prompt 3 : Génération du Diagramme de Flux de l'UI

**Objectif :** Créer un diagramme visuel qui montre comment les composants interagissent entre eux et comment l'utilisateur navigue à travers l'application.

**Prompt :**
> Generate a UI flow diagram based on the Results of Prompt 2.

---

### Prompt 4 : Conception du Layout

**Objectif :** Définir le design général du layout de l'application en se basant sur le diagramme de flux.

**Prompt :**
> I'm developing an interactive "{theme}" tutorial. Refer to the results of UI layout from Prompt 3 to adopt a layout design. Make it dark mode by default.

---

### Prompt 5 : Création des Composants de Layout

**Objectif :** Générer le code pour les composants de layout principaux, avec du contenu de remplacement (placeholder).

**Prompt :**
> Create all the components under the Core Layout components, making sure to add placeholder content.
