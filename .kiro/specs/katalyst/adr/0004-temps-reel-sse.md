# ADR 0004 — Temps réel par SSE natif

- **Statut** : accepté
- **Date** : 2026-09-21
- **Phases concernées** : 11, 13

## Contexte

Le modèle de référence (REWORK) comporte une **messagerie formateur ↔ apprenants** par cohorte, avec compteur de messages non lus, pièces jointes et emoji. La messagerie doit se mettre à jour **sans rechargement de page**.

Contrainte : le backend est **natif Next** (pas de service Express séparé — voir `MEMORY.md` §Décisions 1). Le projet frère `masterplan365` utilise Express + Socket.IO, modèle qui n'est pas transposable ici.

Trois voies possibles : SSE natif, WebSocket (Socket.IO) sur un service séparé, ou un service tiers.

## Décision

Utiliser **Server-Sent Events (SSE)** natif, implémenté dans un route handler Next :

```
GET  /api/messages/stream?cohortId=…   → flux SSE (EventSource)
POST /api/messages                     → envoi
```

- Un seul sens serveur → client (suffisant : l'envoi passe par POST).
- Compatible avec l'architecture Next native, sans service supplémentaire.
- Repli possible vers du polling si un environnement s'avère incompatible.

## Conséquences

### Positives
- Aucun service ni dépendance supplémentaire ; reste dans un seul déployable.
- `EventSource` est natif navigateur, avec reconnexion automatique.
- Cohérent avec le choix « backend natif Next ».
- Fonctionne derrière un proxy HTTP standard.

### Négatives / coûts
- **⚠️ `EventSource` en WebView Capacitor doit être vérifié** — spike obligatoire avant la phase 13 (REQ-MOB-02). Repli : polling.
- Une connexion SSE par client = une connexion HTTP longue durée → dimensionner le nombre de workers/connexions simultanées.
- Pas de canal client → serveur : l'envoi nécessite un POST séparé (acceptable ici).
- SSE derrière un load balancer exige un timeout adapté et la désactivation du buffering.

## Alternatives écartées

| Alternative | Raison du rejet |
|---|---|
| **Socket.IO sur service séparé** | Contredit le choix « backend natif Next » ; ajoute un process, un déploiement et une dépendance |
| **Service tiers (Pusher, Ably…)** | Dépendance forte à un fournisseur payant ; contraire à l'agnosticité |
| **Polling simple** | Suffisant fonctionnellement mais dégradé ; conservé comme **repli**, pas comme choix par défaut |
| **WebSocket natif dans Next** | Support moins direct que SSE dans l'App Router ; surdimensionné pour un besoin unidirectionnel |

## Références

- `@.kiro/specs/katalyst/design.md` §6
- `@.kiro/specs/katalyst/tasks.md` phases 11, 13
- Spike associé : `tasks.md` §Spikes
