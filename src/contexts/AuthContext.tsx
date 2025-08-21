
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import type { AppUser } from '@/lib/users';
import type { SubscriptionPlan } from '@/types/plans.types';
import { getPlansAction } from '@/actions/planActions';


type AuthContextType = {
  user: User | null;
  loading: boolean;
  userPlan: SubscriptionPlan | null;
  userRole: AppUser['role'] | null;
  isPremium: boolean;
  accessibleCourses: string[] | null;
  updateUserPlan: ((newPlanId: SubscriptionPlan['id']) => void) | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const createUserDocument = async (user: User) => {
    if (!db) return null;
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        console.log(`Creating user document for UID: ${user.uid}`);
        const newUser: Omit<AppUser, 'id'> = {
            name: user.displayName || user.email || 'Nouvel Utilisateur',
            email: user.email!,
            planId: 'free',
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
  const [userPlan, setUserPlan] = useState<SubscriptionPlan | null>(null);
  const [userRole, setUserRole] = useState<AppUser['role'] | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [accessibleCourses, setAccessibleCourses] = useState<string[] | null>(null);
  const [allPlans, setAllPlans] = useState<SubscriptionPlan[]>([]);

  useEffect(() => {
    async function fetchPlans() {
        const plans = await getPlansAction();
        setAllPlans(plans);
    }
    fetchPlans();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser && db) {
        // Ensure user document exists before proceeding
        await createUserDocument(authUser);
        
        const userDocRef = doc(db, 'users', authUser.uid);
        
        const unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                const userData = doc.data() as AppUser;
                const currentPlan = allPlans.find(p => p.id === userData.planId) || null;
                
                setUserPlan(currentPlan);
                setUserRole(userData.role);
                setIsPremium(currentPlan?.id === 'premium');

                if (currentPlan?.id === 'premium') {
                    setAccessibleCourses(['ALL']);
                } else {
                    setAccessibleCourses(currentPlan?.courses || []);
                }
            } else {
                 const freePlan = allPlans.find(p => p.id === 'free') || null;
                 setUserPlan(freePlan);
                 setUserRole('Utilisateur');
                 setIsPremium(false);
                 setAccessibleCourses(freePlan?.courses || []);
            }
            // Set loading to false only after we have user data (or confirmed non-existence)
            if (allPlans.length > 0) {
              setLoading(false);
            }
        });
        
        return () => unsubscribeSnapshot();
      } else {
        // No user is logged in
        setUserPlan(null);
        setUserRole(null);
        setIsPremium(false);
        setAccessibleCourses(null);
        setLoading(false); // Set loading to false as there's no user data to wait for
      }
    });

    return () => unsubscribe();
  // We need to re-run this effect if plans are loaded after auth state is checked
  }, [allPlans]);

  const updateUserPlan = useCallback(async (newPlanId: SubscriptionPlan['id']) => {
    if (user && db) {
        const userDocRef = doc(db, 'users', user.uid);
        try {
            await setDoc(userDocRef, { planId: newPlanId }, { merge: true });
        } catch (error) {
            console.error("Failed to update user plan in Firestore:", error);
        }
    }
  }, [user]);

  // This prevents content flashing while waiting for auth state
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, userPlan, userRole, isPremium, accessibleCourses, updateUserPlan }}>
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
