'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MOCK_USERS } from '@/lib/users';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!loading) {
      const currentUserData = user ? MOCK_USERS.find(u => u.email === user.email) : null;
      if (!user || !currentUserData || !['Super Admin', 'Admin', 'Modérateur'].includes(currentUserData.role)) {
        router.push('/login');
      } else {
        setIsAdmin(true);
      }
    }
  }, [user, loading, router]);

  if (loading || !isAdmin) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="flex items-center text-muted-foreground">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Vérification des accès...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Zone Administrateur</AlertTitle>
                <AlertDescription>
                    Vous êtes dans la zone d'administration. Les modifications ici peuvent affecter l'ensemble de l'application.
                </AlertDescription>
            </Alert>
            {children}
        </div>
    </main>
  );
}
