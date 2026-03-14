import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";

import { useAuth } from "~/lib/auth";
import { normalizeError } from "~/lib/api/errors";

export default function LoginPage() {
  const navigate = useNavigate();
  const { isReady, session, signIn } = useAuth();
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 px-4">
        <div className="w-full max-w-md animate-pulse rounded-2xl bg-white p-8 shadow-lg">
          <div className="mb-6 h-8 w-3/4 rounded bg-slate-200" />
          <div className="mb-4 h-4 w-full rounded bg-slate-100" />
          <div className="mb-4 h-10 w-full rounded bg-slate-100" />
          <div className="h-10 w-full rounded bg-slate-100" />
        </div>
      </div>
    );
  }

  if (session) {
    if (session.mustChangePassword) {
      return <Navigate replace to="/change-password" />;
    }

    return (
      <Navigate replace to={session.role === "admin" ? "/admin" : "/student"} />
    );
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      await signIn({ email: email.trim().toLowerCase(), password });
      // The AuthProvider updates session asynchronously;
      // navigate to /student and let the role guard redirect if needed.
      navigate("/student", { replace: true });
    } catch (error) {
      const apiError = normalizeError(error);
      setErrorMessage(
        apiError.status === 401
          ? "Credenciales incorrectas. Verifica tu email y contraseña."
          : apiError.message,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-6xl">
        {/* Título estilo racing moderno */}
        <div
          className="mb-8 text-center"
          style={{ animation: "slide-in 0.6s ease-out" }}
        >
          <h1
            className="mb-2 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 bg-clip-text text-6xl font-black uppercase text-transparent"
            style={{
              filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.2))",
            }}
          >
            Academia GMC
          </h1>
          <p className="text-xl font-bold text-slate-700">
            Sistema de Formación Vial
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.2fr_1fr]">
          {/* Sección informativa con imagen de ruta */}
          <section className="card-racing-dark relative overflow-hidden p-8 text-white lg:p-10">
            {/* Imagen de fondo */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: 'url("/images/street.png")',
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-slate-800/85 to-blue-900/80" />

            <div className="relative z-10">
              <div className="mb-6">
                <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-bold uppercase tracking-wider">
                  <span>⚡</span>
                  <span>Campus Virtual</span>
                </div>
                <h2 className="mb-4 text-4xl font-bold leading-tight">
                  Tu Camino Hacia la Licencia
                </h2>
                <p className="text-lg text-slate-200">
                  Preparate con material actualizado, practica exámenes y obtén
                  tu certificado oficial
                </p>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-600/50 bg-slate-800/60 p-4 backdrop-blur transition hover:bg-slate-700/60">
                  <div className="mb-2 text-2xl">📚</div>
                  <h3 className="font-bold text-white">Material de Estudio</h3>
                  <p className="mt-1 text-sm text-slate-300">
                    Contenido actualizado y completo
                  </p>
                </div>

                <div className="rounded-lg border border-slate-600/50 bg-slate-800/60 p-4 backdrop-blur transition hover:bg-slate-700/60">
                  <div className="mb-2 text-2xl">🎯</div>
                  <h3 className="font-bold text-white">Examen de Práctica</h3>
                  <p className="mt-1 text-sm text-slate-300">
                    Simula el examen real
                  </p>
                </div>

                <div className="rounded-lg border border-slate-600/50 bg-slate-800/60 p-4 backdrop-blur transition hover:bg-slate-700/60">
                  <div className="mb-2 text-2xl">🏆</div>
                  <h3 className="font-bold text-white">Certificado Digital</h3>
                  <p className="mt-1 text-sm text-slate-300">
                    Descarga al aprobar
                  </p>
                </div>

                <div className="rounded-lg border border-slate-600/50 bg-slate-800/60 p-4 backdrop-blur transition hover:bg-slate-700/60">
                  <div className="mb-2 text-2xl">📊</div>
                  <h3 className="font-bold text-white">Tu Progreso</h3>
                  <p className="mt-1 text-sm text-slate-300">
                    Seguimiento en tiempo real
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Formulario de login moderno */}
          <section className="card-racing p-8 lg:p-10">
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-bold text-slate-900">
                Iniciar Sesión
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Accede a tu panel de formación
              </p>
            </div>

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Correo Electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="usuario@gmc.com"
                  required
                  className="w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-3 pr-12 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    {showPassword ? (
                      // Eye-off icon
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      // Eye icon
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-racing w-full bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3.5 text-white hover:from-blue-700 hover:to-blue-800 disabled:opacity-60 disabled:cursor-not-allowed"
                style={
                  !isLoading ? { animation: "glow-pulse 2s infinite" } : {}
                }
              >
                {isLoading ? "Accediendo..." : "Acceder al Campus"}
              </button>

              {errorMessage ? (
                <p className="rounded-xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-800">
                  {errorMessage}
                </p>
              ) : null}
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
