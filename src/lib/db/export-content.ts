import { config as loadEnv } from 'dotenv';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { closePool, query } from './pool';

/**
 * Répercute dans `src/data/tutorials.json` les corrections saisies en base (T6.8h).
 *
 * ⚠️ **Pourquoi c'est indispensable, et pas seulement confortable.**
 * Le seed (`db:seed`) relit `src/data/*.json` et **écrase** la base. Sans cet export, tout
 * `npm run db:seed` — y compris celui d'une machine neuve ou de la CI — ramènerait les
 * objectifs d'origine, viderait les `bloomLevel` et déconvertirait les 7 leçons Git.
 * La conformité ne serait plus **rejouable** : elle redeviendrait un état local fragile.
 *
 * ⚠️ Le fichier est réécrit **en préservant l'ordre des clés et l'indentation** du JSON
 * source : le diff git reste lisible, on voit exactement quelle leçon a changé.
 *
 * Usage :
 *   npm run db:export-content              # simulation (affiche le diff)
 *   npm run db:export-content -- --apply   # écrit tutorials.json
 */

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

const APPLY = process.argv.includes('--apply');

const DATA_DIR = join(process.cwd(), 'src', 'data');

type JsonLesson = {
  id: string;
  title: string;
  objective?: string;
  interactiveComponentName?: string;
  bloomLevel?: string;
  [key: string]: unknown;
};

type JsonTutorial = {
  id: string;
  lessons?: JsonLesson[];
  [key: string]: unknown;
};

type LessonRow = {
  id: string;
  chapter_id: string;
  source_id: string;
  title: string;
  objective: string;
  bloom_level: string | null;
  interactive_component_name: string | null;
};

async function main(): Promise<void> {
  console.log('');
  console.log('  Export base → src/data/tutorials.json');
  console.log(`  Mode : ${APPLY ? 'ÉCRITURE' : 'simulation (utiliser --apply pour écrire)'}`);
  console.log('');

  // ⚠️ La clé d'appariement est `(chapter_id, source_id)`, **pas** `id`.
  // Le seed construit l'`id` en base (`{tutorial}__{n}`) à partir de la position ; seul
  // `source_id` conserve l'identifiant du JSON (`1-1`, `2-3`…). Et `source_id` n'est unique
  // **que dans son chapitre** : « 1-1 » existe dans plusieurs formations. Apparier sur `id`
  // ne trouvait rien ; apparier sur `source_id` seul aurait mélangé les formations.
  const { rows } = await query<LessonRow>(
    'SELECT id, chapter_id, source_id, title, objective, bloom_level, interactive_component_name FROM lessons',
  );
  const parCle = new Map(rows.map((row) => [`${row.chapter_id}::${row.source_id}`, row]));

  const chemin = join(DATA_DIR, 'tutorials.json');
  const tutorials = JSON.parse(readFileSync(chemin, 'utf8')) as JsonTutorial[];

  let objectifs = 0;
  let niveaux = 0;
  let composants = 0;
  const nonTrouvees: string[] = [];

  for (const tutorial of tutorials) {
    for (const lesson of tutorial.lessons ?? []) {
      const fait = parCle.get(`${tutorial.id}::${lesson.id}`);

      if (!fait) {
        nonTrouvees.push(`${tutorial.id} / ${lesson.id}`);
        continue;
      }

      if (lesson.objective !== fait.objective) {
        lesson.objective = fait.objective;
        objectifs++;
      }

      if (fait.bloom_level && lesson.bloomLevel !== fait.bloom_level) {
        lesson.bloomLevel = fait.bloom_level;
        niveaux++;
      }

      // ⚠️ Un composant interactif **retiré** en base doit l'être aussi ici : sinon le seed
      // ressusciterait l'ancien type de la leçon (le seed déduit le type de ce champ).
      const composantBase = fait.interactive_component_name ?? undefined;
      if (composantBase && lesson.interactiveComponentName !== composantBase) {
        lesson.interactiveComponentName = composantBase;
        composants++;
      }
    }
  }

  console.log(`  Leçons mises à jour :`);
  console.log(`    objectifs      : ${objectifs}`);
  console.log(`    niveaux Bloom  : ${niveaux}`);
  console.log(`    composants     : ${composants}`);
  console.log('');
  console.log(`  Leçons du JSON absentes de la base : ${nonTrouvees.length}`);
  for (const item of nonTrouvees.slice(0, 10)) {
    console.log(`    ⚠️ ${item}`);
  }
  console.log('');

  if (objectifs + niveaux + composants === 0) {
    console.log('  Rien à écrire — le JSON est déjà à jour.');
    return;
  }

  if (!APPLY) {
    console.log('  Simulation terminée — aucune écriture. Relancer avec --apply.');
    return;
  }

  // Indentation 2 espaces : c'est celle du fichier d'origine.
  writeFileSync(chemin, `${JSON.stringify(tutorials, null, 2)}\n`, 'utf8');
  console.log('  ✔ src/data/tutorials.json mis à jour.');
  console.log('');
}

main()
  .then(() => closePool())
  .catch(async (error) => {
    console.error('Échec :', error instanceof Error ? error.message : error);
    await closePool();
    process.exit(1);
  });
