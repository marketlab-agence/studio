'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useRequirePremium() {
    const { loading, isPremium, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // We should wait until the auth state is fully loaded
        if (loading) {
            return;
        }
        
        // If there's a logged-in user but they are not premium, redirect them.
        if (user && !isPremium) {
            router.push('/pricing');
        }
        
        // If there's no user, other logic on the page should handle the redirect to /login.
        // This hook's only responsibility is to check for the premium plan.

    }, [loading, isPremium, user, router]);
}
