/**
 * Vérifie la cohérence de la version du projet.
 *
 * `VERSION` est la source unique de vérité (SSoT). Toute source divergente
 * fait échouer le script (code de sortie 1), ce qui permet de l'utiliser en CI.
 *
 * Usage : npm run check:version
 */
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(relativePath) {
  const full = join(root, relativePath);
  if (!existsSync(full)) return null;
  return readFileSync(full, 'utf8');
}

const versionFile = read('VERSION');
if (versionFile === null) {
  console.error('✖ Fichier VERSION introuvable à la racine du projet.');
  process.exit(1);
}
const reference = versionFile.trim();

if (!reference) {
  console.error('✖ Le fichier VERSION est vide.');
  process.exit(1);
}

/** Sources à aligner sur VERSION. */
const sources = [];

const packageJson = read('package.json');
if (packageJson) {
  sources.push({ name: 'package.json', value: JSON.parse(packageJson).version });
}

const mismatches = sources.filter((source) => source.value !== reference);

console.log(`VERSION (référence) : ${reference}`);
for (const source of sources) {
  const status = source.value === reference ? '✔' : '✖';
  console.log(`  ${status} ${source.name} : ${source.value}`);
}

if (mismatches.length > 0) {
  console.error(`\n✖ Dérive de version détectée sur ${mismatches.length} source(s).`);
  console.error(`  Aligner sur VERSION = ${reference} (voir .kiro/hooks/version-update.md).`);
  process.exit(1);
}

console.log('\n✔ Version cohérente.');
