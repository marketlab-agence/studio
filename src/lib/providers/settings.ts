import type { OrgScope } from './types';

/** Paramètres applicatifs d'une organisation. */
export interface AppSettings {
  instructorName: string;
}

/**
 * Accès aux paramètres de l'organisation.
 * Aucune méthode sans `scope` (ADR 0007).
 */
export interface SettingsProvider {
  getSettings(scope: OrgScope): Promise<AppSettings>;
  saveSettings(scope: OrgScope, settings: AppSettings): Promise<void>;
}

/** Valeurs de repli si l'organisation n'a rien configuré. */
export const DEFAULT_SETTINGS: AppSettings = {
  instructorName: 'Instructeur par défaut',
};

/** Clé unique sous laquelle les paramètres de l'organisation sont stockés. */
export const SETTINGS_KEY = 'app';
