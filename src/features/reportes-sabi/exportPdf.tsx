import { pdf } from '@react-pdf/renderer';
import type { ExpedienteResumen } from '@/features/historia-clinica/api';
import { ReporteSabiPdfDocument, type ModoReporte } from './ReporteSabiPdfDocument';

/** Descarga el PDF tabular del Reporte SABI. Solo debe llamarse si el rol tiene permiso de descarga. */
export async function descargarPdfSabi(
  items: ExpedienteResumen[],
  modo: ModoReporte,
  titulo: string,
  nombreArchivo: string,
) {
  const blob = await pdf(<ReporteSabiPdfDocument items={items} modo={modo} titulo={titulo} />).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
