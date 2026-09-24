import type { Metadata } from 'next';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { Toaster } from '@/components/ui/toaster';
import { TutorialProvider } from '@/contexts/TutorialContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher';
import { routing } from '@/i18n/routing';
import '../globals.css';

export const metadata: Metadata = {
  title: 'Katalyst | Accélérez votre maîtrise des outils professionnels',
  description:
    'Devenez un expert des outils DevOps & AI. Maîtrisez Jira, AWS, GitHub Actions et plus encore grâce à des simulations pratiques.',
};

/** Pré-génère les deux locales : `/fr/**` et `/en/**`. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Layout localisé — c'est lui qui porte `<html>`.
 *
 * ⚠️ **`lang` suit la locale RÉELLE.** La valeur était `fr` en dur : un lecteur
 * d'écran annonçait donc du français sur une page anglaise, et les moteurs de
 * recherche indexaient la mauvaise langue. C'est une exigence d'accessibilité
 * (REQ-I18N-01), pas un détail.
 *
 * ⚠️ **`<html>` ne peut vivre que dans UN layout**, celui qui est racine pour la
 * route. Le déplacer ici est ce qui rend le layout racine superflu.
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Une locale inconnue dans l'URL est une erreur 404, pas un repli silencieux :
  // le middleware a déjà ramené les locales valides, ce cas signale une URL forgée.
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    <html lang={locale} className="dark">
      <body className="font-body antialiased">
        <NextIntlClientProvider>
          <AuthProvider>
            <TutorialProvider>
              <div className="flex min-h-screen w-full flex-col">
                <Header />
                <div className="flex justify-end px-4 pt-2 md:px-6">
                  <LocaleSwitcher />
                </div>
                {children}
                <Footer />
              </div>
            </TutorialProvider>
          </AuthProvider>
        </NextIntlClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
