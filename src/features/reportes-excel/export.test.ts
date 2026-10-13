import { describe, expect, it } from 'vitest';
import { conValoresDeSistema, EMPTY_VALUES, FIELD_BY_KEY, FIELD_BY_N, NO_APTO } from '@/features/historia-clinica/config/fields';
import { SECTIONS } from '@/features/historia-clinica/config/sections';
import { pdfValue } from '@/features/historia-clinica/lib/format';
import type { Expediente } from '@/features/historia-clinica/api';
import { construirLibro } from './export';

const exp = (folio: string, gradiente: string): Expediente => ({
  folio,
  anio: 2026,
  values: { ...EMPTY_VALUES, folio, gradiente, nombreCompleto: `PACIENTE ${folio}` },
  creadoEn: '2026-10-11T15:00:00.000Z',
  creadoPor: { id: 'u', nombre: 'Leo' },
  actualizadoEn: '2026-10-11T15:00:00.000Z',
  actualizadoPor: { id: 'u', nombre: 'Leo' },
});

describe('reporte Excel: gradiente', () => {
  const wb = construirLibro([exp('1', '1'), exp('2', '2'), exp('3', '3'), exp('4', '4'), exp('5', '')], 'prueba');
  const ws = wb.getWorksheet('Expedientes')!;
  const headers = Array.from(ws.getRow(2).values as unknown[], (v) => String(v ?? '')); // índice 0 vacío: columnas desde 1
  const colG = headers.findIndex((h) => h.startsWith('Gradiente'));
  const colM = headers.findIndex((h) => h.startsWith('Magnitud de riesgo'));
  const fill = (r: number, c: number) => (ws.getRow(r).getCell(c).fill as { fgColor?: { argb?: string } } | undefined)?.fgColor?.argb;

  it('pone la Magnitud de riesgo (B + gradiente) junto al Gradiente', () => {
    expect(colM).toBe(colG + 1);
    expect([3, 4, 5, 6].map((r) => ws.getRow(r).getCell(colG).value)).toEqual([1, 2, 3, 4]);
    expect([3, 4, 5, 6].map((r) => ws.getRow(r).getCell(colM).value)).toEqual(['B1', 'B2', 'B3', 'B4']);
  });

  it('colorea ambas celdas según el nivel', () => {
    const esperado = ['FF00B050', 'FFFFFF00', 'FFFF9800', 'FFFF0000'];
    expect([3, 4, 5, 6].map((r) => fill(r, colG))).toEqual(esperado);
    expect([3, 4, 5, 6].map((r) => fill(r, colM))).toEqual(esperado);
  });

  it('sin gradiente no inventa magnitud ni color', () => {
    expect(ws.getRow(7).getCell(colM).value).toBeNull();
    expect(fill(7, colG)).not.toBe('FF00B050');
  });

  it('ya no exporta columnas de R3, R5 ni R7', () => {
    for (const retirado of ['Lugar de certificación', 'Clasificación (PECO)', 'Perímetro abdominal']) {
      expect(headers).not.toContain(retirado);
    }
  });
});

describe('reporte Excel: R2 NO APTO y R4 CONTRATISTA', () => {
  const base = exp('9', '');
  const wb = construirLibro(
    [
      { ...base, values: conValoresDeSistema({ ...base.values, fechaSiguienteValoracion: NO_APTO }) },
      { ...base, folio: '10', values: conValoresDeSistema({ ...base.values, fechaSiguienteValoracion: '2027-04-11', tipoEmpleado: 'OTRO' }) },
    ],
    'prueba',
  );
  const ws = wb.getWorksheet('Expedientes')!;
  const headers = Array.from(ws.getRow(2).values as unknown[], (v) => String(v ?? ''));
  const col = (prefijo: string) => headers.findIndex((h) => h.startsWith(prefijo));

  it('exporta NO APTO tal cual y la fecha como DD/MM/AAAA', () => {
    expect(ws.getRow(3).getCell(col('Fecha de siguiente valoración')).value).toBe('NO APTO');
    expect(ws.getRow(4).getCell(col('Fecha de siguiente valoración')).value).toBe('11/04/2027');
  });

  it('R4 siempre es CONTRATISTA', () => {
    expect(ws.getRow(3).getCell(col('Tipo de empleado')).value).toBe('CONTRATISTA');
    expect(ws.getRow(4).getCell(col('Tipo de empleado')).value).toBe('CONTRATISTA');
  });
});

