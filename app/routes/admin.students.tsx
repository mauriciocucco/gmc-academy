import { mockStudents } from "~/data/mock-data";

export default function AdminStudentsPage() {
  return (
    <section className="grid gap-4">
      <article className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
        <h2 className="font-display text-2xl text-slate-900">Alumnos</h2>
        <p className="mt-1 text-sm text-slate-600">
          Seguimiento del ultimo intento de examen por estudiante.
        </p>
      </article>

      <article className="overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-[0_18px_40px_-22px_rgba(2,32,72,0.45)]">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100/75 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Alumno</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Ultimo puntaje</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mockStudents.map((student) => (
                <tr key={student.id} className="text-slate-700">
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    {student.fullName}
                  </td>
                  <td className="px-4 py-3">{student.email}</td>
                  <td className="px-4 py-3">{student.lastAttemptScore}%</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        student.approved
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {student.approved ? "Aprobado" : "Pendiente"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
