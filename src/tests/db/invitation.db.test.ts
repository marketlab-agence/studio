import {
  getAuthProvider,
  InvalidInvitationError,
  InvitationEmailTakenError,
  InvalidRoleError,
  resetProviders,
  type AuthProvider,
  type OrgScope,
  type Session,
} from '@/lib/providers';
import { pool, requireDatabaseOrSkip } from './setup';

/**
 * Invitations (T4.13, REQ-ORG-05).
 *
 * Un institut doit pouvoir inviter ses formateurs et apprenants sans que
 * l'éditeur intervienne. Les propriétés verrouillées ici sont celles qui, si
 * elles lâchaient, ouvriraient un accès :
 *
 * - le jeton n'est **jamais stocké en clair** ;
 * - il ne sert **qu'une fois** ;
 * - il **expire** et peut être **révoqué** ;
 * - on ne peut pas s'inviter avec le rôle **plateforme** (`Super Admin`) ;
 * - une organisation ne peut ni lister, ni révoquer les invitations d'une autre.
 */

jest.setTimeout(90_000);

const TEST_DOMAIN = '@invitation-test.local';
const PASSWORD = 'un-mot-de-passe-solide-2026';

let provider: AuthProvider;
let ownerSession: Session;
let scope: OrgScope;
let otherScope: OrgScope;

function email(local: string): string {
  return `${local}${TEST_DOMAIN}`;
}

async function cleanup(): Promise<void> {
  await pool.query(
    `DELETE FROM organizations
     WHERE id IN (SELECT organization_id FROM users WHERE email LIKE $1)`,
    [`%${TEST_DOMAIN}`],
  );
}

