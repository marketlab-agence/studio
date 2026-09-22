/**
 * @jest-environment node
 *
 * SSO SAML — validation de configuration et exigences de sécurité (T4.5).
 *
 * Les tests portent sur ce qui, s'il lâchait, laisserait entrer quelqu'un :
 * l'exigence de certificat, la stabilité de la clé SP, et le refus des
 * configurations incomplètes.
 */
import {
  assertionConsumerUrl,
  readSamlConfig,
  SamlConfigError,
  serviceProviderEntityId,
} from '@/lib/auth/saml';

const VALID_CERTIFICATE = '-----BEGIN CERTIFICATE-----\nMIIB...\n-----END CERTIFICATE-----';

const VALID_CONFIG = {
  enabled: true,
  entryPoint: 'https://idp.exemple.fr/sso',
  certificate: VALID_CERTIFICATE,
  provider: 'azure-ad' as const,
};

describe('readSamlConfig', () => {
  const original = { key: process.env.SAML_SP_PRIVATE_KEY, cert: process.env.SAML_SP_CERT };

  afterAll(() => {
    if (original.key === undefined) delete process.env.SAML_SP_PRIVATE_KEY;
    else process.env.SAML_SP_PRIVATE_KEY = original.key;
    if (original.cert === undefined) delete process.env.SAML_SP_CERT;
    else process.env.SAML_SP_CERT = original.cert;
  });

  it('accepte une configuration complète', () => {
    expect(readSamlConfig(VALID_CONFIG)).toEqual(VALID_CONFIG);
  });

  it('REFUSE une configuration sans certificat', () => {
    // Le modèle masterplan365 retombait sur une chaîne vide, ce qui désactivait
    // silencieusement la vérification de signature : une assertion devenait
    // forgeable. On refuse.
    expect(() => readSamlConfig({ ...VALID_CONFIG, certificate: '' })).toThrow(SamlConfigError);
    expect(() => readSamlConfig({ ...VALID_CONFIG, certificate: '' })).toThrow(/certificat/i);
  });

  it('REFUSE une configuration sans URL SSO', () => {
    expect(() => readSamlConfig({ ...VALID_CONFIG, entryPoint: '' })).toThrow(/URL SSO/i);
  });

  it('refuse une valeur absente ou d’un autre type', () => {
    for (const value of [null, undefined, 'texte', 42, {}]) {
      expect(() => readSamlConfig(value)).toThrow(SamlConfigError);
    }
  });

  it('considère le SSO actif par défaut', () => {
    // Seul `enabled: false` désactive : une configuration posée sans ce champ
    // doit fonctionner, pas rester silencieusement inerte.
    const { enabled, ...withoutFlag } = VALID_CONFIG;
    void enabled;

    expect(readSamlConfig(withoutFlag).enabled).toBe(true);
  });

  it('respecte la désactivation explicite', () => {
    expect(readSamlConfig({ ...VALID_CONFIG, enabled: false }).enabled).toBe(false);
  });

  it('retombe sur le fournisseur générique', () => {
    const { provider, ...withoutProvider } = VALID_CONFIG;
    void provider;

    expect(readSamlConfig(withoutProvider).provider).toBe('generic');
  });
});

describe('URL du fournisseur de service', () => {
  it('dérive l’URL d’assertion de l’organisation', () => {
    const url = assertionConsumerUrl('org-123');

    expect(url).toContain('/api/auth/saml/callback');
    expect(url).toContain('orgId=org-123');
  });

  it('dérive l’identifiant d’entité de l’organisation', () => {
    const entityId = serviceProviderEntityId('org-123');

    expect(entityId).toContain('/api/auth/saml/metadata');
    expect(entityId).toContain('orgId=org-123');
  });

  it('encode un identifiant contenant des caractères spéciaux', () => {
    // Sans encodage, un identifiant mal formé casserait l'URL de rappel — et le
    // fournisseur d'identité posterait au mauvais endroit.
    expect(assertionConsumerUrl('org a/b')).toContain('orgId=org%20a%2Fb');
  });

  it('distingue deux organisations', () => {
    expect(assertionConsumerUrl('a')).not.toBe(assertionConsumerUrl('b'));
  });
});

describe('paire de clés du fournisseur de service', () => {
  const original = { key: process.env.SAML_SP_PRIVATE_KEY, cert: process.env.SAML_SP_CERT };

  afterEach(() => {
    if (original.key === undefined) delete process.env.SAML_SP_PRIVATE_KEY;
    else process.env.SAML_SP_PRIVATE_KEY = original.key;
    if (original.cert === undefined) delete process.env.SAML_SP_CERT;
    else process.env.SAML_SP_CERT = original.cert;
  });

  it('REFUSE de fonctionner sans clé configurée, sans jamais en générer', async () => {
    delete process.env.SAML_SP_PRIVATE_KEY;
    delete process.env.SAML_SP_CERT;

    // Le modèle en générait une à la volée : le certificat SP changeait alors à
    // chaque redémarrage, et la confiance configurée chez le fournisseur
    // d'identité devenait caduque — silencieusement.
    const { generateMetadata } = await import('@/lib/auth/saml');

    expect(() => generateMetadata('org-123', VALID_CONFIG)).toThrow(SamlConfigError);
    expect(() => generateMetadata('org-123', VALID_CONFIG)).toThrow(/SAML_SP_PRIVATE_KEY/);
    // Le message doit indiquer comment produire une paire **stable**.
    expect(() => generateMetadata('org-123', VALID_CONFIG)).toThrow(/openssl/);
  });

  it('accepte une paire fournie, avec les \\n échappés d’une variable d’environnement', async () => {
    // Les variables d'environnement ne portent pas de sauts de ligne réels : la
    // paire doit être utilisable telle qu'elle est écrite dans `.env.local`.
    process.env.SAML_SP_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\\nMIIE\\n-----END PRIVATE KEY-----';
    process.env.SAML_SP_CERT = '-----BEGIN CERTIFICATE-----\\nMIIB\\n-----END CERTIFICATE-----';

    const { generateMetadata } = await import('@/lib/auth/saml');

    // La paire est acceptée (le contenu n'est pas validé cryptographiquement ici,
    // mais la lecture ne doit plus lever).
    expect(() => generateMetadata('org-123', VALID_CONFIG)).not.toThrow(/SAML_SP_PRIVATE_KEY/);
  });
});
