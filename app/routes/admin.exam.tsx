import { useEffect, useRef, useState } from "react";

import {
  getAdminExamConfig,
  getAdminExamQuestionsPage,
  updateAdminExam,
} from "~/lib/api/admin.service";
import { normalizeError } from "~/lib/api/errors";
import type {
  AdminExamConfig,
  AdminExamQuestionsPage,
  AdminExamOption,
  AdminExamQuestion,
  PaginationMeta,
  UpdateAdminExamDto,
} from "~/lib/api/types";

type ExamOptionDraft = {
  clientId: string;
  id?: string;
  label: string;
  isCorrect: boolean;
};

type ExamQuestionDraft = {
  clientId: string;
  id?: string;
  text: string;
  options: ExamOptionDraft[];
};

type ExamDraft = {
  title: string;
  description: string;
  passScore: number;
  questions: ExamQuestionDraft[];
};

type VisibleQuestionEntry = {
  question: ExamQuestionDraft;
  globalIndex: number;
};

const MIN_OPTIONS_PER_QUESTION = 2;
const QUESTIONS_PER_PAGE = 10;

function createClientId(): string {
  return crypto.randomUUID();
}

function normalizeCorrectOption(options: ExamOptionDraft[]): ExamOptionDraft[] {
  if (options.length === 0) {
    return options;
  }

  const selectedIndex = options.findIndex((option) => option.isCorrect);
  const normalizedIndex = selectedIndex >= 0 ? selectedIndex : 0;

  return options.map((option, index) => ({
    ...option,
    isCorrect: index === normalizedIndex,
  }));
}

function createOptionDraft(
  option?: Partial<Pick<AdminExamOption, "id" | "label" | "isCorrect">>,
): ExamOptionDraft {
  return {
    clientId: createClientId(),
    id: option?.id,
    label: option?.label ?? "",
    isCorrect: option?.isCorrect ?? false,
  };
}

function createQuestionDraft(
  question?: Partial<Pick<AdminExamQuestion, "id" | "text">> & {
    options?: AdminExamOption[];
  },
): ExamQuestionDraft {
  const baseOptions =
    question?.options && question.options.length > 0
      ? question.options.map((option) => createOptionDraft(option))
      : [
          createOptionDraft({ isCorrect: true }),
          createOptionDraft({ isCorrect: false }),
        ];

  return {
    clientId: createClientId(),
    id: question?.id,
    text: question?.text ?? "",
    options: normalizeCorrectOption(baseOptions),
  };
}

function mapConfigToDraft(config: AdminExamConfig): ExamDraft {
  return {
    title: config.title,
    description: config.description,
    passScore: config.passScore,
    questions: [...config.questions]
      .sort((left, right) => left.position - right.position)
      .map((question) => createQuestionDraft(question)),
  };
}

function mapDraftToDto(draft: ExamDraft): UpdateAdminExamDto {
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    passScore: draft.passScore,
    questions: draft.questions.map((question, index) => ({
      id: question.id,
      text: question.text.trim(),
      position: index + 1,
      options: question.options.map((option) => ({
        id: option.id,
        label: option.label.trim(),
        isCorrect: option.isCorrect,
      })),
    })),
  };
}

function validateExamDraft(draft: ExamDraft): string | null {
  if (!draft.title.trim()) {
    return "El examen necesita un titulo.";
  }

  if (!draft.description.trim()) {
    return "Agrega una descripcion breve del examen.";
  }

  if (
    !Number.isInteger(draft.passScore) ||
    draft.passScore < 1 ||
    draft.passScore > 100
  ) {
    return "El porcentaje para aprobar debe ser un numero entero entre 1 y 100.";
  }

  if (draft.questions.length === 0) {
    return "Debes cargar al menos una pregunta.";
  }

  for (const [questionIndex, question] of draft.questions.entries()) {
    if (!question.text.trim()) {
      return `La pregunta ${questionIndex + 1} no puede quedar vacia.`;
    }

    if (question.options.length < MIN_OPTIONS_PER_QUESTION) {
      return `La pregunta ${questionIndex + 1} debe tener al menos ${MIN_OPTIONS_PER_QUESTION} opciones.`;
    }

    if (question.options.some((option) => !option.label.trim())) {
      return `Todas las opciones de la pregunta ${questionIndex + 1} deben tener texto.`;
    }

    const correctOptions = question.options.filter(
      (option) => option.isCorrect,
    );
    if (correctOptions.length !== 1) {
      return `La pregunta ${questionIndex + 1} debe tener una sola respuesta correcta.`;
    }
  }

  return null;
}

