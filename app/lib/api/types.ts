// ─── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = "student" | "admin";

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  profilePhotoUrl: string | null;
  role: UserRole;
};

export type UpdateMeDto = {
  fullName?: string;
  email?: string;
  phone?: string | null;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
};

// ─── Materials ────────────────────────────────────────────────────────────────

export type MaterialCategory = {
  id: string;
  key: string;
  name: string;
};

export type MaterialLink = {
  id: string;
  label: string;
  url: string;
};

export type MaterialResponse = {
  id: string;
  title: string;
  description: string;
  published: boolean;
  publishedAt: string | null;
  createdById: string;
  category: MaterialCategory;
  links: MaterialLink[];
  viewed: boolean | null;
};

export type CreateMaterialDto = {
  title: string;
  description: string;
  categoryKey: string;
  published: boolean;
  links: { label: string; url: string }[];
};

export type UpdateMaterialDto = Partial<CreateMaterialDto>;

// ─── Exams ────────────────────────────────────────────────────────────────────

export type ExamOption = {
  id: string;
  label: string;
};

export type ExamQuestion = {
  id: string;
  text: string;
  options: ExamOption[];
};

export type ActiveExamResponse = {
  id: string;
  title: string;
  description: string;
  passScore: number;
  questions: ExamQuestion[];
};

export type SubmitExamDto = {
  answers: { questionId: string; optionId: string }[];
};

export type SubmitExamResponse = {
  attemptId: string;
  score: number;
  passed: boolean;
  correctAnswers: number;
  totalQuestions: number;
  certificateCode: string | null;
};

// ─── Attempts ─────────────────────────────────────────────────────────────────

export type AttemptItem = {
  id: string;
  score: number;
  passed: boolean;
  createdAt: string;
};

// ─── Certificates ─────────────────────────────────────────────────────────────

export type CertificateResponse = {
  id: string;
  code: string;
  issuedAt: string;
  studentName: string;
  score: number;
  pdfUrl: string | null;
};

export type GeneratedCertificatePdfResponse = {
  certificateId: string;
  pdfUrl: string;
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export type AdminStats = {
  totalStudents: number;
  approvedStudents: number;
  approvalRate: number;
  averageScore: number;
};

export type AdminStudentItem = {
  id: string;
  fullName: string;
  email: string;
  lastAttemptScore: number | null;
  approved: boolean;
};

export type AdminPerformanceItem = {
  date: string;
  attempts: number;
  approvals: number;
};

// ─── Student Progress ─────────────────────────────────────────────────────────

export type StudentProgress = {
  materialsTotal: number;
  materialsViewed: number;
  examPassed: boolean;
  certificateIssued: boolean;
};
