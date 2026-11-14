import { apiFetch } from '@/lib/api-client';

/** Último respaldo confirmado de un año (Excel ya generado). */
export interface RespaldoAnio {
  /** ISO 8601 */
  fecha: string;
  usuarioNombre: string;
  total: number;
  /** false si alguien cambió el año después del respaldo: hay que respaldar otra vez antes de borrar. */
  vigente: boolean;
}

/** Año anterior al actual que todavía tiene historial en la base. */
export interface AnioPendiente {
  anio: number;
  total: number;
  respaldo: RespaldoAnio | null;
}

interface AnioBackend {
  anio: number;
  total: number;
  respaldo: { fecha: string; usuario_nombre: string; total: number; vigente: boolean } | null;
}

/** Años (más reciente primero) con historial pendiente de respaldar y cerrar. */
export async function obtenerAniosPendientes(): Promise<AnioPendiente[]> {
  const { anios } = await apiFetch<{ anios: AnioBackend[] }>('/admin/anios/pendientes');
  return anios.map((a) => ({
    anio: a.anio,
    total: a.total,
    respaldo: a.respaldo && {
      fecha: a.respaldo.fecha,
      usuarioNombre: a.respaldo.usuario_nombre,
      total: a.respaldo.total,
      vigente: a.respaldo.vigente,
    },
  }));
}

/**
 * Avisa que el respaldo llegó completo y el Excel ya se generó. El servidor lo
 * guarda solo si la huella coincide con el historial actual (409 si el año
 * cambió durante la descarga); sin un respaldo así no deja borrar el año.
 *
 * @param anio año respaldado
 * @param total expedientes recibidos en el respaldo
 * @param huella huella recibida al final del respaldo
 */
export async function confirmarRespaldoAnio(anio: number, total: number, huella: string): Promise<void> {
  await apiFetch(`/admin/anios/${anio}/respaldo`, { method: 'POST', body: { total, huella } });
}

/**
 * Borra para siempre un año ya respaldado. Exige escribir "CERRAR {anio}" y un
 * respaldo vigente (409 si no hay respaldo o el año cambió después de él).
 *
 * @param anio año a cerrar
 * @param confirmacion texto escrito por el admin
 */
export async function cerrarAnio(
  anio: number,
  confirmacion: string,
): Promise<{ totalBorrado: number; pacientesBorrados: number }> {
  const data = await apiFetch<{ anio: number; total_borrado: number; pacientes_borrados: number }>(
    `/admin/anios/${anio}/cerrar`,
    { method: 'POST', body: { confirmacion } },
  );
  return { totalBorrado: data.total_borrado, pacientesBorrados: data.pacientes_borrados };
}