function formatLastUpdate(
  updatedAt: string | null,
  updatedByName: string | null,
): string {
  if (!updatedAt) {
    return "Aun no hay una ultima actualizacion registrada.";
  }

  const formattedDate = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(updatedAt));

  if (!updatedByName) {
    return `Ultima actualizacion: ${formattedDate}.`;
  }

  return `Ultima actualizacion: ${formattedDate} por ${updatedByName}.`;
}

function getMinimumCorrectAnswers(
  passScore: number,
  questionCount: number,
): number {
  if (questionCount <= 0) {
    return 0;
  }

  return Math.ceil((passScore / 100) * questionCount);
}

function getOptionTag(index: number): string {
  return String.fromCharCode(65 + index);
}

function normalizeSearchTerm(value: string): string {
  return value.trim().toLocaleLowerCase("es");
}

function questionMatchesSearch(
  question: Pick<ExamQuestionDraft, "text" | "options">,
  searchQuery: string,
): boolean {
  const normalizedQuery = normalizeSearchTerm(searchQuery);

  if (!normalizedQuery) {
    return true;
  }

  const haystacks = [
    question.text,
    ...question.options.map((option) => option.label),
  ];
  return haystacks.some((value) =>
    value.toLocaleLowerCase("es").includes(normalizedQuery),
  );
}

function buildLocalQuestionEntries(
  questions: ExamQuestionDraft[],
  searchQuery: string,
): VisibleQuestionEntry[] {
  return questions.flatMap((question, globalIndex) =>
    questionMatchesSearch(question, searchQuery)
      ? [{ question, globalIndex }]
      : [],
  );
}

function paginateQuestionEntries(
  entries: VisibleQuestionEntry[],
  page: number,
  pageSize: number,
): { items: VisibleQuestionEntry[]; meta: PaginationMeta } {
  const totalItems = entries.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (safePage - 1) * pageSize;

  return {
    items: entries.slice(startIndex, startIndex + pageSize),
    meta: {
      page: safePage,
      pageSize,
      totalItems,
      totalPages,
    },
  };
}

function buildRemoteVisibleQuestionEntries(
  questions: ExamQuestionDraft[],
  remotePage: AdminExamQuestionsPage,
): VisibleQuestionEntry[] {
  return remotePage.items.flatMap((question) => {
    const globalIndex = questions.findIndex(
      (draftQuestion) => draftQuestion.id === question.id,
    );

    return globalIndex >= 0
      ? [{ question: questions[globalIndex], globalIndex }]
      : [];
  });
}

