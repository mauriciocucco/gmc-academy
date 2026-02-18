import { apiGet, publicPost } from "./client";
import type { AuthSession, StudentProgress, UserProfile } from "./types";

export type LoginDto = {
  email: string;
  password: string;
};

export function login(dto: LoginDto): Promise<AuthSession> {
  return publicPost<AuthSession>("/auth/login", dto);
}

export function logout(): Promise<void> {
  return apiGet<void>("/auth/logout");
}

export function getMe(): Promise<UserProfile> {
  return apiGet<UserProfile>("/me");
}

export function getMyProgress(): Promise<StudentProgress> {
  return apiGet<StudentProgress>("/me/progress");
}
