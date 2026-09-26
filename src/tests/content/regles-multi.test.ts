/**
 * @jest-environment node
 *
 * Règles de conformité multi-composants — phase 8bis, Task 8.
 *
 * ⚠️ **Ce que ces tests protègent.** Une leçon porte désormais **N** composants (liste
 * ordonnée). La conformité doit donc porter sur **chaque composant**, et non plus sur
 * « la leçon a-t-elle un composant ? ». Ces tests couvrent les règles livrées :
 * - **R5.2** — trace d'interaction reformulée « par composant » (indicateur 19) ;
 * - **R7** — un composant `interactive` doit couvrir le niveau de Bloom de la leçon
 *   (rapport **non bloquant** : `evaluable: false`, `donnees-a-completer`) ;
 * - **R8** — invariant du catalogue : tout interactif déclare ≥ 1 niveau ;
 * - **R9** — `config.data`, quand il est fourni, doit valider le `dataSchema`.
 *
 * ⚠️ **Décision utilisateur** : les composants **visuels** sont illustratifs — R7 ne
 * s'applique **jamais** à eux.
 *
 * Le modèle de contenu est décrit dans `@docs/katalyst/regles-conformite.md`.
 */
import { auditCourseContent, type RuleReport } from '@/lib/schemas/content';
import { COMPONENT_CATALOG } from '@/components/registry/catalog';
import type { BloomLevel } from '@/lib/content/bloom';

/** Forme minimale d'une instance de composant telle que stockée dans la leçon. */
type ComposantTest = { name: string; position: number; config: unknown };

/** Options du montage : type de leçon et niveau de Bloom (explicitement absent si `undefined`). */
type OptionsLecon = { type?: string; bloomLevel?: BloomLevel };

/**
 * Construit une leçon de test.
 *
 * ⚠️ Le niveau par défaut est `Appliquer` (type `MISE_EN_PRATIQUE`, compatible R6) : les
 * cas de mismatch R7 se lisent alors directement dans le choix du composant. Passer
 * `bloomLevel: undefined` **déclare le niveau absent** (R3 le signalera), ce qui permet de
 * vérifier que R7 ne se prononce pas sans niveau de référence.
 */
function lecon(components: ComposantTest[], options: OptionsLecon = {}) {
  return {
    id: 'l1',
    title: 'Leçon',
    objective: 'Décrire (en reformulant).',
    content: '',
    type: options.type ?? 'MISE_EN_PRATIQUE',
    points: 0,
    position: 0,
    bloomLevel: 'bloomLevel' in options ? options.bloomLevel : ('Appliquer' as BloomLevel),
    components,
  };
}

/** Compose une formation à un chapitre et une leçon, puis en retourne le rapport d'audit. */
function rapport(components: ComposantTest[], options?: OptionsLecon) {
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
        lessons: [lecon(components, options)],
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
  describe('R7 — couverture du niveau de Bloom par composant interactif', () => {
    it('signale un composant interactif dont le Bloom ne couvre pas celui de la leçon', () => {
      // `RecallQuiz` ne couvre que « Connaître » ; la leçon vise « Appliquer ».
      const r = rapport([{ name: 'RecallQuiz', position: 0, config: {} }]);
      expect(regle(r, 'R7').findings.length).toBeGreaterThan(0);
    });

    it('ne signale rien quand le composant interactif couvre le niveau de la leçon', () => {
      // Contrôle positif : `StepByStepRunner` couvre « Appliquer ». Sans cette assertion,
      // une règle qui signale TOUT passerait le test précédent.
      const r = rapport([{ name: 'StepByStepRunner', position: 0, config: {} }]);
      expect(regle(r, 'R7').findings).toEqual([]);
    });

    it('n’applique AUCUNE contrainte de Bloom aux composants visuels', () => {
      // ⚠️ Décision utilisateur : les visuels sont illustratifs. `GitGraph` ne couvre pas
      // « Appliquer » — il ne doit pourtant produire aucun constat.
      const r = rapport([{ name: 'GitGraph', position: 0, config: {} }]);
      expect(regle(r, 'R7').findings).toEqual([]);
    });

    it('ne se prononce pas quand la leçon n’a pas de niveau de Bloom déclaré', () => {
      // Sans niveau de référence, la couverture est indécidable : R3 porte déjà le constat.
      const r = rapport([{ name: 'RecallQuiz', position: 0, config: {} }], {
        bloomLevel: undefined,
      });
      expect(regle(r, 'R7').findings).toEqual([]);
    });

    it('est un RAPPORT non bloquant (`donnees-a-completer`), jamais un rejet', () => {
      // ⚠️ Le contrôle est réel (R7 mesure l'écart), mais la porte d'audit ne doit pas tomber
      // tant que les formations n'ont pas été alignées : même classification que R3.
      const r7 = regle(rapport([{ name: 'RecallQuiz', position: 0, config: {} }]), 'R7');
      expect(r7.indicator).toBe(19);
      expect(r7.evaluable).toBe(false);
      expect(r7.notEvaluableReason).toBe('donnees-a-completer');
    });
  });

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

describe('R8 — invariant du catalogue', () => {
  it('tout composant interactif déclare au moins un niveau de Bloom', () => {
    // ⚠️ R8 n'est PAS une règle par formation : c'est une propriété du catalogue. Un
    // composant interactif sans niveau ne peut pas être mis en correspondance avec un
    // objectif (R7), donc le catalogue lui-même est en défaut.
    const sansNiveau = COMPONENT_CATALOG.filter((meta) => meta.kind === 'interactive')
      .filter((meta) => meta.bloomLevels.length === 0)
      .map((meta) => meta.name);

    expect(sansNiveau).toEqual([]);
  });
});
