import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";

import { getAdminStudents } from "~/lib/api/admin.service";
import { normalizeError } from "~/lib/api/errors";
import type { AdminStudentItem } from "~/lib/api/types";

type ArrayNormalizationResult<T> = {
  items: T[];
  isValid: boolean;
};

type StatusFilter = "all" | "approved" | "pending";
type AttemptFilter = "all" | "with-attempt" | "without-attempt";

const STUDENTS_PER_PAGE = 10;

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

export default function AdminStudentsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<AdminStudentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [attemptFilter, setAttemptFilter] = useState<AttemptFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        normalizedSearchQuery.length === 0 ||
        student.fullName.toLowerCase().includes(normalizedSearchQuery) ||
        student.email.toLowerCase().includes(normalizedSearchQuery);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "approved" && student.approved) ||
        (statusFilter === "pending" && !student.approved);
      const hasAttempt = student.lastAttemptScore !== null;
      const matchesAttempt =
        attemptFilter === "all" ||
        (attemptFilter === "with-attempt" && hasAttempt) ||
        (attemptFilter === "without-attempt" && !hasAttempt);

      return matchesSearch && matchesStatus && matchesAttempt;
    });
  }, [students, normalizedSearchQuery, statusFilter, attemptFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / STUDENTS_PER_PAGE),
  );
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * STUDENTS_PER_PAGE,
    currentPage * STUDENTS_PER_PAGE,
  );

  useEffect(() => {
    let isMounted = true;

    async function loadStudents() {
      try {
        const response = await getAdminStudents();

        if (!isMounted) {
          return;
        }

        const normalized = normalizeArrayPayload<AdminStudentItem>(response);
        setStudents(normalized.items);
        setErrorMessage(
          normalized.isValid
            ? ""
            : "La lista de alumnos llego con un formato no esperado.",
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setStudents([]);
        setErrorMessage(normalizeError(error).message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadStudents();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedSearchQuery, statusFilter, attemptFilter]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  return (
    <section className="grid gap-4">
      <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-slate-900">Alumnos</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Busca un alumno y abre su vista individual para revisar progreso,
              estadisticas, examenes, respuestas y acciones de contacto.
            </p>
          </div>

          <Link
            to="/admin/students/new"
            className="inline-flex items-center justify-center rounded-2xl bg-[#0066cc] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(0,102,204,0.9)] transition hover:bg-[#0052a6]"
          >
            Crear alumno
          </Link>
        </div>
      </article>

      {isLoading ? (
        <div className="h-[30rem] animate-pulse rounded-3xl border border-white/70 bg-white/90" />
      ) : errorMessage ? (
        <article className="rounded-2xl bg-rose-100 p-6 text-center font-semibold text-rose-800">
          {errorMessage}
        </article>
      ) : (
        <article className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
          <div className="border-b border-slate-100 px-4 py-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_0.8fr_0.8fr]">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Buscar
                </span>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Nombre o email"
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Estado
                </span>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as StatusFilter)
                    }
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-3 py-2.5 pr-11 text-sm text-slate-900 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
                  >
                    <option value="all">Todos</option>
                    <option value="approved">Aprobados</option>
                    <option value="pending">Pendientes</option>
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        d="m5 7 5 5 5-5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Examen
                </span>
                <div className="relative">
                  <select
                    value={attemptFilter}
                    onChange={(event) =>
                      setAttemptFilter(event.target.value as AttemptFilter)
                    }
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-3 py-2.5 pr-11 text-sm text-slate-900 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
                  >
                    <option value="all">Todos</option>
                    <option value="with-attempt">Con intento</option>
                    <option value="without-attempt">Sin intento</option>
                  </select>
                  <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-500">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 20 20"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    >
                      <path
                        d="m5 7 5 5 5-5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
              </label>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              <span>{filteredStudents.length} resultados</span>
              {(searchQuery || statusFilter !== "all" || attemptFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setAttemptFilter("all");
                  }}
                  className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 transition hover:border-[#0066cc]/30 hover:text-[#0052a6]"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100/75 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Alumno</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Ultimo puntaje</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      No hay alumnos que coincidan con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map((student) => (
                    <tr
                      key={student.id}
                      className="cursor-pointer text-slate-700 transition hover:bg-slate-50"
                      onClick={() => navigate(`/admin/students/${student.id}`)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">
                          {student.fullName}
                        </p>
                      </td>
                      <td className="px-4 py-3">{student.email}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {formatScore(student.lastAttemptScore)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            student.approved
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {student.approved ? "Aprobado" : "Pendiente"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredStudents.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-4">
              <p className="text-sm text-slate-500">
                Pagina {currentPage} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#0066cc]/30 hover:text-[#0052a6] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#0066cc]/30 hover:text-[#0052a6] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </article>
      )}
    </section>
  );
}
