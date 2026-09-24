import { query } from '@/lib/db/pool';
import type { AppUser } from '@/lib/users';
import { assertScope, type OrgScope } from '../types';
import type { UserProvider, UserQuery } from '../users';

/**
 * Comptes utilisateurs en PostgreSQL.
 *
 * RÈGLE D'ISOLATION : `organization_id` est dans **chaque** clause WHERE, y
 * compris pour `getById`. Un identifiant d'utilisateur valide d'une autre
 * organisation retourne `null`, jamais la ligne.
 */

type UserRow = {
  id: string;
  name: string;
  email: string;
  plan_id: string | null;
  status: AppUser['status'];
  role: AppUser['role'];
  created_at: Date;
    phone: string | null;
    language: AppUser['language'];
  }

function toAppUser(row: UserRow): AppUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    planId: row.plan_id ?? 'free',
    status: row.status,
    role: row.role,
      joined: row.created_at.toISOString().slice(0, 10),
      phone: row.phone ?? undefined,
      language: row.language,
    };
  }

const SELECT_COLUMNS = 'id, name, email, plan_id, status, role, created_at, phone, language';

export class PostgresUserProvider implements UserProvider {
  async list(scope: OrgScope, filters: UserQuery = {}): Promise<AppUser[]> {
    const { organizationId } = assertScope(scope);

    const { rows } = await query<UserRow>(
      `SELECT ${SELECT_COLUMNS}
       FROM users
       WHERE organization_id = $1
         AND ($2::text IS NULL OR role = $2)
         AND ($3::text IS NULL OR status = $3)
         AND ($4::text IS NULL OR name ILIKE '%' || $4 || '%' OR email ILIKE '%' || $4 || '%')
       ORDER BY created_at, name
       LIMIT $5`,
      [
        organizationId,
        filters.role ?? null,
        filters.status ?? null,
        filters.search ?? null,
        filters.limit ?? 200,
      ],
    );

    return rows.map(toAppUser);
  }

  async getById(scope: OrgScope, userId: string): Promise<AppUser | null> {
    const { organizationId } = assertScope(scope);

    const { rows } = await query<UserRow>(
      `SELECT ${SELECT_COLUMNS} FROM users WHERE organization_id = $1 AND id = $2`,
      [organizationId, userId],
    );

    return rows[0] ? toAppUser(rows[0]) : null;
  }

  async getByEmail(scope: OrgScope, email: string): Promise<AppUser | null> {
    const { organizationId } = assertScope(scope);

    const { rows } = await query<UserRow>(
      `SELECT ${SELECT_COLUMNS} FROM users WHERE organization_id = $1 AND lower(email) = lower($2)`,
      [organizationId, email],
    );

    return rows[0] ? toAppUser(rows[0]) : null;
  }

  async create(scope: OrgScope, user: Omit<AppUser, 'id'>): Promise<AppUser> {
    const { organizationId } = assertScope(scope);

    const { rows } = await query<UserRow>(
      `INSERT INTO users (organization_id, email, name, role, plan_id, status, phone, must_reset_password)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING ${SELECT_COLUMNS}`,
      [
        organizationId, user.email, user.name, user.role,
        user.planId ?? 'free', user.status ?? 'Actif', user.phone ?? null,
      ],
    );

    return toAppUser(rows[0]);
  }

  async update(scope: OrgScope, userId: string, changes: Partial<AppUser>): Promise<void> {
    const { organizationId } = assertScope(scope);

    await query(
      `UPDATE users SET
         name = COALESCE($3, name),
         email = COALESCE($4, email),
         plan_id = COALESCE($5, plan_id),
         status = COALESCE($6, status),
         phone = COALESCE($7, phone)
       WHERE organization_id = $1 AND id = $2`,
      [
        organizationId, userId,
        changes.name ?? null, changes.email ?? null, changes.planId ?? null,
        changes.status ?? null, changes.phone ?? null,
      ],
    );
  }

    async setRole(scope: OrgScope, userId: string, role: AppUser['role']): Promise<void> {
      const { organizationId } = assertScope(scope);

      await query('UPDATE users SET role = $3 WHERE organization_id = $1 AND id = $2', [
        organizationId, userId, role,
      ]);
    }

    async updatePreferredLanguage(scope: OrgScope, language: 'fr' | 'en' | 'es'): Promise<void> {
      const { organizationId, userId } = assertScope(scope);

      // ⚠️ La cible est `scope.userId`, jamais un identifiant fourni par l'appelant :
      // un utilisateur ne change que SA préférence. Le filtre d'organisation empêche
      // en outre de toucher un compte d'un autre tenant.
      await query(
        'UPDATE users SET language = $3 WHERE organization_id = $1 AND id = $2',
        [organizationId, userId, language],
      );
    }

  async delete(scope: OrgScope, userId: string): Promise<void> {
    const { organizationId } = assertScope(scope);

    await query('DELETE FROM users WHERE organization_id = $1 AND id = $2', [organizationId, userId]);
  }
}
