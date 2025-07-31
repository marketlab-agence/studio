
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import type { AppUser } from '@/lib/users';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  plan: AppUser['plan'] | null;
  userRole: AppUser['role'] | null;
  isPremium: boolean;
  updateUserPlan: ((newPlan: AppUser['plan']) => void) | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<AppUser['plan'] | null>(null);
  const [userRole, setUserRole] = useState<AppUser['role'] | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser && db) {
        const userDocRef = doc(db, 'users', authUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            const userData = userDoc.data() as AppUser;
            setPlan(userData.plan);
            setUserRole(userData.role);
            setIsPremium(userData.plan === 'Premium');
        } else {
            // Handle case where user exists in Auth but not in Firestore
            // Potentially create a new user document here.
             console.log("User document not found in Firestore for UID:", authUser.uid);
             setPlan('Gratuit');
             setUserRole('Utilisateur');
             setIsPremium(false);
        }
      } else {
        setPlan(null);
        setUserRole(null);
        setIsPremium(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateUserPlan = useCallback(async (newPlan: AppUser['plan']) => {
    if (user && db) {
        const userDocRef = doc(db, 'users', user.uid);
        try {
            await setDoc(userDocRef, { plan: newPlan }, { merge: true });
            setPlan(newPlan);
            setIsPremium(newPlan === 'Premium');
        } catch (error) {
            console.error("Failed to update user plan in Firestore:", error);
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
    <AuthContext.Provider value={{ user, loading, plan, userRole, isPremium, updateUserPlan }}>
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
