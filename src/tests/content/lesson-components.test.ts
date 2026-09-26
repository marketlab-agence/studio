import { z } from 'zod';
import {
  renumeroter,
  ajouterComposant,
  retirerComposant,
  deplacerComposant,
  changerNomComposant,
  modifierLibelle,
  modifierDonnees,
  serialiserDonnees,
  analyserDonneesJson,
  attendDesDonnees,
  validerConfigurationComposant,
  validerComposantsGeneres,
} from '@/lib/content/lesson-components';
import { resolveComponentMeta, type ComponentMeta } from '@/components/registry/catalog';
import type { LessonComponent } from '@/types/tutorial.types';

/**
 * ⚠️ **Ce que ces tests protègent.** Les opérations d'édition (ajout, retrait,
 * réordonnancement) sont la source d'erreurs silencieuses : une position laissée
 * trouée casse la contrainte d'unicité, un ordre incohérent change l'enchaînement
 * vu par l'apprenant. La validation, elle, décide si une configuration peut être
 * stockée — une erreur ici ne se verrait qu'au rendu, en production.
 */

const composant = (
  name: string,
  position: number,
  config: LessonComponent['config'] = {},
): LessonComponent => ({ name, position, config });

describe('édition de la liste ordonnée des composants', () => {
  it('renumérote les positions en 0..N-1', () => {
    const resultat = renumeroter([composant('RecallQuiz', 5), composant('GitGraph', 9)]);
    expect(resultat.map((c) => c.position)).toEqual([0, 1]);
  });

  it('ajoute un composant à la fin et le renumérote', () => {
    const resultat = ajouterComposant([composant('RecallQuiz', 0)], 'GitGraph');
    expect(resultat.map((c) => c.name)).toEqual(['RecallQuiz', 'GitGraph']);
    expect(resultat.map((c) => c.position)).toEqual([0, 1]);
  });

  it('accepte deux fois le même composant', () => {
    const une = ajouterComposant([], 'RecallQuiz');
    const deux = ajouterComposant(une, 'RecallQuiz');
    expect(deux).toHaveLength(2);
    expect(deux.every((c) => c.name === 'RecallQuiz')).toBe(true);
    expect(deux.map((c) => c.position)).toEqual([0, 1]);
  });

  it('retire le composant à la position donnée et renumérote', () => {
    const depart = [composant('A', 0), composant('B', 1), composant('C', 2)];
    const resultat = retirerComposant(depart, 1);
    expect(resultat.map((c) => c.name)).toEqual(['A', 'C']);
    expect(resultat.map((c) => c.position)).toEqual([0, 1]);
  });

  it('ignore un retrait hors bornes sans casser l’ordre', () => {
    const depart = [composant('A', 0), composant('B', 1)];
    expect(retirerComposant(depart, 5).map((c) => c.name)).toEqual(['A', 'B']);
    expect(retirerComposant(depart, -1).map((c) => c.name)).toEqual(['A', 'B']);
  });

  it('remonte un composant en échangeant avec le précédent', () => {
    const depart = [composant('A', 0), composant('B', 1), composant('C', 2)];
    const resultat = deplacerComposant(depart, 2, 'haut');
    expect(resultat.map((c) => c.name)).toEqual(['A', 'C', 'B']);
    expect(resultat.map((c) => c.position)).toEqual([0, 1, 2]);
  });

  it('descend un composant en échangeant avec le suivant', () => {
    const depart = [composant('A', 0), composant('B', 1), composant('C', 2)];
    const resultat = deplacerComposant(depart, 0, 'bas');
    expect(resultat.map((c) => c.name)).toEqual(['B', 'A', 'C']);
    expect(resultat.map((c) => c.position)).toEqual([0, 1, 2]);
  });

  it('ne fait rien en remontant le premier ou en descendant le dernier', () => {
    const depart = [composant('A', 0), composant('B', 1)];
    expect(deplacerComposant(depart, 0, 'haut').map((c) => c.name)).toEqual(['A', 'B']);
    expect(deplacerComposant(depart, 1, 'bas').map((c) => c.name)).toEqual(['A', 'B']);
  });

  it('change le nom sans perdre la configuration', () => {
    const depart = [composant('A', 0, { labels: { title: 'Titre' } })];
    const resultat = changerNomComposant(depart, 0, 'B');
    expect(resultat[0].name).toBe('B');
    expect(resultat[0].config).toEqual({ labels: { title: 'Titre' } });
  });

  it('écrit un libellé d’instance dans la configuration', () => {
    const resultat = modifierLibelle([composant('A', 0)], 0, 'title', 'Mon titre');
    expect(resultat[0].config?.labels).toEqual({ title: 'Mon titre' });
  });

  it('retire un libellé vidé pour revenir au défaut du composant', () => {
    const depart = [composant('A', 0, { labels: { title: 'Mon titre' } })];
    const resultat = modifierLibelle(depart, 0, 'title', '   ');
    expect(resultat[0].config?.labels).toEqual({});
  });

  it('écrit les données de l’instance', () => {
    const resultat = modifierDonnees([composant('A', 0)], 0, { pairs: [] });
    expect(resultat[0].config?.data).toEqual({ pairs: [] });
  });
});

