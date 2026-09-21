import { query, withTransaction } from '@/lib/db/pool';
import {
  EMBEDDING_DIMENSIONS,
  type DocumentChunkInput,
  type DocumentInput,
  type DocumentProvider,
  type DocumentRecord,
  type DocumentScopeType,
  type SearchHit,
  type SearchOptions,
} from '../document';
import { assertScope, type OrgScope } from '../types';

type DocumentRow = {
  id: string;
  scope_type: DocumentScopeType;
  scope_id: string;
  filename: string;
  mime_type: string;
  storage_key: string;
  status: DocumentRecord['status'];
  uploaded_by: string | null;
  created_at: Date;
  chunk_count: string;
};

type HitRow = {
  chunk_id: string;
  document_id: string;
  filename: string;
  scope_type: DocumentScopeType;
  scope_id: string;
  content: string;
  similarity: number;
};

function toRecord(row: DocumentRow): DocumentRecord {
  return {
    id: row.id,
    scopeType: row.scope_type,
    scopeId: row.scope_id,
    filename: row.filename,
    mimeType: row.mime_type,
    storageKey: row.storage_key,
    status: row.status,
    uploadedBy: row.uploaded_by ?? undefined,
    createdAt: row.created_at,
    chunkCount: Number(row.chunk_count),
  };
}

const DOCUMENT_COLUMNS = `
  d.id, d.scope_type, d.scope_id, d.filename, d.mime_type, d.storage_key,
  d.status, d.uploaded_by, d.created_at,
  (SELECT COUNT(*) FROM document_chunks c WHERE c.document_id = d.id)::text AS chunk_count
`;

/**
 * Base documentaire en PostgreSQL avec recherche vectorielle (pgvector).
 *
 * RÈGLE D'ISOLATION : `organization_id` filtre chaque requête. La recherche
 * passe par une jointure sur `documents`, seul porteur de l'organisation.
 */
