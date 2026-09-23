import { config as loadEnv } from 'dotenv';
import { closePool, query, withTransaction } from './pool';
import {
  BLOOM_ALLOWED_LESSON_TYPES,
  BLOOM_LEVELS,
  isLessonTypeCompatibleWithBloom,
  type BloomLevel,
} from '@/lib/content/bloom';

/**
 * Aligne le niveau de Bloom déclaré sur le **type réel** de la leçon (règle R6, T6.8d).
 *
 * ⚠️ **Pourquoi c'est le niveau qui bouge, et pas le type.**
 * Le type de la leçon (`MISE_EN_PRATIQUE`, `TEXTE`, `CAPSULE`…) est une **donnée de conception** :
 * il est déjà implémenté par un composant interactif précis, choisi et testé. Le niveau de Bloom,
 * lui, a été **déduit du verbe** de l'objectif par `analyzeObjective`.
 *
 * Quand les deux divergent, c'est donc la **déduction** qui doit céder — jamais la conception.
 * Relever le niveau ne change aucune ligne de code ni aucun contenu : cela corrige une
 * incohérence entre un objectif rédigé « connaître » et une leçon qui met réellement en pratique.
 *
 * ⚠️ **Le script refuse d'abaisser un niveau.** Si le type ne peut satisfaire aucun niveau
 * supérieur ou égal, la leçon est signalée et **non modifiée** : c'est le signe d'un vrai
 * problème pédagogique qui demande une décision humaine, pas un ajustement automatique.
 *
 * Usage :
 *   npm run db:align-bloom              # simulation
 *   npm run db:align-bloom -- --apply   # écrit en base
 */

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

const APPLY = process.argv.includes('--apply');

type LessonRow = {
  id: string;
  title: string;
  type: string;
  bloom_level: string | null;
};

async function main(): Promise<void> {
  console.log('');
  console.log('  Alignement du niveau de Bloom sur le type de leçon (R6)');
  console.log(`  Mode : ${APPLY ? 'ÉCRITURE' : 'simulation (utiliser --apply pour écrire)'}`);
  console.log('');

  const { rows } = await query<LessonRow>(
    'SELECT id, title, type, bloom_level FROM lessons ORDER BY chapter_id, position',
  );

  let conformes = 0;
  const aRelever: { id: string; title: string; type: string; avant: BloomLevel; apres: BloomLevel }[] = [];
  const impossibles: { id: string; title: string; type: string; avant: BloomLevel }[] = [];
  const sansNiveau: { id: string; title: string; type: string }[] = [];

  for (const lesson of rows) {
    const level = lesson.bloom_level as BloomLevel | null;

    if (!level) {
      sansNiveau.push({ id: lesson.id, title: lesson.title, type: lesson.type });
      continue;
    }

    if (isLessonTypeCompatibleWithBloom(lesson.type, level)) {
      conformes++;
      continue;
    }

    // Le type impose un plancher : les niveaux incompatibles en dessous tombent.
    const admissibles = BLOOM_LEVELS.filter((candidat) => isLessonTypeCompatibleWithBloom(lesson.type, candidat));

    if (admissibles.length === 0) {
      impossibles.push({ id: lesson.id, title: lesson.title, type: lesson.type, avant: level });
      continue;
    }

    // ⚠️ Aucun abaissement : on ne prend que le premier admissible **au-dessus** du niveau actuel.
    const rangActuel = BLOOM_LEVELS.indexOf(level);
    const superieur = admissibles.find((candidat) => BLOOM_LEVELS.indexOf(candidat) > rangActuel);

    if (!superieur) {
      impossibles.push({ id: lesson.id, title: lesson.title, type: lesson.type, avant: level });
      continue;
    }

    aRelever.push({ id: lesson.id, title: lesson.title, type: lesson.type, avant: level, apres: superieur });
  }

  console.log(`  Leçons examinées : ${rows.length}`);
  console.log(`  Déjà cohérentes  : ${conformes}`);
  console.log(`  À relever        : ${aRelever.length}`);
  console.log(`  Impossibles      : ${impossibles.length}`);
  console.log(`  Sans niveau      : ${sansNiveau.length}`);
  console.log('');

  for (const item of aRelever) {
    console.log(`    ${item.avant.padEnd(11)} → ${item.apres.padEnd(11)} (${item.type})  ${item.title}`);
  }
  for (const item of impossibles) {
    console.log(`    ⚠️ IMPOSSIBLE (${item.type}, niveau ${item.avant}) : ${item.title}`);
  }
  for (const item of sansNiveau) {
    console.log(`    ⚠️ SANS NIVEAU (${item.type}) : ${item.title}`);
  }
  console.log('');

  if (!APPLY) {
    console.log('  Simulation terminée — aucune écriture.');
    return;
  }

  if (aRelever.length > 0) {
    await withTransaction(async (client) => {
      for (const item of aRelever) {
        await client.query('UPDATE lessons SET bloom_level = $2 WHERE id = $1', [item.id, item.apres]);
      }
    });
  }

  console.log(`  ✔ ${aRelever.length} niveau(x) aligné(s) sur le type de la leçon.`);
  console.log('');
}

main()
  .then(() => closePool())
  .catch(async (error) => {
    console.error('Échec :', error instanceof Error ? error.message : error);
    await closePool();
    process.exit(1);
  });
