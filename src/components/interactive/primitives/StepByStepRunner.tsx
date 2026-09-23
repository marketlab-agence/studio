'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Lightbulb, RotateCcw, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLessonTrace } from '@/hooks/useLessonTrace';

/**
 * `StepByStepRunner` — primitive générique d'**exécution guidée** (niveau Bloom : Appliquer).
 *
 * ⚠️ **Primitive, pas composant de domaine.** Elle ne sait rien de Git, de n8n ou du closing :
 * elle reçoit une **procédure** (des étapes, chacune avec une réponse attendue) et la fait
 * exécuter. C'est ce qui la rend réutilisable : `GitCommandSimulator` en sera une
 * **configuration** (une procédure Git), pas un composant distinct.
 *
 * Voir `@docs/katalyst/primitives-pedagogiques.md` — règle d'admissibilité : « pertinent pour
 * au moins 3 formations distinctes, sans modification de code ».
 *
 * ⚠️ **Conformité (indicateur 19).** Chaque étape validée produit une **trace d'interaction**
 * (`useLessonTrace`) : c'est ce qui permet à l'organisme de prouver *« l'effectivité du suivi
 * à distance »*. Sans cette trace, l'apprenant pourrait avoir « tout vu » sans rien produire —
 * et l'audit ne pourrait pas le distinguer.
 */

export interface ProcedureStep {
  /** Identifiant stable de l'étape (pour la trace et la reprise). */
  id: string;
  /** Consigne affichée à l'apprenant. */
  instruction: string;
  /** Réponse attendue, si l'étape exige une saisie. */
  expected?: string;
  /**
   * Indice affiché en cas d'erreur.
   * ⚠️ Distinct de la réponse : l'indice guide, il ne donne pas la solution.
   */
  hint?: string;
  /** Explication affichée **après** la réussite — c'est le moment pédagogique. */
  explanation?: string;
}

export interface StepByStepRunnerProps {
  /** Titre de la procédure (« Mettre en place un workflow n8n »…). */
  title: string;
  /** Description ou contexte. */
  description?: string;
  /** Les étapes à exécuter, dans l'ordre. */
  steps: ProcedureStep[];
  /** Identifiant de la leçon — nécessaire à la trace. */
  lessonId: string;
  /** Message final, affiché quand toutes les étapes sont validées. */
  completionMessage?: string;
}

type StepState = 'pending' | 'current' | 'done';

export function StepByStepRunner({
  title,
  description,
  steps,
  lessonId,
  completionMessage = 'Procédure terminée. Les étapes sont maîtrisées.',
}: StepByStepRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const { recordStep, recordDuration } = useLessonTrace({ lessonId, componentName: 'StepByStepRunner' });

  const step = steps[currentIndex];
  const isFinished = currentIndex >= steps.length;

  const stepStates = useMemo<Record<string, StepState>>(
    () =>
      Object.fromEntries(
        steps.map((candidate, index) => [
          candidate.id,
          completed.has(candidate.id) ? 'done' : index === currentIndex ? 'current' : 'pending',
        ]),
      ),
    [steps, completed, currentIndex],
  );

  /** Normalise une réponse : la casse et les espaces ne doivent pas faire échouer. */
  const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();

  const validate = useCallback(() => {
    if (!step) return;

    // Une étape sans réponse attendue est une étape de **lecture** : la consulter suffit.
    const expected = step.expected;
    const correct = !expected || normalize(answer) === normalize(expected);

    if (!correct) {
      setError('Ce n’est pas la réponse attendue. Un indice est disponible.');
      // La tentative échouée est tracée : c'est une donnée précieuse pour l'encadrant, qui
      // voit ainsi **où** l'apprenant bloque.
      void recordStep({
        stepId: step.id,
        outcome: 'FAILURE',
        payload: { answer },
      });
      return;
    }

    void recordStep({
      stepId: step.id,
      outcome: 'SUCCESS',
      payload: { answer: expected ?? null },
    });

    setCompleted((previous) => new Set(previous).add(step.id));
    setError(null);
    setShowHint(false);
    setAnswer('');
    setCurrentIndex((index) => index + 1);

    // Fin de procédure : on enregistre la durée totale d'interaction, mesure la plus directe
    // de l'effectivité du suivi (indicateur 19).
    if (currentIndex + 1 >= steps.length) {
      void recordDuration();
    }
  }, [step, answer, currentIndex, steps.length, recordStep, recordDuration]);

  const restart = useCallback(() => {
    setCurrentIndex(0);
    setAnswer('');
    setError(null);
    setShowHint(false);
    setCompleted(new Set());
  }, []);

  if (steps.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Aucune étape n’est définie pour cette procédure.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-4">
          <span>{title}</span>
          <Badge variant="secondary">
            {completed.size}/{steps.length}
          </Badge>
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progression : chaque étape montre son état. L'apprenant sait où il en est. */}
        <ol className="space-y-2" aria-label="Étapes de la procédure">
          {steps.map((candidate, index) => {
            const state = stepStates[candidate.id];
            return (
              <li
                key={candidate.id}
                className={cn(
                  'flex items-start gap-2 text-sm',
                  state === 'done' && 'text-muted-foreground',
                  state === 'current' && 'font-medium',
                )}
              >
                {state === 'done' ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                ) : (
                  <Circle
                    className={cn(
                      'mt-0.5 h-4 w-4 shrink-0',
                      state === 'current' ? 'text-primary' : 'text-muted-foreground',
                    )}
                    aria-hidden="true"
                  />
                )}
                <span>
                  <span className="sr-only">
                    {state === 'done' ? 'Terminée : ' : state === 'current' ? 'En cours : ' : 'À venir : '}
                  </span>
                  {index + 1}. {candidate.instruction}
                </span>
              </li>
            );
          })}
        </ol>

        {/* Étape courante */}
        {!isFinished && step && (
          <div className="space-y-3 rounded-md border p-4">
            <Label htmlFor="step-answer">
              {step.expected ? 'Votre réponse' : 'Étape de lecture — validez pour continuer'}
            </Label>

            {step.expected && (
              <Input
                id="step-answer"
                value={answer}
                onChange={(event) => {
                  setAnswer(event.target.value);
                  setError(null);
                }}
                // Entrée valide l'étape : c'est le geste naturel dans une procédure.
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    validate();
                  }
                }}
                autoComplete="off"
                aria-describedby={error ? 'step-error' : undefined}
              />
            )}

            {error && (
              <p id="step-error" role="alert" className="flex items-center gap-2 text-sm text-destructive">
                <XCircle className="h-4 w-4" aria-hidden="true" />
                {error}
              </p>
            )}

            {showHint && step.hint && (
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {step.hint}
              </p>
            )}

            <div className="flex flex-wrap gap-2">
              <Button onClick={validate}>Valider l’étape</Button>
              {step.hint && !showHint && (
                <Button variant="ghost" onClick={() => setShowHint(true)}>
                  Voir un indice
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Fin de procédure */}
        {isFinished && (
          <div className="space-y-3 rounded-md border border-primary/30 bg-primary/5 p-4">
            <p className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
              {completionMessage}
            </p>
            <Button variant="outline" onClick={restart}>
              <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
              Refaire la procédure
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
