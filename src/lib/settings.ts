import type { AppSettings } from '@/types/settings.types';
import { getRequestScope, getSettingsProvider } from '@/lib/providers';

/**
 * Paramètres applicatifs de l'organisation courante.
 *
 * Ces fonctions ne connaissent que l'interface `SettingsProvider` : le stockage
 * réel (PostgreSQL aujourd'hui) est choisi par `DATA_PROVIDER`. Voir ADR 0001.
 *
 * Conservées pour ne pas casser les appelants existants (`adminActions`) ;
 * elles seront remplacées par un accès direct au provider lorsque la résolution
 * du scope sera définitive (phase 4 : auth).
 */

/**
 * Lit les paramètres de l'organisation courante.
 * Retourne les valeurs par défaut si l'organisation n'a rien configuré.
 */
export async function getSettings(): Promise<AppSettings> {
  const scope = await getRequestScope();
  return getSettingsProvider().getSettings(scope);
}

/**
 * Enregistre les paramètres de l'organisation courante.
 * @param settings - Les paramètres à enregistrer (remplace les précédents).
 */
export async function saveSettings(settings: AppSettings): Promise<void> {
  const scope = await getRequestScope();
  await getSettingsProvider().saveSettings(scope, settings);
}
