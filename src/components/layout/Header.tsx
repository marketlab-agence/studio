'use client';

import { Link } from '@/i18n/navigation';
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
import { logoutRequest } from '@/lib/auth/client';
import { useRouter } from 'next/navigation';
import { Badge } from '../ui/badge';
import { useTranslations } from 'next-intl';

/**
 * ⚠️ **`Link` vient de `@/i18n/navigation`, jamais de `next/link`.**
 * Un lien brut vers `/dashboard` sortirait l'utilisateur de sa langue : avec
 * `localePrefix: 'always'`, il faut `/en/dashboard` pour un anglophone. Le `Link`
 * localisé ajoute le préfixe automatiquement — c'est la seule façon d'être sûr
 * qu'aucun lien n'oublie sa locale.
 */
export function Header() {
  const { user, isPremium, userRole, refreshSession } = useAuth();
  const router = useRouter();
  const t = useTranslations('nav');
  const isAdmin = userRole === 'Admin' || userRole === 'Super Admin';

  const handleSignOut = async () => {
    // Le serveur révoque le refresh token en base, puis efface les cookies.
    // L'état local est ensuite rechargé depuis le serveur plutôt que forcé à
    // `null` : c'est la source de vérité qui décide, pas le client.
    await logoutRequest();
    await refreshSession();
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
            {t('dashboard')}
          </Link>
          <Link href="/courses" className="text-muted-foreground transition-colors hover:text-foreground">
            {t('courses')}
          </Link>
          {isPremium && (
            <>
                <Link href="/certificate" className="text-muted-foreground transition-colors hover:text-foreground">
                    {t('certification')}
                </Link>
                <Link href="/ai-assistant" className="text-muted-foreground transition-colors hover:text-foreground flex items-center gap-2">
                    {t('aiAssistant')}
                    <Badge variant="secondary" className="border-yellow-400/50 text-yellow-300 py-0">{t('premium')}</Badge>
                </Link>
            </>
          )}
        </nav>
      )}
      <div className="flex items-center gap-4 ml-auto">
        {user && (
          <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5" />
            <span className="sr-only">{t('notifications')}</span>
          </Button>
        )}
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  {user.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} alt={user.name || t('userAvatar')} />
                  ) : null}
                  <AvatarFallback className="bg-primary/20">
                    {user.name ? user.name.charAt(0).toUpperCase() : <User className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">{t('userMenu')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{user.name || user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard">{t('dashboard')}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/account">{t('account')}</Link>
              </DropdownMenuItem>
              {isPremium && (
                <DropdownMenuItem asChild>
                    <Link href="/certificate">{t('certificate')}</Link>
                </DropdownMenuItem>
              )}
               <DropdownMenuItem asChild>
                <Link href="/pricing">{t('subscription')}</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/admin">
                    <Shield className="mr-2 h-4 w-4" />
                    {t('admin')}
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                {t('logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
           <div className="hidden sm:flex items-center gap-2">
            <Button variant="ghost" asChild><Link href="/blog">{t('blog')}</Link></Button>
            <Button variant="ghost" asChild><Link href="/pricing">{t('pricing')}</Link></Button>
            <Button asChild>
                <Link href="/login">
                {t('login')}
                <LogIn className="ml-2 h-4 w-4" />
                </Link>
            </Button>
           </div>
        )}
      </div>
    </header>
  );
}
