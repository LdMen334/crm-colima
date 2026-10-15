import type { ExpedienteResumen } from '@/features/historia-clinica/api';

/**
 * "Dictamen Final / Aptitud" del Reporte SABI: no existe ningún derivado de
 * esto en el resto del código (gradiente/no_apto solo se usan por separado).
 */
export function dictamenDe(e: Pick<ExpedienteResumen, 'noApto' | 'gradiente'>): string {
  if (e.noApto) return 'NO APTO';
  if (e.gradiente) return `APTO (Gradiente ${e.gradiente})`;
  return '—';
}

/** CURP si existe; si no, NSS. */
export function curpONss(e: Pick<ExpedienteResumen, 'curp' | 'nss'>): string {
  return e.curp || e.nss || '—';
}