describe('invitations', () => {
  beforeEach(async () => {
    if (!(await requireDatabaseOrSkip())) return;
    resetProviders();
    await cleanup();
    provider = getAuthProvider();

    ownerSession = await provider.register({
      email: email('proprietaire'),
      password: PASSWORD,
      name: 'Institut Test',
    });
    scope = {
      organizationId: ownerSession.user.organizationId,
      userId: ownerSession.user.id,
      role: 'Propriétaire',
    };

    // Une seconde organisation, pour vérifier l'isolation.
    const other = await provider.register({
      email: email('autre-organisation'),
      password: PASSWORD,
      name: 'Autre Institut',
    });
    otherScope = {
      organizationId: other.user.organizationId,
      userId: other.user.id,
      role: 'Propriétaire',
    };
  });

  afterAll(async () => {
    if (!(await requireDatabaseOrSkip())) return;
    await cleanup();
  });

  describe('création', () => {
    it('crée une invitation et retourne un jeton en clair', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const created = await provider.createInvitation(scope, {
        email: email('formateur'),
        role: 'Admin',
      });

      expect(created.token).toMatch(/^[A-Za-z0-9_-]{40,}$/);
      expect(created.invitation.email).toBe(email('formateur'));
      expect(created.invitation.role).toBe('Admin');
      expect(created.invitation.organizationName).toBe('Institut Test');
      expect(created.invitation.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('stocke le jeton HACHÉ, jamais en clair', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const created = await provider.createInvitation(scope, {
        email: email('hachage'),
        role: 'Utilisateur',
      });

      const { rows } = await pool.query<{ token_hash: string }>(
        'SELECT token_hash FROM invitations WHERE id = $1',
        [created.invitation.id],
      );

      // Une fuite de la base ne doit pas permettre de rejoindre l'organisation.
      expect(rows[0].token_hash).not.toBe(created.token);
      expect(rows[0].token_hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('refuse le rôle plateforme « Super Admin »', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      // L'y autoriser permettrait à un institut de s'octroyer des droits sur
      // l'ensemble du service.
      await expect(
        provider.createInvitation(scope, {
          email: email('super-admin'),
          // Volontairement hors du type : on vérifie le refus à l'exécution.
          role: 'Super Admin' as never,
        }),
      ).rejects.toBeInstanceOf(InvalidRoleError);
    });

    it('refuse d’inviter une adresse qui a déjà un compte', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      // L'inviter n'aurait pas de sens : il doit se connecter.
      await expect(
        provider.createInvitation(scope, {
          email: email('proprietaire'),
          role: 'Utilisateur',
        }),
      ).rejects.toBeInstanceOf(InvitationEmailTakenError);
    });

    it('révoque l’invitation précédente en attente pour la même adresse', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const premiere = await provider.createInvitation(scope, {
        email: email('reinvite'),
        role: 'Utilisateur',
      });
      const seconde = await provider.createInvitation(scope, {
        email: email('reinvite'),
        role: 'Modérateur',
      });

      // Sans cette révocation, l'émetteur croirait avoir remplacé un lien alors
      // que les deux resteraient valides.
      expect(await provider.getInvitationByToken(premiere.token)).toBeNull();

      const active = await provider.getInvitationByToken(seconde.token);
      expect(active?.role).toBe('Modérateur');
    });

    it('normalise l’adresse', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const created = await provider.createInvitation(scope, {
        email: `  FORMATEUR${TEST_DOMAIN.toUpperCase()}  `,
        role: 'Utilisateur',
      });

      expect(created.invitation.email).toBe(email('formateur'));
    });
  });

  describe('consultation par jeton', () => {
    it('retourne les informations d’une invitation valide', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const created = await provider.createInvitation(scope, {
        email: email('consulte'),
        role: 'Admin',
      });

      const info = await provider.getInvitationByToken(created.token);

      expect(info?.email).toBe(email('consulte'));
      expect(info?.organizationName).toBe('Institut Test');
      expect(info?.role).toBe('Admin');
    });

    it('retourne null pour un jeton inconnu', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      expect(await provider.getInvitationByToken('jeton-invente')).toBeNull();
    });

    it('retourne null pour une invitation expirée', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const created = await provider.createInvitation(scope, {
        email: email('expiree'),
        role: 'Utilisateur',
      });
      await pool.query(
        "UPDATE invitations SET expires_at = NOW() - INTERVAL '1 day' WHERE id = $1",
        [created.invitation.id],
      );

      expect(await provider.getInvitationByToken(created.token)).toBeNull();
    });

    it('retourne null pour une invitation révoquée', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const created = await provider.createInvitation(scope, {
        email: email('revoquee'),
        role: 'Utilisateur',
      });
      await provider.revokeInvitation(scope, created.invitation.id);

      expect(await provider.getInvitationByToken(created.token)).toBeNull();
    });
  });

  describe('acceptation', () => {
    it('crée le compte dans l’organisation, avec le rôle prévu, et ouvre une session', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const created = await provider.createInvitation(scope, {
        email: email('invite'),
        role: 'Modérateur',
      });

      const session = await provider.acceptInvitation(created.token, {
        name: 'Formateur Invité',
        password: PASSWORD,
      });

      expect(session.user.email).toBe(email('invite'));
      expect(session.user.role).toBe('Modérateur');
      // L'invité rejoint l'organisation de l'inviteur, il n'en crée pas une.
      expect(session.user.organizationId).toBe(scope.organizationId);
      expect(session.accessToken).toBeTruthy();
      expect(session.refreshToken).toBeTruthy();
    });

    it('n’accepte un lien qu’une seule fois', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const created = await provider.createInvitation(scope, {
        email: email('unique'),
        role: 'Utilisateur',
      });

      await provider.acceptInvitation(created.token, { name: 'Premier', password: PASSWORD });

      await expect(
        provider.acceptInvitation(created.token, { name: 'Second', password: PASSWORD }),
      ).rejects.toThrow(/déjà utilisée/);

      // Un seul compte a été créé.
      const { rows } = await pool.query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM users WHERE email = $1',
        [email('unique')],
      );
      expect(Number(rows[0].count)).toBe(1);
    });

    it('refuse une invitation expirée', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const created = await provider.createInvitation(scope, {
        email: email('trop-tard'),
        role: 'Utilisateur',
      });
      await pool.query(
        "UPDATE invitations SET expires_at = NOW() - INTERVAL '1 day' WHERE id = $1",
        [created.invitation.id],
      );

      await expect(
        provider.acceptInvitation(created.token, { name: 'Trop Tard', password: PASSWORD }),
      ).rejects.toBeInstanceOf(InvalidInvitationError);
    });

    it('refuse une invitation révoquée', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const created = await provider.createInvitation(scope, {
        email: email('annulee'),
        role: 'Utilisateur',
      });
      await provider.revokeInvitation(scope, created.invitation.id);

      await expect(
        provider.acceptInvitation(created.token, { name: 'Annulé', password: PASSWORD }),
      ).rejects.toThrow(/révoquée/);
    });

    it('refuse un jeton inconnu', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await expect(
        provider.acceptInvitation('jeton-invente', { name: 'Inconnu', password: PASSWORD }),
      ).rejects.toBeInstanceOf(InvalidInvitationError);
    });

    it('refuse un mot de passe trop court', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const created = await provider.createInvitation(scope, {
        email: email('mot-de-passe-court'),
        role: 'Utilisateur',
      });

      await expect(
        provider.acceptInvitation(created.token, { name: 'Court', password: 'court' }),
      ).rejects.toThrow(/trop court/);
    });

    it('refuse si un compte a été créé entre-temps pour la même adresse', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const target = email('course');
      const created = await provider.createInvitation(scope, { email: target, role: 'Utilisateur' });

      // Un compte apparaît avant l'acceptation : conflit d'usage, pas panne.
      await provider.register({ email: target, password: PASSWORD, name: 'Arrivé Avant' });

      await expect(
        provider.acceptInvitation(created.token, { name: 'Arrivé Après', password: PASSWORD }),
      ).rejects.toBeInstanceOf(InvitationEmailTakenError);
    });

    it('accepte plusieurs invitations simultanées sans créer deux comptes', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const created = await provider.createInvitation(scope, {
        email: email('double-clic'),
        role: 'Utilisateur',
      });

      const results = await Promise.allSettled([
        provider.acceptInvitation(created.token, { name: 'Clic 1', password: PASSWORD }),
        provider.acceptInvitation(created.token, { name: 'Clic 2', password: PASSWORD }),
      ]);

      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);

      const { rows } = await pool.query<{ count: string }>(
        'SELECT COUNT(*)::text AS count FROM users WHERE email = $1',
        [email('double-clic')],
      );
      expect(Number(rows[0].count)).toBe(1);
    });
  });

  describe('isolation inter-organisations', () => {
    it('ne liste que les invitations de son organisation', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await provider.createInvitation(scope, { email: email('chez-a'), role: 'Utilisateur' });
      await provider.createInvitation(otherScope, { email: email('chez-b'), role: 'Utilisateur' });

      const listeA = await provider.listInvitations(scope);
      const listeB = await provider.listInvitations(otherScope);

      expect(listeA.map((i) => i.email)).toEqual([email('chez-a')]);
      expect(listeB.map((i) => i.email)).toEqual([email('chez-b')]);
    });

    it('refuse de révoquer l’invitation d’une autre organisation', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const created = await provider.createInvitation(scope, {
        email: email('protegee'),
        role: 'Utilisateur',
      });

      // L'organisation B connaît l'identifiant, mais l'action ne doit rien faire.
      await provider.revokeInvitation(otherScope, created.invitation.id);

      // Toujours valide depuis A.
      expect(await provider.getInvitationByToken(created.token)).not.toBeNull();
    });
  });
});
