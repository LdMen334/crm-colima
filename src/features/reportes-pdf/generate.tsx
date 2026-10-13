import { pdf } from '@react-pdf/renderer';
import type { HistoriaClinicaValues } from '@/features/historia-clinica/config/fields';
import { ReporteOficial } from './templates/ReporteOficial';
import type { PdfLogos, PlantillaId } from './templates/config';

/** Logotipos oficiales servidos desde public/brand/. */
const LOGO_FILES: Record<keyof PdfLogos, string> = {
  cruzRoja: '/brand/logo-cruz-roja-horizontal.png',
  penaColorada: '/brand/logo-pena-colorada.png',
  serviciosMedicos: '/brand/logo-servicios-medicos.png',
  firmaCoriaSalas: '/brand/firma-coria-salas.png',
};

let cache: PdfLogos | null = null;

async function toDataUrl(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url);
    if (!res.ok) return undefined;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}

/** Carga los logotipos como data URL; si alguno falta, el PDF deja su espacio en blanco. */
export async function resolveLogos(): Promise<PdfLogos> {
  if (cache) return cache;
  const entries = await Promise.all(
    (Object.keys(LOGO_FILES) as (keyof PdfLogos)[]).map(async (k) => [k, await toDataUrl(LOGO_FILES[k])] as const),
  );
  cache = Object.fromEntries(entries) as PdfLogos;
  return cache;
}

export async function descargarPdf(values: HistoriaClinicaValues, plantillaId: PlantillaId) {
  const logos = await resolveLogos();
  const blob = await pdf(<ReporteOficial plantilla={plantillaId} values={values} logos={logos} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Reporte_${plantillaId}_Folio_${values.folio?.trim() || 'sin-folio'}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
