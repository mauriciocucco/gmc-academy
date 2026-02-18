import { apiGet } from "./client";
import type { AttemptItem } from "./types";

export function getMyAttempts(): Promise<AttemptItem[]> {
  return apiGet<AttemptItem[]>("/attempts/me");
}
