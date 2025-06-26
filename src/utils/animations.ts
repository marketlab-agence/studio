import { type AnimationDefinition } from '@/types/animation.types';

/**
 * Utilitaires pour les animations Framer Motion.
 * Contient des définitions d'animations réutilisables.
 */

export const fadeIn: AnimationDefinition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const slideInFromLeft: AnimationDefinition = {
  initial: { x: '-100%', opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '-100%', opacity: 0 },
};
