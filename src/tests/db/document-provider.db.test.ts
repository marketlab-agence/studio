import {
  EMBEDDING_DIMENSIONS,
  getDocumentProvider,
  resetProviders,
  type DocumentProvider,
  type OrgScope,
} from '@/lib/providers';
import { PostgresDocumentProvider } from '@/lib/providers/postgres/document';
import { pool, requireDatabaseOrSkip } from './setup';

/**
 * DocumentProvider (T3.9).
 *
 * Recherche vectorielle vérifiée avec des **vecteurs fabriqués à la main** : on
 * sait exactement quel segment doit sortir en tête, ce qu'un vrai modèle
 * d'embedding ne permettrait pas de prédire.
 *
 * Vérifie aussi l'**héritage** (ADR 0012) : une recherche sur une leçon doit
 * trouver la documentation de son chapitre et de sa formation.
 */

const ORG_B_SLUG = 'docs-org-b';

let scopeA: OrgScope;
let scopeB: OrgScope;
let courseId: string;
let chapterId: string;
let lessonId: string;

/** Vecteur unitaire porté par l'axe `index`, complété de zéros. */
function axisVector(index: number): number[] {
  const vector = new Array<number>(EMBEDDING_DIMENSIONS).fill(0);
  vector[index] = 1;
  return vector;
}

async function prepare(): Promise<boolean> {
  const { rows } = await pool.query<{ organization_id: string; user_id: string; role: string }>(
    `SELECT o.id AS organization_id, u.id AS user_id, u.role
     FROM organizations o JOIN users u ON u.organization_id = o.id
     ORDER BY o.created_at LIMIT 1`,
  );
  if (rows.length === 0) return false;

  scopeA = {
    organizationId: rows[0].organization_id,
    userId: rows[0].user_id,
    role: rows[0].role as OrgScope['role'],
  };

  // Une formation seedée, son premier chapitre et sa première leçon.
  const course = await pool.query<{ id: string }>(
    'SELECT id FROM courses WHERE organization_id = $1 ORDER BY created_at LIMIT 1',
    [scopeA.organizationId],
  );
  if (course.rows.length === 0) return false;
  courseId = course.rows[0].id;

  const chapter = await pool.query<{ id: string; course_id: string }>(
    'SELECT id, course_id FROM chapters WHERE course_id = $1 ORDER BY position LIMIT 1',
    [courseId],
  );
  if (chapter.rows.length === 0) return false;
  chapterId = chapter.rows[0].id;

  const lesson = await pool.query<{ id: string }>(
    'SELECT id FROM lessons WHERE chapter_id = $1 ORDER BY position LIMIT 1',
    [chapterId],
  );
  if (lesson.rows.length === 0) return false;
  lessonId = lesson.rows[0].id;

  const created = await pool.query<{ id: string }>(
    `INSERT INTO organizations (name, slug) VALUES ('Org documents B', $1)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    [ORG_B_SLUG],
  );
  const userB = await pool.query<{ id: string }>(
    `INSERT INTO users (organization_id, email, name, role)
     VALUES ($1, 'docs-b@example.com', 'Utilisateur B', 'Utilisateur')
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    [created.rows[0].id],
  );

  scopeB = {
    organizationId: created.rows[0].id,
    userId: userB.rows[0].id,
    role: 'Utilisateur',
  };
  return true;
}

async function cleanup(): Promise<void> {
  await pool.query('DELETE FROM organizations WHERE slug = $1', [ORG_B_SLUG]);
  await pool.query('DELETE FROM documents WHERE organization_id = $1', [scopeA.organizationId]);
}

