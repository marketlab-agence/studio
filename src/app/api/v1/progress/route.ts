import { NextResponse } from 'next/server';
import { getProgressProvider } from '@/lib/providers';
import { progressSaveSchema } from '@/lib/schemas/progress';
import {
  enforceRateLimit,
  errorResponse,
  mapAuthError,
  parseBody,
  requireSession,
  scopeFromClaims,
} from '@/lib/auth/api';
import { RATE_LIMITS } from '@/lib/rate-limit';

/**
 * GET  /api/v1/progress — progression de l'apprenant connecté.
 * POST /api/v1/progress — enregistre la progression d'une formation.
 *
 * ⚠️ **Aucun identifiant d'utilisateur n'est accepté en paramètre** : il vient du
 * jeton. L'accepter permettrait à un apprenant d'écrire la progression d'un
 * autre, ou de lire la sienne depuis un compte qui n'est pas le sien.
 *
 * Le `GET` retourne **toutes** les formations en une fois : le tableau de bord a
 * besoin de l'ensemble, et interroger formation par formation multiplierait les
 * allers-retours.
 */

/** Convertit les `Set` en tableaux : `Set` ne traverse pas JSON. */
function serializeProgress(progress: Awaited<ReturnType<ReturnType<typeof getProgressProvider>['getAll']>>) {
  return Object.fromEntries(
    Object.entries(progress).map(([courseId, course]) => [
      courseId,
      { ...course, completedLessons: [...course.completedLessons] },
    ]),
  );
}

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session.response) return session.response;

  try {
    const progress = await getProgressProvider().getAll(scopeFromClaims(session.claims));
    return NextResponse.json({ progress: serializeProgress(progress) });
  } catch (error) {
    return mapAuthError(error, 'GET /api/v1/progress');
  }
}

export async function POST(request: Request) {
  const session = await requireSession(request);
  if (session.response) return session.response;

  // Une leçon terminée déclenche un enregistrement : la limite est large, mais
  // elle existe pour qu'un client emballé ne martèle pas la base.
  const limited = enforceRateLimit(request, 'progress-save', RATE_LIMITS.refresh);
  if (limited) return limited;

  const body = await parseBody(request, progressSaveSchema);
  if (body.response) return body.response;

  try {
    await getProgressProvider().saveCourse(scopeFromClaims(session.claims), body.data.courseId, {
      completedLessons: new Set(body.data.completedLessons),
      quizScores: body.data.quizScores,
      quizAttempts: body.data.quizAttempts,
      quizAnswers: body.data.quizAnswers,
      currentChapterId: body.data.currentChapterId,
      currentLessonId: body.data.currentLessonId,
      currentView: body.data.currentView,
    });

    return NextResponse.json({ saved: true });
  } catch (error) {
    // Une formation d'une autre organisation est un refus, pas une panne.
    if (error instanceof Error && /introuvable dans cette organisation/.test(error.message)) {
      return errorResponse(error.message, 403);
    }

    return mapAuthError(error, 'POST /api/v1/progress');
  }
}
