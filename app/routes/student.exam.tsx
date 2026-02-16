import { useMemo, useState } from "react";
import { Link } from "react-router";

type Question = {
  id: number;
  text: string;
  options: { id: string; label: string }[];
  correctOptionId: string;
};

const questions: Question[] = [
  {
    id: 1,
    text: "Que documentacion debe llevar un conductor?",
    options: [
      { id: "a", label: "Solo licencia de conducir" },
      { id: "b", label: "Licencia, cedula, seguro y VTV vigente" },
      { id: "c", label: "Licencia y comprobante de combustible" },
    ],
    correctOptionId: "b",
  },
  {
    id: 2,
    text: "En una interseccion sin semaforo, quien tiene prioridad?",
    options: [
      { id: "a", label: "El vehiculo que viene por la derecha" },
      { id: "b", label: "El vehiculo mas grande" },
      { id: "c", label: "El que acelera primero" },
    ],
    correctOptionId: "a",
  },
  {
    id: 3,
    text: "Por donde debe realizarse el adelantamiento?",
    options: [
      { id: "a", label: "Por la derecha siempre" },
      { id: "b", label: "Por la izquierda, en condiciones seguras" },
      { id: "c", label: "Por banquina si hay lugar" },
    ],
    correctOptionId: "b",
  },
  {
    id: 4,
    text: "En una rotonda, la prioridad corresponde a:",
    options: [
      { id: "a", label: "Quien quiere ingresar" },
      { id: "b", label: "Quien circula dentro de la rotonda" },
      { id: "c", label: "Quien toca bocina" },
    ],
    correctOptionId: "b",
  },
  {
    id: 5,
    text: "La distancia de seguridad recomendada depende de:",
    options: [
      { id: "a", label: "La velocidad y condicion del transito" },
      { id: "b", label: "El tamano de tu vehiculo unicamente" },
      { id: "c", label: "La marca de los neumaticos" },
    ],
    correctOptionId: "a",
  },
];

const passingScore = 70;

export default function StudentExamPage() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const currentQuestion = questions[questionIndex];
  const correctCount = useMemo(
    () =>
      questions.reduce((acc, question) => {
        return answers[question.id] === question.correctOptionId
          ? acc + 1
          : acc;
      }, 0),
    [answers],
  );
  const score = Math.round((correctCount / questions.length) * 100);
  const passed = score >= passingScore;

  if (submitted) {
    return (
      <section className="grid gap-6">
        <article className={`card-racing-dark p-8 ${passed ? "" : ""}`}>
          <div className="text-center">
            <div className="mb-4 text-6xl">{passed ? "🏆" : "📝"}</div>
            <h2 className="text-3xl font-bold text-white">
              {passed ? "Examen Aprobado" : "Examen No Aprobado"}
            </h2>
            <div className="mt-4 text-5xl font-black text-blue-500">
              {score}%
            </div>
            <p className="mt-3 text-lg text-slate-300">
              {correctCount} de {questions.length} respuestas correctas
            </p>
          </div>

          <div
            className={`mt-6 rounded-xl border p-4 text-center ${passed ? "border-green-500/30 bg-green-500/10" : "border-blue-500/30 bg-blue-500/10"}`}
          >
            <p className="text-lg font-bold text-white">
              {passed
                ? "✅ ¡Aprobado! Ya puedes obtener tu certificado"
                : "💪 Sigue practicando, lo conseguirás pronto"}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                setAnswers({});
                setQuestionIndex(0);
                setSubmitted(false);
              }}
              className="btn-racing"
            >
              Reintentar Examen
            </button>
            {passed ? (
              <Link
                to="/student/certificate"
                className="btn-racing"
                style={{ animation: "glow-pulse 2s infinite" }}
              >
                Ver Certificado →
              </Link>
            ) : null}
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      <article className="card-racing-dark p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🎯</div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                Examen de Práctica
              </h2>
              <p className="text-slate-300">
                Necesitas {passingScore}% para aprobar
              </p>
            </div>
          </div>
          <div className="text-3xl font-bold text-blue-500">
            {questions.length} preguntas
          </div>
        </div>
      </article>

      <article className="card-racing p-6">
        <div className="mb-5 flex items-center justify-between">
          <div className="rounded-lg border border-slate-300 bg-white px-4 py-2 shadow-sm">
            <p className="text-lg font-bold text-slate-900">
              Pregunta {questionIndex + 1}/{questions.length}
            </p>
          </div>
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2">
            <p className="text-sm font-bold text-blue-600">
              Progreso: {Object.keys(answers).length}/{questions.length}
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

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={questionIndex === 0}
            className="cursor-pointer rounded-lg border border-slate-300 bg-white px-5 py-2.5 font-medium text-slate-700 enabled:hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ◀ Anterior
          </button>

          {questionIndex === questions.length - 1 ? (
            <button
              type="button"
              onClick={() => setSubmitted(true)}
              disabled={answers[currentQuestion.id] === undefined}
              className="btn-racing"
              style={
                answers[currentQuestion.id] !== undefined
                  ? { animation: "glow-pulse 2s infinite" }
                  : {}
              }
            >
              Finalizar Examen
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                setQuestionIndex((prev) =>
                  Math.min(questions.length - 1, prev + 1),
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
