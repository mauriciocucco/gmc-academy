export type MaterialItem = {
  id: number;
  title: string;
  description: string;
  driveUrl: string;
  category: "teoria" | "senales" | "simulacro";
  publishedAt: string;
};

export type StudentItem = {
  id: number;
  fullName: string;
  email: string;
  lastAttemptScore: number;
  approved: boolean;
};

export const mockMaterials: MaterialItem[] = [
  {
    id: 1,
    title: "Manual de senales viales",
    description: "Material base para reconocer senales reglamentarias y preventivas.",
    driveUrl: "https://drive.google.com/file/d/1manual-senales-gmc/view",
    category: "senales",
    publishedAt: "2026-02-10",
  },
  {
    id: 2,
    title: "Resumen de prioridad de paso",
    description: "Guia rapida de normas para cruces, rotondas y avenidas.",
    driveUrl: "https://drive.google.com/file/d/1prioridad-paso-gmc/view",
    category: "teoria",
    publishedAt: "2026-02-12",
  },
  {
    id: 3,
    title: "Simulacro de examen 1",
    description: "Banco de preguntas tipo examen municipal.",
    driveUrl: "https://drive.google.com/file/d/1simulacro-gmc-01/view",
    category: "simulacro",
    publishedAt: "2026-02-14",
  },
];

export const mockStudents: StudentItem[] = [
  {
    id: 1,
    fullName: "Lucia Fernandez",
    email: "lucia.fernandez@gmc.com",
    lastAttemptScore: 86,
    approved: true,
  },
  {
    id: 2,
    fullName: "Martin Lopez",
    email: "martin.lopez@gmc.com",
    lastAttemptScore: 64,
    approved: false,
  },
  {
    id: 3,
    fullName: "Carolina Diaz",
    email: "carolina.diaz@gmc.com",
    lastAttemptScore: 78,
    approved: true,
  },
];
