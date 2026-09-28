/**
 * Composants VISUELS et configuration (lot 1 de la vague « config sur les 58 »).
 *
 * ⚠️ **Deux propriétés à la fois** :
 * 1. sans configuration, le rendu est **identique** (le libellé par défaut est celui affiché) ;
 * 2. une `config.labels` fournie **remplace** ce libellé au rendu.
 *
 * Sans ce test, l'écart corrigé (une config éditée mais silencieusement ignorée) pourrait
 * réapparaître sans qu'aucun test ne le voie.
 */
import { render, screen } from '@testing-library/react';
import { BranchDiagram } from '@/components/visualizations/BranchDiagram';
import { GitGraph } from '@/components/visualizations/GitGraph';
import { WorkflowComparisonTable } from '@/components/specialized/part-6/WorkflowComparisonTable';

describe('visuels — libellés en configuration', () => {
  it('affiche le libellé par défaut sans configuration (non-régression)', () => {
    render(<BranchDiagram />);
    expect(screen.getByText('Diagramme des Branches')).toBeTruthy();
  });

  it('remplace le titre par celui de la configuration', () => {
    render(<BranchDiagram config={{ labels: { title: 'Mon schéma' } }} />);
    expect(screen.getByText('Mon schéma')).toBeTruthy();
    expect(screen.queryByText('Diagramme des Branches')).toBeNull();
  });

  it('remplace le titre d’un composant à balise h3 (GitGraph)', () => {
    render(<GitGraph config={{ labels: { title: 'Flux personnalisé' } }} />);
    expect(screen.getByText('Flux personnalisé')).toBeTruthy();
  });

  it('remplace aussi la description quand le composant en affiche une', () => {
    render(
      <WorkflowComparisonTable config={{ labels: { description: 'Description personnalisée.' } }} />,
    );
    expect(screen.getByText('Description personnalisée.')).toBeTruthy();
    // Le titre par défaut reste (aucune surcharge fournie).
    expect(screen.getByText('Tableau Comparatif des Workflows Git')).toBeTruthy();
  });
});
