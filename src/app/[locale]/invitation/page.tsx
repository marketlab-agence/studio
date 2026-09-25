'use client';

import { Suspense, useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  acceptInvitationRequest,
  fetchInvitation,
  type InvitationView,
} from '@/lib/auth/client';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/policy';

/**
 * Acceptation d'une invitation (REQ-ORG-05).
 *
 * **Publique** : l'invité n'a pas encore de compte, c'est ce qu'il vient créer.
 *
 * L'écran affiche **qui invite et pour quel rôle AVANT toute saisie**. Sans cela,
 * l'invité créerait un compte à l'aveugle, sans pouvoir distinguer une
 * invitation légitime d'un message frauduleux.
 *
 * L'adresse email n'est **pas modifiable** : elle est fixée par l'invitation.
 * La laisser éditable permettrait de créer un compte pour l'adresse d'autrui.
 */
function AcceptInvitationForm() {
  const t = useTranslations('invitation');
  const tAuth = useTranslations('auth');
  const router = useRouter();
  const token = useSearchParams().get('token');
  const { refreshSession } = useAuth();

  const [invitation, setInvitation] = useState<InvitationView | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoadError(t('missingToken'));
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    fetchInvitation(token)
      .then((result) => {
        // Le composant peut avoir été démonté entre-temps : on évite une mise à
        // jour d'état sur un composant disparu.
        if (cancelled) return;
        if (result.ok) setInvitation(result.data.invitation);
        else setLoadError(result.message);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!token) return;

    setError(null);

    if (password !== confirmation) {
      setError(tAuth('passwordsDoNotMatch'));
      return;
    }

    setIsSubmitting(true);

    const result = await acceptInvitationRequest(token, { name, password });

    if (!result.ok) {
      setError(result.message);
      setIsSubmitting(false);
      return;
    }

    // L'état vient du serveur : la session a été ouverte par la route.
    await refreshSession();
    router.push('/dashboard');
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          <span>{t('loading')}</span>
        </CardContent>
      </Card>
    );
  }

  if (loadError || !invitation) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold leading-none tracking-tight">
            {t('invalidTitle')}
          </h1>
          <CardDescription>{loadError ?? t('unusable')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('invalidDescription')}
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">{t('goToLogin')}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold leading-none tracking-tight">
          {t('joinTitle', { organization: invitation.organizationName })}
        </h1>
        <CardDescription>
          {t.rich('invitedWithRole', {
            role: invitation.role,
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{tAuth('emailAddress')}</Label>
            <Input
              id="email"
              type="email"
              value={invitation.email}
              // Fixée par l'invitation : la rendre modifiable permettrait de
              // créer un compte pour l'adresse d'autrui.
              readOnly
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">{tAuth('displayName')}</Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              required
              minLength={2}
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{tAuth('password')}</Label>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              {tAuth('passwordHint', { count: MIN_PASSWORD_LENGTH })}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmation">{tAuth('confirmPassword')}</Label>
            <PasswordInput
              id="confirmation"
              
              autoComplete="new-password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : t('createAndJoin')}
          </Button>
        </form>

        <div className="text-center text-sm">
          <Link href="/login" className="underline">
            {t('alreadyHaveAccount')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InvitationPage() {
  const tCommon = useTranslations('common');
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="flex items-center text-muted-foreground">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>{tCommon('loading')}</span>
          </div>
        }
      >
        <AcceptInvitationForm />
      </Suspense>
    </main>
  );
}
