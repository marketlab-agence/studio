import React from 'react';
import { render, screen } from '@testing-library/react';
import { BranchAnimator } from '@/components/specialized/part-3/BranchAnimator';

describe('BranchAnimator', () => {
  test('devrait afficher le titre correct', () => {
    render(<BranchAnimator />);
    const titleElement = screen.getByText(/Animateur de Branches/i);
    expect(titleElement).toBeInTheDocument();
  });
});
