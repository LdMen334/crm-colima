import { EMPTY_VALUES, type HistoriaClinicaValues } from '../config/fields';

const toSnake = (k: string) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
/** camelCase ↔ snake_case en ambos sentidos; se reutiliza para los campos fijos del paciente. */
export const toCamel = (k: string) => k.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());

/**
 * Convierte los valores del formulario (camelCase) a las columnas de la base
 * de datos (snake_case). Ej.: tipoExamenMotivo → tipo_examen_motivo,
 * tipoExamenCategoria → tipo_examen_categoria, aud150Od → aud150_od.
 * Los vacíos se envían como null.
 */
export function toDbPayload(values: HistoriaClinicaValues): Record<string, string | null> {
  return Object.fromEntries(
    Object.entries(values).map(([k, v]) => [toSnake(k), v?.trim() ? v.trim() : null]),
  );
}

/**
 * Inverso de `toDbPayload`: convierte la respuesta del backend (columnas
 * snake_case, con números y nulos) a `HistoriaClinicaValues` (todo string,
 * camelCase), que es lo único que conocen el formulario y las plantillas.
 * Las claves que el backend no conoce (campos retirados, por ejemplo)
 * conservan su valor vacío por defecto.
 */
export function fromDbPayload(data: Record<string, unknown>): HistoriaClinicaValues {
  const out: Record<string, string> = { ...EMPTY_VALUES };
  for (const [k, v] of Object.entries(data)) {
    out[toCamel(k)] = v === null || v === undefined ? '' : String(v);
  }
  return out as HistoriaClinicaValues;
}
