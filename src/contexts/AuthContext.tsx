'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, getRedirectResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        setLoading(false);
      } else {
        // If no user, we must check if a redirect just happened.
        // It's possible getRedirectResult is still processing.
        // We set loading to false only after we're sure there's no user and no redirect.
        try {
          const result = await getRedirectResult(auth);
          if (result) {
            // A sign-in just completed via redirect.
            // onAuthStateChanged will fire again with the new user object.
            // We just show the toast and wait for the next onAuthStateChanged event.
            toast({ title: 'Connexion réussie !', description: 'Bienvenue.' });
            // We DON'T setLoading(false) here, we wait for the state to update.
          } else {
            // No user and no redirect result means the user is genuinely not logged in.
            // Now it's safe to stop loading.
            setUser(null);
            setLoading(false);
          }
        } catch (error: any) {
          console.error("Erreur de connexion par redirection:", error);
          toast({
            variant: 'destructive',
            title: 'Erreur de connexion',
            description: "Une erreur s'est produite lors de la connexion. Veuillez réessayer.",
          });
          setUser(null);
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, [toast]);

  // While loading, show a full-page loader to prevent any content flash
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
