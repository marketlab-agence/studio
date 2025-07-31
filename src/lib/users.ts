
export interface AppUser {
    id: string;
    name: string;
    email: string;
    plan: 'Premium' | 'Gratuit';
    status: 'Actif' | 'Inactif';
    role: 'Super Admin' | 'Admin' | 'Modérateur' | 'Utilisateur';
    joined: string; // e.g. '2023-01-15'
    phone?: string;
}

export const PREMIUM_PLAN_PRICE_EUR = 9.99;
