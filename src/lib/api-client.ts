/**
 * Cliente HTTP hacia la API real (CR_Backend). Adjunta el token Bearer de la
 * sesión y convierte el formato de error único del backend
 * ({ error: { code, message, fields } }) en un Error normal, para que el
 * código existente que hace `catch (err) { err.message }` siga funcionando
 * igual que con el mock.
 */

const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1').replace(/\/+$/, '');
const TOKEN_KEY = 'crm-hc-token';

export function getToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* almacenamiento no disponible: la sesión solo dura en memoria */
  }
}

interface ApiErrorBody {
  error?: { code?: string; message?: string; fields?: Record<string, string> };
}

/** Error con el código del backend disponible, para los pocos lugares que lo necesiten. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly fields?: Record<string, string>,
    public readonly status?: number,
  ) {
    super(message);
  }
}

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
}

function buildUrl(path: string, query?: ApiOptions['query']): string {
  const url = new URL(BASE_URL + path);
  for (const [k, v] of Object.entries(query ?? {})) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  return url.toString();
}

/**
 * Hace una petición a la API y devuelve el cuerpo JSON ya tipado. Si la
 * respuesta no fue exitosa, lanza un `ApiError` con el mensaje exacto que
 * mandó el backend (los mismos textos que ya mostraba el mock).
 */
export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, query } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  const data = (await res.json().catch(() => ({}))) as ApiErrorBody & T;

  if (!res.ok) {
    const err = (data as ApiErrorBody).error;
    throw new ApiError(err?.message ?? 'Ocurrió un error inesperado.', err?.code, err?.fields, res.status);
  }

  return data as T;
}