describe('saisie JSON des données d’instance', () => {
  it('traite un champ vide comme « aucune donnée » (défauts du composant)', () => {
    expect(analyserDonneesJson('   ')).toEqual({ valide: true, data: undefined });
  });

  it('rejette un JSON invalide avec un message exploitable', () => {
    const resultat = analyserDonneesJson('{ pas du json');
    expect(resultat.valide).toBe(false);
    if (!resultat.valide) {
      expect(typeof resultat.message).toBe('string');
      expect(resultat.message.length).toBeGreaterThan(0);
    }
  });

  it('accepte et analyse un JSON valide', () => {
    expect(analyserDonneesJson('{ "pairs": [] }')).toEqual({ valide: true, data: { pairs: [] } });
  });

  it('sérialise les données absentes en chaîne vide', () => {
    expect(serialiserDonnees(undefined)).toBe('');
    expect(serialiserDonnees({ pairs: [] })).toBe(JSON.stringify({ pairs: [] }, null, 2));
  });
});

describe('détection d’une structure de données attendue', () => {
  it('reconnaît un composant qui attend une structure', () => {
    const meta = resolveComponentMeta('MatchingPairs');
    expect(meta).toBeDefined();
    expect(attendDesDonnees(meta as ComponentMeta)).toBe(true);
  });

  it('ne signale rien pour un schéma objet vide', () => {
    const meta = {
      name: 'SansDonnees',
      kind: 'interactive',
      status: 'functional',
      description: '',
      domains: ['*'],
      bloomLevels: [],
      labelKeys: { title: 'Titre' },
      dataSchema: z.object({}),
    } as unknown as ComponentMeta;
    expect(attendDesDonnees(meta)).toBe(false);
  });
});

describe('validation d’une configuration de composant', () => {
  it('accepte l’absence de données : le composant applique ses défauts', () => {
    expect(validerConfigurationComposant('AiHelper', {})).toEqual({ valide: true });
    expect(validerConfigurationComposant('AiHelper', undefined)).toEqual({ valide: true });
    expect(
      validerConfigurationComposant('AiHelper', { labels: { title: 'Assistant' } }),
    ).toEqual({ valide: true });
  });

  it('rejette des données présentes mais invalides', () => {
    const resultat = validerConfigurationComposant('MatchingPairs', { data: { pairs: [] } });
    expect(resultat.valide).toBe(false);
    if (!resultat.valide) {
      expect(resultat.message).toContain('Configuration invalide pour MatchingPairs');
    }
  });

  it('accepte des données présentes et valides', () => {
    const resultat = validerConfigurationComposant('MatchingPairs', {
      data: { pairs: [{ id: 'p1', left: 'a', right: 'b' }] },
    });
    expect(resultat).toEqual({ valide: true });
  });

  it('rejette un composant inconnu', () => {
    const resultat = validerConfigurationComposant('ComposantFantome', {});
    expect(resultat.valide).toBe(false);
    if (!resultat.valide) {
      expect(resultat.message).toContain('Composant inconnu : ComposantFantome');
    }
  });
});

describe('filtrage des composants proposés par l’IA avant persistance', () => {
  it('écarte un composant inconnu en conservant la raison', () => {
    const resultat = validerComposantsGeneres([
      { name: 'RecallQuiz' },
      { name: 'ComposantFantome' },
    ]);

    expect(resultat.composants.map((c) => c.name)).toEqual(['RecallQuiz']);
    expect(resultat.rejetes).toHaveLength(1);
    expect(resultat.rejetes[0].nom).toBe('ComposantFantome');
    expect(resultat.rejetes[0].message).toContain('Composant inconnu');
  });

  it('écarte un composant dont config.data ne valide pas le schéma', () => {
    const resultat = validerComposantsGeneres([
      { name: 'MatchingPairs', config: { data: { pairs: [] } } },
    ]);

    expect(resultat.composants).toHaveLength(0);
    expect(resultat.rejetes).toHaveLength(1);
    expect(resultat.rejetes[0].message).toContain('Configuration invalide pour MatchingPairs');
  });

  it('conserve les composants valides et renumérote les positions en 0..N-1', () => {
    const resultat = validerComposantsGeneres([
      { name: 'ComposantFantome' },
      { name: 'RecallQuiz' },
      { name: 'GitGraph' },
    ]);

    expect(resultat.composants.map((c) => c.name)).toEqual(['RecallQuiz', 'GitGraph']);
    expect(resultat.composants.map((c) => c.position)).toEqual([0, 1]);
    expect(resultat.rejetes).toHaveLength(1);
  });

  it('accepte une liste vide et accepte deux fois le même composant', () => {
    expect(validerComposantsGeneres([])).toEqual({ composants: [], rejetes: [] });

    const deux = validerComposantsGeneres([{ name: 'RecallQuiz' }, { name: 'RecallQuiz' }]);
    expect(deux.composants).toHaveLength(2);
    expect(deux.composants.map((c) => c.position)).toEqual([0, 1]);
    expect(deux.rejetes).toHaveLength(0);
  });
});
