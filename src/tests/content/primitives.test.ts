/**
 * @jest-environment node
 *
 * Couverture des primitives pédagogiques (étape 15).
 *
 * ⚠️ **Ce test verrouille une exigence de l'utilisateur** (2026-09-23) : *« ne pas limiter les
 * composants interactifs aux 6 primitives candidates, mais en avoir au moins 2 pour chaque
 * niveau de Bloom »*.
 *
 * Sans ce test, la contrainte se perdrait au premier composant retiré — et une formation dont
 * l'IA ne trouverait aucun composant pour un niveau deviendrait non conforme sans que personne
 * ne s'en aperçoive.
 */
import {
  CATALOG_SIZE,
  listByBloomLevel,
  listNamesForDomain,
  listFunctionalInteractiveNamesForDomain,
  resolveComponentMeta,
} from '@/components/registry/catalog';
import { BLOOM_LEVELS } from '@/lib/content/bloom';
import { fusionnerLibelles } from '@/lib/schemas/component-config';

/** Les 11 primitives génériques de l'étape 15 (+ RecallQuiz). */
const PRIMITIVES = [
  'RecallQuiz',
  'FlashcardDrill',
  'SortingGame',
  'MatchingPairs',
  'StepByStepRunner',
  'GuidedProcedure',
  'CaseDiagnosis',
  'CompareContrast',
  'DecisionScenario',
  'PeerReviewSimulator',
  'BuilderCanvas',
  'DraftCoach',
] as const;

describe('primitives — existence et nature', () => {
  it('existe au catalogue et est interactive', () => {
    const manquantes = PRIMITIVES.filter((name) => {
      const meta = resolveComponentMeta(name);
      return !meta || meta.kind !== 'interactive';
    });

    expect(manquantes).toEqual([]);
  });

  it('n’est PAS un placeholder — elle produit donc une trace', () => {
    // ⚠️ L'indicateur 19 est éliminatoire : une primitive déclarée `placeholder` ne produirait
    // aucune trace et rendrait l'organisation non conforme.
    const placeholders = PRIMITIVES.filter(
      (name) => resolveComponentMeta(name)?.status === 'placeholder',
    );

    expect(placeholders).toEqual([]);
  });

  it('est générique (`*`) : proposée pour toute formation', () => {
    // C'est l'apport de l'étape 15 : un formateur qui crée une formation de vente dispose
    // enfin de composants interactifs pertinents.
    const nonGeneriques = PRIMITIVES.filter(
      (name) => !resolveComponentMeta(name)?.domains.includes('*'),
    );

    expect(nonGeneriques).toEqual([]);
  });

  it('déclare au moins un niveau de Bloom', () => {
    const sansNiveau = PRIMITIVES.filter(
      (name) => (resolveComponentMeta(name)?.bloomLevels.length ?? 0) === 0,
    );

    expect(sansNiveau).toEqual([]);
  });
});

describe('couverture des 6 niveaux de Bloom — exigence utilisateur', () => {
  it('offre AU MOINS 2 primitives par niveau', () => {
    const insuffisants = BLOOM_LEVELS.map((level) => ({
      level,
      count: listByBloomLevel('interactive', level, undefined).length,
    })).filter((entry) => entry.count < 2);

    // Le tableau nomme les niveaux fautifs — le diagnostic est immédiat si un composant
    // est retiré un jour.
    expect(insuffisants).toEqual([]);
  });

  it('couvre les 6 niveaux, sans exception', () => {
    const sansCouverture = BLOOM_LEVELS.filter(
      (level) => listByBloomLevel('interactive', level, undefined).length === 0,
    );

    expect(sansCouverture).toEqual([]);
  });

  it('n’a pas rendu le catalogue incohérent (taille stable et croissante)', () => {
    // Garde-fou simple : les 12 primitives doivent être présentes, donc le catalogue doit
    // compter au moins 46 + 12 composants.
    expect(CATALOG_SIZE).toBeGreaterThanOrEqual(58);
  });
});

describe('primitives — utiles hors du domaine Git', () => {
  it('sont proposées à une formation de vente', () => {
    // ⚠️ C'est LE test qui prouve l'apport : avant l'étape 15, aucune proposition interactive
    // n'existait pour une formation de vente.
    const pourVente = listFunctionalInteractiveNamesForDomain('vente');

    expect(pourVente).toContain('BuilderCanvas');
    expect(pourVente).toContain('DecisionScenario');
    expect(pourVente).toContain('DraftCoach');
  });

  it('sont proposées pour les 6 domaines du catalogue', () => {
    const domaines = ['git', 'ia', 'automatisation', 'gestion-projet', 'marketing', 'vente'] as const;

    for (const domaine of domaines) {
      const interactifs = listFunctionalInteractiveNamesForDomain(domaine);
      // Chaque domaine doit disposer d'au moins 5 primitives génériques.
      // Le domaine fautif est nommé dans le libellé d'échec via le tableau ci-dessous.
      const insuffisants = interactifs.length >= 5 ? [] : [{ domaine, count: interactifs.length }];
      expect(insuffisants).toEqual([]);
    }
  });

  it('apportent des composants visuels à tous les domaines', () => {
    // Les visuels étaient eux aussi entièrement Git (GitGraph, BranchDiagram…).
    const visuelsPourVente = listNamesForDomain('visual', 'vente');

    expect(visuelsPourVente).toContain('ConceptDiagram');
    expect(visuelsPourVente).toContain('AnimatedFlow');
  });
});

describe('primitives — libellés en configuration', () => {
  it('remplace les libellés par défaut par ceux de la configuration', () => {
    const defauts = { title: 'Titre par défaut', description: 'Description par défaut' };
    const config = { labels: { title: 'Custom title' } };

    const resultat = fusionnerLibelles(defauts, config.labels);
    expect(resultat.title).toBe('Custom title');
    expect(resultat.description).toBe('Description par défaut');
  });

  it('accepte une configuration absente sans casser', () => {
    expect(fusionnerLibelles({ title: 'T' }, undefined).title).toBe('T');
  });
});
