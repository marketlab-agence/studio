import { NextResponse, type NextRequest } from 'next/server';
import { authorizeUrlFor } from '@/lib/db/saml-config';
import { SamlConfigError } from '@/lib/auth/saml';
import { safeRedirectPath } from '@/lib/auth/redirect';

/**
 * GET /api/auth/saml/login?orgId=…&redirect=… — démarre le SSO (REQ-AUTH-05).
 *
 * Redirige le navigateur vers le fournisseur d'identité de l'organisation.
 * C'est une **navigation complète** et non un appel `fetch` : l'utilisateur doit
 * se rendre chez l'IdP pour s'y authentifier.
 *
 * La destination demandée est transmise en `RelayState`. Elle est **filtrée**
 * avant d'être envoyée, puis **refiltrée** au retour : elle transite par un
 * tiers, donc elle ne doit jamais être utilisée telle quelle pour rediriger
 * (redirection ouverte).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const organizationId = params.get('orgId');

  const fail = (code: string, detail?: unknown): NextResponse => {
    if (detail) console.warn(`[saml] démarrage refusé — ${code} :`, detail);

    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('error', code);
    return NextResponse.redirect(url);
  };

  if (!organizationId) return fail('saml_orgid_manquant');

  try {
    const destination = safeRedirectPath(params.get('redirect'), '/dashboard');
    const authorizeUrl = await authorizeUrlFor(organizationId, destination);

    return NextResponse.redirect(authorizeUrl);
  } catch (error) {
    if (error instanceof SamlConfigError) return fail('saml_non_configure', error);

    console.error('[saml] GET /api/auth/saml/login — échec inattendu :', error);
    return fail('saml_erreur');
  }
}
