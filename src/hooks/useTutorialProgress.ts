import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Hook pour gérer la progression globale du tutoriel avec persistance Firestore.
 */
export function useTutorialProgress(tutorialId: string, totalSteps: number) {
  const { user, loading: authLoading } = useAuth();
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const progress = totalSteps > 0 ? (completedSteps.size / totalSteps) * 100 : 0;

  // Effect to load progress from Firestore when user or tutorialId changes
  useEffect(() => {
    const fetchProgress = async () => {
      if (!user || !db || !tutorialId) {
        setLoading(false);
        // If no user or tutorialId, progress is not tracked/loaded
        return;
      }

      setLoading(true);
      try {
        const tutorialProgressRef = collection(db, 'users', user.uid, 'tutorials', tutorialId, 'completedSteps');
        const querySnapshot = await getDocs(tutorialProgressRef);
        const steps = new Set<string>();
        querySnapshot.forEach((doc) => {
          steps.add(doc.id); // Document ID is the stepId
        });
        setCompletedSteps(steps);
      } catch (error) {
        console.error("Error fetching tutorial progress:", error);
        // Optionally show a toast notification for the error
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [user, tutorialId]); // Re-run effect if user or tutorialId changes

  const completeStep = useCallback(async (stepId: string) => {
    if (!user || !db || !tutorialId || completedSteps.has(stepId)) {
      // Don't try to save if no user, no db, no tutorialId, or step is already completed
      return;
    }

    const stepDocRef = doc(db, 'users', user.uid, 'tutorials', tutorialId, 'completedSteps', stepId);
    try {
      await setDoc(stepDocRef, { completedAt: new Date() }); // Save step completion timestamp
      setCompletedSteps((prev) => new Set(prev).add(stepId));
    } catch (error) {
      console.error("Error saving tutorial step completion:", error);
      // Optionally show a toast notification for the error
    }
  }, [user, tutorialId, completedSteps]); // Include completedSteps in dependency array

  return { progress, completedSteps, completeStep, loading: loading || authLoading };
}
