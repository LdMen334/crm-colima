import ExcelJS from 'exceljs';
import type { ExpedienteResumen } from '@/features/historia-clinica/api';
import { formatFechaMx } from '@/features/historia-clinica/lib/format';

/**
 * Genera el .xlsx del reporte de pacientes atendidos (Fundación SABI): Fecha,
 * Empresa, Nombre completo y Estatus del examen visual. Se importa de forma
 * dinámica: exceljs solo se descarga al exportar.
 */
export function construirLibroSabi(items: ExpedienteResumen[], titulo: string): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Historias Clínicas · Cruz Roja Mexicana Colima';
  wb.created = new Date();

  const ws = wb.addWorksheet('Pacientes atendidos', {
    views: [{ state: 'frozen', ySplit: 2 }],
    properties: { defaultRowHeight: 18 },
  });

  const columnas = [
    { header: 'Fecha', width: 14 },
    { header: 'Empresa', width: 34 },
    { header: 'Nombre completo', width: 34 },
    { header: 'Estatus del examen visual', width: 24 },
  ];

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
    const row = ws.addRow([
      formatFechaMx(e.fechaEstudios, '/'),
      e.empresa || '—',
      e.nombreCompleto || 'Sin nombre',
      e.examenesVisualesRealizados ? 'Realizado' : 'Pendiente',
    ]);
    if (i % 2 === 1) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F7F5' } };
      });
    }
  });

  ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: columnas.length } };
  return wb;
}

export async function descargarExcelSabi(items: ExpedienteResumen[], nombreArchivo: string, titulo: string) {
  const wb = construirLibroSabi(items, titulo);
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
