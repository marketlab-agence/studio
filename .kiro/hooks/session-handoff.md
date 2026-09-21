# Hook — Session Handoff (continuité inter-conversations)

**Déclencheur** : à la fin de chaque session productive (phase complétée, bugs résolus, décisions prises) ou à la demande explicite de l'utilisateur.

**Objectif** : mettre à jour `MEMORY.md` pour que la prochaine session démarre avec le contexte complet, sans que l'utilisateur ait à le rappeler.

---

## Actions à exécuter (dans l'ordre)

### 1 — Mettre à jour la version et la phase
```
→ Lire VERSION et les phases de .kiro/specs/katalyst/tasks.md
→ Mettre à jour "État actuel du projet" dans MEMORY.md :
   - Version courante
   - Dernière phase complétée
   - Phase en cours / prochaine
   - Branche Git active
```

### 2 — Enregistrer les décisions architecturales nouvelles
```
→ Identifier les décisions prises qui ne sont pas encore dans MEMORY.md
→ Les ajouter sous "Décisions architecturales clés"
→ Si la décision est structurante et irréversible : créer un ADR dans
  .kiro/specs/katalyst/adr/ et référencer l'ADR depuis MEMORY.md
→ Supprimer les entrées obsolètes ou contradictoires
```

### 3 — Enregistrer les bugs résolus
```
→ Pour chaque bug résolu : "[description] → [fix court] (fichier:ligne)"
→ Ne garder que ceux qui impactent les implémentations futures
```

### 4 — Enregistrer les patterns et conventions confirmés
```
→ Si un pattern a été utilisé plusieurs fois ou validé explicitement
→ Ne pas dupliquer ce qui est déjà dans .kiro/steering/coding-standards.md
```

### 5 — Enregistrer les préférences utilisateur
```
→ Préférences explicites non encore consignées :
   style de communication, outils, décisions de design
```

### 6 — Appliquer les 7 règles post-session
```
① Skills — créer/mettre à jour dans .kiro/skills/ si pattern réutilisable
② Steering — mettre à jour si nouvelle règle ou convention durable
③ CHANGELOG.md + VERSION — ajouter si phase complétée
④ Vérification — confirmer que ①②③ sont faits
⑤ Optimisation tokens — référencer via @.kiro/skills/<nom>/SKILL.md, jamais copier
⑥ Portabilité — nouveaux hooks/skills génériques et copiables
⑦ Nettoyage — MEMORY.md sous 200 lignes
```

---

## Format de mise à jour de MEMORY.md

### À sauvegarder
- ✅ Bugs résolus avec fix (fichier + ligne)
- ✅ Décisions architecturales (avec raison, + ADR si structurante)
- ✅ Patterns confirmés sur plusieurs interactions
- ✅ Préférences utilisateur explicites
- ✅ État des phases (complétée / en cours / prochaine)
- ✅ Portes de décision ouvertes (gates)
- ✅ Pièges identifiés avec solution

### À ne PAS sauvegarder
- ❌ Contexte temporaire d'une tâche
- ❌ Contenu de fichiers (les lire au besoin)
- ❌ Spéculations non vérifiées
- ❌ Doublons avec `steering/` ou les `SKILL.md`

### Règle des 200 lignes
Au-delà : archiver dans `memory/[sujet].md` et remplacer par un lien court.

---

## Portabilité

Ce hook est générique et copiable dans tout projet `.kiro/hooks/`. Pour l'adapter :
1. Remplacer `katalyst` par le nom du projet cible dans les chemins.
2. Adapter la liste des règles selon les hooks disponibles.

## Références
- Plan : `@.kiro/specs/katalyst/tasks.md`
- Fin de phase : `@.kiro/workflows/phase-completion.md`
- Prochaine étape : `@.kiro/hooks/next-phase.md`
