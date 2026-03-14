import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";

import { createAdminStudent } from "~/lib/api/admin.service";
import { normalizeError } from "~/lib/api/errors";
import type {
  CreateAdminStudentDto,
  CreatedAdminStudent,
} from "~/lib/api/types";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
};

const initialFormState: FormState = {
  fullName: "",
  email: "",
  phone: "",
};

function mapFormStateToDto(formState: FormState): CreateAdminStudentDto {
  const phone = formState.phone.trim();

  return {
    fullName: formState.fullName.trim(),
    email: formState.email.trim().toLowerCase(),
    phone: phone.length > 0 ? phone : null,
  };
}

function validateFormState(formState: FormState): string | null {
  if (!formState.fullName.trim()) {
    return "Ingresa el nombre completo del alumno.";
  }

  if (!formState.email.trim()) {
    return "Ingresa un email para el alumno.";
  }

  return null;
}

function CredentialField({
  label,
  value,
  monospace = false,
}: {
  label: string;
  value: string;
  monospace?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p
        className={`mt-2 break-all text-sm text-slate-900 ${
          monospace ? "font-mono font-semibold" : "font-semibold"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function AdminStudentCreatePage() {
  const navigate = useNavigate();
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [createdStudent, setCreatedStudent] = useState<CreatedAdminStudent | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateFormState(formState);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await createAdminStudent(mapFormStateToDto(formState));
      setCreatedStudent(response);
      setFormState(initialFormState);
    } catch (error) {
      setErrorMessage(normalizeError(error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="grid gap-4">
      <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0066cc]">
              Alta de alumno
            </p>
            <h2 className="mt-2 font-display text-2xl text-slate-900">
              Crear nuevo acceso
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Carga los datos base del alumno. El backend generara una
              contrasena temporal para compartir una sola vez.
            </p>
          </div>

          <Link
            to="/admin/students"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#0066cc]/30 hover:text-[#0052a6]"
          >
            Volver a alumnos
          </Link>
        </div>
      </article>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)]">
        <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
          <form className="grid gap-5" onSubmit={onSubmit}>
            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Nombre completo
              </span>
              <input
                type="text"
                value={formState.fullName}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                placeholder="Ej. Juan Perez"
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Email
              </span>
              <input
                type="email"
                value={formState.email}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                placeholder="alumno@gmc.com"
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Telefono
              </span>
              <input
                type="tel"
                value={formState.phone}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                placeholder="+54 9 11 1234 5678"
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
              />
              <span className="text-xs text-slate-500">
                Opcional. Conviene guardarlo con prefijo internacional para
                contacto por WhatsApp.
              </span>
            </label>

            {errorMessage ? (
              <div className="rounded-2xl bg-rose-100 px-4 py-3 text-sm font-medium text-rose-800">
                {errorMessage}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-2xl bg-[#0066cc] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(0,102,204,0.9)] transition hover:bg-[#0052a6] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Creando..." : "Crear alumno"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/admin/students")}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#0066cc]/30 hover:text-[#0052a6]"
              >
                Cancelar
              </button>
            </div>
          </form>
        </article>

        <article className="rounded-3xl border border-white/70 bg-[linear-gradient(155deg,#f8fbff_0%,#eef6ff_45%,#ffffff_100%)] p-6 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
          {createdStudent ? (
            <div className="grid gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                  Alta completada
                </p>
                <h3 className="mt-2 font-display text-2xl text-slate-900">
                  Credenciales listas para entregar
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Esta contrasena temporal deberia mostrarse una sola vez. Si el
                  backend exige cambio en el primer acceso, el alumno tendra que
                  actualizarla al iniciar sesion.
                </p>
              </div>

              <div className="grid gap-3">
                <CredentialField label="Alumno" value={createdStudent.fullName} />
                <CredentialField label="Email" value={createdStudent.email} />
                <CredentialField
                  label="Contrasena temporal"
                  value={
                    createdStudent.temporaryPassword ??
                    "El backend no devolvio una contrasena temporal."
                  }
                  monospace
                />
                <CredentialField
                  label="Cambio obligatorio"
                  value={createdStudent.mustChangePassword ? "Si" : "No"}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/admin/students"
                  className="inline-flex items-center justify-center rounded-2xl bg-[#0066cc] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_30px_-18px_rgba(0,102,204,0.9)] transition hover:bg-[#0052a6]"
                >
                  Volver al listado
                </Link>
                <Link
                  to={`/admin/students/${createdStudent.id}`}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#0066cc]/30 hover:text-[#0052a6]"
                >
                  Ver ficha del alumno
                </Link>
                <button
                  type="button"
                  onClick={() => setCreatedStudent(null)}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#0066cc]/30 hover:text-[#0052a6]"
                >
                  Crear otro
                </button>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-64 items-center justify-center rounded-2xl border border-dashed border-[#0066cc]/20 bg-white/50 px-6 text-center">
              <div className="max-w-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0066cc]">
                  Credenciales
                </p>
                <h3 className="mt-2 font-display text-2xl text-slate-900">
                  Aun no hay un alumno creado
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Completa el formulario para generar el acceso inicial y ver la
                  contrasena temporal en este panel.
                </p>
              </div>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
