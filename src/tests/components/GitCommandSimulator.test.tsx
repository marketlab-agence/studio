import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GitCommandSimulator } from '@/components/interactive/GitCommandSimulator';

/**
 * `GitCommandSimulator` — configuration Git de la primitive `StepByStepRunner`.
 *
 * ⚠️ **Ces tests ont été réécrits, pas ajustés.** Les précédents vérifiaient la présence d'un
 * champ et d'un bouton « Exécuter » — c'est-à-dire l'apparence du **placeholder**. Le bouton
 * n'avait aucun `onClick` : le test passait sur une interface inerte, ce qui est précisément
 * le défaut que la phase 6 corrige.
 *
 * Les tests portent désormais sur ce qui compte : l'apprenant peut-il **réellement** exécuter
 * la procédure, et la validation se comporte-t-elle correctement ?
 */

// Le composant enregistre des traces via `fetch` : on l'isole pour que les tests restent
// unitaires (aucun appel réseau).
beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({}) }) as unknown as typeof fetch;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('GitCommandSimulator', () => {
  test('affiche la procédure et sa progression', () => {
    render(<GitCommandSimulator lessonId="test-lesson" />);

    expect(screen.getByText(/Commandes Git essentielles/i)).toBeInTheDocument();
    // La progression est visible : l'apprenant sait où il en est.
    expect(screen.getByText('0/5')).toBeInTheDocument();
  });

  test('affiche les cinq commandes essentielles comme des étapes', () => {
    render(<GitCommandSimulator lessonId="test-lesson" />);

    // Ce sont des **données**, pas du code : la procédure est lisible d'emblée.
    expect(screen.getByText(/Cloner un dépôt distant/i)).toBeInTheDocument();
    expect(screen.getByText(/Vérifier l’état du dépôt/i)).toBeInTheDocument();
    expect(screen.getByText(/Enregistrer les modifications indexées/i)).toBeInTheDocument();
    expect(screen.getByText(/Envoyer les commits locaux/i)).toBeInTheDocument();
  });

  test('refuse une réponse erronée et propose un indice', async () => {
    const user = userEvent.setup();
    render(<GitCommandSimulator lessonId="test-lesson" />);

    await user.type(screen.getByLabelText(/votre réponse/i), 'git init');
    await user.click(screen.getByRole('button', { name: /Valider l’étape/i }));

    // L'erreur est annoncée (rôle `alert` : les lecteurs d'écran la perçoivent).
    expect(await screen.findByRole('alert')).toHaveTextContent(/pas la réponse attendue/i);
    // L'indice est disponible mais **pas imposé** : l'apprenant doit pouvoir chercher seul.
    expect(screen.getByRole('button', { name: /Voir un indice/i })).toBeInTheDocument();
  });

  test('valide une étape correcte et avance dans la procédure', async () => {
    const user = userEvent.setup();
    render(<GitCommandSimulator lessonId="test-lesson" />);

    await user.type(screen.getByLabelText(/votre réponse/i), 'git clone');
    await user.click(screen.getByRole('button', { name: /Valider l’étape/i }));

    // La progression avance : c'est la preuve que l'interaction fonctionne.
    expect(await screen.findByText('1/5')).toBeInTheDocument();
  });

  test('accepte une réponse à la casse ou aux espaces près', async () => {
    const user = userEvent.setup();
    render(<GitCommandSimulator lessonId="test-lesson" />);

    // Une casse différente ne doit pas faire échouer un apprenant qui a compris.
    await user.type(screen.getByLabelText(/votre réponse/i), '  GIT Clone  ');
    await user.click(screen.getByRole('button', { name: /Valider l’étape/i }));

    expect(await screen.findByText('1/5')).toBeInTheDocument();
  });

  test('enregistre une trace d’interaction (indicateur 19 du RNQ)', async () => {
    const user = userEvent.setup();
    render(<GitCommandSimulator lessonId="test-lesson" />);

    await user.type(screen.getByLabelText(/votre réponse/i), 'git clone');
    await user.click(screen.getByRole('button', { name: /Valider l’étape/i }));

    // ⚠️ C'est l'exigence qui justifie la réécriture : sans trace, le décret n'est pas
    // satisfait — un apprenant pourrait avoir « tout vu » sans rien produire.
    await screen.findByText('1/5');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/v1/interactions',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"lessonId":"test-lesson"'),
      }),
    );
  });
});
