import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/**
 * Navigation qui préserve automatiquement la locale courante.
 *
 * ⚠️ **Ne jamais importer `Link` depuis `next/link` directement dans une page
 * localisée** : un lien brut perdrait le préfixe de locale et ferait sortir
 * l'utilisateur de sa langue. Toujours utiliser ces exports.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
