import { apiGet, apiPatch, apiPost } from "./client";
import type {
  AdminExamConfig,
  AdminStudentMaterialAssignment,
  AdminStudentMaterialProgressItem,
  AdminStudentNote,
  AdminPerformanceItem,
  AdminStats,
  AdminStudentAttemptItem,
  AdminStudentDetail,
  AdminStudentItem,
  CreateAdminStudentDto,
  CreatedAdminStudent,
  UpdateAdminStudentNoteDto,
  UpdateAdminStudentMaterialAssignmentsDto,
  UpdateAdminExamDto,
  AttemptDetail,
} from "./types";

export function getAdminStats(): Promise<AdminStats> {
  return apiGet<AdminStats>("/admin/stats");
}

export function getAdminStudents(): Promise<AdminStudentItem[]> {
  return apiGet<AdminStudentItem[]>("/admin/students");
}

export function createAdminStudent(
  dto: CreateAdminStudentDto,
): Promise<CreatedAdminStudent> {
  return apiPost<CreatedAdminStudent>("/admin/students", dto);
}

export function getAdminStudentDetail(
  studentId: string,
): Promise<AdminStudentDetail> {
  return apiGet<AdminStudentDetail>(`/admin/students/${studentId}`);
}

export function getAdminStudentAttempts(
  studentId: string,
): Promise<AdminStudentAttemptItem[]> {
  return apiGet<AdminStudentAttemptItem[]>(`/admin/students/${studentId}/attempts`);
}

export function getAdminStudentAttemptDetail(
  studentId: string,
  attemptId: string,
): Promise<AttemptDetail> {
  return apiGet<AttemptDetail>(`/admin/students/${studentId}/attempts/${attemptId}`);
}

export function updateAdminStudentNote(
  studentId: string,
  dto: UpdateAdminStudentNoteDto,
): Promise<AdminStudentNote> {
  return apiPatch<AdminStudentNote>(`/admin/students/${studentId}/note`, dto);
}

export function getAdminPerformance(): Promise<AdminPerformanceItem[]> {
  return apiGet<AdminPerformanceItem[]>("/admin/performance");
}

export function getAdminExamConfig(): Promise<AdminExamConfig> {
  return apiGet<AdminExamConfig>("/admin/exam");
}

export function updateAdminExam(
  dto: UpdateAdminExamDto,
): Promise<AdminExamConfig> {
  return apiPatch<AdminExamConfig>("/admin/exam", dto);
}

export function getAdminStudentMaterialAssignments(
  studentId: string,
): Promise<AdminStudentMaterialAssignment[]> {
  return apiGet<AdminStudentMaterialAssignment[]>(
    `/admin/students/${studentId}/material-assignments`,
  );
}

export function updateAdminStudentMaterialAssignments(
  studentId: string,
  dto: UpdateAdminStudentMaterialAssignmentsDto,
): Promise<AdminStudentMaterialAssignment[]> {
  return apiPatch<AdminStudentMaterialAssignment[]>(
    `/admin/students/${studentId}/material-assignments`,
    dto,
  );
}

export function getAdminStudentMaterialsProgress(
  studentId: string,
): Promise<AdminStudentMaterialProgressItem[]> {
  return apiGet<AdminStudentMaterialProgressItem[]>(
    `/admin/students/${studentId}/materials-progress`,
  );
}
