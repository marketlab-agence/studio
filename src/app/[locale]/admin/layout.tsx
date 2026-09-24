'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { canAccessAdminUi } from '@/lib/auth/routes';
import { useTranslations } from 'next-intl';

/**
 * Enveloppe de la zone d'administration.
 *
 * ⚠️ **La liste des rôles vient de `@/lib/auth/routes`**, et n'est plus codée en
 * dur ici. Elle y était — `['Super Admin', 'Admin', 'Modérateur']` — et **omettait
 * « Propriétaire »** : le propriétaire d'une organisation, celui qui l'a créée,
 * était enfermé hors de son propre espace d'administration. Le middleware le
 * laissait passer, ce layout bloquait le rendu, et la page restait vide sans
 * aucune erreur.
 *
 * Cette vérification reste **côté client**, donc cosmétique : elle évite
 * d'afficher une coquille vide. Le contrôle qui fait foi est côté serveur
 * (`@/lib/auth/server`), dans chaque server action.
 *
 * Le rendu n'attend plus `isAdmin` : la redirection suffit, et attendre un état
 * dérivé faisait clignoter un écran de chargement sur une page déjà autorisée.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, userRole } = useAuth();
  const router = useRouter();
  const t = useTranslations('admin');

  const allowed = canAccessAdminUi(userRole ?? '');

  useEffect(() => {
    if (loading) return;

    if (!user || !allowed) {
      // Vers /login (et non /dashboard) : le middleware y renvoie déjà les
      // visiteurs sans session, et une page privée inconnue se traite de même.
      router.push('/login');
    }
  }, [user, loading, allowed, router]);

  // Tant que la session n'est pas résolue, on n'affiche pas la zone
  // d'administration : elle clignoterait vers un contenu non autorisé.
  if (loading) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="flex items-center text-muted-foreground">
          <span>{t('layout.checkingAccess')}</span>
        </div>
      </main>
    );
  }

  // Refus : la redirection est en cours. On n'affiche pas le contenu entre-temps.
  if (!user || !allowed) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('layout.accessDeniedTitle')}</AlertTitle>
          <AlertDescription>
            {t('layout.accessDeniedDescription')}
          </AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('layout.zoneTitle')}</AlertTitle>
                <AlertDescription>
                    {t('layout.zoneDescription')}
                </AlertDescription>
            </Alert>
            {children}
        </div>
    </main>
  );
}
