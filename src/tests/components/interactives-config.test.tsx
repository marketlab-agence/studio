/**
 * Composants INTERACTIFS spécialisés et configuration (lot 2 de la vague « config sur les 58 »).
 *
 * ⚠️ **Même double propriété que le lot 1 (visuels)** :
 * 1. sans configuration, le rendu est **identique** (le libellé par défaut est celui affiché) ;
 * 2. une `config.labels` fournie **remplace** ce libellé au rendu.
 *
 * Sans ce test, les composants spécialisés — qui affichaient des titres en dur ignorés par le
 * créateur et l'IA — pourraient redevenir sourds à `config` sans qu'aucun test ne le voie.
 */
import { render, screen } from '@testing-library/react';
import { GitTimeTravel } from '@/components/interactive/GitTimeTravel';
import { ReflogExplorer } from '@/components/specialized/part-8/ReflogExplorer';
import { ResolutionGuide } from '@/components/specialized/part-7/ResolutionGuide';
import { ForkVsCloneDemo } from '@/components/specialized/part-5/ForkVsCloneDemo';
import { TrunkBasedDevelopmentVisualizer } from '@/components/specialized/part-6/TrunkBasedDevelopmentVisualizer';

describe('interactifs spécialisés — libellés en configuration (non-régression)', () => {
  it('GitTimeTravel affiche son titre historique sans configuration', () => {
    render(<GitTimeTravel />);
    expect(screen.getByText('Machine à Remonter le Temps Git')).toBeInTheDocument();
  });

  it('ReflogExplorer affiche son titre et sa description historiques sans configuration', () => {
    render(<ReflogExplorer />);
    expect(screen.getByText('Explorateur Reflog')).toBeInTheDocument();
    expect(screen.getByText(/filet de sécurité de Git/)).toBeInTheDocument();
  });

  it('ResolutionGuide affiche son titre historique sans configuration', () => {
    render(<ResolutionGuide />);
    expect(screen.getByText('Guide Pas-à-Pas de Résolution de Conflits')).toBeInTheDocument();
  });

  it('ForkVsCloneDemo affiche son titre historique sans configuration', () => {
    render(<ForkVsCloneDemo />);
    expect(screen.getByText('Démonstration Fork vs Clone')).toBeInTheDocument();
  });

  it('TrunkBasedDevelopmentVisualizer affiche son titre historique sans configuration', () => {
    render(<TrunkBasedDevelopmentVisualizer />);
    expect(screen.getByText('Visualisation du Trunk-Based Development')).toBeInTheDocument();
  });
});

describe('interactifs spécialisés — libellés en configuration (surcharge)', () => {
  it('GitTimeTravel remplace le titre par celui de la configuration', () => {
    render(<GitTimeTravel config={{ labels: { title: 'Mon voyage Git' } }} />);
    expect(screen.getByText('Mon voyage Git')).toBeInTheDocument();
    expect(screen.queryByText('Machine à Remonter le Temps Git')).toBeNull();
  });

  it('ReflogExplorer remplace titre ET description de la configuration', () => {
    render(
      <ReflogExplorer
        config={{ labels: { title: 'Journal local', description: 'Description personnalisée.' } }}
      />,
    );
    expect(screen.getByText('Journal local')).toBeInTheDocument();
    expect(screen.getByText('Description personnalisée.')).toBeInTheDocument();
  });

  it('ResolutionGuide remplace le titre sans toucher à la description par défaut', () => {
    render(<ResolutionGuide config={{ labels: { title: 'Résoudre comme un pro' } }} />);
    expect(screen.getByText('Résoudre comme un pro')).toBeInTheDocument();
    expect(
      screen.getByText('Suivez ces étapes pour résoudre un conflit de fusion comme un pro.'),
    ).toBeInTheDocument();
  });

  it('ForkVsCloneDemo remplace le titre par celui de la configuration', () => {
    render(<ForkVsCloneDemo config={{ labels: { title: 'Fork ou clone ?' } }} />);
    expect(screen.getByText('Fork ou clone ?')).toBeInTheDocument();
  });

  it('TrunkBasedDevelopmentVisualizer remplace le titre par celui de la configuration', () => {
    render(
      <TrunkBasedDevelopmentVisualizer config={{ labels: { title: 'Trunk-based en pratique' } }} />,
    );
    expect(screen.getByText('Trunk-based en pratique')).toBeInTheDocument();
  });
});
