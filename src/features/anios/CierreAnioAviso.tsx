'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, DatabaseBackup, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { btnPrimary, btnSecondary } from '@/components/ui/styles';
import { cerrarAnio } from '@/features/historia-clinica/api';
import { obtenerAniosPendientes } from './api';

type Paso = 'oculto' | 'aviso' | 'confirmar' | 'cerrando' | 'listo';

/**
 * Avisa al admin cuando queda historial de un año anterior sin respaldar: el
 * cliente borra el historial completo de un año en cuanto lo descarga (no se
 * archiva, por costo de almacenamiento). Se monta una sola vez en el layout
 * de /admin.
 */
export function CierreAnioAviso() {
  const [pendientes, setPendientes] = useState<number[] | null>(null);
  const [paso, setPaso] = useState<Paso>('oculto');
  const [error, setError] = useState<string | null>(null);
  const [totalBorrado, setTotalBorrado] = useState<number | null>(null);

  useEffect(() => {
    obtenerAniosPendientes()
      .then((anios) => {
        setPendientes(anios);
        if (anios.length > 0) setPaso('aviso');
      })
      .catch(() => {});
  }, []);

  const anio = pendientes?.[0];

  async function confirmarCierre() {
    if (!anio) return;
    setPaso('cerrando');
    setError(null);
    try {
      const { totalBorrado: total, items } = await cerrarAnio(anio);
      const { descargarExcel } = await import('@/features/reportes-excel/export');
      await descargarExcel(items, `historias-clinicas_${anio}.xlsx`, `Historias clínicas · Respaldo ${anio}`);
      setTotalBorrado(total);
      setPendientes((lista) => (lista ?? []).slice(1));
      setPaso('listo');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cerrar el año. Intenta de nuevo.');
      setPaso('confirmar');
    }
  }

  if (paso === 'oculto' || !anio) return null;

  if (paso === 'listo') {
    return (
      <Modal
        title="Respaldo completado"
        onClose={() => setPaso((pendientes?.length ?? 0) > 0 ? 'aviso' : 'oculto')}
        footer={
          <button
            type="button"
            onClick={() => setPaso((pendientes?.length ?? 0) > 0 ? 'aviso' : 'oculto')}
            className={btnPrimary}
          >
            Entendido
          </button>
        }
      >
        <p className="text-sm text-ink-muted">
          Se descargó el Excel de {anio} y se eliminaron {totalBorrado} expedientes de la base de datos.
        </p>
      </Modal>
    );
  }

  if (paso === 'confirmar' || paso === 'cerrando') {
    return (
      <Modal
        title={`¿Eliminar el historial de ${anio}?`}
        onClose={() => paso === 'confirmar' && setPaso('aviso')}
        footer={
          <>
            <button type="button" onClick={() => setPaso('aviso')} disabled={paso === 'cerrando'} className={btnSecondary}>
              Cancelar
            </button>
            <button type="button" onClick={confirmarCierre} disabled={paso === 'cerrando'} className={btnPrimary}>
              {paso === 'cerrando' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirmar y descargar
            </button>
          </>
        }
      >
        <div className="flex gap-3 rounded-xl border border-crm-red/15 bg-crm-red-soft px-3 py-2.5 text-sm text-crm-red-dark">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p>
            Al confirmar, los registros de pacientes de <strong>{anio}</strong> se eliminarán de la base de datos y ya
            no habrá manera de recuperarlos.
          </p>
        </div>
        {error && <p role="alert" className="mt-3 text-sm text-crm-red-dark">{error}</p>}
      </Modal>
    );
  }

  return (
    <Modal
      title={`Historial de ${anio} pendiente de respaldo`}
      onClose={() => setPaso('oculto')}
      footer={
        <button type="button" onClick={() => setPaso('confirmar')} className={btnPrimary}>
          <DatabaseBackup className="h-4 w-4" /> Respaldar y cerrar {anio}
        </button>
      }
    >
      <p className="text-sm text-ink-muted">
        Antes de iniciar el nuevo ciclo hay que descargar el Excel completo de {anio}.
      </p>
    </Modal>
  );
}
