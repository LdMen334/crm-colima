import { apiFetch } from '@/lib/api-client';

/** Años (más reciente primero) con historial pendiente de respaldar y cerrar. */
export async function obtenerAniosPendientes(): Promise<number[]> {
  const { anios } = await apiFetch<{ anios: number[] }>('/admin/anios/pendientes');
  return anios;
}
