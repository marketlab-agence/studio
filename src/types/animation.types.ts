import type { AnimationControls, TargetAndTransition } from 'framer-motion';

export type AnimationDefinition = {
  initial: TargetAndTransition;
  animate: TargetAndTransition;
  exit: TargetAndTransition;
};

export type AnimationController = AnimationControls;
