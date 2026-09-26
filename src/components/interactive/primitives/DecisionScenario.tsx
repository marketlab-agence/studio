'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Gavel, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLessonTrace } from '@/hooks/useLessonTrace';
import { fusionnerLibelles, type ComponentConfig } from '@/lib/schemas/component-config';

/**
 * `DecisionScenario` — primitive d'**arbitrage** (niveau Bloom : Évaluer).
 *
 * ⚠️ **Primitive, pas composant de domaine.** Elle présente un **scénario** et des **options**
 * fournies en données, chacune portant ses **avantages et inconvénients**. Elle ne sait rien
 * du choix entre deux stratégies de fusion, ni de la priorisation d'un budget.
 *
 * Source REWORK : `@docs/rework/exercices.md` — exercice 12 (fiche réflexe SAVI) : face à une
 * situation difficile, il faut **choisir** une conduite et la justifier. Et `@docs/rework/formats.md`
 * §4 : le pipeline à gates, où franchir une étape est un **arbitrage**.
 *
 * ⚠️ **Ce qui distingue cette primitive de `CaseDiagnosis`** (Analyser) :
 * - `CaseDiagnosis` cherche **la** cause (une réponse juste) ;
 * - `DecisionScenario` admet **plusieurs bonnes réponses** — c'est la **justification** qui est
 *   évaluée, pas le choix. C'est précisément ce qui en fait un exercice d'**évaluation**, où
 *   l'apprenant juge selon des critères.
 */

export interface DecisionOption {
  id: string;
  label: string;
  /** Points favorables — affichés pour nourrir l'arbitrage. */
  pros?: string[];
  /** Points défavorables. */
  cons?: string[];
  /**
   * Qualité de l'option au regard du scénario.
   * ⚠️ `null` = option défendable, sans être la meilleure : c'est le cas réaliste, et il doit
   * exister pour que le choix soit un vrai arbitrage et non une élimination évidente.
   */
  quality?: 'best' | 'acceptable' | 'poor' | null;
  /** Ce que ce choix implique — révélé après validation. */
  feedback?: string;
}

export interface DecisionScenarioProps {
  title: string;
  description?: string;
  /** Contexte et contraintes de la décision. */
  scenario: string;
  options: DecisionOption[];
  /** Longueur minimale de la justification (en caractères), pour éviter le « oui » de complaisance. */
  minJustificationLength?: number;
  lessonId: string;
  /** Configuration de l'instance (libellés, données). Facultative. */
  config?: ComponentConfig;
}

