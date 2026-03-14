import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router";

import { type UserRole, useAuth } from "~/lib/auth";

function GuardLoading() {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-2xl animate-pulse rounded-3xl border border-white/70 bg-white/85 p-8 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)] backdrop-blur">
        <div className="mb-4 h-5 w-52 rounded bg-slate-200" />
        <div className="mb-2 h-4 w-full rounded bg-slate-100" />
        <div className="h-4 w-2/3 rounded bg-slate-100" />
      </div>
    </div>
  );
}

export function RequireAuth({ children }: { children?: ReactNode }) {
  const { isReady, session } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return <GuardLoading />;
  }

  if (!session) {
    return <Navigate replace to="/login" />;
  }

  if (session.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate replace to="/change-password" />;
  }

  if (!session.mustChangePassword && location.pathname === "/change-password") {
    const fallbackPath = session.role === "admin" ? "/admin" : "/student";
    return <Navigate replace to={fallbackPath} />;
  }

  return children ? <>{children}</> : <Outlet />;
}

export function RequireRole({
  role,
  children,
}: {
  role: UserRole;
  children?: ReactNode;
}) {
  const { isReady, session } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return <GuardLoading />;
  }

  if (!session) {
    return <Navigate replace to="/login" />;
  }

  if (session.mustChangePassword && location.pathname !== "/change-password") {
    return <Navigate replace to="/change-password" />;
  }

  if (session.role !== role) {
    const fallbackPath = session.role === "admin" ? "/admin" : "/student";
    return <Navigate replace to={fallbackPath} />;
  }

  return children ? <>{children}</> : <Outlet />;
}
