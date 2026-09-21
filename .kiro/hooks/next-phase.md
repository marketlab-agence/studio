# Hook — Next Phase (prochaine étape)

**Déclencheur** : « quelle est la prochaine étape ? », « quelle phase ? », « quoi ensuite ? », « next step ? » ou toute formulation équivalente.

**Objectif** : recommander une phase/étape priorisée, toujours à jour, en lisant les sources de vérité.

---

## Sources à lire (dans l'ordre)

1. **`.kiro/specs/katalyst/tasks.md`** — première phase non complétée (`[ ]`) après la dernière terminée (`[x]`)
2. **`MEMORY.md`** — section « État actuel » + « Portes de décision ouvertes »
3. **`.kiro/specs/katalyst/requirements.md`** — REQ liés aux phases candidates (alignement)
4. **`tasks.md` §Spikes et §Portes de décision** — un gate non levé bloque la phase concernée

---

## Algorithme de priorisation

### 1. Blocages d'abord
Toute tâche `[!]` (bloquée) ou tout spike non clos bloquant une phase → **priorité absolue**.

### 2. Portes de décision
Si la phase suivante dépend d'un gate non levé (G1-G4), **ne pas la recommander** : recommander la levée du gate.

### 3. Dépendances
Ne jamais recommander une phase dont les dépendances ne sont pas `[x]` (voir le graphe dans `tasks.md`).

### 4. Chemin critique
À défaut, suivre le chemin critique : `0 → 0.5 → 1 → 2 → 3 → 4 → 5 → 6 → 7`.

### 5. Effort vs impact
Phases courtes à fort déblocage avant phases longues à impact moindre.

---

## Format de réponse obligatoire

```
## Prochaine phase recommandée : Phase X — [Nom]

**Pourquoi maintenant :**
- [Raison 1 — dépendance ou gate]
- [Raison 2]

**Prérequis à vérifier avant de démarrer :**
- [ ] [gate / spike / dépendance]

**Phases suivantes dans l'ordre :**
| # | Phase | Raison |
|---|---|---|
| 2 | Phase Y | ... |
| 3 | Phase Z | ... |
```

---

## Règles

- ✅ Toujours lire `tasks.md` — jamais de mémoire
- ✅ Toujours vérifier les gates avant de recommander
- ✅ Lister les 3 phases suivantes
- ❌ Ne jamais recommander une phase dont les dépendances ne sont pas complétées
- ❌ Ne jamais recommander une phase bloquée par un gate non levé

---

## Portabilité

Ce hook est générique. Pour l'adapter :
1. Remplacer `katalyst` par le nom du projet cible.
2. Adapter l'algorithme §1-5 selon les priorités du projet.
