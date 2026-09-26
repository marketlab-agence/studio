/**
 * @jest-environment node
 *
 * Sélection des composants pilotée par Bloom (phase 8bis, étape 6).
 *
 * ⚠️ **Ce que ces tests protègent.** Le filtrage par niveau est fait **par construction** :
 * l'appelant ne transmet à l'IA que des interactifs couvrant le niveau visé. Le confier à
 * l'IA seule ne garantirait rien. Les visuels, eux, restent **hors** de ce filtre : ils sont
 * illustratifs et n'ont pas d'obligation de niveau.
 *
 * Les contrats de schéma sont vérifiés **à l'import**, sans invoquer l'IA.
 */
import {
  listByBloomLevel,
  listNamesForDomain,
  resolveComponentMeta,
} from '@/components/registry/catalog';
import { getRelevantComponents } from '@/lib/content/component-selection';
import {
  SuggestLessonComponentsInputSchema,
  SuggestLessonComponentsOutputSchema,
} from '@/ai/flows/suggest-lesson-components-schema';

describe('sélection des composants par Bloom', () => {
  it('ne propose que des composants couvrant le niveau de la leçon', () => {
    // ⚠️ C'est le contrat : le filtrage est fait PAR CONSTRUCTION (le flux ne reçoit
    // que les candidats admissibles), et non vérifié après coup par l'IA.
    const candidats = listByBloomLevel('interactive', 'Appliquer', undefined);
    expect(candidats.length).toBeGreaterThan(0);
    for (const meta of candidats) {
      expect(meta.bloomLevels).toContain('Appliquer');
    }
  });

  it('filtre les composants INTERACTIFS par Bloom (sélection de production)', () => {
    // Le cœur de l'étape 6 : le filtrage est fait **par construction** dans l'appelant.
    // Ne pas le tester laisserait une régression silencieuse — le flux recevrait tout le
    // catalogue et l'IA choisirait librement hors niveau.
    const selection = getRelevantComponents(undefined, 'Créer');

    expect(selection.interactive.length).toBeGreaterThan(0);
    for (const nom of selection.interactive) {
      expect(resolveComponentMeta(nom)?.bloomLevels).toContain('Créer');
    }
  });

  it('laisse les composants VISUELS hors du filtrage Bloom', () => {
    // ⚠️ Décision utilisateur : les visuels sont illustratifs, sans obligation de niveau.
    // Preuve : la liste visuelle est **identique quel que soit le niveau** — elle ne dépend
    // que du domaine. Si un filtre Bloom s'y glissait, ces deux listes divergeraient.
    const pourCreer = getRelevantComponents(undefined, 'Créer').visual;
    const pourConnaitre = getRelevantComponents(undefined, 'Connaître').visual;

    expect(pourCreer).toEqual(pourConnaitre);
    expect(pourCreer).toEqual(listNamesForDomain('visual', undefined));
    expect(pourCreer.length).toBeGreaterThan(0);
  });

  it('accepte un niveau de Bloom en entrée', () => {
    // ⚠️ Zod supprime les clés inconnues : sans le champ `bloomLevel` au schéma, la
    // valeur serait silencieusement jetée — d'où l'assertion sur la donnée relue.
    const resultat = SuggestLessonComponentsInputSchema.safeParse({
      lessonTitle: 'Créer une branche',
      lessonObjective: "L'apprenant sera capable de créer une branche (sans erreur)",
      courseTopic: 'Git',
      targetAudience: 'Débutants',
      illustrativeContent: 'Contenu de la leçon.',
      availableInteractiveComponents: ['BuilderCanvas'],
      availableVisualComponents: ['GitGraph'],
      bloomLevel: 'Appliquer',
    });

    if (!resultat.success) {
      throw new Error(resultat.error.issues.map((issue) => issue.message).join(' | '));
    }

    expect(resultat.data.bloomLevel).toBe('Appliquer');
  });

  it('produit un TABLEAU de composants, et non deux champs uniques', () => {
    const resultat = SuggestLessonComponentsOutputSchema.safeParse({
      components: [
        {
          name: 'BuilderCanvas',
          config: { labels: { titre: 'Construis ta branche' } },
          justification: 'Une compétence pratique est à exercer.',
        },
      ],
    });

    if (!resultat.success) {
      throw new Error(resultat.error.issues.map((issue) => issue.message).join(' | '));
    }

    expect(SuggestLessonComponentsOutputSchema.shape).toHaveProperty('components');
    // ⚠️ Les deux champs singuliers ne doivent plus exister : leur persistance
    // signifierait que l'ancien contrat survit en douce.
    expect(SuggestLessonComponentsOutputSchema.shape).not.toHaveProperty(
      'interactiveComponentName',
    );
    expect(SuggestLessonComponentsOutputSchema.shape).not.toHaveProperty(
      'visualComponentName',
    );
  });

  it('accepte 0 composant — une leçon purement notionnelle est valide', () => {
    const resultat = SuggestLessonComponentsOutputSchema.safeParse({ components: [] });

    expect(resultat.success).toBe(true);
  });
});
