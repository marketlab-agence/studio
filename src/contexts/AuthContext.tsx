
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
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

// Helper function to create a user document if it doesn't exist
const createUserDocument = async (user: User) => {
    if (!db) return null;
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        console.log(`Creating user document for UID: ${user.uid}`);
        const newUser: Omit<AppUser, 'id'> = {
            name: user.displayName || user.email || 'Nouvel Utilisateur',
            email: user.email!,
            plan: 'Gratuit',
            status: 'Actif',
            role: 'Utilisateur',
            joined: new Date().toISOString().split('T')[0],
            phone: user.phoneNumber || '',
        };
        try {
            await setDoc(userDocRef, newUser);
            return newUser;
        } catch (error) {
            console.error("Error creating user document:", error);
            return null;
        }
    }
    return userDoc.data() as AppUser;
};


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
        // Ensure user document exists before setting up a listener
        await createUserDocument(authUser);
        
        const userDocRef = doc(db, 'users', authUser.uid);
        
        // Use onSnapshot for real-time updates to user data (like plan changes)
        const unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                const userData = doc.data() as AppUser;
                setPlan(userData.plan);
                setUserRole(userData.role);
                setIsPremium(userData.plan === 'Premium');
            } else {
                 // This case should be rare now, but as a fallback:
                 setPlan('Gratuit');
                 setUserRole('Utilisateur');
                 setIsPremium(false);
            }
        });
        
        // This will be called when the auth state changes (e.g., user logs out)
        return () => unsubscribeSnapshot();
        
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
            // State will be updated by the onSnapshot listener, so no need to call setPlan here.
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
