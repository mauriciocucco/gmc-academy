import confetti from "canvas-confetti";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { getMyAttemptDetail, getMyAttempts } from "~/lib/api/attempts.service";
import { normalizeError } from "~/lib/api/errors";
import { getActiveExam, submitExam } from "~/lib/api/exams.service";
import type {
  ActiveExamResponse,
  AttemptDetail,
  AttemptItem,
  AttemptReviewQuestion,
  SubmitExamResponse,
} from "~/lib/api/types";
import { notifyStudentProgressUpdated } from "~/lib/progress-events";

function sortAttemptsByDate(attempts: AttemptItem[]): AttemptItem[] {
  return [...attempts].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

function formatAttemptDate(date: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function mapAttemptDetailToItem(detail: AttemptDetail): AttemptItem {
  return {
    id: detail.id,
    examId: detail.examId,
    examTitle: detail.examTitle,
    score: detail.score,
    passed: detail.passed,
    createdAt: detail.createdAt,
  };
}

function getOptionClassName(
  question: AttemptReviewQuestion,
  optionId: string,
): string {
  const isSelected = question.selectedOptionId === optionId;
  const isCorrect = question.correctOptionId === optionId;

  if (isSelected && isCorrect) {
    return "border-emerald-500 bg-emerald-50 text-emerald-900";
  }

  if (isSelected) {
    return "border-rose-500 bg-rose-50 text-rose-900";
  }

  if (isCorrect && question.isCorrect) {
    return "border-blue-500 bg-blue-50 text-blue-900";
  }

  return "border-slate-200 bg-slate-50 text-slate-500";
}

function AttemptReview({
  review,
  onRetry,
}: {
  review: AttemptDetail;
  onRetry: () => void;
}) {
  const passed = review.passed;

  return (
    <section className="grid gap-6">
      <article className="card-racing-dark-static p-4 sm:p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">
            {passed ? "Examen Aprobado" : "Examen No Aprobado"}
          </h2>
          <p className="mt-2 text-sm font-medium uppercase tracking-[0.2em] text-slate-400">
            Intento: {formatAttemptDate(review.createdAt)}
          </p>
          <div className="mt-4 text-5xl font-black text-blue-500">
            {review.score}%
          </div>
          <p className="mt-3 text-lg text-slate-300">
            {review.correctAnswers} de {review.totalQuestions} respuestas
            correctas
          </p>
        </div>

        <div
          className={`mt-6 rounded-xl border p-4 text-center ${
            passed
              ? "border-green-500/30 bg-green-500/10"
              : "border-blue-500/30 bg-blue-500/10"
          }`}
        >
          <p className="text-lg font-bold text-white">
            {passed
              ? "Ya aprobaste este examen. Puedes volver a rendirlo cuando quieras."
              : "Este intento quedo guardado. Puedes volver a intentarlo cuando quieras."}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={onRetry} className="btn-racing">
            Volver a rendir
          </button>
          {passed && (
            <Link
              to="/student/certificate"
              className="btn-racing"
              style={{ animation: "glow-pulse 2s infinite" }}
            >
              Ver Certificado
            </Link>
          )}
        </div>
      </article>

      <article className="card-racing-static p-4 sm:p-6">
        <h3 className="mb-5 text-xl font-bold text-slate-900">
          Revision de respuestas
        </h3>

        <div className="grid gap-6">
          {review.questions.map((question) => (
            <div key={question.questionId}>
              <p className="mb-3 font-semibold leading-relaxed text-slate-900">
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                  {question.position}
                </span>
                {question.questionText}
              </p>

              <div className="grid gap-2">
                {question.options.map((option) => {
                  const isSelected = question.selectedOptionId === option.id;
                  const isCorrect = question.correctOptionId === option.id;

                  return (
                    <div
                      key={option.id}
                      className={`rounded-lg border px-4 py-3 text-sm font-medium ${getOptionClassName(question, option.id)}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span>{option.label}</span>
                        <span className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide">
                          {isSelected && (
                            <span className="rounded-full bg-white/70 px-2 py-1">
                              {question.isCorrect ? "Correcta" : "Incorrecta"}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {question.selectedOptionId === null && (
                  <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                    Esta pregunta quedo sin responder.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

function AttemptSummary({
  attempt,
  reviewError,
  onRetry,
  onOpenReview,
}: {
  attempt: AttemptItem;
  reviewError: string;
  onRetry: () => void;
  onOpenReview: () => void;
}) {
  return (
    <section className="grid gap-6">
      <article className="card-racing-dark-static p-4 sm:p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">
            {attempt.passed
              ? "Ya aprobaste este examen"
              : "Tu ultimo intento quedo registrado"}
          </h2>
          <p className="mt-3 text-slate-300">
            Fecha del intento: {formatAttemptDate(attempt.createdAt)}
          </p>
          <div className="mt-4 text-5xl font-black text-blue-500">
            {attempt.score}%
          </div>
        </div>

        <div
          className={`mt-6 rounded-xl border p-4 text-center ${
            attempt.passed
              ? "border-green-500/30 bg-green-500/10"
              : "border-blue-500/30 bg-blue-500/10"
          }`}
        >
          <p className="text-lg font-bold text-white">
            {attempt.passed
              ? "El alumno ya figura como aprobado y puede volver a rendir sin limite."
              : "Todavia no hay un intento aprobado, pero puedes volver a rendir ahora mismo."}
          </p>
        </div>

        {reviewError && (
          <p className="mt-4 rounded-xl bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-900">
            {reviewError}
          </p>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={onRetry} className="btn-racing">
            Volver a rendir
          </button>
          <button
            type="button"
            onClick={onOpenReview}
            className="cursor-pointer rounded-xl border border-white/20 bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/15"
          >
            Ver revision
          </button>
          {attempt.passed && (
            <Link to="/student/certificate" className="btn-racing">
              Ver Certificado
            </Link>
          )}
        </div>
      </article>
    </section>
  );
}

function ReviewSkeleton() {
  return (
    <section className="grid gap-6">
      <div className="h-48 animate-pulse rounded-3xl card-racing-dark-static" />
      <div className="h-80 animate-pulse rounded-3xl card-racing-static" />
    </section>
  );
}

export default function StudentExamPage() {
  const [exam, setExam] = useState<ActiveExamResponse | null>(null);
  const [attempts, setAttempts] = useState<AttemptItem[]>([]);
  const [selectedAttemptDetail, setSelectedAttemptDetail] =
    useState<AttemptDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRetaking, setIsRetaking] = useState(false);
  const [lastSubmittedResult, setLastSubmittedResult] =
    useState<SubmitExamResponse | null>(null);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;

    async function loadExamState() {
      try {
        const [examResponse, attemptsResponse] = await Promise.all([
          getActiveExam(),
          getMyAttempts(),
        ]);

        if (!isMounted) return;

        const orderedAttempts = sortAttemptsByDate(attemptsResponse);
        const preferredAttempt =
          orderedAttempts.find((attempt) => attempt.passed) ??
          orderedAttempts[0] ??
          null;

        setExam(examResponse);
        setAttempts(orderedAttempts);
        setReviewError("");

        if (!preferredAttempt) {
          setSelectedAttemptDetail(null);
          return;
        }

        setIsReviewLoading(true);

        try {
          const detail = await getMyAttemptDetail(preferredAttempt.id);
          if (!isMounted) return;

          setSelectedAttemptDetail(
            detail.examId === examResponse.id ? detail : null,
          );
        } catch (error) {
          if (!isMounted) return;

          setSelectedAttemptDetail(null);
          setReviewError(normalizeError(error).message);
        } finally {
          if (isMounted) {
            setIsReviewLoading(false);
          }
        }
      } catch (error) {
        if (!isMounted) return;
        setLoadError(normalizeError(error).message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadExamState();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!lastSubmittedResult?.passed) return;

    const duration = 4000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#0066cc", "#00aaff", "#ffffff", "#ffd700"],
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#0066cc", "#00aaff", "#ffffff", "#ffd700"],
      });

      if (Date.now() < end) requestAnimationFrame(frame);
    };

    frame();
  }, [lastSubmittedResult?.attemptId, lastSubmittedResult?.passed]);

  const currentQuestion = exam?.questions[questionIndex];
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const latestApprovedAttempt =
    attempts.find((attempt) => attempt.passed) ?? null;
  const latestAttempt = attempts[0] ?? null;
  const attemptToSummarize = latestApprovedAttempt ?? latestAttempt;

  async function openAttemptReview(attempt: AttemptItem) {
    if (!exam) return;

    setReviewError("");
    setIsReviewLoading(true);

    try {
      const detail = await getMyAttemptDetail(attempt.id);
      setSelectedAttemptDetail(detail.examId === exam.id ? detail : null);
    } catch (error) {
      setSelectedAttemptDetail(null);
      setReviewError(normalizeError(error).message);
    } finally {
      setIsReviewLoading(false);
    }
  }

  const handleSubmit = async () => {
    if (!exam) return;

    setSubmitError("");
    setReviewError("");
    setIsSubmitting(true);

    try {
      const dto = {
        answers: Object.entries(answers).map(([questionId, optionId]) => ({
          questionId,
          optionId,
        })),
      };
      const response = await submitExam(exam.id, dto);
      const fallbackAttempt: AttemptItem = {
        id: response.attemptId,
        examId: exam.id,
        examTitle: exam.title,
        score: response.score,
        passed: response.passed,
        createdAt: new Date().toISOString(),
      };

      setLastSubmittedResult(response);
      setAttempts((previousAttempts) =>
        sortAttemptsByDate([
          fallbackAttempt,
          ...previousAttempts.filter(
            (attempt) => attempt.id !== response.attemptId,
          ),
        ]),
      );

      try {
        const detail = await getMyAttemptDetail(response.attemptId);

        setSelectedAttemptDetail(detail);
        setAttempts((previousAttempts) =>
          sortAttemptsByDate([
            mapAttemptDetailToItem(detail),
            ...previousAttempts.filter(
              (attempt) => attempt.id !== response.attemptId,
            ),
          ]),
        );
      } catch (error) {
        setSelectedAttemptDetail(null);
        setReviewError(
          `El intento se guardo, pero no pudimos cargar la revision: ${
            normalizeError(error).message
          }`,
        );
      }

      setIsRetaking(false);
      notifyStudentProgressUpdated();
    } catch (error) {
      setSubmitError(normalizeError(error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setQuestionIndex(0);
    setSubmitError("");
    setIsRetaking(true);
  };

  const handleBackToReview = () => {
    setAnswers({});
    setQuestionIndex(0);
    setSubmitError("");
    setIsRetaking(false);
  };

  if (isLoading) {
    return (
      <section className="grid gap-6">
        <div className="h-28 animate-pulse p-6 card-racing-dark-static" />
        <div className="h-64 animate-pulse p-6 card-racing-static" />
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="grid gap-6">
        <article className="rounded-2xl bg-rose-100 p-4 text-center font-semibold text-rose-800 sm:p-8">
          {loadError}
        </article>
      </section>
    );
  }

  if (!exam) return null;

  if (!isRetaking && isReviewLoading) {
    return <ReviewSkeleton />;
  }

  if (!isRetaking && selectedAttemptDetail) {
    return (
      <AttemptReview review={selectedAttemptDetail} onRetry={handleRetry} />
    );
  }

  if (!isRetaking && attemptToSummarize) {
    return (
      <AttemptSummary
        attempt={attemptToSummarize}
        reviewError={reviewError}
        onRetry={handleRetry}
        onOpenReview={() => {
          void openAttemptReview(attemptToSummarize);
        }}
      />
    );
  }

  if (!currentQuestion) return null;

  const allAnswered = answeredCount === exam.questions.length;
  const isLastQuestion = questionIndex === exam.questions.length - 1;

  return (
    <section className="grid gap-6">
      {latestApprovedAttempt && (
        <article className="rounded-3xl border border-green-300 bg-green-50 px-5 py-4 text-green-900 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-700">
                Alumno aprobado
              </p>
              <p className="mt-1 text-sm">
                Este nuevo intento es opcional. Aprobaste el examen el{" "}
                {formatAttemptDate(latestApprovedAttempt.createdAt)}.
              </p>
            </div>
            {selectedAttemptDetail && (
              <button
                type="button"
                onClick={handleBackToReview}
                className="cursor-pointer rounded-xl border border-green-300 bg-white px-4 py-2 text-sm font-semibold text-green-800 transition-colors hover:bg-green-100"
              >
                Ver ultimo intento
              </button>
            )}
          </div>
        </article>
      )}

      <article className="card-racing-dark-static p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">{exam.title}</h2>
              <p className="text-slate-300">
                Necesitas {exam.passScore}% para aprobar
              </p>
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-500">
            {exam.questions.length} preguntas
          </div>
        </div>
      </article>

      <article className="card-racing-static p-4 sm:p-6">
        <div className="mb-5">
          <div className="rounded-lg border border-slate-300 bg-white px-4 py-2 shadow-sm">
            <p className="text-lg font-bold text-slate-900">
              Pregunta {questionIndex + 1}/{exam.questions.length}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-6">
          <h3 className="text-xl font-bold leading-relaxed text-slate-900">
            {currentQuestion.text}
          </h3>
        </div>

        <div className="grid gap-3">
          {currentQuestion.options.map((option) => {
            const isSelected = answers[currentQuestion.id] === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() =>
                  setAnswers((previousAnswers) => ({
                    ...previousAnswers,
                    [currentQuestion.id]: option.id,
                  }))
                }
                className={`cursor-pointer rounded-lg border px-5 py-4 text-left font-medium transition-all ${
                  isSelected
                    ? "scale-[1.02] border-blue-500 bg-blue-50 text-blue-900 shadow-md"
                    : "border-slate-200 bg-white text-slate-800 hover:border-blue-300 hover:bg-blue-50/50"
                }`}
              >
                <span className="text-base">
                  {isSelected && "✓ "}
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>

        {submitError && (
          <p className="mt-4 rounded-xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-800">
            {submitError}
          </p>
        )}

        {reviewError && (
          <p className="mt-4 rounded-xl bg-amber-100 px-4 py-3 text-sm font-semibold text-amber-900">
            {reviewError}
          </p>
        )}

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() =>
              setQuestionIndex((previousIndex) =>
                Math.max(0, previousIndex - 1),
              )
            }
            disabled={questionIndex === 0}
            className="cursor-pointer rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-700 enabled:hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>

          {isLastQuestion ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!allAnswered || isSubmitting}
              className="btn-racing disabled:cursor-not-allowed disabled:opacity-40"
              style={
                allAnswered && !isSubmitting
                  ? { animation: "glow-pulse 2s infinite" }
                  : {}
              }
            >
              {isSubmitting ? "Enviando..." : "Finalizar Examen"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                setQuestionIndex((previousIndex) =>
                  Math.min(exam.questions.length - 1, previousIndex + 1),
                )
              }
              disabled={answers[currentQuestion.id] === undefined}
              className="cursor-pointer rounded-lg bg-blue-500 px-5 py-2.5 font-medium text-white enabled:hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
            </button>
          )}
        </div>
      </article>
    </section>
  );
}
