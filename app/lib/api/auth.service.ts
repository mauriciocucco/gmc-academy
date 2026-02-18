import { apiGet, apiPatch, apiPostMultipart, publicPost } from "./client";
import type {
  AuthSession,
  StudentProgress,
  UpdateMeDto,
  UserProfile,
} from "./types";

let myProgressInFlight: Promise<StudentProgress> | null = null;

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
  if (myProgressInFlight) {
    return myProgressInFlight;
  }

  myProgressInFlight = apiGet<StudentProgress>("/me/progress").finally(() => {
    myProgressInFlight = null;
  });

  return myProgressInFlight;
}

export function updateMe(dto: UpdateMeDto): Promise<UserProfile> {
  return apiPatch<UserProfile>("/me", dto);
}

export function uploadProfilePhoto(file: File): Promise<UserProfile> {
  const form = new FormData();
  form.append("file", file);
  return apiPostMultipart<UserProfile>("/me/profile-photo", form);
}
