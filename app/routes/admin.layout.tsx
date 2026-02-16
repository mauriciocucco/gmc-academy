import { Outlet } from "react-router";

import { AppShell } from "~/components/app-shell";
import { RequireRole } from "~/components/route-guards";

export default function AdminLayout() {
  return (
    <RequireRole role="admin">
      <AppShell
        role="admin"
        title="Panel de administracion"
        subtitle="Gestion de materiales y seguimiento academico"
      >
        <Outlet />
      </AppShell>
    </RequireRole>
  );
}
