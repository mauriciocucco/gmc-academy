import { useEffect, useRef, useState } from "react";
import { useAuth } from "~/lib/auth";
import { updateMe, uploadProfilePhoto } from "~/lib/api/auth.service";
import { normalizeError } from "~/lib/api/errors";

export default function StudentProfilePage() {
  const { session, refreshSession } = useAuth();

  const [fullName, setFullName] = useState(session?.fullName ?? "");
  const [email, setEmail] = useState(session?.email ?? "");
  const [phone, setPhone] = useState("");

  const [photoPreview, setPhotoPreview] = useState<string | null>(
    session?.profilePhotoUrl ?? null,
  );
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync when session loads (hydration delay)
  useEffect(() => {
    if (!session) return;
    setFullName(session.fullName);
    setEmail(session.email);
    setPhotoPreview(session.profilePhotoUrl);
  }, [session]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      // Upload photo first if changed
      if (pendingFile) {
        await uploadProfilePhoto(pendingFile);
        setPendingFile(null);
      }

      // Update profile fields
      await updateMe({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
      });

      await refreshSession();
      setSuccessMessage("Perfil actualizado correctamente.");
    } catch (error) {
      setErrorMessage(normalizeError(error).message);
    } finally {
      setIsSaving(false);
    }
  }

  const initials = (session?.fullName ?? "")
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <section className="grid gap-6">
      <article className="card-racing-dark p-6">
        <div className="flex items-center gap-4">
          <div className="text-4xl">👤</div>
          <div>
            <h2 className="text-2xl font-bold text-white">Editar Perfil</h2>
            <p className="text-slate-300">
              Actualizá tu información personal y foto de perfil
            </p>
          </div>
        </div>
      </article>

      <form
        onSubmit={handleSubmit}
        className="grid gap-5 sm:grid-cols-[auto_1fr]"
      >
        {/* Avatar column */}
        <article className="card-racing flex flex-col items-center gap-4 p-6 sm:w-52">
          <div
            className="relative cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            title="Cambiar foto"
          >
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Foto de perfil"
                className="h-28 w-28 rounded-full object-cover ring-4 ring-[#0066cc]/20"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-[#0066cc] text-3xl font-bold text-white ring-4 ring-[#0066cc]/20">
                {initials}
              </div>
            )}
            <div className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-[#0066cc] text-white shadow">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <p className="text-center text-xs text-slate-500">
            JPG, PNG o WebP · máx. 5 MB
          </p>
        </article>

        {/* Fields column */}
        <article className="card-racing flex flex-col gap-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Nombre completo
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Teléfono{" "}
                <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+5491122334455"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0066cc] focus:ring-2 focus:ring-[#0066cc]/20"
              />
            </div>
          </div>

          {successMessage && (
            <p className="rounded-xl bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
              ✓ {successMessage}
            </p>
          )}
          {errorMessage && (
            <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
              {errorMessage}
            </p>
          )}

          <div className="mt-auto flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="btn-racing min-w-32 disabled:opacity-60"
            >
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </article>
      </form>
    </section>
  );
}
