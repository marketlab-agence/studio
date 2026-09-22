import { NextResponse } from 'next/server';
import { metadataFor } from '@/lib/db/saml-config';
import { SamlConfigError } from '@/lib/auth/saml';

/**
 * GET /api/auth/saml/metadata?orgId=… — métadonnées du fournisseur de service.
 *
 * C'est le document à **remettre au fournisseur d'identité** pour qu'il sache à
 * qui faire confiance : notre identifiant d'entité, notre URL d'assertion et
 * notre certificat public. Sans lui, la configuration côté IdP se fait à la
 * main, avec un risque d'erreur difficile à diagnostiquer.
 *
 * La réponse est du **XML** et non du JSON : c'est le format que consomment les
 * fournisseurs d'identité.
 *
 * Le certificat exposé est **public** : il sert à vérifier nos signatures, pas à
 * en produire. Aucune donnée sensible ne figure dans ce document.
 */
export async function GET(request: Request) {
  const organizationId = new URL(request.url).searchParams.get('orgId');

  if (!organizationId) {
    return NextResponse.json({ message: 'Paramètre orgId manquant.' }, { status: 400 });
  }

  try {
    const metadata = await metadataFor(organizationId);

    if (!metadata) {
      return NextResponse.json(
        { message: "Le SSO n'est pas configuré pour cette organisation." },
        { status: 404 },
      );
    }

    return new NextResponse(metadata, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        // Ces métadonnées ne contiennent rien de secret, mais elles ne doivent
        // pas être mises en cache par un intermédiaire : une rotation de
        // certificat doit être visible immédiatement.
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof SamlConfigError) {
      console.warn(`[saml] métadonnées indisponibles : ${error.message}`);
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    console.error('[saml] GET /api/auth/saml/metadata — échec inattendu :', error);
    return NextResponse.json({ message: 'Erreur interne.' }, { status: 500 });
  }
}
