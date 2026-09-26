/**
 * @jest-environment node
 *
 * Règles de conformité multi-composants — phase 8bis, Task 8.
 *
 * ⚠️ **Ce que ces tests protègent.** Une leçon porte désormais **N** composants (liste
 * ordonnée). La conformité doit donc porter sur **chaque composant**, et non plus sur
 * « la leçon a-t-elle un composant ? ». Ces tests couvrent les règles **livrées** :
 * - **R5.2** — trace d'interaction reformulée « par composant » (indicateur 19) ;
 * - **R9** — `config.data`, quand il est fourni, doit valider le `dataSchema` du composant.
 *
 * ⚠️ **R7 (couverture Bloom par composant) et R8 (invariant du catalogue) sont spécifiées
 * mais NON ACTIVÉES** — Task 8 BLOCKED : les activer fait tomber les 6 formations de 6/6 à
 * 0/6 (catalogue incomplet + inadéquations de niveau). Voir
 * `@docs/katalyst/regles-conformite.md` (« Constat du 2026-09-26 »). Ne pas les ajouter au
 * rapport d'audit sans avoir d'abord complété le catalogue et le contenu.
 *
 * Le modèle de contenu est décrit dans `@docs/katalyst/regles-conformite.md`.
 */
import { auditCourseContent, type RuleReport } from '@/lib/schemas/content';

/** Forme minimale d'une instance de composant telle que stockée dans la leçon. */
type ComposantTest = { name: string; position: number; config: unknown };

/** Construit une leçon de test, conforme R6 (type `MISE_EN_PRATIQUE`, niveau `Appliquer`). */
function lecon(components: ComposantTest[]) {
  return {
    id: 'l1',
    title: 'Leçon',
    objective: 'Décrire (en reformulant).',
    content: '',
    type: 'MISE_EN_PRATIQUE',
    points: 0,
    position: 0,
    bloomLevel: 'Appliquer',
    components,
  };
}

/** Compose une formation à un chapitre et une leçon, puis en retourne le rapport d'audit. */
function rapport(components: ComposantTest[]) {
  return auditCourseContent({
    id: 'c',
    title: 'C',
    description: '',
    organizationId: 'o',
    status: 'Publié',
    language: 'fr',
    chapters: [
      {
        id: 'ch1',
        title: 'Ch',
        position: 0,
        lessons: [lecon(components)],
        quiz: undefined,
      },
    ],
  } as never);
}

/** Récupère la règle demandée, ou échoue si elle est absente du rapport. */
function regle(resultat: ReturnType<typeof auditCourseContent>, id: string): RuleReport {
  const trouvee = resultat.rules.find((x) => x.rule === id);
  if (!trouvee) throw new Error(`Règle ${id} absente du rapport de conformité.`);
  return trouvee;
}

describe('règles de conformité multi-composants', () => {
  describe('R5.1 — appropriation d’une mise en pratique', () => {
    it('signale une mise en pratique sans composant interactif', () => {
      const r = rapport([]);
      expect(regle(r, 'R5.1').findings.length).toBeGreaterThan(0);
    });
  });

  describe('R5.2 — trace par composant interactif', () => {
    it('est déclarée NON évaluable, en attendant `lesson_interactions`', () => {
      const r52 = regle(rapport([]), 'R5.2');
      expect(r52.indicator).toBe(19);
      expect(r52.evaluable).toBe(false);
      // ⚠️ Motif `donnees-a-completer` : la règle est mesurable, mais le branchement sur
      // les traces réelles reste à faire. Ce n'est pas un arrêté non publié.
      expect(r52.notEvaluableReason).toBe('donnees-a-completer');
    });
  });

  describe('R9 — validation de `config.data` contre le `dataSchema` du composant', () => {
    it('signale une configuration invalide', () => {
      // `MatchingPairs` exige au moins une paire : `pairs: []` viole son schéma.
      const r = rapport([
        { name: 'MatchingPairs', position: 0, config: { data: { pairs: [] } } },
      ]);
      expect(regle(r, 'R9').findings.length).toBeGreaterThan(0);
    });

    it('ne signale rien quand `config.data` est ABSENT (valeurs par défaut)', () => {
      // ⚠️ Règle du contrôleur : `data === undefined` signifie « le composant utilise ses
      // défauts ». Sans cela, tout composant non configuré (ex. `AiHelper`) serait signalé
      // et ferait échouer la porte d'audit.
      const r = rapport([{ name: 'StepByStepRunner', position: 0, config: {} }]);
      expect(regle(r, 'R9').findings).toEqual([]);
    });

    it('ne signale rien quand `config.data` est valide', () => {
      const r = rapport([
        {
          name: 'StepByStepRunner',
          position: 0,
          config: { data: { steps: [{ id: 's1', instruction: 'Exécuter', expected: 'OK' }] } },
        },
      ]);
      expect(regle(r, 'R9').findings).toEqual([]);
    });
  });
});
