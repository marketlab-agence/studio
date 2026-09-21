import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/providers/settings';

/**
 * Première route de l'API versionnée (phase 9).
 *
 * Rôle dans le Walking Skeleton (phase 0.5) : prouver que la même couche
 * d'accès (provider → PostgreSQL) fonctionne côté route handler.
 */
export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('GET /api/v1/settings — échec :', error);
    return NextResponse.json(
      { message: 'Impossible de lire les paramètres.' },
      { status: 500 },
    );
  }
}
