import { mockStudents } from "~/data/mock-data";

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
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 inline-flex rounded-lg px-2.5 py-1 text-xl font-display ${toneClasses}`}>
        {value}
      </p>
    </article>
  );
}

export default function AdminHomePage() {
  const approvedCount = mockStudents.filter((student) => student.approved).length;
  const approvalRate = Math.round((approvedCount / mockStudents.length) * 100);
  const averageScore = Math.round(
    mockStudents.reduce((sum, student) => sum + student.lastAttemptScore, 0) /
      mockStudents.length,
  );

  return (
    <section className="grid gap-4">
      <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)] backdrop-blur">
        <h2 className="font-display text-2xl text-slate-900">Resumen academico</h2>
        <p className="mt-1 text-sm text-slate-600">
          Vista de administracion para seguimiento de performance de alumnos.
        </p>
      </article>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Alumnos activos" value={String(mockStudents.length)} tone="slate" />
        <StatCard label="Tasa de aprobacion" value={`${approvalRate}%`} tone="emerald" />
        <StatCard label="Promedio ultimo intento" value={`${averageScore}%`} tone="blue" />
      </div>
    </section>
  );
}
