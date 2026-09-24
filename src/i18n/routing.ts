import { defineRouting } from 'next-intl/routing';

/**
 * Locales supportées et locale par défaut.
 *
 * ⚠️ **`fr` est la locale de repli** (REQ-I18N-08, T8.8) : une URL sans locale
 * reconnue retombe sur le français. C'est cohérent avec le fait que les 6
 * formations existantes sont en français — un visiteur non identifié voit la
 * langue la plus représentée dans le catalogue.
 *
 * ⚠️ **Ajouter une locale est une extension, pas une refonte** (REQ-I18N-02) :
 * il suffira d'un catalogue et d'une entrée ici, sans toucher au reste.
 */
export const routing = defineRouting({
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
  localePrefix: 'always',
});
