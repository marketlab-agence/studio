import type { OrgScope } from './types';

/**
 * Crédits IA (REQ-AIC-03, ADR 0007).
 *
 * Le solde appartient à l'**organisation**, pas à l'utilisateur : le
 * propriétaire achète, les formateurs consomment. Le coût doit être affiché
 * avant génération et **débité atomiquement** avec la journalisation.
 */

/** Familles de génération du studio (design.md §14). */
export type AiFamily = 'TTT' | 'TTI' | 'TTS' | 'STT' | 'TTV' | 'EMBEDDING';

export interface AiGenerationRequest {
  family: AiFamily;
  /** Coût en crédits. Doit être un entier positif. */
  cost: number;
  /** Paramètres du prompt, déjà construit selon la méthode ACTIF. */
  prompt: Record<string, unknown>;
  /** Référence du résultat (clé de stockage, identifiant…). */
  resultRef?: string;
  /** Documents ayant servi de source (traçabilité, REQ-DOC-08). */
  sourceDocumentIds?: string[];
}

export interface AiGenerationRecord extends AiGenerationRequest {
  id: string;
  /** Utilisateur à l'origine de la génération. */
  userId: string;
  createdAt: Date;
}

/** Levée quand le solde ne couvre pas le coût demandé. */
export class InsufficientCreditsError extends Error {
  constructor(
    readonly available: number,
    readonly requested: number,
  ) {
    super(
      `Crédits IA insuffisants : ${available} disponible(s), ${requested} demandé(s). ` +
        'Recharger le solde de l’organisation avant de relancer la génération.',
    );
    this.name = 'InsufficientCreditsError';
  }
}

export interface AiCreditProvider {
  /** Solde de l'organisation (0 si aucun crédit n'a encore été acheté). */
  balance(scope: OrgScope): Promise<number>;

  /**
   * Débite le coût **et** journalise la génération, dans une seule transaction.
   *
   * Lève `InsufficientCreditsError` si le solde est insuffisant : ni débit
   * partiel, ni génération journalisée. Aucun solde ne peut devenir négatif.
   */
  debit(scope: OrgScope, request: AiGenerationRequest): Promise<AiGenerationRecord>;

  /** Ajoute des crédits (achat) et retourne le nouveau solde. */
  recharge(scope: OrgScope, credits: number): Promise<number>;

  /** Historique des générations, de la plus récente à la plus ancienne. */
  history(scope: OrgScope, limit?: number): Promise<AiGenerationRecord[]>;
}
