import { Outlet } from "react-router";

import { AppShell } from "~/components/app-shell";
import { RequireRole } from "~/components/route-guards";

export default function StudentLayout() {
  return (
    <RequireRole role="student">
      <AppShell
        role="student"
        title="Campus del Estudiante"
        subtitle="Accede a tu material de estudio, realiza exámenes de práctica y obtené tu certificado"
      >
        <Outlet />
      </AppShell>
    </RequireRole>
  );
}
