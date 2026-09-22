'use client';

import { useCallback, useMemo } from 'react';
import { useTutorial } from '@/contexts/TutorialContext';

/**
 * Progression d'un chapitre (« tutoriel »), vue comme une suite d'étapes.
 *
 * ⚠️ **Ce hook ne stocke rien.** Il dérive son état du contexte, qui est la
 * source unique — et qui persiste désormais côté serveur (REQ-PROG-01).
 *
 * Il maintenait auparavant son propre `Set` en mémoire et sa propre lecture
 * Firestore : deux sources pour la même donnée, qui divergeaient dès que l'une
 * était mise à jour sans l'autre. Un apprenant pouvait voir une leçon cochée
 * dans un écran et décochée dans un autre.
 *
 * Les « étapes » d'un chapitre sont ses **leçons** : marquer une étape revient à
 * marquer une leçon terminée, ce que le contexte enregistre déjà.
 *
 * ⚠️ Aucun consommateur à ce jour : le hook est prêt pour la phase 11 (parcours
 * d'apprentissage), mais n'est encore utilisé nulle part. Il est testé
 * directement.
 */
export function useTutorialProgress(chapterId: string, totalSteps: number) {
  const { progress, courseChapters, isLoading, setLessonCompleted } = useTutorial();

  const chapter = useMemo(
    () => courseChapters.find((candidate) => candidate.id === chapterId),
    [courseChapters, chapterId],
  );

  /**
   * Étapes terminées de ce chapitre.
   *
   * On filtre les leçons **du chapitre** : le contexte suit les leçons de toute
   * la formation, et compter celles des autres chapitres fausserait le
   * pourcentage.
   */
  const completedSteps = useMemo(() => {
    if (!chapter) return new Set<string>();

    return new Set(
      chapter.lessons
        .map((lesson) => lesson.id)
        .filter((lessonId) => progress.completedLessons.has(lessonId)),
    );
  }, [chapter, progress.completedLessons]);

  // Le nombre d'étapes annoncé fait foi s'il est fourni : un chapitre en cours
  // de création peut ne pas encore avoir toutes ses leçons.
  const denominator = totalSteps > 0 ? totalSteps : (chapter?.lessons.length ?? 0);
  const completion = denominator > 0 ? (completedSteps.size / denominator) * 100 : 0;

  const completeStep = useCallback(
    (stepId: string) => {
      setLessonCompleted(stepId, true);
    },
    [setLessonCompleted],
  );

  const uncompleteStep = useCallback(
    (stepId: string) => {
      setLessonCompleted(stepId, false);
    },
    [setLessonCompleted],
  );

  return {
    /** Pourcentage d'achèvement du chapitre, de 0 à 100. */
    progress: completion,
    completedSteps,
    completeStep,
    uncompleteStep,
    loading: isLoading,
  };
}
