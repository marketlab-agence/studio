import { test, expect } from '@playwright/test';
import { Pool } from 'pg';

/**
 * Autorisation de bout en bout (T4.14, REQ-ORG-06).
 *
 * ⚠️ Subtilité : le rôle est porté par le **jeton d'accès**. Modifier le rôle en
 * base ne suffit donc pas — il faut **se reconnecter** pour obtenir un jeton qui
 * le reflète. Les tests suivent ce chemin réel plutôt que de forger un jeton.
 *
 * Deux niveaux sont vérifiés, et ils sont indépendants :
 *
 * 1. **la barrière du middleware** — un Utilisateur ne doit pas atteindre
 *    l'interface d'administration ;
 * 2. **le contrôle des routes API** — un Utilisateur ne doit pas pouvoir agir,
 *    même en appelant l'API directement, sans passer par l'interface. C'est le
 *    contrôle qui compte : la barrière du middleware est un confort.
 */

const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5433/katalyst';

const pool = new Pool({ connectionString: DATABASE_URL });

const RUN = Date.now().toString(36);
const PASSWORD = 'un-mot-de-passe-e2e-2026';

function cookieHeader(response: { headersArray(): { name: string; value: string }[] }): string {
  return response
    .headersArray()
    .filter((header) => header.name.toLowerCase() === 'set-cookie')
    .map((header) => header.value.split(';')[0])
    .join('; ');
}

/**
 * Crée un compte avec un rôle donné et retourne son cookie de session.
 *
 * Le rôle est posé en base **puis** le compte se reconnecte : le jeton doit
 * porter le rôle, sinon on testerait un jeton périmé.
 */
async function sessionWithRole(
  request: import('@playwright/test').APIRequestContext,
  local: string,
  role: string,
): Promise<{ cookie: string; email: string; organizationId: string }> {
  const email = `${local}-${RUN}@e2e.local`;

  const registered = await request.post('/api/auth/register', {
    data: { email, password: PASSWORD, name: `Test ${local}` },
  });
  expect(registered.status(), `inscription de ${local}`).toBe(201);
  const created = await registered.json();

  await pool.query('UPDATE users SET role = $2 WHERE id = $1', [created.user.id, role]);

  const loggedIn = await request.post('/api/auth/login', {
    data: { email, password: PASSWORD },
  });
  expect(loggedIn.status(), `connexion de ${local}`).toBe(200);

  return {
    cookie: cookieHeader(loggedIn),
    email,
    organizationId: created.user.organizationId,
  };
}

