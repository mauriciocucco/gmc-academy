import { useEffect, useState } from "react";

import {
  generateCertificatePdf,
  getLatestCertificate,
} from "~/lib/api/certificates.service";
import { normalizeError } from "~/lib/api/errors";
import { useAuth } from "~/lib/auth";
import type { CertificateResponse } from "~/lib/api/types";

export default function StudentCertificatePage() {
  const { session } = useAuth();
  const [certificate, setCertificate] = useState<
    CertificateResponse | null | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");

  useEffect(() => {
    getLatestCertificate()
      .then(setCertificate)
      .catch((error) => setLoadError(normalizeError(error).message))
      .finally(() => setIsLoading(false));
  }, []);

  const handleGeneratePdf = async () => {
    setGenerateError("");
    setIsGenerating(true);

    try {
      const { pdfUrl } = await generateCertificatePdf();
      setCertificate((prev) => (prev ? { ...prev, pdfUrl } : prev));
      window.open(pdfUrl, "_blank");
    } catch (error) {
      setGenerateError(normalizeError(error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <section className="grid gap-6">
        <div className="card-racing-dark animate-pulse p-8 h-28" />
        <div className="card-racing animate-pulse p-8 h-64" />
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="grid gap-6">
        <article className="rounded-2xl bg-rose-100 p-8 text-center font-semibold text-rose-800">
          {loadError}
        </article>
      </section>
    );
  }

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
              Certificado de Finalizacion
            </h2>
            <p className="mt-2 text-lg text-blue-400">
              Has completado exitosamente el programa
            </p>
          </div>
          <div className="text-5xl">🏆</div>
        </div>
      </article>

      {!certificate ? (
        <article className="card-racing p-8 text-center">
          <div className="text-5xl mb-4">📄</div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">
            Aun no tienes certificado
          </h3>
          <p className="text-slate-500 text-sm">
            Aprueba el examen para desbloquear y descargar tu certificado.
          </p>
        </article>
      ) : (
        <article className="card-racing relative overflow-hidden p-8">
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
                  GMC Academia de Conduccion
                </div>
                <h3 className="mb-4 text-3xl font-bold text-slate-900">
                  Certificado de Finalizacion
                </h3>
                <div className="mx-auto my-4 h-1 w-32 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600" />
                <p className="text-lg text-slate-700">
                  Ha completado satisfactoriamente el curso de formacion vial
                </p>
              </div>

              <div className="mt-8 grid gap-4 rounded-lg border border-slate-200 bg-slate-50 p-6">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-600">
                    Estudiante:
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {certificate.studentName || session?.fullName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-600">Fecha:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {certificate.issuedAt.slice(0, 10)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-600">
                    Calificacion:
                  </span>
                  <span className="font-mono font-bold text-green-600">
                    {certificate.score}/100
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-600">
                    ID de Certificado:
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-700">
                    {certificate.code}
                  </span>
                </div>
              </div>
            </div>

            {generateError && (
              <p className="mb-4 rounded-xl bg-rose-100 px-4 py-3 text-center text-sm font-semibold text-rose-800">
                {generateError}
              </p>
            )}

            <div className="flex justify-center gap-3">
              {certificate.pdfUrl ? (
                <a
                  href={certificate.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-racing"
                  style={{ animation: "glow-pulse 2s infinite" }}
                >
                  Descargar Certificado PDF
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handleGeneratePdf}
                  disabled={isGenerating}
                  className="btn-racing disabled:opacity-60 disabled:cursor-not-allowed"
                  style={
                    !isGenerating ? { animation: "glow-pulse 2s infinite" } : {}
                  }
                >
                  {isGenerating
                    ? "Generando PDF..."
                    : "Generar y Descargar PDF"}
                </button>
              )}
            </div>
          </div>
        </article>
      )}
    </section>
  );
}
