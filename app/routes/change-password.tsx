import { useState, type FormEvent } from "react";
import { Navigate } from "react-router";

import { RequireAuth } from "~/components/route-guards";
import { changePassword } from "~/lib/api/auth.service";
import { normalizeError } from "~/lib/api/errors";
import { useAuth } from "~/lib/auth";

const MIN_PASSWORD_LENGTH = 8;

function validatePasswords(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): string | null {
  if (!currentPassword) {
    return "Ingresa tu contraseña actual.";
  }

  if (!newPassword) {
    return "Ingresa una nueva contraseña.";
  }

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  if (!confirmPassword) {
    return "Confirma la nueva contraseña.";
  }

  if (newPassword !== confirmPassword) {
    return "Las contraseñas no coinciden.";
  }

  return null;
}

function ChangePasswordContent() {
  const { session, refreshSession, signOut } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!session) {
    return <Navigate replace to="/login" />;
  }

  if (!session.mustChangePassword) {
    return (
      <Navigate replace to={session.role === "admin" ? "/admin" : "/student"} />
    );
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validatePasswords(
      currentPassword,
      newPassword,
      confirmPassword,
    );
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await changePassword({ currentPassword, newPassword });
      await refreshSession();
      setSuccessMessage("Contraseña actualizada. Ya puedes ingresar al campus.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setErrorMessage(normalizeError(error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-[linear-gradient(155deg,#072447_0%,#0b3b73_48%,#0c5cb4_100%)] p-8 text-white shadow-[0_30px_80px_-42px_rgba(7,36,71,0.95)] lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(125,211,252,0.18),transparent_30%)]" />
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-100/80">
              Primer ingreso
            </p>
            <h1 className="mt-3 font-display text-4xl leading-tight">
              Define tu contraseña definitiva
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-blue-50/85">
              Entraste con una contraseña temporal generada por la academia.
              Antes de continuar, debes validarla y crear una nueva contraseña
              personal.
            </p>

            <div className="mt-8 grid gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/80">
                  Usuario
                </p>
                <p className="mt-2 font-semibold text-white">{session.email}</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100/80">
                  Recomendación
                </p>
                <p className="mt-2 text-sm text-blue-50/85">
                  Ingresa primero la contraseña temporal actual y luego define
                  una nueva de al menos 8 caracteres.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/92 p-8 shadow-[0_24px_60px_-30px_rgba(2,32,72,0.48)] lg:p-10">
          <div className="mb-6">
            <h2 className="font-display text-3xl text-slate-900">
              Nueva contraseña
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Este paso es obligatorio antes de acceder al panel.
            </p>
          </div>

          <form className="grid gap-5" onSubmit={onSubmit}>
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Contraseña actual
              </span>
              <input
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                placeholder="La contraseña temporal que usaste para entrar"
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Nueva contraseña
              </span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Minimo 8 caracteres"
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Confirmar contraseña
              </span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Repite la nueva contraseña"
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
              />
            </label>

            {errorMessage ? (
              <p className="rounded-2xl bg-rose-100 px-4 py-3 text-sm font-semibold text-rose-800">
                {errorMessage}
              </p>
            ) : null}

            {successMessage ? (
              <p className="rounded-2xl bg-emerald-100 px-4 py-3 text-sm font-semibold text-emerald-800">
                {successMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-2xl bg-[#0066cc] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(0,102,204,0.9)] transition hover:bg-[#0052a6] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Actualizando..." : "Guardar nueva contraseña"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-4 text-sm font-semibold text-slate-500 transition hover:text-slate-700"
          >
            Cerrar sesión
          </button>
        </section>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <RequireAuth>
      <ChangePasswordContent />
    </RequireAuth>
  );
}
