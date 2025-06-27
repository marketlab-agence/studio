
import { PREMIUM_PLAN_PRICE_EUR } from './users';

export interface SubscriptionPlan {
  id: 'free' | 'premium';
  name: string;
  description: string;
  price: number;
  billingPeriod: 'monthly' | 'yearly' | 'once';
  features: string[];
  courses: string[];
}

export const PLANS_DATA: Record<'free' | 'premium', SubscriptionPlan> = {
  'free': {
    id: 'free',
    name: 'Formule Gratuite',
    description: 'Accès limité à la plateforme.',
    price: 0,
    billingPeriod: 'monthly',
    features: [
      'Accès au premier chapitre de chaque formation',
      'Quiz de fin de chapitre',
    ],
    courses: [] // Accès partiel géré par la logique du cours
  },
  'premium': {
    id: 'premium',
    name: 'Formule Premium',
    description: 'Accès complet et fonctionnalités avancées.',
    price: PREMIUM_PLAN_PRICE_EUR,
    billingPeriod: 'monthly',
    features: [
      'Accès à toutes les formations',
      'Playground avec IA pour conseils et astuces',
      'Intégration GitHub pour commandes en live',
      'Certificat de réussite',
    ],
    courses: ['git-github-tutorial'] // Accès complet
  }
};
