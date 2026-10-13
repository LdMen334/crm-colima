import { apiFetch, ApiError } from '@/lib/api-client';
import { toCamel } from '@/features/historia-clinica/lib/db-mapping';
import type { HistoriaClinicaValues } from '@/features/historia-clinica/config/fields';

/** Datos fijos del paciente que se precargan en una nueva visita. */
export const CAMPOS_FIJOS = [
  'nombreCompleto',
  'fechaNacimiento',
  'genero',
  'curp',
  'nss',
  'domicilioCalle',
  'domicilioColonia',
  'domicilioMunicipio',
  'domicilioEstado',
  'telefono',
  'empresa',
  'puesto',
] as const satisfies readonly (keyof HistoriaClinicaValues)[];

export type PacienteDemografico = Pick<HistoriaClinicaValues, (typeof CAMPOS_FIJOS)[number]> & {
  id: string;
  /** Folio de la visita más reciente de la que se tomaron los datos. */
  ultimoFolio: string;
};

/** Resultado ligero del buscador del encabezado: no trae domicilio/empresa/puesto. */
export interface PacienteBusqueda {
  id: string;
  nombreCompleto: string;
  curp: string;
  nss: string;
}

interface LookupRespuesta {
  paciente_id: string;
  ultimo_folio: number | null;
  ultimo_anio: number | null;
  datos: Record<string, unknown>;
}

const camposFijosDesde = (id: string, ultimoFolio: string, datos: Record<string, unknown>): PacienteDemografico => {
  const out: Record<string, string> = {};
  for (const campo of CAMPOS_FIJOS) out[campo] = '';
  for (const [k, v] of Object.entries(datos)) out[toCamel(k)] = v === null || v === undefined ? '' : String(v);
  return { id, ultimoFolio, ...out } as PacienteDemografico;
};

/** CURP comparable: mayúsculas, solo letras (incluye Ñ) y dígitos. */
export const claveCurp = (v: string | undefined) => (v ?? '').toUpperCase().replace(/[^A-Z0-9Ñ]/g, '');
/** NSS comparable: solo dígitos (tolera espacios y guiones: 1234-56-7890-1). */
export const claveNss = (v: string | undefined) => (v ?? '').replace(/\D/g, '');

/**
 * Coincidencia EXACTA por CURP (18 caracteres) o NSS (11 dígitos) completos, para el
 * precargado automático de pacientes recurrentes. `excluirClave` ("{año}-{folio}")
 * evita que un expediente se encuentre a sí mismo.
 */
export async function buscarPorIdentificador(
  { curp, nss }: { curp?: string; nss?: string },
  excluirClave?: string,
): Promise<PacienteDemografico | null> {
  const c = claveCurp(curp);
  const n = claveNss(nss);
  if (c.length !== 18 && n.length !== 11) return null;
  try {
    const r = await apiFetch<LookupRespuesta>('/pacientes/lookup', {
      query: { curp: c.length === 18 ? c : undefined, nss: n.length === 11 ? n : undefined, excluir_clave: excluirClave },
    });
    return camposFijosDesde(r.paciente_id, r.ultimo_folio ? String(r.ultimo_folio) : '', r.datos);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

/** Busca por CURP, NSS (prefijo) o nombre completo (contiene, sin acentos). */
export async function searchPacientes(query: string): Promise<PacienteBusqueda[]> {
  if (query.trim().length < 2) return [];
  const { items } = await apiFetch<{
    items: { id: string; nombre_completo: string; curp: string | null; nss: string | null }[];
  }>('/pacientes/buscar', { query: { q: query } });
  return items.map((i) => ({ id: i.id, nombreCompleto: i.nombre_completo, curp: i.curp ?? '', nss: i.nss ?? '' }));
}
