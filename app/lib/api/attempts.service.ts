import { apiGet } from "./client";
import type { AttemptDetail, AttemptItem } from "./types";

export function getMyAttempts(): Promise<AttemptItem[]> {
  return apiGet<AttemptItem[]>("/attempts/me");
}

export function getMyAttemptDetail(attemptId: string): Promise<AttemptDetail> {
  return apiGet<AttemptDetail>(`/attempts/me/${attemptId}`);
}
