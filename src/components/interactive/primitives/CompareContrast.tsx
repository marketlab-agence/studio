'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Scale, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLessonTrace } from '@/hooks/useLessonTrace';

/**
 * `CompareContrast` — primitive de **comparaison** (niveau Bloom : Analyser).
 *
 * ⚠️ **Primitive, pas composant de domaine.** Elle compare deux **options** fournies en
 * données, selon des **critères** fournis en données. Elle ne sait rien du fast-forward vs
 * merge commit, ni de GitFlow vs trunk-based.
 *
 * Source REWORK : `@docs/rework/exercices.md` — exercice 12 (fiche réflexe SAVI), qui demande
 * de comparer des conduites possibles. Et `@docs/rework/methodes.md` §3 : le modèle
 * **adversarial** (Créatif propose / Critique évalue), dont la comparaison est la forme
 * simplifiée.
 *
 * ⚠️ **Différence avec `SortingGame`** (Comprendre) : trier, c'est ranger selon une catégorie
 * *donnée*. Comparer, c'est **établir soi-même** les différences selon des critères — et
 * c'est ce qui en fait un exercice d'**analyse**.
 *
 * ⚠️ **Ce que l'apprenant produit** : les écarts, critère par critère. Chaque critère renseigné
 * est une trace d'appropriation (indicateur 19).
 */

export interface ComparisonCriterion {
  id: string;
  /** Nom du critère de comparaison (« Coût », « Réversibilité », « Courbe d'apprentissage »…). */
  label: string;
  /**
   * Ce qu'il faut observer pour ce critère — guide la comparaison sans la donner.
   * ⚠️ Un critère sans indication laisse l'apprenant deviner ce qu'on attend de lui.
   */
  guidance?: string;
}

export interface ComparisonOption {
  id: string;
  label: string;
  description?: string;
}

export interface CompareContrastProps {
  title: string;
  description?: string;
  optionA: ComparisonOption;
  optionB: ComparisonOption;
  criteria: ComparisonCriterion[];
  /** Conclusion attendue, si elle est vérifiable. Sinon, l'analyse seule est évaluée. */
  expectedConclusion?: string;
  lessonId: string;
}

export function CompareContrast({
  title,
  description,
  optionA,
  optionB,
  criteria,
  expectedConclusion,
  lessonId,
}: CompareContrastProps) {
  /** Observations de l'apprenant, par critère et par option. */
  const [observations, setObservations] = useState<Record<string, { a: string; b: string }>>({});
  const [conclusion, setConclusion] = useState('');
  const [validated, setValidated] = useState(false);

  const { recordStep, recordProduction } = useLessonTrace({ lessonId, componentName: 'CompareContrast' });

  /** Nombre de critères renseignés **des deux côtés** — la condition pour un vrai comparatif. */
  const filledCriteria = useMemo(
    () =>
      criteria.filter(
        (criterion) =>
          (observations[criterion.id]?.a ?? '').trim().length > 0 &&
          (observations[criterion.id]?.b ?? '').trim().length > 0,
      ).length,
    [criteria, observations],
  );

  const canValidate = filledCriteria === criteria.length && conclusion.trim().length > 0;

  const update = useCallback((criterionId: string, side: 'a' | 'b', value: string) => {
    setObservations((previous) => {
      // ⚠️ Les valeurs par défaut viennent **avant** la valeur existante : les placer après
      // écraseraient la saisie que l'apprenant vient de faire.
      const current = previous[criterionId] ?? { a: '', b: '' };
      return {
        ...previous,
        [criterionId]: { ...current, [side]: value },
      };
    });
  }, []);

  const validate = useCallback(() => {
    // La production est enregistrée comme trace : c'est la **démarche d'analyse** que
    // l'encadrant doit pouvoir examiner, pas seulement une note.
    void recordProduction({
      criteriaCount: criteria.length,
      criteriaFilled: filledCriteria,
      conclusionLength: conclusion.trim().length,
      observations,
    });

    void recordStep({
      stepId: 'comparison',
      kind: 'ANSWER',
      outcome: filledCriteria === criteria.length ? 'SUCCESS' : 'PARTIAL',
      payload: { criteriaFilled: filledCriteria, criteriaTotal: criteria.length },
    });

    setValidated(true);
  }, [criteria.length, filledCriteria, conclusion, observations, recordProduction, recordStep]);

  const restart = useCallback(() => {
    setObservations({});
    setConclusion('');
    setValidated(false);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" aria-hidden="true" />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Présentation des deux options */}
        <div className="grid gap-3 sm:grid-cols-2">
          {[optionA, optionB].map((option) => (
            <div key={option.id} className="rounded-md border p-3">
              <p className="text-sm font-medium">{option.label}</p>
              {option.description && (
                <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
              )}
            </div>
          ))}
        </div>

        {/* Comparatif, critère par critère */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Compare selon chaque critère</Label>
            <span className="text-xs text-muted-foreground">
              {filledCriteria}/{criteria.length} renseigné(s)
            </span>
          </div>

          {criteria.map((criterion, index) => (
            <div key={criterion.id} className="space-y-2 rounded-md border p-3">
              <div className="flex items-start gap-2">
                <span className={cn('text-xs text-muted-foreground', 'mt-0.5')}>{index + 1}.</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{criterion.label}</p>
                  {criterion.guidance && (
                    <p className="text-xs text-muted-foreground">{criterion.guidance}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Textarea
                  value={observations[criterion.id]?.a ?? ''}
                  onChange={(event) => update(criterion.id, 'a', event.target.value)}
                  placeholder={`${optionA.label}…`}
                  rows={2}
                  disabled={validated}
                  aria-label={`${optionA.label} — ${criterion.label}`}
                />
                <Textarea
                  value={observations[criterion.id]?.b ?? ''}
                  onChange={(event) => update(criterion.id, 'b', event.target.value)}
                  placeholder={`${optionB.label}…`}
                  rows={2}
                  disabled={validated}
                  aria-label={`${optionB.label} — ${criterion.label}`}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Conclusion : l'acte d'analyse abouti */}
        <div className="space-y-2">
          <Label htmlFor="comparison-conclusion" className="text-sm font-medium">
            Quelle option retiendrais-tu, et pourquoi ?
          </Label>
          <Textarea
            id="comparison-conclusion"
            value={conclusion}
            onChange={(event) => setConclusion(event.target.value)}
            placeholder="Appuie-toi sur les écarts que tu as relevés…"
            rows={3}
            disabled={validated}
          />
        </div>

        {!validated ? (
          <Button onClick={validate} disabled={!canValidate}>
            Valider la comparaison
          </Button>
        ) : (
          <div className="space-y-3 rounded-md border border-primary/30 bg-primary/5 p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
              Comparaison enregistrée.
            </p>

            <p className="text-xs text-muted-foreground">
              {filledCriteria === criteria.length
                ? 'Tous les critères ont été examinés : le comparatif est complet.'
                : `${filledCriteria} critère(s) sur ${criteria.length} ont été renseignés.`}
            </p>

            {/* La conclusion attendue n'est révélée qu'après : la donner avant orienterait
                l'analyse, ce qui viderait l'exercice de sa valeur. */}
            {expectedConclusion && (
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Éléments attendus :</span> {expectedConclusion}
              </p>
            )}

            <Button variant="outline" size="sm" onClick={restart}>
              Refaire la comparaison
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
