import {
  getContentProvider,
  getUserProvider,
  resetProviders,
  type OrgScope,
} from '@/lib/providers';
import { pool, requireDatabaseOrSkip } from './setup';

/**
 * T3.12 — ISOLATION INTER-ORGANISATIONS.
 *
 * Le test le plus important de la couche providers : il vérifie qu'aucune
 * lecture ne peut franchir la frontière d'une organisation. Une seule fuite
 * ici serait un incident grave (ADR 0007).
 *
 * Méthode : on crée une seconde organisation avec ses propres données, puis on
 * interroge depuis chacune et on vérifie que l'autre est invisible.
 */

const ORG_B_SLUG = 'iso-org-b';

let orgA: OrgScope;
let orgB: OrgScope;
let courseB: string;
let userB: string;

async function setup(): Promise<boolean> {
  const { rows: orgs } = await pool.query<{ id: string }>(
    'SELECT id FROM organizations ORDER BY created_at LIMIT 1',
  );
  if (orgs.length === 0) return false;

  const { rows: userA } = await pool.query<{ id: string }>(
    'SELECT id FROM users WHERE organization_id = $1 LIMIT 1',
    [orgs[0].id],
  );
  if (userA.length === 0) return false;

  orgA = { organizationId: orgs[0].id, userId: userA[0].id, role: 'Super Admin' };

  // Organisation B, avec sa propre formation et son propre utilisateur.
  const { rows: created } = await pool.query<{ id: string }>(
    `INSERT INTO organizations (name, slug) VALUES ('Organisation B', $1)
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    [ORG_B_SLUG],
  );
  const orgBId = created[0].id;

  const { rows: userBRows } = await pool.query<{ id: string }>(
    `INSERT INTO users (organization_id, email, name, role)
     VALUES ($1, 'iso-b@example.com', 'Utilisateur B', 'Utilisateur')
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    [orgBId],
  );
  userB = userBRows[0].id;

  courseB = 'iso-cours-b';
  await pool.query(
    `INSERT INTO courses (id, organization_id, title, description, status)
     VALUES ($1, $2, 'Formation secrete B', 'Ne doit jamais fuiter', 'Publié')
     ON CONFLICT (id) DO UPDATE SET organization_id = EXCLUDED.organization_id`,
    [courseB, orgBId],
  );

  // Chapitre et leçon rattachés à la formation de B.
  await pool.query(
    `INSERT INTO chapters (id, course_id, title, position)
     VALUES ('iso-chapitre-b', $1, 'Chapitre B', 0)
     ON CONFLICT (id) DO UPDATE SET course_id = EXCLUDED.course_id`,
    [courseB],
  );
  await pool.query(
    `INSERT INTO lessons (id, chapter_id, title, objective, content, type, position)
     VALUES ('iso-lecon-b', 'iso-chapitre-b', 'Lecon B', 'Objectif B', 'Secret', 'TEXTE', 0)
     ON CONFLICT (id) DO UPDATE SET chapter_id = EXCLUDED.chapter_id`,
  );

  orgB = { organizationId: orgBId, userId: userB, role: 'Utilisateur' };
  return true;
}

async function cleanup(): Promise<void> {
  await pool.query('DELETE FROM organizations WHERE slug = $1', [ORG_B_SLUG]);
}

describe('Isolation inter-organisations', () => {
  beforeEach(async () => {
    if (!(await requireDatabaseOrSkip())) return;
    resetProviders();
    await setup();
  });

  afterEach(async () => {
    if (!(await requireDatabaseOrSkip())) return;
    await cleanup();
  });

  describe('Contenu', () => {
    it('ne liste jamais les formations d’une autre organisation', async () => {
      if (!(await requireDatabaseOrSkip())) return;
      const provider = getContentProvider();

      const forA = await provider.listCourses(orgA);
      const forB = await provider.listCourses(orgB);

      expect(forA.map((c) => c.id)).not.toContain(courseB);
      expect(forB.map((c) => c.id)).toContain(courseB);
      expect(forB).toHaveLength(1);
    });

    it('retourne null pour une formation d’une autre organisation', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      expect(await getContentProvider().getCourse(orgA, courseB)).toBeNull();
      expect((await getContentProvider().getCourse(orgB, courseB))?.id).toBe(courseB);
    });

    it('ne liste jamais les chapitres d’une autre organisation', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const forA = await getContentProvider().listChapters(orgA);
      expect(forA.map((c) => c.id)).not.toContain('iso-chapitre-b');
    });

    it('ne retourne aucune leçon d’une autre organisation', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      const forA = await getContentProvider().listChapters(orgA);
      const lessonIds = forA.flatMap((chapter) => chapter.lessons.map((lesson) => lesson.id));
      expect(lessonIds).not.toContain('iso-lecon-b');
    });

    it('refuse de supprimer une formation d’une autre organisation', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await getContentProvider().deleteCourse(orgA, courseB);

      const { rows } = await pool.query<{ id: string }>(
        'SELECT id FROM courses WHERE id = $1',
        [courseB],
      );
      expect(rows).toHaveLength(1); // toujours présente
    });
  });

  describe('Utilisateurs', () => {
    it('ne liste jamais les utilisateurs d’une autre organisation', async () => {
      if (!(await requireDatabaseOrSkip())) return;
      const provider = getUserProvider();

      const forA = await provider.list(orgA);
      const forB = await provider.list(orgB);

      expect(forA.map((u) => u.id)).not.toContain(userB);
      expect(forB.map((u) => u.id)).toEqual([userB]);
    });

    it('retourne null pour un utilisateur d’une autre organisation', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      expect(await getUserProvider().getById(orgA, userB)).toBeNull();
      expect((await getUserProvider().getById(orgB, userB))?.id).toBe(userB);
    });

    it('retourne null pour un email d’une autre organisation', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      expect(await getUserProvider().getByEmail(orgA, 'iso-b@example.com')).toBeNull();
      expect((await getUserProvider().getByEmail(orgB, 'iso-b@example.com'))?.id).toBe(userB);
    });

    it('refuse de modifier un utilisateur d’une autre organisation', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await getUserProvider().setRole(orgA, userB, 'Super Admin');

      const { rows } = await pool.query<{ role: string }>('SELECT role FROM users WHERE id = $1', [
        userB,
      ]);
      expect(rows[0].role).toBe('Utilisateur'); // inchangé
    });

    it('refuse de supprimer un utilisateur d’une autre organisation', async () => {
      if (!(await requireDatabaseOrSkip())) return;

      await getUserProvider().delete(orgA, userB);

      const { rows } = await pool.query<{ id: string }>('SELECT id FROM users WHERE id = $1', [userB]);
      expect(rows).toHaveLength(1); // toujours présent
    });
  });
});
