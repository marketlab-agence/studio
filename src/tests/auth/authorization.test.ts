/**
 * @jest-environment node
 *
 * Autorisation et matrice de rôles (T4.14, REQ-ORG-06).
 *
 * ⚠️ Ce module est la **barrière réelle** : le middleware Next tourne en Edge et
 * ne peut pas l'être. Une erreur ici est donc un trou d'autorisation, pas un
 * détail — d'où le caractère exhaustif des tests sur `canAssignRole`.
 */

import {
  canAccessAdminUi,
  ADMIN_ROLES,
  isAdminPath,
} from '@/lib/auth/routes';
import {
  canAssignRole,
  canManageContent,
  canManageMembers,
  canManageSettings,
} from '@/lib/auth/authorization';

/** Tous les rôles du schéma. */
const ROLES = ['Super Admin', 'Propriétaire', 'Admin', 'Modérateur', 'Utilisateur'] as const;

describe('permissions par rôle', () => {
  describe('gérer les membres', () => {
    it('est réservé à Super Admin, Propriétaire et Admin', () => {
      expect(canManageMembers('Super Admin')).toBe(true);
      expect(canManageMembers('Propriétaire')).toBe(true);
      expect(canManageMembers('Admin')).toBe(true);
    });

    it('est refusé à Modérateur et Utilisateur', () => {
      // Un Modérateur modère le contenu, il n'administre pas les personnes :
      // les deux responsabilités ne vont pas nécessairement ensemble.
      expect(canManageMembers('Modérateur')).toBe(false);
      expect(canManageMembers('Utilisateur')).toBe(false);
    });

    it('est refusé à un rôle inconnu', () => {
      // Un rôle non prévu ne doit jamais ouvrir un accès par défaut.
      expect(canManageMembers('RôleInventé')).toBe(false);
      expect(canManageMembers('')).toBe(false);
    });
  });

  describe('modifier les réglages', () => {
    it('suit les mêmes règles que la gestion des membres', () => {
      for (const role of ROLES) {
        expect(canManageSettings(role)).toBe(canManageMembers(role));
      }
    });
  });

  describe('gérer le contenu', () => {
    it('inclut le Modérateur, contrairement à la gestion des membres', () => {
      expect(canManageContent('Modérateur')).toBe(true);
      expect(canManageMembers('Modérateur')).toBe(false);
    });

    it('reste refusé à un Utilisateur', () => {
      expect(canManageContent('Utilisateur')).toBe(false);
    });
  });
});

describe('canAssignRole — matrice d’attribution', () => {
  it('interdit à TOUT LE MONDE d’attribuer « Super Admin »', () => {
    // C'est un rôle plateforme : l'accorder depuis une organisation donnerait
    // des droits sur l'ensemble du service.
    for (const actor of ROLES) {
      expect(canAssignRole(actor, 'Super Admin')).toBe(false);
    }
  });

  it('interdit à un Admin de nommer un Propriétaire', () => {
    // Sinon un Admin s'élèverait par personne interposée : il nommerait un
    // complice Propriétaire, qui le nommerait Admin en retour.
    expect(canAssignRole('Admin', 'Propriétaire')).toBe(false);
  });

  it('interdit à un Admin de nommer un autre Admin', () => {
    // Un Admin ne peut pas créer ses pairs : seuls Propriétaire et Super Admin.
    expect(canAssignRole('Admin', 'Admin')).toBe(false);
  });

  it('autorise un Propriétaire à nommer Propriétaire et Admin', () => {
    expect(canAssignRole('Propriétaire', 'Propriétaire')).toBe(true);
    expect(canAssignRole('Propriétaire', 'Admin')).toBe(true);
  });

  it('autorise un Propriétaire à nommer les rôles inférieurs', () => {
    expect(canAssignRole('Propriétaire', 'Modérateur')).toBe(true);
    expect(canAssignRole('Propriétaire', 'Utilisateur')).toBe(true);
  });

  it('autorise un Super Admin à nommer tout rôle d’organisation', () => {
    expect(canAssignRole('Super Admin', 'Propriétaire')).toBe(true);
    expect(canAssignRole('Super Admin', 'Admin')).toBe(true);
    expect(canAssignRole('Super Admin', 'Utilisateur')).toBe(true);
  });

  it('interdit à un Modérateur et à un Utilisateur d’attribuer quoi que ce soit', () => {
    for (const target of ['Propriétaire', 'Admin', 'Modérateur', 'Utilisateur']) {
      expect(canAssignRole('Modérateur', target)).toBe(false);
      expect(canAssignRole('Utilisateur', target)).toBe(false);
    }
  });

  it('interdit à un rôle inconnu d’attribuer quoi que ce soit', () => {
    expect(canAssignRole('RôleInventé', 'Utilisateur')).toBe(false);
  });
});

describe('barrière d’administration de l’interface', () => {
  it('reconnaît les chemins d’administration', () => {
    expect(isAdminPath('/admin')).toBe(true);
    expect(isAdminPath('/admin/users')).toBe(true);
    expect(isAdminPath('/admin/courses/git/chapters/ch1')).toBe(true);
  });

  it('ne confond pas un préfixe avec un chemin qui le commence', () => {
    // « /administration » n'est pas « /admin ».
    expect(isAdminPath('/administration')).toBe(false);
    expect(isAdminPath('/adminX')).toBe(false);
  });

  it('n’englobe pas les pages publiques', () => {
    for (const path of ['/', '/dashboard', '/courses', '/account', '/tutorial/git']) {
      expect(isAdminPath(path)).toBe(false);
    }
  });

  it('admet les quatre rôles d’administration, et eux seuls', () => {
    for (const role of ADMIN_ROLES) {
      expect(canAccessAdminUi(role)).toBe(true);
    }

    // Un Utilisateur ne doit pas atteindre l'interface d'administration.
    expect(canAccessAdminUi('Utilisateur')).toBe(false);
    expect(canAccessAdminUi('RôleInventé')).toBe(false);
    expect(canAccessAdminUi('')).toBe(false);
  });

  it('admet le Modérateur : il modère le contenu, donc il en a besoin', () => {
    expect(canAccessAdminUi('Modérateur')).toBe(true);
  });
});
