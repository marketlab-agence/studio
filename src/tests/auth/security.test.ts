/**
 * @jest-environment node
 *
 * Redirection ouverte (T4.6) et limitation de débit (T4.7) : modules serveur,
 * donc environnement Node.
 */
import { DEFAULT_REDIRECT, safeRedirectPath } from '@/lib/auth/redirect';
import {
  checkRateLimit,
  clientKey,
  RATE_LIMITS,
  rateLimitMultiplier,
  resetAllRateLimits,
  resetRateLimit,
} from '@/lib/rate-limit';

describe('safeRedirectPath — garde-fou contre la redirection ouverte', () => {
  it('accepte un chemin interne', () => {
    expect(safeRedirectPath('/admin/courses')).toBe('/admin/courses');
    expect(safeRedirectPath('/dashboard')).toBe('/dashboard');
    expect(safeRedirectPath('/tutorial/git?chapter=1')).toBe('/tutorial/git?chapter=1');
  });

  it('refuse une URL absolue', () => {
    // Le cas qui rend l'attaque crédible : l'utilisateur vient de saisir ses
    // identifiants sur le bon domaine, puis se retrouve ailleurs.
    expect(safeRedirectPath('https://exemple-malveillant.test')).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath('http://exemple-malveillant.test')).toBe(DEFAULT_REDIRECT);
  });

  it('refuse une URL relative au protocole', () => {
    // « //exemple.test » est interprété par les navigateurs comme une URL
    // absolue : c'est le contournement le plus courant d'un test naïf.
    expect(safeRedirectPath('//exemple-malveillant.test')).toBe(DEFAULT_REDIRECT);
  });

  it('refuse un antislash, normalisé en séparateur par certains navigateurs', () => {
    expect(safeRedirectPath('/\\exemple-malveillant.test')).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath('\\\\exemple.test')).toBe(DEFAULT_REDIRECT);
  });

  it('refuse les caractères de contrôle', () => {
    expect(safeRedirectPath('/dashboard\r\nSet-Cookie: x=y')).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath('/dash\u0000board')).toBe(DEFAULT_REDIRECT);
  });

  it('refuse un chemin relatif sans « / » initial', () => {
    expect(safeRedirectPath('admin/courses')).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath('javascript:alert(1)')).toBe(DEFAULT_REDIRECT);
  });

  it('retourne le repli pour une valeur absente ou vide', () => {
    expect(safeRedirectPath(null)).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath(undefined)).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath('')).toBe(DEFAULT_REDIRECT);
    expect(safeRedirectPath('   ')).toBe(DEFAULT_REDIRECT);
  });

  it('accepte un repli personnalisé', () => {
    expect(safeRedirectPath(null, '/login')).toBe('/login');
    expect(safeRedirectPath('https://ailleurs.test', '/login')).toBe('/login');
  });

  it('tolère les espaces autour d’un chemin valide', () => {
    expect(safeRedirectPath('  /dashboard  ')).toBe('/dashboard');
  });
});

