import { mockMaterials } from "~/data/mock-data";

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

const categoryColors = {
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
} as const;

export default function StudentMaterialsPage() {
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

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {mockMaterials.map((item, index) => (
          <article
            key={item.id}
            className="card-racing group relative overflow-hidden p-5 flex flex-col"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${categoryColors[item.category].gradient} opacity-10 transition group-hover:opacity-20`}
            />

            <div className="relative z-10 flex flex-col flex-1">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span
                  className={`rounded-full ${categoryColors[item.category].badge} px-2.5 py-0.5 text-xs font-bold shadow-sm`}
                >
                  {categoryEmojis[item.category]}{" "}
                  {categoryLabels[item.category]}
                </span>
                <span className="rounded-lg bg-slate-200 px-2 py-1 text-xs font-medium text-slate-600">
                  {item.publishedAt}
                </span>
              </div>

              <div className="mb-3 text-3xl">
                {categoryEmojis[item.category]}
              </div>

              <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 mb-2 text-sm text-slate-600">
                {item.description}
              </p>

              <a
                href={item.driveUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-racing mt-auto pt-4 inline-block"
              >
                Abrir Material →
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
