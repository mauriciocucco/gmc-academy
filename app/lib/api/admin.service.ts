import { apiGet } from "./client";
import type {
  AdminPerformanceItem,
  AdminStats,
  AdminStudentItem,
} from "./types";

export function getAdminStats(): Promise<AdminStats> {
  return apiGet<AdminStats>("/admin/stats");
}

export function getAdminStudents(): Promise<AdminStudentItem[]> {
  return apiGet<AdminStudentItem[]>("/admin/students");
}

export function getAdminPerformance(): Promise<AdminPerformanceItem[]> {
  return apiGet<AdminPerformanceItem[]>("/admin/performance");
}
