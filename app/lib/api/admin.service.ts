import { apiGet, apiPatch, apiPost } from "./client";
import { extractArrayResponse } from "./utils/extract-array-response";
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

export async function getAdminStudents(): Promise<AdminStudentItem[]> {
  const response = await apiGet<unknown>("/admin/students");
  return extractArrayResponse<AdminStudentItem>(response, "la lista de alumnos");
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

export async function getAdminStudentAttempts(
  studentId: string,
): Promise<AdminStudentAttemptItem[]> {
  const response = await apiGet<unknown>(`/admin/students/${studentId}/attempts`);
  return extractArrayResponse<AdminStudentAttemptItem>(
    response,
    "el historial de intentos",
  );
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

export async function getAdminPerformance(): Promise<AdminPerformanceItem[]> {
  const response = await apiGet<unknown>("/admin/performance");
  return extractArrayResponse<AdminPerformanceItem>(
    response,
    "la serie de performance",
  );
}

export function getAdminExamConfig(): Promise<AdminExamConfig> {
  return apiGet<AdminExamConfig>("/admin/exam");
}

export function updateAdminExam(
  dto: UpdateAdminExamDto,
): Promise<AdminExamConfig> {
  return apiPatch<AdminExamConfig>("/admin/exam", dto);
}

export async function getAdminStudentMaterialAssignments(
  studentId: string,
): Promise<AdminStudentMaterialAssignment[]> {
  const response = await apiGet<unknown>(
    `/admin/students/${studentId}/material-assignments`,
  );
  return extractArrayResponse<AdminStudentMaterialAssignment>(
    response,
    "las asignaciones de materiales",
  );
}

export async function updateAdminStudentMaterialAssignments(
  studentId: string,
  dto: UpdateAdminStudentMaterialAssignmentsDto,
): Promise<AdminStudentMaterialAssignment[]> {
  const response = await apiPatch<unknown>(
    `/admin/students/${studentId}/material-assignments`,
    dto,
  );
  return extractArrayResponse<AdminStudentMaterialAssignment>(
    response,
    "las asignaciones de materiales",
  );
}

export async function getAdminStudentMaterialsProgress(
  studentId: string,
): Promise<AdminStudentMaterialProgressItem[]> {
  const response = await apiGet<unknown>(
    `/admin/students/${studentId}/materials-progress`,
  );
  return extractArrayResponse<AdminStudentMaterialProgressItem>(
    response,
    "el progreso de materiales",
  );
}
