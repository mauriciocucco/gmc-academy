import { useEffect, useState, type FormEvent } from "react";

import {
  createMaterial,
  deleteMaterial,
  getMaterialCategories,
  getMaterials,
} from "~/lib/api/materials.service";
import { normalizeError } from "~/lib/api/errors";
import type { MaterialCategory, MaterialResponse } from "~/lib/api/types";

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

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<MaterialResponse[]>([]);
  const [categories, setCategories] = useState<MaterialCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getMaterials(), getMaterialCategories()])
      .then(([mats, cats]) => {
        setMaterials(mats);
        setCategories(cats);
        if (cats.length > 0 && !formState.categoryKey) {
          setFormState((prev) => ({ ...prev, categoryKey: cats[0].key }));
        }
      })
      .catch((error) => setLoadError(normalizeError(error).message))
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setFormState({
        ...initialFormState,
        categoryKey: categories[0]?.key ?? "",
      });
    } catch (error) {
      setErrorMessage(normalizeError(error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteMaterial(id);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      setErrorMessage(normalizeError(error).message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
        <h2 className="font-display text-2xl text-slate-900">
          Publicar material
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Carga recursos y compartilos con los estudiantes.
        </p>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
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
            <label
              htmlFor="category"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              Categoria
            </label>
            <select
              id="category"
              value={formState.categoryKey}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  categoryKey: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.key}>
                  {cat.name}
                </option>
              ))}
            </select>
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="cursor-pointer rounded-xl bg-[#0066cc] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0056ae] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Publicando..." : "Publicar material"}
          </button>
        </form>
      </article>

      <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
        <h3 className="font-display text-xl text-slate-900">
          Material publicado
        </h3>

        {isLoading && (
          <div className="mt-4 grid gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-3 animate-pulse h-16"
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
              <li className="text-center text-sm text-slate-400 py-6">
                No hay materiales publicados.
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
                      {!item.published && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          Borrador
                        </span>
                      )}
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
                      className="text-xs font-semibold text-rose-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
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
    </section>
  );
}