describe('limitation de débit', () => {
  beforeEach(() => {
    resetAllRateLimits();
  });

  const rule = { limit: 3, windowSeconds: 60 };

  it('autorise les tentatives sous la limite', () => {
    expect(checkRateLimit('a', rule).allowed).toBe(true);
    expect(checkRateLimit('a', rule).allowed).toBe(true);

    const third = checkRateLimit('a', rule);
    expect(third.allowed).toBe(true);
    expect(third.remaining).toBe(0);
  });

  it('refuse au-delà de la limite et annonce le délai d’attente', () => {
    for (let i = 0; i < 3; i++) checkRateLimit('b', rule);

    const refused = checkRateLimit('b', rule);
    expect(refused.allowed).toBe(false);
    expect(refused.remaining).toBe(0);
    expect(refused.retryAfterSeconds).toBeGreaterThan(0);
    expect(refused.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it('isole les compteurs par clé', () => {
    for (let i = 0; i < 3; i++) checkRateLimit('client-1', rule);

    // Un autre client ne doit pas être pénalisé par le premier.
    expect(checkRateLimit('client-2', rule).allowed).toBe(true);
  });

  it('ne prolonge pas la fenêtre quand le client insiste', () => {
    for (let i = 0; i < 3; i++) checkRateLimit('c', rule);
    const first = checkRateLimit('c', rule);

    // Insister ne doit pas repousser indéfiniment l'échéance : sans cette
    // précaution, un client bloqué le resterait pour toujours.
    for (let i = 0; i < 20; i++) checkRateLimit('c', rule);
    const later = checkRateLimit('c', rule);

    expect(later.retryAfterSeconds).toBeLessThanOrEqual(first.retryAfterSeconds);
  });

  it('oublie les tentatives sorties de la fenêtre', () => {
    jest.useFakeTimers();
    try {
      for (let i = 0; i < 3; i++) checkRateLimit('d', rule);
      expect(checkRateLimit('d', rule).allowed).toBe(false);

      // Après la fenêtre, le compteur repart à zéro.
      jest.advanceTimersByTime(61_000);
      expect(checkRateLimit('d', rule).allowed).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });

  it('permet de réinitialiser un compteur', () => {
    for (let i = 0; i < 3; i++) checkRateLimit('e', rule);
    expect(checkRateLimit('e', rule).allowed).toBe(false);

    resetRateLimit('e');
    expect(checkRateLimit('e', rule).allowed).toBe(true);
  });

  it('définit des règles distinctes, plus strictes pour la connexion', () => {
    // Le bourrage d'identifiants vise la connexion : sa limite doit être plus
    // serrée que celle du rafraîchissement, appelé légitimement et souvent.
    expect(RATE_LIMITS.login.limit).toBeLessThan(RATE_LIMITS.refresh.limit);
    expect(RATE_LIMITS.register.limit).toBeLessThanOrEqual(RATE_LIMITS.login.limit);
  });

  describe('facteur d’assouplissement (tests et CI)', () => {
    const original = { multiplier: process.env.RATE_LIMIT_MULTIPLIER, nodeEnv: process.env.NODE_ENV };

    /** `process.env.NODE_ENV` est déclaré en lecture seule par les types de Next. */
    function setNodeEnv(value: string): void {
      (process.env as Record<string, string>).NODE_ENV = value;
    }

    afterEach(() => {
      if (original.multiplier === undefined) delete process.env.RATE_LIMIT_MULTIPLIER;
      else process.env.RATE_LIMIT_MULTIPLIER = original.multiplier;
      setNodeEnv(original.nodeEnv);
      resetAllRateLimits();
    });

    it('vaut 1 par défaut', () => {
      delete process.env.RATE_LIMIT_MULTIPLIER;
      expect(rateLimitMultiplier()).toBe(1);
    });

    it('élargit la limite hors production', () => {
      setNodeEnv('test');
      process.env.RATE_LIMIT_MULTIPLIER = '10';

      expect(rateLimitMultiplier()).toBe(10);

      // La limite effective suit le facteur.
      const rule = { limit: 2, windowSeconds: 60 };
      expect(checkRateLimit('x', rule).allowed).toBe(true);
      expect(checkRateLimit('x', rule).allowed).toBe(true);
      expect(checkRateLimit('x', rule).allowed).toBe(true); // au-delà de 2
    });

    it('est IGNORÉ en production', () => {
      // Désactiver silencieusement la limitation de débit en production
      // ouvrirait le bourrage d'identifiants : le facteur ne doit pas s'y
      // appliquer, même s'il est défini.
      setNodeEnv('production');
      process.env.RATE_LIMIT_MULTIPLIER = '1000';

      expect(rateLimitMultiplier()).toBe(1);
    });

    it('ignore une valeur absurde', () => {
      setNodeEnv('test');

      for (const value of ['0', '-5', 'beaucoup', '']) {
        process.env.RATE_LIMIT_MULTIPLIER = value;
        expect(rateLimitMultiplier()).toBe(1);
      }
    });
  });

  describe('clientKey', () => {
    function requestWith(headers: Record<string, string>): Request {
      return new Request('http://localhost/api/auth/login', { headers });
    }

    it('retient la première adresse de x-forwarded-for', () => {
      // La chaîne peut contenir plusieurs proxys : la première entrée est
      // l'adresse d'origine.
      const request = requestWith({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1, 10.0.0.2' });
      expect(clientKey(request, 'login')).toBe('login:203.0.113.7');
    });

    it('retombe sur x-real-ip', () => {
      const request = requestWith({ 'x-real-ip': '198.51.100.4' });
      expect(clientKey(request, 'login')).toBe('login:198.51.100.4');
    });

    it('utilise une clé de repli en l’absence d’en-tête', () => {
      // Mieux vaut une limite globale qu'aucune limite.
      expect(clientKey(requestWith({}), 'login')).toBe('login:inconnu');
    });

    it('sépare les compteurs par usage', () => {
      const request = requestWith({ 'x-real-ip': '198.51.100.4' });
      expect(clientKey(request, 'login')).not.toBe(clientKey(request, 'register'));
    });
  });
});
