
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingPeriod: 'monthly' | 'yearly' | 'once';
  features: string[];
  courses: string[];
  cta: string;
  recommended?: boolean;
}
