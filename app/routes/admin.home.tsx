import { useEffect, useState } from "react";

import {
  getAdminPerformance,
  getAdminStats,
  getAdminStudents,
} from "~/lib/api/admin.service";
import { normalizeError } from "~/lib/api/errors";
import type {
  AdminPerformanceItem,
  AdminStats,
  AdminStudentItem,
} from "~/lib/api/types";

type CardTone = "blue" | "emerald" | "amber" | "slate";

type ScoreBand = {
  label: string;
  count: number;
  tone: CardTone;
};

type ArrayNormalizationResult<T> = {
  items: T[];
  isValid: boolean;
};

function DashboardCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`rounded-3xl border border-white/70 bg-white/90 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)] backdrop-blur ${className}`}
    >
      {children}
    </article>
  );
}

function toneClasses(tone: CardTone) {
  if (tone === "blue") {
    return {
      badge: "bg-[#0066cc]/12 text-[#0052a6]",
      dot: "bg-[#0066cc]",
      bar: "from-[#0b7bff] via-[#0066cc] to-[#004da3]",
    };
  }

  if (tone === "emerald") {
    return {
      badge: "bg-emerald-100 text-emerald-800",
      dot: "bg-emerald-500",
      bar: "from-emerald-300 via-emerald-400 to-emerald-500",
    };
  }

  if (tone === "amber") {
    return {
      badge: "bg-amber-100 text-amber-800",
      dot: "bg-amber-500",
      bar: "from-amber-200 via-amber-300 to-amber-400",
    };
  }

  return {
    badge: "bg-slate-100 text-slate-700",
    dot: "bg-slate-400",
    bar: "from-slate-200 via-slate-300 to-slate-400",
  };
}

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone: CardTone;
}) {
  const toneStyle = toneClasses(tone);

  return (
    <DashboardCard className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-h-24 flex-col justify-between">
          <p className="min-h-10 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            {label}
          </p>
          <p
            className={`inline-flex w-fit rounded-2xl px-3 py-1.5 font-display text-3xl leading-none ${toneStyle.badge}`}
          >
            {value}
          </p>
        </div>
        <span
          className={`mt-1 h-3 w-3 rounded-full shadow-[0_0_0_6px_rgba(255,255,255,0.65)] ${toneStyle.dot}`}
          aria-hidden="true"
        />
      </div>
      <p className="mt-4 text-sm text-slate-600">{hint}</p>
    </DashboardCard>
  );
}

function DonutChart({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const safeValue = Math.min(100, Math.max(0, value));
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - safeValue / 100);

  return (
    <div className="relative flex h-40 w-40 items-center justify-center">
      <svg
        viewBox="0 0 140 140"
        className="h-full w-full -rotate-90"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="approvalRing" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="55%" stopColor="#0066cc" />
            <stop offset="100%" stopColor="#004da3" />
          </linearGradient>
        </defs>
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="rgba(148, 163, 184, 0.2)"
          strokeWidth="14"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="url(#approvalRing)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <div className="absolute left-1/2 top-1/2 flex w-[5.5rem] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center text-center">
        <span className="font-display text-4xl leading-none text-slate-900">
          {safeValue}%
        </span>
        <span className="mt-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">
          {label}
        </span>
      </div>
    </div>
  );
}

