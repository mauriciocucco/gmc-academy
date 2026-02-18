export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number | null;

  constructor(
    message: string,
    code: ApiErrorCode,
    status: number | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

/**
 * Translates common NestJS class-validator / backend messages to Spanish.
 * Patterns are matched case-insensitively against the original message.
 */
const EN_TO_ES: [RegExp, string][] = [
  [
    /password must be longer than or equal to (\d+) characters/i,
    "La contraseña debe tener al menos $1 caracteres.",
  ],
  [
    /password must be shorter than or equal to (\d+) characters/i,
    "La contraseña debe tener como maximo $1 caracteres.",
  ],
  [/password must be a string/i, "La contraseña debe ser un texto."],
  [/password should not be empty/i, "La contraseña es obligatoria."],
  [/email must be an email/i, "El email no tiene un formato valido."],
  [/email should not be empty/i, "El email es obligatorio."],
  [/invalid credentials/i, "Credenciales incorrectas."],
  [/unauthorized/i, "No autorizado. Verifica tus credenciales."],
  [/forbidden/i, "No tienes permiso para realizar esta accion."],
  [/not found/i, "El recurso solicitado no existe."],
  [
    /must be longer than or equal to (\d+) characters/i,
    "El campo debe tener al menos $1 caracteres.",
  ],
  [
    /must be shorter than or equal to (\d+) characters/i,
    "El campo debe tener como maximo $1 caracteres.",
  ],
  [/should not be empty/i, "Este campo es obligatorio."],
  [/must be a string/i, "El valor debe ser texto."],
  [/must be a number/i, "El valor debe ser un numero."],
  [/must be a boolean/i, "El valor debe ser verdadero o falso."],
  [/must be an email/i, "El formato de email no es valido."],
  [/must be a valid url/i, "La URL no es valida."],
];

function translateMessage(message: string): string {
  for (const [pattern, translation] of EN_TO_ES) {
    if (pattern.test(message)) {
      return message.replace(pattern, translation);
    }
  }
  return message;
}

export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return new ApiError(
      translateMessage(error.message),
      error.code,
      error.status,
    );
  }

  if (error instanceof TypeError) {
    return new ApiError("Error de red. Verifica tu conexion.", "NETWORK_ERROR");
  }

  return new ApiError("Ha ocurrido un error inesperado.", "UNKNOWN_ERROR");
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}
