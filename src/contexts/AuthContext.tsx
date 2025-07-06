
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { format } from 'date-fns';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  plan: 'Premium' | 'Gratuit' | null;
  isPremium: boolean;
  updateUserPlan: (newPlan: 'Premium' | 'Gratuit') => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<'Premium' | 'Gratuit' | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser) {
        const userDocRef = doc(db, 'users', authUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const userPlan = userData.plan || 'Gratuit';
          setPlan(userPlan);
          setIsPremium(userPlan === 'Premium');
        } else {
          // Create a new user document in Firestore if it doesn't exist
          const newUserProfile = {
            id: authUser.uid,
            name: authUser.displayName || 'Nouvel Utilisateur',
            email: authUser.email || '',
            plan: 'Gratuit',
            status: 'Actif',
            role: 'Utilisateur',
            joined: format(new Date(), 'yyyy-MM-dd'),
            phone: authUser.phoneNumber || undefined,
          };
          await setDoc(userDocRef, newUserProfile);
          setPlan('Gratuit');
          setIsPremium(false);
        }
      } else {
        setPlan(null);
        setIsPremium(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateUserPlan = useCallback(async (newPlan: 'Premium' | 'Gratuit') => {
    if (user && db) {
      const userDocRef = doc(db, 'users', user.uid);
      try {
        await updateDoc(userDocRef, { plan: newPlan });
        setPlan(newPlan);
        setIsPremium(newPlan === 'Premium');
      } catch (error) {
        console.error("Error updating user plan in Firestore:", error);
      }
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, plan, isPremium, updateUserPlan }}>
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
