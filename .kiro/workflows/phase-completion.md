# Workflow — Fin de phase Katalyst

> À exécuter **dans l'ordre** après chaque phase ou groupe de modifications cohérent.
> **Aucune phase n'est déclarée terminée avant que les 7 étapes passent.**

---

## Étape 1 — Typecheck

```bash
npm run typecheck
```

**Critère** : 0 erreur.
**Erreurs fréquentes** : types manquants, imports inutilisés, props incorrectes.

---

## Étape 2 — Lint

```bash
npm run lint
```

**Critère** : 0 erreur, aucun prompt interactif.
**Note** : la config ESLint est créée en phase 0 (T0.1). Avant, cette étape est indisponible.

---

## Étape 3 — Tests unitaires (jsdom)

```bash
npm test
```

**Critère** : vert.

---

## Étape 4 — Tests d'intégration DB (node)

```bash
npm run test:db
```

**Critère** : vert, sur la base `katalyst_test`.
**Note** : l'infra est créée en phase 0 (T0.7). Avant, cette étape est indisponible.

---

## Étape 5 — Vérification runtime

Démarrer **une seule** instance (jamais deux : EPERM + conflit de port) :

```bash
npm run dev:turbo
```

Puis vérifier les points d'entrée de la phase, par exemple :

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/            # attendu 200
curl -s http://localhost:3000/api/plans                                   # attendu JSON non vide
```

**Critère** : chaque critère de vérification listé dans `tasks.md` pour la phase est **observé** (HTTP 200 + contenu attendu).

⚠️ **Toujours arrêter l'instance avant d'en relancer une.**

---

## Étape 6 — Base de données : sauvegarde et réversibilité

**Avant toute migration en staging/prod :**

```bash
docker exec -t <container> pg_dump -U postgres katalyst > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Critère** : dump créé, migration réversible testée (`up` puis `down`).
**Règle** : aucune migration non réversible ne part en production.

---

## Étape 7 — Traçabilité

1. `tasks.md` — cocher les tâches avec `[x]` (uniquement si vérifiées)
2. `MEMORY.md` — mettre à jour via `@.kiro/hooks/session-handoff.md`
3. `CHANGELOG.md` — ajouter l'entrée de phase
4. `VERSION` — incrémenter si la phase est majeure (voir `@.kiro/hooks/version-update.md`)

**Critère** : les 4 fichiers sont à jour et cohérents entre eux.

---

## Checklist condensée

```
[ ] 1. npm run typecheck      → 0 erreur
[ ] 2. npm run lint           → 0 erreur
[ ] 3. npm test               → vert
[ ] 4. npm run test:db        → vert
[ ] 5. Vérif runtime          → critères de tasks.md observés
[ ] 6. Dump + réversibilité   → migration testée up/down
[ ] 7. tasks.md + MEMORY.md + CHANGELOG.md + VERSION
```

---

## Portabilité

Ce workflow est générique. Pour l'adapter à un autre projet :
1. Remplacer les commandes par celles du projet cible.
2. Fusionner les étapes 3 et 4 si le projet n'a qu'un seul projet de test.
3. Conserver impérativement les étapes 5 (runtime) et 6 (sauvegarde) — ce sont celles qui attrapent les régressions réelles.
