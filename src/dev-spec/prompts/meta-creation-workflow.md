# Méta-Workflow de Création de Formation

Ce document décrit un workflow basé sur plusieurs prompts pour guider la création d'une nouvelle formation de A à Z. Ce processus a pour but de structurer la génération de contenu et de code, en assurant la cohérence et la qualité, à l'image du cours "Git & GitHub : Le Guide Complet".

Les variables suivantes doivent être remplacées par les valeurs correspondantes du formulaire "atelier de création de cours" :
- `"{theme}"` : Le sujet de la formation (ex: "Docker", "Figma", "Closing de Vente").
- `"{language}"` : La langue de la formation (ex: "Français", "English", "Español").

---

### Prompt 1 : Génération du Plan de Cours

**Objectif :** Créer la structure pédagogique de haut niveau du tutoriel, y compris les chapitres, les leçons, leurs objectifs spécifiques, et les plans de quiz. Le plan doit être complet, détaillé et orienté vers l'aspect pratique et interactif.

**Prompt :**
> You are an expert instructional designer and a senior software engineer specializing in "{theme}". You have a talent for breaking down complex topics into simple, practical, and engaging lessons for beginners.
>
> Your task is to generate a complete and detailed course plan for an interactive online course titled **"{theme} : Le Guide Complet"**.
>
> **Contexte :**
> - **Public Cible :** Débutants complets en "{theme}", étudiants en développement, et développeurs juniors cherchant à structurer leurs connaissances.
> - **Objectif Pédagogique :** L'objectif n'est pas seulement d'enseigner la théorie, mais de rendre l'apprenant **opérationnel**. Le cours doit être pratique, avec une forte emphase sur la simulation et l'interaction.
> - **Langue :** La totalité du plan (titres, descriptions, objectifs) doit être en **{language}**.
> - **Structure :** Le cours doit comporter un nombre défini de chapitres (par exemple, 11 comme pour le cours Git & GitHub). Chaque chapitre doit inclure un titre, une liste de leçons avec leurs titres et objectifs, et un plan de quiz.
>
> **Contraintes pour les Quiz :**
> - Chaque chapitre DOIT avoir un quiz.
> - Chaque quiz doit contenir entre **3 et 5 questions** pertinentes pour le contenu du chapitre.
> - Les questions doivent être conçues pour valider la compréhension pratique des concepts.
>
> **Format de sortie :** Vous devez suivre un schéma de sortie précis (similaire à `CreateCourseOutputSchema`), fournissant un titre principal, une description du cours, et un tableau des chapitres structurés comme détaillé ci-dessus.

---

### Prompt 2 : Génération de l'Architecture des Composants

**Objectif :** Définir la liste des composants React/Next.js nécessaires pour construire l'interface du tutoriel, en se basant sur le plan de cours généré à l'étape 1, en mettant l'accent sur la réutilisabilité et la capacité à visualiser des concepts complexes.

**Prompt :**
> [Résultat du Prompt 1]
> +
> I'm developing an interactive "{theme}" tutorial. Based on the above detailed course outline, please generate the list (do not implement) of front-end Next.js/React components. Follow best practices in designing the component structure, utilizing reusability, maintainability, and testability. Focus on identifying components that will facilitate the visualization of confusing topics and interactive elements, such as those that could show data flow, historical timelines, or abstract concepts related to "{theme}".

---

### Prompt 3 : Génération du Diagramme de Flux de l'UI

**Objectif :** Créer un diagramme visuel qui montre comment les composants interagissent entre eux et comment l'utilisateur navigue à travers l'application, incluant les chemins pour les visualisations et les interactions.

**Prompt :**
> Generate a detailed UI flow diagram based on the Results of Prompt 2, specifically illustrating user journeys through interactive elements and visualizations.

---

### Prompt 4 : Conception du Layout

