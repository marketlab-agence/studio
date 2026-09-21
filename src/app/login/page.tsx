'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { completeMfaRequest, loginRequest } from '@/lib/auth/client';
import { safeRedirectPath } from '@/lib/auth/redirect';

/**
 * Connexion (REQ-AUTH-01, REQ-AUTH-04, REQ-AUTH-06).
 *
 * **Sans Firebase** : la session est établie par `POST /api/auth/login`, qui pose
 * des cookies `httpOnly`. Aucun jeton ne transite par le JavaScript de la page.
 *
 * Trois issues possibles :
 *
 * 1. **session ouverte** → redirection ;
 * 2. **second facteur exigé** → un second formulaire demande le code TOTP ;
 * 3. **changement de mot de passe imposé** (`mustResetPassword`) → les comptes
 *    repris de Firebase n'ont pas de mot de passe utilisable.
 */
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSession } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Le paramètre vient de l'URL, donc d'une source non fiable : il est filtré
  // (voir safeRedirectPath) pour éviter une redirection vers un site tiers après
  // une connexion bien réelle.
  const destination = safeRedirectPath(searchParams.get('redirect'));

  async function finish() {
    await refreshSession();
    router.push(destination);
  }

  async function handleLogin(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const result = await loginRequest(email, password);

    if (!result.ok) {
      setError(result.message);
      setIsSubmitting(false);
      return;
    }

    if ('mfaRequired' in result.data) {
      // Le mot de passe est validé, mais aucune session n'est ouverte : le
      // second facteur reste à fournir.
      setChallengeToken(result.data.challengeToken);
      setIsSubmitting(false);
      return;
    }

    if (result.data.redirectTo) {
      router.push(result.data.redirectTo);
      return;
    }

    await finish();
  }

  async function handleMfa(event: React.FormEvent) {
    event.preventDefault();
    if (!challengeToken) return;

    setIsSubmitting(true);
    setError(null);

    const result = await completeMfaRequest(challengeToken, code);

    if (!result.ok) {
      setError(result.message);
      setIsSubmitting(false);
      return;
    }

    await finish();
  }

  // --- Second facteur -------------------------------------------------------
  if (challengeToken) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold leading-none tracking-tight">
            Vérification en deux étapes
          </h1>
          <CardDescription>
            Saisissez le code à 6 chiffres affiché par votre application d’authentification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleMfa} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Code de vérification</Label>
              <Input
                id="code"
                // `one-time-code` permet le remplissage automatique par le
                // système, et `inputMode` affiche le clavier numérique.
                autoComplete="one-time-code"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                autoFocus
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting || code.length !== 6}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'Valider'}
            </Button>
          </form>

          <div className="text-center text-sm">
            <button
              type="button"
              className="underline"
              onClick={() => {
                setChallengeToken(null);
                setCode('');
                setError(null);
              }}
            >
              Revenir à la connexion
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- Connexion ------------------------------------------------------------
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold leading-none tracking-tight">Bienvenue</h1>
        <CardDescription>Connectez-vous pour continuer.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
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
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Se connecter'}
          </Button>
        </form>

        <div className="text-center text-sm">
          <Link href="/forgot-password" className="underline">
            Mot de passe oublié ?
          </Link>
        </div>
        <div className="text-center text-sm">
          Vous n’avez pas de compte ?{' '}
          <Link href="/signup" className="underline">
            Inscrivez-vous
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4">
      {/* `useSearchParams` exige une frontière Suspense. */}
      <Suspense
        fallback={
          <div className="flex items-center text-muted-foreground">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Chargement…</span>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
