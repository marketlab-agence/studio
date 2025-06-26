import Link from 'next/link';
import { GitCommitHorizontal } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-muted/20">
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <GitCommitHorizontal className="h-6 w-6 text-primary" />
            <span>Katalyst</span>
          </Link>
          <nav className="flex flex-wrap items-center justify-center gap-4 text-sm font-medium md:gap-6">
            <Link href="/courses" className="text-muted-foreground transition-colors hover:text-foreground">
              Formations
            </Link>
            <Link href="/blog" className="text-muted-foreground transition-colors hover:text-foreground">
              Blog
            </Link>
            <Link href="/features" className="text-muted-foreground transition-colors hover:text-foreground">
              Fonctionnalités
            </Link>
            <Link href="/about" className="text-muted-foreground transition-colors hover:text-foreground">
              À Propos
            </Link>
          </nav>
        </div>
        <div className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Katalyst. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
