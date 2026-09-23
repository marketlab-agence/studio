/**
 * Déduction du domaine de contenu d'une formation.
 *
 * ⚠️ **Pourquoi un module dédié.** Cette fonction était initialement dans `seed.ts`, qui
 * **exécute le seed à l'import** : la tester revenait à lancer une écriture complète en base,
 * et Jest signalait des « logs après la fin des tests ». Un module pur rend la fonction
 * testable sans effet de bord.
 *
 * ⚠️ **Deux pièges réels, découverts à l'usage :**
 *
 * 1. **Faux positif sur les sous-chaînes.** Le motif `/git/` reconnaissait « di**git**al » et
 *    classait « introduction-au-marketing-digital » en **Git**. Constaté au premier re-seed.
 *    D'où les délimiteurs obligatoires (`^|[^a-z]` … `[^a-z]|$`).
 * 2. **Priorité entre domaines.** Un titre mixte (« git-pour-les-commerciaux ») doit être
 *    classé par son sujet **principal**. Les domaines sont donc évalués du plus spécifique
 *    au plus général, « git » en dernier.
 *
 * Le domaine conditionne le filtrage des composants proposés à l'IA : une erreur ici prive
 * une formation de ses composants pertinents et lui en propose d'inadaptés.
 *
 * Voir `@docs/katalyst/conformite-rnq-v10.md` et la migration 010.
 */

/** Domaine déduit, ou `null` si aucun ne s'impose. */
export function contentDomainFor(courseId: string): string | null {
  const id = courseId.toLowerCase();

  /** Vrai si `word` apparaît comme **mot entier**, jamais comme sous-chaîne. */
  const has = (word: string) => new RegExp(`(^|[^a-z])${word}([^a-z]|$)`, 'i').test(id);

  // L'ordre est significatif : du plus spécifique au plus général.
  //
  // ⚠️ Les formes plurielles sont listées explicitement : la correspondance exige un **mot
  // entier**, donc « commerciaux » ne serait pas reconnu par « commercial ». Un slug réel
  // (« git-pour-les-commerciaux ») a révélé le manque.
  if (
    has('closing') || has('vente') || has('ventes') ||
    has('prospect') || has('prospects') ||
    has('commercial') || has('commerciaux') || has('commerce')
  ) {
    return 'vente';
  }
  if (has('marketing') || has('seo')) return 'marketing';
  if (has('jira') || has('agile') || has('scrum')) return 'gestion-projet';
  if (has('automatisation') || has('n8n') || has('workflow')) return 'automatisation';
  if (has('prompt') || has('ingenierie') || has('intelligence-artificielle')) return 'ia';
  if (has('git') || has('github')) return 'git';

  return null;
}
