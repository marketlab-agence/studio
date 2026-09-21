import { z } from 'zod';
import { MAX_PASSWORD_BYTES, MIN_PASSWORD_LENGTH } from '@/lib/auth/password';

/**
 * Schémas de validation des entrées d'authentification (REQ-AUTH-01).
 *
 * La validation a lieu **avant** toute requête en base : une entrée malformée ne
 * doit pas atteindre le provider, encore moins y laisser une trace.
 *
 * Les bornes de mot de passe sont importées de `password.ts` plutôt que
 * recopiées : deux sources de vérité finiraient par diverger, et c'est
 * exactement le genre d'écart qui laisse passer un mot de passe tronqué.
 */

const email = z
  .string()
  .trim()
  .min(1, 'L’adresse email est requise.')
  // Volontairement permissif : une validation d'email trop stricte rejette des
  // adresses valides. Le seul juge fiable est l'envoi effectif d'un message.
  .email('Adresse email invalide.')
  .max(254, 'Adresse email trop longue.')
  .transform((value) => value.toLowerCase());

const password = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Le mot de passe doit faire au moins ${MIN_PASSWORD_LENGTH} caractères.`)
  .refine(
    (value) => Buffer.byteLength(value, 'utf8') <= MAX_PASSWORD_BYTES,
    `Le mot de passe ne doit pas dépasser ${MAX_PASSWORD_BYTES} octets.`,
  );

const name = z
  .string()
  .trim()
  .min(2, 'Le nom doit faire au moins 2 caractères.')
  .max(120, 'Le nom est trop long.');

export const registerSchema = z.object({
  email,
  password,
  name,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Le mot de passe est requis.'),
});

export const forgotPasswordSchema = z.object({
  email,
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, 'Le jeton est requis.'),
  password,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis.'),
  newPassword: password,
});

/** Code TOTP : 6 chiffres, format produit par les applications d'authentification. */
const totpCode = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Le code doit comporter 6 chiffres.');

export const mfaCodeSchema = z.object({
  code: totpCode,
});

export const mfaChallengeSchema = z.object({
  challengeToken: z.string().trim().min(1, 'Le défi est requis.'),
  code: totpCode,
});

export const disableMfaSchema = z.object({
  password: z.string().min(1, 'Le mot de passe est requis.'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type MfaCodeInput = z.infer<typeof mfaCodeSchema>;
export type MfaChallengeInput = z.infer<typeof mfaChallengeSchema>;
export type DisableMfaInput = z.infer<typeof disableMfaSchema>;