function PerformanceChart({
  items,
  unavailable,
}: {
  items: AdminPerformanceItem[];
  unavailable: boolean;
}) {
  const maxValue =
    items.length > 0 ? Math.max(...items.map((item) => item.attempts), 1) : 1;

  return (
    <DashboardCard className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0066cc]">
            Actividad reciente
          </p>
          <h3 className="mt-2 font-display text-2xl text-slate-900">
            Intentos vs aprobaciones
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
            Intentos
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0066cc]" />
            Aprobados
          </span>
        </div>
      </div>

      {unavailable ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          No se pudo cargar la serie historica de performance.
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          Aun no hay intentos para construir la grafica.
        </div>
      ) : (
        <div className="mt-8">
          <div className="flex h-64 items-end gap-3">
            {items.map((item) => {
              const attemptHeight = `${Math.max(
                16,
                (item.attempts / maxValue) * 100,
              )}%`;
              const approvalHeight = `${Math.max(
                item.approvals > 0 ? 12 : 0,
                (item.approvals / maxValue) * 100,
              )}%`;

              return (
                <div key={item.date} className="flex min-w-0 flex-1 flex-col">
                  <div className="flex h-52 items-end justify-center gap-2 rounded-2xl bg-slate-50 px-2 pb-3 pt-6">
                    <div className="flex h-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-2xl bg-slate-300/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
                        style={{ height: attemptHeight }}
                        aria-label={`${item.attempts} intentos`}
                        role="img"
                      />
                    </div>
                    <div className="flex h-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-2xl bg-gradient-to-t from-[#0052a6] to-[#35a2ff] shadow-[0_10px_20px_-16px_rgba(0,102,204,0.85)]"
                        style={{ height: approvalHeight }}
                        aria-label={`${item.approvals} aprobaciones`}
                        role="img"
                      />
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <p className="text-xs font-semibold text-slate-700">
                      {formatShortDate(item.date)}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {item.approvals}/{item.attempts}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </DashboardCard>
  );
}

function ScoreDistribution({
  bands,
  studentsUnavailable,
}: {
  bands: ScoreBand[];
  studentsUnavailable: boolean;
}) {
  const total = bands.reduce((sum, band) => sum + band.count, 0);

  return (
    <DashboardCard className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0066cc]">
            Distribucion
          </p>
          <h3 className="mt-2 font-display text-2xl text-slate-900">
            Estado del ultimo intento
          </h3>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {total} alumnos medidos
        </span>
      </div>

      {studentsUnavailable ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          No se pudo cargar la distribucion por alumno.
        </div>
      ) : total === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          Aun no hay alumnos con datos para mostrar.
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {bands.map((band) => {
            const toneStyle = toneClasses(band.tone);
            const width = total > 0 ? `${(band.count / total) * 100}%` : "0%";

            return (
              <div key={band.label}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-slate-700">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${toneStyle.dot}`}
                      aria-hidden="true"
                    />
                    {band.label}
                  </div>
                  <span className="text-slate-500">{band.count} alumnos</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${toneStyle.bar}`}
                    style={{ width }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
}

function StudentList({
  title,
  description,
  students,
  emptyMessage,
  tone,
  unavailable,
}: {
  title: string;
  description: string;
  students: AdminStudentItem[];
  emptyMessage: string;
  tone: CardTone;
  unavailable: boolean;
}) {
  const toneStyle = toneClasses(tone);

  return (
    <DashboardCard className="p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${toneStyle.badge}`}>
          {students.length}
        </span>
      </div>

      {unavailable ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          No se pudo cargar este bloque.
        </div>
      ) : students.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {students.map((student) => {
            const safeScore = student.lastAttemptScore ?? 0;

            return (
              <div
                key={student.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {student.fullName}
                    </p>
                    <p className="text-sm text-slate-500">{student.email}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${toneStyle.badge}`}>
                    {student.lastAttemptScore !== null
                      ? `${student.lastAttemptScore}%`
                      : "Sin intento"}
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${toneStyle.bar}`}
                    style={{ width: `${safeScore}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </DashboardCard>
  );
}

function LoadingDashboard() {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="h-64 animate-pulse rounded-3xl border border-white/70 bg-white/90" />
        <div className="h-64 animate-pulse rounded-3xl border border-white/70 bg-white/90" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-36 animate-pulse rounded-3xl border border-white/70 bg-white/90"
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="h-96 animate-pulse rounded-3xl border border-white/70 bg-white/90" />
        <div className="h-96 animate-pulse rounded-3xl border border-white/70 bg-white/90" />
      </div>
    </div>
  );
}

function formatShortDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

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

function getScoreBands(students: AdminStudentItem[]): ScoreBand[] {
  return [
    {
      label: "Sin intento",
      count: students.filter((student) => student.lastAttemptScore === null)
        .length,
      tone: "slate",
    },
    {
      label: "Riesgo (<60)",
      count: students.filter(
        (student) =>
          student.lastAttemptScore !== null && student.lastAttemptScore < 60,
      ).length,
      tone: "amber",
    },
    {
      label: "En carrera (60-79)",
      count: students.filter(
        (student) =>
          student.lastAttemptScore !== null &&
          student.lastAttemptScore >= 60 &&
          student.lastAttemptScore < 80,
      ).length,
      tone: "blue",
    },
    {
      label: "Solido (80+)",
      count: students.filter(
        (student) =>
          student.lastAttemptScore !== null && student.lastAttemptScore >= 80,
      ).length,
      tone: "emerald",
    },
  ];
}

function getPriorityStudents(students: AdminStudentItem[]) {
  return [...students]
    .filter((student) => !student.approved)
    .sort((left, right) => {
      const leftScore = left.lastAttemptScore ?? -1;
      const rightScore = right.lastAttemptScore ?? -1;

      return leftScore - rightScore;
    })
    .slice(0, 4);
}

function getTopStudents(students: AdminStudentItem[]) {
  return [...students]
    .filter((student) => student.lastAttemptScore !== null)
    .sort(
      (left, right) =>
        (right.lastAttemptScore ?? 0) - (left.lastAttemptScore ?? 0),
    )
    .slice(0, 4);
}

export default function AdminHomePage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [performance, setPerformance] = useState<AdminPerformanceItem[]>([]);
  const [students, setStudents] = useState<AdminStudentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPerformanceUnavailable, setIsPerformanceUnavailable] =
    useState(false);
  const [isStudentsUnavailable, setIsStudentsUnavailable] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      const [statsResult, performanceResult, studentsResult] =
        await Promise.allSettled([
          getAdminStats(),
          getAdminPerformance(),
          getAdminStudents(),
        ]);

      if (!isMounted) {
        return;
      }

      if (statsResult.status === "fulfilled") {
        setStats(statsResult.value);
        setErrorMessage("");
      } else {
        setStats(null);
        setErrorMessage(normalizeError(statsResult.reason).message);
      }

      if (performanceResult.status === "fulfilled") {
        const normalizedPerformance = normalizeArrayPayload<AdminPerformanceItem>(
          performanceResult.value,
        );

        setPerformance(
          [...normalizedPerformance.items].sort((left, right) =>
            left.date.localeCompare(right.date),
          ),
        );
        setIsPerformanceUnavailable(!normalizedPerformance.isValid);
      } else {
        setPerformance([]);
        setIsPerformanceUnavailable(true);
      }

      if (studentsResult.status === "fulfilled") {
        const normalizedStudents = normalizeArrayPayload<AdminStudentItem>(
          studentsResult.value,
        );

        setStudents(normalizedStudents.items);
        setIsStudentsUnavailable(!normalizedStudents.isValid);
      } else {
        setStudents([]);
        setIsStudentsUnavailable(true);
      }

      setIsLoading(false);
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <LoadingDashboard />;
  }

  if (errorMessage || !stats) {
    return (
      <article className="rounded-2xl bg-rose-100 p-6 text-center font-semibold text-rose-800">
        {errorMessage || "No se pudo cargar el resumen academico."}
      </article>
    );
  }

  const pendingStudents = Math.max(0, stats.totalStudents - stats.approvedStudents);
  const scoreBands = getScoreBands(students);
  const priorityStudents = getPriorityStudents(students);
  const topStudents = getTopStudents(students);
  const recentPerformance = performance.slice(-7);

  return (
    <section className="grid gap-4">
      <div className="grid gap-4 lg:grid-cols-[1.45fr_0.85fr]">
        <DashboardCard className="relative overflow-hidden p-6 sm:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(53,162,255,0.22),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(0,77,163,0.14),transparent_34%)]" />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[#0066cc]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#0052a6]">
                Centro de control
              </span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-800">
                {stats.approvedStudents} aprobados
              </span>
            </div>

            <h2 className="mt-5 max-w-xl font-display text-3xl leading-tight text-slate-900 sm:text-4xl">
              Dashboard academico con foco en avance, riesgo y actividad reciente.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Una lectura rapida del estado del aula para decidir a quien seguir,
              como viene el rendimiento y si la tasa de aprobacion se sostiene.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Activos
                </p>
                <p className="mt-2 font-display text-3xl text-slate-900">
                  {stats.totalStudents}
                </p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Pendientes
                </p>
                <p className="mt-2 font-display text-3xl text-slate-900">
                  {pendingStudents}
                </p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Score medio
                </p>
                <p className="mt-2 font-display text-3xl text-slate-900">
                  {stats.averageScore}%
                </p>
              </div>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard className="flex flex-col items-center justify-center p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0066cc]">
            Salud general
          </p>
          <h3 className="mt-2 text-center font-display text-2xl text-slate-900">
            Tasa de aprobacion
          </h3>
          <div className="mt-6">
            <DonutChart value={stats.approvalRate} label="aprobacion" />
          </div>
          <p className="mt-5 max-w-xs text-center text-sm leading-6 text-slate-600">
            {stats.approvedStudents} alumnos ya aprobaron y {pendingStudents} aun
            necesitan seguimiento.
          </p>
        </DashboardCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Alumnos activos"
          value={String(stats.totalStudents)}
          hint="Base total con acceso al panel y seguimiento."
          tone="slate"
        />
        <StatCard
          label="Tasa de aprobacion"
          value={`${stats.approvalRate}%`}
          hint={`${stats.approvedStudents} alumnos ya alcanzaron el objetivo.`}
          tone="emerald"
        />
        <StatCard
          label="Promedio ultimo intento"
          value={`${stats.averageScore}%`}
          hint="Promedio agregado del examen mas reciente por alumno."
          tone="blue"
        />
        <StatCard
          label="Alumnos pendientes"
          value={String(pendingStudents)}
          hint="Prioridad para seguimiento manual y refuerzo."
          tone="amber"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_0.95fr]">
        <PerformanceChart
          items={recentPerformance}
          unavailable={isPerformanceUnavailable}
        />
        <ScoreDistribution
          bands={scoreBands}
          studentsUnavailable={isStudentsUnavailable}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <StudentList
          title="Seguimiento prioritario"
          description="Alumnos sin aprobar ordenados por menor puntaje reciente."
          students={priorityStudents}
          emptyMessage="No hay alumnos pendientes para seguir."
          tone="amber"
          unavailable={isStudentsUnavailable}
        />
        <StudentList
          title="Mejor rendimiento"
          description="Ultimos puntajes mas altos para lectura rapida del grupo."
          students={topStudents}
          emptyMessage="Todavia no hay intentos registrados."
          tone="blue"
          unavailable={isStudentsUnavailable}
        />
      </div>
    </section>
  );
}
