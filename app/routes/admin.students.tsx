import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";

import {
  getAdminStudentsPage,
  updateAdminStudentsAccess,
} from "~/lib/api/admin.service";
import { normalizeError } from "~/lib/api/errors";
import type {
  AdminStudentAccessStatusFilter,
  AdminStudentAttemptStateFilter,
  AdminStudentItem,
  AdminStudentStatusFilter,
} from "~/lib/api/types";

type AccessAction = "block" | "unblock";

const STUDENTS_PER_PAGE = 10;

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

export default function AdminStudentsPage() {
  const navigate = useNavigate();
  const requestRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);
  const [students, setStudents] = useState<AdminStudentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingAccess, setIsUpdatingAccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<AdminStudentStatusFilter>("all");
  const [attemptFilter, setAttemptFilter] =
    useState<AdminStudentAttemptStateFilter>("all");
  const [accessFilter, setAccessFilter] =
    useState<AdminStudentAccessStatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState<number | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [blockReason, setBlockReason] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    statusFilter !== "all" ||
    attemptFilter !== "all" ||
    accessFilter !== "all";
  const selectedStudents = useMemo(
    () =>
      students.filter((student) => selectedStudentIds.includes(student.id)),
    [selectedStudentIds, students],
  );
  const selectedBlockedCount = selectedStudents.filter(
    (student) => student.blocked,
  ).length;
  const selectedActiveCount = selectedStudents.length - selectedBlockedCount;
  const areAllCurrentPageSelected =
    students.length > 0 &&
    students.every((student) => selectedStudentIds.includes(student.id));

  useEffect(() => {
    let isMounted = true;
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    async function loadStudents() {
      if (!hasLoadedOnceRef.current) {
        setIsLoading(true);
        setErrorMessage("");
      } else {
        setIsRefreshing(true);
      }

      try {
        const response = await getAdminStudentsPage({
          page: currentPage,
          pageSize: STUDENTS_PER_PAGE,
          search: searchQuery,
          status: statusFilter,
          attemptState: attemptFilter,
          accessStatus: accessFilter,
        });

        if (!isMounted || requestRef.current !== requestId) {
          return;
        }

        if (response.totalPages !== null && currentPage > response.totalPages) {
          setCurrentPage(response.totalPages);
          return;
        }

        setStudents(response.items);
        setTotalItems(response.total ?? response.items.length);
        setTotalPages(
          response.totalPages ??
            Math.max(
              1,
              Math.ceil((response.total ?? response.items.length) / response.pageSize),
            ),
        );
        setSelectedStudentIds((currentSelection) =>
          currentSelection.filter((studentId) =>
            response.items.some((student) => student.id === studentId),
          ),
        );
        setErrorMessage("");
      } catch (error) {
        if (!isMounted || requestRef.current !== requestId) {
          return;
        }

        setStudents([]);
        setTotalItems(0);
        setTotalPages(1);
        setSelectedStudentIds([]);
        setErrorMessage(normalizeError(error).message);
      } finally {
        if (isMounted && requestRef.current === requestId) {
          hasLoadedOnceRef.current = true;
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    void loadStudents();

    return () => {
      isMounted = false;
    };
  }, [
    accessFilter,
    attemptFilter,
    currentPage,
    reloadToken,
    searchQuery,
    statusFilter,
  ]);

  useEffect(() => {
    setCurrentPage(1);
  }, [accessFilter, attemptFilter, searchQuery, statusFilter]);

  async function handleAccessUpdate(action: AccessAction) {
    if (selectedStudentIds.length === 0) {
      return;
    }

    const isBlocking = action === "block";
    const trimmedReason = blockReason.trim();

    setIsUpdatingAccess(true);
    setActionError("");
    setActionSuccess("");

    try {
      await updateAdminStudentsAccess({
        studentIds: selectedStudentIds,
        blocked: isBlocking,
        reason: isBlocking && trimmedReason.length > 0 ? trimmedReason : null,
      });

      setSelectedStudentIds([]);
      if (isBlocking) {
        setBlockReason("");
      }
      setActionSuccess(
        isBlocking
          ? "Acceso actualizado. Los alumnos seleccionados quedaron bloqueados."
          : "Acceso actualizado. Los alumnos seleccionados quedaron activos.",
      );
      setReloadToken((value) => value + 1);
    } catch (error) {
      setActionError(normalizeError(error).message);
    } finally {
      setIsUpdatingAccess(false);
    }
  }

  function toggleStudentSelection(studentId: string) {
    setActionError("");
    setActionSuccess("");
    setSelectedStudentIds((currentSelection) =>
      currentSelection.includes(studentId)
        ? currentSelection.filter((id) => id !== studentId)
        : [...currentSelection, studentId],
    );
  }

  function toggleSelectAllCurrentPage() {
    setActionError("");
    setActionSuccess("");
    setSelectedStudentIds((currentSelection) => {
      if (areAllCurrentPageSelected) {
        return currentSelection.filter(
          (studentId) => !students.some((student) => student.id === studentId),
        );
      }

      const nextSelection = new Set(currentSelection);
      for (const student of students) {
        nextSelection.add(student.id);
      }

      return [...nextSelection];
    });
  }

  return (
    <section className="grid gap-4">
      <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl text-slate-900">Alumnos</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              Busca alumnos, filtra por examen o acceso y gestiona bloqueos en lote
              antes de abrir la ficha individual.
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
        <>
        <article className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
          <div className="border-b border-slate-100 px-4 py-4">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_0.8fr_0.8fr_0.8fr]">
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
                      setStatusFilter(event.target.value as AdminStudentStatusFilter)
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
                      setAttemptFilter(
                        event.target.value as AdminStudentAttemptStateFilter,
                      )
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

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Acceso
                </span>
                <div className="relative">
                  <select
                    value={accessFilter}
                    onChange={(event) =>
                      setAccessFilter(
                        event.target.value as AdminStudentAccessStatusFilter,
                      )
                    }
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-3 py-2.5 pr-11 text-sm text-slate-900 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
                  >
                    <option value="all">Todos</option>
                    <option value="active">Activos</option>
                    <option value="blocked">Bloqueados</option>
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
              <span>{totalItems ?? students.length} resultados</span>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setAttemptFilter("all");
                    setAccessFilter("all");
                  }}
                  className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 transition hover:border-[#0066cc]/30 hover:text-[#0052a6]"
                >
                  Limpiar filtros
                </button>
              ) : null}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100/75 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={areAllCurrentPageSelected}
                        onChange={toggleSelectAllCurrentPage}
                        className="h-4 w-4 rounded border-slate-300 text-[#0066cc] focus:ring-[#0066cc]/30"
                      />
                      <span>Seleccion</span>
                    </label>
                  </th>
                  <th className="px-4 py-3 font-semibold">Alumno</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Ultimo puntaje</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Acceso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      No hay alumnos que coincidan con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => {
                    const isSelected = selectedStudentIds.includes(student.id);

                    return (
                      <tr
                        key={student.id}
                        className="cursor-pointer text-slate-700 transition hover:bg-slate-50"
                        onClick={() => navigate(`/admin/students/${student.id}`)}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleStudentSelection(student.id)}
                            onClick={(event) => event.stopPropagation()}
                            className="h-4 w-4 rounded border-slate-300 text-[#0066cc] focus:ring-[#0066cc]/30"
                            aria-label={`Seleccionar a ${student.fullName}`}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-800">
                            {student.fullName}
                          </p>
                          {student.blockedAt ? (
                            <p className="mt-1 text-xs text-slate-500">
                              Bloqueado: {formatDateTime(student.blockedAt)}
                            </p>
                          ) : null}
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
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              student.blocked
                                ? "bg-rose-100 text-rose-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {student.blocked ? "Bloqueado" : "Activo"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {students.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-4">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <p>
                  Pagina {currentPage} de {totalPages}
                </p>
                {isRefreshing ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Actualizando
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1 || isRefreshing}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#0066cc]/30 hover:text-[#0052a6] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((page) => Math.min(totalPages, page + 1))
                  }
                  disabled={currentPage === totalPages || isRefreshing}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#0066cc]/30 hover:text-[#0052a6] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          ) : null}
        </article>
        <article className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0066cc]">
              Gestion de acceso
            </p>
            <h3 className="mt-2 font-display text-xl text-slate-900">
              Bloquear o desbloquear seleccionados
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Seleccionados: {selectedStudents.length}. Activos: {selectedActiveCount}. Bloqueados: {selectedBlockedCount}.
            </p>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Motivo del bloqueo
              </span>
              <textarea
                value={blockReason}
                onChange={(event) => setBlockReason(event.target.value)}
                rows={3}
                placeholder="Ej. Falta de pago, acceso pausado a pedido del alumno o seguimiento administrativo."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={selectedStudents.length === 0 || isUpdatingAccess}
              />
            </label>

            <div className="flex flex-wrap items-end gap-2 lg:flex-col lg:justify-end">
              <button
                type="button"
                onClick={() => void handleAccessUpdate("block")}
                disabled={
                  selectedStudents.length === 0 ||
                  selectedActiveCount === 0 ||
                  isUpdatingAccess
                }
                className="inline-flex min-w-[12rem] items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-800 transition hover:border-rose-300 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUpdatingAccess ? "Actualizando..." : "Bloquear seleccionados"}
              </button>

              <button
                type="button"
                onClick={() => void handleAccessUpdate("unblock")}
                disabled={
                  selectedStudents.length === 0 ||
                  selectedBlockedCount === 0 ||
                  isUpdatingAccess
                }
                className="inline-flex min-w-[12rem] items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isUpdatingAccess ? "Actualizando..." : "Desbloquear seleccionados"}
              </button>
            </div>
          </div>

          {actionError ? (
            <p className="mt-4 rounded-2xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-800">
              {actionError}
            </p>
          ) : null}

          {actionSuccess ? (
            <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
              {actionSuccess}
            </p>
          ) : null}
        </article>
        </>
      )}
    </section>
  );
}
