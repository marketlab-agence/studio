import { NextResponse, type NextRequest } from 'next/server';
import { getAuthProvider } from '@/lib/providers';
import { identityFromAssertion } from '@/lib/db/saml-config';
import { SamlAuthenticationError, SamlConfigError } from '@/lib/auth/saml';
import { setSessionCookies } from '@/lib/auth/cookies';
import { safeRedirectPath } from '@/lib/auth/redirect';

/**
 * POST /api/auth/saml/callback?orgId=… — point d'assertion (ACS).
 *
 * ⚠️ **POST et non GET** : la liaison SAML standard envoie l'assertion par un
 * formulaire POST. L'assertion peut être volumineuse, et un GET la placerait
 * dans l'URL — donc dans l'historique du navigateur, les journaux du serveur et
 * l'en-tête `Referer` envoyé aux sites tiers.
 *
 * Ordre des vérifications, strict :
 *
 * 1. `orgId` identifie l'organisation, donc **quel certificat** vérifie la
 *    signature. Sans lui, on ne saurait pas à qui faire confiance ;
 * 2. la **signature de l'assertion** est vérifiée contre ce certificat — aucune
 *    donnée n'est exploitée avant ;
 * 3. le compte doit **préexister dans cette organisation** : une assertion
 *    prouve une identité, pas un droit d'accès.
 */
export async function POST(request: NextRequest) {
  const organizationId = request.nextUrl.searchParams.get('orgId');

  const fail = (code: string, detail?: unknown): NextResponse => {
    if (detail) console.warn(`[saml] rappel refusé — ${code} :`, detail);

    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('error', code);
    return NextResponse.redirect(url);
  };

  if (!organizationId) return fail('saml_orgid_manquant');

  // L'assertion arrive en `application/x-www-form-urlencoded`.
  let body: Record<string, string>;
  try {
    const form = await request.formData();
    body = Object.fromEntries(
      [...form.entries()].map(([key, value]) => [key, String(value)]),
    );
  } catch (error) {
    return fail('saml_corps_illisible', error);
  }

  try {
    // 2. Validation de la signature, puis extraction de l'identité.
    const identity = await identityFromAssertion(organizationId, body);

    // 3. Le compte doit exister dans l'organisation.
    const session = await getAuthProvider().loginWithSaml(organizationId, identity);

    // `RelayState` transite par le fournisseur d'identité : on le refiltre,
    // car il n'est plus sous notre contrôle.
    const destination = safeRedirectPath(body.RelayState, '/dashboard');

    const url = request.nextUrl.clone();
    url.pathname = destination;
    url.search = '';

    return setSessionCookies(NextResponse.redirect(url), session);
  } catch (error) {
    if (error instanceof SamlAuthenticationError) return fail('saml_assertion_invalide', error);
    if (error instanceof SamlConfigError) return fail('saml_non_configure', error);

    // Un compte absent ou désactivé est un refus d'usage, pas une panne.
    if (error instanceof Error && /aucun compte ne lui correspond/.test(error.message)) {
      return fail('saml_compte_absent', error);
    }
    if (error instanceof Error && /désactivé/.test(error.message)) {
      return fail('compte_desactive', error);
    }

    console.error('[saml] POST /api/auth/saml/callback — échec inattendu :', error);
    return fail('saml_erreur');
  }
}

export async function GET() {
  // Un GET sur le point d'assertion signale une configuration erronée chez le
  // fournisseur d'identité (il devrait poster). On le dit clairement.
  return NextResponse.json(
    {
      message:
        "Ce point d'assertion attend un POST du fournisseur d'identité. " +
        'Vérifiez que son URL ACS est bien configurée en POST.',
    },
    { status: 405 },
  );
}
