import { config as loadEnv } from 'dotenv';
import { closePool, query, withTransaction } from './pool';
import { analyzeObjective, type BloomLevel } from '@/lib/content/bloom';

/**
 * Complète les objectifs pédagogiques et renseigne le niveau de Bloom (T6.8).
 *
 * ⚠️ **Compléter, pas réécrire** (décision utilisateur du 2026-09-23). Les objectifs existants
 * sont pédagogiquement valides — « Définir l'automatisation des processus », « Installer n8n
 * localement » — mais il leur manque les **conditions et critères entre parenthèses** exigés
 * par la formule REWORK (`@docs/rework/methodes.md` §5, indicateur 5 du RNQ).
 *
 * Le script **conserve donc le verbe et l'objet**, et ajoute la partie formateur. Il ne
 * remplace jamais un objectif déjà conforme.
 *
 * ⚠️ **Le niveau de Bloom n'est pas inventé : il est *détecté*** dans l'objectif existant, par
 * le même analyseur que l'audit (`analyzeObjective`). Un objectif dont le niveau reste
 * indéterminable **n'est pas modifié** et est signalé — jamais deviné.
 *
 * Usage :
 *   npm run db:complete-objectives              # simulation (n'écrit rien)
 *   npm run db:complete-objectives -- --apply   # écrit en base
 */

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

const APPLY = process.argv.includes('--apply');
/** Affiche chaque paire avant/après — indispensable pour relire les réécritures avant écriture. */
const DETAIL = process.argv.includes('--detail');

/**
 * Critères ajoutés par niveau de Bloom.
 *
 * ⚠️ Ces formulations sont **génériques et vérifiables** : elles décrivent ce qui permet de
 * constater l'atteinte de l'objectif, sans présumer du contenu de la leçon. Un critère vague
 * (« correctement ») ne satisferait pas l'indicateur 5, qui exige un objectif **évaluable**.
 */
const CRITERIA_BY_LEVEL: Record<BloomLevel, string> = {
  Connaître: 'en citant au moins trois éléments attendus, sans support',
  Comprendre: 'en reformulant avec ses propres mots, sans reprendre les termes du cours',
  Appliquer: 'en respectant toutes les étapes de la procédure, sans erreur bloquante',
  Analyser: 'en identifiant la cause et en distinguant les indices pertinents des leurres',
  Évaluer: 'en justifiant le choix au regard de critères explicites',
  Créer: 'en produisant un résultat complet et directement utilisable',
};

/**
 * Substitutions des verbes **non conformes**, avec leur justification.
 *
 * ⚠️ **Ce sont de vraies corrections de fond, pas de la mise en forme.**
 * La méthode REWORK **interdit** « comprendre », « savoir » et « maîtriser » : ce sont des
 * verbes **non observables**. On ne peut pas constater qu'un apprenant « comprend » — donc on
 * ne peut pas évaluer l'atteinte de l'objectif (indicateur 5 du RNQ).
 *
 * « Apprendre à » est une formulation faible : elle décrit l'**intention** de l'apprenant, pas
 * le **résultat** attendu. Un objectif pédagogique se formule du point de vue du résultat.
 *
 * Chaque substitution est **du point de vue de l'apprenant** et conserve l'objet de départ —
 * on ne réécrit pas la leçon, on rend son objectif évaluable.
 */
