import type { OrgScope } from './types';

/**
 * Notifications (REQ-NOT-05, design.md §13).
 *
 * Trois canaux, un seul point d'entrée : `dispatch` applique les préférences de
 * l'utilisateur et **rapporte ce qui a réellement été délivré**. Un canal
 * indisponible (push, pas encore implémenté) apparaît donc dans `skipped` au
 * lieu de disparaître en silence.
 */

export type NotificationKind =
  | 'CHAPTER_OPENED'
  | 'ACCESS_REMINDER'
  | 'INACTIVITY_REMINDER'
  | 'DEADLINE_REMINDER';

export type NotificationChannel = 'in_app' | 'email' | 'push';

export interface NotificationPreferences {
  in_app: boolean;
  email: boolean;
  push: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  kind: NotificationKind;
  payload: Record<string, unknown>;
  readAt: Date | null;
  createdAt: Date;
}

export interface NotificationInput {
  userId: string;
  kind: NotificationKind;
  payload?: Record<string, unknown>;
}

/**
 * Contenu de l'email à envoyer si le canal email s'applique.
 * Fourni par l'appelant : le provider ne connaît pas les gabarits.
 */
export interface NotificationEmail {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export interface DispatchInput extends NotificationInput {
  /** Contenu effectif de l'email, si le canal email est envisageable. */
  email?: NotificationEmail;
}

export interface DispatchResult {
  /** Notification in-app créée, ou `null` si le canal est désactivé. */
  notificationId: string | null;
  /** Canaux effectivement délivrés. */
  delivered: NotificationChannel[];
  /** Canaux écartés, avec le motif — jamais silencieux. */
  skipped: { channel: NotificationChannel; reason: string }[];
}

export interface NotificationProvider {
  /** Crée une notification in-app. Retourne `null` si le canal est désactivé. */
  create(scope: OrgScope, input: NotificationInput): Promise<Notification | null>;

  /** Notifications d'un utilisateur, de la plus récente à la plus ancienne. */
  list(
    scope: OrgScope,
    userId: string,
    options?: { unreadOnly?: boolean; limit?: number },
  ): Promise<Notification[]>;

  /** Nombre de notifications non lues (badge). */
  unreadCount(scope: OrgScope, userId: string): Promise<number>;

  /** Marque une notification comme lue. Sans effet si elle est déjà lue. */
  markRead(scope: OrgScope, notificationId: string): Promise<void>;

  /** Marque toutes les notifications d'un utilisateur comme lues. */
  markAllRead(scope: OrgScope, userId: string): Promise<void>;

  /** Préférences d'un utilisateur ; valeurs par défaut s'il n'en a pas posé. */
  getPreferences(scope: OrgScope, userId: string): Promise<NotificationPreferences>;

  setPreferences(
    scope: OrgScope,
    userId: string,
    preferences: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences>;

  /**
   * Envoie sur tous les canaux autorisés par les préférences et rapporte le
   * résultat canal par canal.
   */
  dispatch(scope: OrgScope, input: DispatchInput): Promise<DispatchResult>;
}

/** Préférences appliquées tant que l'utilisateur n'en a pas exprimé. */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  in_app: true,
  email: true,
  push: false,
};
