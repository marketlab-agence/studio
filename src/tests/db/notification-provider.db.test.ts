import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  getNotificationProvider,
  resetProviders,
  type NotificationProvider,
  type OrgScope,
} from '@/lib/providers';
import { MemoryEmailProvider } from '@/lib/providers/email/memory';
import { PostgresNotificationProvider } from '@/lib/providers/postgres/notification';
import { pool, requireDatabaseOrSkip } from './setup';

/**
 * NotificationProvider (T3.8).
 *
 * Points vérifiés :
 * - le canal in-app est persisté et suit les préférences de l'utilisateur ;
 * - `dispatch` **rapporte** les canaux délivrés et écartés — un canal
 *   indisponible (push) ne doit jamais disparaître en silence ;
 * - l'isolation par organisation tient, y compris sur `markRead` où
 *   l'identifiant seul ne doit pas suffire à autoriser l'action.
 */

const ORG_B_SLUG = 'notif-org-b';

let scopeA: OrgScope;
let scopeB: OrgScope;
let emailProvider: MemoryEmailProvider;

async function prepare(): Promise<boolean> {
  const { rows } = await pool.query<{ organization_id: string; user_id: string; role: string }>(
    `SELECT o.id AS organization_id, u.id AS user_id, u.role
     FROM organizations o JOIN users u ON u.organization_id = o.id
     ORDER BY o.created_at LIMIT 1`,
  );
  if (rows.length === 0) return false;

  scopeA = {
    organizationId: rows[0].organization_id,
    userId: rows[0].user_id,
    role: rows[0].role as OrgScope['role'],
  };

  const created = await pool.query<{ id: string }>(
    `INSERT INTO organizations (name, slug) VALUES ('Org notifications B', $1)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    [ORG_B_SLUG],
  );

  const userB = await pool.query<{ id: string }>(
    `INSERT INTO users (organization_id, email, name, role)
     VALUES ($1, 'notif-b@example.com', 'Utilisateur B', 'Utilisateur')
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    [created.rows[0].id],
  );

  scopeB = {
    organizationId: created.rows[0].id,
    userId: userB.rows[0].id,
    role: 'Utilisateur',
  };
  return true;
}

async function cleanup(): Promise<void> {
  await pool.query('DELETE FROM organizations WHERE slug = $1', [ORG_B_SLUG]);
  await pool.query('DELETE FROM notifications WHERE organization_id = $1', [scopeA.organizationId]);
  await pool.query('DELETE FROM notification_preferences WHERE user_id = $1', [scopeA.userId]);
}

