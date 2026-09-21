# Hook — Version Update (source unique de vérité)

**Déclencheur** : à la fin d'une phase majeure, avant un commit de release, ou quand `VERSION` change.

**Objectif** : garantir que la version est **cohérente partout** — `VERSION` est la source unique de vérité.

---

## Sources à synchroniser

| Source | Emplacement |
|---|---|
| `VERSION` | racine (**SSoT**) |
| `package.json` → `version` | racine |
| `CHANGELOG.md` | racine (entrée correspondante) |
| `MEMORY.md` | section « État actuel » |

> Les sources spécifiques à masterplan365 (apphosting, stores, i18n) **ne s'appliquent pas** à Katalyst tant que les phases 13/15 ne les ont pas introduites.

---

## Procédure

### 1 — Lire la version de référence
```bash
cat VERSION
```

### 2 — Vérifier la cohérence
```bash
grep '"version"' package.json
```
Comparer avec `VERSION`. Toute divergence = **drift**.

### 3 — Mettre à jour les sources divergentes
```
→ Aligner package.json sur VERSION
→ Ajouter/mettre à jour l'entrée CHANGELOG.md
→ Mettre à jour MEMORY.md
```

### 4 — Incrémenter si nécessaire

| Changement | Incrément |
|---|---|
| Correction de bug | `patch` |
| Fonctionnalité rétrocompatible | `minor` |
| Changement cassant (migration, refonte) | `major` |

### 5 — Vérifier l'absence de drift
Relancer l'étape 2 jusqu'à cohérence.

---

## Règles

- ✅ `VERSION` est la référence : en cas de conflit, c'est elle qui a raison.
- ✅ Une phase majeure = une entrée CHANGELOG.
- ❌ Ne jamais modifier `VERSION` sans mettre à jour `CHANGELOG.md`.

---

## Portabilité

Générique. Ajouter les sources propres au projet cible dans le tableau §Sources.
