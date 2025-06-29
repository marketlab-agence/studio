
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function CreateCourseRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin?tab=create');
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center p-4">
      <div className="flex items-center text-muted-foreground">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <span>Redirection...</span>
      </div>
    </div>
  );
}
