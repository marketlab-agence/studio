import { NextResponse } from 'next/server';
import { z } from 'zod';
import { clearSamlConfig, rawSamlConfig, saveSamlConfig } from '@/lib/db/saml-config';
import { serviceProviderEntityId, assertionConsumerUrl, SamlConfigError } from '@/lib/auth/saml';
import {
  errorResponse,
  mapAuthError,
  parseBody,
  requireSession,
  scopeFromClaims,
} from '@/lib/auth/api';
import { canManageSettings } from '@/lib/auth/authorization';

/**
 * GET    /api/v1/organizations/saml — configuration SSO de l'organisation.
 * PUT    /api/v1/organizations/saml — enregistre la configuration.
 * DELETE /api/v1/organizations/saml — retire la configuration.
 *
 * Réservé à l'**administration de l'organisation** : activer le SSO revient à
 * décider qui peut entrer. Le contrôle est fait ici, dans la route — le
 * middleware ne peut pas le porter (runtime Edge, sans accès à la base).
 */

const samlConfigSchema = z.object({
  enabled: z.boolean().default(true),
  entryPoint: z
    .string()
    .trim()
    .url("L'URL SSO doit être une URL absolue (https://…).")
    .max(500),
  // Le certificat est **obligatoire** : sans lui, la signature des assertions
  // n'est pas vérifiable. Le rendre facultatif reviendrait à accepter des
  // identités forgeables.
  certificate: z
    .string()
    .trim()
    .min(1, "Le certificat du fournisseur d'identité est obligatoire.")
    .refine(
      (value) => value.includes('BEGIN CERTIFICATE'),
      'Le certificat doit être au format PEM (« -----BEGIN CERTIFICATE----- »).',
    ),
  provider: z.enum(['azure-ad', 'okta', 'google', 'generic']).default('generic'),
  entityId: z.string().trim().max(500).optional(),
});

export async function GET(request: Request) {
  const session = await requireSession(request);
  if (session.response) return session.response;

  if (!canManageSettings(session.claims.role)) {
    return errorResponse('Vous n’avez pas les droits pour consulter la configuration SSO.', 403);
  }

  try {
    const { scope } = { scope: scopeFromClaims(session.claims) };
    const config = await rawSamlConfig(scope.organizationId);

    return NextResponse.json({
      config,
      // Indique à l'administrateur **quoi transmettre au fournisseur
      // d'identité** : sans ces deux URL, la configuration côté IdP se fait à
      // l'aveugle.
      serviceProvider: {
        entityId: serviceProviderEntityId(scope.organizationId),
        assertionConsumerServiceUrl: assertionConsumerUrl(scope.organizationId),
        metadataUrl: `${serviceProviderEntityId(scope.organizationId)}`,
      },
    });
  } catch (error) {
    return mapAuthError(error, 'GET /api/v1/organizations/saml');
  }
}

export async function PUT(request: Request) {
  const session = await requireSession(request);
  if (session.response) return session.response;

  if (!canManageSettings(session.claims.role)) {
    return errorResponse('Vous n’avez pas les droits pour modifier la configuration SSO.', 403);
  }

  const body = await parseBody(request, samlConfigSchema);
  if (body.response) return body.response;

  try {
    const { scope } = { scope: scopeFromClaims(session.claims) };
    await saveSamlConfig(scope.organizationId, body.data);

    return NextResponse.json({ message: 'Configuration SSO enregistrée.' });
  } catch (error) {
    // Une configuration invalide est un refus d'usage, pas une panne.
    if (error instanceof SamlConfigError) return errorResponse(error.message, 400);

    return mapAuthError(error, 'PUT /api/v1/organizations/saml');
  }
}

export async function DELETE(request: Request) {
  const session = await requireSession(request);
  if (session.response) return session.response;

  if (!canManageSettings(session.claims.role)) {
    return errorResponse('Vous n’avez pas les droits pour modifier la configuration SSO.', 403);
  }

  try {
    const { scope } = { scope: scopeFromClaims(session.claims) };
    await clearSamlConfig(scope.organizationId);

    return NextResponse.json({ message: 'Configuration SSO retirée.' });
  } catch (error) {
    return mapAuthError(error, 'DELETE /api/v1/organizations/saml');
  }
}
