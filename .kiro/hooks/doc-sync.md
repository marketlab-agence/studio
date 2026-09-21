# Hook — Doc Sync (cohérence de la documentation)

**Déclencheur** : après une modification qui change le comportement, l'architecture, les commandes ou les conventions.

**Objectif** : éviter la **dérive documentaire** — une doc qui décrit autre chose que le code est pire qu'une absence de doc.

---

## Sources à maintenir

| Document | Contenu | Quand le mettre à jour |
|---|---|---|
| `MEMORY.md` | État, décisions, bugs, patterns | Chaque session (voir `session-handoff`) |
| `.kiro/specs/katalyst/requirements.md` | Exigences | Ajout/modification d'exigence |
| `.kiro/specs/katalyst/design.md` | Architecture | Changement structurel |
| `.kiro/specs/katalyst/tasks.md` | Avancement | Chaque tâche terminée |
| `.kiro/specs/katalyst/adr/` | Décisions irréversibles | Décision structurante |
| `.kiro/steering/` | Contexte, standards, glossaire | Nouvelle convention, nouveau terme |
| `CHANGELOG.md` | Historique | Phase complétée |
| `AGENTS.md` | Instructions agents | Nouvelle commande, nouvelle règle |

---

## Procédure

### 1 — Identifier ce qui a changé
```
→ Comportement ? → design.md
→ Exigence ? → requirements.md
→ Terme ou convention ? → steering/
→ Décision irréversible ? → adr/
→ Commande ? → AGENTS.md
```

### 2 — Mettre à jour
Ne mettre à jour que les documents **réellement impactés** — pas de mise à jour cosmétique.

### 3 — Détecter les contradictions
```
→ Un terme du glossaire contredit-il le code ? → bug de nommage
→ Un ADR contredit-il design.md ? → corriger l'un des deux
→ MEMORY.md contredit-il VERSION ou tasks.md ? → MEMORY.md a tort
```

### 4 — Vérifier les références
```
→ Les liens @.kiro/... pointent-ils vers des fichiers existants ?
→ Les chemins cités existent-ils encore ?
```

---

## Règles

- ✅ Préférer référencer (`@.kiro/skills/<nom>/SKILL.md`) plutôt que dupliquer le contenu.
- ✅ Une décision irréversible **doit** avoir un ADR.
- ❌ Ne pas documenter ce qui est évident à la lecture du code.
- ❌ Ne pas créer de document sans déclencheur réel (YAGNI documentaire).

---

## Portabilité

Générique. Adapter le tableau §Sources aux documents du projet cible.
