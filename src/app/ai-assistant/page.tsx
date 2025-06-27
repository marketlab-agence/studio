
'use client';

import { AiHelper } from '@/components/interactive/AiHelper';
import { Loader2, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AiAssistantPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="flex items-center text-muted-foreground">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Chargement...</span>
        </div>
      </main>
    );
  }

  // A real implementation would also check for premium subscription status here.

  return (
    <main className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Git Assistant IA</h1>
            <p className="text-muted-foreground">Votre copilote expert pour maîtriser Git.</p>
          </div>
        </div>
        
        <AiHelper />

      </div>
    </main>
  );
}
