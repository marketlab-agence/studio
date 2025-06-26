import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  test('devrait afficher le texte du bouton', () => {
    render(<Button>Cliquez ici</Button>);
    const buttonElement = screen.getByText(/Cliquez ici/i);
    expect(buttonElement).toBeInTheDocument();
  });

  test('devrait appeler la fonction onClick lorsqu\'on clique', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Cliquez ici</Button>);
    const buttonElement = screen.getByText(/Cliquez ici/i);
    await userEvent.click(buttonElement);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('devrait être désactivé si la prop disabled est passée', () => {
    render(<Button disabled>Cliquez ici</Button>);
    const buttonElement = screen.getByRole('button');
    expect(buttonElement).toBeDisabled();
  });
});
