import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/index.tsx"),
  route("login", "routes/login.tsx"),
  route("change-password", "routes/change-password.tsx"),
  route("student", "routes/student.layout.tsx", [
    index("routes/student.home.tsx"),
    route("materials", "routes/student.materials.tsx"),
    route("exam", "routes/student.exam.tsx"),
    route("certificate", "routes/student.certificate.tsx"),
    route("profile", "routes/student.profile.tsx"),
  ]),
  route("admin", "routes/admin.layout.tsx", [
    index("routes/admin.home.tsx"),
    route("exam", "routes/admin.exam.tsx"),
    route("materials", "routes/admin.materials.tsx"),
    route("students", "routes/admin.students.tsx"),
    route("students/new", "routes/admin.student-create.tsx"),
    route("students/:studentId", "routes/admin.student-detail.tsx"),
  ]),
] satisfies RouteConfig;
