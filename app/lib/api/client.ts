import { ApiError } from "./errors";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api/v1";

const ACCESS_TOKEN_KEY = "gmc-academy.access-token.v1";
const REFRESH_TOKEN_KEY = "gmc-academy.refresh-token.v1";

// ─── Token helpers ────────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// ─── Internal fetch ───────────────────────────────────────────────────────────

let isRefreshing = false;
let refreshQueue: Array<(token: string | null) => void> = [];

async function tryRefresh(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    clearTokens();
    return null;
  }

  const data = (await response.json()) as {
    accessToken: string;
    refreshToken: string;
  };
  setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

async function fetchWithAuth(
  path: string,
  options: RequestInit = {},
  isRetry = false,
  skipRedirectOn401 = false,
): Promise<Response> {
  const accessToken = getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (response.status === 401 && !isRetry) {
    if (isRefreshing) {
      return new Promise((resolve) => {
        refreshQueue.push(async (newToken) => {
          if (!newToken) {
            resolve(response);
            return;
          }
          resolve(fetchWithAuth(path, options, true, skipRedirectOn401));
        });
      });
    }

    isRefreshing = true;
    const newToken = await tryRefresh();
    isRefreshing = false;

    if (newToken) {
      refreshQueue.forEach((cb) => cb(newToken));
      refreshQueue = [];
      return fetchWithAuth(path, options, true, skipRedirectOn401);
    }

    refreshQueue.forEach((cb) => cb(null));
    refreshQueue = [];

    if (!skipRedirectOn401) {
      window.location.href = "/login";
    }
    return response;
  }

  return response;
}

// ─── Public API client ────────────────────────────────────────────────────────

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export async function apiRequest<T>(
  method: HttpMethod,
  path: string,
  body?: unknown,
  skipRedirectOn401 = false,
): Promise<T> {
  const options: RequestInit = { method };

  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetchWithAuth(path, options, false, skipRedirectOn401);

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    const message =
      (errorData as { message?: string }).message ?? "Error en la solicitud.";

    const code =
      response.status === 401
        ? "UNAUTHORIZED"
        : response.status === 403
          ? "FORBIDDEN"
          : response.status === 404
            ? "NOT_FOUND"
            : response.status === 422
              ? "VALIDATION_ERROR"
              : "UNKNOWN_ERROR";

    throw new ApiError(message, code, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>("GET", path);
}

/** Multipart POST — does NOT set Content-Type (browser adds boundary automatically) */
export async function apiPostMultipart<T>(
  path: string,
  body: FormData,
): Promise<T> {
  const accessToken = getAccessToken();
  const headers: Record<string, string> = {};
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    const message =
      (errorData as { message?: string }).message ?? "Error en la solicitud.";
    throw new ApiError(message, "UNKNOWN_ERROR", response.status);
  }

  return response.json() as Promise<T>;
}

export async function apiPost<T>(
  path: string,
  body?: unknown,
  skipRedirectOn401 = false,
): Promise<T> {
  return apiRequest<T>("POST", path, body, skipRedirectOn401);
}

export async function apiPatch<T>(
  path: string,
  body?: unknown,
  skipRedirectOn401 = false,
): Promise<T> {
  return apiRequest<T>("PATCH", path, body, skipRedirectOn401);
}

export async function apiDelete<T = void>(path: string): Promise<T> {
  return apiRequest<T>("DELETE", path);
}

/** Public fetch without auth (for login) */
export async function publicPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    const message =
      (errorData as { message?: string }).message ?? "Error en la solicitud.";
    const code = response.status === 401 ? "UNAUTHORIZED" : "UNKNOWN_ERROR";
    throw new ApiError(message, code, response.status);
  }

  return response.json() as Promise<T>;
}
