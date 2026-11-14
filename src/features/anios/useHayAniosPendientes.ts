'use client';

import { useEffect, useState } from 'react';
import { obtenerAniosPendientes } from './api';

/** Evento que avisa que cambió la lista de años pendientes (p. ej. tras borrar un año). */
export const EVENTO_ANIOS_PENDIENTES = 'crm:anios-pendientes';

/**
 * ¿Hay historial de algún año anterior al actual? Solo entonces existe algo que
 * cerrar: mientras se siga en 2026 sin registros de 2025, la opción «Cierre de
 * año» no aparece (decisión del dueño 2026-11-14). Se vuelve a consultar cuando
 * la pantalla de cierre avisa que borró un año.
 *
 * @param activo false si el usuario no puede cerrar años (no consulta)
 */
export function useHayAniosPendientes(activo: boolean): boolean {
  const [hay, setHay] = useState(false);

  useEffect(() => {
    if (!activo) return;
    const consultar = () =>
      obtenerAniosPendientes()
        .then((anios) => setHay(anios.length > 0))
        .catch(() => {});
    consultar();
    window.addEventListener(EVENTO_ANIOS_PENDIENTES, consultar);
    return () => window.removeEventListener(EVENTO_ANIOS_PENDIENTES, consultar);
  }, [activo]);

  return activo && hay;
}
