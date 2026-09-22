import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { Pool } from 'pg';

/**
 * Invitations de bout en bout (T4.13, REQ-ORG-05).
 *
 * Comment accepter une invitation sans lire la boîte mail ? Le serveur ne
 * conserve que le **hachage** du jeton, et la route de création ne le renvoie
 * pas (volontairement : il ne doit exister que dans l'email). Le test fabrique
 * donc un jeton connu et insère son hachage en base, puis emprunte le lien. Le
 * parcours HTTP, le provider et la base sont ainsi réellement traversés.
 *
 * ⚠️ Les comptes créés ici restent dans la base de développement (domaine
 * `@e2e.local`, identifiable et supprimable).
 */

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5433/katalyst';

const pool = new Pool({ connectionString: DATABASE_URL });

const RUN = Date.now().toString(36);
const OWNER_EMAIL = `inviteur-${RUN}@e2e.local`;
const PASSWORD = 'un-mot-de-passe-e2e-2026';

function cookieHeader(response: { headersArray(): { name: string; value: string }[] }): string {
  return response
    .headersArray()
    .filter((header) => header.name.toLowerCase() === 'set-cookie')
    .map((header) => header.value.split(';')[0])
    .join('; ');
}

/** Insère une invitation avec un jeton connu, comme le ferait le provider. */
async function seedInvitation(params: {
  organizationId: string;
  email: string;
  role: string;
  token: string;
  expiresIn?: string;
}): Promise<void> {
  await pool.query(
    `INSERT INTO invitations (organization_id, email, role, token_hash, expires_at)
     VALUES ($1, $2, $3, $4, NOW() + $5::interval)`,
    [
      params.organizationId,
      params.email,
      params.role,
      createHash('sha256').update(params.token).digest('hex'),
      params.expiresIn ?? '7 days',
    ],
  );
}

