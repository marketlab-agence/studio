import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Progression d'un tutoriel.
 *
 * ⚠️ **La progression n'est plus persistée.** Elle l'était dans Firestore, dont
 * le couplage est rompu. La persistance revient en **phase 5** (`T5.2`/`T5.3`)
 * via `user_lesson_progress`, exposée par le provider de contenu.
 *
 * En attendant, l'état est **en mémoire** : il fonctionne pendant la session et
 * se réinitialise au rechargement. C'est une dégradation assumée et visible,
 * préférable à du code qui prétendrait sauvegarder sans que rien ne soit écrit.
 */
export function useTutorialProgress(tutorialId: string, totalSteps: number) {
  const { user, loading: authLoading } = useAuth();
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const progress = totalSteps > 0 ? (completedSteps.size / totalSteps) * 100 : 0;

  useEffect(() => {
    // Changement d'utilisateur ou de tutoriel : on repart d'une ardoise vierge
    // plutôt que de conserver la progression du précédent.
    setCompletedSteps(new Set());
    setLoading(false);
  }, [user, tutorialId]);

  const completeStep = useCallback((stepId: string) => {
    // Ignoré sans utilisateur : une progression anonyme n'aurait nulle part où
    // être rattachée.
    if (!user || !tutorialId) return;

    setCompletedSteps((previous) => {
      if (previous.has(stepId)) return previous;
      return new Set(previous).add(stepId);
    });
  }, [user, tutorialId]);

  return { progress, completedSteps, completeStep, loading: loading || authLoading };
}