describe('PostgresDocumentProvider', () => {
  let provider: DocumentProvider;

  beforeEach(async () => {
    if (!(await requireDatabaseOrSkip())) return;
    resetProviders();
    if (!(await prepare())) throw new Error('Base non seedée.');
    provider = getDocumentProvider();
  });

  afterEach(async () => {
    if (!(await requireDatabaseOrSkip())) return;
    await cleanup();
  });

  it('ingère un document et ses segments, et le marque indexé', async () => {
    if (!(await requireDatabaseOrSkip())) return;

    const record = await provider.ingest(
      scopeA,
      {
        scopeType: 'COURSE',
        scopeId: courseId,
        filename: 'referentiel.pdf',
        mimeType: 'application/pdf',
        storageKey: 'docs/referentiel.pdf',
      },
      [
        { content: 'Segment A', embedding: axisVector(0) },
        { content: 'Segment B', embedding: axisVector(1) },
      ],
    );

    expect(record.status).toBe('INDEXE');
    expect(record.chunkCount).toBe(2);
    expect(record.filename).toBe('referentiel.pdf');
  });

  it('marque le document en attente s’il n’a aucun segment', async () => {
    if (!(await requireDatabaseOrSkip())) return;

    const record = await provider.ingest(
      scopeA,
      {
        scopeType: 'COURSE',
        scopeId: courseId,
        filename: 'vide.pdf',
        mimeType: 'application/pdf',
        storageKey: 'docs/vide.pdf',
      },
      [],
    );

    expect(record.status).toBe('EN_ATTENTE');
    expect(record.chunkCount).toBe(0);
  });

  it('refuse un vecteur de mauvaise dimension, sans rien écrire', async () => {
    if (!(await requireDatabaseOrSkip())) return;

    await expect(
      provider.ingest(
        scopeA,
        {
          scopeType: 'COURSE',
          scopeId: courseId,
          filename: 'mauvais.pdf',
          mimeType: 'application/pdf',
          storageKey: 'docs/mauvais.pdf',
        },
        [{ content: 'x', embedding: [1, 2, 3] }],
      ),
    ).rejects.toThrow(new RegExp(`${EMBEDDING_DIMENSIONS} attendues`));

    // Rien n'a été créé : la vérification précède l'écriture.
    expect(await provider.list(scopeA, { scopeId: courseId })).toHaveLength(0);
  });

  it('classe les résultats du plus proche au plus éloigné', async () => {
    if (!(await requireDatabaseOrSkip())) return;

    await provider.ingest(
      scopeA,
      {
        scopeType: 'COURSE',
        scopeId: courseId,
        filename: 'cours.pdf',
        mimeType: 'application/pdf',
        storageKey: 'docs/cours.pdf',
      },
      [
        { content: 'Piano', embedding: axisVector(0) },
        { content: 'Guitare', embedding: axisVector(1) },
        { content: 'Violon', embedding: axisVector(2) },
      ],
    );

    // Requête alignée sur l'axe 1 : « Guitare » doit sortir en tête, à 1.0.
    const hits = await provider.search(scopeA, { embedding: axisVector(1) });

    expect(hits).toHaveLength(3);
    expect(hits[0].content).toBe('Guitare');
    expect(hits[0].similarity).toBeCloseTo(1, 6);
    // Les deux autres sont orthogonaux : similarité 0.
    expect(hits[1].similarity).toBeCloseTo(0, 6);
  });

  it('respecte la limite demandée', async () => {
    if (!(await requireDatabaseOrSkip())) return;

    await provider.ingest(
      scopeA,
      {
        scopeType: 'COURSE',
        scopeId: courseId,
        filename: 'cours.pdf',
        mimeType: 'application/pdf',
        storageKey: 'docs/cours.pdf',
      },
      [
        { content: 'A', embedding: axisVector(0) },
        { content: 'B', embedding: axisVector(1) },
        { content: 'C', embedding: axisVector(2) },
      ],
    );

    expect(await provider.search(scopeA, { embedding: axisVector(0), limit: 2 })).toHaveLength(2);
  });

  it('hérite de la documentation du chapitre et de la formation', async () => {
    if (!(await requireDatabaseOrSkip())) return;

    const base = {
      mimeType: 'application/pdf',
      storageKey: 'docs/x.pdf',
    };

    await provider.ingest(
      scopeA,
      { ...base, scopeType: 'COURSE', scopeId: courseId, filename: 'formation.pdf' },
      [{ content: 'Doc formation', embedding: axisVector(0) }],
    );
    await provider.ingest(
      scopeA,
      { ...base, scopeType: 'CHAPTER', scopeId: chapterId, filename: 'chapitre.pdf' },
      [{ content: 'Doc chapitre', embedding: axisVector(1) }],
    );
    await provider.ingest(
      scopeA,
      { ...base, scopeType: 'LESSON', scopeId: lessonId, filename: 'lecon.pdf' },
      [{ content: 'Doc leçon', embedding: axisVector(2) }],
    );

    // Depuis la leçon, les trois niveaux sont visibles.
    const inherited = await provider.search(scopeA, {
      embedding: axisVector(1),
      scopeType: 'LESSON',
      scopeId: lessonId,
    });
    expect(inherited.map((hit) => hit.content).sort()).toEqual([
      'Doc chapitre',
      'Doc formation',
      'Doc leçon',
    ]);

    // Sans héritage, seule la documentation de la leçon remonte.
    const direct = await provider.search(scopeA, {
      embedding: axisVector(1),
      scopeType: 'LESSON',
      scopeId: lessonId,
      includeInherited: false,
    });
    expect(direct.map((hit) => hit.content)).toEqual(['Doc leçon']);
  });

  it('restreint la recherche à la cible demandée', async () => {
    if (!(await requireDatabaseOrSkip())) return;

    const base = { mimeType: 'application/pdf', storageKey: 'docs/x.pdf' };
    await provider.ingest(
      scopeA,
      { ...base, scopeType: 'COURSE', scopeId: courseId, filename: 'formation.pdf' },
      [{ content: 'Doc formation', embedding: axisVector(0) }],
    );

    // Aucune documentation sur ce chapitre : la recherche héritée remonte tout
    // de même à la formation (comportement attendu de l'héritage).
    const hits = await provider.search(scopeA, {
      embedding: axisVector(0),
      scopeType: 'CHAPTER',
      scopeId: chapterId,
    });
    expect(hits.map((hit) => hit.content)).toEqual(['Doc formation']);
  });

  it('supprime un document et ses segments en cascade', async () => {
    if (!(await requireDatabaseOrSkip())) return;

    const record = await provider.ingest(
      scopeA,
      {
        scopeType: 'COURSE',
        scopeId: courseId,
        filename: 'cours.pdf',
        mimeType: 'application/pdf',
        storageKey: 'docs/cours.pdf',
      },
      [{ content: 'A', embedding: axisVector(0) }],
    );

    await provider.delete(scopeA, record.id);

    expect(await provider.get(scopeA, record.id)).toBeNull();
    expect(await provider.search(scopeA, { embedding: axisVector(0) })).toHaveLength(0);

    const { rows } = await pool.query<{ count: string }>(
      'SELECT COUNT(*)::text AS count FROM document_chunks WHERE document_id = $1',
      [record.id],
    );
    expect(Number(rows[0].count)).toBe(0);
  });

  it('filtre la liste par cible', async () => {
    if (!(await requireDatabaseOrSkip())) return;

    const base = { mimeType: 'application/pdf', storageKey: 'docs/x.pdf' };
    await provider.ingest(
      scopeA,
      { ...base, scopeType: 'COURSE', scopeId: courseId, filename: 'formation.pdf' },
      [],
    );
    await provider.ingest(
      scopeA,
      { ...base, scopeType: 'CHAPTER', scopeId: chapterId, filename: 'chapitre.pdf' },
      [],
    );

    expect(await provider.list(scopeA, { scopeType: 'CHAPTER', scopeId: chapterId })).toHaveLength(1);
    expect(await provider.list(scopeA, { scopeType: 'COURSE' })).toHaveLength(1);
  });

  describe('isolation inter-organisations', () => {
    it('ne voit pas les documents d’une autre organisation', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await provider.ingest(
        scopeA,
        {
          scopeType: 'COURSE',
          scopeId: courseId,
          filename: 'confidentiel.pdf',
          mimeType: 'application/pdf',
          storageKey: 'docs/confidentiel.pdf',
        },
        [{ content: 'Secret', embedding: axisVector(0) }],
      );

      expect(await provider.list(scopeB)).toHaveLength(0);
      expect(await provider.search(scopeB, { embedding: axisVector(0) })).toHaveLength(0);
    });

    it('refuse de lire un document d’une autre organisation par son identifiant', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const record = await provider.ingest(
        scopeA,
        {
          scopeType: 'COURSE',
          scopeId: courseId,
          filename: 'confidentiel.pdf',
          mimeType: 'application/pdf',
          storageKey: 'docs/confidentiel.pdf',
        },
        [],
      );

      expect(await provider.get(scopeB, record.id)).toBeNull();
    });

    it('refuse de supprimer un document d’une autre organisation', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const record = await provider.ingest(
        scopeA,
        {
          scopeType: 'COURSE',
          scopeId: courseId,
          filename: 'confidentiel.pdf',
          mimeType: 'application/pdf',
          storageKey: 'docs/confidentiel.pdf',
        },
        [],
      );

      await provider.delete(scopeB, record.id);

      // Toujours présent depuis A.
      expect(await provider.get(scopeA, record.id)).not.toBeNull();
    });
  });

  it('est sélectionnable par DATA_PROVIDER', () => {
    resetProviders();
    expect(getDocumentProvider()).toBeInstanceOf(PostgresDocumentProvider);
  });
});
