import { SAML, type Profile, type SamlConfig } from '@node-saml/node-saml';
import { appUrl } from '@/lib/email/urls';

/**
 * SSO SAML (REQ-AUTH-05, gate G1).
 *
 * Modèle : `masterplan365/server/routes/sso.ts`. Ce qui en est repris — et ce qui
 * en a été corrigé, chaque correction visant un défaut réel :
 *
 * | Point | masterplan365 | Ici |
 * |---|---|---|
 * | Certificat de l'IdP absent | repli sur `''` → **aucune vérification de signature** | **refus explicite** : sans certificat, une assertion est forgeable |
 * | Paire de clés SP | **régénérée à chaque démarrage** si absente | lue dans l'environnement, **jamais générée** : un certificat qui change casse la confiance chez l'IdP |
 * | Erreurs | `'SAML failed: ' + err.message` renvoyé au client | message générique, cause journalisée |
 * | Bibliothèque | `passport-saml` 3.x (déprécié, 4 CVE HIGH d'injection XML) | `@node-saml/node-saml` 5.x, **sans Passport ni Express** |
 *
 * ⚠️ Aucune dépendance à Express : `SAML` s'utilise seul
 * (`getAuthorizeUrlAsync`, `validatePostResponseAsync`,
 * `generateServiceProviderMetadata`). Le couplage Express du modèle était
 * superficiel — il ne portait que le routage.
 */

export class SamlConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SamlConfigError';
  }
}

export class SamlAuthenticationError extends Error {
  constructor(message = 'La connexion SSO a échoué.') {
    super(message);
    this.name = 'SamlAuthenticationError';
  }
}

/** Configuration SAML d'une organisation, telle que stockée en JSONB. */
export interface OrganizationSamlConfig {
  enabled: boolean;
  /** URL SSO du fournisseur d'identité. */
  entryPoint: string;
  /** Certificat de signature de l'IdP (PEM). **Obligatoire.** */
  certificate: string;
  provider: 'azure-ad' | 'okta' | 'google' | 'generic';
  /** Identifiant d'entité attendu, si le fournisseur en impose un. */
  entityId?: string;
}

/**
 * Valide la configuration stockée et la convertit.
 *
 * Lève si la configuration est inutilisable. **Le certificat est exigé** : le
 * modèle retombait sur une chaîne vide, ce qui désactivait silencieusement la
 * vérification de signature. Une assertion non vérifiée est une identité
 * forgeable — mieux vaut refuser la connexion que l'accepter sans garantie.
 */
export function readSamlConfig(raw: unknown): OrganizationSamlConfig {
  if (!raw || typeof raw !== 'object') {
    throw new SamlConfigError("Le SSO n'est pas configuré pour cette organisation.");
  }

  const config = raw as Partial<OrganizationSamlConfig>;

  if (!config.entryPoint) {
    throw new SamlConfigError("L'URL SSO du fournisseur d'identité est absente.");
  }

  if (!config.certificate) {
    throw new SamlConfigError(
      "Le certificat du fournisseur d'identité est absent. Sans lui, la signature " +
        "de ses assertions n'est pas vérifiable : la connexion est refusée.",
    );
  }

  return {
    enabled: config.enabled !== false,
    entryPoint: config.entryPoint,
    certificate: config.certificate,
    provider: config.provider ?? 'generic',
    entityId: config.entityId,
  };
}

/** Paire de clés du fournisseur de service (nous). */
interface ServiceProviderKeyPair {
  privateKey: string;
  cert: string;
}

/**
 * Lit la paire de clés du fournisseur de service.
 *
 * ⚠️ **Jamais générée automatiquement.** Le modèle en générait une à chaque
 * démarrage si les variables étaient absentes : le certificat SP changeait donc
 * à chaque redémarrage, et la confiance configurée chez le fournisseur
 * d'identité devenait caduque — de façon silencieuse, et sans autre symptôme
 * qu'un échec de connexion difficile à relier à sa cause.
 */
function serviceProviderKeys(): ServiceProviderKeyPair {
  const privateKey = process.env.SAML_SP_PRIVATE_KEY;
  const cert = process.env.SAML_SP_CERT;

  if (!privateKey || !cert) {
    throw new SamlConfigError(
      'SAML_SP_PRIVATE_KEY et SAML_SP_CERT sont requis pour le SSO. ' +
        'Générer une paire stable (elle ne doit JAMAIS changer) :\n' +
        '  openssl req -x509 -newkey rsa:2048 -nodes -keyout sp-key.pem -out sp-cert.pem ' +
        '-days 3650 -subj "/CN=katalyst-sp"',
    );
  }

  // Les `\n` échappés d'une variable d'environnement doivent redevenir des
  // sauts de ligne réels (même traitement que la clé Firebase).
  return {
    privateKey: privateKey.replace(/\\n/g, '\n'),
    cert: cert.replace(/\\n/g, '\n'),
  };
}

/** URL d'assertion (ACS) pour une organisation. */
export function assertionConsumerUrl(organizationId: string): string {
  return `${appUrl()}/api/auth/saml/callback?orgId=${encodeURIComponent(organizationId)}`;
}

