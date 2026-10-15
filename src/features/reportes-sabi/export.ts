import ExcelJS from 'exceljs';
import type { ExpedienteResumen } from '@/features/historia-clinica/api';
import { formatFechaMx } from '@/features/historia-clinica/lib/format';
import { curpONss, dictamenDe } from './lib';
import type { ModoReporte } from './ReporteSabiPdfDocument';

/**
 * Genera el .xlsx del reporte de pacientes atendidos (Fundación SABI /
 * Atenciones por médico). "Examen visual" solo aplica en modo SABI. Se
 * importa de forma dinámica: exceljs solo se descarga al exportar.
 */
interface Columna {
  header: string;
  width: number;
  valor: (e: ExpedienteResumen) => string;
}

function columnasDe(modo: ModoReporte): Columna[] {
  const columnas: Columna[] = [
    { header: 'Fecha', width: 14, valor: (e) => formatFechaMx(e.fechaEstudios, '/') },
    { header: 'Folio', width: 10, valor: (e) => e.folio },
    { header: 'Nombre completo', width: 34, valor: (e) => e.nombreCompleto || 'Sin nombre' },
    { header: 'CURP / NSS', width: 20, valor: curpONss },
    { header: 'Empresa', width: 30, valor: (e) => e.empresa || '—' },
    { header: 'Zona de trabajo', width: 18, valor: (e) => e.zonaTrabajo || '—' },
  ];
  if (modo === 'sabi') {
    columnas.push({
      header: 'Estatus del examen visual',
      width: 24,
      valor: (e) => (e.examenesVisualesRealizados ? 'Realizado' : 'Pendiente'),
    });
  }
  columnas.push(
    { header: 'Dictamen final / Aptitud', width: 22, valor: dictamenDe },
    { header: 'Médico atendió', width: 30, valor: (e) => e.medico || '—' },
  );
  return columnas;
}

export function construirLibroSabi(items: ExpedienteResumen[], modo: ModoReporte, titulo: string): ExcelJS.Workbook {
  const columnas = columnasDe(modo);
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Historias Clínicas · Cruz Roja Mexicana Colima';
  wb.created = new Date();

  const ws = wb.addWorksheet('Pacientes atendidos', {
    views: [{ state: 'frozen', ySplit: 2 }],
    properties: { defaultRowHeight: 18 },
  });

  ws.mergeCells(1, 1, 1, columnas.length);
  const t = ws.getCell(1, 1);
  t.value = titulo;
  t.font = { bold: true, size: 13, color: { argb: 'FF16181D' } };
  t.alignment = { vertical: 'middle' };
  ws.getRow(1).height = 26;

  const head = ws.getRow(2);
  head.values = columnas.map((c) => c.header);
  head.height = 28;
  head.eachCell((c) => {
    c.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE31B23' } };
    c.alignment = { vertical: 'middle', horizontal: 'left' };
  });

  columnas.forEach((c, i) => (ws.getColumn(i + 1).width = c.width));

  items.forEach((e, i) => {
    const row = ws.addRow(columnas.map((c) => c.valor(e)));
    if (i % 2 === 1) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F7F5' } };
      });
    }
  });

  ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: columnas.length } };
  return wb;
}

export async function descargarExcelSabi(items: ExpedienteResumen[], modo: ModoReporte, nombreArchivo: string, titulo: string) {
  const wb = construirLibroSabi(items, modo, titulo);
  const buffer = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