export function DecisionScenario({
  title,
  description,
  scenario,
  options,
  minJustificationLength = 40,
  lessonId,
  config,
}: DecisionScenarioProps) {
  // ⚠️ Les libellés personnalisés priment, mot par mot ; sans configuration, les défauts restent.
  const libelles = fusionnerLibelles(
    { title: title ?? 'Scénario de décision', description: description ?? '' },
    config?.labels,
  );

  // ⚠️ Repli `config?.data ?? props` : une instance sans données rend comme aujourd'hui.
  const donnees = config?.data as { scenario?: string; options?: DecisionOption[] } | undefined;
  const scenarioEffectif = donnees?.scenario ?? scenario;
  const choix = donnees?.options ?? options;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [justification, setJustification] = useState('');
  const [validated, setValidated] = useState(false);

  const { recordStep, recordProduction } = useLessonTrace({ lessonId, componentName: 'DecisionScenario' });

  const selected = useMemo(
    () => choix.find((option) => option.id === selectedId) ?? null,
    [choix, selectedId],
  );

  const justificationOk = justification.trim().length >= minJustificationLength;
  const canValidate = Boolean(selectedId) && justificationOk;

  const validate = useCallback(() => {
    if (!selectedId || !selected) return;

    // ⚠️ Deux traces distinctes, car elles mesurent deux choses :
    // - `recordStep` : quelle option a été retenue, et sa qualité ;
    // - `recordProduction` : la **justification**, qui est le véritable objet d'évaluation.
    //   Un apprenant qui choisit la « bonne » option sans savoir pourquoi n'a rien évalué.
    void recordStep({
      stepId: 'decision',
      kind: 'ANSWER',
      outcome: selected.quality === 'best' ? 'SUCCESS' : selected.quality === 'poor' ? 'FAILURE' : 'PARTIAL',
      payload: { optionId: selectedId, quality: selected.quality ?? null },
    });

    void recordProduction({
      optionId: selectedId,
      justificationLength: justification.trim().length,
      justification,
    });

    setValidated(true);
  }, [selectedId, selected, justification, recordStep, recordProduction]);

  const restart = useCallback(() => {
    setSelectedId(null);
    setJustification('');
    setValidated(false);
  }, []);

  if (choix.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Aucune option n’est définie.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gavel className="h-5 w-5 text-primary" aria-hidden="true" />
          {libelles.title}
        </CardTitle>
        {libelles.description && <CardDescription>{libelles.description}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="rounded-md border bg-muted/40 p-4">
          <p className="text-sm font-medium">Scénario</p>
          <p className="mt-1 text-sm leading-relaxed">{scenarioEffectif}</p>
        </div>

        {/* Options avec leurs avantages et inconvénients : l'arbitrage doit être informé. */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Quelle décision prends-tu ?</Label>

          {choix.map((option) => {
            const isSelected = selectedId === option.id;
            const isBest = option.quality === 'best';

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => !validated && setSelectedId(option.id)}
                disabled={validated}
                aria-pressed={isSelected}
                className={cn(
                  'w-full rounded-md border p-3 text-left transition-colors',
                  isSelected && 'border-primary bg-primary/5',
                  validated && isBest && 'border-primary bg-primary/10',
                  validated && isSelected && !isBest && option.quality === 'poor' && 'border-destructive bg-destructive/5',
                  !validated && 'hover:border-primary/60',
                )}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  {validated && isBest && <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />}
                  {option.label}
                </span>

                {/* Avantages et inconvénients sont **toujours** visibles : un arbitrage sans
                    information ne serait qu'un pari. */}
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {option.pros && option.pros.length > 0 && (
                    <ul className="space-y-0.5">
                      {option.pros.map((pro) => (
                        <li key={pro} className="text-xs text-muted-foreground">
                          <span className="text-primary">+</span> {pro}
                        </li>
                      ))}
                    </ul>
                  )}
                  {option.cons && option.cons.length > 0 && (
                    <ul className="space-y-0.5">
                      {option.cons.map((con) => (
                        <li key={con} className="text-xs text-muted-foreground">
                          <span className="text-destructive">−</span> {con}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Retour révélé après validation seulement. */}
                {validated && option.feedback && (
                  <p
                    className={cn(
                      'mt-2 border-t pt-2 text-xs',
                      isBest ? 'text-muted-foreground' : 'text-destructive',
                    )}
                  >
                    {option.feedback}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {/* Justification : c'est elle qui est évaluée. */}
        <div className="space-y-2">
          <Label htmlFor="decision-justification" className="text-sm font-medium">
            Justifie ta décision
          </Label>
          <Textarea
            id="decision-justification"
            value={justification}
            onChange={(event) => setJustification(event.target.value)}
            placeholder="Quels compromis acceptes-tu ? Sur quels critères tranches-tu ?"
            rows={3}
            disabled={validated}
            aria-describedby="decision-justification-help"
          />
          <p id="decision-justification-help" className="text-xs text-muted-foreground">
            {validated
              ? `${justification.trim().length} caractère(s) de justification enregistré(s).`
              : `Au moins ${minJustificationLength} caractères — la justification compte autant que le choix.`}
          </p>
        </div>

        {!validated ? (
          <Button onClick={validate} disabled={!canValidate}>
            Valider la décision
          </Button>
        ) : (
          <div className="space-y-3 rounded-md border border-primary/30 bg-primary/5 p-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="h-4 w-4 text-primary" aria-hidden="true" />
              Décision enregistrée.
            </p>

            {/* ⚠️ Un choix « acceptable » n'est PAS présenté comme un échec : plusieurs
                décisions peuvent se défendre, et les traiter comme fautives découragerait
                l'arbitrage — l'inverse de ce qu'on cherche à enseigner. */}
            {selected?.quality === 'acceptable' && (
              <p className="text-xs text-muted-foreground">
                Ton choix se défend : ce n’est pas la solution la plus directe, mais elle reste
                valable. Compare-la à celle qui est mise en avant.
              </p>
            )}

            <Button variant="outline" size="sm" onClick={restart}>
              Refaire l’arbitrage
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
