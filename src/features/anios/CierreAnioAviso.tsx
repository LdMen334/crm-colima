'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { obtenerAniosPendientes } from './api';

/**
 * Franja en el panel de Administración mientras haya historial de años anteriores
 * sin cerrar. Antes era un modal que interrumpía; ahora solo lleva a la pantalla
 * de cierre de año (decisión del dueño 2026-11-14). No se muestra en esa pantalla,
 * que ya tiene su propio aviso.
 */
export function CierreAnioAviso() {
  const pathname = usePathname();
  const [anios, setAnios] = useState<number[]>([]);

  useEffect(() => {
    obtenerAniosPendientes()
      .then((lista) => setAnios(lista.map((a) => a.anio)))
      .catch(() => {});
  }, []);

  if (anios.length === 0 || pathname.startsWith('/admin/cierre-anio')) return null;

  return (
    <Link
      href="/admin/cierre-anio"
      className="mb-6 flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200 transition-colors hover:bg-amber-100"
    >
      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
      <span className="flex-1">
        <strong>Historial pendiente de respaldar:</strong> {anios.join(', ')}.
      </span>
      <span className="inline-flex items-center gap-1 font-semibold">
        Ir a Cierre de año <ArrowRight className="h-4 w-4" aria-hidden />
      </span>
    </Link>
  );
}