describe('PostgresNotificationProvider', () => {
  let provider: NotificationProvider;

  beforeEach(async () => {
    if (!(await requireDatabaseOrSkip())) return;
    resetProviders();
    if (!(await prepare())) throw new Error('Base non seedée.');

    // Le transport email est substitué : aucun envoi réel, messages inspectables.
    emailProvider = new MemoryEmailProvider();
    provider = new PostgresNotificationProvider(() => emailProvider);
  });

  afterEach(async () => {
    if (!(await requireDatabaseOrSkip())) return;
    await cleanup();
  });

  describe('préférences', () => {
    it('applique les valeurs par défaut tant que rien n’est posé', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      expect(await provider.getPreferences(scopeA, scopeA.userId)).toEqual(
        DEFAULT_NOTIFICATION_PREFERENCES,
      );
    });

    it('enregistre une modification partielle', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const updated = await provider.setPreferences(scopeA, scopeA.userId, { push: true });

      // Les canaux non mentionnés conservent leur valeur par défaut.
      expect(updated).toEqual({ in_app: true, email: true, push: true });
      expect(await provider.getPreferences(scopeA, scopeA.userId)).toEqual(updated);
    });

    it('refuse de poser des préférences sur un utilisateur hors organisation', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await expect(
        provider.setPreferences(scopeA, scopeB.userId, { push: true }),
      ).rejects.toThrow(/introuvable dans cette organisation/);
    });
  });

  describe('canal in-app', () => {
    it('crée une notification et la relit', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const created = await provider.create(scopeA, {
        userId: scopeA.userId,
        kind: 'CHAPTER_OPENED',
        payload: { chapterId: 'git-ch1' },
      });

      expect(created).not.toBeNull();
      expect(created!.kind).toBe('CHAPTER_OPENED');
      expect(created!.readAt).toBeNull();
      expect(created!.payload).toEqual({ chapterId: 'git-ch1' });

      const list = await provider.list(scopeA, scopeA.userId);
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe(created!.id);
    });

    it('ne crée rien quand le canal est désactivé', async () => {
      if (!(await requireDatabaseOrSkip())) return;
      await provider.setPreferences(scopeA, scopeA.userId, { in_app: false });

      const created = await provider.create(scopeA, {
        userId: scopeA.userId,
        kind: 'ACCESS_REMINDER',
      });

      expect(created).toBeNull();
      expect(await provider.list(scopeA, scopeA.userId)).toHaveLength(0);
    });

    it('compte les non-lues et filtre dessus', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const first = await provider.create(scopeA, { userId: scopeA.userId, kind: 'ACCESS_REMINDER' });
      await provider.create(scopeA, { userId: scopeA.userId, kind: 'DEADLINE_REMINDER' });

      expect(await provider.unreadCount(scopeA, scopeA.userId)).toBe(2);

      await provider.markRead(scopeA, first!.id);

      expect(await provider.unreadCount(scopeA, scopeA.userId)).toBe(1);
      expect(await provider.list(scopeA, scopeA.userId, { unreadOnly: true })).toHaveLength(1);
    });

    it('marque tout comme lu', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await provider.create(scopeA, { userId: scopeA.userId, kind: 'ACCESS_REMINDER' });
      await provider.create(scopeA, { userId: scopeA.userId, kind: 'INACTIVITY_REMINDER' });

      await provider.markAllRead(scopeA, scopeA.userId);

      expect(await provider.unreadCount(scopeA, scopeA.userId)).toBe(0);
    });

    it('respecte la limite demandée', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      for (const kind of ['ACCESS_REMINDER', 'INACTIVITY_REMINDER', 'DEADLINE_REMINDER'] as const) {
        await provider.create(scopeA, { userId: scopeA.userId, kind });
      }

      expect(await provider.list(scopeA, scopeA.userId, { limit: 2 })).toHaveLength(2);
    });

    it('refuse de créer une notification pour un utilisateur hors organisation', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await expect(
        provider.create(scopeA, { userId: scopeB.userId, kind: 'ACCESS_REMINDER' }),
      ).rejects.toThrow(/introuvable dans cette organisation/);
    });
  });

  describe('dispatch multi-canal', () => {
    it('délivre in-app et email, et déclare le push non implémenté', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      // L'utilisateur a explicitement demandé le push : le fait que le canal
      // soit indisponible doit être rapporté, pas passé sous silence.
      await provider.setPreferences(scopeA, scopeA.userId, { push: true });

      const result = await provider.dispatch(scopeA, {
        userId: scopeA.userId,
        kind: 'DEADLINE_REMINDER',
        payload: { dueAt: '2026-10-01' },
        email: {
          to: 'apprenant@example.com',
          subject: 'Échéance proche',
          text: 'Votre chapitre se termine bientôt.',
        },
      });

      expect(result.delivered).toEqual(['in_app', 'email']);
      expect(result.notificationId).not.toBeNull();

      // Le push est signalé, jamais silencieusement ignoré.
      expect(result.skipped).toContainEqual(
        expect.objectContaining({ channel: 'push', reason: expect.stringMatching(/non implémenté/) }),
      );

      // L'email a bien été transmis au transport, avec le bon contenu.
      expect(emailProvider.sent).toHaveLength(1);
      expect(emailProvider.last()?.subject).toBe('Échéance proche');
    });

    it('distingue « push non demandé » de « push indisponible »', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      // Par défaut, le push est désactivé : le motif doit le dire.
      const result = await provider.dispatch(scopeA, {
        userId: scopeA.userId,
        kind: 'ACCESS_REMINDER',
      });

      expect(result.skipped).toContainEqual(
        expect.objectContaining({ channel: 'push', reason: expect.stringMatching(/désactivé/) }),
      );
    });

    it('écarte les canaux désactivés en nommant le motif', async () => {
      if (!(await requireDatabaseOrSkip())) return;
      await provider.setPreferences(scopeA, scopeA.userId, { in_app: false, email: false });

      const result = await provider.dispatch(scopeA, {
        userId: scopeA.userId,
        kind: 'ACCESS_REMINDER',
        email: { to: 'x@example.com', subject: 'S', text: 'c' },
      });

      expect(result.delivered).toEqual([]);
      expect(result.notificationId).toBeNull();
      expect(result.skipped).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ channel: 'in_app', reason: expect.stringMatching(/désactivé/) }),
          expect.objectContaining({ channel: 'email', reason: expect.stringMatching(/désactivé/) }),
        ]),
      );
      expect(emailProvider.sent).toHaveLength(0);
    });

    it('signale l’absence de contenu email plutôt que de l’inventer', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const result = await provider.dispatch(scopeA, {
        userId: scopeA.userId,
        kind: 'ACCESS_REMINDER',
      });

      expect(result.delivered).toEqual(['in_app']);
      expect(result.skipped).toContainEqual(
        expect.objectContaining({ channel: 'email', reason: expect.stringMatching(/aucun contenu/) }),
      );
    });

    it('conserve la notification in-app si l’email échoue, en rapportant l’échec', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const failing = new MemoryEmailProvider();
      jest.spyOn(failing, 'send').mockRejectedValue(new Error('SMTP injoignable'));
      const providerWithFailure = new PostgresNotificationProvider(() => failing);

      const result = await providerWithFailure.dispatch(scopeA, {
        userId: scopeA.userId,
        kind: 'ACCESS_REMINDER',
        email: { to: 'x@example.com', subject: 'S', text: 'c' },
      });

      expect(result.delivered).toEqual(['in_app']);
      expect(result.skipped).toContainEqual(
        expect.objectContaining({ channel: 'email', reason: 'SMTP injoignable' }),
      );
      // La notification in-app existe bien malgré l'échec email.
      expect(await provider.list(scopeA, scopeA.userId)).toHaveLength(1);
    });
  });

  describe('isolation inter-organisations', () => {
    it('ne voit pas les notifications d’une autre organisation', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await provider.create(scopeA, {
        userId: scopeA.userId,
        kind: 'ACCESS_REMINDER',
        payload: { secret: true },
      });

      expect(await provider.list(scopeB, scopeB.userId)).toHaveLength(0);
      expect(await provider.unreadCount(scopeB, scopeB.userId)).toBe(0);
    });

    it('refuse de marquer comme lue la notification d’une autre organisation', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const created = await provider.create(scopeA, {
        userId: scopeA.userId,
        kind: 'ACCESS_REMINDER',
      });

      // B connaît l'identifiant, mais l'action ne doit rien changer.
      await provider.markRead(scopeB, created!.id);

      expect(await provider.unreadCount(scopeA, scopeA.userId)).toBe(1);
    });

    it('ne marque pas comme lues les notifications d’une autre organisation', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await provider.create(scopeA, { userId: scopeA.userId, kind: 'ACCESS_REMINDER' });

      await provider.markAllRead(scopeB, scopeA.userId);

      expect(await provider.unreadCount(scopeA, scopeA.userId)).toBe(1);
    });

    it('ne lit pas les préférences d’un utilisateur d’une autre organisation', async () => {
      if (!(await requireDatabaseOrSkip())) return;
      await provider.setPreferences(scopeB, scopeB.userId, { in_app: false });

      // Depuis A, l'utilisateur de B est inconnu : on retombe sur les défauts.
      expect(await provider.getPreferences(scopeA, scopeB.userId)).toEqual(
        DEFAULT_NOTIFICATION_PREFERENCES,
      );
    });
  });

  it('est sélectionnable par DATA_PROVIDER', () => {
    resetProviders();
    expect(getNotificationProvider()).toBeInstanceOf(PostgresNotificationProvider);
  });
});
