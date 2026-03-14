import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";

import { normalizeError } from "~/lib/api/errors";
import {
  createMaterialCategory,
  deleteMaterialCategory,
  getMaterialCategories,
  updateMaterialCategory,
} from "~/lib/api/materials.service";
import type {
  CreateMaterialCategoryDto,
  MaterialCategory,
} from "~/lib/api/types";

type FormState = {
  key: string;
  name: string;
};

const CATEGORY_KEY_PATTERN = /^[a-z0-9_]+$/;

const initialFormState: FormState = {
  key: "",
  name: "",
};

function sortCategories(items: MaterialCategory[]): MaterialCategory[] {
  return [...items].sort((left, right) => left.name.localeCompare(right.name, "es"));
}

function mapFormStateToDto(formState: FormState): CreateMaterialCategoryDto {
  return {
    key: formState.key.trim(),
    name: formState.name.trim(),
  };
}

function validateFormState(formState: FormState): string | null {
  const key = formState.key.trim();
  const name = formState.name.trim();

  if (!key || !name) {
    return "Completa la key y el nombre de la categoria.";
  }

  if (key.length < 2 || key.length > 50) {
    return "La key debe tener entre 2 y 50 caracteres.";
  }

  if (!CATEGORY_KEY_PATTERN.test(key)) {
    return "La key debe estar en minusculas y usar solo letras, numeros o guion bajo.";
  }

  if (name.length < 2 || name.length > 80) {
    return "El nombre debe tener entre 2 y 80 caracteres.";
  }

  return null;
}

export default function AdminMaterialCategoriesPage() {
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    getMaterialCategories()
      .then((response) => {
        setCategories(sortCategories(response));
        setLoadError("");
      })
      .catch((error) => setLoadError(normalizeError(error).message))
      .finally(() => setIsLoading(false));
  }, []);

  function resetForm() {
    setFormState(initialFormState);
    setEditingCategoryId(null);
  }

  function beginEdit(category: MaterialCategory) {
    setEditingCategoryId(category.id);
    setFormState({
      key: category.key,
      name: category.name,
    });
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validateFormState(formState);
    if (validationError) {
      setErrorMessage(validationError);
      setSuccessMessage("");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const dto = mapFormStateToDto(formState);
      const savedCategory = editingCategoryId
        ? await updateMaterialCategory(editingCategoryId, dto)
        : await createMaterialCategory(dto);

      setCategories((current) => {
        const nextItems = editingCategoryId
          ? current.map((category) =>
              category.id === editingCategoryId ? savedCategory : category,
            )
          : [...current, savedCategory];

        return sortCategories(nextItems);
      });
      resetForm();
      setSuccessMessage(
        editingCategoryId
          ? "Categoria actualizada."
          : "Categoria creada. Ya esta disponible para nuevos materiales.",
      );
    } catch (error) {
      setErrorMessage(normalizeError(error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(category: MaterialCategory) {
    setDeletingId(category.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await deleteMaterialCategory(category.id);
      setCategories((current) =>
        current.filter((item) => item.id !== category.id),
      );
      if (editingCategoryId === category.id) {
        resetForm();
      }
      setSuccessMessage("Categoria eliminada.");
    } catch (error) {
      setErrorMessage(normalizeError(error).message);
    } finally {
      setDeletingId(null);
    }
  }

  const isEditing = editingCategoryId !== null;

  return (
    <section className="grid gap-4">
      <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0066cc]">
              Materiales
            </p>
            <h2 className="mt-2 font-display text-2xl text-slate-900">
              Gestion de categorias
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Define las categorias disponibles para clasificar materiales y
              mantener ordenada la biblioteca.
            </p>
          </div>

          <Link
            to="/admin/materials"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#0066cc]/30 hover:text-[#0052a6]"
          >
            Volver a materiales
          </Link>
        </div>
      </article>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]">
        <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl text-slate-900">
                {isEditing ? "Editar categoria" : "Nueva categoria"}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                La key identifica la categoria en forma unica. El nombre es el
                texto visible en el campus.
              </p>
            </div>

            {isEditing ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#0066cc]/30 hover:text-[#0052a6]"
              >
                Cancelar edicion
              </button>
            ) : null}
          </div>

          <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Key tecnica
              </span>
              <input
                type="text"
                value={formState.key}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    key: event.target.value.trimStart().toLowerCase(),
                  }))
                }
                placeholder="ej. theory"
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
              />
              <span className="text-xs text-slate-500">
                Entre 2 y 50 caracteres. Solo minusculas, numeros y guion bajo.
              </span>
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Nombre visible
              </span>
              <input
                type="text"
                value={formState.name}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Ej. Theory"
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
              />
              <span className="text-xs text-slate-500">
                Este nombre se muestra en los materiales del admin y del alumno.
              </span>
            </label>

            {errorMessage ? (
              <p className="rounded-2xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-800">
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? (
              <p className="rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-800">
                {successMessage}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-2xl bg-[#0066cc] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(0,102,204,0.9)] transition hover:bg-[#0052a6] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? isEditing
                    ? "Guardando..."
                    : "Creando..."
                  : isEditing
                    ? "Guardar cambios"
                    : "Crear categoria"}
              </button>

              <Link
                to="/admin/materials"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#0066cc]/30 hover:text-[#0052a6]"
              >
                Ir a materiales
              </Link>
            </div>
          </form>
        </article>

        <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl text-slate-900">
                Categorias disponibles
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Revisa, edita o elimina categorias. El backend bloquea el
                borrado si todavia tienen materiales asociados.
              </p>
            </div>

            <span className="rounded-full bg-[#0066cc]/10 px-3 py-1 text-xs font-semibold text-[#0052a6]">
              {categories.length} categoria{categories.length === 1 ? "" : "s"}
            </span>
          </div>

          {isLoading ? (
            <div className="mt-4 grid gap-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-2xl border border-slate-200 bg-white"
                />
              ))}
            </div>
          ) : null}

          {!isLoading && loadError ? (
            <p className="mt-4 rounded-2xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-800">
              {loadError}
            </p>
          ) : null}

          {!isLoading && !loadError && categories.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
              <p className="text-sm font-semibold text-slate-700">
                Aun no hay categorias creadas.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Crea la primera para habilitar la carga de materiales en el
                panel admin.
              </p>
            </div>
          ) : null}

          {!isLoading && !loadError && categories.length > 0 ? (
            <ul className="mt-4 grid gap-3">
              {categories.map((category) => {
                const isDeleting = deletingId === category.id;
                const isCurrentEditing = editingCategoryId === category.id;

                return (
                  <li
                    key={category.id}
                    className={`rounded-2xl border p-4 transition ${
                      isCurrentEditing
                        ? "border-[#0066cc]/30 bg-[#0066cc]/5"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900">
                            {category.name}
                          </p>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
                            {category.key}
                          </span>
                          {isCurrentEditing ? (
                            <span className="rounded-full bg-[#0066cc]/10 px-2.5 py-1 text-xs font-semibold text-[#0052a6]">
                              Editando
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm text-slate-500">
                          Disponible para clasificar materiales nuevos y
                          existentes.
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => beginEdit(category)}
                          className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#0066cc]/30 hover:text-[#0052a6]"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(category)}
                          disabled={isDeleting}
                          className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isDeleting ? "Eliminando..." : "Eliminar"}
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </article>
      </div>
    </section>
  );
}
