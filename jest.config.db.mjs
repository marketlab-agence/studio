/**
 * Configuration Jest du projet de test « DB » (environnement Node).
 *
 * Distinct de la configuration principale (jsdom + MSW) : ces tests parlent
 * réellement à PostgreSQL (`katalyst_test`) via le pool partagé.
 *
 * Usage : npm run test:db
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));

/** @type {import('jest').Config} */
export default {
  rootDir: root,
  displayName: 'db',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.db.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/tests/db/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    // Le projet compile en ESM/bundler pour Next ; jest a besoin de CommonJS.
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'commonjs', moduleResolution: 'node' } }],
  },
};
