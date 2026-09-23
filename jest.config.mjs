import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  dir: './',
})

// Dépendances ESM publiées par MSW v2 : elles doivent être transformées par jest.
const ESM_DEPS = [
  'msw',
  '@mswjs',
  '@open-draft',
  '@bundled-es-modules',
  'until-async',
  'outvariant',
  'strict-event-emitter',
  'is-node-process',
  'headers-polyfill',
  'yaml',
  // `jose` est publie en ESM uniquement (Web Crypto, compatible Edge runtime).
  'jose',
].join('|')

/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  // MSW v2 a besoin des globals fetch (Response, Request, Headers) que jsdom
  // n'implémente pas. `jest-fixed-jsdom` est le fork de jest-environment-jsdom
  // recommandé par MSW qui les expose.
  testEnvironment: 'jest-fixed-jsdom',
  // MSW v2 expose `msw/node` avec `"browser": null`. Sans cette option, jest
  // (environnement jsdom) résout le build navigateur et échoue avec
  // « Cannot find module 'msw/node' ». La condition vide force la résolution
  // par la condition `node`.
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Les tests d'intégration DB vivent dans un projet Jest séparé
  // (environnement node, sans jsdom ni MSW). Voir jest.config.db.mjs.
  // Les tests E2E (Playwright) sont hors de Jest. Voir playwright.config.ts.
  testPathIgnorePatterns: ['/node_modules/', '/e2e/', '\\.db\\.test\\.ts$'],
}

// `next/jest` injecte un transformIgnorePatterns qui ignore TOUT `node_modules`.
// Comme jest combine ces motifs en OU, un ajout ne peut pas « dé-ignorer » un
// paquet : il faut remplacer la liste entière après résolution de la config.
export default async () => {
  const config = await createJestConfig(customJestConfig)()
  config.transformIgnorePatterns = [
    `node_modules[\\\\/](?!(${ESM_DEPS})[\\\\/])`,
    '^.+\\.module\\.(css|sass|scss)$',
  ]
  return config
}
