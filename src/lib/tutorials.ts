import type { Tutorial } from '@/types/tutorial.types';
import { getContentProvider, getRequestScope, type ChapterWithLessons } from '@/lib/providers';

/**
 * Chapitres de l'organisation courante (« tutorials » dans l'ancien modèle
 * Firestore). Un `Tutorial` est un chapitre accompagné de ses leçons.
 *
 * Ce module ne connaît plus Firestore : il passe par `ContentProvider` (ADR 0001).
 */

function toTutorial(chapter: ChapterWithLessons): Tutorial {
  return {
    id: chapter.id,
    courseId: chapter.courseId,
    title: chapter.title,
    description: chapter.description,
    lessons: chapter.lessons,
  };
}

/**
 * `position` et `weekId` sont recalculés/normalisés côté provider :
 * `saveChapters` déduit la position de l'ordre du tableau reçu, par formation.
 * Les valeurs posées ici sont donc des valeurs de passage.
 */
function fromTutorial(tutorial: Tutorial): ChapterWithLessons {
  return {
    id: tutorial.id,
    courseId: tutorial.courseId,
    title: tutorial.title,
    description: tutorial.description ?? '',
    weekId: null,
    position: 0,
    unlockRuleId: null,
    lessons: tutorial.lessons ?? [],
  };
}

/**
 * Récupère tous les chapitres de l'organisation courante.
 * L'ordre est celui des positions définies pour chaque formation.
 */
export async function getTutorials(): Promise<Tutorial[]> {
  const scope = await getRequestScope();
  const chapters = await getContentProvider().listChapters(scope);
  return chapters.map(toTutorial);
}

/** Récupère un chapitre par son identifiant, ou `null` si absent. */
export async function getTutorialById(id: string): Promise<Tutorial | null> {
  const scope = await getRequestScope();
  const chapter = await getContentProvider().getChapter(scope, id);
  return chapter ? toTutorial(chapter) : null;
}

/**
 * Enregistre une liste de chapitres.
 *
 * ⚠️ Les positions sont recalculées à partir de l'ordre du tableau, formation
 * par formation : l'ordre reçu fait foi. Les leçons ne sont **pas** supprimées
 * puis réinsérées — la progression des apprenants est préservée.
 */
export async function saveTutorials(tutorials: Tutorial[]): Promise<void> {
  const scope = await getRequestScope();
  await getContentProvider().saveChapters(scope, tutorials.map(fromTutorial));
}

/** Supprime un chapitre ; ses leçons et son quiz suivent en cascade. */
export async function deleteTutorial(id: string): Promise<void> {
  const scope = await getRequestScope();
  await getContentProvider().deleteChapter(scope, id);
}
