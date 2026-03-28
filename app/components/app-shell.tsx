import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";

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
  const location = useLocation();
  const isStudent = role === "student";
  const navItems = role === "admin" ? adminNav : studentNav;
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);
  const hasMountedRef = useRef(false);

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

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    const mainElement = mainRef.current;
    if (!mainElement) {
      return;
    }

    let frameId = 0;
    let timeoutId: number | null = null;
    let attemptCount = 0;
    const maxAttempts = 18;

    const findFallbackTarget = () => {
      const firstLayoutChild = Array.from(mainElement.children).find(
        (child): child is HTMLElement =>
          child instanceof HTMLElement &&
          (child.tagName === "ARTICLE" || child.tagName === "SECTION"),
      );

      const nestedTarget =
        firstLayoutChild?.tagName === "SECTION"
          ? firstLayoutChild.querySelector<HTMLElement>("article, section")
          : null;

      return (
        nestedTarget ??
        firstLayoutChild ??
        mainElement.querySelector<HTMLElement>("article, section") ??
        mainElement
      );
    };

    const scrollToTarget = (target: HTMLElement) => {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    };

    const tryScrollToHero = () => {
      const preferredTarget =
        mainElement.querySelector<HTMLElement>("[data-route-hero='true']");

      if (preferredTarget) {
        scrollToTarget(preferredTarget);
        return;
      }

      attemptCount += 1;
      if (attemptCount >= maxAttempts) {
        scrollToTarget(findFallbackTarget());
        return;
      }

      timeoutId = window.setTimeout(() => {
        frameId = window.requestAnimationFrame(tryScrollToHero);
      }, 90);
    };

    frameId = window.requestAnimationFrame(tryScrollToHero);

    return () => {
      window.cancelAnimationFrame(frameId);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [location.pathname]);

  return (
    <div className="safe-bottom-page min-h-screen px-4 pb-6 pt-4 sm:px-6 md:pb-6">
      <div className="mx-auto grid max-w-6xl gap-4">
        <header className="rounded-3xl border border-white/70 bg-white/85 px-4 py-4 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)] backdrop-blur sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0066cc]">
                Autoescuela GMC
              </p>
              <h1
                className={`font-display leading-tight text-slate-900 sm:text-2xl ${
                  isStudent ? "text-[1.8rem] leading-[1.02]" : "text-[1.7rem]"
                }`}
              >
                {title}
              </h1>
              <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
                {subtitle}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
              <div
                className={`flex min-w-0 items-center gap-3 rounded-[1.4rem] bg-slate-100 px-3 py-3 ${
                  isStudent ? "sm:min-w-[18rem]" : ""
                }`}
              >
                {/* Avatar */}
                {session?.profilePhotoUrl ? (
                  <img
                    src={session.profilePhotoUrl}
                    alt={session.fullName}
                    className="h-10 w-10 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={`flex shrink-0 items-center justify-center rounded-full bg-[#0066cc] text-sm font-bold text-white ${
                      isStudent ? "h-11 w-11" : "h-10 w-10"
                    }`}
                  >
                    {session?.fullName
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Bienvenid@
                  </p>
                  <p
                    className={`text-sm font-semibold text-slate-800 ${
                      isStudent ? "leading-5" : "truncate"
                    }`}
                  >
                    {session?.fullName}
                  </p>
                  {isStudent && progress && (
                    <div className="mt-1.5">
                      <div className="mb-1 flex items-center justify-between gap-3">
                        <span className="text-xs text-slate-500">Progreso</span>
                        <span className="text-xs font-bold text-[#0066cc]">
                          {progressPct}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full max-w-[11.5rem] overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-[#0066cc] transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div
                className={
                  isStudent
                    ? "grid grid-cols-2 gap-2 sm:flex sm:flex-col sm:justify-center"
                    : "flex flex-col gap-2 sm:justify-center"
                }
              >
                {isStudent && (
                  <Link
                    to="/student/profile"
                    className="cursor-pointer rounded-2xl border border-[#0066cc]/30 bg-[#0066cc]/10 px-4 py-2.5 text-center text-sm font-semibold text-[#0066cc] transition-colors hover:bg-[#0066cc]/20"
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
                  className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                >
                  Cerrar sesion
                </button>
              </div>
            </div>
          </div>
        </header>

        <nav className="hidden rounded-3xl border border-white/70 bg-white/85 p-2 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)] backdrop-blur md:block">
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
          <main ref={mainRef}>{children}</main>
        </StudentProgressContext.Provider>
      </div>

      <nav className="safe-inline safe-bottom-nav fixed inset-x-0 z-40 md:hidden">
        <div className="mx-auto max-w-6xl rounded-[1.5rem] border border-[#DFDCE5] bg-white p-1.5 shadow-[0_4px_8px_0_rgba(0,0,0,0.15)]">
          <ul className="grid grid-cols-4 gap-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end ?? true}>
                  {({ isActive }) => (
                    <span
                      className={`flex min-h-[3.25rem] items-center justify-center rounded-[1.15rem] px-2 py-1.5 text-center text-[13px] font-semibold leading-tight transition ${
                        isActive
                          ? "bg-[#0066cc] text-white shadow-[0_12px_26px_-18px_rgba(0,102,204,0.95)]"
                          : "text-[rgba(39,39,39,0.85)] hover:bg-slate-100 hover:text-[rgba(39,39,39,0.98)]"
                      }`}
                    >
                      {item.label}
                    </span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {role === "student" ? <WhatsAppButton /> : null}
    </div>
  );
}
