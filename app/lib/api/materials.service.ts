import { apiDelete, apiGet, apiPatch, apiPost } from "./client";
import type {
  CreateMaterialDto,
  MaterialCategory,
  MaterialResponse,
  UpdateMaterialDto,
} from "./types";

export function getMaterials(): Promise<MaterialResponse[]> {
  return apiGet<MaterialResponse[]>("/materials");
}

export function getMaterialCategories(): Promise<MaterialCategory[]> {
  return apiGet<MaterialCategory[]>("/materials/categories");
}

export function createMaterial(
  dto: CreateMaterialDto,
): Promise<MaterialResponse> {
  return apiPost<MaterialResponse>("/materials", dto);
}

export function updateMaterial(
  id: string,
  dto: UpdateMaterialDto,
): Promise<MaterialResponse> {
  return apiPatch<MaterialResponse>(`/materials/${id}`, dto);
}

export function deleteMaterial(id: string): Promise<void> {
  return apiDelete<void>(`/materials/${id}`);
}

export function setMaterialViewed(id: string, viewed: boolean): Promise<void> {
  return apiPatch<void>(`/materials/${id}/view`, { viewed }, true);
}

export function unmarkMaterialViewed(
  materialId: string,
  studentId: string,
): Promise<void> {
  return apiDelete<void>(`/materials/${materialId}/view/${studentId}`);
}

export function updateMaterialAccess(
  materialId: string,
  studentId: string,
  hasAccess: boolean,
): Promise<void> {
  return apiPatch<void>(`/materials/${materialId}/access/${studentId}`, {
    hasAccess,
  });
}
