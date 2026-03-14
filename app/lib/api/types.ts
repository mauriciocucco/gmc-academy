// ─── Auth ─────────────────────────────────────────────────────────────────────

export type UserRole = "student" | "admin";

export type UserProfile = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  profilePhotoUrl: string | null;
  role: UserRole;
  mustChangePassword: boolean;
};

export type UpdateMeDto = {
  fullName?: string;
  email?: string;
  phone?: string | null;
};

export type ChangePasswordDto = {
  currentPassword: string;
  newPassword: string;
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

export type CreateMaterialCategoryDto = {
  key: string;
  name: string;
};

export type UpdateMaterialCategoryDto = Partial<CreateMaterialCategoryDto>;

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

export type AdminStudentMaterialAssignment = {
  materialId: string;
  position: number;
};

export type UpdateAdminStudentMaterialAssignmentsDto = {
  assignments: AdminStudentMaterialAssignment[];
};

// ─── Exams ────────────────────────────────────────────────────────────────────

export type ExamOption = {
  id: string;
  label: string;
};

export type ExamQuestion = {
  id: string;
  text: string;
  position: number;
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

export type AdminExamOption = {
  id: string;
  label: string;
  isCorrect: boolean;
};

export type AdminExamQuestion = {
  id: string;
  text: string;
  position: number;
  options: AdminExamOption[];
};

export type AdminExamConfig = {
  id: string;
  title: string;
  description: string;
  passScore: number;
  updatedAt: string | null;
  updatedByName: string | null;
  questions: AdminExamQuestion[];
};

export type UpdateAdminExamDto = {
  title: string;
  description: string;
  passScore: number;
  questions: Array<{
    id?: string;
    text: string;
    position: number;
    options: Array<{
      id?: string;
      label: string;
      isCorrect: boolean;
    }>;
  }>;
};

// ─── Attempts ─────────────────────────────────────────────────────────────────

export type AttemptItem = {
  id: string;
  examId: string;
  examTitle: string;
  score: number;
  passed: boolean;
  createdAt: string;
};

export type AttemptReviewOption = {
  id: string;
  label: string;
};

export type AttemptReviewQuestion = {
  questionId: string;
  questionText: string;
  position: number;
  options: AttemptReviewOption[];
  selectedOptionId: string | null;
  selectedOptionLabel: string | null;
  correctOptionId: string;
  correctOptionLabel: string | null;
  isCorrect: boolean;
};

export type AttemptDetail = AttemptItem & {
  correctAnswers: number;
  totalQuestions: number;
  questions: AttemptReviewQuestion[];
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

export type CreateAdminStudentDto = {
  fullName: string;
  email: string;
  phone?: string | null;
};

export type CreatedAdminStudent = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  temporaryPassword: string | null;
  mustChangePassword: boolean;
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

export type AdminStudentStats = {
  totalAttempts: number;
  passedAttempts: number;
  failedAttempts: number;
  bestScore: number | null;
  averageScore: number | null;
  lastAttemptAt: string | null;
  lastPassedAt: string | null;
};

export type AdminStudentNote = {
  content: string | null;
  updatedAt: string | null;
  updatedByName: string | null;
};

export type AdminStudentDetail = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  profilePhotoUrl: string | null;
  approved: boolean;
  lastAttemptScore: number | null;
  progress: StudentProgress;
  stats: AdminStudentStats;
  note: AdminStudentNote | null;
};

export type AdminStudentAttemptItem = AttemptItem;

export type UpdateAdminStudentNoteDto = {
  content: string | null;
};

export type AdminStudentMaterialProgressItem = {
  materialId: string;
  title: string;
  description: string;
  category: MaterialCategory;
  position: number;
  viewed: boolean;
  viewedAt: string | null;
  linksCount: number;
};
