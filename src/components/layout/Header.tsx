
'use client';

import Link from 'next/link';
import { GitCommitHorizontal, Bell, User, LogOut, LogIn, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from '@/contexts/AuthContext';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { MOCK_USERS } from '@/lib/users';

export function Header() {
  const { user } = useAuth();
  const router = useRouter();
  const currentUserFromMock = user ? MOCK_USERS.find(u => u.email === user.email) : null;
  const isAdmin = currentUserFromMock?.role === 'Admin';

  const handleSignOut = async () => {
    if (auth) {
        await signOut(auth);
    }
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <GitCommitHorizontal className="h-6 w-6 text-primary" />
        <span className="text-lg">Katalyst</span>
      </Link>
      {user && (
        <nav className="mx-auto hidden flex-col gap-6 text-sm font-medium md:flex md:flex-row md:items-center">
          <Link href="/dashboard" className="text-muted-foreground transition-colors hover:text-foreground">
            Tableau de bord
          </Link>
          <Link href="/tutorial" className="text-muted-foreground transition-colors hover:text-foreground">
            Tutoriel
          </Link>
          <Link href="/certificate" className="text-muted-foreground transition-colors hover:text-foreground">
            Certification
          </Link>
        </nav>
      )}
      <div className="flex items-center gap-4 ml-auto">
        {user && (
          <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
        )}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  {user.photoURL ? (
                    <AvatarImage src={user.photoURL} alt={user.displayName || 'User Avatar'} />
                  ) : null}
                  <AvatarFallback className="bg-primary/20">
                    {user.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.displayName || user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard">Tableau de bord</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/account">Mon compte</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/certificate">Certificat</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <Shield className="mr-2 h-4 w-4" />
                    Administration
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild>
            <Link href="/login">
              Connexion
              <LogIn className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