export class PostgresDocumentProvider implements DocumentProvider {
  /** Vérifie la dimension des vecteurs avant d'atteindre la base. */
  private static assertEmbedding(embedding: number[], context: string): string {
    if (!Array.isArray(embedding) || embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `Vecteur invalide (${context}) : ${embedding?.length ?? 0} dimension(s), ` +
          `${EMBEDDING_DIMENSIONS} attendues.`,
      );
    }
    return `[${embedding.join(',')}]`;
  }

  /**
   * Cibles effectives d'une recherche : la cible demandée, plus ses parents
   * lorsque l'héritage est actif (leçon → chapitre → formation).
   */
  private async resolveTargets(
    scope: OrgScope,
    options: SearchOptions,
  ): Promise<{ scopeType: DocumentScopeType; scopeId: string }[]> {
    if (!options.scopeType || !options.scopeId) return [];

    const direct = { scopeType: options.scopeType, scopeId: options.scopeId };
    if (options.includeInherited === false) return [direct];

    const { organizationId } = assertScope(scope);

    if (options.scopeType === 'LESSON') {
      const { rows } = await query<{ chapter_id: string; course_id: string }>(
        `SELECT l.chapter_id, ch.course_id
         FROM lessons l
         JOIN chapters ch ON ch.id = l.chapter_id
         JOIN courses co ON co.id = ch.course_id
         WHERE co.organization_id = $1 AND l.id = $2`,
        [organizationId, options.scopeId],
      );
      if (rows[0]) {
        return [
          direct,
          { scopeType: 'CHAPTER', scopeId: rows[0].chapter_id },
          { scopeType: 'COURSE', scopeId: rows[0].course_id },
        ];
      }
      return [direct];
    }

    if (options.scopeType === 'CHAPTER') {
      const { rows } = await query<{ course_id: string }>(
        `SELECT ch.course_id
         FROM chapters ch
         JOIN courses co ON co.id = ch.course_id
         WHERE co.organization_id = $1 AND ch.id = $2`,
        [organizationId, options.scopeId],
      );
      if (rows[0]) {
        return [direct, { scopeType: 'COURSE', scopeId: rows[0].course_id }];
      }
    }

    return [direct];
  }

  async ingest(
    scope: OrgScope,
    document: DocumentInput,
    chunks: DocumentChunkInput[],
  ): Promise<DocumentRecord> {
    const { organizationId } = assertScope(scope);

    const vectors = chunks.map((chunk) =>
      PostgresDocumentProvider.assertEmbedding(chunk.embedding, document.filename),
    );

    const id = await withTransaction(async (client) => {
      // Le document et ses segments sont écrits ensemble : un document sans ses
      // vecteurs serait inutilisable en recherche, donc incohérent.
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO documents (
           organization_id, scope_type, scope_id, filename, mime_type,
           storage_key, status, uploaded_by
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [
          organizationId,
          document.scopeType,
          document.scopeId,
          document.filename,
          document.mimeType,
          document.storageKey,
          chunks.length > 0 ? 'INDEXE' : 'EN_ATTENTE',
          document.uploadedBy ?? scope.userId,
        ],
      );

      const documentId = inserted.rows[0].id;

      for (const [position, chunk] of chunks.entries()) {
        await client.query(
          `INSERT INTO document_chunks (document_id, content, embedding, position)
           VALUES ($1, $2, $3::vector, $4)`,
          [documentId, chunk.content, vectors[position], position],
        );
      }

      return documentId;
    });

    const created = await this.get(scope, id);
    if (!created) throw new Error('Document introuvable après ingestion.');
    return created;
  }

  async list(
    scope: OrgScope,
    filter: { scopeType?: DocumentScopeType; scopeId?: string } = {},
  ): Promise<DocumentRecord[]> {
    const { organizationId } = assertScope(scope);

    const { rows } = await query<DocumentRow>(
      `SELECT ${DOCUMENT_COLUMNS}
       FROM documents d
       WHERE d.organization_id = $1
         AND ($2::text IS NULL OR d.scope_type = $2)
         AND ($3::text IS NULL OR d.scope_id = $3)
       ORDER BY d.created_at DESC`,
      [organizationId, filter.scopeType ?? null, filter.scopeId ?? null],
    );

    return rows.map(toRecord);
  }

  async get(scope: OrgScope, documentId: string): Promise<DocumentRecord | null> {
    const { organizationId } = assertScope(scope);

    const { rows } = await query<DocumentRow>(
      `SELECT ${DOCUMENT_COLUMNS}
       FROM documents d
       WHERE d.organization_id = $1 AND d.id = $2`,
      [organizationId, documentId],
    );

    return rows[0] ? toRecord(rows[0]) : null;
  }

  async delete(scope: OrgScope, documentId: string): Promise<void> {
    const { organizationId } = assertScope(scope);

    // Les segments (et donc les vecteurs) suivent par ON DELETE CASCADE.
    await query('DELETE FROM documents WHERE organization_id = $1 AND id = $2', [
      organizationId,
      documentId,
    ]);
  }

  async search(scope: OrgScope, options: SearchOptions): Promise<SearchHit[]> {
    const { organizationId } = assertScope(scope);

    const vector = PostgresDocumentProvider.assertEmbedding(options.embedding, 'requête');
    const targets = await this.resolveTargets(scope, options);

    // `targets` vide = recherche sur toute l'organisation.
    // Sinon, on restreint aux couples (type, identifiant) résolus.
    const { rows } = await query<HitRow>(
      `SELECT c.id AS chunk_id, d.id AS document_id, d.filename,
              d.scope_type, d.scope_id, c.content,
              1 - (c.embedding <=> $2::vector) AS similarity
       FROM document_chunks c
       JOIN documents d ON d.id = c.document_id
       WHERE d.organization_id = $1
         AND c.embedding IS NOT NULL
         AND (
           $3::boolean
           OR (d.scope_type, d.scope_id) IN (
             SELECT * FROM unnest($4::text[], $5::text[])
           )
         )
       ORDER BY c.embedding <=> $2::vector
       LIMIT $6`,
      [
        organizationId,
        vector,
        targets.length === 0,
        targets.map((target) => target.scopeType),
        targets.map((target) => target.scopeId),
        options.limit ?? 10,
      ],
    );

    return rows.map((row) => ({
      chunkId: row.chunk_id,
      documentId: row.document_id,
      filename: row.filename,
      scopeType: row.scope_type,
      scopeId: row.scope_id,
      content: row.content,
      similarity: Number(row.similarity),
    }));
  }
}
