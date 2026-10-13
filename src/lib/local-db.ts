/**
 * Persistencia MOCK en localStorage para desarrollo (usuarios, expedientes, bitácora).
 *
 * ⚠️ Solo vive en el navegador de quien lo usa: no se comparte entre equipos ni
 * es segura. En producción cada módulo `api.ts` debe llamar al backend; las
 * firmas de esas funciones ya son asíncronas para que el cambio sea directo.
 */

const PREFIX = 'crm-hc:';

export function readTable<T>(table: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + table);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeTable<T>(table: string, value: T): void {
  try {
    localStorage.setItem(PREFIX + table, JSON.stringify(value));
  } catch {
    /* almacenamiento lleno o bloqueado: el cambio queda solo en memoria */
  }
}

/** Latencia simulada para que la UI muestre estados de carga realistas. */
export const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

export const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

/** Fecha local AAAA-MM-DD (no UTC: evita que después de las 18 h se marque el día siguiente). */
export function todayIso(d = new Date()): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}
