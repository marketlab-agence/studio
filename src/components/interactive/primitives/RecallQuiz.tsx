'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, HelpCircle, RotateCcw, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLessonTrace } from '@/hooks/useLessonTrace';
import { fusionnerLibelles, type ComponentConfig } from '@/lib/schemas/component-config';

/**
 * `RecallQuiz` — primitive de **restitution** (niveau Bloom : Connaître).
 *
 * ⚠️ **Primitive, pas composant de domaine.** Elle reçoit ses questions en **données** et ne
 * connaît aucun sujet.
 *
 * ⚠️ **Relation avec `QuizView`.** `QuizView` (340 lignes) est aussi un quiz, mais il est
 * **câblé au contexte de formation** (`useTutorial`) : il gère la progression du chapitre, la
 * navigation vers la leçon suivante, les tentatives persistées. C'est un composant d'**écran**,
 * pas une primitive réutilisable.
 *
 * `RecallQuiz` est la version **autonome** : elle ne connaît ni le contexte, ni le chapitre,
 * et produit sa propre trace. C'est ce qui la rend sélectionnable par l'IA — et elle couvre le
 * niveau « Connaître », qui n'avait qu'une seule primitive.
 *
 * Source REWORK : `@docs/rework/exercices.md` — exercices 8 et 9 (quiz d'évaluation, quiz avec
 * Quiz Wizard). Les deux sont des quiz ; la différence entre eux n'est que **l'outil**, pas la
 * structure pédagogique.
 *
 * ⚠️ **Différence avec `FlashcardDrill`** : la carte se révèle, le quiz **se répond** et donne
 * une note. L'un est de la reconnaissance, l'autre de la restitution — deux actes distincts.
 */

export interface RecallQuestion {
  id: string;
  text: string;
  answers: { id: string; text: string; isCorrect: boolean }[];
  /** Choix multiple autorisé : l'apprenant doit cocher toutes les bonnes réponses. */
  isMultipleChoice?: boolean;
  /** Explication affichée après réponse — le moment pédagogique. */
  explanation?: string;
}

export interface RecallQuizProps {
  title: string;
  description?: string;
  questions: RecallQuestion[];
  /** Seuil de réussite en pourcentage. Défaut 80 — valeur REWORK. */
  passingScore?: number;
  lessonId: string;
  /** Configuration de l'instance (libellés, données). Facultative. */
  config?: ComponentConfig;
}

