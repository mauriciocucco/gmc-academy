export default function StudentCertificatePage() {
  return (
    <section className="grid gap-6">
      <article
        className="card-racing-dark p-8"
        style={{ animation: "slide-in 0.6s ease-out" }}
      >
        <div className="flex items-center justify-center gap-4">
          <div className="text-5xl">🎓</div>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white">
              Certificado de Finalización
            </h2>
            <p className="mt-2 text-lg text-blue-400">
              Has completado exitosamente el programa
            </p>
          </div>
          <div className="text-5xl">🏆</div>
        </div>
      </article>

      <article className="card-racing relative overflow-hidden p-8">
        {/* Fondo sutil */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'url("/images/route.png")',
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <div className="relative z-10">
          <div className="mb-6 text-center">
            <span className="inline-block rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-600">
              Vista Previa del Certificado
            </span>
          </div>

          <div className="mb-6 rounded-xl border-2 border-blue-500 bg-gradient-to-br from-white via-blue-50/30 to-blue-100/30 p-8 shadow-lg">
            <div className="text-center">
              <div className="mb-4 text-6xl">🎓</div>
              <div className="mb-3 text-lg font-bold tracking-wide text-blue-600">
                GMC Academia de Conducción
              </div>
              <h3 className="mb-4 text-3xl font-bold text-slate-900">
                Certificado de Finalización
              </h3>
              <div className="mx-auto my-4 h-1 w-32 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600" />
              <p className="text-lg text-slate-700">
                Has completado satisfactoriamente el curso de formación vial
              </p>
            </div>

            <div className="mt-8 grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-600">Estudiante:</span>
                <span className="font-mono font-bold text-slate-900">
                  Juan Pérez
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-600">Fecha:</span>
                <span className="font-mono font-bold text-slate-900">
                  16/02/2026
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-600">
                  Calificación:
                </span>
                <span className="font-mono font-bold text-green-600">
                  95/100
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-600">
                  ID de Certificado:
                </span>
                <span className="font-mono text-sm font-bold text-slate-700">
                  GMC-2026-XYZ123
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              disabled
              className="rounded-lg bg-slate-300 px-8 py-3 font-medium text-slate-500 cursor-not-allowed"
            >
              Descargar Certificado
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-slate-600">
            💡 Completa todas las evaluaciones para desbloquear la descarga
          </p>
        </div>
      </article>
    </section>
  );
}
