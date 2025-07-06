
export interface MockUser {
    id: string;
    name: string;
    email: string;
    plan: 'Premium' | 'Gratuit';
    status: 'Actif' | 'Inactif';
    role: 'Super Admin' | 'Admin' | 'Modérateur' | 'Utilisateur';
    joined: string; // e.g. '2023-01-15'
    phone?: string;
}

// This file is now for defining types and interfaces, not for storing mutable data.
// The data source is now Firestore.
// The initial data has been migrated to a seeding script or will be created via the admin UI.

export const PREMIUM_PLAN_PRICE_EUR = 9.99;
