import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getMyProgress } from "~/lib/api/auth.service";
import type { StudentProgress } from "~/lib/api/types";

type QuickAction = {
  to: string;
  title: string;
  description: string;
  icon: string;
  gradient: string;
  completed: boolean;
};

function buildQuickActions(progress: StudentProgress): QuickAction[] {
  return [
    {
      to: "/student/materials",
      title: "Material de estudio",
      description: "Accede al contenido subido por la autoescuela.",
      icon: "📚",
      gradient: "from-blue-500 to-blue-700",
      completed: progress.materialsViewed > 0,
    },
    {
      to: "/student/exam",
      title: "Examen de práctica",
      description: "Entrena con preguntas similares al examen real.",
      icon: "🎯",
      gradient: "from-gray-700 to-gray-900",
      completed: progress.examPassed,
    },
    {
      to: "/student/certificate",
      title: "Certificado",
      description: "Descarga tu certificado cuando apruebes.",
      icon: "🏆",
      gradient: "from-blue-600 to-blue-800",
      completed: progress.certificateIssued,
    },
  ];
}

function ProgressSkeleton() {
  return (
    <article className="card-racing-dark relative overflow-hidden p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="space-y-2">
          <div className="h-7 w-36 animate-pulse rounded bg-white/20" />
          <div className="h-4 w-48 animate-pulse rounded bg-white/10" />
        </div>
        <div className="h-10 w-16 animate-pulse rounded bg-white/20" />
      </div>
      <div className="progress-bar">
        <div className="h-full w-1/4 animate-pulse rounded-full bg-white/20" />
      </div>
    </article>
  );
}

export default function StudentHomePage() {
  const [progress, setProgress] = useState<StudentProgress | null>(null);

  useEffect(() => {
    getMyProgress()
      .then(setProgress)
      .catch(() => {
        // Si falla, mostramos todo como no completado
        setProgress({
          materialsTotal: 0,
          materialsViewed: 0,
          examPassed: false,
          certificateIssued: false,
        });
      });
  }, []);

  const quickActions = progress ? buildQuickActions(progress) : null;

  const completedMissions = quickActions
    ? quickActions.filter((a) => a.completed).length
    : 0;
  const totalMissions = 3;
  const progressPercentage = (completedMissions / totalMissions) * 100;

  return (
    <section className="grid gap-6">
      {/* Barra de progreso estilo racing */}
      {progress === null ? (
        <ProgressSkeleton />
      ) : (
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
      )}

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
        {(
          quickActions ??
          buildQuickActions({
            materialsTotal: 0,
            materialsViewed: 0,
            examPassed: false,
            certificateIssued: false,
          })
        ).map((item, index) => (
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