export default function AdminExamPage() {
  const questionRequestRef = useRef(0);
  const hasLoadedQuestionPageRef = useRef(false);
  const [draft, setDraft] = useState<ExamDraft | null>(null);
  const [savedDraft, setSavedDraft] = useState<ExamDraft | null>(null);
  const [examConfig, setExamConfig] = useState<AdminExamConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [questionSearchQuery, setQuestionSearchQuery] = useState("");
  const [questionCurrentPage, setQuestionCurrentPage] = useState(1);
  const [questionPage, setQuestionPage] =
    useState<AdminExamQuestionsPage | null>(null);
  const [questionListError, setQuestionListError] = useState("");
  const [isQuestionsRefreshing, setIsQuestionsRefreshing] = useState(false);

  const isDirty =
    draft !== null &&
    savedDraft !== null &&
    JSON.stringify(draft) !== JSON.stringify(savedDraft);
  const localQuestionPage = paginateQuestionEntries(
    buildLocalQuestionEntries(draft?.questions ?? [], questionSearchQuery),
    questionCurrentPage,
    QUESTIONS_PER_PAGE,
  );
  const shouldUseLocalQuestionPage =
    isDirty || questionPage === null || questionListError.length > 0;
  const remoteQuestionMeta = questionPage?.meta ?? localQuestionPage.meta;
  const remoteVisibleQuestionEntries =
    questionPage !== null
      ? buildRemoteVisibleQuestionEntries(draft?.questions ?? [], questionPage)
      : [];
  const effectiveQuestionMeta = shouldUseLocalQuestionPage
    ? localQuestionPage.meta
    : remoteQuestionMeta;
  const visibleQuestionEntries = shouldUseLocalQuestionPage
    ? localQuestionPage.items
    : remoteVisibleQuestionEntries;
  const isQuestionSearchActive = questionSearchQuery.trim().length > 0;

  useEffect(() => {
    let isMounted = true;

    async function loadExamConfig() {
      try {
        const response = await getAdminExamConfig();

        if (!isMounted) {
          return;
        }

        const mappedDraft = mapConfigToDraft(response);
        setExamConfig(response);
        setDraft(mappedDraft);
        setSavedDraft(mappedDraft);
        setQuestionPage(null);
        setQuestionListError("");
        setLoadError("");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setDraft(null);
        setSavedDraft(null);
        setExamConfig(null);
        setQuestionPage(null);
        setQuestionListError("");
        setLoadError(normalizeError(error).message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadExamConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  function updateDraftState(updater: (current: ExamDraft) => ExamDraft) {
    setDraft((current) => (current ? updater(current) : current));
    setSaveError("");
    setSaveSuccess("");
  }

  useEffect(() => {
    setQuestionCurrentPage(1);
  }, [questionSearchQuery]);

  useEffect(() => {
    if (questionCurrentPage > effectiveQuestionMeta.totalPages) {
      setQuestionCurrentPage(effectiveQuestionMeta.totalPages);
    }
  }, [effectiveQuestionMeta.totalPages, questionCurrentPage]);

  useEffect(() => {
    if (isLoading || !draft || !examConfig || isDirty) {
      setIsQuestionsRefreshing(false);
      return;
    }

    let isMounted = true;
    const requestId = questionRequestRef.current + 1;
    questionRequestRef.current = requestId;

    async function loadQuestionPage() {
      if (hasLoadedQuestionPageRef.current) {
        setIsQuestionsRefreshing(true);
      } else {
        setQuestionListError("");
      }

      try {
        const response = await getAdminExamQuestionsPage({
          page: questionCurrentPage,
          pageSize: QUESTIONS_PER_PAGE,
          search: questionSearchQuery,
        });

        if (!isMounted || questionRequestRef.current !== requestId) {
          return;
        }

        if (questionCurrentPage > response.meta.totalPages) {
          setQuestionCurrentPage(response.meta.totalPages);
          return;
        }

        setQuestionPage(response);
        setQuestionListError("");
      } catch (error) {
        if (!isMounted || questionRequestRef.current !== requestId) {
          return;
        }

        setQuestionPage(null);
        setQuestionListError(normalizeError(error).message);
      } finally {
        if (isMounted && questionRequestRef.current === requestId) {
          hasLoadedQuestionPageRef.current = true;
          setIsQuestionsRefreshing(false);
        }
      }
    }

    void loadQuestionPage();

    return () => {
      isMounted = false;
    };
  }, [
    draft,
    examConfig,
    isDirty,
    isLoading,
    questionCurrentPage,
    questionSearchQuery,
  ]);

  async function handleSave() {
    if (!draft) {
      return;
    }

    const validationError = validateExamDraft(draft);
    if (validationError) {
      setSaveError(validationError);
      setSaveSuccess("");
      return;
    }

    setIsSaving(true);
    setSaveError("");
    setSaveSuccess("");

    try {
      const response = await updateAdminExam(mapDraftToDto(draft));
      const mappedDraft = mapConfigToDraft(response);

      setExamConfig(response);
      setDraft(mappedDraft);
      setSavedDraft(mappedDraft);
      setQuestionPage(null);
      setSaveSuccess("Configuracion del examen guardada.");
    } catch (error) {
      setSaveError(normalizeError(error).message);
    } finally {
      setIsSaving(false);
    }
  }

  function handleAddQuestion() {
    if (!draft) {
      return;
    }

    const nextQuestions = [...draft.questions, createQuestionDraft()];
    setQuestionSearchQuery("");
    setQuestionCurrentPage(
      Math.max(1, Math.ceil(nextQuestions.length / QUESTIONS_PER_PAGE)),
    );
    updateDraftState((current) => ({
      ...current,
      questions: nextQuestions,
    }));
  }

  if (isLoading) {
    return (
      <section className="grid gap-4">
        <div className="h-40 animate-pulse rounded-3xl border border-white/70 bg-white/90" />
        <div className="grid gap-4 xl:grid-cols-[0.9fr_1.35fr]">
          <div className="h-64 animate-pulse rounded-3xl border border-white/70 bg-white/90" />
          <div className="h-[36rem] animate-pulse rounded-3xl border border-white/70 bg-white/90" />
        </div>
      </section>
    );
  }

  if (loadError || !draft) {
    return (
      <article className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-rose-900 shadow-[0_18px_40px_-22px_rgba(127,29,29,0.35)] sm:p-6">
        <h2 className="font-display text-2xl">No se pudo cargar el examen</h2>
        <p className="mt-2 text-sm leading-6">
          {loadError || "La configuracion del examen no esta disponible."}
        </p>
        <p className="mt-3 text-sm leading-6 text-rose-800">
          Esta vista espera que el backend exponga la configuracion activa en
          <span className="font-semibold"> GET /api/v1/admin/exam</span>.
        </p>
      </article>
    );
  }

  const questionCount = draft.questions.length;
  const minimumCorrectAnswers = getMinimumCorrectAnswers(
    draft.passScore,
    questionCount,
  );
  const lastUpdateLabel = formatLastUpdate(
    examConfig?.updatedAt ?? null,
    examConfig?.updatedByName ?? null,
  );

  return (
    <section className="grid gap-4">
      <article
        data-route-hero="true"
        className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/90 p-4 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)] sm:p-7"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(53,162,255,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(0,77,163,0.14),transparent_32%)]" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#0066cc]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#0052a6]">
              Configuracion del examen
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
              {questionCount} pregunta{questionCount === 1 ? "" : "s"}
            </span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
              {draft.passScore}% para aprobar
            </span>
          </div>

          <h2 className="mt-4 max-w-3xl font-display text-[1.75rem] leading-[1.08] text-slate-900 sm:mt-5 sm:text-4xl">
            Edita el examen activo que veran los alumnos y define el umbral de
            aprobacion.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
            Esta pantalla administra las preguntas, sus opciones y la respuesta
            correcta. Los intentos historicos del alumno no deben cambiar aunque
            el examen se edite.
          </p>

          <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:mt-6 sm:flex sm:flex-wrap">
            <span className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3">
              Minimo requerido hoy:{" "}
              <span className="font-semibold text-slate-900">
                {minimumCorrectAnswers} de {questionCount}
              </span>
            </span>
            <span className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3">
              {lastUpdateLabel}
            </span>
          </div>
        </div>
      </article>

      <div className="grid gap-4">
        <article className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)] sm:p-6">
          <h3 className="font-display text-2xl text-slate-900">
            Parametros generales
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            El alumno ve este titulo, esta descripcion y la exigencia minima
            para aprobar.
          </p>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.9fr)] lg:items-start">
            <div className="grid gap-4">
              <label className="grid gap-1.5">
                <span className="text-sm font-semibold text-slate-700">
                  Titulo
                </span>
                <input
                  type="text"
                  value={draft.title}
                  onChange={(event) =>
                    updateDraftState((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
                  placeholder="Ej. Examen teorico GMC"
                />
              </label>

              <label className="grid gap-1.5">
                <span className="text-sm font-semibold text-slate-700">
                  Descripcion
                </span>
                <textarea
                  value={draft.description}
                  onChange={(event) =>
                    updateDraftState((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
                  placeholder="Indica brevemente como rendir el examen."
                />
              </label>
            </div>

            <label className="grid gap-2 rounded-3xl border border-slate-100 bg-slate-50/80 p-4 sm:p-6">
              <span className="text-sm font-semibold text-slate-700">
                Porcentaje minimo para aprobar
              </span>
              <div className="grid gap-3 rounded-2xl border border-white/80 bg-white/85 px-4 py-3 sm:flex sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Exigencia actual
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    {draft.passScore}%
                  </p>
                </div>
                <input
                  type="number"
                  min={1}
                  max={100}
                  step={1}
                  value={draft.passScore}
                  onChange={(event) => {
                    const nextPassScore = Number.parseInt(
                      event.target.value,
                      10,
                    );

                    updateDraftState((current) => ({
                      ...current,
                      passScore: Number.isNaN(nextPassScore)
                        ? 0
                        : nextPassScore,
                    }));
                  }}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-center text-base font-semibold text-slate-900 outline-none transition focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 sm:w-24"
                />
              </div>
              <div className="mt-1">
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#35a2ff] via-[#0066cc] to-[#004da3] transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(0, draft.passScore))}%`,
                    }}
                  />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Con {questionCount} pregunta{questionCount === 1 ? "" : "s"}{" "}
                  se requieren al menos {minimumCorrectAnswers} respuestas
                  correctas.
                </p>
              </div>
            </label>
          </div>
        </article>

        <article className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="font-display text-2xl text-slate-900">
                Banco de preguntas
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Ordena las preguntas como quieras que aparezcan en
                <span className="font-semibold text-slate-700">
                  {" /student/exam"}
                </span>
                .
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddQuestion}
              className="cursor-pointer rounded-2xl bg-[#0066cc] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0056ae] sm:w-auto"
            >
              Agregar pregunta
            </button>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Buscar
              </span>
              <input
                type="search"
                value={questionSearchQuery}
                onChange={(event) => setQuestionSearchQuery(event.target.value)}
                placeholder="Texto de la pregunta u opciones"
                className="h-12 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
              />
            </label>

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              {shouldUseLocalQuestionPage && isDirty ? (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">
                  Vista local
                </span>
              ) : null}
              {isQuestionsRefreshing ? (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-500">
                  Actualizando
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <span>{effectiveQuestionMeta.totalItems} resultados</span>
            <div className="flex flex-wrap items-center gap-2">
              {isQuestionSearchActive ? (
                <span>Desactiva la busqueda para reordenar.</span>
              ) : null}
              {isQuestionSearchActive ? (
                <button
                  type="button"
                  onClick={() => setQuestionSearchQuery("")}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-slate-600 transition hover:border-[#0066cc]/30 hover:text-[#0052a6]"
                >
                  Limpiar busqueda
                </button>
              ) : null}
            </div>
          </div>

          {questionListError ? (
            <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              No se pudo refrescar la pagina desde backend. Se muestra una vista
              local temporal.
            </p>
          ) : null}

          {shouldUseLocalQuestionPage && isDirty ? (
            <p className="mt-4 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
              Los cambios sin guardar se filtran y paginan localmente hasta que
              guardes el examen.
            </p>
          ) : null}

          {draft.questions.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
              Aun no hay preguntas cargadas. Agrega la primera para armar el
              examen.
            </div>
          ) : visibleQuestionEntries.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center text-sm text-slate-500">
              No hay preguntas que coincidan con la busqueda actual.
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {visibleQuestionEntries.map(({ question, globalIndex }) => (
                <div
                  key={question.clientId}
                  className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4 sm:p-6"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0066cc]">
                        Pregunta {globalIndex + 1}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Marca una sola opcion correcta.
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:items-center">
                      <button
                        type="button"
                        onClick={() =>
                          updateDraftState((current) => {
                            const nextQuestions = [...current.questions];
                            const previousQuestion =
                              nextQuestions[globalIndex - 1];

                            if (!previousQuestion) {
                              return current;
                            }

                            nextQuestions[globalIndex - 1] = question;
                            nextQuestions[globalIndex] = previousQuestion;

                            return {
                              ...current,
                              questions: nextQuestions,
                            };
                          })
                        }
                        disabled={isQuestionSearchActive || globalIndex === 0}
                        className="min-h-11 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Subir
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateDraftState((current) => {
                            const nextQuestions = [...current.questions];
                            const nextQuestion = nextQuestions[globalIndex + 1];

                            if (!nextQuestion) {
                              return current;
                            }

                            nextQuestions[globalIndex + 1] = question;
                            nextQuestions[globalIndex] = nextQuestion;

                            return {
                              ...current,
                              questions: nextQuestions,
                            };
                          })
                        }
                        disabled={
                          isQuestionSearchActive ||
                          globalIndex === draft.questions.length - 1
                        }
                        className="min-h-11 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Bajar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateDraftState((current) => ({
                            ...current,
                            questions: current.questions.filter(
                              (item) => item.clientId !== question.clientId,
                            ),
                          }))
                        }
                        className="min-h-11 cursor-pointer rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>

                  <label className="mt-4 grid gap-1.5">
                    <span className="text-sm font-semibold text-slate-700">
                      Enunciado
                    </span>
                    <textarea
                      value={question.text}
                      onChange={(event) =>
                        updateDraftState((current) => ({
                          ...current,
                          questions: current.questions.map((item) =>
                            item.clientId === question.clientId
                              ? { ...item, text: event.target.value }
                              : item,
                          ),
                        }))
                      }
                      rows={3}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
                      placeholder="Ej. En una interseccion sin semaforo, quien tiene prioridad..."
                    />
                  </label>

                  <div className="mt-5 grid gap-3">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={option.clientId}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="grid gap-3">
                          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                                {getOptionTag(optionIndex)}
                              </span>

                              <label className="inline-flex min-h-10 w-fit max-w-full items-center gap-2 rounded-full bg-slate-100 px-3 text-sm font-semibold text-slate-700">
                                <input
                                  type="radio"
                                  checked={option.isCorrect}
                                  onChange={() =>
                                    updateDraftState((current) => ({
                                      ...current,
                                      questions: current.questions.map(
                                        (item) => {
                                          if (
                                            item.clientId !== question.clientId
                                          ) {
                                            return item;
                                          }

                                          return {
                                            ...item,
                                            options: item.options.map(
                                              (questionOption) => ({
                                                ...questionOption,
                                                isCorrect:
                                                  questionOption.clientId ===
                                                  option.clientId,
                                              }),
                                            ),
                                          };
                                        },
                                      ),
                                    }))
                                  }
                                />
                                Correcta
                              </label>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                updateDraftState((current) => ({
                                  ...current,
                                  questions: current.questions.map((item) => {
                                    if (item.clientId !== question.clientId) {
                                      return item;
                                    }

                                    const remainingOptions =
                                      item.options.filter(
                                        (questionOption) =>
                                          questionOption.clientId !==
                                          option.clientId,
                                      );

                                    return {
                                      ...item,
                                      options:
                                        normalizeCorrectOption(
                                          remainingOptions,
                                        ),
                                    };
                                  }),
                                }))
                              }
                              disabled={
                                question.options.length <=
                                MIN_OPTIONS_PER_QUESTION
                              }
                              className="min-h-10 w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
                            >
                              Quitar
                            </button>
                          </div>

                          <input
                            type="text"
                            value={option.label}
                            onChange={(event) =>
                              updateDraftState((current) => ({
                                ...current,
                                questions: current.questions.map((item) => {
                                  if (item.clientId !== question.clientId) {
                                    return item;
                                  }

                                  return {
                                    ...item,
                                    options: item.options.map(
                                      (questionOption) =>
                                        questionOption.clientId ===
                                        option.clientId
                                          ? {
                                              ...questionOption,
                                              label: event.target.value,
                                            }
                                          : questionOption,
                                    ),
                                  };
                                }),
                              }))
                            }
                            className="min-w-0 rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
                            placeholder={`Texto de la opcion ${getOptionTag(optionIndex)}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <p className="text-xs text-slate-500">
                      Minimo {MIN_OPTIONS_PER_QUESTION} opciones por pregunta.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        updateDraftState((current) => ({
                          ...current,
                          questions: current.questions.map((item) =>
                            item.clientId === question.clientId
                              ? {
                                  ...item,
                                  options: [
                                    ...item.options,
                                    createOptionDraft({ isCorrect: false }),
                                  ],
                                }
                              : item,
                          ),
                        }))
                      }
                      className="min-h-11 w-full cursor-pointer rounded-xl border border-[#0066cc]/20 bg-[#0066cc]/5 px-3 py-2 text-xs font-semibold text-[#0052a6] transition hover:bg-[#0066cc]/10 sm:w-auto"
                    >
                      Agregar opcion
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {effectiveQuestionMeta.totalItems > 0 ? (
            <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                Pagina {questionCurrentPage} de{" "}
                {effectiveQuestionMeta.totalPages}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                <button
                  type="button"
                  onClick={() =>
                    setQuestionCurrentPage((page) => Math.max(1, page - 1))
                  }
                  disabled={questionCurrentPage === 1 || isQuestionsRefreshing}
                  className="min-h-11 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#0066cc]/30 hover:text-[#0052a6] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setQuestionCurrentPage((page) =>
                      Math.min(effectiveQuestionMeta.totalPages, page + 1),
                    )
                  }
                  disabled={
                    questionCurrentPage === effectiveQuestionMeta.totalPages ||
                    isQuestionsRefreshing
                  }
                  className="min-h-11 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#0066cc]/30 hover:text-[#0052a6] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          ) : null}

          {saveError ? (
            <p className="mt-4 rounded-2xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-800">
              {saveError}
            </p>
          ) : null}

          {saveSuccess ? (
            <p className="mt-4 rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-800">
              {saveSuccess}
            </p>
          ) : null}

          <div className="mt-5 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <p className="text-sm leading-6 text-slate-500">
              {isDirty
                ? "Hay cambios sin guardar en la configuracion del examen."
                : "La configuracion actual ya esta sincronizada con backend."}
            </p>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className="min-h-12 cursor-pointer rounded-2xl bg-[#0066cc] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0056ae] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isSaving ? "Guardando..." : "Guardar examen"}
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
