'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { registerRequest } from '@/lib/auth/client';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/policy';

/**
 * Inscription (REQ-AUTH-01, REQ-ORG-04).
 *
 * **Inscription libre-service** : créer un compte crée l'**organisation** de
 * l'inscrit, qui en devient Propriétaire. Il peut ensuite inviter ses formateurs
 * et apprenants (T4.13). C'est ce qui rend un institut autonome sans
 * intervention de l'éditeur.
 *
 * **Sans Firebase** : la session est établie par `POST /api/auth/register`, qui
 * pose des cookies `httpOnly`.
 */
export default function SignupPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { refreshSession } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<{ champ: string; message: string }[]>([]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIssues([]);

    // Vérifié ici pour éviter un aller-retour inutile ; le serveur revalide.
    if (password !== confirmation) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    setIsSubmitting(true);

    const result = await registerRequest({ name, email, password });

    if (!result.ok) {
      setError(result.message);
      // Le serveur détaille les champs refusés : les afficher évite à
      // l'utilisateur de deviner ce qui ne va pas.
      setIssues(result.issues ?? []);
      setIsSubmitting(false);
      return;
    }

    await refreshSession();
    router.push('/dashboard');
  }

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold leading-none tracking-tight">{t('signupTitle')}</h1>
          <CardDescription>
            {t('signupDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('displayName')}</Label>
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
              <Label htmlFor="email">{t('emailAddress')}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('password')}</Label>
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
                {t('passwordHint', { count: MIN_PASSWORD_LENGTH })}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmation">{t('confirmPassword')}</Label>
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

            <div className="flex items-start gap-2">
              <input
                id="acceptTerms"
                type="checkbox"
                required
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                disabled={isSubmitting}
                className="mt-1"
              />
              <Label htmlFor="acceptTerms" className="text-sm font-normal">
                {t('acceptTerms')}
              </Label>
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            {issues.length > 0 && (
              <ul className="text-sm text-destructive list-disc pl-5">
                {issues.map((issue) => (
                  <li key={issue.champ}>{issue.message}</li>
                ))}
              </ul>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting || !accepted}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : t('createAccount')}
            </Button>
          </form>

          <div className="text-center text-sm">
            {t('alreadyHaveAccount')}{' '}
            <Link href="/login" className="underline">
              {t('signInLink')}
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
