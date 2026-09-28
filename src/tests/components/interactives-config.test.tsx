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
import { PullRequestCreator } from '@/components/interactive/PullRequestCreator';
import { WorkflowDesigner } from '@/components/interactive/WorkflowDesigner';
import { CollaborationSimulator } from '@/components/interactive/CollaborationSimulator';
import { ConflictPlayground } from '@/components/specialized/part-7/ConflictPlayground';
import { TimelineNavigator } from '@/components/specialized/part-8/TimelineNavigator';
import { BranchCreator } from '@/components/interactive/BranchCreator';
import { ConflictResolver } from '@/components/interactive/ConflictResolver';
import { PRWorkflowSimulator } from '@/components/specialized/part-5/PRWorkflowSimulator';
import { IssueTracker } from '@/components/specialized/part-9/IssueTracker';
import { VersioningDemo } from '@/components/specialized/part-1/VersioningDemo';

/**
 * ⚠️ **`next-intl` est mocké.** `VersioningDemo` appelle `useFormatter()`, qui exige un
 * `NextIntlClientProvider` (absent d'un rendu unitaire isolé). On ne teste ici que les
 * **libellés de `config`** : le formatage de date n'est pas le sujet.
 */
jest.mock('next-intl', () => ({
  useFormatter: () => ({ dateTime: () => '01/01/2026, 00:00' }),
}));

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

describe('interactifs spécialisés (paquet 2) — libellés en configuration (non-régression)', () => {
  it('PullRequestCreator affiche son titre historique sans configuration', () => {
    render(<PullRequestCreator />);
    expect(screen.getByText('Créateur de Pull Request')).toBeInTheDocument();
  });

  it('WorkflowDesigner affiche son titre historique sans configuration', () => {
    render(<WorkflowDesigner />);
    expect(screen.getByText('Designer de Workflow Git')).toBeInTheDocument();
  });

  it('CollaborationSimulator affiche son titre historique sans configuration', () => {
    render(<CollaborationSimulator />);
    expect(screen.getByText('Simulateur de Collaboration')).toBeInTheDocument();
  });

  it('ConflictPlayground affiche son titre historique sans configuration', () => {
    render(<ConflictPlayground />);
    expect(screen.getByText('Terrain de Jeu pour Conflits')).toBeInTheDocument();
  });

  it('TimelineNavigator affiche son titre historique sans configuration', () => {
    render(<TimelineNavigator />);
    expect(screen.getByText('Navigateur de Timeline')).toBeInTheDocument();
  });
});

describe('interactifs spécialisés (paquet 2) — libellés en configuration (surcharge)', () => {
  it('PullRequestCreator remplace le titre par celui de la configuration', () => {
    render(<PullRequestCreator config={{ labels: { title: 'Ma Pull Request' } }} />);
    expect(screen.getByText('Ma Pull Request')).toBeInTheDocument();
    expect(screen.queryByText('Créateur de Pull Request')).toBeNull();
  });

  it('WorkflowDesigner remplace titre ET description de la configuration', () => {
    render(
      <WorkflowDesigner
        config={{ labels: { title: 'Mon workflow', description: 'Description personnalisée.' } }}
      />,
    );
    expect(screen.getByText('Mon workflow')).toBeInTheDocument();
    expect(screen.getByText('Description personnalisée.')).toBeInTheDocument();
  });

  it('CollaborationSimulator remplace le titre par celui de la configuration', () => {
    render(<CollaborationSimulator config={{ labels: { title: 'Travail d’équipe' } }} />);
    expect(screen.getByText('Travail d’équipe')).toBeInTheDocument();
  });

  it('ConflictPlayground remplace le titre sans toucher à la description par défaut', () => {
    render(<ConflictPlayground config={{ labels: { title: 'Résous le conflit' } }} />);
    expect(screen.getByText('Résous le conflit')).toBeInTheDocument();
    expect(
      screen.getByText('Modifiez le texte ci-dessous pour résoudre le conflit manuellement.'),
    ).toBeInTheDocument();
  });

  it('TimelineNavigator remplace le titre par celui de la configuration', () => {
    render(<TimelineNavigator config={{ labels: { title: 'Ma timeline' } }} />);
    expect(screen.getByText('Ma timeline')).toBeInTheDocument();
  });
});

describe('interactifs spécialisés (paquet 3) — libellés en configuration (non-régression)', () => {
  it('BranchCreator affiche son titre historique sans configuration', () => {
    render(<BranchCreator />);
    expect(screen.getByText('Simulateur de Création de Branches')).toBeInTheDocument();
  });

  it('ConflictResolver affiche son titre historique sans configuration', () => {
    render(<ConflictResolver />);
    expect(screen.getByText('Résolveur de Conflits Interactif')).toBeInTheDocument();
  });

  it('PRWorkflowSimulator affiche son titre historique sans configuration', () => {
    render(<PRWorkflowSimulator />);
    expect(screen.getByText('Simulateur de Workflow de Pull Request')).toBeInTheDocument();
  });

  it('IssueTracker affiche son texte historique (bouton « New Issue ») sans configuration', () => {
    render(<IssueTracker />);
    expect(screen.getByText('New Issue')).toBeInTheDocument();
  });

  it('VersioningDemo affiche ses textes historiques sans configuration', () => {
    render(<VersioningDemo />);
    expect(screen.getByText('Démonstration du Versioning')).toBeInTheDocument();
    expect(screen.getByText('Historique des versions')).toBeInTheDocument();
  });
});

describe('interactifs spécialisés (paquet 3) — libellés en configuration (surcharge)', () => {
  it('BranchCreator remplace le titre par celui de la configuration', () => {
    render(<BranchCreator config={{ labels: { title: 'Mes branches' } }} />);
    expect(screen.getByText('Mes branches')).toBeInTheDocument();
    expect(screen.queryByText('Simulateur de Création de Branches')).toBeNull();
  });

  it('ConflictResolver remplace titre ET description de la configuration', () => {
    render(
      <ConflictResolver
        config={{ labels: { title: 'Conflit maison', description: 'Description personnalisée.' } }}
      />,
    );
    expect(screen.getByText('Conflit maison')).toBeInTheDocument();
    expect(screen.getByText('Description personnalisée.')).toBeInTheDocument();
  });

  it('PRWorkflowSimulator remplace le titre par celui de la configuration', () => {
    render(<PRWorkflowSimulator config={{ labels: { title: 'Mon cycle de PR' } }} />);
    expect(screen.getByText('Mon cycle de PR')).toBeInTheDocument();
  });

  it('IssueTracker remplace le libellé du bouton « New Issue » par celui de la configuration', () => {
    render(<IssueTracker config={{ labels: { createIssue: 'Nouvelle issue' } }} />);
    expect(screen.getByText('Nouvelle issue')).toBeInTheDocument();
    expect(screen.queryByText('New Issue')).toBeNull();
  });

  it('VersioningDemo remplace titre, en-tête d’historique et libellé de commit', () => {
    render(
      <VersioningDemo
        config={{
          labels: {
            title: 'Mon versioning',
            historyHeading: 'Mes versions',
            commitButton: 'Enregistrer la version',
          },
        }}
      />,
    );
    expect(screen.getByText('Mon versioning')).toBeInTheDocument();
    expect(screen.getByText('Mes versions')).toBeInTheDocument();
    expect(screen.getByText('Enregistrer la version')).toBeInTheDocument();
  });
});
