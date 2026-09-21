# Hook — Post-Plan (après validation d'un plan)

**Déclencheur** : après qu'un plan a été validé par l'utilisateur et avant de commencer l'implémentation.

**Objectif** : garantir que le plan est **traçable, exécutable et mesurable** avant d'écrire du code.

---

## Actions à exécuter (dans l'ordre)

### 1 — Vérifier la traçabilité
```
→ Chaque REQ de requirements.md est-il mappé vers au moins une tâche de tasks.md ?
→ Chaque tâche de tasks.md référence-t-elle un REQ ?
→ Un REQ sans tâche ou une tâche sans REQ = plan incomplet → corriger
```

### 2 — Vérifier les dépendances
```
→ Chaque phase déclare ses dépendances
→ Le graphe de dépendances de tasks.md est-il acyclique ?
→ Une phase dont les dépendances ne sont pas dans le plan = plan incomplet
```

### 3 — Vérifier la testabilité
```
→ Chaque tâche a-t-elle un critère de vérification observable ?
→ "Améliorer X" n'est pas un critère. "X → 0 erreur" en est un.
→ Une tâche sans critère vérifiable → la reformuler
```

### 4 — Identifier les spikes et gates
```
→ Y a-t-il des zones d'incertitude technique ? → les inscrire comme spikes
→ Y a-t-il des décisions externes à obtenir ? → les inscrire comme gates
→ Un gate non identifié qui bloque une phase = risque non maîtrisé
```

### 5 — Vérifier le Definition of Done
```
→ Le DoD global est-il défini et exécutable ?
→ Le workflow de fin de phase est-il adapté au projet (commandes réelles) ?
```

### 6 — Consigner les décisions structurantes
```
→ Toute décision irréversible → créer un ADR dans adr/
→ Référencer l'ADR depuis MEMORY.md
```

### 7 — Initialiser l'état
```
→ tasks.md : toutes les tâches en [ ]
→ MEMORY.md : "Phase en cours" = première phase
→ CHANGELOG.md : entrée "Non publié"
```

---

## Critère de sortie

Le plan est **prêt à exécuter** si :

- [ ] Traçabilité REQ ↔ tâches complète
- [ ] Graphe de dépendances acyclique
- [ ] Chaque tâche a un critère vérifiable
- [ ] Spikes et gates identifiés
- [ ] DoD défini
- [ ] ADR créés pour les décisions structurantes
- [ ] État initialisé

---

## Portabilité

Générique. Adapter les chemins (`katalyst`) au projet cible.
