import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { TutorialProvider, useTutorial } from '@/components/providers/TutorialProvider';
import { Button } from '@/components/ui/button';

const TestComponent = () => {
  const { progress, updateProgress } = useTutorial();
  return (
    <div>
      <span data-testid="progress-value">{progress}</span>
      <Button onClick={() => updateProgress(50)}>Mettre à jour</Button>
    </div>
  );
};

describe('TutorialProvider', () => {
  test('devrait fournir la valeur de progression initiale et la mettre à jour', () => {
    render(
      <TutorialProvider>
        <TestComponent />
      </TutorialProvider>
    );

    const progressValue = screen.getByTestId('progress-value');
    expect(progressValue.textContent).toBe('0');

    const updateButton = screen.getByRole('button', { name: /Mettre à jour/i });
    act(() => {
        updateButton.click();
    });

    expect(progressValue.textContent).toBe('50');
  });
});