const VERB_SUBSTITUTIONS: { pattern: RegExp; replacement: string; level: BloomLevel; because: string }[] = [
  {
    pattern: /^comprendre\b/i,
    replacement: 'expliquer',
    level: 'Comprendre',
    because: '« comprendre » n’est pas observable — on constate une explication, pas une compréhension.',
  },
  {
    pattern: /^savoir\b/i,
    replacement: 'expliquer',
    level: 'Comprendre',
    because: '« savoir » n’est pas observable',
  },
  {
    pattern: /^maîtriser\b/i,
    replacement: 'appliquer',
    level: 'Appliquer',
    because: '« maîtriser » est un jugement, pas un comportement observable',
  },
  {
    pattern: /^apprendre à\s+/i,
    // ⚠️ On **conserve le verbe d'origine** (« apprendre à naviguer » → « naviguer ») plutôt que
    // de le remplacer par un verbe générique : l'objet de l'objectif serait perdu. Seule la
    // formule d'intention disparaît — le résultat attendu, lui, reste décrit.
    replacement: '',
    level: 'Appliquer',
    because: '« apprendre à » décrit l’intention ; seule la formulation du résultat est retenue',
  },
  {
    pattern: /^découvrir\b/i,
    replacement: 'identifier',
    level: 'Connaître',
    because: 'la découverte est un moyen ; le résultat observable est l’identification',
  },
  {
    pattern: /^gérer\b/i,
    replacement: 'gérer',
    level: 'Appliquer',
    because: '« gérer » est trop général pour être évaluable — l’objectif reste à reformuler manuellement',
  },
  {
    pattern: /^exploiter\b/i,
    replacement: 'utiliser',
    level: 'Appliquer',
    because: '« exploiter » reste vague ; « utiliser » se constate',
  },
  {
    pattern: /^connecter\b/i,
    replacement: 'connecter',
    level: 'Appliquer',
    because: '« connecter » est déjà un verbe d’action observé — seule la partie formateur manquait',
  },
  {
    pattern: /^envoyer\b/i,
    replacement: 'réaliser',
    level: 'Appliquer',
    because: 'l’envoi est le moyen ; le résultat est la réalisation du flux',
  },
  {
    pattern: /^visualiser\b/i,
    replacement: 'identifier',
    level: 'Connaître',
    because: 'la visualisation est un support ; le résultat est ce qu’on y identifie',
  },
  {
    pattern: /^observer\b/i,
    replacement: 'distinguer',
    level: 'Comprendre',
    because: 'observer est passif ; « distinguer » est un acte constatable',
  },
  {
    pattern: /^se familiariser avec\b/i,
    replacement: 'identifier les éléments de',
    level: 'Connaître',
    because: '« se familiariser » n’est pas observable ; identifier les éléments l’est',
  },
  {
    pattern: /^apprendre le processus pour\b/i,
    replacement: '',
    level: 'Appliquer',
    because: '« apprendre le processus pour » décrit l’intention ; le résultat est l’action elle-même',
  },
  {
    pattern: /^apprendre les techniques de\b/i,
    replacement: 'mettre en œuvre les techniques de',
    level: 'Appliquer',
    because: '« apprendre les techniques » est une intention ; les mettre en œuvre se constate',
  },
  {
    pattern: /^apprendre à\s+/i,
    replacement: '',
    level: 'Appliquer',
    because: '« apprendre à » décrit l’intention ; seule la formulation du résultat est retenue',
  },
  {
    pattern: /^apprendre à guider\b/i,
    replacement: 'guider',
    level: 'Appliquer',
    because: '« apprendre à » décrit l’intention ; guider est l’acte attendu',
  },
];

/**
 * Verbes interdits apparaissant **au milieu** de l'objectif, avec leur remplacement.
 *
 * ⚠️ « pour comprendre l'état » → « pour décrire l'état » : le sens est conservé, l'observabilité
 * est acquise. On ne supprime pas la proposition — on la rend évaluable.
 */
const OBJET_CONTEXT_SUBSTITUTIONS: [string, string][] = [
  ['comprendre', 'décrire'],
  ['savoir', 'indiquer'],
  ['maîtriser', 'appliquer'],
];

type LessonRow = {
  id: string;
  title: string;
  objective: string;
  type: string;
  lesson_id: string;
  bloom_level: string | null;
};

/** Applique une substitution de verbe, si l'objectif en contient une. */
function substituteVerb(objective: string): { texte: string; level: BloomLevel; because: string } | null {
  for (const rule of VERB_SUBSTITUTIONS) {
    // ⚠️ Certains verbes interdits n'ouvrent pas la phrase : « Utiliser `git status` pour
    // comprendre l'état… » ou « Définir X et comprendre son rôle… ». On les traite d'abord,
    // par remplacement **en contexte**, avant d'examiner le verbe initial.
    for (const [interdit, remplacement] of OBJET_CONTEXT_SUBSTITUTIONS) {
      if (new RegExp(`\\b${interdit}\\b`, 'i').test(objective)) {
        const corrige = objective.replace(new RegExp(`\\b(à |de |pour )?${interdit}\\b`, 'i'), (m, prefixe) =>
          prefixe ? `${prefixe}${remplacement}` : remplacement,
        );
        const analysis = analyzeObjective(corrige);
        if (analysis.level) {
          return { texte: corrige, level: analysis.level, because: `« ${interdit} » n’est pas observable : remplacé par « ${remplacement} »` };
        }
      }
    }

    if (rule.pattern.test(objective.trim())) {
      const substituted = objective.trim().replace(rule.pattern, rule.replacement).trim();

      // Le verbe conservé doit être reconnu par la taxonomie : sinon la substitution n'a
      // rien apporté et on préfère signaler la leçon plutôt que produire un objectif bancal.
      const analysis = analyzeObjective(substituted);
      if (!analysis.level) continue;

      // La casse initiale est rétablie : « naviguer » → « Naviguer ».
      const texte = substituted.charAt(0).toUpperCase() + substituted.slice(1);

      return { texte, level: analysis.level, because: rule.because };
    }
  }
  return null;
}

