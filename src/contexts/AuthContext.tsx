
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { MOCK_USERS } from '@/lib/users';

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
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      if (authUser) {
        // Check localStorage first for persisted plan changes
        const storedPlan = localStorage.getItem(`user_plan_${authUser.uid}`);
        if (storedPlan === 'Premium' || storedPlan === 'Gratuit') {
          setPlan(storedPlan);
          setIsPremium(storedPlan === 'Premium');
        } else {
          // Fallback to mock data for initial load
          const mockUser = MOCK_USERS.find(u => u.email === authUser.email);
          const userPlan = mockUser?.plan || 'Gratuit';
          setPlan(userPlan);
          setIsPremium(userPlan === 'Premium');
          // Persist the initial plan
          localStorage.setItem(`user_plan_${authUser.uid}`, userPlan);
        }
      } else {
        setPlan(null);
        setIsPremium(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateUserPlan = useCallback((newPlan: 'Premium' | 'Gratuit') => {
    if (user) {
        setPlan(newPlan);
        setIsPremium(newPlan === 'Premium');
        localStorage.setItem(`user_plan_${user.uid}`, newPlan);
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