/** Identifiant d'entité du fournisseur de service, par organisation. */
export function serviceProviderEntityId(organizationId: string): string {
  return `${appUrl()}/api/auth/saml/metadata?orgId=${encodeURIComponent(organizationId)}`;
}

function buildSamlInstance(organizationId: string, config: OrganizationSamlConfig): SAML {
  const keys = serviceProviderKeys();

  const options: SamlConfig = {
    callbackUrl: assertionConsumerUrl(organizationId),
    entryPoint: config.entryPoint,
    issuer: config.entityId || serviceProviderEntityId(organizationId),
    // `idpCert` et non `cert` : l'API a changé entre `passport-saml` 3.x (le
    // modèle) et `@node-saml/node-saml` 5.x. Le rôle est le même : le certificat
    // contre lequel la signature de l'IdP est vérifiée.
    idpCert: config.certificate,
    privateKey: keys.privateKey,
    decryptionPvk: keys.privateKey,
    // `wantAssertionsSigned` : une assertion non signée est rejetée. Sans cette
    // exigence, un certificat valide ne servirait à rien — rien ne serait
    // vérifié.
    wantAssertionsSigned: true,
    wantAuthnResponseSigned: true,
    signatureAlgorithm: 'sha256',
    digestAlgorithm: 'sha256',
    identifierFormat: 'urn:oasis:names:tc:SAML:2.0:nameid-format:emailAddress',
    // Tolérance d'horloge : 5 minutes. Les serveurs ne sont pas parfaitement
    // synchronisés, et un décalage de quelques secondes ne doit pas bloquer une
    // connexion légitime.
    acceptedClockSkewMs: 300_000,
  };

  return new SAML(options);
}

/** Métadonnées du fournisseur de service, à remettre au fournisseur d'identité. */
export function generateMetadata(organizationId: string, raw: unknown): string {
  const config = readSamlConfig(raw);
  const keys = serviceProviderKeys();

  // Le certificat SP sert à la fois de certificat de déchiffrement et de clé
  // publique publiée : nous ne chiffrons pas les assertions, mais l'IdP a
  // besoin de la clé publique pour vérifier ce que nous signons.
  return buildSamlInstance(organizationId, config).generateServiceProviderMetadata(
    keys.cert,
    keys.cert,
  );
}

/**
 * Construit l'URL de redirection vers le fournisseur d'identité.
 * `relayState` est renvoyé tel quel par l'IdP : il sert à retrouver la
 * destination demandée par l'utilisateur.
 */
export async function buildAuthorizeUrl(
  organizationId: string,
  raw: unknown,
  relayState: string,
): Promise<string> {
  const config = readSamlConfig(raw);

  if (!config.enabled) {
    throw new SamlConfigError('Le SSO est désactivé pour cette organisation.');
  }

  return buildSamlInstance(organizationId, config).getAuthorizeUrlAsync(relayState, undefined, {});
}

/** Profil extrait d'une assertion validée. */
export interface SamlIdentity {
  email: string;
  name: string;
}

/**
 * Valide la réponse du fournisseur d'identité et en extrait l'identité.
 *
 * ⚠️ La validation de signature est faite par la bibliothèque contre le
 * certificat de l'IdP. Aucune donnée de la réponse n'est exploitée avant que
 * cette validation n'ait réussi — c'est tout l'intérêt de SAML.
 */
export async function validateSamlResponse(
  organizationId: string,
  raw: unknown,
  body: Record<string, string>,
): Promise<SamlIdentity> {
  const config = readSamlConfig(raw);

  if (!config.enabled) {
    throw new SamlConfigError('Le SSO est désactivé pour cette organisation.');
  }

  let profile: Profile | null;

  try {
    ({ profile } = await buildSamlInstance(organizationId, config).validatePostResponseAsync(body));
  } catch (error) {
    // La cause est journalisée côté serveur, jamais renvoyée : un message
    // d'erreur de bibliothèque renseigne un attaquant sur ce qui a été vérifié.
    console.warn('[saml] assertion refusée :', error);
    throw new SamlAuthenticationError('Assertion SAML invalide ou signature non vérifiable.');
  }

  if (!profile) {
    throw new SamlAuthenticationError("L'assertion ne contient aucun profil.");
  }

  // Le `nameID` est l'identité déclarée ; on privilégie un attribut email s'il
  // est fourni, car certains fournisseurs y placent l'adresse et laissent un
  // identifiant opaque dans le `nameID`.
  const rawEmail =
    (profile.email as string | undefined) ??
    (profile.mail as string | undefined) ??
    (profile.nameID as string | undefined);

  const email = rawEmail?.trim().toLowerCase();
  if (!email || !email.includes('@')) {
    throw new SamlAuthenticationError(
      "Le fournisseur d'identité n'a pas transmis d'adresse email exploitable.",
    );
  }

  const rawName =
    (profile.displayName as string | undefined) ??
    (profile.cn as string | undefined) ??
    email.split('@')[0];

  return { email, name: rawName };
}
