'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
// Constantes importées d'un module SANS dépendance : `password.ts` embarquerait
// bcryptjs dans le bundle navigateur.
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/policy';

/**
 * Définition d'un nouveau mot de passe à partir du lien reçu par email
 * (REQ-AUTH-06).
 *
 * Le jeton est lu dans l'URL, jamais saisi. Aucune session n'est ouverte après
 * l'opération : l'utilisateur se connecte ensuite avec son nouveau mot de
 * passe — un lien d'email ne doit pas valoir authentification.
 */
function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get('token');

  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold leading-none tracking-tight">Lien incomplet</h1>
          <CardDescription>
            Ce lien ne contient pas de jeton de réinitialisation. Demandez-en un nouveau.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/forgot-password">Demander un nouveau lien</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    // Vérifié ici pour éviter un aller-retour inutile ; le serveur revalide.
    if (password !== confirmation) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload.message ?? 'La réinitialisation n’a pas pu aboutir.');
        return;
      }

      setMessage(payload.message);
      // Redirection différée : l'utilisateur doit pouvoir lire la confirmation.
      setTimeout(() => router.push('/login'), 2500);
    } catch {
      setError('Impossible de joindre le serveur. Vérifiez votre connexion.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold leading-none tracking-tight">Nouveau mot de passe</h1>
        <CardDescription>
          Choisissez un mot de passe d’au moins {MIN_PASSWORD_LENGTH} caractères.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message ? (
          <p role="status" className="text-sm text-muted-foreground">
            {message} Vous allez être redirigé vers la page de connexion.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe</Label>
              <PasswordInput
                id="password"
                
                autoComplete="new-password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmation">Confirmer le mot de passe</Label>
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
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Définir le mot de passe'}
            </Button>
          </form>
        )}

        <div className="text-center text-sm">
          <Link href="/login" className="underline">
            Retour à la connexion
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4">
      {/* `useSearchParams` exige une frontière Suspense : sans elle, Next refuse
          de rendre la page statiquement. */}
      <Suspense
        fallback={
          <div className="flex items-center text-muted-foreground">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Chargement…</span>
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}