test.describe('invitations', () => {
  test('exige une session pour inviter', async ({ request }) => {
    const response = await request.post('/api/v1/invitations', {
      data: { email: `sans-session-${RUN}@e2e.local`, role: 'Utilisateur' },
    });

    expect(response.status()).toBe(401);
  });

  test('exige une session pour lister', async ({ request }) => {
    expect((await request.get('/api/v1/invitations')).status()).toBe(401);
  });

  test('refuse le rôle plateforme « Super Admin »', async ({ request }) => {
    const registered = await request.post('/api/auth/register', {
      data: { email: `role-plateforme-${RUN}@e2e.local`, password: PASSWORD, name: 'Test Rôle' },
    });

    const response = await request.post('/api/v1/invitations', {
      headers: { cookie: cookieHeader(registered) },
      data: { email: `cible-${RUN}@e2e.local`, role: 'Super Admin' },
    });

    // Rejeté par le schéma Zod, avant même le contrôle du provider : le rôle
    // plateforme n'est jamais attribuable par une organisation.
    expect(response.status()).toBe(400);
  });

  test('crée une invitation sans jamais renvoyer le jeton', async ({ request }) => {
    const registered = await request.post('/api/auth/register', {
      data: { email: OWNER_EMAIL, password: PASSWORD, name: 'Institut E2E' },
    });
    expect(registered.status()).toBe(201);

    const response = await request.post('/api/v1/invitations', {
      headers: { cookie: cookieHeader(registered) },
      data: { email: `formateur-${RUN}@e2e.local`, role: 'Admin' },
    });

    expect(response.status()).toBe(201);
    const body = await response.json();

    expect(body.invitation.email).toBe(`formateur-${RUN}@e2e.local`);
    expect(body.invitation.role).toBe('Admin');
    expect(body.invitation.organizationName).toBe('Institut E2E');

    // Le jeton ne doit exister que dans l'email : le renvoyer l'exposerait dans
    // l'historique du navigateur et les journaux du client.
    expect(JSON.stringify(body)).not.toContain('token');
  });

  test('liste et révoque les invitations en attente', async ({ request }) => {
    const email = `liste-${RUN}@e2e.local`;
    const registered = await request.post('/api/auth/register', {
      data: { email, password: PASSWORD, name: 'Institut Liste' },
    });
    const cookie = cookieHeader(registered);

    const created = await request.post('/api/v1/invitations', {
      headers: { cookie },
      data: { email: `a-inviter-${RUN}@e2e.local`, role: 'Utilisateur' },
    });
    const { invitation } = await created.json();

    const listed = await request.get('/api/v1/invitations', { headers: { cookie } });
    expect(listed.status()).toBe(200);
    expect((await listed.json()).invitations).toHaveLength(1);

    const revoked = await request.delete(`/api/v1/invitations/${invitation.id}`, {
      headers: { cookie },
    });
    expect(revoked.status()).toBe(200);

    // Révoquée : elle ne doit plus apparaître.
    const after = await request.get('/api/v1/invitations', { headers: { cookie } });
    expect((await after.json()).invitations).toHaveLength(0);
  });

  test('refuse une invitation invalide côté API', async ({ request }) => {
    expect((await request.get('/api/auth/invitation?token=inconnu')).status()).toBe(404);
    expect((await request.get('/api/auth/invitation')).status()).toBe(400);
  });

  test('parcours complet : lien reçu, compte créé, session ouverte', async ({ request }) => {
    // 1. Une organisation invitante.
    const registered = await request.post('/api/auth/register', {
      data: { email: `parcours-${RUN}@e2e.local`, password: PASSWORD, name: 'Institut Parcours' },
    });
    const owner = await registered.json();

    // 2. Un lien a été envoyé. On ne peut pas le lire, donc on fabrique un jeton
    //    connu et on insère son hachage.
    const inviteeEmail = `invite-${RUN}@e2e.local`;
    const token = `jeton-invitation-${RUN}`;
    await seedInvitation({
      organizationId: owner.user.organizationId,
      email: inviteeEmail,
      role: 'Modérateur',
      token,
    });

    // 3. L'invité consulte l'invitation AVANT de créer son compte : il doit
    //    savoir qui l'invite et pour quel rôle.
    const info = await request.get(`/api/auth/invitation?token=${token}`);
    expect(info.status()).toBe(200);

    const view = (await info.json()).invitation;
    expect(view.email).toBe(inviteeEmail);
    expect(view.role).toBe('Modérateur');
    expect(view.organizationName).toBe('Institut Parcours');

    // 4. Il accepte : le compte est créé DANS l'organisation invitante.
    const accepted = await request.post('/api/auth/invitation', {
      data: { token, name: 'Invité E2E', password: PASSWORD },
    });
    expect(accepted.status()).toBe(200);

    const session = await accepted.json();
    expect(session.user.email).toBe(inviteeEmail);
    expect(session.user.role).toBe('Modérateur');
    expect(session.user.organizationId).toBe(owner.user.organizationId);

    // 5. Le lien ne sert qu'une fois.
    const rejeu = await request.post('/api/auth/invitation', {
      data: { token, name: 'Rejeu', password: PASSWORD },
    });
    expect(rejeu.status()).toBe(400);

    // 6. La session ouverte donne accès à une page privée.
    const dashboard = await request.get('/dashboard', {
      headers: { cookie: cookieHeader(accepted) },
    });
    expect(dashboard.status()).toBe(200);
  });

  test('refuse une invitation expirée', async ({ request }) => {
    const registered = await request.post('/api/auth/register', {
      data: { email: `expire-${RUN}@e2e.local`, password: PASSWORD, name: 'Institut Expiré' },
    });
    const owner = await registered.json();

    const token = `jeton-expire-${RUN}`;
    await seedInvitation({
      organizationId: owner.user.organizationId,
      email: `trop-tard-${RUN}@e2e.local`,
      role: 'Utilisateur',
      token,
      expiresIn: '-1 day',
    });

    // Une invitation expirée est indistinguable d'une invitation inconnue : le
    // message ne renseigne pas un curieux sur l'état des invitations.
    expect((await request.get(`/api/auth/invitation?token=${token}`)).status()).toBe(404);
    expect(
      (
        await request.post('/api/auth/invitation', {
          data: { token, name: 'Trop Tard', password: PASSWORD },
        })
      ).status(),
    ).toBe(400);
  });

  test('la page affiche l’invitation et prévient pour un lien invalide', async ({ page }) => {
    // Lien sans jeton : message explicite plutôt qu'un formulaire inutilisable.
    await page.goto('/invitation');
    await expect(page.getByText(/ne contient pas de jeton/i)).toBeVisible();

    // Jeton inconnu : même traitement.
    await page.goto('/invitation?token=inconnu');
    await expect(page.getByText(/plus valable|plus utilisable/i)).toBeVisible();
  });

  test('la page affiche l’organisation et le rôle de l’invitation', async ({ request, page }) => {
    const registered = await request.post('/api/auth/register', {
      data: { email: `page-${RUN}@e2e.local`, password: PASSWORD, name: 'Institut Page' },
    });
    const owner = await registered.json();

    const token = `jeton-page-${RUN}`;
    await seedInvitation({
      organizationId: owner.user.organizationId,
      email: `invite-page-${RUN}@e2e.local`,
      role: 'Admin',
      token,
    });

    await page.goto(`/invitation?token=${token}`);

    // L'invité doit voir QUI invite et POUR QUEL RÔLE avant de saisir quoi que
    // ce soit : sans cela, il créerait un compte à l'aveugle.
    await expect(page.getByRole('heading', { name: /rejoindre Institut Page/i })).toBeVisible();
    await expect(page.getByText(/rôle/i).first()).toBeVisible();
    await expect(page.getByLabel('Adresse email')).toHaveValue(`invite-page-${RUN}@e2e.local`);
    // L'adresse est fixée par l'invitation : la rendre modifiable permettrait de
    // créer un compte pour l'adresse d'autrui.
    await expect(page.getByLabel('Adresse email')).toBeDisabled();
  });
});
