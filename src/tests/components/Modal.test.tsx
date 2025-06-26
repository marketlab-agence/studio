import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';

describe('Modal', () => {
  test('ne devrait pas afficher le contenu de la modale par défaut', () => {
    render(
      <Modal trigger={<Button>Ouvrir</Button>} title="Titre de test">
        <p>Contenu de la modale</p>
      </Modal>
    );
    expect(screen.queryByText('Contenu de la modale')).not.toBeInTheDocument();
  });

  test('devrait afficher la modale après avoir cliqué sur le déclencheur', async () => {
    render(
      <Modal trigger={<Button>Ouvrir</Button>} title="Titre de test">
        <p>Contenu de la modale</p>
      </Modal>
    );
    const trigger = screen.getByRole('button', { name: /Ouvrir/i });
    await userEvent.click(trigger);
    expect(screen.getByText('Contenu de la modale')).toBeInTheDocument();
    expect(screen.getByText('Titre de test')).toBeInTheDocument();
  });
});
