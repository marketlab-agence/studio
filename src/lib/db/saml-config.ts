import { query } from '@/lib/db/pool';
import {
  buildAuthorizeUrl,
  generateMetadata,
  readSamlConfig,
  SamlConfigError,
  validateSamlResponse,
  type OrganizationSamlConfig,
  type SamlIdentity,
} from '@/lib/auth/saml';

/**
 * Accès à la configuration SAML des organisations (REQ-AUTH-05).
 *
 * La configuration vit dans `organizations.saml_config` (JSONB). Elle est lue
 * **sans `OrgScope`** pour deux usages, et c'est délibéré :
 *
 * - `metadata` et `callback` sont appelés par le **fournisseur d'identité** ou
 *   par le navigateur **avant** toute session : il n'y a pas encore de scope à
 *   fournir ;
 * - l'organisation est alors identifiée par le paramètre `orgId`, qui vient de
 *   l'URL de redirection configurée chez l'IdP.
 *
 * La configuration est donc **publique par nature** (URL SSO et certificat
 * public). Le certificat n'est pas un secret : il sert à vérifier des
 * signatures, pas à en produire.
 *
 * Les opérations d'**écriture**, elles, passent par une route authentifiée et
 * réservée à l'administration de l'organisation.
 */

type SamlConfigRow = {
  id: string;
  name: string;
  saml_config: unknown;
};

/** Organisation ayant activé le SSO, par identifiant. */
export async function organizationWithSaml(organizationId: string): Promise<SamlConfigRow | null> {
  const { rows } = await query<SamlConfigRow>(
    'SELECT id, name, saml_config FROM organizations WHERE id = $1',
    [organizationId],
  );

  return rows[0] ?? null;
}

/** Organisations ayant activé le SSO, pour l'écran de connexion. */
export async function organizationsWithSamlEnabled(): Promise<
  { id: string; name: string; provider: string }[]
> {
  const { rows } = await query<{ id: string; name: string; provider: string | null }>(
    `SELECT id, name, saml_config ->> 'provider' AS provider
     FROM organizations
     WHERE saml_config IS NOT NULL
       AND (saml_config ->> 'enabled')::boolean IS TRUE
     ORDER BY name`,
  );

  return rows.map((row) => ({ id: row.id, name: row.name, provider: row.provider ?? 'generic' }));
}

/** Métadonnées SP d'une organisation, ou `null` si le SSO n'y est pas configuré. */
export async function metadataFor(organizationId: string): Promise<string | null> {
  const organization = await organizationWithSaml(organizationId);
  if (!organization?.saml_config) return null;

  return generateMetadata(organizationId, organization.saml_config);
}

/** URL de redirection vers le fournisseur d'identité de l'organisation. */
export async function authorizeUrlFor(
  organizationId: string,
  relayState: string,
): Promise<string> {
  const organization = await organizationWithSaml(organizationId);

  if (!organization?.saml_config) {
    throw new SamlConfigError("Le SSO n'est pas configuré pour cette organisation.");
  }

  return buildAuthorizeUrl(organizationId, organization.saml_config, relayState);
}

/** Valide une assertion et retourne l'identité déclarée. */
export async function identityFromAssertion(
  organizationId: string,
  body: Record<string, string>,
): Promise<SamlIdentity> {
  const organization = await organizationWithSaml(organizationId);

  if (!organization?.saml_config) {
    throw new SamlConfigError("Le SSO n'est pas configuré pour cette organisation.");
  }

  return validateSamlResponse(organizationId, organization.saml_config, body);
}

/**
 * Enregistre la configuration SAML d'une organisation.
 * La validation a lieu **avant** l'écriture : une configuration sans certificat
 * est refusée, pas stockée puis rejetée à l'usage.
 */
export async function saveSamlConfig(
  organizationId: string,
  config: OrganizationSamlConfig,
): Promise<void> {
  // Relit la configuration pour la valider (certificat obligatoire, URL SSO
  // présente) avant de l'enregistrer.
  readSamlConfig(config);

  await query('UPDATE organizations SET saml_config = $2 WHERE id = $1', [
    organizationId,
    JSON.stringify(config),
  ]);
}

/** Retire la configuration SAML d'une organisation. */
export async function clearSamlConfig(organizationId: string): Promise<void> {
  await query('UPDATE organizations SET saml_config = NULL WHERE id = $1', [organizationId]);
}

/** Configuration SAML brute d'une organisation (pour l'écran d'administration). */
export async function rawSamlConfig(organizationId: string): Promise<unknown> {
  const organization = await organizationWithSaml(organizationId);
  return organization?.saml_config ?? null;
}
