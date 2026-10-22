'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { PDFViewer } from '@react-pdf/renderer';
import { Download, Loader2, X } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { can } from '@/features/auth/permissions';
import type { ExpedienteResumen } from '@/features/historia-clinica/api';
import VisorPdfSinDescarga from '@/features/reportes-pdf/VisorPdfSinDescarga';
import { ReporteSabiPdfDocument, type ModoReporte } from './ReporteSabiPdfDocument';

/**
 * Vista previa del Reporte SABI: disponible para cualquier rol que llegue a
 * esta pantalla. La descarga (botón dentro del modal) solo aparece si el rol
 * tiene el permiso `reportes-sabi:pdf-download` (hoy, solo Leo/Administrador)
 * — un médico de Servicios Médicos puede previsualizar pero no descargar, y
 * para él el PDF se muestra como imágenes (VisorPdfSinDescarga), sin el
 * visor del navegador que también ofrecería descargarlo.
 */
export default function ReporteSabiPdfModal({
  items,
  modo,
  titulo,
  nombreArchivo,
  onClose,
}: {
  items: ExpedienteResumen[];
  modo: ModoReporte;
  titulo: string;
  nombreArchivo: string;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const puedeDescargar = can(user?.role, 'reportes-sabi:pdf-download');

  const documento = useMemo(
    () => <ReporteSabiPdfDocument items={items} modo={modo} titulo={titulo} />,
    [items, modo, titulo],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function descargar() {
    setDownloading(true);
    try {
      const { descargarPdfSabi } = await import('./exportPdf');
      await descargarPdfSabi(items, modo, titulo, nombreArchivo);
    } finally {
      setDownloading(false);
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Vista previa del Reporte SABI"
    >
      <div className="flex h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3">
          <div>
            <p className="text-sm font-semibold text-ink">Vista previa — Reporte SABI</p>
            <p className="text-xs text-ink-muted">
              {items.length} {items.length === 1 ? 'registro' : 'registros'}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {puedeDescargar && (
              <button
                type="button"
                disabled={downloading}
                onClick={descargar}
                className="flex h-9 items-center gap-2 rounded-lg bg-crm-red px-3.5 text-sm font-semibold text-white hover:bg-crm-red-dark active:scale-[0.97] disabled:opacity-70"
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Descargar
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="grid h-9 w-9 place-items-center rounded-lg text-ink-muted hover:bg-canvas"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>
        <div className="relative min-h-0 flex-1 bg-canvas">
          {puedeDescargar ? (
            <PDFViewer width="100%" height="100%" showToolbar className="border-0">
              {documento}
            </PDFViewer>
          ) : (
            <VisorPdfSinDescarga documento={documento} />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
