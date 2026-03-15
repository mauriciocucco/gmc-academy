import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";

import {
  getAdminStudentAttemptDetail,
  getAdminStudentAttempts,
  getAdminStudentDetail,
  getAdminStudentMaterialsProgress,
  updateAdminStudentNote,
} from "~/lib/api/admin.service";
import { ApiError, normalizeError } from "~/lib/api/errors";
import { getStudentProgressStats } from "~/lib/progress";
import type {
  AdminStudentAttemptItem,
  AdminStudentDetail,
  AdminStudentMaterialProgressItem,
  AttemptDetail,
  AttemptReviewQuestion,
} from "~/lib/api/types";

type ArrayNormalizationResult<T> = {
  items: T[];
  isValid: boolean;
};

function normalizeArrayPayload<T>(value: unknown): ArrayNormalizationResult<T> {
  if (Array.isArray(value)) {
    return { items: value as T[], isValid: true };
  }

  if (value && typeof value === "object") {
    const maybeArrayRecord = value as {
      data?: unknown;
      items?: unknown;
      results?: unknown;
    };

    if (Array.isArray(maybeArrayRecord.data)) {
      return { items: maybeArrayRecord.data as T[], isValid: true };
    }

    if (Array.isArray(maybeArrayRecord.items)) {
      return { items: maybeArrayRecord.items as T[], isValid: true };
    }

    if (Array.isArray(maybeArrayRecord.results)) {
      return { items: maybeArrayRecord.results as T[], isValid: true };
    }
  }

  return { items: [], isValid: false };
}

function formatScore(score: number | null): string {
  return score !== null ? `${score}%` : "Sin intento";
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Sin registro";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function buildInitials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0]?.toUpperCase() ?? "")
    .join("");
}

function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function buildWhatsAppHref(phone: string | null, fullName: string): string | null {
  if (!phone) {
    return null;
  }

  const digits = sanitizePhone(phone);

  if (!digits) {
    return null;
  }

  const message = `Hola ${fullName}, te escribimos desde Autoescuela GMC para hacer seguimiento de tu avance en la plataforma.`;

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function buildMailtoHref(email: string, fullName: string): string {
  const params = new URLSearchParams({
    subject: "Seguimiento academico GMC",
    body: `Hola ${fullName},\n\nTe escribimos desde Autoescuela GMC para hacer seguimiento de tu avance en la plataforma.`,
  });

  return `mailto:${email}?${params.toString()}`;
}

function getFeatureMessage(error: unknown, resourceName: string): string {
  if (error instanceof ApiError && error.status === 404) {
    return `El backend todavia no expone ${resourceName} para admin.`;
  }

  return normalizeError(error).message;
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

  if (isCorrect) {
    return "border-blue-500 bg-blue-50 text-blue-900";
  }

  return "border-slate-200 bg-slate-50 text-slate-500";
}

function WhatsAppIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M19.05 4.94A9.8 9.8 0 0 0 12.09 2c-5.43 0-9.84 4.4-9.84 9.83 0 1.74.46 3.45 1.33 4.95L2 22l5.37-1.4a9.8 9.8 0 0 0 4.71 1.2h.01c5.42 0 9.83-4.41 9.83-9.84a9.76 9.76 0 0 0-2.87-7.02ZM12.09 20.14h-.01a8.16 8.16 0 0 1-4.16-1.14l-.3-.18-3.19.83.85-3.11-.2-.32a8.17 8.17 0 0 1 1.26-10.09 8.13 8.13 0 0 1 5.79-2.4c4.52 0 8.18 3.67 8.19 8.18a8.18 8.18 0 0 1-8.23 8.23Zm4.48-6.11c-.24-.12-1.4-.69-1.62-.77-.22-.08-.38-.12-.54.12-.16.24-.62.77-.76.93-.14.16-.28.18-.52.06-.24-.12-1-.37-1.91-1.18-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.31.98 2.47c.12.16 1.68 2.57 4.08 3.61.57.25 1.02.4 1.37.51.58.18 1.1.15 1.52.09.46-.07 1.4-.57 1.6-1.12.2-.55.2-1.02.14-1.12-.06-.1-.22-.16-.46-.28Z" />
    </svg>
  );
}

function MailIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function DetailMetric({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string;
  tone?: "slate" | "blue" | "emerald" | "amber";
}) {
  const toneClass =
    tone === "blue"
      ? "bg-[#0066cc]/10 text-[#0052a6]"
      : tone === "emerald"
        ? "bg-emerald-100 text-emerald-800"
        : tone === "amber"
          ? "bg-amber-100 text-amber-800"
          : "bg-slate-100 text-slate-700";

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className={`mt-3 inline-flex rounded-full px-3 py-1.5 font-display text-2xl ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}

function AttemptReviewCard({ review }: { review: AttemptDetail }) {
  return (
    <div className="grid gap-4">
      <article className="rounded-3xl border border-[#0066cc]/10 bg-[linear-gradient(135deg,#072447_0%,#0b3b73_48%,#0c5cb4_100%)] p-6 text-white shadow-[0_20px_40px_-26px_rgba(7,36,71,0.9)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100/80">
              Revision del intento
            </p>
            <h3 className="mt-2 font-display text-3xl">
              {review.passed ? "Aprobado" : "No aprobado"}
            </h3>
            <p className="mt-2 text-sm text-blue-50/85">
              {review.examTitle} - {formatDateTime(review.createdAt)}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${review.passed ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>
            {review.passed ? "Aprobado" : "A reforzar"}
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100/80">Puntaje</p>
            <p className="mt-3 font-display text-4xl">{review.score}%</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100/80">Correctas</p>
            <p className="mt-3 font-display text-4xl">{review.correctAnswers}</p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-100/80">Total</p>
            <p className="mt-3 font-display text-4xl">{review.totalQuestions}</p>
          </div>
        </div>
      </article>

      <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
        <h3 className="font-display text-xl text-slate-900">Respuestas del alumno</h3>
        <div className="mt-5 grid gap-6">
          {review.questions.map((question) => (
            <div key={question.questionId}>
              <p className="mb-3 font-semibold leading-relaxed text-slate-900">
                <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0066cc] text-xs font-bold text-white">
                  {question.position}
                </span>
                {question.questionText}
              </p>

              <div className="grid gap-2 pl-8">
                {question.options.map((option) => {
                  const isSelected = question.selectedOptionId === option.id;

                  return (
                    <div
                      key={option.id}
                      className={`rounded-xl border px-4 py-3 text-sm font-medium ${getOptionClassName(question, option.id)}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span>{option.label}</span>
                        {isSelected ? (
                          <span className="rounded-full bg-white/70 px-2 py-1 text-[11px] font-bold uppercase tracking-wide">
                            {question.isCorrect ? "Correcta" : "Incorrecta"}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}

                {question.selectedOptionId === null ? (
                  <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                    Esta pregunta quedo sin responder.
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}

export default function AdminStudentDetailPage() {
  const { studentId } = useParams();
  const [studentDetail, setStudentDetail] = useState<AdminStudentDetail | null>(null);
  const [detailError, setDetailError] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [noteError, setNoteError] = useState("");
  const [noteSuccess, setNoteSuccess] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [materialsProgress, setMaterialsProgress] = useState<AdminStudentMaterialProgressItem[]>([]);
  const [materialsError, setMaterialsError] = useState("");
  const [attempts, setAttempts] = useState<AdminStudentAttemptItem[]>([]);
  const [attemptsError, setAttemptsError] = useState("");
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [selectedAttemptDetail, setSelectedAttemptDetail] = useState<AttemptDetail | null>(null);
  const [reviewError, setReviewError] = useState("");
  const [isStudentLoading, setIsStudentLoading] = useState(true);
  const [isMaterialsLoading, setIsMaterialsLoading] = useState(false);
  const [isReviewLoading, setIsReviewLoading] = useState(false);

  const reviewRequestRef = useRef(0);
  const progressStats = studentDetail ? getStudentProgressStats(studentDetail.progress) : null;
  const whatsappHref = studentDetail ? buildWhatsAppHref(studentDetail.phone, studentDetail.fullName) : null;
  const mailtoHref = studentDetail ? buildMailtoHref(studentDetail.email, studentDetail.fullName) : null;
  const viewedMaterials = materialsProgress.filter((material) => material.viewed);
  const pendingMaterials = materialsProgress.filter((material) => !material.viewed);

  useEffect(() => {
    if (!studentId) {
      setIsStudentLoading(false);
      setDetailError("No se indico un alumno valido.");
      return;
    }

    let isMounted = true;
    const currentStudentId = studentId;

    async function loadStudent() {
      setIsStudentLoading(true);
      setDetailError("");
      setNoteError("");
      setNoteSuccess("");
      setNoteInput("");
      setMaterialsError("");
      setAttemptsError("");
      setReviewError("");
      setStudentDetail(null);
      setMaterialsProgress([]);
      setAttempts([]);
      setSelectedAttemptId(null);
      setSelectedAttemptDetail(null);
      setIsMaterialsLoading(true);
      setIsReviewLoading(false);

      const [detailResult, attemptsResult, materialsResult] = await Promise.allSettled([
        getAdminStudentDetail(currentStudentId),
        getAdminStudentAttempts(currentStudentId),
        getAdminStudentMaterialsProgress(currentStudentId),
      ]);

      if (!isMounted) {
        return;
      }

      let attemptItems: AdminStudentAttemptItem[] = [];

      if (detailResult.status === "fulfilled") {
        setStudentDetail(detailResult.value);
        setNoteInput(detailResult.value.note?.content ?? "");
      } else {
        setDetailError(getFeatureMessage(detailResult.reason, "el detalle del alumno"));
      }

      if (attemptsResult.status === "fulfilled") {
        const normalized = normalizeArrayPayload<AdminStudentAttemptItem>(attemptsResult.value);
        attemptItems = [...normalized.items].sort(
          (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
        );
        setAttempts(attemptItems);
        setAttemptsError(
          normalized.isValid ? "" : "El historial de intentos llego con un formato no esperado.",
        );
      } else {
        setAttemptsError(getFeatureMessage(attemptsResult.reason, "el historial de intentos"));
      }

      if (materialsResult.status === "fulfilled") {
        const normalized = normalizeArrayPayload<AdminStudentMaterialProgressItem>(
          materialsResult.value,
        );
        setMaterialsProgress(
          [...normalized.items].sort((left, right) => left.position - right.position),
        );
        setMaterialsError(
          normalized.isValid
            ? ""
            : "El progreso de materiales llego con un formato no esperado.",
        );
      } else {
        setMaterialsError(getFeatureMessage(materialsResult.reason, "el progreso de materiales"));
      }

      setIsStudentLoading(false);
      setIsMaterialsLoading(false);

      if (attemptItems.length > 0) {
        void loadAttemptDetail(currentStudentId, attemptItems[0].id);
      }
    }

    void loadStudent();

    return () => {
      isMounted = false;
    };
  }, [studentId]);

  async function handleSaveNote() {
    if (!studentId) {
      return;
    }

    const trimmedContent = noteInput.trim();
    const content = trimmedContent.length > 0 ? trimmedContent : null;

    setIsSavingNote(true);
    setNoteError("");
    setNoteSuccess("");

    try {
      const savedNote = await updateAdminStudentNote(studentId, { content });

      setStudentDetail((current) =>
        current
          ? {
              ...current,
              note: savedNote,
            }
          : current,
      );
      setNoteInput(savedNote.content ?? "");
      setNoteSuccess("Nota guardada.");
    } catch (error) {
      setNoteError(getFeatureMessage(error, "las notas internas"));
    } finally {
      setIsSavingNote(false);
    }
  }

  async function loadAttemptDetail(currentStudentId: string, attemptId: string) {
    const requestId = reviewRequestRef.current + 1;
    reviewRequestRef.current = requestId;

    setSelectedAttemptId(attemptId);
    setSelectedAttemptDetail(null);
    setReviewError("");
    setIsReviewLoading(true);

    try {
      const detail = await getAdminStudentAttemptDetail(currentStudentId, attemptId);

      if (reviewRequestRef.current !== requestId) {
        return;
      }

      setSelectedAttemptDetail(detail);
    } catch (error) {
      if (reviewRequestRef.current !== requestId) {
        return;
      }

      setReviewError(getFeatureMessage(error, "la revision del intento"));
    } finally {
      if (reviewRequestRef.current === requestId) {
        setIsReviewLoading(false);
      }
    }
  }

  return (
    <section className="grid gap-4">
      <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
        <Link
          to="/admin/students"
          className="inline-flex rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 transition hover:border-[#0066cc]/30 hover:text-[#0052a6]"
        >
          Volver a alumnos
        </Link>
        <h2 className="mt-4 font-display text-3xl text-slate-900">
          {studentDetail?.fullName ?? "Detalle del alumno"}
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Vista individual con progreso, estadisticas, historial de examenes, respuestas y canales de contacto.
        </p>
      </article>

      {isStudentLoading ? (
        <div className="grid gap-4">
          <div className="h-48 animate-pulse rounded-3xl border border-white/70 bg-white/90" />
          <div className="h-64 animate-pulse rounded-3xl border border-white/70 bg-white/90" />
          <div className="h-80 animate-pulse rounded-3xl border border-white/70 bg-white/90" />
        </div>
      ) : detailError && !studentDetail ? (
        <article className="rounded-2xl bg-amber-50 p-6 text-sm font-semibold text-amber-900">
          {detailError}
        </article>
      ) : studentDetail ? (
        <div className="grid gap-4">
          <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0066cc] text-lg font-bold text-white">
                  {buildInitials(studentDetail.fullName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-2xl text-slate-900">{studentDetail.fullName}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${studentDetail.approved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      {studentDetail.approved ? "Aprobado" : "Pendiente"}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${studentDetail.blocked ? "bg-rose-100 text-rose-800" : "bg-blue-100 text-blue-800"}`}>
                      {studentDetail.blocked ? "Bloqueado" : "Acceso activo"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{studentDetail.email}</p>
                  <p className="mt-1 text-sm text-slate-500">{studentDetail.phone ?? "Telefono no disponible"}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    Ultimo cambio de acceso: {formatDateTime(studentDetail.blockedAt)}
                  </p>
                </div>
              </div>

              <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2">
                {whatsappHref ? (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25d366] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1ebe5d]"
                  >
                    <WhatsAppIcon />
                    Enviar WhatsApp
                  </a>
                ) : (
                  <span className="inline-flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm font-semibold text-slate-400">
                    <WhatsAppIcon />
                    WhatsApp no disponible
                  </span>
                )}

                {mailtoHref ? (
                  <a
                    href={mailtoHref}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#0066cc]/20 bg-[#0066cc]/6 px-4 py-3 text-sm font-semibold text-[#0052a6] transition hover:border-[#0066cc]/35 hover:bg-[#0066cc]/10"
                  >
                    <MailIcon />
                    Enviar mail
                  </a>
                ) : null}
              </div>
            </div>

            {detailError ? (
              <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                {detailError}
              </p>
            ) : null}

            {studentDetail.blocked ? (
              <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-900">
                <p className="font-semibold">Acceso bloqueado</p>
                <p className="mt-1">
                  Este alumno no puede iniciar sesion ni usar endpoints protegidos.
                </p>
                <p className="mt-2">
                  Motivo: {studentDetail.blockReason?.trim() ? studentDetail.blockReason : "Sin motivo registrado."}
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-4 text-sm text-blue-900">
                <p className="font-semibold">Acceso habilitado</p>
                <p className="mt-1">
                  El alumno puede ingresar al campus con sus credenciales vigentes.
                </p>
              </div>
            )}
          </article>

          <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0066cc]">Progresion</p>
                <h3 className="mt-2 font-display text-2xl text-slate-900">Seguimiento academico</h3>
              </div>
              <span className="rounded-full bg-[#0066cc]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#0052a6]">
                {progressStats?.percentage ?? 0}%
              </span>
            </div>

            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0b7bff] via-[#0066cc] to-[#004da3]"
                style={{ width: `${progressStats?.percentage ?? 0}%` }}
              />
            </div>

            <p className="mt-3 text-sm text-slate-600">
              {progressStats?.completedTasks ?? 0} de {progressStats?.totalTasks ?? 0} tareas completas.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <DetailMetric
                label="Materiales"
                value={`${studentDetail.progress.materialsViewed}/${studentDetail.progress.materialsTotal}`}
                tone="blue"
              />
              <DetailMetric
                label="Certificado"
                value={studentDetail.progress.certificateIssued ? "Emitido" : "Pendiente"}
                tone={studentDetail.progress.certificateIssued ? "emerald" : "amber"}
              />
            </div>
          </article>

          <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0066cc]">
                  Seguimiento interno
                </p>
                <h3 className="mt-2 font-display text-2xl text-slate-900">Nota del alumno</h3>
              </div>
              {studentDetail.note?.updatedAt ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  {formatDateTime(studentDetail.note.updatedAt)}
                </span>
              ) : null}
            </div>

            <p className="mt-3 text-sm text-slate-600">
              Uso interno del equipo admin. El alumno no ve este contenido.
            </p>

            <label className="mt-5 block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                Nota interna
              </span>
              <textarea
                value={noteInput}
                onChange={(event) => {
                  setNoteInput(event.target.value);
                  if (noteSuccess) {
                    setNoteSuccess("");
                  }
                }}
                rows={5}
                placeholder="Ej. Necesita refuerzo en prioridad de paso y seguimiento por WhatsApp."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
              />
            </label>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                {studentDetail.note?.updatedByName ? (
                  <span>Ultima edicion por {studentDetail.note.updatedByName}.</span>
                ) : (
                  <span>Sin notas registradas todavia.</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => void handleSaveNote()}
                disabled={isSavingNote}
                className="rounded-xl bg-[#0066cc] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0056ae] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingNote ? "Guardando..." : "Guardar nota"}
              </button>
            </div>

            {noteError ? (
              <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                {noteError}
              </p>
            ) : null}

            {noteSuccess ? (
              <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                {noteSuccess}
              </p>
            ) : null}
          </article>

          <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0066cc]">
                  Materiales
                </p>
                <h3 className="mt-2 font-display text-2xl text-slate-900">
                  Vistos y pendientes
                </h3>
              </div>
              <span className="rounded-full bg-[#0066cc]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#0052a6]">
                {materialsProgress.length} asignados
              </span>
            </div>

            <p className="mt-3 text-sm text-slate-600">
              Se listan solo los materiales desbloqueados para este alumno y en el orden definido por admin.
            </p>

            {isMaterialsLoading ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="h-48 animate-pulse rounded-3xl border border-slate-100 bg-slate-50" />
                <div className="h-48 animate-pulse rounded-3xl border border-slate-100 bg-slate-50" />
              </div>
            ) : materialsError ? (
              <p className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                {materialsError}
              </p>
            ) : materialsProgress.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                Este alumno no tiene materiales asignados todavia.
              </div>
            ) : (
              <div className="mt-5 grid gap-4 xl:grid-cols-2">
                <div className="rounded-3xl border border-emerald-100 bg-emerald-50/60 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-display text-xl text-slate-900">Vistos</h4>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
                      {viewedMaterials.length}
                    </span>
                  </div>

                  {viewedMaterials.length === 0 ? (
                    <p className="mt-4 rounded-2xl border border-dashed border-emerald-200 bg-white/70 px-4 py-6 text-sm text-slate-500">
                      Todavia no marco materiales como vistos.
                    </p>
                  ) : (
                    <div className="mt-4 grid gap-3">
                      {viewedMaterials.map((material) => (
                        <div
                          key={material.materialId}
                          className="rounded-2xl border border-emerald-100 bg-white/80 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-[#0066cc]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0052a6]">
                                  Paso {material.position}
                                </span>
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                                  {material.category.name}
                                </span>
                              </div>
                              <p className="mt-3 font-semibold text-slate-900">{material.title}</p>
                              <p className="mt-1 text-sm text-slate-600">{material.description}</p>
                            </div>
                            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                              Visto
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                            <span>
                              {material.linksCount} enlace{material.linksCount === 1 ? "" : "s"}
                            </span>
                            <span>Visto: {formatDateTime(material.viewedAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-amber-100 bg-amber-50/60 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-display text-xl text-slate-900">Pendientes</h4>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">
                      {pendingMaterials.length}
                    </span>
                  </div>

                  {pendingMaterials.length === 0 ? (
                    <p className="mt-4 rounded-2xl border border-dashed border-amber-200 bg-white/70 px-4 py-6 text-sm text-slate-500">
                      No quedan materiales pendientes.
                    </p>
                  ) : (
                    <div className="mt-4 grid gap-3">
                      {pendingMaterials.map((material) => (
                        <div
                          key={material.materialId}
                          className="rounded-2xl border border-amber-100 bg-white/80 p-4"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-[#0066cc]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0052a6]">
                                  Paso {material.position}
                                </span>
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                                  {material.category.name}
                                </span>
                              </div>
                              <p className="mt-3 font-semibold text-slate-900">{material.title}</p>
                              <p className="mt-1 text-sm text-slate-600">{material.description}</p>
                            </div>
                            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                              Pendiente
                            </span>
                          </div>
                          <div className="mt-3 text-xs text-slate-500">
                            {material.linksCount} enlace{material.linksCount === 1 ? "" : "s"} disponibles
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </article>

          <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0066cc]">Estadisticas</p>
              <h3 className="mt-2 font-display text-2xl text-slate-900">Rendimiento del alumno</h3>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <DetailMetric label="Intentos" value={String(studentDetail.stats.totalAttempts)} />
              <DetailMetric label="Promedio" value={formatScore(studentDetail.stats.averageScore)} tone="blue" />
              <DetailMetric label="Mejor puntaje" value={formatScore(studentDetail.stats.bestScore)} tone="emerald" />
              <DetailMetric label="Aprobados" value={String(studentDetail.stats.passedAttempts)} tone="amber" />
            </div>

            <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                Ultimo intento: {formatDateTime(studentDetail.stats.lastAttemptAt)}
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                Ultima aprobacion: {formatDateTime(studentDetail.stats.lastPassedAt)}
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0066cc]">Examenes</p>
                <h3 className="mt-2 font-display text-2xl text-slate-900">Historial y revision</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {attempts.length} intentos
              </span>
            </div>

            {attemptsError ? (
              <p className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                {attemptsError}
              </p>
            ) : attempts.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                No hay intentos registrados para este alumno.
              </div>
            ) : (
              <div className="mt-5 grid gap-3">
                {attempts.map((attempt) => {
                  const isSelected = attempt.id === selectedAttemptId;

                  return (
                    <button
                      key={attempt.id}
                      type="button"
                      onClick={() => {
                        if (!studentId) {
                          return;
                        }

                        void loadAttemptDetail(studentId, attempt.id);
                      }}
                      className={`rounded-2xl border px-4 py-4 text-left transition ${
                        isSelected
                          ? "border-[#0066cc]/30 bg-[#0066cc]/6"
                          : "border-slate-100 bg-slate-50/70 hover:border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{attempt.examTitle}</p>
                          <p className="mt-1 text-sm text-slate-500">{formatDateTime(attempt.createdAt)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                            {attempt.score}%
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${attempt.passed ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                            {attempt.passed ? "Aprobado" : "No aprobado"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </article>

          {isReviewLoading ? (
            <div className="h-80 animate-pulse rounded-3xl border border-white/70 bg-white/90" />
          ) : reviewError ? (
            <article className="rounded-3xl bg-amber-50 p-6 text-sm font-semibold text-amber-900 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.2)]">
              {reviewError}
            </article>
          ) : selectedAttemptDetail ? (
            <AttemptReviewCard review={selectedAttemptDetail} />
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
