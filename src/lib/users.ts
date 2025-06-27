
export interface MockUser {
    id: string;
    name: string;
    email: string;
    plan: 'Premium' | 'Gratuit';
    status: 'Actif' | 'Inactif';
    role: 'Admin' | 'Modérateur' | 'Utilisateur';
    joined: string; // e.g. '2023-01-15'
    phone?: string;
}

export const MOCK_USERS: MockUser[] = [
  { id: 'usr_0', name: 'Admin Katalyst', email: 'admin@katalyst.com', plan: 'Premium', status: 'Actif', role: 'Admin', joined: '2023-01-01', phone: '+33 1 23 45 67 89' },
  { id: 'usr_1', name: 'Alice Martin', email: 'alice.m@example.com', plan: 'Premium', status: 'Actif', role: 'Modérateur', joined: '2023-01-15', phone: '+33 6 11 22 33 44' },
  { id: 'usr_2', name: 'Bob Durand', email: 'bob.d@example.com', plan: 'Gratuit', status: 'Actif', role: 'Utilisateur', joined: '2023-02-20' },
  { id: 'usr_3', name: 'Carla Dubois', email: 'carla.d@example.com', plan: 'Premium', status: 'Inactif', role: 'Utilisateur', joined: '2023-03-10' },
  { id: 'usr_4', name: 'David Petit', email: 'david.p@example.com', plan: 'Gratuit', status: 'Actif', role: 'Utilisateur', joined: '2023-04-05', phone: '+1 415 555 2671' },
  { id: 'usr_5', name: 'Eva Lefebvre', email: 'eva.l@example.com', plan: 'Premium', status: 'Actif', role: 'Modérateur', joined: '2023-05-12' },
  { id: 'usr_6', name: 'Frank Moreau', email: 'frank.m@example.com', plan: 'Premium', status: 'Actif', role: 'Utilisateur', joined: '2023-06-18', phone: '+44 7700 900548' },
  { id: 'usr_7', name: 'Grace Girard', email: 'grace.g@example.com', plan: 'Gratuit', status: 'Inactif', role: 'Utilisateur', joined: '2023-07-22' },
  { id: 'usr_8', name: 'Hugo Roussel', email: 'hugo.r@example.com', plan: 'Premium', status: 'Actif', role: 'Utilisateur', joined: '2023-08-30' },
];

export const PREMIUM_PLAN_PRICE_EUR = 9.99;
