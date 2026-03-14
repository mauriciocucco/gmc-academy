import { ApiError } from "../errors";

export function extractArrayResponse<T>(
  value: unknown,
  resourceName: string,
): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (value && typeof value === "object") {
    const maybeWrappedArray = value as {
      data?: unknown;
      items?: unknown;
      results?: unknown;
    };

    if (Array.isArray(maybeWrappedArray.data)) {
      return maybeWrappedArray.data as T[];
    }

    if (Array.isArray(maybeWrappedArray.items)) {
      return maybeWrappedArray.items as T[];
    }

    if (Array.isArray(maybeWrappedArray.results)) {
      return maybeWrappedArray.results as T[];
    }
  }

  throw new ApiError(
    `La respuesta de ${resourceName} llego con un formato no esperado.`,
    "UNKNOWN_ERROR",
  );
}
