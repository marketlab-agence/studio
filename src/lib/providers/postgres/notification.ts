import { query } from '@/lib/db/pool';
import type { EmailProvider } from '../email';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type DispatchInput,
  type DispatchResult,
  type Notification,
  type NotificationInput,
  type NotificationPreferences,
  type NotificationProvider,
} from '../notification';
import { assertScope, type OrgScope } from '../types';

type NotificationRow = {
  id: string;
  user_id: string;
  kind: Notification['kind'];
  payload: Record<string, unknown>;
  read_at: Date | null;
  created_at: Date;
};

type PreferenceRow = {
  in_app: boolean;
  email: boolean;
  push: boolean;
};

function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind,
    payload: row.payload ?? {},
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

/**
 * Notifications en PostgreSQL.
 *
 * `notifications` porte le canal in-app (une ligne = une notification) ;
 * `notification_preferences` porte les préférences, une ligne par utilisateur.
 *
 * RÈGLE D'ISOLATION : `organization_id` filtre chaque lecture et chaque
 * écriture, **y compris** pour `markRead`, où l'identifiant seul ne suffit pas
 * à autoriser l'action.
 */
export class PostgresNotificationProvider implements NotificationProvider {
  /**
   * Le transport email est injecté : ce provider ne le construit pas lui-même,
   * ce qui évite un import circulaire et le rend substituable en test.
   */
  constructor(private readonly emailProvider: () => EmailProvider) {}

  async getPreferences(scope: OrgScope, userId: string): Promise<NotificationPreferences> {
    const { organizationId } = assertScope(scope);

    const { rows } = await query<PreferenceRow>(
      `SELECT p.in_app, p.email, p.push
       FROM notification_preferences p
       JOIN users u ON u.id = p.user_id
       WHERE u.organization_id = $1 AND p.user_id = $2`,
      [organizationId, userId],
    );

    return rows[0]
      ? { in_app: rows[0].in_app, email: rows[0].email, push: rows[0].push }
      : { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }

  async setPreferences(
    scope: OrgScope,
    userId: string,
    preferences: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    const { organizationId } = assertScope(scope);

    // L'appartenance de l'utilisateur à l'organisation est vérifiée avant
    // d'écrire : sans cela, on poserait des préférences chez autrui.
    const owner = await query<{ id: string }>(
      'SELECT id FROM users WHERE organization_id = $1 AND id = $2',
      [organizationId, userId],
    );
    if (owner.rows.length === 0) {
      throw new Error(`Utilisateur "${userId}" introuvable dans cette organisation.`);
    }

    const merged = { ...DEFAULT_NOTIFICATION_PREFERENCES, ...preferences };

    const { rows } = await query<PreferenceRow>(
      `INSERT INTO notification_preferences (user_id, in_app, email, push)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET
         in_app = EXCLUDED.in_app, email = EXCLUDED.email, push = EXCLUDED.push
       RETURNING in_app, email, push`,
      [userId, merged.in_app, merged.email, merged.push],
    );

    return { in_app: rows[0].in_app, email: rows[0].email, push: rows[0].push };
  }

  async create(scope: OrgScope, input: NotificationInput): Promise<Notification | null> {
    const { organizationId } = assertScope(scope);

    const preferences = await this.getPreferences(scope, input.userId);
    if (!preferences.in_app) return null;

    const owner = await query<{ id: string }>(
      'SELECT id FROM users WHERE organization_id = $1 AND id = $2',
      [organizationId, input.userId],
    );
    if (owner.rows.length === 0) {
      throw new Error(`Utilisateur "${input.userId}" introuvable dans cette organisation.`);
    }

    const { rows } = await query<NotificationRow>(
      `INSERT INTO notifications (organization_id, user_id, kind, payload)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, kind, payload, read_at, created_at`,
      [organizationId, input.userId, input.kind, JSON.stringify(input.payload ?? {})],
    );

    return toNotification(rows[0]);
  }

  async list(
    scope: OrgScope,
    userId: string,
    options: { unreadOnly?: boolean; limit?: number } = {},
  ): Promise<Notification[]> {
    const { organizationId } = assertScope(scope);

    const { rows } = await query<NotificationRow>(
      `SELECT id, user_id, kind, payload, read_at, created_at
       FROM notifications
       WHERE organization_id = $1
         AND user_id = $2
         AND ($3::boolean IS NOT TRUE OR read_at IS NULL)
       ORDER BY created_at DESC
       LIMIT $4`,
      [organizationId, userId, options.unreadOnly ?? false, options.limit ?? 50],
    );

    return rows.map(toNotification);
  }

  async unreadCount(scope: OrgScope, userId: string): Promise<number> {
    const { organizationId } = assertScope(scope);

    const { rows } = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count
       FROM notifications
       WHERE organization_id = $1 AND user_id = $2 AND read_at IS NULL`,
      [organizationId, userId],
    );

    return Number(rows[0].count);
  }

  async markRead(scope: OrgScope, notificationId: string): Promise<void> {
    const { organizationId } = assertScope(scope);

    // L'identifiant seul ne suffit pas : le filtre par organisation empêche de
    // marquer comme lue la notification d'une autre organisation.
    await query(
      `UPDATE notifications SET read_at = NOW()
       WHERE organization_id = $1 AND id = $2 AND read_at IS NULL`,
      [organizationId, notificationId],
    );
  }

  async markAllRead(scope: OrgScope, userId: string): Promise<void> {
    const { organizationId } = assertScope(scope);

    await query(
      `UPDATE notifications SET read_at = NOW()
       WHERE organization_id = $1 AND user_id = $2 AND read_at IS NULL`,
      [organizationId, userId],
    );
  }

  async dispatch(scope: OrgScope, input: DispatchInput): Promise<DispatchResult> {
    assertScope(scope);

    const preferences = await this.getPreferences(scope, input.userId);
    const delivered: DispatchResult['delivered'] = [];
    const skipped: DispatchResult['skipped'] = [];

    // --- Canal in-app --------------------------------------------------------
    let notificationId: string | null = null;
    if (preferences.in_app) {
      const created = await this.create(scope, input);
      notificationId = created?.id ?? null;
      if (notificationId) delivered.push('in_app');
    } else {
      skipped.push({ channel: 'in_app', reason: 'canal désactivé par l’utilisateur' });
    }

    // --- Canal email ---------------------------------------------------------
    if (!preferences.email) {
      skipped.push({ channel: 'email', reason: 'canal désactivé par l’utilisateur' });
    } else if (!input.email) {
      skipped.push({ channel: 'email', reason: 'aucun contenu email fourni' });
    } else {
      try {
        await this.emailProvider().send(input.email);
        delivered.push('email');
      } catch (error) {
        // Un échec d'email ne doit pas annuler la notification in-app déjà
        // créée : le motif est rapporté, l'appelant décide quoi en faire.
        skipped.push({
          channel: 'email',
          reason: error instanceof Error ? error.message : 'échec d’envoi inconnu',
        });
      }
    }

    // --- Canal push ----------------------------------------------------------
    // Aucun transport push n'existe à ce stade (Capacitor, Couche 2). Le dire
    // explicitement vaut mieux que de laisser croire à une livraison.
    skipped.push({
      channel: 'push',
      reason: preferences.push
        ? 'transport push non implémenté (prévu en Couche 2, Capacitor)'
        : 'canal désactivé par l’utilisateur',
    });

    return { notificationId, delivered, skipped };
  }
}
