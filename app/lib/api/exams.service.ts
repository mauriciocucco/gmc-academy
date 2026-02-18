import { apiGet, apiPost } from "./client";
import type {
  ActiveExamResponse,
  SubmitExamDto,
  SubmitExamResponse,
} from "./types";

export function getActiveExam(): Promise<ActiveExamResponse> {
  return apiGet<ActiveExamResponse>("/exams/active");
}

export function submitExam(
  examId: string,
  dto: SubmitExamDto,
): Promise<SubmitExamResponse> {
  return apiPost<SubmitExamResponse>(`/exams/${examId}/submit`, dto);
}
