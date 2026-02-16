import { Link } from "react-router";

const quickActions = [
  {
    to: "/student/materials",
    title: "Material de estudio",
    description: "Accede al contenido subido por la autoescuela.",
    icon: "📚",
    gradient: "from-blue-500 to-blue-700",
    completed: true,
  },
  {
    to: "/student/exam",
    title: "Examen de práctica",
    description: "Entrena con preguntas similares al examen real.",
    icon: "🎯",
    gradient: "from-gray-700 to-gray-900",
    completed: false,
  },
  {
    to: "/student/certificate",
    title: "Certificado",
    description: "Descarga tu certificado cuando apruebes.",
    icon: "🏆",
    gradient: "from-blue-600 to-blue-800",
    completed: false,
  },
];

export default function StudentHomePage() {
  const totalMissions = quickActions.length;
  const completedMissions = quickActions.filter(
    (action) => action.completed,
  ).length;
  const progressPercentage = (completedMissions / totalMissions) * 100;

  return (
    <section className="grid gap-6">
      {/* Barra de progreso estilo racing */}
      <article className="card-racing-dark relative overflow-hidden p-6">
        {/* Imagen de fondo sutil */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'url("/images/route.png")',
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <div className="relative z-10">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Tu Progreso</h2>
              <p className="text-sm font-medium text-slate-300">
                Misiones completadas: {completedMissions}/{totalMissions}
              </p>
            </div>
            <div className="text-4xl font-black text-blue-500">
              {Math.round(progressPercentage)}%
            </div>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercentage}%` }}
            >
              {progressPercentage > 15 && (
                <div className="flex h-full items-center justify-center text-sm font-bold text-white">
                  {Math.round(progressPercentage)}%
                </div>
              )}
            </div>
          </div>
        </div>
      </article>

      {/* Mensaje de bienvenida */}
      <article className="card-racing p-6">
        <div className="flex items-start gap-4">
          <div className="text-4xl">🚗</div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Bienvenido a tu formación vial
            </h2>
            <p className="mt-2 text-slate-600">
              Hemos preparado material de alta calidad, desarrollado por
              instructores certificados con años de experiencia. Sin embargo,
              recordá que el conocimiento teórico es solo el primer paso: la
              práctica constante es fundamental para consolidar tu aprendizaje y
              garantizar tu éxito en el examen oficial. Avanzá a tu propio
              ritmo, pero con dedicación y compromiso. ¡Vamos por esa licencia!
            </p>
          </div>
        </div>
      </article>

      {/* Módulos principales */}
      <div className="grid gap-5 sm:grid-cols-3">
        {quickActions.map((item, index) => (
          <Link
            key={item.to}
            to={item.to}
            className="card-racing group relative overflow-hidden p-6 cursor-pointer"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-10 transition group-hover:opacity-20`}
            />

            <div className="relative z-10">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-4xl">{item.icon}</span>
                {item.completed && (
                  <span className="rounded-full bg-green-500 px-2.5 py-0.5 text-xs font-bold text-white">
                    ✓ Completado
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
