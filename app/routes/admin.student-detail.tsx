import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";

import { AdminMaterialAssignmentSortableItem } from "~/components/admin-material-assignment-sortable-item";
import {
  getAdminMaterials,
  getAdminStudentAttemptDetail,
  getAdminStudentAttempts,
  getAdminStudentDetail,
  getAdminStudentMaterialAssignments,
  getAdminStudentMaterialsProgress,
  updateAdminStudentMaterialAssignments,
  updateAdminStudentNote,
} from "~/lib/api/admin.service";
import { ApiError, normalizeError } from "~/lib/api/errors";
import type {
  AdminStudentAttemptItem,
  AdminStudentDetail,
  AdminStudentMaterialProgressItem,
  AttemptDetail,
  AttemptReviewQuestion,
  MaterialResponse,
} from "~/lib/api/types";
import {
  buildAssignmentEditorItems,
  syncAssignmentOrder,
  toAssignmentPayload,
  type AssignmentEditorItem,
} from "~/lib/material-assignment-editor";
import { getStudentProgressStats } from "~/lib/progress";

type ArrayNormalizationResult<T> = {
  items: T[];
  isValid: boolean;
};

type DetailTabId = "summary" | "materials" | "exams" | "notes";

const tabs: Array<{ id: DetailTabId; label: string }> = [
  { id: "summary", label: "Resumen" },
  { id: "materials", label: "Materiales" },
  { id: "exams", label: "Examenes" },
  { id: "notes", label: "Nota interna" },
];

