import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

/**
 * Charge le catalogue de la locale demandée.
 *
 * ⚠️ **Le repli n'est pas silencieux.** Une locale inconnue dans l'URL est
 * ramenée à la locale par défaut sans erreur — c'est ce qui rend `/de/login`
 * utilisable plutôt qu'une page blanche.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const demandee = await requestLocale;
  const locale = hasLocale(routing.locales, demandee) ? demandee : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../locales/${locale}/translation.json`)).default,
  };
});
