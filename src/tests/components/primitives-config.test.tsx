import React from 'react';
import { render, screen } from '@testing-library/react';
import { StepByStepRunner, type ProcedureStep } from '@/components/interactive/primitives/StepByStepRunner';
import { GitCommandSimulator } from '@/components/interactive/GitCommandSimulator';
import { BuilderCanvas } from '@/components/interactive/primitives/BuilderCanvas';

/**
 * Preuve de bout en bout : les libellés fournis par `config` sont **visibles au rendu**.
 *
 * ⚠️ **Pourquoi ce test existe en plus du test du helper.** Vérifier `fusionnerLibelles`
 * prouve que la fusion est correcte, pas que le composant l'utilise. Le critère d'acceptation
 * de la phase est « libellés personnalisés visibles au rendu » — seul un rendu peut l'observer.
 *
 * ⚠️ **La trace est mockée.** Le composant poste vers `/api/v1/interactions` ; on isole le
 * rendu pour que le test reste unitaire (aucun appel réseau).
 */
jest.mock('@/hooks/useLessonTrace', () => ({
  useLessonTrace: () => ({
    recordStep: jest.fn(),
    recordDuration: jest.fn(),
    recordProduction: jest.fn(),
    restartTimer: jest.fn(),
  }),
}));

const ETAPES: ProcedureStep[] = [
  { id: 's1', instruction: 'Étape de référence', expected: 'un' },
];

describe('StepByStepRunner — libellés en configuration', () => {
  it('affiche le titre personnalisé fourni par config.labels', () => {
    render(
      <StepByStepRunner
        lessonId="lecon-test"
        steps={ETAPES}
        config={{ labels: { title: 'Titre personnalisé' } }}
      />,
    );

    expect(screen.getByText('Titre personnalisé')).toBeInTheDocument();
  });

  it('affiche le titre par défaut quand aucune configuration n’est fournie', () => {
    render(<StepByStepRunner lessonId="lecon-test" steps={ETAPES} />);

    expect(screen.getByText('Procédure guidée')).toBeInTheDocument();
  });

  it('rend exactement comme avant avec une configuration vide', () => {
    render(
      <StepByStepRunner
        lessonId="lecon-test"
        title="Mon titre"
        steps={ETAPES}
        config={{}}
      />,
    );

    expect(screen.getByText('Mon titre')).toBeInTheDocument();
  });

  it('accepte ses données via config.data sans étape passée en prop', () => {
    render(
      <StepByStepRunner
        lessonId="lecon-test"
        config={{ data: { steps: ETAPES } }}
      />,
    );

    expect(screen.getByText(/Étape de référence/)).toBeInTheDocument();
  });
});

describe('GitCommandSimulator — configuration transmise à la primitive', () => {
  it('affiche le titre personnalisé et les étapes fournies par config', () => {
    render(
      <GitCommandSimulator
        lessonId="lecon-git"
        config={{
          labels: { title: 'Commandes maison' },
          data: { steps: [{ id: 'g1', instruction: 'Étape Git propre', expected: 'git' }] },
        }}
      />,
    );

    expect(screen.getByText('Commandes maison')).toBeInTheDocument();
    expect(screen.getByText(/Étape Git propre/)).toBeInTheDocument();
  });

  it('garde la procédure de référence sans configuration', () => {
    render(<GitCommandSimulator lessonId="lecon-git" />);

    expect(screen.getByText(/Commandes Git essentielles/)).toBeInTheDocument();
    expect(screen.getByText(/Cloner un dépôt distant/i)).toBeInTheDocument();
  });
});

describe('BuilderCanvas — données « blocks » du schéma projetées en rubriques', () => {
  it('affiche chaque bloc fourni par config.data comme une rubrique', () => {
    render(
      <BuilderCanvas
        lessonId="lecon-jira"
        config={{
          labels: { title: 'Construis ton sprint' },
          data: { blocks: ['Objectif de sprint', 'Story points'] },
        }}
      />,
    );

    expect(screen.getByText('Construis ton sprint')).toBeInTheDocument();
    expect(screen.getByText('Objectif de sprint')).toBeInTheDocument();
    expect(screen.getByText('Story points')).toBeInTheDocument();
  });
});
