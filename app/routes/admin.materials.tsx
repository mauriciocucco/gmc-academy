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
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";

import { AdminMaterialAssignmentSortableItem } from "~/components/admin-material-assignment-sortable-item";
import {
  getAdminStudentMaterialAssignments,
  getAdminStudents,
  updateAdminStudentMaterialAssignments,
} from "~/lib/api/admin.service";
import { normalizeError } from "~/lib/api/errors";
import {
  createMaterial,
  deleteMaterial,
  getMaterialCategories,
  getMaterials,
} from "~/lib/api/materials.service";
import type {
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

type AssignmentEditorItem = MaterialResponse & {
  hasAccess: boolean;
  position: number | null;
};

const initialFormState: FormState = {
  title: "",
  description: "",
  linkLabel: "",
  linkUrl: "",
  categoryKey: "",
  published: true,
};

function sortByTitle(items: MaterialResponse[]): MaterialResponse[] {
  return [...items].sort((left, right) =>
    left.title.localeCompare(right.title, "es"),
  );
}

function syncAssignmentOrder(
  items: AssignmentEditorItem[],
): AssignmentEditorItem[] {
  const unlocked = items
    .filter((item) => item.hasAccess)
    .map((item, index) => ({
      ...item,
      position: index + 1,
    }));
  const locked = items
    .filter((item) => !item.hasAccess)
    .map((item) => ({
      ...item,
      position: null,
    }));

  return [...unlocked, ...locked];
}

function buildAssignmentEditorItems(
  materials: MaterialResponse[],
  assignments: Array<{ materialId: string; position: number }>,
): AssignmentEditorItem[] {
  const assignmentsByMaterialId = new Map(
    assignments.map((assignment) => [assignment.materialId, assignment.position]),
  );
  const unlocked: AssignmentEditorItem[] = [];
  const locked: AssignmentEditorItem[] = [];

  for (const material of sortByTitle(materials)) {
    const position = assignmentsByMaterialId.get(material.id) ?? null;
    const item: AssignmentEditorItem = {
      ...material,
      hasAccess: position !== null,
      position,
    };

    if (item.hasAccess) {
      unlocked.push(item);
      continue;
    }

    locked.push(item);
  }

  unlocked.sort((left, right) => (left.position ?? 0) - (right.position ?? 0));
  locked.sort((left, right) => {
    if (left.published !== right.published) {
      return left.published ? -1 : 1;
    }

    return left.title.localeCompare(right.title, "es");
  });

  return syncAssignmentOrder([...unlocked, ...locked]);
}

function toAssignmentPayload(items: AssignmentEditorItem[]) {
  return items
    .filter((item) => item.hasAccess)
    .map((item) => ({
      materialId: item.id,
      position: item.position ?? 0,
    }));
}

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<MaterialResponse[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [students, setStudents] = useState<AdminStudentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [assignmentItems, setAssignmentItems] = useState<AssignmentEditorItem[]>(
    [],
  );
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");
  const [assignmentSuccess, setAssignmentSuccess] = useState("");
  const [isSavingAssignments, setIsSavingAssignments] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    Promise.all([
      getMaterials(),
      getMaterialCategories(),
      getAdminStudents(),
    ])
      .then(([mats, cats, studentItems]) => {
        setMaterials(mats);
        setCategories(cats);
        setStudents(studentItems);
        if (cats.length > 0 && !formState.categoryKey) {
          setFormState((prev) => ({ ...prev, categoryKey: cats[0].key }));
        }
        if (studentItems.length > 0) {
          setSelectedStudentId(studentItems[0].id);
        }
      })
      .catch((error) => setLoadError(normalizeError(error).message))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedStudentId) {
      setAssignmentItems([]);
      setAssignmentError("");
      setAssignmentSuccess("");
      return;
    }

    setIsAssignmentsLoading(true);
    setAssignmentError("");
    setAssignmentSuccess("");

    getAdminStudentMaterialAssignments(selectedStudentId)
      .then((assignments) => {
        setAssignmentItems(buildAssignmentEditorItems(materials, assignments));
      })
      .catch((error) => {
        setAssignmentItems([]);
        setAssignmentError(normalizeError(error).message);
      })
      .finally(() => setIsAssignmentsLoading(false));
  }, [selectedStudentId]);

  const selectedStudent =
    students.find((student) => student.id === selectedStudentId) ?? null;
  const unlockedItems = assignmentItems.filter((item) => item.hasAccess);
  const lockedItems = assignmentItems.filter((item) => !item.hasAccess);
  const unlockedCount = assignmentItems.filter((item) => item.hasAccess).length;
  const hasCategories = categories.length > 0;
  const showMissingCategoriesState = !isLoading && !loadError && !hasCategories;

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
      const newMaterial = await createMaterial({
        title,
        description,
        categoryKey: formState.categoryKey,
        published: formState.published,
        links: [{ label: linkLabel, url: linkUrl }],
      });
      setMaterials((prev) => [newMaterial, ...prev]);
      setAssignmentItems((prev) =>
        buildAssignmentEditorItems(
          [newMaterial, ...prev.map(({ hasAccess, position, ...item }) => item)],
          toAssignmentPayload(prev),
        ),
      );
      setFormState({
        ...initialFormState,
        categoryKey: categories[0]?.key ?? "",
      });
      setSuccessMessage("Material creado. Ya podes asignarlo por alumno.");
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
      setMaterials((prev) => prev.filter((material) => material.id !== id));
      setAssignmentItems((prev) => prev.filter((item) => item.id !== id));
      setSuccessMessage("Material eliminado.");
    } catch (error) {
      setErrorMessage(normalizeError(error).message);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleAssignment = (materialId: string) => {
    setAssignmentItems((prev) => {
      const next = prev.map((item) => {
        if (item.id !== materialId) return item;
        if (!item.published && !item.hasAccess) return item;
        return { ...item, hasAccess: !item.hasAccess };
      });

      return syncAssignmentOrder(next);
    });
    setAssignmentSuccess("");
  };

  const moveAssignment = (materialId: string, direction: "up" | "down") => {
    setAssignmentItems((prev) => {
      const unlocked = prev.filter((item) => item.hasAccess);
      const locked = prev.filter((item) => !item.hasAccess);
      const currentIndex = unlocked.findIndex((item) => item.id === materialId);

      if (currentIndex === -1) return prev;

      const targetIndex =
        direction === "up" ? currentIndex - 1 : currentIndex + 1;

      if (targetIndex < 0 || targetIndex >= unlocked.length) return prev;

      const nextUnlocked = [...unlocked];
      const currentItem = nextUnlocked[currentIndex];
      nextUnlocked[currentIndex] = nextUnlocked[targetIndex];
      nextUnlocked[targetIndex] = currentItem;

      return syncAssignmentOrder([...nextUnlocked, ...locked]);
    });
    setAssignmentSuccess("");
  };

  const handleAssignmentDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    setAssignmentItems((prev) => {
      const unlocked = prev.filter((item) => item.hasAccess);
      const locked = prev.filter((item) => !item.hasAccess);
      const oldIndex = unlocked.findIndex((item) => item.id === active.id);
      const newIndex = unlocked.findIndex((item) => item.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return prev;

      return syncAssignmentOrder([...arrayMove(unlocked, oldIndex, newIndex), ...locked]);
    });
    setAssignmentSuccess("");
  };

  const handleSaveAssignments = async () => {
    if (!selectedStudentId) return;

    setIsSavingAssignments(true);
    setAssignmentError("");
    setAssignmentSuccess("");

    try {
      const savedAssignments = await updateAdminStudentMaterialAssignments(
        selectedStudentId,
        {
          assignments: toAssignmentPayload(assignmentItems),
        },
      );
      setAssignmentItems(buildAssignmentEditorItems(materials, savedAssignments));
      setAssignmentSuccess("Asignaciones guardadas.");
    } catch (error) {
      setAssignmentError(normalizeError(error).message);
    } finally {
      setIsSavingAssignments(false);
    }
  };

  return (
    <section className="grid gap-4 xl:grid-cols-[1.05fr_1.3fr]">
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
            <label
              htmlFor="title"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
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
            <label
              htmlFor="description"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Descripcion
            </label>
            <textarea
              id="description"
              value={formState.description}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
              placeholder="Describe brevemente el contenido"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="linkLabel"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Etiqueta del enlace
              </label>
              <input
                id="linkLabel"
                value={formState.linkLabel}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    linkLabel: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
                placeholder="Ej. Abrir material"
              />
            </div>

            <div>
              <label
                htmlFor="linkUrl"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                URL del recurso
              </label>
              <input
                id="linkUrl"
                type="url"
                value={formState.linkUrl}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    linkUrl: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
                placeholder="https://..."
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="category"
                className="block text-sm font-semibold text-slate-700"
              >
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
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                No hay categorias disponibles para asignar al material.
              </div>
            )}
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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-xl text-slate-900">
                Asignar material por alumno
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Desbloquea materiales existentes y define el orden en que cada
                estudiante los ve.
              </p>
            </div>
            <span className="rounded-full bg-[#0066cc]/10 px-3 py-1 text-xs font-semibold text-[#0052a6]">
              {unlockedCount} desbloqueados
            </span>
          </div>

          {isLoading && (
            <div className="mt-4 grid gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-white"
                />
              ))}
            </div>
          )}

          {!isLoading && loadError && (
            <p className="mt-4 rounded-xl bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-800">
              {loadError}
            </p>
          )}

          {!isLoading && !loadError && students.length === 0 && (
            <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
              No hay alumnos disponibles para asignar materiales.
            </p>
          )}

          {!isLoading && !loadError && students.length > 0 && (
            <>
              <div className="mt-5">
                <label
                  htmlFor="student"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Alumno
                </label>
                <div className="relative">
                  <select
                    id="student"
                    value={selectedStudentId}
                    onChange={(event) => setSelectedStudentId(event.target.value)}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-11 text-sm text-slate-900 outline-none transition focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
                  >
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.fullName} - {student.email}
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
                {selectedStudent ? (
                  <p className="mt-2 text-xs text-slate-500">
                    Configurando la biblioteca visible para{" "}
                    <span className="font-semibold text-slate-700">
                      {selectedStudent.fullName}
                    </span>
                    .
                  </p>
                ) : null}
              </div>

              {isAssignmentsLoading && (
                <div className="mt-4 grid gap-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-white"
                    />
                  ))}
                </div>
              )}

              {!isAssignmentsLoading && assignmentError && (
                <p className="mt-4 rounded-xl bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-800">
                  {assignmentError}
                </p>
              )}

              {!isAssignmentsLoading &&
                !assignmentError &&
                assignmentItems.length === 0 && (
                  <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                    No hay materiales cargados todavia.
                  </p>
                )}

              {!isAssignmentsLoading &&
                !assignmentError &&
                assignmentItems.length > 0 && (
                  <>
                    {unlockedItems.length > 0 ? (
                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-800">
                            Desbloqueados
                          </p>
                          <p className="text-xs text-slate-500">
                            Arrastra desde el icono para reordenar.
                          </p>
                        </div>

                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={handleAssignmentDragEnd}
                        >
                          <SortableContext
                            items={unlockedItems.map((item) => item.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <ul className="grid gap-3">
                              {unlockedItems.map((item) => (
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
                                  unlockedCount={unlockedCount}
                                  onToggleAssignment={toggleAssignment}
                                  onMoveAssignment={moveAssignment}
                                />
                              ))}
                            </ul>
                          </SortableContext>
                        </DndContext>
                      </div>
                    ) : (
                      <p className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                        Este alumno no tiene materiales desbloqueados todavia.
                      </p>
                    )}

                    {lockedItems.length > 0 ? (
                      <div className="mt-4">
                        <p className="mb-2 text-sm font-semibold text-slate-800">
                          Disponibles para desbloquear
                        </p>
                        <ul className="grid gap-3">
                          {lockedItems.map((item) => {
                            const canEnable = item.published || item.hasAccess;

                            return (
                              <li
                                key={item.id}
                                className="rounded-2xl border border-slate-200 bg-white p-4 text-sm transition"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="font-semibold text-slate-900">
                                        {item.title}
                                      </p>
                                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                                        {item.category.name}
                                      </span>
                                      {!item.published ? (
                                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                                          Borrador
                                        </span>
                                      ) : null}
                                    </div>
                                    <p className="mt-2 text-slate-600">
                                      {item.description}
                                    </p>
                                    <p className="mt-2 text-xs text-slate-500">
                                      {item.links.length} enlace
                                      {item.links.length === 1 ? "" : "s"} en
                                      la biblioteca.
                                    </p>
                                    {!item.published ? (
                                      <p className="mt-2 text-xs font-semibold text-amber-700">
                                        Publicalo primero para poder asignarlo.
                                      </p>
                                    ) : null}
                                  </div>

                                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => toggleAssignment(item.id)}
                                      disabled={!canEnable}
                                      className="cursor-pointer rounded-xl bg-[#0066cc] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#0056ae] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      Desbloquear
                                    </button>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ) : null}

                    {assignmentSuccess ? (
                      <p className="mt-4 rounded-xl bg-emerald-100 px-3 py-2 text-sm font-semibold text-emerald-800">
                        {assignmentSuccess}
                      </p>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-slate-500">
                        El alumno solo debe recibir en su panel los materiales
                        desbloqueados y en este mismo orden.
                      </p>
                      <button
                        type="button"
                        onClick={handleSaveAssignments}
                        disabled={isSavingAssignments}
                        className="cursor-pointer rounded-xl bg-[#0066cc] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0056ae] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSavingAssignments
                          ? "Guardando..."
                          : "Guardar asignaciones"}
                      </button>
                    </div>
                  </>
                )}
            </>
          )}
        </article>

        <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
          <h3 className="font-display text-xl text-slate-900">
            Biblioteca de materiales
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Revisa todo el material ya cargado y elimina lo que ya no deba
            existir.
          </p>

          {isLoading && (
            <div className="mt-4 grid gap-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-xl border border-slate-200 bg-white p-3"
                />
              ))}
            </div>
          )}

          {!isLoading && loadError && (
            <p className="mt-4 rounded-xl bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-800">
              {loadError}
            </p>
          )}

          {!isLoading && !loadError && (
            <ul className="mt-4 grid gap-3">
              {materials.length === 0 ? (
                <li className="py-6 text-center text-sm text-slate-400">
                  No hay materiales cargados.
                </li>
              ) : (
                materials.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white p-3 text-sm"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-800">{item.title}</p>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[#0066cc]/10 px-2 py-0.5 text-xs font-semibold text-[#0052a6]">
                          {item.category.name}
                        </span>
                        {!item.published ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                            Borrador
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-slate-600">{item.description}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-2">
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
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="text-xs font-semibold text-rose-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === item.id ? "Eliminando..." : "Eliminar"}
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
}
