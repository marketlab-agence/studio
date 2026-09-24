/** @type {import('next').NextConfig} */
const createNextIntlPlugin = require('next-intl/plugin');

/**
 * ⚠️ **Le plugin est obligatoire pour l'App Router**, pas une option.
 *
 * Sans cet appel, `next-intl` ne sait pas où trouver `src/i18n/request.ts` et
 * lève au runtime : « Couldn't find next-intl config file ». Le serveur démarre
 * normalement, puis **chaque page renvoie une 500** — un échec silencieux au
 * démarrage, bruyant seulement à la première requête.
 *
 * Le chemin est celui par défaut (`./src/i18n/request.ts`), détecté
 * automatiquement : le passer explicitement serait redondant.
 */
const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  // Suppression de la section experimental.serverActions qui est désormais obsolète
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
};

module.exports = withNextIntl(nextConfig);