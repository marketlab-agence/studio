'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLessonTrace } from '@/hooks/useLessonTrace';

/**
 * `MatchingPairs` — primitive d'**appariement** (niveau Bloom : Comprendre).
 *
 * ⚠️ **Primitive, pas composant de domaine.** Elle apparie deux séries fournies en **données** :
 * un terme et sa définition, une commande et son effet, une objection et sa réponse. Elle ne
 * sait rien du sujet.
 *
 * Source REWORK : `@docs/rework/exercices.md` — exercice 8, famille « Quiz / QCM », qui
 * mentionne explicitement les **questions d'appariement**. Apparier est l'acte cognitif de
 * « Comprendre » : relier deux représentations d'une même notion.
 *
 * ⚠️ **Différence avec `SortingGame`** : `SortingGame` range des éléments dans des
 * **catégories** (plusieurs par catégorie) ; `MatchingPairs` relie des **paires uniques**.
 * La nuance est réelle : « classer des outils par famille » n'est pas « associer chaque outil
 * à son usage ».
 */

export interface MatchingPair {
  id: string;
  /** Premier terme de la paire (affiché à gauche). */
  left: string;
  /** Second terme de la paire (affiché à droite, mélangé). */
  right: string;
  /** Explication affichée une fois la paire trouvée. */
  explanation?: string;
}

export interface MatchingPairsProps {
  title: string;
  description?: string;
  pairs: MatchingPair[];
  lessonId: string;
}

export function MatchingPairs({ title, description, pairs, lessonId }: MatchingPairsProps) {
  const [selectedLeftId, setSelectedLeftId] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [lastError, setLastError] = useState<{ left: string; right: string } | null>(null);

  const { recordStep } = useLessonTrace({ lessonId, componentName: 'MatchingPairs' });

  /**
   * Colonne de droite **mélangée**.
   *
   * ⚠️ Le mélange est **stable** (calculé une fois via `useState` initial) : un mélange
   * recalculé à chaque rendu ferait sauter les éléments pendant que l'apprenant clique.
   */
  const [shuffledRights] = useState(() => {
    const rights = pairs.map((pair) => ({ id: pair.id, label: pair.right }));
    for (let index = rights.length - 1; index > 0; index--) {
      const swap = Math.floor(Math.random() * (index + 1));
      [rights[index], rights[swap]] = [rights[swap], rights[index]];
    }
    return rights;
  });

  const isFinished = matchedIds.size === pairs.length;

  const selectedLeft = useMemo(
    () => pairs.find((pair) => pair.id === selectedLeftId) ?? null,
    [pairs, selectedLeftId],
  );

  const tryMatch = useCallback(
    (rightId: string) => {
      if (!selectedLeftId) return;

      const correct = selectedLeftId === rightId;

      void recordStep({
        stepId: selectedLeftId,
        kind: 'ANSWER',
        outcome: correct ? 'SUCCESS' : 'FAILURE',
        payload: { chosenRight: rightId },
      });

      if (correct) {
        setMatchedIds((previous) => new Set(previous).add(selectedLeftId));
        setLastError(null);
      } else {
        // ⚠️ L'erreur est **signalée** puis effacée au coup suivant : contrairement au tri, un
        // appariement raté n'a pas de « place » où rester. Le message suffit — et la trace le
        // conserve.
        setLastError({ left: selectedLeftId, right: rightId });
      }

      setSelectedLeftId(null);
    },
    [selectedLeftId, recordStep],
  );

  const restart = useCallback(() => {
    setMatchedIds(new Set());
    setSelectedLeftId(null);
    setLastError(null);
  }, []);

  if (pairs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Aucune paire n’est définie.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-4">
          <span>{title}</span>
          <Badge variant={isFinished ? 'default' : 'secondary'}>
            {matchedIds.size}/{pairs.length}
          </Badge>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm font-medium">
          {isFinished
            ? 'Toutes les paires sont associées.'
            : 'Sélectionne un terme à gauche, puis son correspondant à droite.'}
        </p>

        {lastError && (
          <p role="alert" className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-sm text-destructive">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            Ces deux éléments ne vont pas ensemble. Cherche une autre correspondance.
          </p>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Colonne gauche : les termes */}
          <div className="space-y-2" role="group" aria-label="Termes">
            {pairs.map((pair) => {
              const matched = matchedIds.has(pair.id);
              return (
                <Button
                  key={pair.id}
                  variant={selectedLeftId === pair.id ? 'default' : 'outline'}
                  className={cn('w-full justify-start', matched && 'border-primary text-muted-foreground')}
                  disabled={matched}
                  onClick={() => setSelectedLeftId(pair.id)}
                  aria-pressed={selectedLeftId === pair.id}
                >
                  {matched && <CheckCircle2 className="mr-2 h-4 w-4 text-primary" aria-hidden="true" />}
                  {pair.left}
                </Button>
              );
            })}
          </div>

          {/* Colonne droite : les correspondances, mélangées */}
          <div className="space-y-2" role="group" aria-label="Correspondances">
            {shuffledRights.map((right) => {
              const matched = matchedIds.has(right.id);
              return (
                <Button
                  key={right.id}
                  variant="outline"
                  className={cn('w-full justify-start', matched && 'border-primary text-muted-foreground')}
                  disabled={matched || !selectedLeftId}
                  onClick={() => tryMatch(right.id)}
                >
                  {matched && <CheckCircle2 className="mr-2 h-4 w-4 text-primary" aria-hidden="true" />}
                  {right.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Explications : affichées une fois les paires trouvées — le moment pédagogique. */}
        {isFinished && (
          <div className="space-y-2 rounded-md border border-primary/30 bg-primary/5 p-3">
            <p className="text-sm font-medium">Toutes les paires sont associées.</p>
            <ul className="space-y-1">
              {pairs
                .filter((pair) => pair.explanation)
                .map((pair) => (
                  <li key={pair.id} className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{pair.left} :</span> {pair.explanation}
                  </li>
                ))}
            </ul>
            <Button variant="outline" size="sm" onClick={restart}>
              <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
              Recommencer
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
