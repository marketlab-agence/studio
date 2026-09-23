import { config as loadEnv } from 'dotenv';
import { closePool, query, withTransaction } from './pool';

/**
 * Convertit les leçons Git qui exigent une mise en pratique en véritable `MISE_EN_PRATIQUE`
 * (T6.8d, suite).
 *
 * ⚠️ **Pourquoi ces 7 leçons sont un vrai défaut, pas une case à cocher.**
 * Leurs objectifs demandent d'« installer Git », de « changer de branche », de « commiter » :
 * des actes. Mais elles étaient déclarées `TEXTE` ou `CAPSULE`, **sans aucun composant
 * interactif** — l'apprenant ne pouvait que lire. C'est le cœur de l'indicateur 19 du RNQ :
 * on ne peut pas vérifier l'effectivité d'un suivi sur un contenu où rien ne se passe.
 *
 * ⚠️ **Aucun composant nouveau** : les sept leçons sont branchées sur des simulateurs
 * **déjà livrés et testés** — la règle d'admissibilité de `@docs/rework/exercices.md`
 * (« adapter le sujet, garder la structure ») est respectée sans écrire une ligne de React.
 *
 * ⚠️ `GitCommandSimulator` produit une **trace d'interaction** (il délègue à
 * `StepByStepRunner`). `BranchCreator` et `TimelineNavigator`, eux, n'en produisent pas
 * encore : la leçon reste conforme (R5.1 ne demande qu'un composant fonctionnel) mais la
 * trace est assurée par les leçons voisines. Le manque est signalé, jamais masqué.
 *
 * Usage :
 *   npm run db:convert-git-lessons              # simulation
 *   npm run db:convert-git-lessons -- --apply   # écrit en base
 */

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

const APPLY = process.argv.includes('--apply');

/**
 * Association leçon → composant, choisie sur le **contenu réel** du composant.
 *
 * ⚠️ `GitCommandSimulator` couvre clone, status, add, commit, push (voir la procédure qu'il
 * contient) : c'est lui qui porte « installer », « statut », « commit » et « cloner ».
 * `BranchCreator` crée et bascule les branches : il porte les deux leçons de branche.
 * `TimelineNavigator` est la vue de l'historique — déjà utilisée par « Voyager dans le temps ».
 */
const CONVERSIONS: { title: string; component: string; trace: boolean }[] = [
  { title: 'Installer Git', component: 'GitCommandSimulator', trace: true },
  { title: 'Vérifier le statut du projet', component: 'GitCommandSimulator', trace: true },
  { title: 'Valider les modifications (Commit)', component: 'GitCommandSimulator', trace: true },
  { title: 'Cloner un dépôt existant', component: 'GitCommandSimulator', trace: true },
  { title: "Consulter l'historique", component: 'TimelineNavigator', trace: false },
  { title: 'Changer de branche', component: 'BranchCreator', trace: false },
  { title: 'Créer et basculer en une commande', component: 'BranchCreator', trace: false },
];

type LessonRow = { id: string; title: string; type: string; interactive_component_name: string | null };

async function main(): Promise<void> {
  console.log('');
  console.log('  Conversion en MISE_EN_PRATIQUE des leçons Git sans composant');
  console.log(`  Mode : ${APPLY ? 'ÉCRITURE' : 'simulation (utiliser --apply pour écrire)'}`);
  console.log('');

  const { rows } = await query<LessonRow>(
    "SELECT id, title, type, interactive_component_name FROM lessons ORDER BY chapter_id, position",
  );

  const aConvertir: { id: string; title: string; avantType: string; component: string; trace: boolean }[] = [];
  const introuvables: string[] = [];

  for (const conversion of CONVERSIONS) {
    const lesson = rows.find((row) => row.title === conversion.title);

    if (!lesson) {
      introuvables.push(conversion.title);
      continue;
    }

    // Déjà convertie : on ne réécrit rien (le script reste rejouable sans effet de bord).
    if (lesson.type === 'MISE_EN_PRATIQUE' && lesson.interactive_component_name) {
      continue;
    }

    aConvertir.push({
      id: lesson.id,
      title: lesson.title,
      avantType: lesson.type,
      component: conversion.component,
      trace: conversion.trace,
    });
  }

  console.log(`  Leçons à convertir : ${aConvertir.length}`);
  console.log('');

  for (const item of aConvertir) {
    const marque = item.trace ? 'trace ✓' : 'trace —';
    console.log(`    ${item.avantType.padEnd(9)} → MISE_EN_PRATIQUE  [${item.component}] ${marque}  ${item.title}`);
  }

  const sansTrace = aConvertir.filter((item) => !item.trace);
  if (sansTrace.length > 0) {
    console.log('');
    console.log(`  ⚠️ ${sansTrace.length} leçon(s) branchée(s) sur un composant SANS trace d'interaction.`);
    console.log("     Conforme R5.1 (composant fonctionnel), mais l'indicateur 19 n'est pas couvert.");
  }

  for (const titre of introuvables) {
    console.log(`    ⚠️ INTROUVABLE : ${titre}`);
  }
  console.log('');

  if (!APPLY) {
    console.log('  Simulation terminée — aucune écriture.');
    return;
  }

  if (aConvertir.length > 0) {
    await withTransaction(async (client) => {
      for (const item of aConvertir) {
        await client.query(
          `UPDATE lessons SET type = 'MISE_EN_PRATIQUE', interactive_component_name = $2 WHERE id = $1`,
          [item.id, item.component],
        );
      }
    });
  }

  console.log(`  ✔ ${aConvertir.length} leçon(s) convertie(s) et branchée(s) sur un composant existant.`);
  console.log('');
}

main()
  .then(() => closePool())
  .catch(async (error) => {
    console.error('Échec :', error instanceof Error ? error.message : error);
    await closePool();
    process.exit(1);
  });
