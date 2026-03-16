import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router";

import {
  getAdminMaterialsPage,
  getAdminStudentMaterialAssignments,
  getAdminStudents,
  updateAdminStudentMaterialAssignments,
} from "~/lib/api/admin.service";
import { normalizeError } from "~/lib/api/errors";
import {
  createMaterial,
  deleteMaterial,
  getMaterialCategories,
  updateMaterial,
} from "~/lib/api/materials.service";
import type {
  AdminMaterialsPublishedStatusFilter,
  AdminStudentItem,
  MaterialCategory,
  MaterialResponse,
} from "~/lib/api/types";

type FormState = {
  title: string;
  description: string;
  linkLabel: string;
  linkUrl: string;
  categoryKey: string;
  published: boolean;
};

const initialFormState: FormState = {
  title: "",
  description: "",
  linkLabel: "",
  linkUrl: "",
  categoryKey: "",
  published: true,
};

const MATERIALS_PER_PAGE = 10;

function mapMaterialToFormState(material: MaterialResponse): FormState {
  const primaryLink = material.links[0];

  return {
    title: material.title,
    description: material.description,
    linkLabel: primaryLink?.label ?? "",
    linkUrl: primaryLink?.url ?? "",
    categoryKey: material.category.key,
    published: material.published,
  };
}

function matchesStudentSearch(
  student: AdminStudentItem,
  searchQuery: string,
): boolean {
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase("es");

  if (!normalizedQuery) {
    return true;
  }

  return (
    student.fullName.toLocaleLowerCase("es").includes(normalizedQuery) ||
    student.email.toLocaleLowerCase("es").includes(normalizedQuery)
  );
}