**Objectif :** Définir le design général du layout de l'application en se basant sur le diagramme de flux, assurant une expérience utilisateur cohérente et visuellement agréable.

**Prompt :**
> I'm developing an interactive "{theme}" tutorial. Refer to the results of UI layout from Prompt 3 to adopt a layout design. Make it dark mode by default. Ensure the layout can elegantly incorporate complex interactive components and visualizations.

---

### Prompt 5 : Création des Composants de Layout

**Objectif :** Générer le code pour les composants de layout principaux, avec du contenu de remplacement (placeholder), en préparation des futures visualisations et interactions.

**Prompt :**
> Create all the components under the Core Layout components, making sure to add placeholder content. These components should be flexible enough to host various interactive and visual elements.

---

### Prompt 6 : Génération du Contenu Détaillé des Leçons

**Objectif :** Rédiger le contenu textuel détaillé pour chaque leçon, en expliquant les concepts, fournissant des exemples pratiques, et décrivant précisément les éléments interactifs ou visuels à intégrer pour chaque point clé.

**Prompt :**
> [Résultat du Prompt 1 - Plan de cours détaillé]
> [Résultat du Prompt 2 - Architecture des composants]
> +
> Based on the detailed course outline and the identified component architecture, generate the comprehensive content for each lesson. For each lesson:
> 1.  Provide clear, concise, and beginner-friendly explanations of the concepts.
> 2.  Include practical examples and scenarios.
> 3.  **Crucially, for every concept that could benefit from an interactive or visual explanation (as identified in Prompt 1 and Prompt 2), describe in detail what the visualization or interaction should entail.** Specify which component (from Prompt 2's list) would be used and how it should behave to clarify the concept (e.g., "visualisation d'un flux de commits avec ajout/suppression de branches," "simulation de résolution de conflit étape par étape").
> All content must be in **{language}**.

---

### Prompt 7 : Création des Visualisations et Interactions Spécifiques

**Objectif :** Générer le code ou les instructions détaillées pour implémenter les visualisations et les composants interactifs complexes décrits dans le contenu des leçons.

**Prompt :**
> [Résultat du Prompt 6 - Contenu détaillé des leçons avec descriptions des visualisations]
> [Résultat du Prompt 2 - Architecture des composants]
> +
> Based on the detailed descriptions of required visualizations and interactions within the lesson content, generate the specific code snippets (or detailed pseudo-code/instructions if a full implementation is too complex) for these interactive components. Focus on the core logic and visual representation. For each interactive element:
> 1.  Specify the component from Prompt 2 that it corresponds to.
> 2.  Provide the code (e.g., React component code, D3.js visualization logic, state management for interactions) necessary to create the described visualization or interactive experience.
> 3.  Ensure the generated code promotes clarity and understanding of the underlying "{theme}" concepts.
> Prioritize interactive simulations (e.g., Git command simulators, branching sandboxes, conflict resolvers) and dynamic diagrams (e.g., commit timelines, network graphs).

---

### Prompt 8 : Génération des Quiz

**Objectif :** Créer des questions de quiz pratiques et pertinentes (avec des options de réponse et la bonne réponse), basées sur le plan de quiz du Prompt 1 et le contenu détaillé des leçons.

**Prompt :**
> [Résultat du Prompt 1 - Plan de cours détaillé avec quiz]
> [Résultat du Prompt 6 - Contenu détaillé des leçons]
> +
> For each chapter's quiz as outlined in Prompt 1, generate between 3 and 5 multiple-choice questions (or other appropriate formats) that directly assess the practical understanding of the concepts taught in that chapter. For each question:
> 1.  Provide the question text in **{language}**.
> 2.  Provide 3-4 possible answers (also in **{language}**).
> 3.  Clearly indicate the correct answer.
> 4.  (Optional but recommended) Provide a brief explanation for the correct answer or why other answers are incorrect.
> Ensure the questions are clear, unambiguous, and directly relevant to the operational objectives of the course.