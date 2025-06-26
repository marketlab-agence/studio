import Link from 'next/link';
import { GitCommitHorizontal, Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <GitCommitHorizontal className="h-6 w-6 text-primary" />
        <span className="text-lg">Git & GitHub Interactif</span>
      </Link>
      <nav className="mx-auto hidden flex-col gap-6 text-sm font-medium md:flex md:flex-row md:items-center">
        <Link href="/dashboard" className="text-muted-foreground transition-colors hover:text-foreground">
          Tableau de bord
        </Link>
        <Link href="/tutorial" className="text-muted-foreground transition-colors hover:text-foreground">
          Tutoriel
        </Link>
      </nav>
      <div className="flex items-center gap-4 ml-auto">
        <Button variant="ghost" size="icon" className="rounded-full">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/20">U</AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profil</DropdownMenuItem>
            <DropdownMenuItem>Paramètres</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Déconnexion</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
