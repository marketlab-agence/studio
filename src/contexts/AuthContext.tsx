'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User, getRedirectResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    // Set up the onAuthStateChanged listener. This will be our single source of truth for the user object.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Separately, check for a redirect result when the component mounts.
    // This is a side-effect that happens after a successful OAuth login.
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          // If a result is found, it means a login was successful.
          // We can toast and redirect the user to the dashboard.
          // onAuthStateChanged will have already been triggered to set the user state.
          toast({ title: 'Connexion réussie', description: 'Bienvenue.' });
          router.push('/dashboard');
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

    return () => unsubscribe();
  }, [toast, router]); // Dependency array ensures this runs once.

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
