
import { PREMIUM_PLAN_PRICE_EUR } from './users';

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

export const PLANS_DATA: Record<string, Omit<SubscriptionPlan, 'id'>> = {
  'free': {
    name: 'Formule Gratuite',
    description: 'Accès limité pour découvrir la plateforme.',
    price: 0,
    billingPeriod: 'monthly',
    features: [
      'Accès au premier chapitre de chaque formation',
      'Quiz de fin de chapitre',
    ],
    courses: [],
    permissions: ['FIRST_CHAPTER_ACCESS', 'END_OF_CHAPTER_QUIZ'],
    cta: 'Vous utilisez ce plan',
  },
  'premium': {
    name: 'Formule Premium',
    description: 'Accès complet et fonctionnalités avancées.',
    price: PREMIUM_PLAN_PRICE_EUR,
    billingPeriod: 'monthly',
    features: [
      'Accès à toutes les formations',
      'Playground avec IA pour conseils et astuces',
      'Certificat de réussite',
      'Support prioritaire',
    ],
    courses: ['git-github-tutorial'],
    permissions: ['ALL_COURSES_ACCESS', 'AI_PLAYGROUND', 'CERTIFICATE_OF_COMPLETION', 'END_OF_CHAPTER_QUIZ', 'PRIORITY_SUPPORT'],
    cta: 'Passer au Premium',
    recommended: true,
  }
};
