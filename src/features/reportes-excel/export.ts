import ExcelJS from 'exceljs';
import { ALL_FIELDS, type FieldDef } from '@/features/historia-clinica/config/fields';
import { SECTIONS } from '@/features/historia-clinica/config/sections';
import type { Expediente } from '@/features/historia-clinica/api';
import { formatFechaMx } from '@/features/historia-clinica/lib/format';
import { GRADIENTE_COLOR, magnitudRiesgoPeco, nivelGradiente } from '@/features/historia-clinica/lib/gradiente';

/**
 * Genera el .xlsx con un expediente por fila y todos los campos (206 + complementarios R1, R2, R4)
 * como columnas, más quién y cuándo lo creó y editó por última vez. El Gradiente y la
 * Magnitud de Riesgo PECO (B + gradiente) llevan el color de su nivel.
 * Se importa de forma dinámica: exceljs solo se descarga al exportar.
 */
type Valor = string | number | null;

interface Columna {
  header: string;
  width: number;
  valor: (e: Expediente) => Valor;
  /** Color de fondo/texto por celda (gradiente) */
  color?: (e: Expediente) => { fondo: string; texto: string } | undefined;
}

const argb = (hex: string) => `FF${hex.replace('#', '').toUpperCase()}`;
const colorNivel = (e: Expediente) => {
  const n = nivelGradiente(e.values.gradiente);
  return n ? GRADIENTE_COLOR[n] : undefined;
};
const fecha = (iso: string) => new Date(iso).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });

/**
 * Contexto para los nombres que se repiten entre secciones (Puesto, Empresa, Tiempo,
 * Condiciones especiales en la historia laboral; Glucosa, Leucocitos, Eritrocitos y
 * Hemoglobina en sangre y orina). Sin él, el Excel tendría columnas idénticas.
 */
const CONTEXTO_SECCION: Record<string, string> = {
  tActual: 'trabajo actual',
  tPenultimo: 'trabajo penúltimo',
  tAntepenultimo: 'trabajo antepenúltimo',
  qs: 'química sanguínea',
  bh: 'biometría hemática',
  ego: 'orina',
};
const SECCION_DE = new Map(SECTIONS.flatMap((s) => s.fields.map((n) => [n, s.id] as const)));
const REPETIDAS = new Set(
  ALL_FIELDS.map((f) => f.label).filter((label, i, todas) => todas.indexOf(label) !== i),
);

/** Encabezado limpio: el nombre del campo (sin el código "001 ·"), con contexto solo si se repite. */
export function encabezado(f: FieldDef): string {
  const contexto = REPETIDAS.has(f.label) ? CONTEXTO_SECCION[SECCION_DE.get(f.n) ?? ''] : undefined;
  return `${f.label}${contexto ? ` (${contexto})` : ''}${f.unit ? ` (${f.unit})` : ''}`;
}

function columnaDeCampo(f: FieldDef): Columna {
  return {
    header: encabezado(f),
    width: f.type === 'textarea' ? 40 : f.key === 'nombreCompleto' ? 34 : f.type === 'date' ? 14 : 18,
    valor: (e) => {
      const v = (e.values[f.key] ?? '').trim();
      if (!v) return null;
      if (f.type === 'date') return formatFechaMx(v, '/');
      if (f.key === 'gradiente') return nivelGradiente(v) ?? v;
      if ((f.type === 'number' || f.key === 'imc' || f.key === 'edad') && /^-?\d+(\.\d+)?$/.test(v)) return Number(v);
      return v;
    },
    color: f.key === 'gradiente' ? colorNivel : undefined,
  };
}

/** Todos los campos como columnas; junto al Gradiente, la Magnitud de Riesgo PECO (B + gradiente). */
const COLUMNAS: Columna[] = [
  ...ALL_FIELDS.flatMap((f) =>
    f.key === 'gradiente'
      ? [
          columnaDeCampo(f),
          {
            header: 'Magnitud de riesgo (PECO: B + gradiente)',
            width: 18,
            valor: (e: Expediente) => magnitudRiesgoPeco(e.values.gradiente),
            color: colorNivel,
          },
        ]
      : [columnaDeCampo(f)],
  ),
  { header: 'Creado por', width: 26, valor: (e) => e.creadoPor.nombre },
  { header: 'Fecha de creación', width: 20, valor: (e) => fecha(e.creadoEn) },
  { header: 'Última edición por', width: 26, valor: (e) => e.actualizadoPor.nombre },
  { header: 'Fecha de última edición', width: 22, valor: (e) => fecha(e.actualizadoEn) },
];

/** Arma el libro (sin descargarlo), para poder probarlo fuera del navegador. */
export function construirLibro(expedientes: Expediente[], titulo: string): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Historias Clínicas · Cruz Roja Mexicana Colima';
  wb.created = new Date();

  const ws = wb.addWorksheet('Expedientes', {
    views: [{ state: 'frozen', xSplit: 3, ySplit: 2 }],
    properties: { defaultRowHeight: 18 },
  });

  // Fila 1: título del reporte
  ws.mergeCells(1, 1, 1, Math.min(COLUMNAS.length, 12));
  const t = ws.getCell(1, 1);
  t.value = titulo;
  t.font = { bold: true, size: 13, color: { argb: 'FF16181D' } };
  t.alignment = { vertical: 'middle' };
  ws.getRow(1).height = 26;

  // Fila 2: encabezados
  const head = ws.getRow(2);
  head.values = COLUMNAS.map((c) => c.header);
  head.height = 42;
  head.eachCell((c) => {
    c.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE31B23' } };
    c.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
    c.border = { bottom: { style: 'thin', color: { argb: 'FFB8141B' } } };
  });

  COLUMNAS.forEach((c, i) => (ws.getColumn(i + 1).width = c.width));

  expedientes.forEach((e, i) => {
    const row = ws.addRow(COLUMNAS.map((c) => c.valor(e)));
    // Bandas alternas para leer filas largas
    if (i % 2 === 1) {
      row.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F7F5' } };
      });
    }
    // Gradiente / Magnitud de riesgo: fondo del nivel (1 verde · 2 amarillo · 3 naranja · 4 rojo)
    COLUMNAS.forEach((c, j) => {
      const color = c.color?.(e);
      if (!color) return;
      const cell = row.getCell(j + 1);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(color.fondo) } };
      cell.font = { bold: true, color: { argb: argb(color.texto) } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
  });

  ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: COLUMNAS.length } };
  return wb;
}

export async function descargarExcel(expedientes: Expediente[], nombreArchivo: string, titulo: string) {
  const wb = construirLibro(expedientes, titulo);
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
