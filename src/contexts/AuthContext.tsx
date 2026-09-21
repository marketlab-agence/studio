'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { fetchSession } from '@/lib/auth/client';
import { isProtectedPath } from '@/lib/auth/routes';
import { getPlansAction } from '@/actions/planActions';
import type { AuthenticatedUser } from '@/lib/providers/auth';
import type { SubscriptionPlan } from '@/types/plans.types';
import type { AppUser } from '@/lib/users';

/**
 * État d'authentification côté client (T4.9, REQ-AUTH-08).
 *
 * **Ce contexte ne contient aucun code Firebase.** Il remplace un écouteur
 * `onAuthStateChanged` dont la fuite était signalée (`AuthContext.tsx:124` :
 * la valeur de retour de `onSnapshot` n'était jamais exploitée, donc
 * `unsubscribeSnapshot()` n'était jamais appelé — un écouteur restait attaché
 * par connexion d'utilisateur).
 *
 * Le remplacement est structurellement plus simple : **un seul appel au
 * montage**, et rien à détacher. Il n'y a donc plus d'abonnement à fuir.
 *
 * Ce contexte porte l'**état**, rien d'autre. Les appels réseau vivent dans
 * `@/lib/auth/client` : mélanger les deux rendrait l'ensemble difficile à
 * raisonner et impossible à tester isolément.
 */

interface AuthContextValue {
  user: AuthenticatedUser | null;
  /** `true` tant que la session n'a pas été résolue. */
  loading: boolean;
  /** Formule de l'utilisateur, résolue depuis le catalogue. */
  userPlan: SubscriptionPlan | null;
  userRole: AppUser['role'] | null;
  /** Formule payante : détermine l'accès aux formations réservées. */
  isPremium: boolean;
  /** Identifiants de formations accessibles ; `['ALL']` si la formule ouvre tout. */
  accessibleCourses: string[] | null;
  /**
   * Changement de formule **côté client uniquement**.
   *
   * ⚠️ Aucune écriture serveur : le changement réel dépend du paiement, traité
   * en **phase 24** (Stripe). En attendant, cette fonction met à jour l'état
   * local pour que l'interface reste cohérente — elle ne doit pas être prise
   * pour une souscription effective.
   */
  updateUserPlan: ((newPlanId: SubscriptionPlan['id']) => void) | null;
  /**
   * Recharge la session depuis le serveur.
   *
   * À appeler après une connexion, une déconnexion, ou un changement de mot de
   * passe — plutôt que de reconstruire l'utilisateur côté client, ce qui
   * divergerait tôt ou tard de l'état réel en base.
   */
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Identifiant de la formule payante, telle que définie au catalogue. */
const PREMIUM_PLAN_ID = 'premium';

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  // Surcharge locale de la formule (voir `updateUserPlan`).
  const [planOverride, setPlanOverride] = useState<string | null>(null);

  const refreshSession = useCallback(async () => {
    // `fetchSession` tente un rafraîchissement si le jeton d'accès a expiré
    // (il ne vit que 15 minutes) : sans cela, l'utilisateur serait déconnecté à
    // chaque rechargement passé ce délai.
    const session = await fetchSession();
    setUser(session);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Un seul appel, au montage. Pas d'abonnement, donc pas de désabonnement à
    // oublier.
    void refreshSession();
  }, [refreshSession]);

  useEffect(() => {
    // Le catalogue des formules est global et change rarement : une seule
    // récupération suffit pour toute la durée de la session.
    getPlansAction()
      .then(setPlans)
      .catch((error) => {
        console.error('Chargement du catalogue des formules impossible :', error);
      });
  }, []);

  const planId = planOverride ?? user?.planId ?? null;

  const userPlan = useMemo(
    () => plans.find((plan) => plan.id === planId) ?? null,
    [plans, planId],
  );

  const isPremium = planId === PREMIUM_PLAN_ID;

  const accessibleCourses = useMemo(() => {
    if (!user) return null;
    // Une formule payante ouvre tout ; sinon on suit la liste portée par la
    // formule. Sans formule résolue, on n'ouvre rien plutôt que tout.
    if (isPremium) return ['ALL'];
    return userPlan?.courses ?? [];
  }, [user, isPremium, userPlan]);

  const updateUserPlan = useCallback((newPlanId: SubscriptionPlan['id']) => {
    setPlanOverride(newPlanId);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      userPlan,
      userRole: (user?.role as AppUser['role']) ?? null,
      isPremium,
      accessibleCourses,
      updateUserPlan,
      refreshSession,
    }),
    [user, loading, userPlan, isPremium, accessibleCourses, updateUserPlan, refreshSession],
  );

  // Attente de la session **uniquement sur les routes protégées**.
  //
  // Sur une page publique, attendre un aller-retour réseau pour afficher quoi
  // que ce soit dégraderait l'affichage et le référencement. Le middleware a
  // déjà écarté les visiteurs non authentifiés des routes protégées ; ici, on
  // évite seulement que ces pages clignotent vers l'état déconnecté.
  if (loading && isProtectedPath(pathname)) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
