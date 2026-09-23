# Migration des comptes Firebase Auth vers PostgreSQL

**Exécutée le** : 2026-09-21
**Script d'origine** : `src/lib/db/import-auth.ts` (supprimé en phase 7 — Firebase décommissionné)

## Ce qui a été fait

Les comptes Firebase Auth ont été lus via l'Admin SDK (`admin.auth().listUsers`, pagination de 1000)
et insérés dans la table `users` de l'organisation `katalyst`.

**Limite structurelle de Firebase** : les **mots de passe ne sont jamais exportables**. Les comptes
à mot de passe ont donc été importés avec `password_hash = NULL` et `must_reset_password = true`.
Les comptes Google se reconnectent directement via OAuth.

Le script était **idempotent** (`ON CONFLICT (email)`) : le rejouer ne dupliquait rien et ne
réécrasait ni le rôle ni la formule attribués localement.

## Résultat constaté (relevé du 2026-09-23)

**11 comptes** importés, décrits par catégories — les adresses ne sont pas reproduites ici :

| Rôle | Statut | `must_reset_password` | Nature |
|---|---|---|---|
| 1 Super Admin | Actif | non | compte Google |
| 1 Admin | Actif | oui | compte à mot de passe |
| 1 Modérateur | Actif | oui | compte à mot de passe |
| 8 Utilisateurs | 6 actifs, 2 inactifs | oui (1 Google excepté) | comptes à mot de passe |

La distribution confirme le comportement attendu : la réinitialisation forcée frappe les comptes
à mot de passe, jamais les comptes Google.

## Pourquoi le script n'existe plus

Firebase est décommissionné : le script ne peut plus s'exécuter, et conserver un import de
`firebase-admin` recréerait le couplage que la purge vise à éliminer. La trace est conservée ici.
