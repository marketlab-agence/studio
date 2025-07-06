
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// This page was a duplicate of the certificate page and caused routing confusion.
// It now redirects to the main courses page to provide a cleaner navigation flow.
export default function TutorialRootRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/courses');
  }, [router]);

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="flex items-center text-muted-foreground">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <span>Redirection vers les formations...</span>
      </div>
    </main>
  );
}
