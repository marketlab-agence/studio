'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { Button } from '@/components/ui/button';

/**
 * Change la langue de l'interface.
 *
 * ⚠️ **Deux niveaux de persistance, et l'ordre compte.** Le cookie posé par
 * `next-intl` survit dans le navigateur ; la préférence en base (`users.language`)
 * suit l'utilisateur d'un appareil à l'autre. Cette dernière prime — c'est
 * pourquoi la connexion réécrit le cookie depuis la base.
 *
 * ⚠️ **La requête de persistance n'est pas attendue.** L'interface doit changer
 * immédiatement au clic ; bloquer la navigation sur un aller-retour réseau
 * donnerait une impression de lenteur pour un enregistrement sans enjeu visuel.
 * Si l'appel échoue (visiteur non connecté), la langue change quand même pour la
 * session en cours — seul l'enregistrement durable est perdu.
 */
export function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslations('localeSwitcher');
  const router = useRouter();
  const pathname = usePathname();

  function changer(nouvelleLocale: string) {
    if (nouvelleLocale === locale) return;

    void fetch('/api/v1/preferences/language', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: nouvelleLocale }),
    });

    router.replace(pathname, { locale: nouvelleLocale });
  }

  return (
    <div className="flex items-center gap-1" role="group" aria-label={t('label')}>
      {routing.locales.map((l) => (
        <Button
          key={l}
          variant={l === locale ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => changer(l)}
          aria-current={l === locale ? 'true' : undefined}
        >
          {t(l)}
        </Button>
      ))}
    </div>
  );
}