test.describe('barrière de l’interface d’administration', () => {
  test('un Utilisateur est renvoyé vers le tableau de bord', async ({ request, page }) => {
    const user = await sessionWithRole(request, 'simple', 'Utilisateur');

    await page.context().addCookies(
      user.cookie.split('; ').map((pair) => {
        const [name, value] = pair.split('=');
        return { name, value, domain: 'localhost', path: '/' };
      }),
    );

    await page.goto('/admin');

    // Sans cette barrière, il tomberait sur une page dont les données sont
    // refusées par le serveur — une erreur incompréhensible plutôt qu'un refus.
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('un Modérateur atteint l’administration', async ({ request, page }) => {
    const moderator = await sessionWithRole(request, 'moderateur', 'Modérateur');

    await page.context().addCookies(
      moderator.cookie.split('; ').map((pair) => {
        const [name, value] = pair.split('=');
        return { name, value, domain: 'localhost', path: '/' };
      }),
    );

    // Il modère le contenu : il a besoin de l'interface.
    const response = await page.goto('/admin');
    expect(response?.status()).toBe(200);
  });

  test('un Propriétaire atteint l’administration', async ({ request, page }) => {
    const owner = await sessionWithRole(request, 'proprietaire', 'Propriétaire');

    await page.context().addCookies(
      owner.cookie.split('; ').map((pair) => {
        const [name, value] = pair.split('=');
        return { name, value, domain: 'localhost', path: '/' };
      }),
    );

    const response = await page.goto('/admin');
    expect(response?.status()).toBe(200);
  });
});

test.describe('contrôle des routes API', () => {
  test('un Utilisateur ne peut pas inviter', async ({ request }) => {
    const user = await sessionWithRole(request, 'sans-droits', 'Utilisateur');

    const response = await request.post('/api/v1/invitations', {
      headers: { cookie: user.cookie },
      data: { email: `cible-${RUN}@e2e.local`, role: 'Utilisateur' },
    });

    // Le contrôle est fait côté serveur : appeler l'API directement ne
    // contourne rien.
    expect(response.status()).toBe(403);
  });

  test('un Utilisateur ne peut pas lister les invitations', async ({ request }) => {
    const user = await sessionWithRole(request, 'sans-liste', 'Utilisateur');

    const response = await request.get('/api/v1/invitations', {
      headers: { cookie: user.cookie },
    });

    expect(response.status()).toBe(403);
  });

  test('un Modérateur ne peut pas inviter (il modère le contenu, pas les membres)', async ({
    request,
  }) => {
    const moderator = await sessionWithRole(request, 'moderateur-invite', 'Modérateur');

    const response = await request.post('/api/v1/invitations', {
      headers: { cookie: moderator.cookie },
      data: { email: `cible-mod-${RUN}@e2e.local`, role: 'Utilisateur' },
    });

    expect(response.status()).toBe(403);
  });

  test('un Admin ne peut pas nommer un Propriétaire', async ({ request }) => {
    const admin = await sessionWithRole(request, 'admin-limite', 'Admin');

    const response = await request.post('/api/v1/invitations', {
      headers: { cookie: admin.cookie },
      data: { email: `cible-proprio-${RUN}@e2e.local`, role: 'Propriétaire' },
    });

    // Sinon il s'élèverait par personne interposée : il nommerait un complice
    // Propriétaire, qui le nommerait Admin en retour.
    expect(response.status()).toBe(403);
  });

  test('un Admin peut nommer un Modérateur', async ({ request }) => {
    const admin = await sessionWithRole(request, 'admin-ok', 'Admin');

    const response = await request.post('/api/v1/invitations', {
      headers: { cookie: admin.cookie },
      data: { email: `cible-mod-ok-${RUN}@e2e.local`, role: 'Modérateur' },
    });

    expect(response.status()).toBe(201);
  });

  test('un Propriétaire peut nommer un Propriétaire', async ({ request }) => {
    const owner = await sessionWithRole(request, 'proprio-ok', 'Propriétaire');

    const response = await request.post('/api/v1/invitations', {
      headers: { cookie: owner.cookie },
      data: { email: `cible-proprio-ok-${RUN}@e2e.local`, role: 'Propriétaire' },
    });

    expect(response.status()).toBe(201);
  });

  test('un anonyme ne peut rien faire', async ({ request }) => {
    expect((await request.get('/api/v1/invitations')).status()).toBe(401);
    expect(
      (
        await request.post('/api/v1/invitations', {
          data: { email: `anonyme-${RUN}@e2e.local`, role: 'Utilisateur' },
        })
      ).status(),
    ).toBe(401);
  });
});

test.describe('page des rôles', () => {
  test('décrit les droits réellement appliqués, sans les simuler', async ({ request, page }) => {
    const owner = await sessionWithRole(request, 'page-roles', 'Propriétaire');

    await page.context().addCookies(
      owner.cookie.split('; ').map((pair) => {
        const [name, value] = pair.split('=');
        return { name, value, domain: 'localhost', path: '/' };
      }),
    );

    await page.goto('/admin/roles');

    await expect(page.getByRole('heading', { name: /rôles et permissions/i })).toBeVisible();

    // La page annonçait auparavant un bouton « Enregistrer » qui ne persistait
    // rien. Elle décrit désormais les règles appliquées.
    await expect(page.getByRole('button', { name: /enregistrer/i })).toHaveCount(0);

    // Les rôles affichés sont ceux du SCHÉMA. L'ancienne page en présentait un
    // qui n'existait pas en base (« Administrateur » au lieu de « Admin » et
    // « Propriétaire »). On cible la table : « Administrateur » apparaît
    // légitimement ailleurs sur la page (titre d'alerte du layout).
    const table = page.getByRole('table');

    await expect(
      table.getByRole('columnheader', { name: 'Propriétaire', exact: true }),
    ).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Admin', exact: true })).toBeVisible();
    await expect(
      table.getByRole('columnheader', { name: 'Administrateur', exact: true }),
    ).toHaveCount(0);

    // Fragment choisi hors de tout <strong> : un texte interrompu par du balisage
    // ne forme pas un nœud unique, et le motif ne correspondrait pas.
    await expect(page.getByText(/cette page les décrit/i)).toBeVisible();
  });
});