function normalizeArrayPayload<T>(value: unknown): ArrayNormalizationResult<T> {
  if (Array.isArray(value)) {
    return { items: value as T[], isValid: true };
  }

  if (value && typeof value === "object") {
    const maybeArrayRecord = value as { data?: unknown; items?: unknown; results?: unknown };

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

function cloneAssignmentItems(items: AssignmentEditorItem[]): AssignmentEditorItem[] {
  return items.map((item) => ({
    ...item,
    category: { ...item.category },
    links: item.links.map((link) => ({ ...link })),
  }));
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

function getOptionClassName(question: AttemptReviewQuestion, optionId: string): string {
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

function panelId(tabId: DetailTabId): string {
  return `student-detail-panel-${tabId}`;
}

function tabId(tab: DetailTabId): string {
  return `student-detail-tab-${tab}`;
}

function Panel({
  eyebrow,
  title,
  description,
  aside,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0066cc]">
            {eyebrow}
          </p>
          <h3 className="mt-2 font-display text-2xl text-slate-900">{title}</h3>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm text-slate-600">{description}</p>
          ) : null}
        </div>
        {aside}
      </div>
      <div className="mt-5">{children}</div>
    </article>
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
    <div className="rounded-3xl border border-slate-100 bg-slate-50/90 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p className={`mt-3 inline-flex rounded-full px-3 py-1.5 font-display text-2xl ${toneClass}`}>
        {value}
      </p>
    </div>
  );
}

function SidebarField({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium text-slate-800">{value}</div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
      {message}
    </div>
  );
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
          <DetailMetric label="Puntaje" value={`${review.score}%`} tone="blue" />
          <DetailMetric label="Correctas" value={String(review.correctAnswers)} tone="emerald" />
          <DetailMetric label="Total" value={String(review.totalQuestions)} />
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
                    <div key={option.id} className={`rounded-xl border px-4 py-3 text-sm font-medium ${getOptionClassName(question, option.id)}`}>
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
  const [activeTab, setActiveTab] = useState<DetailTabId>("summary");
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
  const [allMaterials, setAllMaterials] = useState<MaterialResponse[]>([]);
  const [assignmentItems, setAssignmentItems] = useState<AssignmentEditorItem[]>([]);
  const [editorAssignmentItems, setEditorAssignmentItems] = useState<AssignmentEditorItem[]>([]);
  const [assignmentError, setAssignmentError] = useState("");
  const [assignmentSuccess, setAssignmentSuccess] = useState("");
  const [isAssignmentEditorLoading, setIsAssignmentEditorLoading] = useState(false);
  const [isSavingAssignments, setIsSavingAssignments] = useState(false);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [isPlanEditorOpen, setIsPlanEditorOpen] = useState(false);
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentCategoryFilter, setAssignmentCategoryFilter] = useState("all");

  const reviewRequestRef = useRef(0);
  const assignmentRequestRef = useRef(0);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const progressStats = studentDetail ? getStudentProgressStats(studentDetail.progress) : null;
  const whatsappHref = studentDetail ? buildWhatsAppHref(studentDetail.phone, studentDetail.fullName) : null;
  const mailtoHref = studentDetail ? buildMailtoHref(studentDetail.email, studentDetail.fullName) : "";
  const viewedMaterials = materialsProgress.filter((material) => material.viewed);
  const pendingMaterials = materialsProgress.filter((material) => !material.viewed);
  const unlockedAssignmentItems = assignmentItems.filter((item) => item.hasAccess);
  const lockedAssignmentItems = assignmentItems.filter((item) => !item.hasAccess);
  const editorUnlockedAssignmentItems = editorAssignmentItems.filter((item) => item.hasAccess);
  const editorLockedAssignmentItems = editorAssignmentItems.filter((item) => !item.hasAccess);
  const assignmentPreviewItems = unlockedAssignmentItems.slice(0, 5);
  const assignmentCategories = Array.from(
    new Set(editorAssignmentItems.map((item) => item.category.name)),
  ).sort((left, right) => left.localeCompare(right, "es"));
  const normalizedAssignmentSearch = assignmentSearch.trim().toLocaleLowerCase("es");
  const filteredEditorLockedAssignmentItems = editorLockedAssignmentItems.filter((item) => {
    const matchesSearch =
      normalizedAssignmentSearch.length === 0 ||
      item.title.toLocaleLowerCase("es").includes(normalizedAssignmentSearch) ||
      item.description.toLocaleLowerCase("es").includes(normalizedAssignmentSearch);
    const matchesCategory =
      assignmentCategoryFilter === "all" || item.category.name === assignmentCategoryFilter;

    return matchesSearch && matchesCategory;
  });
  const assignmentSignature = JSON.stringify(
    assignmentItems.map((item) => [item.id, item.hasAccess, item.position]),
  );
  const editorAssignmentSignature = JSON.stringify(
    editorAssignmentItems.map((item) => [item.id, item.hasAccess, item.position]),
  );
  const hasAssignmentChanges =
    isPlanEditorOpen && assignmentSignature !== editorAssignmentSignature;
  const addedAssignments = editorAssignmentItems.filter(
    (item) =>
      item.hasAccess && !assignmentItems.some((savedItem) => savedItem.id === item.id && savedItem.hasAccess),
  ).length;
  const removedAssignments = assignmentItems.filter(
    (item) =>
      item.hasAccess &&
      !editorAssignmentItems.some((draftItem) => draftItem.id === item.id && draftItem.hasAccess),
  ).length;
  const reorderedAssignments = editorUnlockedAssignmentItems.filter((item) => {
    const savedItem = assignmentItems.find((candidate) => candidate.id === item.id);
    return savedItem?.hasAccess && savedItem.position !== item.position;
  }).length;

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
      setActiveTab("summary");
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
      setIsPlanEditorOpen(false);
      setEditorAssignmentItems([]);
      setAssignmentSearch("");
      setAssignmentCategoryFilter("all");

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

    setIsSavingNote(true);
    setNoteError("");
    setNoteSuccess("");

    try {
      const savedNote = await updateAdminStudentNote(studentId, {
        content: noteInput.trim().length > 0 ? noteInput.trim() : null,
      });

      setStudentDetail((current) => (current ? { ...current, note: savedNote } : current));
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
      if (reviewRequestRef.current === requestId) {
        setReviewError(getFeatureMessage(error, "la revision del intento"));
      }
    } finally {
      if (reviewRequestRef.current === requestId) {
        setIsReviewLoading(false);
      }
    }
  }

  useEffect(() => {
    if (!studentId) {
      setAllMaterials([]);
      setAssignmentItems([]);
      setAssignmentError("");
      return;
    }

    let isMounted = true;
    const currentStudentId = studentId;
    const requestId = assignmentRequestRef.current + 1;
    assignmentRequestRef.current = requestId;

    async function loadAssignmentEditor() {
      setIsAssignmentEditorLoading(true);
      setAssignmentError("");
      setAssignmentSuccess("");

      try {
        const [materials, assignments] = await Promise.all([
          getAdminMaterials(),
          getAdminStudentMaterialAssignments(currentStudentId),
        ]);

        if (!isMounted || assignmentRequestRef.current !== requestId) {
          return;
        }

        setAllMaterials(materials);
        setAssignmentItems(buildAssignmentEditorItems(materials, assignments));
      } catch (error) {
        if (!isMounted || assignmentRequestRef.current !== requestId) {
          return;
        }

        setAllMaterials([]);
        setAssignmentItems([]);
        setAssignmentError(getFeatureMessage(error, "las asignaciones de materiales"));
      } finally {
        if (isMounted && assignmentRequestRef.current === requestId) {
          setIsAssignmentEditorLoading(false);
        }
      }
    }

    void loadAssignmentEditor();

    return () => {
      isMounted = false;
    };
  }, [studentId]);

  useEffect(() => {
    if (!isPlanEditorOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSavingAssignments) {
        setIsPlanEditorOpen(false);
        setEditorAssignmentItems(cloneAssignmentItems(assignmentItems));
        setAssignmentSearch("");
        setAssignmentCategoryFilter("all");
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [assignmentItems, isPlanEditorOpen, isSavingAssignments]);

  function openPlanEditor() {
    setEditorAssignmentItems(cloneAssignmentItems(assignmentItems));
    setAssignmentSearch("");
    setAssignmentCategoryFilter("all");
    setAssignmentError("");
    setAssignmentSuccess("");
    setIsPlanEditorOpen(true);
  }

  function closePlanEditor() {
    if (isSavingAssignments) {
      return;
    }

    setEditorAssignmentItems(cloneAssignmentItems(assignmentItems));
    setAssignmentSearch("");
    setAssignmentCategoryFilter("all");
    setIsPlanEditorOpen(false);
  }

  function toggleAssignment(materialId: string) {
    setEditorAssignmentItems((prev) =>
      syncAssignmentOrder(
        prev.map((item) => {
          if (item.id !== materialId || (!item.published && !item.hasAccess)) {
            return item;
          }

          return { ...item, hasAccess: !item.hasAccess };
        }),
      ),
    );
    setAssignmentSuccess("");
  }

  function moveAssignment(materialId: string, direction: "up" | "down") {
    setEditorAssignmentItems((prev) => {
      const unlocked = prev.filter((item) => item.hasAccess);
      const locked = prev.filter((item) => !item.hasAccess);
      const currentIndex = unlocked.findIndex((item) => item.id === materialId);
      const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (currentIndex === -1 || targetIndex < 0 || targetIndex >= unlocked.length) {
        return prev;
      }

      const nextUnlocked = [...unlocked];
      const currentItem = nextUnlocked[currentIndex];
      nextUnlocked[currentIndex] = nextUnlocked[targetIndex];
      nextUnlocked[targetIndex] = currentItem;

      return syncAssignmentOrder([...nextUnlocked, ...locked]);
    });
    setAssignmentSuccess("");
  }

  function handleAssignmentDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    setEditorAssignmentItems((prev) => {
      const unlocked = prev.filter((item) => item.hasAccess);
      const locked = prev.filter((item) => !item.hasAccess);
      const oldIndex = unlocked.findIndex((item) => item.id === active.id);
      const newIndex = unlocked.findIndex((item) => item.id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        return prev;
      }

      return syncAssignmentOrder([...arrayMove(unlocked, oldIndex, newIndex), ...locked]);
    });
    setAssignmentSuccess("");
  }

  async function handleSaveAssignments() {
    if (!studentId) {
      return;
    }

    setIsSavingAssignments(true);
    setAssignmentError("");
    setAssignmentSuccess("");

    try {
      const [savedAssignments, refreshedMaterialsProgress, refreshedDetail] = await Promise.all([
        updateAdminStudentMaterialAssignments(studentId, {
          assignments: toAssignmentPayload(editorAssignmentItems),
        }),
        getAdminStudentMaterialsProgress(studentId),
        getAdminStudentDetail(studentId),
      ]);

      const nextAssignmentItems = buildAssignmentEditorItems(allMaterials, savedAssignments);
      setAssignmentItems(nextAssignmentItems);
      setEditorAssignmentItems(cloneAssignmentItems(nextAssignmentItems));
      setMaterialsProgress(
        [...refreshedMaterialsProgress].sort((left, right) => left.position - right.position),
      );
      setStudentDetail((current) =>
        current ? { ...current, progress: refreshedDetail.progress } : current,
      );
      setAssignmentSuccess("Plan de materiales guardado.");
      setIsPlanEditorOpen(false);
    } catch (error) {
      setAssignmentError(getFeatureMessage(error, "las asignaciones de materiales"));
    } finally {
      setIsSavingAssignments(false);
    }
  }

  return (
    <>
      <section className="grid gap-4">
      <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              to="/admin/students"
              className="inline-flex rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600 transition hover:border-[#0066cc]/30 hover:text-[#0052a6]"
            >
              Volver a alumnos
            </Link>
            <h2 className="mt-4 font-display text-3xl text-slate-900">
              {studentDetail?.fullName ?? "Detalle del alumno"}
            </h2>
            <p className="mt-3 max-w-3xl text-sm text-slate-600">
              La ficha del alumno queda fija y el trabajo operativo se separa en tabs para reducir ruido visual.
            </p>
          </div>

          {studentDetail ? (
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

              <a
                href={mailtoHref}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#0066cc]/20 bg-[#0066cc]/6 px-4 py-3 text-sm font-semibold text-[#0052a6] transition hover:border-[#0066cc]/35 hover:bg-[#0066cc]/10"
              >
                <MailIcon />
                Enviar mail
              </a>
            </div>
          ) : null}
        </div>
      </article>

      {isStudentLoading ? (
        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <div className="h-96 animate-pulse rounded-3xl border border-white/70 bg-white/90" />
          <div className="grid gap-4">
            <div className="h-14 animate-pulse rounded-3xl border border-white/70 bg-white/90" />
            <div className="h-64 animate-pulse rounded-3xl border border-white/70 bg-white/90" />
            <div className="h-96 animate-pulse rounded-3xl border border-white/70 bg-white/90" />
          </div>
        </div>
      ) : detailError && !studentDetail ? (
        <article className="rounded-2xl bg-amber-50 p-6 text-sm font-semibold text-amber-900">
          {detailError}
        </article>
      ) : studentDetail ? (
        <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
          <aside className="grid gap-4 xl:sticky xl:top-4">
            <Panel eyebrow="Ficha" title="Perfil del alumno">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0066cc] text-xl font-bold text-white">
                  {buildInitials(studentDetail.fullName)}
                </div>
                <div className="min-w-0">
                  <p className="font-display text-xl text-slate-900">{studentDetail.fullName}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${studentDetail.approved ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      {studentDetail.approved ? "Aprobado" : "Pendiente"}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${studentDetail.blocked ? "bg-rose-100 text-rose-800" : "bg-blue-100 text-blue-800"}`}>
                      {studentDetail.blocked ? "Bloqueado" : "Acceso activo"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <SidebarField label="Email" value={studentDetail.email} />
                <SidebarField label="Telefono" value={studentDetail.phone ?? "Telefono no disponible"} />
                <SidebarField label="Ultimo puntaje" value={formatScore(studentDetail.lastAttemptScore)} />
                <SidebarField label="Ultimo cambio de acceso" value={formatDateTime(studentDetail.blockedAt)} />
              </div>
            </Panel>

            <Panel
              eyebrow="Acceso"
              title={studentDetail.blocked ? "Bloqueado" : "Habilitado"}
              description={
                studentDetail.blocked
                  ? "Si el alumno esta bloqueado, no puede iniciar sesion ni refrescar tokens."
                  : "El alumno puede ingresar al campus con sus credenciales vigentes."
              }
            >
              {studentDetail.blocked ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-900">
                  <p className="font-semibold">Motivo del bloqueo</p>
                  <p className="mt-2">{studentDetail.blockReason?.trim() ? studentDetail.blockReason : "Sin motivo registrado."}</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-4 text-sm text-blue-900">
                  <p className="font-semibold">Acceso activo</p>
                  <p className="mt-2">El alumno puede navegar el campus, ver materiales desbloqueados y rendir el examen.</p>
                </div>
              )}
            </Panel>

            {detailError ? (
              <article className="rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-900">
                {detailError}
              </article>
            ) : null}
          </aside>

          <div className="grid gap-4">
            <article className="rounded-3xl border border-white/70 bg-white/90 p-2 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
              <div role="tablist" aria-label="Secciones del detalle del alumno" className="flex flex-wrap gap-2">
                {tabs.map((tab) => {
                  const isActive = tab.id === activeTab;

                  return (
                    <button
                      key={tab.id}
                      id={tabId(tab.id)}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-controls={panelId(tab.id)}
                      onClick={() => setActiveTab(tab.id)}
                      className={`rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
                        isActive
                          ? "bg-[#0066cc] text-white shadow-[0_10px_24px_-14px_rgba(0,102,204,0.75)]"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </article>

            {activeTab === "summary" ? (
              <div id={panelId("summary")} role="tabpanel" aria-labelledby={tabId("summary")} className="grid gap-4">
                <Panel
                  eyebrow="Resumen"
                  title="Seguimiento academico"
                  aside={
                    <span className="rounded-full bg-[#0066cc]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#0052a6]">
                      {progressStats?.percentage ?? 0}%
                    </span>
                  }
                >
                  <div className="grid gap-3 lg:grid-cols-4">
                    <DetailMetric label="Materiales" value={`${studentDetail.progress.materialsViewed}/${studentDetail.progress.materialsTotal}`} tone="blue" />
                    <DetailMetric label="Intentos" value={String(studentDetail.stats.totalAttempts)} />
                    <DetailMetric label="Mejor puntaje" value={formatScore(studentDetail.stats.bestScore)} tone="emerald" />
                    <DetailMetric label="Certificado" value={studentDetail.progress.certificateIssued ? "Emitido" : "Pendiente"} tone={studentDetail.progress.certificateIssued ? "emerald" : "amber"} />
                  </div>

                  <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#0b7bff] via-[#0066cc] to-[#004da3]" style={{ width: `${progressStats?.percentage ?? 0}%` }} />
                  </div>

                  <p className="mt-3 text-sm text-slate-600">
                    {progressStats?.completedTasks ?? 0} de {progressStats?.totalTasks ?? 0} tareas completas.
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                      Ultimo intento: {formatDateTime(studentDetail.stats.lastAttemptAt)}
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                      Ultima aprobacion: {formatDateTime(studentDetail.stats.lastPassedAt)}
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
                      Intentos aprobados: {studentDetail.stats.passedAttempts} de {studentDetail.stats.totalAttempts}
                    </div>
                  </div>
                </Panel>

                <Panel eyebrow="Metricas" title="Rendimiento del alumno">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <DetailMetric label="Promedio" value={formatScore(studentDetail.stats.averageScore)} tone="blue" />
                    <DetailMetric label="Aprobados" value={String(studentDetail.stats.passedAttempts)} tone="emerald" />
                    <DetailMetric label="No aprobados" value={String(studentDetail.stats.failedAttempts)} tone="amber" />
                    <DetailMetric label="Examen" value={studentDetail.progress.examPassed ? "Aprobado" : "Pendiente"} tone={studentDetail.progress.examPassed ? "emerald" : "amber"} />
                  </div>
                </Panel>
              </div>
            ) : null}

            {activeTab === "materials" ? (
              <div id={panelId("materials")} role="tabpanel" aria-labelledby={tabId("materials")} className="grid gap-4">
                <Panel
                  eyebrow="Plan de materiales"
                  title="Resumen del plan actual"
                  description="La edición pesada del orden vive en un editor dedicado para que el listado pueda crecer sin comprimir esta vista."
                  aside={
                    <button
                      type="button"
                      onClick={openPlanEditor}
                      disabled={isAssignmentEditorLoading || assignmentItems.length === 0}
                      className="rounded-2xl bg-[#0066cc] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0056ae] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Editar plan
                    </button>
                  }
                >
                  {isAssignmentEditorLoading ? (
                    <div className="grid gap-3">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="h-24 animate-pulse rounded-2xl border border-slate-200 bg-white" />
                      ))}
                    </div>
                  ) : assignmentError ? (
                    <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">{assignmentError}</p>
                  ) : assignmentItems.length === 0 ? (
                    <EmptyState message="No hay materiales disponibles para configurar todavia." />
                  ) : (
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.9fr)]">
                      <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h4 className="font-display text-xl text-slate-900">Orden actual</h4>
                          <span className="rounded-full bg-[#0066cc]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#0052a6]">
                            {unlockedAssignmentItems.length} visibles
                          </span>
                        </div>

                        {assignmentPreviewItems.length === 0 ? (
                          <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white/80 px-4 py-6 text-sm text-slate-500">
                            Este alumno todavia no tiene materiales desbloqueados.
                          </p>
                        ) : (
                          <div className="mt-4 grid gap-3">
                            {assignmentPreviewItems.map((item) => (
                              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-[#0066cc]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0052a6]">
                                    Orden {item.position}
                                  </span>
                                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">
                                    {item.category.name}
                                  </span>
                                </div>
                                <p className="mt-3 font-semibold text-slate-900">{item.title}</p>
                                <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {unlockedAssignmentItems.length > assignmentPreviewItems.length ? (
                          <p className="mt-4 text-sm text-slate-500">
                            Y {unlockedAssignmentItems.length - assignmentPreviewItems.length} material
                            {unlockedAssignmentItems.length - assignmentPreviewItems.length === 1 ? "" : "es"} más dentro del plan.
                          </p>
                        ) : null}
                      </div>

                      <div className="grid gap-3">
                        <DetailMetric
                          label="Desbloqueados"
                          value={String(unlockedAssignmentItems.length)}
                          tone="blue"
                        />
                        <DetailMetric
                          label="Disponibles"
                          value={String(lockedAssignmentItems.length)}
                        />
                        <DetailMetric
                          label="Vistos"
                          value={String(viewedMaterials.length)}
                          tone="emerald"
                        />
                        <DetailMetric
                          label="Pendientes"
                          value={String(pendingMaterials.length)}
                          tone="amber"
                        />
                      </div>
                    </div>
                  )}

                  {assignmentSuccess ? (
                    <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{assignmentSuccess}</p>
                  ) : null}
                </Panel>

                <Panel
                  eyebrow="Progreso de materiales"
                  title="Vistos y pendientes"
                  aside={
                    <span className="rounded-full bg-[#0066cc]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#0052a6]">
                      {materialsProgress.length} asignados
                    </span>
                  }
                >
                  {isMaterialsLoading ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="h-48 animate-pulse rounded-3xl border border-slate-100 bg-slate-50" />
                      <div className="h-48 animate-pulse rounded-3xl border border-slate-100 bg-slate-50" />
                    </div>
                  ) : materialsError ? (
                    <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">{materialsError}</p>
                  ) : materialsProgress.length === 0 ? (
                    <EmptyState message="Este alumno no tiene materiales asignados todavia." />
                  ) : (
                    <div className="grid gap-4 xl:grid-cols-2">
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
                              <div key={material.materialId} className="rounded-2xl border border-emerald-100 bg-white/80 p-4">
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
                                  <span>{material.linksCount} enlace{material.linksCount === 1 ? "" : "s"}</span>
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
                              <div key={material.materialId} className="rounded-2xl border border-amber-100 bg-white/80 p-4">
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
                </Panel>
              </div>
            ) : null}
            {activeTab === "exams" ? (
              <div id={panelId("exams")} role="tabpanel" aria-labelledby={tabId("exams")} className="grid gap-4">
                <Panel
                  eyebrow="Examenes"
                  title="Historial y revision"
                  description="Las respuestas ahora viven en un panel dedicado dentro de este tab."
                  aside={
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {attempts.length} intentos
                    </span>
                  }
                >
                  {attemptsError ? (
                    <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">{attemptsError}</p>
                  ) : attempts.length === 0 ? (
                    <EmptyState message="No hay intentos registrados para este alumno." />
                  ) : (
                    <div className="grid gap-4 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
                      <div className="grid gap-3">
                        {attempts.map((attempt) => {
                          const isSelected = attempt.id === selectedAttemptId;

                          return (
                            <button
                              key={attempt.id}
                              type="button"
                              onClick={() => {
                                if (studentId) {
                                  void loadAttemptDetail(studentId, attempt.id);
                                }
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

                      <div className="xl:sticky xl:top-4">
                        {isReviewLoading ? (
                          <div className="h-80 animate-pulse rounded-3xl border border-white/70 bg-white/90" />
                        ) : reviewError ? (
                          <article className="rounded-3xl bg-amber-50 p-6 text-sm font-semibold text-amber-900 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.2)]">
                            {reviewError}
                          </article>
                        ) : selectedAttemptDetail ? (
                          <AttemptReviewCard review={selectedAttemptDetail} />
                        ) : (
                          <EmptyState message="Selecciona un intento para ver las respuestas del alumno." />
                        )}
                      </div>
                    </div>
                  )}
                </Panel>
              </div>
            ) : null}

            {activeTab === "notes" ? (
              <div id={panelId("notes")} role="tabpanel" aria-labelledby={tabId("notes")} className="grid gap-4">
                <Panel
                  eyebrow="Seguimiento interno"
                  title="Nota del alumno"
                  description="Uso interno del equipo admin. El alumno no ve este contenido."
                  aside={
                    studentDetail.note?.updatedAt ? (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {formatDateTime(studentDetail.note.updatedAt)}
                      </span>
                    ) : null
                  }
                >
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">Nota interna</span>
                    <textarea
                      value={noteInput}
                      onChange={(event) => {
                        setNoteInput(event.target.value);
                        if (noteSuccess) {
                          setNoteSuccess("");
                        }
                      }}
                      rows={8}
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
                    <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">{noteError}</p>
                  ) : null}
                  {noteSuccess ? (
                    <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{noteSuccess}</p>
                  ) : null}
                </Panel>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      </section>

      {isPlanEditorOpen ? (
        <div
          className="fixed inset-0 z-50 bg-slate-950/35 backdrop-blur-sm"
          onClick={closePlanEditor}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="plan-editor-title"
            className="absolute inset-x-3 bottom-3 top-3 overflow-hidden rounded-[2rem] border border-white/60 bg-[#f7fbff] shadow-[0_28px_80px_-32px_rgba(2,32,72,0.55)] sm:inset-x-6 lg:inset-x-10"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex h-full flex-col">
              <div className="border-b border-slate-200/80 bg-white/85 px-5 py-4 backdrop-blur lg:px-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0066cc]">
                      Editor de plan
                    </p>
                    <h3 id="plan-editor-title" className="mt-2 font-display text-3xl text-slate-900">
                      Orden y desbloqueo de materiales
                    </h3>
                    <p className="mt-2 max-w-3xl text-sm text-slate-600">
                      Edita el plan completo sin comprimir la vista del alumno. A la izquierda queda el orden visible; a la derecha, la biblioteca disponible para sumar o quitar.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closePlanEditor}
                    disabled={isSavingAssignments}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cerrar
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 lg:px-6">
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
                  <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.22)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0066cc]">
                          Plan actual
                        </p>
                        <h4 className="mt-2 font-display text-2xl text-slate-900">
                          Materiales desbloqueados
                        </h4>
                        <p className="mt-2 text-sm text-slate-600">
                          Arrastra para cambiar el orden que ve el alumno. También puedes bloquear un material para quitarlo del plan.
                        </p>
                      </div>
                      <span className="rounded-full bg-[#0066cc]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#0052a6]">
                        {editorUnlockedAssignmentItems.length} visibles
                      </span>
                    </div>

                    <div className="mt-5 max-h-[60vh] overflow-y-auto pr-1">
                      {editorUnlockedAssignmentItems.length > 0 ? (
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleAssignmentDragEnd}
                        >
                          <SortableContext
                            items={editorUnlockedAssignmentItems.map((item) => item.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <ul className="grid gap-3">
                              {editorUnlockedAssignmentItems.map((item) => (
                                <AdminMaterialAssignmentSortableItem
                                  key={item.id}
                                  item={{
                                    id: item.id,
                                    title: item.title,
                                    description: item.description,
                                    hasAccess: item.hasAccess,
                                    position: item.position,
                                    published: item.published,
                                    linksCount: item.links.length,
                                    categoryName: item.category.name,
                                  }}
                                  unlockedCount={editorUnlockedAssignmentItems.length}
                                  onToggleAssignment={toggleAssignment}
                                  onMoveAssignment={moveAssignment}
                                />
                              ))}
                            </ul>
                          </SortableContext>
                        </DndContext>
                      ) : (
                        <EmptyState message="Este alumno no tiene materiales desbloqueados en el borrador actual." />
                      )}
                    </div>
                  </section>

                  <section className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.22)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0066cc]">
                          Biblioteca disponible
                        </p>
                        <h4 className="mt-2 font-display text-2xl text-slate-900">
                          Materiales bloqueados
                        </h4>
                        <p className="mt-2 text-sm text-slate-600">
                          Busca, filtra por categoría y agrega materiales al final del plan visible.
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                        {filteredEditorLockedAssignmentItems.length} resultado{filteredEditorLockedAssignmentItems.length === 1 ? "" : "s"}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <label className="grid gap-1.5">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Buscar
                        </span>
                        <input
                          value={assignmentSearch}
                          onChange={(event) => setAssignmentSearch(event.target.value)}
                          placeholder="Buscar por titulo o descripcion"
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
                        />
                      </label>

                      <label className="grid gap-1.5">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Categoria
                        </span>
                        <select
                          value={assignmentCategoryFilter}
                          onChange={(event) => setAssignmentCategoryFilter(event.target.value)}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
                        >
                          <option value="all">Todas</option>
                          {assignmentCategories.map((categoryName) => (
                            <option key={categoryName} value={categoryName}>
                              {categoryName}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="mt-5 max-h-[60vh] overflow-y-auto pr-1">
                      {filteredEditorLockedAssignmentItems.length > 0 ? (
                        <ul className="grid gap-3">
                          {filteredEditorLockedAssignmentItems.map((item) => {
                            const canEnable = item.published || item.hasAccess;

                            return (
                              <li key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="font-semibold text-slate-900">{item.title}</p>
                                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                                        {item.category.name}
                                      </span>
                                      {!item.published ? (
                                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                          Borrador
                                        </span>
                                      ) : null}
                                    </div>
                                    <p className="mt-2 text-slate-600">{item.description}</p>
                                    <p className="mt-2 text-xs text-slate-500">
                                      {item.links.length} enlace{item.links.length === 1 ? "" : "s"} en la biblioteca.
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => toggleAssignment(item.id)}
                                    disabled={!canEnable}
                                    className="rounded-xl bg-[#0066cc] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#0056ae] disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    Agregar al plan
                                  </button>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <EmptyState message="No hay materiales bloqueados que coincidan con la búsqueda o el filtro actual." />
                      )}
                    </div>
                  </section>
                </div>
              </div>

              <div className="border-t border-slate-200/80 bg-white/90 px-5 py-4 backdrop-blur lg:px-6">
                {assignmentError ? (
                  <p className="mb-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                    {assignmentError}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                      {editorUnlockedAssignmentItems.length} visibles
                    </span>
                    {hasAssignmentChanges ? (
                      <>
                        {addedAssignments > 0 ? (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-800">
                            +{addedAssignments} agregados
                          </span>
                        ) : null}
                        {removedAssignments > 0 ? (
                          <span className="rounded-full bg-rose-100 px-3 py-1 font-semibold text-rose-800">
                            {removedAssignments} bloqueados
                          </span>
                        ) : null}
                        {reorderedAssignments > 0 ? (
                          <span className="rounded-full bg-blue-100 px-3 py-1 font-semibold text-blue-800">
                            {reorderedAssignments} reordenados
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-600">
                        Sin cambios
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={closePlanEditor}
                      disabled={isSavingAssignments}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSaveAssignments()}
                      disabled={isSavingAssignments || !hasAssignmentChanges}
                      className="rounded-2xl bg-[#0066cc] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0056ae] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSavingAssignments ? "Guardando..." : "Guardar plan"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