describe('PDF: R2 NO APTO', () => {
  it('se imprime tal cual', () => {
    expect(pdfValue(FIELD_BY_KEY.get('fechaSiguienteValoracion'), NO_APTO)).toBe('NO APTO');
    expect(pdfValue(FIELD_BY_KEY.get('fechaSiguienteValoracion'), '2027-04-11')).toBe('11/04/2027');
  });
});

describe('Aspecto general (082-086) y R6 retirado', () => {
  it('la sección tiene Peso, Talla, IMC, Estado nutricional, Tipo y Piel (082-087)', () => {
    const sec = SECTIONS.find((s) => s.title === 'Aspecto general')!;
    expect(sec.fields).toEqual([82, 83, 84, 85, 86, 87]);
    expect(sec.fields.map((n) => FIELD_BY_N.get(n)!.key)).toEqual([
      'peso',
      'talla',
      'imc',
      'estadoNutricional',
      'constitucion',
      'pielFaneras',
    ]);
  });

  it('086 Tipo va solo a la columna CH y no existe Per. Abdominal', () => {
    const base = exp('20', '');
    const wb = construirLibro([{ ...base, values: { ...base.values, constitucion: 'MESOMORFO', talla: '1.70' } }], 'prueba');
    const ws = wb.getWorksheet('Expedientes')!;
    expect(String(ws.getCell('CH2').value)).toBe('Tipo');
    expect(ws.getCell('CH3').value).toBe('MESOMORFO');
    const headers = Array.from(ws.getRow(2).values as unknown[], (v) => String(v ?? ''));
    expect(headers.some((h) => /abdominal/i.test(h))).toBe(false);
    // "MESOMORFO" aparece en una sola celda de la fila
    const fila = Array.from(ws.getRow(3).values as unknown[]);
    expect(fila.filter((v) => v === 'MESOMORFO')).toHaveLength(1);
  });
});

describe('encabezados y título limpios', () => {
  const wb = construirLibro([exp('30', '2')], 'Historias clínicas - Jornada del 11/10/2026');
  const ws = wb.getWorksheet('Expedientes')!;
  const headers = Array.from(ws.getRow(2).values as unknown[], (v) => String(v ?? '')).filter(Boolean);

  it('el título no lleva la hora de generación', () => {
    expect(ws.getCell('A1').value).toBe('Historias clínicas - Jornada del 11/10/2026');
    expect(String(ws.getCell('A1').value)).not.toMatch(/generado/i);
  });

  it('ningún encabezado lleva el código "001 ·" ni "R1 ·"', () => {
    expect(headers.filter((h) => /^(\d{3}|R\d)\s*·/.test(h))).toEqual([]);
    expect(headers.slice(0, 3)).toEqual(['Folio de paciente', 'Fecha de realización de los estudios', 'Nombre completo']);
  });

  it('no hay dos columnas con el mismo nombre', () => {
    expect(new Set(headers).size).toBe(headers.length);
  });

  it('los nombres repetidos llevan su contexto', () => {
    expect(headers).toContain('Puesto');
    expect(headers).toContain('Empresa (tarjeta de acceso)');
    expect(headers).toContain('Empresa (trabajo actual)');
    expect(headers).toContain('Puesto (trabajo antepenúltimo)');
    expect(headers).toContain('Glucosa (química sanguínea)');
    expect(headers).toContain('Glucosa (orina)');
  });
});
