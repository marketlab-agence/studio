import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Lint des catalogues de traduction (REQ-I18N-05).
 *
 * ⚠️ **On compare les CLÉS, pas les valeurs.** Une valeur différente est normale
 * (c'est la traduction) ; une clé absente est un bug qui produirait un libellé vide
 * ou une erreur chez l'utilisateur.
 *
 * ⚠️ **Ce lint ne peut être bloquant que si l'extraction est terminée.** Sur une
 * interface à moitié extraite, il échouerait sans raison utile — c'est pourquoi il
 * n'est branché sur la CI qu'à la fin de la phase 8.
 */
const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES = ['fr', 'en'];

function chargerCatalogue(locale) {
  return JSON.parse(readFileSync(join(racine, 'locales', locale, 'translation.json'), 'utf8'));
}

/** Aplatit un objet imbriqué en `domaine.sousCle`. */
function aplatir(objet, prefixe = '') {
  return Object.entries(objet).flatMap(([cle, valeur]) => {
    const chemin = prefixe ? `${prefixe}.${cle}` : cle;
    return valeur && typeof valeur === 'object' && !Array.isArray(valeur)
      ? aplatir(valeur, chemin)
      : [[chemin, valeur]];
  });
}

/**
 * Extrait les variables d'interpolation d'une chaîne ICU (`{count}`, `{name}`).
 *
 * ⚠️ **Pourquoi ce contrôle existe.** `next-intl` interpole les valeurs passées à
 * `t('cle', { count })`. Si la clé française attend `{count}` et que l'anglaise ne
 * le contient pas, la traduction anglaise affiche un texte figé — ou pire, une
 * valeur manquante. La comparaison des seules clés ne le verrait pas.
 */
function variables(texte) {
  return [...String(texte).matchAll(/\{(\w+)/g)].map((m) => m[1]).sort();
}

/**
 * Clés **dynamiques** connues : construites à l'exécution, donc invisibles au
 * typecheck ET à la comparaison automatique.
 *
 * ⚠️ **Elles sont listées ici pour ne pas être oubliées.** Chaque entrée est
 * vérifiée explicitement : la liste est courte, et une clé dynamique non listée
 * serait une zone d'ombre silencieuse.
 *
 * `prefixe` : on vérifie qu'il existe **au moins une clé** commençant par ce
 * préfixe. `features.items` est un objet (`items.<clé>.title`), pas une clé
 * feuille — vérifier la clé exacte échouerait à tort.
 */
const CLES_DYNAMIQUES = [
  {
    fichier: 'src/app/[locale]/features/page.tsx',
    motif: 'items.<clé>.title / items.<clé>.description',
    prefixe: 'features.items.',
  },
  {
    fichier: 'src/app/[locale]/login/page.tsx',
    motif: 'auth.<clé OAuth> (table OAUTH_ERROR_KEYS)',
    cle: 'auth.oauthGoogleUnavailable',
  },
  {
    fichier: 'src/components/layout/LocaleSwitcher.tsx',
    motif: 'localeSwitcher.<locale>',
    cle: 'localeSwitcher.fr',
  },
];

/** Parcourt récursivement les fichiers `.ts`/`.tsx` sous `src/`. */
function fichiersSource(dossier) {
  const resultats = [];
  for (const entree of readdirSync(dossier)) {
    if (entree === 'node_modules' || entree.startsWith('.')) continue;
    const chemin = join(dossier, entree);
    if (statSync(chemin).isDirectory()) resultats.push(...fichiersSource(chemin));
    else if (/\.tsx?$/.test(chemin)) resultats.push(chemin);
  }
  return resultats;
}

const catalogues = Object.fromEntries(LOCALES.map((l) => [l, chargerCatalogue(l)]));
const aplatissements = Object.fromEntries(
  LOCALES.map((l) => [l, Object.fromEntries(aplatir(catalogues[l]))]),
);

const erreurs = [];
const avertissements = [];

// --- 1. Parité des clés FR/EN ---------------------------------------------
const clesFr = new Set(Object.keys(aplatissements.fr));
const clesEn = new Set(Object.keys(aplatissements.en));

for (const cle of clesFr) {
  if (!clesEn.has(cle)) erreurs.push(`absente en EN : ${cle}`);
}
for (const cle of clesEn) {
  if (!clesFr.has(cle)) erreurs.push(`absente en FR : ${cle}`);
}

// --- 2. Valeurs vides -----------------------------------------------------
for (const locale of LOCALES) {
  for (const [cle, valeur] of Object.entries(aplatissements[locale])) {
    if (typeof valeur === 'string' && valeur.trim() === '') {
      erreurs.push(`valeur vide en ${locale.toUpperCase()} : ${cle}`);
    }
  }
}

// --- 3. Variables d'interpolation ----------------------------------------
for (const cle of clesFr) {
  if (!clesEn.has(cle)) continue;
  const attendues = variables(aplatissements.fr[cle]).join(',');
  const trouvees = variables(aplatissements.en[cle]).join(',');
  if (attendues !== trouvees) {
    erreurs.push(
      `variables différentes pour ${cle} : FR={${attendues}} EN={${trouvees}}`,
    );
  }
}

// --- 4. Clés dynamiques connues ------------------------------------------
for (const entree of CLES_DYNAMIQUES) {
  for (const locale of LOCALES) {
    const label = locale.toUpperCase();

    if (entree.cle) {
      if (!aplatissements[locale][entree.cle]) {
        erreurs.push(`clé dynamique disparue en ${label} : ${entree.cle} (${entree.fichier})`);
      }
      continue;
    }

    // Préfixe : au moins une clé feuille doit exister sous ce préfixe.
    const existe = Object.keys(aplatissements[locale]).some((cle) =>
      cle.startsWith(entree.prefixe),
    );
    if (!existe) {
      erreurs.push(
        `clé dynamique disparue en ${label} : aucun élément sous « ${entree.prefixe} » (${entree.fichier})`,
      );
    }
  }
}

// --- 5. Clés déclarées mais jamais utilisées ------------------------------
// ⚠️ Avertissement seulement : une clé peut être légitime (usage prévu, clé
// dynamique non détectée). Le but est de repérer les **oublis**, pas d'interdire.
const sources = fichiersSource(join(racine, 'src'))
  .map((chemin) => readFileSync(chemin, 'utf8'))
  .join('\n');

const domainesUtilises = new Set();
for (const domaine of Object.keys(catalogues.fr)) {
  if (sources.includes(`'${domaine}'`) || sources.includes(`"${domaine}"`)) {
    domainesUtilises.add(domaine);
  }
}
for (const domaine of Object.keys(catalogues.fr)) {
  if (!domainesUtilises.has(domaine)) {
    avertissements.push(`domaine jamais référencé dans le code : ${domaine}`);
  }
}

// --- Rapport --------------------------------------------------------------
const totalCles = clesFr.size;

console.log('');
console.log(`  Lint i18n — ${totalCles} clés par langue (${LOCALES.join(', ')})`);
console.log('');

if (avertissements.length > 0) {
  console.log(`  ⚠️  ${avertissements.length} avertissement(s) :`);
  for (const a of avertissements) console.log(`      ${a}`);
  console.log('');
}

if (erreurs.length > 0) {
  console.error(`  ✖ ${erreurs.length} erreur(s) :`);
  for (const e of erreurs) console.error(`      ${e}`);
  console.error('');
  process.exit(1);
}

console.log(`  ✔ Catalogues cohérents : ${totalCles} clés, parité FR/EN, interpolation et clés dynamiques vérifiées.`);
console.log('');
