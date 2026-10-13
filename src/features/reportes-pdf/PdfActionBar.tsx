'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { Download, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { can } from '@/features/auth/permissions';
import type { HistoriaClinicaValues } from '@/features/historia-clinica/config/fields';
import { PlantillaSelector } from './PlantillaSelector';
import type { PlantillaId } from './templates/config';

// El motor PDF solo se descarga cuando se abre el modal (nunca para Servicios Médicos)
const PdfPreviewModal = dynamic(() => import('./PdfPreviewModal'), { ssr: false });

/**
 * Barra de reportes oficiales. Para cualquier rol distinto de "Leo" no
 * renderiza nada: ni botones, ni selector, ni el código del generador PDF.
 */
export function PdfActionBar() {
  const { user } = useAuth();
  if (!can(user?.role, 'pdf:preview')) return null; // role !== 'Leo'
  return <PdfActionBarInner />;
}

function PdfActionBarInner() {
  const { getValues } = useFormContext<HistoriaClinicaValues>();
  const [plantilla, setPlantilla] = useState<PlantillaId>('PECO');
  const [open, setOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  async function download() {
    setDownloading(true);
    try {
      const { descargarPdf } = await import('./generate');
      await descargarPdf(getValues(), plantilla);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 rounded-full bg-white p-1.5 pl-4 shadow-card">
        <span className="hidden text-[11px] font-medium text-ink-subtle sm:inline">Reporte</span>
        <PlantillaSelector value={plantilla} onChange={setPlantilla} />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium text-ink transition-colors hover:bg-well active:scale-[0.97]"
        >
          <FileText className="h-4 w-4 text-med-blue" />
          Vista previa PDF
        </button>
        <button
          type="button"
          onClick={download}
          disabled={downloading}
          aria-label={`Descargar PDF ${plantilla}`}
          className="flex h-9 items-center gap-1.5 rounded-full bg-navy px-4 text-sm font-medium text-white transition-colors hover:bg-navy-2 active:scale-[0.97] disabled:opacity-70"
        >
          {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          <span className="hidden sm:inline">Descargar</span>
        </button>
      </div>
      {open && <PdfPreviewModal plantilla={plantilla} onPlantilla={setPlantilla} onClose={() => setOpen(false)} />}
    </>
  );
}
