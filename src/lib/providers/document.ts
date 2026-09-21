import type { OrgScope } from './types';

/**
 * Base documentaire du formateur (REQ-DOC-06, ADR 0012, design.md §23).
 *
 * Documentation attachée à une **formation, un chapitre ou une leçon**, avec
 * **héritage** : la recherche sur une leçon remonte au chapitre puis à la
 * formation, de sorte que la documentation générale n'a pas à être dupliquée
 * sur chaque leçon.
 *
 * ⚠️ Ce provider ne calcule **pas** les embeddings : il reçoit des vecteurs
 * déjà calculés. La production de vecteurs est une génération IA (famille
 * `EMBEDDING`, fournisseur d'IA) — cette séparation évite de coupler la base
 * documentaire à un modèle particulier et la rend testable sans réseau.
 */

export type DocumentScopeType = 'COURSE' | 'CHAPTER' | 'LESSON';

export type DocumentStatus = 'EN_ATTENTE' | 'INDEXE' | 'ERREUR';

/** Dimension des vecteurs stockés (`document_chunks.embedding`). */
export const EMBEDDING_DIMENSIONS = 1536;

export interface DocumentInput {
  scopeType: DocumentScopeType;
  /** Identifiant de la cible : les formations ont un slug, le reste des UUID. */
  scopeId: string;
  filename: string;
  mimeType: string;
  /** Clé de stockage du fichier d'origine (voir `StorageProvider`). */
  storageKey: string;
  /** Utilisateur ayant déposé le document. */
  uploadedBy?: string;
}

export interface DocumentChunkInput {
  content: string;
  embedding: number[];
}

export interface DocumentRecord extends DocumentInput {
  id: string;
  status: DocumentStatus;
  createdAt: Date;
  /** Nombre de segments indexés. */
  chunkCount: number;
}

/** Segment de document, tel que la recherche le retourne. */
export interface SearchHit {
  chunkId: string;
  documentId: string;
  filename: string;
  scopeType: DocumentScopeType;
  scopeId: string;
  content: string;
  /** Similarité cosinus dans [0, 1] : 1 = identique. */
  similarity: number;
}

export interface SearchOptions {
  /** Vecteur de la requête, déjà calculé. */
  embedding: number[];
  limit?: number;
  /** Restreint la recherche à une cible. */
  scopeType?: DocumentScopeType;
  scopeId?: string;
  /**
   * Remonte la hiérarchie : une recherche sur une LEÇON inclut la
   * documentation de son chapitre et de sa formation (ADR 0012).
   * Actif par défaut.
   */
  includeInherited?: boolean;
}

export interface DocumentProvider {
  /**
   * Enregistre un document et ses segments vectorisés.
   * Le statut passe à `INDEXE` dès que des segments sont fournis.
   */
  ingest(
    scope: OrgScope,
    document: DocumentInput,
    chunks: DocumentChunkInput[],
  ): Promise<DocumentRecord>;

  /** Documents d'une organisation, éventuellement filtrés par cible. */
  list(
    scope: OrgScope,
    filter?: { scopeType?: DocumentScopeType; scopeId?: string },
  ): Promise<DocumentRecord[]>;

  /** Un document, ou `null` s'il est absent ou n'appartient pas à l'organisation. */
  get(scope: OrgScope, documentId: string): Promise<DocumentRecord | null>;

  /** Supprime un document ; ses segments et vecteurs suivent en cascade. */
  delete(scope: OrgScope, documentId: string): Promise<void>;

  /** Recherche sémantique, du plus proche au plus éloigné. */
  search(scope: OrgScope, options: SearchOptions): Promise<SearchHit[]>;
}
