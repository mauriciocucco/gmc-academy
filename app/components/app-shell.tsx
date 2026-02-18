import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router";

import { useAuth, type UserRole } from "~/lib/auth";
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
};

const studentNav: NavItem[] = [
  { label: "Inicio", to: "/student" },
  { label: "Material", to: "/student/materials" },
  { label: "Examen", to: "/student/exam" },
  { label: "Certificado", to: "/student/certificate" },
];

const adminNav: NavItem[] = [
  { label: "Inicio", to: "/admin" },
  { label: "Material", to: "/admin/materials" },
  { label: "Alumnos", to: "/admin/students" },
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
              <div className="rounded-2xl bg-slate-100 px-3 py-2 text-right">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Bienvenid@
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  {session?.fullName}
                </p>
              </div>
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
        </header>

        <nav className="rounded-3xl border border-white/70 bg-white/85 p-2 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)] backdrop-blur">
          <ul className="flex flex-wrap gap-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end>
                  {({ isActive }) => (
                    <span className={navClassName(isActive)}>{item.label}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <main>{children}</main>
      </div>

      <WhatsAppButton />
    </div>
  );
}
