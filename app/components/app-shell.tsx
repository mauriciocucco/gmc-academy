import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Link, NavLink, useNavigate } from "react-router";

import { useAuth, type UserRole } from "~/lib/auth";
import { getMyProgress } from "~/lib/api/auth.service";
import type { StudentProgress } from "~/lib/api/types";
import { getStudentProgressStats } from "~/lib/progress";
import { onStudentProgressUpdated } from "~/lib/progress-events";
import { WhatsAppButton } from "./whatsapp-button";

type AppShellProps = {
  role: UserRole;
  title: string;
  subtitle: string;
  children: ReactNode;
};

type NavItem = {
  label: string;
  to: string;
  end?: boolean;
};

const StudentProgressContext = createContext<StudentProgress | null>(null);

export function useStudentProgress(): StudentProgress | null {
  return useContext(StudentProgressContext);
}

const studentNav: NavItem[] = [
  { label: "Inicio", to: "/student" },
  { label: "Materiales", to: "/student/materials" },
  { label: "Examen", to: "/student/exam" },
  { label: "Certificado", to: "/student/certificate" },
];

const adminNav: NavItem[] = [
  { label: "Inicio", to: "/admin" },
  { label: "Examen", to: "/admin/exam" },
  { label: "Materiales", to: "/admin/materials" },
  { label: "Alumnos", to: "/admin/students", end: false },
];

function navClassName(isActive: boolean) {
  const base =
    "cursor-pointer rounded-full px-3 py-1.5 text-sm font-semibold transition-colors duration-150";
  return isActive
    ? `${base} bg-[#0066cc] text-white`
    : `${base} text-slate-700 hover:bg-slate-100`;
}

export function AppShell({ role, title, subtitle, children }: AppShellProps) {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const navItems = role === "admin" ? adminNav : studentNav;
  const [progress, setProgress] = useState<StudentProgress | null>(null);

  const refreshProgress = useCallback(() => {
    if (role !== "student") return;
    getMyProgress()
      .then(setProgress)
      .catch(() => {
        setProgress({
          materialsTotal: 0,
          materialsViewed: 0,
          examPassed: false,
          certificateIssued: false,
        });
      });
  }, [role]);

  useEffect(() => {
    if (role !== "student") {
      setProgress(null);
      return;
    }

    refreshProgress();
    return onStudentProgressUpdated(refreshProgress);
  }, [role, refreshProgress]);

  const progressPct = progress
    ? getStudentProgressStats(progress).percentage
    : 0;

  return (
    <div className="min-h-screen px-4 pb-6 pt-4 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-4">
        <header className="rounded-3xl border border-white/70 bg-white/85 px-4 py-4 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)] backdrop-blur sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0066cc]">
                Autoescuela GMC
              </p>
              <h1 className="font-display text-2xl text-slate-900">{title}</h1>
              <p className="text-sm text-slate-600">{subtitle}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3 rounded-2xl bg-slate-100 px-3 py-2">
                {/* Avatar */}
                {session?.profilePhotoUrl ? (
                  <img
                    src={session.profilePhotoUrl}
                    alt={session.fullName}
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0066cc] text-sm font-bold text-white">
                    {session?.fullName
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                )}
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Bienvenid@
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {session?.fullName}
                  </p>
                  {role === "student" && progress && (
                    <div className="mt-1.5">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-500">Progreso</span>
                        <span className="text-xs font-bold text-[#0066cc]">
                          {progressPct}%
                        </span>
                      </div>
                      <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-[#0066cc] transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {role === "student" && (
                  <Link
                    to="/student/profile"
                    className="cursor-pointer rounded-xl border border-[#0066cc]/30 bg-[#0066cc]/10 px-3 py-2 text-center text-sm font-semibold text-[#0066cc] transition-colors hover:bg-[#0066cc]/20"
                  >
                    Editar perfil
                  </Link>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    navigate("/login");
                  }}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                >
                  Cerrar sesion
                </button>
              </div>
            </div>
          </div>
        </header>

        <nav className="rounded-3xl border border-white/70 bg-white/85 p-2 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)] backdrop-blur">
          <ul className="flex flex-wrap gap-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end ?? true}>
                  {({ isActive }) => (
                    <span className={navClassName(isActive)}>{item.label}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <StudentProgressContext.Provider
          value={role === "student" ? progress : null}
        >
          <main>{children}</main>
        </StudentProgressContext.Provider>
      </div>

      {role === "student" ? <WhatsAppButton /> : null}
    </div>
  );
}
