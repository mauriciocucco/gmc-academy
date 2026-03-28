import { useEffect, useState } from "react";

import {
  generateCertificatePdf,
  getLatestCertificate,
} from "~/lib/api/certificates.service";
import { normalizeError } from "~/lib/api/errors";
import type { CertificateResponse } from "~/lib/api/types";
import { useAuth } from "~/lib/auth";

export default function StudentCertificatePage() {
  const { session } = useAuth();
  const [certificate, setCertificate] = useState<
    CertificateResponse | null | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState("");
  const [generateSuccess, setGenerateSuccess] = useState("");

  useEffect(() => {
    getLatestCertificate()
      .then(setCertificate)
      .catch((error: unknown) => {
        // Any HTTP error likely means no certificate yet (404, 403, 400...)
        // Only treat network-level failures as real errors.
        const status = (error as { status?: number })?.status;

        if (status != null) {
          setCertificate(null);
        } else {
          setLoadError(normalizeError(error).message);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleGeneratePdf = async () => {
    setGenerateError("");
    setGenerateSuccess("");
    setIsGenerating(true);

    try {
      const { pdfUrl } = await generateCertificatePdf();
      setCertificate((prev) => (prev ? { ...prev, pdfUrl } : prev));
      setGenerateSuccess(
        "El PDF fue generado. Puedes abrirlo desde el boton de descarga.",
      );
    } catch (error) {
      setGenerateError(normalizeError(error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <section className="grid gap-6">
        <div className="card-racing-dark-static h-28 animate-pulse p-8" />
        <div className="card-racing-static h-64 animate-pulse p-8" />
      </section>
    );
  }

  if (loadError) {
    return (
      <section className="grid gap-6">
        <article className="rounded-2xl bg-rose-100 p-4 text-center font-semibold text-rose-800 sm:p-8">
          {loadError}
        </article>
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      <article
        className="card-racing-dark-static p-4 sm:p-8"
        style={{ animation: "slide-in 0.6s ease-out" }}
      >
        <div className="flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:gap-4">
          <div className="text-4xl sm:text-5xl">🎓</div>
          <div className="text-center">
            <h2 className="text-[1.8rem] font-bold leading-tight text-white sm:text-3xl">
              Certificado de Finalizacion
            </h2>
            <p className="mt-2 text-sm leading-6 text-blue-300 sm:text-lg">
              {certificate
                ? "Has completado exitosamente el programa"
                : "Aprueba el examen para obtener tu certificado"}
            </p>
          </div>
          <div className="text-4xl sm:text-5xl">🏆</div>
        </div>
      </article>

      <article className="card-racing-static relative overflow-hidden p-4 sm:p-8">
        {!certificate && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-2xl bg-slate-900/60 backdrop-blur-[2px]">
            <div className="text-4xl">🔒</div>
            <p className="px-4 text-center text-base font-bold text-white sm:text-lg">
              Aprueba el examen para desbloquear tu certificado
            </p>
          </div>
        )}

        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'url("/images/route.png")',
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <div className="relative z-10">
          <div className="mb-5 text-center sm:mb-6">
            <span className="inline-block rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-600">
              Vista previa del certificado
            </span>
          </div>

          <div className="mb-6 rounded-xl border-2 border-blue-500 bg-gradient-to-br from-white via-blue-50/30 to-blue-100/30 p-4 shadow-lg sm:p-8">
            <div className="text-center">
              <div className="mb-3 text-5xl sm:mb-4 sm:text-6xl">🎓</div>
              <div className="mb-3 text-base font-bold tracking-wide text-blue-600 sm:text-lg">
                GMC Academia de Conduccion
              </div>
              <h3 className="mb-4 text-[1.8rem] font-bold leading-tight text-slate-900 sm:text-3xl">
                Certificado de Finalizacion
              </h3>
              <div className="mx-auto my-4 h-1 w-24 bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 sm:w-32" />
              <p className="text-base leading-7 text-slate-700 sm:text-lg">
                Ha completado satisfactoriamente el curso de formacion vial
              </p>
            </div>

            <div className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:mt-8 sm:gap-4 sm:p-6">
              <div className="grid gap-1 sm:flex sm:items-center sm:justify-between sm:gap-4">
                <span className="text-sm font-medium text-slate-600">
                  Estudiante
                </span>
                <span className="break-words font-mono text-sm font-bold text-slate-900 sm:text-right">
                  {certificate?.studentName ?? session?.fullName ?? "-"}
                </span>
              </div>
              <div className="grid gap-1 sm:flex sm:items-center sm:justify-between sm:gap-4">
                <span className="text-sm font-medium text-slate-600">
                  Fecha
                </span>
                <span className="font-mono text-sm font-bold text-slate-900 sm:text-right">
                  {certificate ? certificate.issuedAt.slice(0, 10) : "-"}
                </span>
              </div>
              <div className="grid gap-1 sm:flex sm:items-center sm:justify-between sm:gap-4">
                <span className="text-sm font-medium text-slate-600">
                  Calificacion
                </span>
                <span className="font-mono text-sm font-bold text-green-600 sm:text-right">
                  {certificate ? `${certificate.score}/100` : "-"}
                </span>
              </div>
              <div className="grid gap-1 sm:flex sm:items-center sm:justify-between sm:gap-4">
                <span className="text-sm font-medium text-slate-600">
                  ID de Certificado
                </span>
                <span className="break-all font-mono text-xs font-bold text-slate-700 sm:text-right sm:text-sm">
                  {certificate?.code ?? "-"}
                </span>
              </div>
            </div>
          </div>

          {generateError && (
            <p className="mb-4 rounded-xl bg-rose-100 px-4 py-3 text-center text-sm font-semibold text-rose-800">
              {generateError}
            </p>
          )}

          {generateSuccess && (
            <p className="mb-4 rounded-xl bg-emerald-100 px-4 py-3 text-center text-sm font-semibold text-emerald-800">
              {generateSuccess}
            </p>
          )}

          <div className="flex justify-center">
            {!certificate ? (
              <button
                type="button"
                disabled
                className="btn-racing w-full max-w-sm cursor-not-allowed justify-center opacity-40"
                title="Aprueba el examen para desbloquear"
              >
                🔒 Descargar Certificado PDF
              </button>
            ) : certificate.pdfUrl ? (
              <a
                href={certificate.pdfUrl}
                target="_blank"
                rel="noreferrer"
                className="btn-racing w-full max-w-sm justify-center"
                style={{ animation: "glow-pulse 2s infinite" }}
              >
                Descargar Certificado PDF
              </a>
            ) : (
              <button
                type="button"
                onClick={handleGeneratePdf}
                disabled={isGenerating}
                className="btn-racing w-full max-w-sm justify-center disabled:cursor-not-allowed disabled:opacity-60"
                style={
                  !isGenerating ? { animation: "glow-pulse 2s infinite" } : {}
                }
              >
                {isGenerating ? "Generando PDF..." : "Descargar"}
              </button>
            )}
          </div>
        </div>
      </article>
    </section>
  );
}
