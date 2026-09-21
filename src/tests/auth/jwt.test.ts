/**
 * @jest-environment node
 *
 * Environnement **Node** et non jsdom : `jose` s'appuie sur `crypto.subtle`
 * (Web Crypto), absent de jsdom, et les modules testés ici sont strictement
 * côté serveur. jsdom imposerait en outre un realm différent, où les
 * `Uint8Array` ne satisfont pas les `instanceof` de `jose`.
 */
import {
  ACCESS_TTL_SECONDS,
  signAccessToken,
  tryVerifyAccessToken,
  verifyAccessToken,
  type AccessTokenClaims,
} from '@/lib/auth/jwt';

/**
 * Jetons JWT (T4.6, REQ-AUTH-03/09).
 *
 * `jose` est retenu parce que le middleware Next s'exécute en **Edge runtime** :
 * `jsonwebtoken` n'y fonctionne pas. Ces tests couvrent le rejet des cas
 * dangereux (jeton d'une autre application, signature altérée, expiration).
 */

const CLAIMS: AccessTokenClaims = {
  userId: '5e1c6f1e-6f1e-4f1e-8f1e-6f1e4f1e8f1e',
  organizationId: '7a2d7f2d-7f2d-4f2d-9f2d-7f2d4f2d9f2d',
  role: 'Propriétaire',
  email: 'formateur@katalyst.test',
};

const SECRET = 'un-secret-de-test-suffisamment-long-pour-hs256';

describe('JWT — signature et vérification', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = SECRET;
  });

  afterAll(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it('fait un aller-retour complet sur les informations', async () => {
    const token = await signAccessToken(CLAIMS);
    const claims = await verifyAccessToken(token);

    expect(claims.userId).toBe(CLAIMS.userId);
    expect(claims.organizationId).toBe(CLAIMS.organizationId);
    expect(claims.role).toBe(CLAIMS.role);
    expect(claims.email).toBe(CLAIMS.email);
  });

  it('rejette un jeton signé avec un autre secret', async () => {
    const token = await signAccessToken(CLAIMS);
    process.env.JWT_SECRET = 'un-tout-autre-secret-de-test-32-caracteres-minimum';

    await expect(verifyAccessToken(token)).rejects.toThrow();
  });

  it('rejette un jeton dont la charge utile a été altérée', async () => {
    const token = await signAccessToken(CLAIMS);
    const [header, payload, signature] = token.split('.');

    // On remplace l'organisation dans la charge utile : la signature ne suit plus.
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString());
    decoded.organizationId = 'organisation-usurpee-0000-0000-000000000000';
    const forged = Buffer.from(JSON.stringify(decoded)).toString('base64url');

    await expect(verifyAccessToken(`${header}.${forged}.${signature}`)).rejects.toThrow();
  });

  it('rejette un jeton expiré', async () => {
    const token = await signAccessToken(CLAIMS, { ttlSeconds: -10 });

    await expect(verifyAccessToken(token)).rejects.toThrow();
  });

  it('honore la durée de vie demandée', async () => {
    const token = await signAccessToken(CLAIMS, { ttlSeconds: 3600 });
    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());

    expect(decoded.exp - decoded.iat).toBe(3600);
  });

  it('applique la durée de vie par défaut', async () => {
    const token = await signAccessToken(CLAIMS);
    const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());

    expect(decoded.exp - decoded.iat).toBe(ACCESS_TTL_SECONDS);
  });

  it('rejette un jeton destiné à une autre application', async () => {
    // Un jeton émis par un autre service signé avec le même secret ne doit pas
    // être accepté : l'émetteur et l'audience sont vérifiés.
    const { SignJWT } = await import('jose');
    const foreign = await new SignJWT({ ...CLAIMS })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer('une-autre-application')
      .setAudience('un-autre-public')
      .setExpirationTime('15m')
      .sign(new TextEncoder().encode(SECRET));

    await expect(verifyAccessToken(foreign)).rejects.toThrow();
  });

  it('rejette un jeton sans identifiant d’organisation', async () => {
    const { SignJWT } = await import('jose');
    const incomplete = await new SignJWT({ userId: CLAIMS.userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer('katalyst')
      .setAudience('katalyst-app')
      .setExpirationTime('15m')
      .sign(new TextEncoder().encode(SECRET));

    await expect(verifyAccessToken(incomplete)).rejects.toThrow(/organisation/);
  });

  it('refuse une chaîne qui n’est pas un jeton', async () => {
    await expect(verifyAccessToken('pas-un-jeton')).rejects.toThrow();
  });

  describe('tryVerifyAccessToken — usage middleware', () => {
    it('retourne les informations d’un jeton valide', async () => {
      const token = await signAccessToken(CLAIMS);

      expect(await tryVerifyAccessToken(token)).toMatchObject({ userId: CLAIMS.userId });
    });

    it('retourne null au lieu de lever, sur un jeton absent', async () => {
      // Au middleware, l'absence de jeton est un cas normal, pas une erreur.
      await expect(tryVerifyAccessToken(undefined)).resolves.toBeNull();
      await expect(tryVerifyAccessToken(null)).resolves.toBeNull();
      await expect(tryVerifyAccessToken('')).resolves.toBeNull();
    });

    it('retourne null au lieu de lever, sur un jeton invalide ou expiré', async () => {
      await expect(tryVerifyAccessToken('pas-un-jeton')).resolves.toBeNull();
      await expect(
        tryVerifyAccessToken(await signAccessToken(CLAIMS, { ttlSeconds: -10 })),
      ).resolves.toBeNull();
    });
  });

  describe('configuration du secret', () => {
    it('refuse de signer sans JWT_SECRET', async () => {
      delete process.env.JWT_SECRET;

      await expect(signAccessToken(CLAIMS)).rejects.toThrow(/JWT_SECRET est absent/);
    });

    it('refuse un secret trop court pour HS256', async () => {
      process.env.JWT_SECRET = 'trop-court';

      await expect(signAccessToken(CLAIMS)).rejects.toThrow(/trop court/);
    });
  });
});
