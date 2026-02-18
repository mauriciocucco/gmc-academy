import { useEffect, useState } from "react";

import { getAdminStats } from "~/lib/api/admin.service";
import { normalizeError } from "~/lib/api/errors";
import type { AdminStats } from "~/lib/api/types";

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "blue" | "emerald" | "slate";
}) {
  const toneClasses =
    tone === "blue"
      ? "bg-[#0066cc]/10 text-[#0052a6]"
      : tone === "emerald"
        ? "bg-emerald-100 text-emerald-800"
        : "bg-slate-100 text-slate-700";

  return (
    <article className="rounded-2xl border border-white/70 bg-white/90 p-5 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-2 inline-flex rounded-lg px-2.5 py-1 text-xl font-display ${toneClasses}`}
      >
        {value}
      </p>
    </article>
  );
}

export default function AdminHomePage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch((error) => setErrorMessage(normalizeError(error).message))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section className="grid gap-4">
      <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)] backdrop-blur">
        <h2 className="font-display text-2xl text-slate-900">
          Resumen academico
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Vista de administracion para seguimiento de performance de alumnos.
        </p>
      </article>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/70 bg-white/90 p-5 animate-pulse h-20"
            />
          ))}
        </div>
      )}

      {!isLoading && errorMessage && (
        <article className="rounded-2xl bg-rose-100 p-6 text-center font-semibold text-rose-800">
          {errorMessage}
        </article>
      )}

      {!isLoading && stats && (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Alumnos activos"
            value={String(stats.totalStudents)}
            tone="slate"
          />
          <StatCard
            label="Tasa de aprobacion"
            value={`${stats.approvalRate}%`}
            tone="emerald"
          />
          <StatCard
            label="Promedio ultimo intento"
            value={`${stats.averageScore}%`}
            tone="blue"
          />
        </div>
      )}
    </section>
  );
}
