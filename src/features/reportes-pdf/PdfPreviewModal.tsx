'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { PDFViewer } from '@react-pdf/renderer';
import { useFormContext, useWatch } from 'react-hook-form';
import { Download, Loader2, X } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { can } from '@/features/auth/permissions';
import type { HistoriaClinicaValues } from '@/features/historia-clinica/config/fields';
import { marcarEntregaResultados } from '@/features/historia-clinica/api';
import { ReporteOficial } from './templates/ReporteOficial';
import { PLANTILLAS, type PdfLogos, type PlantillaId } from './templates/config';
import { descargarPdf, resolveLogos } from './generate';
import { PlantillaSelector } from './PlantillaSelector';
import VisorPdfSinDescarga from './VisorPdfSinDescarga';

/**
 * Vista previa en tiempo real. Este módulo solo se descarga en el navegador
 * cuando un usuario con permiso `pdf:preview` abre el modal (import dinámico).
 * Sin `pdf:download` (Servicios Médicos) no hay botón de descarga y el PDF se
 * muestra como imágenes (VisorPdfSinDescarga), sin el visor del navegador.
 * La fecha de entrega solo se estampa al descargar, así que la vista previa
 * nunca la modifica.
 *
 * @param clave clave de ruta "{anio}-{folio}" del expediente ya guardado, o
 *              `undefined` si todavía no se ha guardado.
 */
export default function PdfPreviewModal({
  plantilla,
  onPlantilla,
  onClose,
  clave,
}: {
  plantilla: PlantillaId;
  onPlantilla: (p: PlantillaId) => void;
  onClose: () => void;
  clave?: string;
}) {
  const { user } = useAuth();
  const puedeDescargar = can(user?.role, 'pdf:download');
  const { control, getValues, setValue } = useFormContext<HistoriaClinicaValues>();
  const live = useWatch({ control });
  const [values, setValues] = useState<HistoriaClinicaValues>(() => getValues());
  const [logos, setLogos] = useState<PdfLogos>({});
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    resolveLogos().then(setLogos);
  }, []);

  // Debounce para no regenerar el PDF en cada pulsación
  useEffect(() => {
    const t = setTimeout(() => setValues(getValues()), 600);
    return () => clearTimeout(t);
  }, [live, getValues]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const documento = useMemo(
    () => <ReporteOficial plantilla={plantilla} values={values} logos={logos} />,
    [plantilla, values, logos],
  );

  // Portal: el formulario contenedor tiene animación de entrada, que atraparía el `position: fixed`
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Vista previa de PDF"
    >
      <div className="flex h-[92dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3">
          <div>
            <p className="text-sm font-semibold text-ink">Vista previa del reporte oficial</p>
            <p className="text-xs text-ink-muted">
              {PLANTILLAS[plantilla].id} · {PLANTILLAS[plantilla].cliente}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <PlantillaSelector value={plantilla} onChange={onPlantilla} />
            {puedeDescargar && (
              <button
                type="button"
                disabled={downloading}
                onClick={async () => {
                  setDownloading(true);
                  try {
                    const vals = getValues();
                    if (clave) {
                      const fecha = await marcarEntregaResultados(clave);
                      setValue('fechaEntregaResultados', fecha, { shouldDirty: true });
                      vals.fechaEntregaResultados = fecha;
                    }
                    await descargarPdf(vals, plantilla);
                  } finally {
                    setDownloading(false);
                  }
                }}
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
        <div className="flex-1 bg-canvas">
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
