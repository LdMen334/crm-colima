import { parseFecha } from './calculations';
import type { FieldDef } from '../config/fields';

/** AAAA-MM-DD → DD-MM-AAAA (pantalla) o DD/MM/AAAA (formatos impresos). */
export function formatFechaMx(value: string, sep: '-' | '/' = '-'): string {
  const d = parseFecha(value);
  if (!d) return value;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}${sep}${mm}${sep}${d.getFullYear()}`;
}

/** Valor listo para imprimir: fechas formateadas y unidad añadida. */
export function formatValue(field: FieldDef, raw: string | undefined): string {
  const v = (raw ?? '').trim();
  if (!v) return '';
  if (field.type === 'date') return formatFechaMx(v);
  if (field.unit && field.key !== 'edad' && !field.key.startsWith('aud')) return `${v} ${field.unit}`;
  if (field.key === 'edad') return `${v} años`;
  return v;
}

/** Normaliza texto para búsquedas sin acentos ni mayúsculas. */
export const normalize = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

/**
 * Valor tal como se imprime en los formatos oficiales PECO / TX:
 * fechas DD/MM/AAAA, sin unidades (las lleva la etiqueta) y "---" cuando está vacío.
 */
export function pdfValue(field: FieldDef | undefined, raw: string | undefined): string {
  const v = (raw ?? '').trim();
  if (!v) return '---';
  if (field?.type === 'date') return formatFechaMx(v, '/');
  return v;
}
