'use client';

import { Suspense, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { completeMfaRequest, loginRequest } from '@/lib/auth/client';
import { safeRedirectPath } from '@/lib/auth/redirect';

/**
 * Clés de traduction associées aux échecs du parcours Google.
 *
 * Le rappel OAuth redirige ici avec un code dans l'URL : sans traduction,
 * l'utilisateur ne verrait qu'une page de connexion inchangée après avoir cliqué
 * sur « Continuer avec Google », sans savoir ce qui s'est passé.
 */
const OAUTH_ERROR_KEYS: Record<string, string> = {
  google_indisponible: 'oauthGoogleUnavailable',
  google_etat_invalide: 'oauthGoogleInvalidState',
  google_refuse: 'oauthGoogleDenied',
  google_sans_code: 'oauthGoogleNoCode',
  google_jeton_invalide: 'oauthGoogleInvalidToken',
  google_erreur: 'oauthGoogleError',
  google_deja_rattache: 'oauthGoogleAlreadyLinked',
  compte_desactive: 'oauthAccountDisabled',
  google_connexion_impossible: 'oauthGoogleConnectionFailed',
};

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
  const t = useTranslations('auth');
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

  // Un échec du parcours Google revient ici sous forme de code.
  const oauthErrorKey = OAUTH_ERROR_KEYS[searchParams.get('error') ?? ''];
  const oauthError = oauthErrorKey ? t(oauthErrorKey) : null;
  const displayedError = error ?? oauthError;

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
            {t('mfaTitle')}
          </h1>
          <CardDescription>
            {t('mfaDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleMfa} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">{t('verificationCode')}</Label>
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
              {isSubmitting ? <Loader2 className="animate-spin" /> : t('validate')}
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
              {t('backToSignIn')}
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
        <h1 className="text-2xl font-semibold leading-none tracking-tight">{t('welcome')}</h1>
        <CardDescription>{t('signInToContinue')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/*
          Navigation complète (et non `fetch`) : le parcours OAuth exige une
          redirection du navigateur vers Google, qui ne peut pas se faire en
          arrière-plan. Le bouton n'est pas conditionné à la configuration : le
          serveur répond par un message clair si Google n'est pas configuré,
          plutôt que de dupliquer la configuration côté client.
        */}
        <Button variant="outline" className="w-full" asChild>
          <a href={`/api/auth/google?redirect=${encodeURIComponent(destination)}`}>
            {t('continueWithGoogle')}
          </a>
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">{t('orByEmail')}</span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isSubmitting}
            />
          </div>

          {displayedError && (
            <p role="alert" className="text-sm text-destructive">
              {displayedError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : t('signIn')}
          </Button>
        </form>

        <div className="text-center text-sm">
          <Link href="/forgot-password" className="underline">
            {t('forgotPasswordQuestion')}
          </Link>
        </div>
        <div className="text-center text-sm">
          {t('noAccount')}{' '}
          <Link href="/signup" className="underline">
            {t('signUp')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  const t = useTranslations('common');

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-4">
      {/* `useSearchParams` exige une frontière Suspense. */}
      <Suspense
        fallback={
          <div className="flex items-center text-muted-foreground">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>{t('loading')}</span>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </main>
  );
}
