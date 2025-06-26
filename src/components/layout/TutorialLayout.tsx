import React from 'react';

type TutorialLayoutProps = {
  children: React.ReactNode;
};

export function TutorialLayout({ children }: TutorialLayoutProps) {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="w-80 border-r border-border p-6 hidden md:block">
        <h2 className="text-xl font-semibold mb-4">Navigation Latérale</h2>
        <p className="text-muted-foreground">Espace réservé pour le composant de navigation latérale.</p>
      </aside>
      <main className="flex-1 flex flex-col">
        <header className="border-b border-border p-6">
            <h1 className="text-3xl font-bold">En-tête de Chapitre</h1>
            <p className="text-muted-foreground mt-2">Espace réservé pour le titre du chapitre et le fil d'Ariane.</p>
        </header>
        <div className="flex-1 p-8 overflow-y-auto">
          {children}
        </div>
        <footer className="border-t border-border p-4">
            <h3 className="font-semibold">Progression</h3>
            <p className="text-muted-foreground">Espace réservé pour le composant de barre de progression.</p>
        </footer>
      </main>
    </div>
  );
}
