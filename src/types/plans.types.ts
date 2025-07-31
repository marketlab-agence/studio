
export type FeaturePermission =
  | 'FIRST_CHAPTER_ACCESS'
  | 'ALL_COURSES_ACCESS'
  | 'END_OF_CHAPTER_QUIZ'
  | 'AI_PLAYGROUND'
  | 'CERTIFICATE_OF_COMPLETION'
  | 'PRIORITY_SUPPORT'
  | 'ADVANCED_ANALYTICS';

export const ALL_FEATURES: { id: FeaturePermission; label: string }[] = [
    { id: 'FIRST_CHAPTER_ACCESS', label: 'Accès au premier chapitre de chaque formation' },
    { id: 'ALL_COURSES_ACCESS', label: 'Accès à toutes les formations' },
    { id: 'END_OF_CHAPTER_QUIZ', label: 'Quiz de fin de chapitre' },
    { id: 'AI_PLAYGROUND', label: 'Playground avec IA pour conseils et astuces' },
    { id: 'CERTIFICATE_OF_COMPLETION', label: 'Certificat de réussite' },
    { id: 'PRIORITY_SUPPORT', label: 'Support prioritaire par email' },
    { id: 'ADVANCED_ANALYTICS', label: 'Statistiques d\'apprentissage avancées' },
];

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingPeriod: 'monthly' | 'yearly' | 'once';
  features: string[];
  courses: string[];
  permissions: FeaturePermission[];
  cta: string;
  recommended?: boolean;
}
