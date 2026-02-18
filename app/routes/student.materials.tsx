import { useEffect, useState } from "react";

import { getMaterials, setMaterialViewed } from "~/lib/api/materials.service";
import { normalizeError } from "~/lib/api/errors";
import type { MaterialResponse } from "~/lib/api/types";

const categoryLabels = {
  teoria: "Teoria",
  senales: "Senales",
  simulacro: "Simulacro",
} as const;

const categoryEmojis = {
  teoria: "📖",
  senales: "🚦",
  simulacro: "🎮",
} as const;

const categoryColors: Record<string, { gradient: string; badge: string }> = {
  teoria: {
    gradient: "from-blue-500 to-blue-700",
    badge: "bg-blue-500 text-white",
  },
  senales: {
    gradient: "from-blue-600 to-blue-800",
    badge: "bg-blue-600 text-white",
  },
  simulacro: {
    gradient: "from-gray-700 to-gray-900",
    badge: "bg-gray-700 text-white",
  },
};

const defaultColors = {
  gradient: "from-slate-500 to-slate-700",
  badge: "bg-slate-500 text-white",
};

export default function StudentMaterialsPage() {
  const [materials, setMaterials] = useState<MaterialResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getMaterials()
      .then((data) => {
        setMaterials(data);
        setViewedIds(
          new Set(data.filter((m) => m.viewed === true).map((m) => m.id)),
        );
      })
      .catch((error) => setErrorMessage(normalizeError(error).message))
      .finally(() => setIsLoading(false));
  }, []);

  function handleToggleViewed(id: string) {
    const wasViewed = viewedIds.has(id);
    setMaterialViewed(id, !wasViewed).catch(() => {});
    setViewedIds((prev) => {
      const next = new Set(prev);
      if (wasViewed) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className="grid gap-6">
      <article className="card-racing-dark p-6">
        <div className="flex items-center gap-4">
          <div className="text-4xl">📚</div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              Material de Estudio
            </h2>
            <p className="text-slate-300">
              Accede a todo el contenido necesario para aprobar el examen
            </p>
          </div>
        </div>
      </article>

      {isLoading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card-racing animate-pulse p-5 h-48" />
          ))}
        </div>
      )}

      {!isLoading && errorMessage && (
        <article className="rounded-2xl bg-rose-100 p-6 text-center text-rose-800 font-semibold">
          {errorMessage}
        </article>
      )}

      {!isLoading && !errorMessage && materials.length === 0 && (
        <article className="rounded-2xl border border-slate-200 bg-white/80 p-10 text-center text-slate-500">
          No hay materiales disponibles aun.
        </article>
      )}

      {!isLoading && !errorMessage && materials.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((item, index) => {
            const categoryKey = item.category.key;
            const colors = categoryColors[categoryKey] ?? defaultColors;
            const isViewed = viewedIds.has(item.id);

            return (
              <article
                key={item.id}
                className="card-racing group relative overflow-hidden p-5 flex flex-col"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-10 transition group-hover:opacity-20`}
                />

                <div className="relative z-10 flex flex-col flex-1">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full ${colors.badge} px-2.5 py-0.5 text-xs font-bold shadow-sm`}
                    >
                      {item.category.name}
                    </span>
                    <div className="flex items-center gap-2">
                      {item.publishedAt && (
                        <span className="rounded-lg bg-slate-200 px-2 py-1 text-xs font-medium text-slate-600">
                          {item.publishedAt.slice(0, 10)}
                        </span>
                      )}
                      <button
                        type="button"
                        title={isViewed ? "Quitar visto" : "Marcar como visto"}
                        onClick={() => handleToggleViewed(item.id)}
                        className={`flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border text-xs transition ${
                          isViewed
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-slate-300 bg-white text-slate-400 hover:border-green-400 hover:text-green-500"
                        }`}
                      >
                        ✓
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-2 mb-4 text-sm text-slate-600 flex-1">
                    {item.description}
                  </p>

                  <div className="mt-auto flex flex-col gap-2">
                    {item.links.map((link, linkIndex) => {
                      const label =
                        link.label?.trim() ||
                        (item.links.length > 1
                          ? `Ver material ${linkIndex + 1}`
                          : "Ver material");
                      return (
                        <a
                          key={link.id}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-racing flex items-center justify-between gap-2"
                          onClick={() => handleToggleViewed(item.id)}
                        >
                          <span className="truncate">{label}</span>
                          <span className="shrink-0">→</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