export function RecallQuiz({
  title,
  description,
  questions,
  passingScore = 80,
  lessonId,
  config,
}: RecallQuizProps) {
  // ⚠️ Les libellés personnalisés priment, mot par mot ; sans configuration, les défauts restent.
  const libelles = fusionnerLibelles(
    { title: title ?? 'Quiz de rappel', description: description ?? '' },
    config?.labels,
  );

  // ⚠️ Repli `config?.data ?? props` : une instance sans données rend comme aujourd'hui.
  const donnees = config?.data as { questions?: RecallQuestion[] } | undefined;
  const questionsEffectives = donnees?.questions ?? questions;

  const [answersByQuestion, setAnswersByQuestion] = useState<Record<string, string[]>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  /** Réponses **figées** au moment de la validation : on ne modifie pas après coup. */
  const [locked, setLocked] = useState<Set<string>>(new Set());
  const [finished, setFinished] = useState(false);

  const { recordStep, recordDuration } = useLessonTrace({ lessonId, componentName: 'RecallQuiz' });

  const question = questionsEffectives[currentIndex];
  const answeredCount = locked.size;

  const score = useMemo(() => {
    if (questionsEffectives.length === 0) return 0;

    const correct = questionsEffectives.filter((candidate) => {
      const given = [...(answersByQuestion[candidate.id] ?? [])].sort();
      const expected = candidate.answers
        .filter((answer) => answer.isCorrect)
        .map((answer) => answer.id)
        .sort();

      return given.length === expected.length && given.every((value, index) => value === expected[index]);
    }).length;

    return Math.round((correct / questionsEffectives.length) * 100);
  }, [questionsEffectives, answersByQuestion]);

  const passed = score >= passingScore;

  const selectAnswer = useCallback(
    (questionId: string, answerId: string, multiple: boolean) => {
      if (locked.has(questionId)) return;

      setAnswersByQuestion((previous) => {
        const current = previous[questionId] ?? [];

        if (!multiple) return { ...previous, [questionId]: [answerId] };

        return {
          ...previous,
          [questionId]: current.includes(answerId)
            ? current.filter((value) => value !== answerId)
            : [...current, answerId],
        };
      });
    },
    [locked],
  );

  const validateQuestion = useCallback(() => {
    if (!question) return;

    const given = [...(answersByQuestion[question.id] ?? [])].sort();
    const expected = question.answers.filter((answer) => answer.isCorrect).map((answer) => answer.id).sort();
    const correct = given.length === expected.length && given.every((value, index) => value === expected[index]);

    // ⚠️ Réponse ET résultat sont tracés : l'encadrant voit **ce qui** a été répondu, pas
    // seulement si c'était juste. C'est ce qui distingue une trace exploitable d'un score.
    void recordStep({
      stepId: question.id,
      kind: 'ANSWER',
      outcome: correct ? 'SUCCESS' : 'FAILURE',
      payload: { given, expected },
    });

    setLocked((previous) => new Set(previous).add(question.id));

    if (currentIndex + 1 >= questionsEffectives.length) {
      void recordDuration();
    }
  }, [question, answersByQuestion, currentIndex, questionsEffectives.length, recordStep, recordDuration]);

  const next = useCallback(() => {
    if (currentIndex + 1 >= questionsEffectives.length) {
      setFinished(true);
      return;
    }
    setCurrentIndex((index) => index + 1);
  }, [currentIndex, questionsEffectives.length]);

  const restart = useCallback(() => {
    setAnswersByQuestion({});
    setLocked(new Set());
    setCurrentIndex(0);
    setFinished(false);
  }, []);

  if (questionsEffectives.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Aucune question n’est définie.
        </CardContent>
      </Card>
    );
  }

  // --- Bilan final ---
  if (finished) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {passed ? (
              <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
            )}
            {libelles.title}
          </CardTitle>
          <CardDescription>
            {passed
              ? 'Évaluation réussie : les notions sont acquises.'
              : 'Évaluation à revoir : certaines notions ne sont pas encore acquises.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-semibold">{score} %</span>
              <Badge variant={passed ? 'default' : 'destructive'}>Seuil : {passingScore} %</Badge>
            </div>
            <Progress value={score} aria-label={`Score : ${score} pour cent`} />
          </div>

          <ul className="space-y-2">
            {questionsEffectives.map((candidate) => {
              const given = [...(answersByQuestion[candidate.id] ?? [])].sort();
              const expected = candidate.answers
                .filter((answer) => answer.isCorrect)
                .map((answer) => answer.id)
                .sort();
              const correct =
                given.length === expected.length && given.every((value, index) => value === expected[index]);

              return (
                <li key={candidate.id} className="flex items-start gap-2 text-sm">
                  {correct ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
                  )}
                  <span className={cn(!correct && 'text-muted-foreground')}>
                    {candidate.text}
                    {/* ⚠️ La bonne réponse est donnée : ne pas la révéler rendrait la remédiation
                        impossible, or c'est le but d'une évaluation formative. */}
                    {!correct && (
                      <span className="mt-0.5 block text-xs">
                        Réponse attendue :{' '}
                        {candidate.answers
                          .filter((answer) => answer.isCorrect)
                          .map((answer) => answer.text)
                          .join(', ')}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>

          <Button variant="outline" onClick={restart}>
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
            Refaire l’évaluation
          </Button>
        </CardContent>
      </Card>
    );
  }

  // --- Question en cours ---
  const isLocked = locked.has(question.id);
  const currentAnswers = answersByQuestion[question.id] ?? [];
  const canValidate = currentAnswers.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" aria-hidden="true" />
            {libelles.title}
          </span>
          <Badge variant="secondary">
            {currentIndex + 1}/{questionsEffectives.length}
          </Badge>
        </CardTitle>
        {libelles.description && <CardDescription>{libelles.description}</CardDescription>}
      </CardHeader>

      <CardContent className="space-y-4">
        <Progress
          value={(answeredCount / questionsEffectives.length) * 100}
          aria-label={`${answeredCount} question(s) sur ${questionsEffectives.length} répondue(s)`}
        />

        <p className="text-base font-medium leading-relaxed">{question.text}</p>

        {/* ⚠️ Radio pour un choix unique, cases à cocher pour un choix multiple : le contrôle
            doit indiquer à l'apprenant combien de réponses sont attendues. */}
        {question.isMultipleChoice ? (
          <div className="space-y-2" role="group" aria-label="Réponses possibles">
            {question.answers.map((answer) => (
              <div key={answer.id} className="flex items-start gap-2">
                <Checkbox
                  id={`${question.id}-${answer.id}`}
                  checked={currentAnswers.includes(answer.id)}
                  disabled={isLocked}
                  onCheckedChange={() => selectAnswer(question.id, answer.id, true)}
                  className="mt-0.5"
                />
                <Label
                  htmlFor={`${question.id}-${answer.id}`}
                  className={cn('text-sm', isLocked ? 'cursor-default' : 'cursor-pointer')}
                >
                  {answer.text}
                </Label>
              </div>
            ))}
          </div>
        ) : (
          <RadioGroup
            value={currentAnswers[0] ?? ''}
            onValueChange={(value) => selectAnswer(question.id, value, false)}
            disabled={isLocked}
          >
            {question.answers.map((answer) => (
              <div key={answer.id} className="flex items-start gap-2">
                <RadioGroupItem value={answer.id} id={`${question.id}-${answer.id}`} className="mt-0.5" />
                <Label
                  htmlFor={`${question.id}-${answer.id}`}
                  className={cn('text-sm', isLocked ? 'cursor-default' : 'cursor-pointer')}
                >
                  {answer.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {/* Corrigé : affiché seulement après validation de la question. */}
        {isLocked && question.explanation && (
          <p className="rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
            {question.explanation}
          </p>
        )}

        <div className="flex gap-2">
          {!isLocked ? (
            <Button onClick={validateQuestion} disabled={!canValidate}>
              Valider la réponse
            </Button>
          ) : (
            <Button onClick={next}>
              {currentIndex + 1 >= questionsEffectives.length ? 'Voir le résultat' : 'Question suivante'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
