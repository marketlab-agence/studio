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

    // Handle the redirect result from an OAuth provider
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          // User has just signed in via redirect.
          // The onAuthStateChanged observer will handle the user state update.
          toast({ title: 'Connexion réussie !', description: 'Bienvenue.' });
        }
      })
      .catch((error) => {
        console.error("Erreur de connexion par redirection:", error);
        toast({
          variant: 'destructive',
          title: 'Erreur de connexion',
          description: "Une erreur s'est produite lors de la connexion. Veuillez réessayer.",
        });
      });

    // The onAuthStateChanged listener is the single source of truth for auth state.
    // It fires after getRedirectResult is complete, or on any other auth state change.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false); // We are now certain of the auth state.
    });

    return () => unsubscribe();
  }, [toast]);

  const value = { user, loading };

  // While loading, show a full-page loader to prevent any content flash
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
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
