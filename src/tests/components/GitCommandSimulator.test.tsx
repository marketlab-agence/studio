import React from 'react';
import { render, screen } from '@testing-library/react';
import { GitCommandSimulator } from '@/components/interactive/GitCommandSimulator';

describe('GitCommandSimulator', () => {
  test('devrait afficher le titre du simulateur', () => {
    render(<GitCommandSimulator />);
    const titleElement = screen.getByText(/Simulateur de Commandes Git/i);
    expect(titleElement).toBeInTheDocument();
  });

  test('devrait avoir un champ de saisie et un bouton', () => {
    render(<GitCommandSimulator />);
    const inputElement = screen.getByPlaceholderText(/git clone/i);
    const buttonElement = screen.getByRole('button', { name: /Exécuter/i });
    expect(inputElement).toBeInTheDocument();
    expect(buttonElement).toBeInTheDocument();
  });
});
