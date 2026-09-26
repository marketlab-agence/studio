'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLessonTrace } from '@/hooks/useLessonTrace';
import { fusionnerLibelles, type ComponentConfig } from '@/lib/schemas/component-config';

/**
 * `GuidedProcedure` — primitive de **checklist ordonnée** (niveau Bloom : Appliquer).
 *
 * ⚠️ **Différence avec `StepByStepRunner`** — elle est réelle et justifie deux primitives :
 * - `StepByStepRunner` **exige une réponse** à chaque étape (exécuter une commande, calculer) ;
 * - `GuidedProcedure` demande de **cocher des actions sans réponse saisie** (vérifier, préparer,
 *   s'assurer que…). Imposer une saisie là où il n'y a rien à saisir créerait de la friction
 *   sans valeur pédagogique.
 *
 * Source REWORK : `@docs/rework/exercices.md` — exercice 4 (déroulé pédagogique), qui exige une
 * **séquence ordonnée**. Et `@docs/rework/formats.md` §4 : le pipeline à gates, où chaque étape
 * ne peut être franchie sans la précédente.
 *
 * ⚠️ **L'ordre est la contrainte pédagogique.** On ne peut cocher l'étape *n* qu'après la
 * *n-1* : c'est ce qui distingue une procédure d'une simple liste.
 */

export interface ProcedureCheckpoint {
  id: string;
  /** Libellé de l'action à effectuer. */
  label: string;
  /** Précision affichée sous le libellé (critère, avertissement…). */
  detail?: string;
  /**
   * Point de contrôle : une information à relever, sans « action » à cocher.
   * `undefined` = simple case à cocher.
   */
  requiresInput?: boolean;
}

export interface GuidedProcedureProps {
  title: string;
  description?: string;
  checkpoints: ProcedureCheckpoint[];
  lessonId: string;
  /** Configuration de l'instance (libellés, données). Facultative. */
  config?: ComponentConfig;
}

export function GuidedProcedure({
  title,
  description,
  checkpoints,
  lessonId,
  config,
}: GuidedProcedureProps) {
  // ⚠️ Les libellés personnalisés priment, mot par mot ; sans configuration, les défauts restent.
  const libelles = fusionnerLibelles(
    { title: title ?? 'Procédure guidée', description: description ?? '' },
    config?.labels,
  );

  // ⚠️ Repli `config?.data ?? props` : une instance sans données rend comme aujourd'hui.
  const donnees = config?.data as { checkpoints?: ProcedureCheckpoint[] } | undefined;
  const points = donnees?.checkpoints ?? checkpoints;

  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [values, setValues] = useState<Record<string, string>>({});

  const { recordStep, recordDuration } = useLessonTrace({ lessonId, componentName: 'GuidedProcedure' });

  /**
   * Prochaine étape **autorisée** : la première non cochée.
   * ⚠️ Les suivantes sont désactivées — c'est la contrainte d'ordre, pas un simple confort.
   */
  const nextIndex = useMemo(
    () => points.findIndex((checkpoint) => !checkedIds.has(checkpoint.id)),
    [points, checkedIds],
  );

  const isFinished = nextIndex === -1;

  const toggle = useCallback(
    (checkpointId: string, checked: boolean) => {
      const checkpoint = points.find((candidate) => candidate.id === checkpointId);
      if (!checkpoint) return;

      if (!checked) {
        // Décocher est permis : l'apprenant peut se raviser.
        setCheckedIds((previous) => {
          const next = new Set(previous);
          next.delete(checkpointId);
          return next;
        });
        return;
      }

      setCheckedIds((previous) => new Set(previous).add(checkpointId));

      void recordStep({
        stepId: checkpointId,
        kind: 'STEP_COMPLETED',
        outcome: 'SUCCESS',
        payload: {
          // La valeur relevée, si le point de contrôle en exige une.
          value: values[checkpointId] ?? null,
        },
      });

      if (checkedIds.size + 1 >= points.length) {
        void recordDuration();
      }
    },
    [points, checkedIds.size, values, recordStep, recordDuration],
  );

  const restart = useCallback(() => {
    setCheckedIds(new Set());
    setValues({});
  }, []);

  if (points.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Aucun point de contrôle n’est défini.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-4">
          <span>{libelles.title}</span>
          <Badge variant={isFinished ? 'default' : 'secondary'}>
            {checkedIds.size}/{points.length}
          </Badge>
        </CardTitle>
        {libelles.description && <CardDescription>{libelles.description}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-4">
        <ol className="space-y-3" aria-label="Points de contrôle">
          {points.map((checkpoint, index) => {
            const checked = checkedIds.has(checkpoint.id);
            // Une étape est accessible si elle est déjà cochée, ou si c'est la prochaine.
            const accessible = checked || index === nextIndex;

            return (
              <li
                key={checkpoint.id}
                className={cn(
                  'rounded-md border p-3 transition-colors',
                  !accessible && 'opacity-50',
                  checked && 'border-primary/30 bg-primary/5',
                )}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={`checkpoint-${checkpoint.id}`}
                    checked={checked}
                    disabled={!accessible}
                    onCheckedChange={(value) => toggle(checkpoint.id, value === true)}
                    className="mt-0.5"
                  />

                  <div className="min-w-0 flex-1 space-y-1">
                    <Label
                      htmlFor={`checkpoint-${checkpoint.id}`}
                      className={cn(
                        'flex items-start gap-2 text-sm',
                        accessible ? 'cursor-pointer' : 'cursor-not-allowed',
                      )}
                    >
                      <span className="text-muted-foreground">{index + 1}.</span>
                      <span>
                        {checkpoint.label}
                        {checked && <CheckCircle2 className="ml-2 inline h-4 w-4 text-primary" aria-hidden="true" />}
                      </span>
                    </Label>

                    {checkpoint.detail && (
                      <p className="text-xs text-muted-foreground">{checkpoint.detail}</p>
                    )}

                    {/* Point de contrôle à relever : la valeur sert de trace d'exécution. */}
                    {checkpoint.requiresInput && accessible && !checked && (
                      <input
                        type="text"
                        value={values[checkpoint.id] ?? ''}
                        onChange={(event) =>
                          setValues((previous) => ({ ...previous, [checkpoint.id]: event.target.value }))
                        }
                        placeholder="À relever…"
                        className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                        aria-label={`Valeur à relever pour : ${checkpoint.label}`}
                      />
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        {isFinished && (
          <div className="space-y-2 rounded-md border border-primary/30 bg-primary/5 p-3">
            <p className="text-sm font-medium">Procédure complète. Tous les points ont été vérifiés.</p>
            <Button variant="outline" size="sm" onClick={restart}>
              <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
              Refaire
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
