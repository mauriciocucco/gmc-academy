import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { getActiveExam, submitExam } from "~/lib/api/exams.service";
import { normalizeError } from "~/lib/api/errors";
import type { ActiveExamResponse, SubmitExamResponse } from "~/lib/api/types";

export default function StudentExamPage() {
  const [exam, setExam] = useState<ActiveExamResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<SubmitExamResponse | null>(null);

  useEffect(() => {
    getActiveExam()
      .then(setExam)
      .catch((error) => setLoadError(normalizeError(error).message))
      .finally(() => setIsLoading(false));
  }, []);

  const currentQuestion = exam?.questions[questionIndex];

  const handleSubmit = async () => {
    if (!exam) return;
    setSubmitError("");
    setIsSubmitting(true);

    try {
      const dto = {
        answers: Object.entries(answers).map(([questionId, optionId]) => ({
          questionId,
          optionId,
        })),
      };
      const response = await submitExam(exam.id, dto);
      setResult(response);
    } catch (error) {
      setSubmitError(normalizeError(error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setQuestionIndex(0);
    setResult(null);
    setSubmitError("");
  };

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  if (isLoading) {
    return (
      <section className="grid gap-6">
        <div className="card-racing-dark animate-pulse p-6 h-28" />
        <div className="card-racing animate-pulse p-6 h-64" />
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="grid gap-6">
        <article className="rounded-2xl bg-rose-100 p-8 text-center font-semibold text-rose-800">
          {loadError}
        </article>
      </section>
    );
  }

  if (!exam) return null;

  if (result) {
    const passed = result.passed;

    return (
      <section className="grid gap-6">
        <article className="card-racing-dark p-8">
          <div className="text-center">
            <div className="mb-4 text-6xl">{passed ? "🏆" : "📝"}</div>
            <h2 className="text-3xl font-bold text-white">
              {passed ? "Examen Aprobado" : "Examen No Aprobado"}
            </h2>
            <div className="mt-4 text-5xl font-black text-blue-500">
              {result.score}%
            </div>
            <p className="mt-3 text-lg text-slate-300">
              {result.correctAnswers} de {result.totalQuestions} respuestas
              correctas
            </p>
          </div>

          <div
            className={`mt-6 rounded-xl border p-4 text-center ${passed ? "border-green-500/30 bg-green-500/10" : "border-blue-500/30 bg-blue-500/10"}`}
          >
            <p className="text-lg font-bold text-white">
              {passed
                ? "✅ ¡Aprobado! Ya puedes obtener tu certificado"
                : "💪 Sigue practicando, lo conseguiras pronto"}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={handleRetry} className="btn-racing">
              Reintentar Examen
            </button>
            {passed && (
              <Link
                to="/student/certificate"
                className="btn-racing"
                style={{ animation: "glow-pulse 2s infinite" }}
              >
                Ver Certificado →
              </Link>
            )}
          </div>
        </article>
      </section>
    );
  }

  if (!currentQuestion) return null;

  const allAnswered = answeredCount === exam.questions.length;
  const isLastQuestion = questionIndex === exam.questions.length - 1;

  return (
    <section className="grid gap-6">
      <article className="card-racing-dark p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🎯</div>
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

      <article className="card-racing p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="rounded-lg border border-slate-300 bg-white px-4 py-2 shadow-sm">
            <p className="text-lg font-bold text-slate-900">
              Pregunta {questionIndex + 1}/{exam.questions.length}
            </p>
          </div>
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2">
            <p className="text-sm font-bold text-blue-600">
              Progreso: {answeredCount}/{exam.questions.length}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-lg bg-slate-50 p-5 border border-slate-200">
          <h3 className="text-xl font-bold text-slate-900 leading-relaxed">
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
                  setAnswers((prev) => ({
                    ...prev,
                    [currentQuestion.id]: option.id,
                  }))
                }
                className={`cursor-pointer rounded-lg border px-5 py-4 text-left font-medium transition-all ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 text-blue-900 shadow-md scale-[1.02]"
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

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={questionIndex === 0}
            className="cursor-pointer rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-700 enabled:hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ◀ Anterior
          </button>

          {isLastQuestion ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!allAnswered || isSubmitting}
              className="btn-racing disabled:opacity-40 disabled:cursor-not-allowed"
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
                setQuestionIndex((prev) =>
                  Math.min(exam.questions.length - 1, prev + 1),
                )
              }
              disabled={answers[currentQuestion.id] === undefined}
              className="cursor-pointer rounded-lg bg-blue-500 px-5 py-2.5 font-medium text-white enabled:hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente ▶
            </button>
          )}
        </div>
      </article>
    </section>
  );
}
