/**
 * Limitation de débit (REQ-AUTH-01, design.md §20).
 *
 * ⚠️ **Limite assumée** : ce compteur vit en mémoire du processus. Il protège
 * donc une instance unique — ce qui correspond au déploiement actuel
 * (`apphosting.yaml` : `maxInstances: 1`). En cas de montée à plusieurs
 * instances, il faudra un compteur partagé (base ou Redis), sinon la limite
 * effective serait multipliée par le nombre d'instances.
 *
 * Fenêtre glissante par seau : on conserve les horodatages des tentatives et on
 * oublie celles qui sortent de la fenêtre.
 */

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

/** Au-delà, on purge les seaux inactifs pour éviter une croissance sans fin. */
const MAX_BUCKETS = 10_000;

export interface RateLimitRule {
  /** Nombre maximal de tentatives dans la fenêtre. */
  limit: number;
  /** Durée de la fenêtre, en secondes. */
  windowSeconds: number;
}

/** Règles par usage : les routes sensibles sont plus strictes. */
export const RATE_LIMITS = {
  /** Connexion : cible privilégiée du bourrage d'identifiants. */
  login: { limit: 10, windowSeconds: 300 },
  /** Inscription : évite la création massive de comptes. */
  register: { limit: 5, windowSeconds: 3600 },
  /** Demande de réinitialisation : évite le harcèlement par email. */
  forgotPassword: { limit: 5, windowSeconds: 3600 },
  /** Rafraîchissement : appelé souvent, donc seuil plus large. */
  refresh: { limit: 60, windowSeconds: 300 },
  /** Réinitialisation effective. */
  resetPassword: { limit: 10, windowSeconds: 3600 },
} as const satisfies Record<string, RateLimitRule>;

/**
 * Facteur d'assouplissement des limites, **réservé aux tests et à la CI**.
 *
 * Les tests de bout en bout s'exécutent tous depuis la même adresse IP : sans
 * cet assouplissement, la limite d'inscription (5 par heure) serait atteinte par
 * les tests eux-mêmes. Les limites restent donc actives, mais plus larges.
 *
 * ⚠️ **Ignoré en production**, avec journalisation d'une erreur : désactiver
 * silencieusement la limitation de débit en production ouvrirait le bourrage
 * d'identifiants. Un facteur supérieur à 1 y est traité comme une
 * mauvaise configuration, pas comme une consigne.
 */
export function rateLimitMultiplier(): number {
  const raw = process.env.RATE_LIMIT_MULTIPLIER;
  if (!raw) return 1;

  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return 1;

  if (process.env.NODE_ENV === 'production') {
    console.error(
      `[rate-limit] RATE_LIMIT_MULTIPLIER=${raw} ignoré : cette variable ne doit pas être ` +
        'définie en production.',
    );
    return 1;
  }

  return value;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Tentatives restantes dans la fenêtre courante. */
  remaining: number;
  /** Secondes à attendre avant la prochaine tentative autorisée. */
  retryAfterSeconds: number;
}

function purgeIfNeeded(now: number): void {
  if (buckets.size <= MAX_BUCKETS) return;

  for (const [key, bucket] of buckets) {
    // Un seau dont la tentative la plus récente est ancienne ne sert plus.
    if (bucket.timestamps.length === 0 || now - bucket.timestamps[bucket.timestamps.length - 1] > 3_600_000) {
      buckets.delete(key);
    }
  }
}

/**
 * Enregistre une tentative et indique si elle est autorisée.
 *
 * Une tentative refusée n'est **pas** enregistrée : sans cela, un client qui
 * insiste repousserait indéfiniment sa propre fenêtre.
 */
export function checkRateLimit(key: string, rule: RateLimitRule): RateLimitResult {
  const now = Date.now();
  const windowMs = rule.windowSeconds * 1000;
  const limit = Math.floor(rule.limit * rateLimitMultiplier());

  purgeIfNeeded(now);

  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((timestamp) => now - timestamp < windowMs);

  if (bucket.timestamps.length >= limit) {
    buckets.set(key, bucket);
    const oldest = bucket.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - now) / 1000)),
    };
  }

  bucket.timestamps.push(now);
  buckets.set(key, bucket);

  return {
    allowed: true,
    remaining: limit - bucket.timestamps.length,
    retryAfterSeconds: 0,
  };
}

/** Réinitialise un compteur (tests, ou après une connexion réussie). */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/** Vide tous les compteurs (tests). */
export function resetAllRateLimits(): void {
  buckets.clear();
}

/**
 * Identifie le client.
 *
 * `x-forwarded-for` est renseigné par le proxy ; sa **première** valeur est
 * l'adresse d'origine. En l'absence d'en-tête (développement direct), on
 * retombe sur une clé unique : mieux vaut une limite globale qu'aucune limite.
 */
export function clientKey(request: Request, scope: string): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0]?.trim() || realIp?.trim() || 'inconnu';

  return `${scope}:${ip}`;
}