async function main(): Promise<void> {
  console.log('');
  console.log('  Complétion des objectifs pédagogiques et des niveaux de Bloom');
  console.log(`  Mode : ${APPLY ? 'ÉCRITURE' : 'simulation (utiliser --apply pour écrire)'}`);
  console.log('');

  const { rows } = await query<LessonRow>(
    'SELECT id, title, objective, type, bloom_level FROM lessons ORDER BY chapter_id, position',
  );

  let dejaConformes = 0;
  let niveauSeul: { id: string; title: string; level: BloomLevel }[] = [];
  let aCompleter: { id: string; avant: string; apres: string; level: BloomLevel; motif?: string }[] = [];
  let indeterminables: { id: string; title: string; objective: string }[] = [];

  for (const lesson of rows) {
    const analysis = analyzeObjective(lesson.objective);

    // Déjà conforme : l'objectif n'est pas touché. « Compléter » ne signifie pas « réécrire ».
    // Mais si le niveau n'est pas encore en base, on le renseigne : c'est un manque de
    // donnée, pas un défaut de formulation.
    if (analysis.wellFormed && analysis.level) {
      dejaConformes++;
      if (!lesson.bloom_level) {
        niveauSeul.push({ id: lesson.id, title: lesson.title, level: analysis.level });
      }
      continue;
    }

    // 1. Verbe NON CONFORME (« comprendre », « savoir », « apprendre à »…) : on le remplace.
    //    C'est une correction de fond, justifiée par l'interdiction REWORK.
    if (analysis.forbiddenVerb || substituteVerb(lesson.objective)) {
      const substitution = substituteVerb(lesson.objective);

      if (substitution) {
        const base = substitution.texte.replace(/\.\s*$/, '');
        aCompleter.push({
          id: lesson.id,
          avant: lesson.objective,
          apres: `${base} (${CRITERIA_BY_LEVEL[substitution.level]}).`,
          level: substitution.level,
          motif: substitution.because,
        });
        continue;
      }
    }

    // 2. Verbe reconnu, critères manquants : on ajoute la partie formateur.
    if (analysis.level) {
      const base = lesson.objective.trim().replace(/\.\s*$/, '');
      aCompleter.push({
        id: lesson.id,
        avant: lesson.objective,
        apres: `${base} (${CRITERIA_BY_LEVEL[analysis.level]}).`,
        level: analysis.level,
      });
      continue;
    }

    // 3. Niveau indéterminable : on ne devine pas. Signalé pour traitement manuel.
    // ⚠️ C'est ce que la méthode REWORK impose : `[À COMPLÉTER]`, jamais inventé.
    indeterminables.push({ id: lesson.id, title: lesson.title, objective: lesson.objective });
  }

  console.log(`  Leçons examinées      : ${rows.length}`);
  console.log(`  Déjà conformes        : ${dejaConformes}`);
  console.log(`  À compléter           : ${aCompleter.length}`);
  console.log(`  Niveau indéterminable : ${indeterminables.length}`);
  console.log('');

  // Répartition par niveau — vérifie que la complétion ne déséquilibre pas la taxonomie.
  const parNiveau = aCompleter.reduce<Record<string, number>>((acc, item) => {
    acc[item.level] = (acc[item.level] ?? 0) + 1;
    return acc;
  }, {});
  console.log('  Répartition des niveaux détectés :');
  for (const [level, count] of Object.entries(parNiveau).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${level.padEnd(12)} : ${count}`);
  }
  console.log('');

  if (DETAIL) {
    console.log('  Paires avant / après :');
    for (const item of aCompleter) {
      console.log('');
      console.log(`    AVANT : ${item.avant}`);
      console.log(`    APRÈS : ${item.apres}`);
      console.log(`    NIVEAU: ${item.level}${item.motif ? `  (${item.motif})` : ''}`);
    }
    console.log('');
  }

  if (indeterminables.length > 0) {
    console.log('  ⚠️  Leçons à compléter MANUELLEMENT (niveau non déductible) :');
    for (const lesson of indeterminables.slice(0, 15)) {
      console.log(`    - ${lesson.title}`);
      console.log(`      « ${lesson.objective} »`);
    }
    if (indeterminables.length > 15) {
      console.log(`    … et ${indeterminables.length - 15} autre(s)`);
    }
    console.log('');
  }

  if (!APPLY) {
    console.log('  Simulation terminée — aucune écriture. Relancer avec --apply.');
    return;
  }

  // ⚠️ Une seule transaction : soit toutes les leçons sont complétées, soit aucune. Un
  // traitement partiel laisserait la base dans un état incohérent, difficile à diagnostiquer.
  await withTransaction(async (client) => {
    for (const item of aCompleter) {
      await client.query(
        'UPDATE lessons SET objective = $2, bloom_level = $3 WHERE id = $1',
        [item.id, item.apres, item.level],
      );
    }

    // Objectifs déjà conformes mais dont le niveau manquait en base : seul le niveau est écrit.
    for (const item of niveauSeul) {
      await client.query('UPDATE lessons SET bloom_level = $2 WHERE id = $1', [item.id, item.level]);
    }
  });

  if (niveauSeul.length > 0) {
    console.log(`  ✔ ${niveauSeul.length} niveau(x) de Bloom renseigné(s) sur des objectifs déjà conformes.`);
  }
  console.log(`  ✔ ${aCompleter.length} objectif(s) complété(s), niveau de Bloom renseigné.`);
  console.log('');
}

main()
  .then(() => closePool())
  .catch(async (error) => {
    console.error('Échec :', error instanceof Error ? error.message : error);
    await closePool();
    process.exit(1);
  });
