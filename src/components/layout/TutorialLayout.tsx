import React from 'react';

type TutorialLayoutProps = {
  children: React.ReactNode;
};

export function TutorialLayout({ children }: TutorialLayoutProps) {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="w-80 border-r border-border p-6 hidden md:block">
        <h2 className="text-xl font-semibold mb-4">Sidebar Navigation</h2>
        <p className="text-muted-foreground">Placeholder for the sidebar navigation component.</p>
      </aside>
      <main className="flex-1 flex flex-col">
        <header className="border-b border-border p-6">
            <h1 className="text-3xl font-bold">Chapter Header</h1>
            <p className="text-muted-foreground mt-2">Placeholder for chapter title and breadcrumbs.</p>
        </header>
        <div className="flex-1 p-8 overflow-y-auto">
          {children}
        </div>
        <footer className="border-t border-border p-4">
            <h3 className="font-semibold">Progress</h3>
            <p className="text-muted-foreground">Placeholder for the progress bar component.</p>
        </footer>
      </main>
    </div>
  );
}
