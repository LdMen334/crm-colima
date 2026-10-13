import { apiFetch } from '@/lib/api-client';

/**
 * Médicos que firman los reportes oficiales (tomados de los formatos PECO y TX).
 */
export interface MedicoFirmante {
  nombre: string;
  cedula: string;
  universidad: string;
  siglasUniversidad: string;
  direccion?: string;
  especialidad?: string;
}

export const MEDICOS_DICTAMINADORES: readonly MedicoFirmante[] = [
  {
    nombre: 'MANUEL ALEJANDRO CORIA SALAS',
    cedula: '14021036',
    universidad: 'UNIVERSIDAD DE COLIMA',
    siglasUniversidad: 'UDEC',
    direccion: 'ALDAMA 117, COL. CENTRO, COLIMA, COL.',
  },
];

/** Firma la hoja de Exámenes Visuales en ambas plantillas. */
export const OFTALMOLOGO: MedicoFirmante = {
  nombre: 'JOAQUÍN LOZANO GUASCH',
  cedula: '6204130',
  universidad: 'UNIVERSIDAD DE MONTERREY',
  siglasUniversidad: 'UDEM',
  especialidad: 'Médico especialista en oftalmología',
};

interface MedicoSelectorItem {
  id: string;
  nombre_completo: string;
  cedula_profesional: string;
  universidad: string;
}

/**
 * Caché de módulo: se llena de forma asíncrona (GET /users?vista=selector) y
 * se lee de forma síncrona desde `listarMedicos()`/`findMedico()`, para que
 * el formulario y las plantillas PDF no tengan que volverse asíncronos.
 * Se refresca sola al montar `useMedicos()` y cuando cambia la lista de
 * usuarios (alta, edición, baja) en esta pestaña o en otra.
 */
let cache: MedicoFirmante[] = [...MEDICOS_DICTAMINADORES];
/** id del backend ↔ nombre, para traducir medicoDictaminador (nombre) a medico_id y viceversa. */
let idPorNombre = new Map<string, string>();
let nombrePorId = new Map<string, string>();

function fusionar(registrados: MedicoFirmante[]) {
  const vistos = new Set<string>();
  const todos = [...MEDICOS_DICTAMINADORES, ...registrados].filter((m) => {
    const k = m.nombre.toUpperCase();
    if (vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
  cache = todos;
}

/**
 * Trae la lista viva de médicos activos (con cédula y universidad) del
 * backend y actualiza la caché que leen `listarMedicos()`/`findMedico()`.
 * Se puede llamar cuantas veces se quiera; nunca lanza (si falla, se queda
 * con lo que ya había en caché).
 */
export async function refrescarMedicos(): Promise<void> {
  try {
    const { items } = await apiFetch<{ items: MedicoSelectorItem[] }>('/users', {
      query: { vista: 'selector' },
    });
    const registrados = items.map<MedicoFirmante>((u) => ({
      nombre: u.nombre_completo,
      cedula: u.cedula_profesional,
      universidad: u.universidad,
      siglasUniversidad: u.universidad,
    }));
    idPorNombre = new Map(items.map((u) => [u.nombre_completo.toUpperCase(), u.id]));
    nombrePorId = new Map(items.map((u) => [u.id, u.nombre_completo]));
    fusionar(registrados);
  } catch {
    /* sin conexión o sin sesión: se conserva la caché anterior */
  }
}

/** Médicos que pueden atender: los firmantes oficiales más los que trajo el backend. */
export function listarMedicos(): MedicoFirmante[] {
  return cache;
}

/** Texto visible en la lista de "Médico que atiende". */
export const etiquetaMedico = (m: MedicoFirmante) => `${m.nombre} - Cédula: ${m.cedula} (${m.universidad})`;

/** Datos completos (cédula, universidad) del médico guardado en el expediente, para firmar el PDF. */
export const findMedico = (nombre: string | undefined) =>
  listarMedicos().find((m) => m.nombre.toUpperCase() === (nombre ?? '').trim().toUpperCase());

/** Id de usuario (medico_id) para el nombre capturado, si el backend lo conoce. */
export const medicoIdPorNombre = (nombre: string | undefined): string | undefined =>
  idPorNombre.get((nombre ?? '').trim().toUpperCase());

/** Nombre del médico para un medico_id devuelto por el backend. */
export const nombrePorMedicoId = (id: string | undefined | null): string =>
  (id && nombrePorId.get(id)) || '';
