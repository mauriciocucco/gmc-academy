import { useState, type FormEvent } from "react";

import { mockMaterials, type MaterialItem } from "~/data/mock-data";

type FormState = {
  title: string;
  description: string;
  driveUrl: string;
  category: MaterialItem["category"];
};

const initialFormState: FormState = {
  title: "",
  description: "",
  driveUrl: "",
  category: "teoria",
};

const categoryLabels = {
  teoria: "Teoria",
  senales: "Senales",
  simulacro: "Simulacro",
} as const;

const drivePattern = /drive\.google\.com/i;

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<MaterialItem[]>(
    () => mockMaterials,
  );
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const title = formState.title.trim();
    const description = formState.description.trim();
    const driveUrl = formState.driveUrl.trim();

    if (!title || !description || !driveUrl) {
      setErrorMessage("Completa todos los campos.");
      return;
    }

    if (!drivePattern.test(driveUrl)) {
      setErrorMessage("La URL debe corresponder a Google Drive.");
      return;
    }

    const nextItem: MaterialItem = {
      id: Date.now(),
      title,
      description,
      driveUrl,
      category: formState.category,
      publishedAt: new Date().toISOString().slice(0, 10),
    };

    setMaterials((prev) => [nextItem, ...prev]);
    setFormState(initialFormState);
    setErrorMessage("");
  };

  return (
    <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
        <h2 className="font-display text-2xl text-slate-900">
          Publicar material
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Carga recursos en Google Drive y compartelos con los estudiantes.
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

          <div>
            <label
              htmlFor="driveUrl"
              className="mb-1.5 block text-sm font-semibold text-slate-700"
            >
              URL de Google Drive
            </label>
            <input
              id="driveUrl"
              type="url"
              value={formState.driveUrl}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  driveUrl: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
              placeholder="https://drive.google.com/..."
            />
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
              value={formState.category}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  category: event.target.value as MaterialItem["category"],
                }))
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
            >
              {Object.entries(categoryLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {errorMessage ? (
            <p className="rounded-xl bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-800">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            className="cursor-pointer rounded-xl bg-[#0066cc] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0056ae]"
          >
            Publicar material
          </button>
        </form>
      </article>

      <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
        <h3 className="font-display text-xl text-slate-900">
          Material publicado
        </h3>
        <ul className="mt-4 grid gap-3">
          {materials.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-slate-200 bg-white p-3 text-sm"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-semibold text-slate-800">{item.title}</p>
                <span className="rounded-full bg-[#0066cc]/10 px-2 py-0.5 text-xs font-semibold text-[#0052a6]">
                  {categoryLabels[item.category]}
                </span>
              </div>
              <p className="text-slate-600">{item.description}</p>
              <a
                href={item.driveUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex text-xs font-semibold text-[#0054aa] hover:underline"
              >
                Abrir archivo
              </a>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}
