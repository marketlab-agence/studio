
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { MOCK_USERS } from '@/lib/users';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  plan: 'Premium' | 'Gratuit' | null;
  isPremium: boolean;
  updateUserPlan: ((newPlan: 'Premium' | 'Gratuit') => void) | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<'Premium' | 'Gratuit' | null>(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser) {
        // Use local mock data instead of Firestore
        const mockUser = MOCK_USERS.find(u => u.email === authUser.email);
        const userPlan = mockUser ? mockUser.plan : 'Gratuit';
        setPlan(userPlan);
        setIsPremium(userPlan === 'Premium');
      } else {
        setPlan(null);
        setIsPremium(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateUserPlan = useCallback((newPlan: 'Premium' | 'Gratuit') => {
    // This is a mock update for the local session.
    // In a real app, this would write to the database.
    if (user) {
        setPlan(newPlan);
        setIsPremium(newPlan === 'Premium');
        // This part is for mock purposes only and should be replaced with a DB write.
        const mockUser = MOCK_USERS.find(u => u.email === user.email);
        if (mockUser) {
            mockUser.plan = newPlan;
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