export default function AdminMaterialsPage() {
  const libraryRequestRef = useRef(0);
  const hasLoadedLibraryOnceRef = useRef(false);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [students, setStudents] = useState<AdminStudentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [libraryItems, setLibraryItems] = useState<MaterialResponse[]>([]);
  const [isLibraryLoading, setIsLibraryLoading] = useState(true);
  const [isLibraryRefreshing, setIsLibraryRefreshing] = useState(false);
  const [libraryError, setLibraryError] = useState("");
  const [librarySearchQuery, setLibrarySearchQuery] = useState("");
  const [libraryCategoryId, setLibraryCategoryId] = useState("all");
  const [libraryPublishedStatus, setLibraryPublishedStatus] =
    useState<AdminMaterialsPublishedStatusFilter>("all");
  const [libraryCurrentPage, setLibraryCurrentPage] = useState(1);
  const [libraryTotalItems, setLibraryTotalItems] = useState<number | null>(null);
  const [libraryTotalPages, setLibraryTotalPages] = useState(1);
  const [libraryReloadToken, setLibraryReloadToken] = useState(0);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [materialPendingDelete, setMaterialPendingDelete] =
    useState<MaterialResponse | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<MaterialResponse | null>(
    null,
  );
  const [editFormState, setEditFormState] = useState<FormState>(initialFormState);
  const [editErrorMessage, setEditErrorMessage] = useState("");
  const [isUpdatingMaterial, setIsUpdatingMaterial] = useState(false);
  const [assigningMaterial, setAssigningMaterial] = useState<MaterialResponse | null>(
    null,
  );
  const [assignmentStudentSearchQuery, setAssignmentStudentSearchQuery] =
    useState("");
  const [selectedAssignmentStudentIds, setSelectedAssignmentStudentIds] =
    useState<string[]>([]);
  const [assignmentActionError, setAssignmentActionError] = useState("");
  const [isAssigningMaterial, setIsAssigningMaterial] = useState(false);

  useEffect(() => {
    Promise.all([getMaterialCategories(), getAdminStudents()])
      .then(([cats, studentItems]) => {
        setCategories(cats);
        setStudents(studentItems);
        if (cats.length > 0 && !formState.categoryKey) {
          setFormState((prev) => ({ ...prev, categoryKey: cats[0].key }));
        }
      })
      .catch((error) => setLoadError(normalizeError(error).message))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let isMounted = true;
    const requestId = libraryRequestRef.current + 1;
    libraryRequestRef.current = requestId;

    async function loadLibraryPage() {
      if (!hasLoadedLibraryOnceRef.current) {
        setIsLibraryLoading(true);
        setLibraryError("");
      } else {
        setIsLibraryRefreshing(true);
      }

      try {
        const response = await getAdminMaterialsPage({
          page: libraryCurrentPage,
          pageSize: MATERIALS_PER_PAGE,
          search: librarySearchQuery,
          categoryId:
            libraryCategoryId !== "all" ? libraryCategoryId : undefined,
          publishedStatus: libraryPublishedStatus,
        });

        if (!isMounted || libraryRequestRef.current !== requestId) {
          return;
        }

        if (libraryCurrentPage > response.meta.totalPages) {
          setLibraryCurrentPage(response.meta.totalPages);
          return;
        }

        setLibraryItems(response.items);
        setLibraryTotalItems(response.meta.totalItems);
        setLibraryTotalPages(response.meta.totalPages);
        setLibraryError("");
      } catch (error) {
        if (!isMounted || libraryRequestRef.current !== requestId) {
          return;
        }

        setLibraryItems([]);
        setLibraryTotalItems(0);
        setLibraryTotalPages(1);
        setLibraryError(normalizeError(error).message);
      } finally {
        if (isMounted && libraryRequestRef.current === requestId) {
          hasLoadedLibraryOnceRef.current = true;
          setIsLibraryLoading(false);
          setIsLibraryRefreshing(false);
        }
      }
    }

    void loadLibraryPage();

    return () => {
      isMounted = false;
    };
  }, [
    libraryCategoryId,
    libraryCurrentPage,
    libraryPublishedStatus,
    libraryReloadToken,
    librarySearchQuery,
  ]);

  useEffect(() => {
    setLibraryCurrentPage(1);
  }, [libraryCategoryId, libraryPublishedStatus, librarySearchQuery]);

  const hasCategories = categories.length > 0;
  const showMissingCategoriesState = !isLoading && !loadError && !hasCategories;
  const hasActiveLibraryFilters =
    librarySearchQuery.trim().length > 0 ||
    libraryCategoryId !== "all" ||
    libraryPublishedStatus !== "all";
  const filteredStudents = students.filter((student) =>
    matchesStudentSearch(student, assignmentStudentSearchQuery),
  );

  const triggerLibraryReload = (resetToFirstPage = false) => {
    if (resetToFirstPage && libraryCurrentPage !== 1) {
      setLibraryCurrentPage(1);
      return;
    }

    setLibraryReloadToken((value) => value + 1);
  };

  const resetAssignmentModal = () => {
    setAssigningMaterial(null);
    setAssignmentStudentSearchQuery("");
    setSelectedAssignmentStudentIds([]);
    setAssignmentActionError("");
    setIsAssigningMaterial(false);
  };

  const resetEditModal = () => {
    setEditingMaterial(null);
    setEditFormState(initialFormState);
    setEditErrorMessage("");
    setIsUpdatingMaterial(false);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = formState.title.trim();
    const description = formState.description.trim();
    const linkLabel = formState.linkLabel.trim();
    const linkUrl = formState.linkUrl.trim();

    if (
      !title ||
      !description ||
      !linkLabel ||
      !linkUrl ||
      !formState.categoryKey
    ) {
      setErrorMessage("Completa todos los campos.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      await createMaterial({
        title,
        description,
        categoryKey: formState.categoryKey,
        published: formState.published,
        links: [{ label: linkLabel, url: linkUrl }],
      });
      triggerLibraryReload(true);
      setFormState({
        ...initialFormState,
        categoryKey: categories[0]?.key ?? "",
      });
      setSuccessMessage(
        "Material creado. Ahora puedes asignarlo en lote desde la biblioteca.",
      );
    } catch (error) {
      setErrorMessage(normalizeError(error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      await deleteMaterial(id);
      triggerLibraryReload();
      setSuccessMessage("Material eliminado.");
    } catch (error) {
      setErrorMessage(normalizeError(error).message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateMaterial = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingMaterial) {
      return;
    }

    const title = editFormState.title.trim();
    const description = editFormState.description.trim();
    const linkLabel = editFormState.linkLabel.trim();
    const linkUrl = editFormState.linkUrl.trim();

    if (
      !title ||
      !description ||
      !linkLabel ||
      !linkUrl ||
      !editFormState.categoryKey
    ) {
      setEditErrorMessage("Completa todos los campos.");
      return;
    }

    setIsUpdatingMaterial(true);
    setEditErrorMessage("");
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await updateMaterial(editingMaterial.id, {
        title,
        description,
        categoryKey: editFormState.categoryKey,
        published: editFormState.published,
        links: [{ label: linkLabel, url: linkUrl }],
      });
      triggerLibraryReload();
      setSuccessMessage("Material actualizado.");
      resetEditModal();
    } catch (error) {
      setEditErrorMessage(normalizeError(error).message);
    } finally {
      setIsUpdatingMaterial(false);
    }
  };

  const toggleStudentSelection = (studentId: string) => {
    setAssignmentActionError("");
    setSelectedAssignmentStudentIds((currentSelection) =>
      currentSelection.includes(studentId)
        ? currentSelection.filter((id) => id !== studentId)
        : [...currentSelection, studentId],
    );
  };

  const handleAssignMaterialToStudents = async () => {
    if (!assigningMaterial) {
      return;
    }

    if (selectedAssignmentStudentIds.length === 0) {
      setAssignmentActionError("Selecciona al menos un alumno.");
      return;
    }

    setIsAssigningMaterial(true);
    setAssignmentActionError("");

    const results = await Promise.allSettled(
      selectedAssignmentStudentIds.map(async (studentId) => {
        const currentAssignments =
          await getAdminStudentMaterialAssignments(studentId);

        if (
          currentAssignments.some(
            (assignment) => assignment.materialId === assigningMaterial.id,
          )
        ) {
          return "already-assigned" as const;
        }

        await updateAdminStudentMaterialAssignments(studentId, {
          assignments: [
            ...currentAssignments,
            {
              materialId: assigningMaterial.id,
              position: currentAssignments.length + 1,
            },
          ],
        });

        return "assigned" as const;
      }),
    );

    let assignedCount = 0;
    let alreadyAssignedCount = 0;
    let failedCount = 0;

    for (const result of results) {
      if (result.status === "fulfilled") {
        if (result.value === "assigned") {
          assignedCount += 1;
        } else {
          alreadyAssignedCount += 1;
        }
      } else {
        failedCount += 1;
      }
    }

    if (failedCount > 0) {
      setAssignmentActionError(
        `Se actualizaron ${assignedCount} alumno(s), ${alreadyAssignedCount} ya lo tenian y ${failedCount} fallo/fallaron.`,
      );
      setIsAssigningMaterial(false);
      return;
    }

    const messages = [`Material asignado a ${assignedCount} alumno(s)`];
    if (alreadyAssignedCount > 0) {
      messages.push(`${alreadyAssignedCount} ya lo tenian`);
    }
    setSuccessMessage(`${messages.join(". ")}.`);
    resetAssignmentModal();
  };

  return (
    <>
      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.45fr]">
        <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
          <h2 className="font-display text-2xl text-slate-900">
            Publicar material
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Crea nuevos recursos y sumalos a la biblioteca del panel.
          </p>

          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            {showMissingCategoriesState ? (
              <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 px-4 py-4">
                <p className="text-sm font-semibold text-amber-800">
                  Necesitas al menos una categoria para publicar materiales.
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  Crea la primera categoria y luego volve a esta pantalla para
                  completar el alta del material.
                </p>
                <Link
                  to="/admin/materials/categories"
                  className="mt-3 inline-flex items-center justify-center rounded-xl bg-amber-500 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                >
                  Crear categoria
                </Link>
              </div>
            ) : null}

            <div>
              <label htmlFor="title" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Titulo
              </label>
              <input
                id="title"
                value={formState.title}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, title: event.target.value }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
                placeholder="Ej. Manual de prioridad de paso"
              />
            </div>

            <div>
              <label htmlFor="description" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Descripcion
              </label>
              <textarea
                id="description"
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, description: event.target.value }))
                }
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
                placeholder="Describe brevemente el contenido"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="linkLabel" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Etiqueta del enlace
                </label>
                <input
                  id="linkLabel"
                  value={formState.linkLabel}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, linkLabel: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
                  placeholder="Ej. Abrir material"
                />
              </div>

              <div>
                <label htmlFor="linkUrl" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  URL del recurso
                </label>
                <input
                  id="linkUrl"
                  type="url"
                  value={formState.linkUrl}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, linkUrl: event.target.value }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="category" className="block text-sm font-semibold text-slate-700">
                  Categoria
                </label>
                <Link
                  to="/admin/materials/categories"
                  className="text-xs font-semibold text-[#0052a6] hover:underline"
                >
                  Gestionar categorias
                </Link>
              </div>

              {isLoading ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  Cargando categorias...
                </div>
              ) : hasCategories ? (
                <div className="relative">
                  <select
                    id="category"
                    value={formState.categoryKey}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        categoryKey: event.target.value,
                      }))
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-11 text-sm text-slate-900 outline-none transition focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.key}>
                        {cat.name}
                      </option>
                    ))}
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
                      <path d="m5 7 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              ) : loadError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  No se pudieron cargar las categorias.
                </div>
              ) : null}
            </div>

            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={formState.published}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    published: event.target.checked,
                  }))
                }
                className="rounded border-slate-300"
              />
              Publicar inmediatamente
            </label>

            {errorMessage ? (
              <p className="rounded-xl bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-800">
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? (
              <p className="rounded-xl bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-800">
                {successMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || isLoading || !!loadError || !hasCategories}
              className="cursor-pointer rounded-xl bg-[#0066cc] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0056ae] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Publicando..." : "Publicar material"}
            </button>
          </form>
        </article>

        <div className="grid gap-4">
          <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0066cc]">
                  Flujo de asignacion
                </p>
                <h3 className="mt-2 font-display text-2xl text-slate-900">
                  Biblioteca para publicar, ficha del alumno para ordenar
                </h3>
                <p className="mt-2 max-w-3xl text-sm text-slate-600">
                  Asigna materiales en lote desde esta biblioteca y usa la ficha
                  individual del alumno para ordenar, bloquear o revisar su plan
                  final.
                </p>
              </div>

              <Link
                to="/admin/students"
                className="inline-flex items-center justify-center rounded-2xl border border-[#0066cc]/20 bg-[#0066cc]/6 px-4 py-2.5 text-sm font-semibold text-[#0052a6] transition hover:border-[#0066cc]/30 hover:bg-[#0066cc]/10"
              >
                Ir a alumnos
              </Link>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Paso 1
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  Publica o edita el material
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Mantén una biblioteca limpia con búsqueda, filtros y estado.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Paso 2
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  Asigna en lote desde cada material
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Selecciona uno o varios alumnos sin abrir un editor gigante.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Paso 3
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  Ajusta el orden en la ficha
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  El orden fino vive por alumno, no en la biblioteca global.
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
            <h3 className="font-display text-xl text-slate-900">
              Biblioteca de materiales
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Filtra la biblioteca, revisa el estado de publicación y asigna en
              lote desde cada ficha.
            </p>

            <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1.4fr)_0.95fr_0.95fr]">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Buscar
                </span>
                <input
                  type="search"
                  value={librarySearchQuery}
                  onChange={(event) => setLibrarySearchQuery(event.target.value)}
                  placeholder="Titulo, descripcion, categoria o link"
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Categoria
                </span>
                <div className="relative">
                  <select
                    value={libraryCategoryId}
                    onChange={(event) => setLibraryCategoryId(event.target.value)}
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-3 py-2.5 pr-11 text-sm text-slate-900 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
                  >
                    <option value="all">Todas</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
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
                      <path d="m5 7 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Publicacion
                </span>
                <div className="relative">
                  <select
                    value={libraryPublishedStatus}
                    onChange={(event) =>
                      setLibraryPublishedStatus(
                        event.target.value as AdminMaterialsPublishedStatusFilter,
                      )
                    }
                    className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-3 py-2.5 pr-11 text-sm text-slate-900 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
                  >
                    <option value="all">Todos</option>
                    <option value="published">Publicados</option>
                    <option value="draft">Borradores</option>
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
                      <path d="m5 7 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </label>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              <span>{libraryTotalItems ?? libraryItems.length} resultados</span>
              <div className="flex flex-wrap items-center gap-2">
                {isLibraryRefreshing ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-500">
                    Actualizando
                  </span>
                ) : null}
                {hasActiveLibraryFilters ? (
                  <button
                    type="button"
                    onClick={() => {
                      setLibrarySearchQuery("");
                      setLibraryCategoryId("all");
                      setLibraryPublishedStatus("all");
                    }}
                    className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 transition hover:border-[#0066cc]/30 hover:text-[#0052a6]"
                  >
                    Limpiar filtros
                  </button>
                ) : null}
              </div>
            </div>

            {isLibraryLoading ? (
              <div className="mt-4 grid gap-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-16 animate-pulse rounded-xl border border-slate-200 bg-white p-3" />
                ))}
              </div>
            ) : libraryError ? (
              <p className="mt-4 rounded-xl bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-800">
                {libraryError}
              </p>
            ) : (
              <ul className="mt-4 grid gap-3">
                {libraryItems.length === 0 ? (
                  <li className="py-6 text-center text-sm text-slate-400">
                    No hay materiales que coincidan con los filtros actuales.
                  </li>
                ) : (
                  libraryItems.map((item) => (
                    <li key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-800">{item.title}</p>
                            <span className="rounded-full bg-[#0066cc]/10 px-2 py-0.5 text-xs font-semibold text-[#0052a6]">
                              {item.category.name}
                            </span>
                            {!item.published ? (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                Borrador
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-slate-600">{item.description}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {item.links.map((link) => (
                              <a
                                key={link.id}
                                href={link.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex text-xs font-semibold text-[#0054aa] hover:underline"
                              >
                                {link.label}
                              </a>
                            ))}
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingMaterial(item);
                              setEditFormState(mapMaterialToFormState(item));
                              setEditErrorMessage("");
                            }}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setAssigningMaterial(item);
                              setAssignmentStudentSearchQuery("");
                              setSelectedAssignmentStudentIds([]);
                              setAssignmentActionError("");
                            }}
                            className="rounded-xl border border-[#0066cc]/20 bg-[#0066cc]/6 px-3 py-2 text-xs font-semibold text-[#0052a6] transition hover:border-[#0066cc]/30 hover:bg-[#0066cc]/10"
                          >
                            Asignar a alumnos
                          </button>
                          <button
                            type="button"
                            onClick={() => setMaterialPendingDelete(item)}
                            disabled={deletingId === item.id}
                            className="text-xs font-semibold text-rose-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === item.id ? "Eliminando..." : "Eliminar"}
                          </button>
                        </div>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            )}

            {!isLibraryLoading && !libraryError && libraryItems.length > 0 ? (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <p className="text-sm text-slate-500">
                  Pagina {libraryCurrentPage} de {libraryTotalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setLibraryCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={libraryCurrentPage === 1 || isLibraryRefreshing}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#0066cc]/30 hover:text-[#0052a6] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setLibraryCurrentPage((page) => Math.min(libraryTotalPages, page + 1))
                    }
                    disabled={libraryCurrentPage === libraryTotalPages || isLibraryRefreshing}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#0066cc]/30 hover:text-[#0052a6] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            ) : null}
          </article>
        </div>
      </section>

      {assigningMaterial ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_28px_80px_-28px_rgba(2,32,72,0.45)]">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0066cc]">
                    Asignacion masiva
                  </p>
                  <h3 className="mt-2 font-display text-2xl text-slate-900">
                    {assigningMaterial.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Se agregará al final del plan actual de cada alumno seleccionado.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetAssignmentModal}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div className="overflow-y-auto px-6 py-5">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Buscar alumnos
                </span>
                <input
                  type="search"
                  value={assignmentStudentSearchQuery}
                  onChange={(event) => setAssignmentStudentSearchQuery(event.target.value)}
                  placeholder="Nombre o email"
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
                />
              </label>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <span>{filteredStudents.length} alumnos visibles</span>
                <span>{selectedAssignmentStudentIds.length} seleccionados</span>
              </div>

              {assignmentActionError ? (
                <p className="mt-4 rounded-2xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-800">
                  {assignmentActionError}
                </p>
              ) : null}

              <div className="mt-5 grid gap-3">
                {filteredStudents.map((student) => {
                  const isSelected = selectedAssignmentStudentIds.includes(student.id);

                  return (
                    <label
                      key={student.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-4 transition ${
                        isSelected
                          ? "border-[#0066cc]/30 bg-[#0066cc]/6"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleStudentSelection(student.id)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-[#0066cc] focus:ring-[#0066cc]/30"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">{student.fullName}</p>
                        <p className="mt-1 text-sm text-slate-500">{student.email}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-100 px-6 py-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-slate-500">
                  Selecciona alumnos para agregar este material al final de su plan.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetAssignmentModal}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleAssignMaterialToStudents()}
                    disabled={isAssigningMaterial || students.length === 0}
                    className="rounded-xl bg-[#0066cc] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0056ae] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isAssigningMaterial ? "Asignando..." : "Asignar material"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {editingMaterial ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_28px_80px_-28px_rgba(2,32,72,0.45)]">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0066cc]">
                    Edicion de material
                  </p>
                  <h3 className="mt-2 font-display text-2xl text-slate-900">
                    {editingMaterial.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Actualiza el contenido, el enlace principal, la categoria y
                    el estado de publicación.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetEditModal}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Cerrar
                </button>
              </div>
            </div>

            <form onSubmit={handleUpdateMaterial} className="overflow-y-auto px-6 py-5">
              <div className="grid gap-3">
                <div>
                  <label htmlFor="edit-title" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Titulo
                  </label>
                  <input
                    id="edit-title"
                    value={editFormState.title}
                    onChange={(event) =>
                      setEditFormState((prev) => ({
                        ...prev,
                        title: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
                  />
                </div>

                <div>
                  <label htmlFor="edit-description" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Descripcion
                  </label>
                  <textarea
                    id="edit-description"
                    value={editFormState.description}
                    onChange={(event) =>
                      setEditFormState((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="edit-link-label" className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Etiqueta del enlace
                    </label>
                    <input
                      id="edit-link-label"
                      value={editFormState.linkLabel}
                      onChange={(event) =>
                        setEditFormState((prev) => ({
                          ...prev,
                          linkLabel: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
                    />
                  </div>

                  <div>
                    <label htmlFor="edit-link-url" className="mb-1.5 block text-sm font-semibold text-slate-700">
                      URL del recurso
                    </label>
                    <input
                      id="edit-link-url"
                      type="url"
                      value={editFormState.linkUrl}
                      onChange={(event) =>
                        setEditFormState((prev) => ({
                          ...prev,
                          linkUrl: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="edit-category" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Categoria
                  </label>
                  <div className="relative">
                    <select
                      id="edit-category"
                      value={editFormState.categoryKey}
                      onChange={(event) =>
                        setEditFormState((prev) => ({
                          ...prev,
                          categoryKey: event.target.value,
                        }))
                      }
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-11 text-sm text-slate-900 outline-none transition focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.key}>
                          {cat.name}
                        </option>
                      ))}
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
                        <path d="m5 7 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={editFormState.published}
                    onChange={(event) =>
                      setEditFormState((prev) => ({
                        ...prev,
                        published: event.target.checked,
                      }))
                    }
                    className="rounded border-slate-300"
                  />
                  Publicado
                </label>

                {editErrorMessage ? (
                  <p className="rounded-xl bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-800">
                    {editErrorMessage}
                  </p>
                ) : null}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                <p className="text-sm text-slate-500">
                  Los cambios impactan en la biblioteca y futuras asignaciones.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetEditModal}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingMaterial}
                    className="rounded-xl bg-[#0066cc] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0056ae] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isUpdatingMaterial ? "Guardando..." : "Guardar cambios"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {materialPendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-white/70 bg-white p-6 shadow-[0_28px_80px_-28px_rgba(2,32,72,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
              Confirmar eliminacion
            </p>
            <h3 className="mt-2 font-display text-2xl text-slate-900">
              {materialPendingDelete.title}
            </h3>
            <p className="mt-3 text-sm text-slate-600">
              Esta acción eliminará el material de la biblioteca. Úsala solo si
              realmente ya no debe existir.
            </p>

            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setMaterialPendingDelete(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = materialPendingDelete.id;
                  setMaterialPendingDelete(null);
                  await handleDelete(id);
                }}
                disabled={deletingId === materialPendingDelete.id}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId === materialPendingDelete.id
                  ? "Eliminando..."
                  : "Eliminar material"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
