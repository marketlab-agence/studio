import { useAnimation } from 'framer-motion';

/**
 * Hook pour contrôler les animations avec Framer Motion.
 * @returns Les contrôles d'animation de Framer Motion.
 */
export function useAnimations() {
  const controls = useAnimation();
  return controls;
}
