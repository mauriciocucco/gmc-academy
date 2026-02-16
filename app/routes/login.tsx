import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";

import { useAuth, type UserRole } from "~/lib/auth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { isReady, session, signIn } = useAuth();
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");

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
    return (
      <Navigate replace to={session.role === "admin" ? "/admin" : "/student"} />
    );
  }

  // Determinar rol basado en el email (simulando lógica de backend)
  const determineRole = (email: string): UserRole => {
    const normalizedEmail = email.trim().toLowerCase();
    return normalizedEmail.includes("admin") ||
      normalizedEmail.includes("gmc.admin")
      ? "admin"
      : "student";
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const role = determineRole(normalizedEmail);
    const safeEmail = normalizedEmail || "usuario@gmc.local";

    // Extraer nombre del email como fallback
    const userName = safeEmail.split("@")[0].replace(/[._-]/g, " ");
    const capitalizedName =
      userName.charAt(0).toUpperCase() + userName.slice(1);

    signIn({
      fullName: capitalizedName,
      email: safeEmail,
      role,
    });

    navigate(role === "admin" ? "/admin" : "/student");
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
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <button
                type="submit"
                className="btn-racing w-full bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-3.5 text-white hover:from-blue-700 hover:to-blue-800"
                style={{ animation: "glow-pulse 2s infinite" }}
              >
                Acceder al Campus
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
