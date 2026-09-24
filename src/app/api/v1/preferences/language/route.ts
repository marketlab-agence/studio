import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserProvider } from '@/lib/providers';
import {
  enforceRateLimit,
  mapAuthError,
  parseBody,
  requireSession,
  scopeFromClaims,
} from '@/lib/auth/api';
import { RATE_LIMITS } from '@/lib/rate-limit';

/**
 * Enregistre la langue d'interface choisie.
 *
 * ⚠️ **Route API, non localisée** (sous `src/app/api/`, pas `[locale]`) : elle est
 * appelée par du code, et sa réponse ne dépend pas de la langue de l'appelant. La
 * placer sous `[locale]` créerait deux URL pour le même endpoint.
 *
 * ⚠️ **L'utilisateur ne peut changer que SA préférence.** Aucun identifiant
 * d'utilisateur n'est accepté en entrée : le périmètre vient du **jeton**
 * (`requireSession` → `scopeFromClaims`). Passer par `getRequestScope` aurait été
 * un défaut silencieux — cette fonction est un pont de la phase 3 qui retourne le
 * premier utilisateur de la base, pas celui de la requête : la préférence aurait
 * été écrite sur le compte de quelqu'un d'autre.
 */
const BodySchema = z.object({ language: z.enum(['fr', 'en', 'es']) });

export async function PUT(request: Request) {
  const session = await requireSession(request);
  if (session.response) return session.response;

  // Changement de langue : action rare, mais un client emballé ne doit pas
  // marteler la base. La limite de rafraîchissement est appropriée (appel ponctuel).
  const limited = enforceRateLimit(request, 'preferences-language', RATE_LIMITS.refresh);
  if (limited) return limited;

  const body = await parseBody(request, BodySchema);
  if (body.response) return body.response;

  try {
    await getUserProvider().updatePreferredLanguage(scopeFromClaims(session.claims), body.data.language);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return mapAuthError(error, 'preferences/language');
  }
}
