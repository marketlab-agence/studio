# Orientation Principale pour l'Initialisation de Firebase Admin

Ce document sert de guide **obligatoire** pour toute initialisation du SDK Firebase Admin dans ce projet. Il a été créé pour éviter la récurrence d'erreurs de syntaxe (`SyntaxError: Unterminated regexp literal` ou `Invalid regular expression`) liées au traitement de la variable d'environnement `FIREBASE_PRIVATE_KEY`.

## Le Problème

La variable d'environnement `FIREBASE_PRIVATE_KEY` contient des caractères de nouvelle ligne (`
`). Lors de la lecture de cette variable dans Node.js, des tentatives de remplacement via des expressions régulières littérales (`.replace(/
/g, '
')`) se sont avérées peu fiables et ont causé des erreurs de build de manière répétée, probablement à cause de la manière dont les outils ou l'environnement interprètent les chaînes de caractères sur plusieurs lignes.

## La Solution Obligatoire

Pour garantir une initialisation robuste et sans erreur, **TOUTE** initialisation du `serviceAccount` pour Firebase Admin **DOIT** utiliser la méthode suivante. Cette approche construit la `RegExp` et le caractère de remplacement via leurs codes de caractères (`fromCharCode`), ce qui la rend insensible aux problèmes de parsing.

### Snippet de Code de Référence

Voici la seule formulation correcte et autorisée pour l'objet `serviceAccount` :

```javascript
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(new RegExp(String.fromCharCode(92) + String.fromCharCode(110), 'g'), String.fromCharCode(10)), // Extremely robust privateKey handling
};
```

### Explication de la méthode

*   `String.fromCharCode(92)` crée un backslash (`\`).
*   `String.fromCharCode(110)` crée la lettre `n`.
*   `new RegExp(String.fromCharCode(92) + String.fromCharCode(110), 'g')` construit dynamiquement l'expression régulière `/
/g`.
*   `String.fromCharCode(10)` crée un véritable caractère de nouvelle ligne (`
`).

Cette méthode est à appliquer dans tous les contextes côté serveur, notamment dans :
- `src/lib/firebase-admin.ts`
- `scripts/migrate-data.js`
- Tout autre script ou module serveur qui aurait besoin d'initialiser le SDK Admin.
