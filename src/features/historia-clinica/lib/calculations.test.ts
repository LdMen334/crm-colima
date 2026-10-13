import { describe, expect, it } from 'vitest';
import {
  calcularEdad,
  calcularGrupoEdad,
  calcularIMC,
  clasificarIMC,
  formatearTA,
  normalizarTallaMetros,
  parseFecha,
  sumarMeses,
} from './calculations';
import { ALL_FIELDS, CAMPOS_SISTEMA, EMPTY_VALUES, FIELDS } from '../config/fields';
import { toDbPayload } from './db-mapping';
import { SECTIONS } from '../config/sections';

describe('edad y grupo de edad', () => {
  const ref = new Date(2026, 9, 9); // 09-10-2026
  it('cuenta años cumplidos', () => {
    expect(calcularEdad('1985-10-09', ref)).toBe(41);
    expect(calcularEdad('1985-10-10', ref)).toBe(40);
    expect(calcularEdad('10-10-1985', ref)).toBe(40);
  });
  it('rechaza fechas inválidas o futuras', () => {
    expect(parseFecha('31-02-2000')).toBeNull();
    expect(calcularEdad('2030-01-01', ref)).toBeNull();
  });
  it('asigna el grupo correcto en los límites', () => {
    expect(calcularGrupoEdad(25)).toBe('< 26');
    expect(calcularGrupoEdad(26)).toBe('26-35');
    expect(calcularGrupoEdad(35)).toBe('26-35');
    expect(calcularGrupoEdad(36)).toBe('36-45');
    expect(calcularGrupoEdad(46)).toBe('46-50');
    expect(calcularGrupoEdad(50)).toBe('46-50');
    expect(calcularGrupoEdad(51)).toBe('> 50');
  });
});

describe('IMC', () => {
  it('convierte centímetros a metros', () => {
    expect(normalizarTallaMetros('170')).toBe(1.7);
    expect(normalizarTallaMetros('1.70')).toBe(1.7);
    expect(normalizarTallaMetros('1,70')).toBe(1.7);
    expect(normalizarTallaMetros('17')).toBeNull();
  });
  it('calcula igual en cm y en m', () => {
    expect(calcularIMC('70', '170')).toBe(24.22);
    expect(calcularIMC('70', '1.70')).toBe(24.22);
  });
  it('coincide con los formatos oficiales', () => {
    expect(calcularIMC('101', '1.62')).toBe(38.48); // TX folio 1660
    expect(clasificarIMC(38.48)).toBe('OBESIDAD II');
    expect(calcularIMC('65.5', '1.71')).toBe(22.4); // PECO número 900
    expect(clasificarIMC(22.4)).toBe('PESO NORMAL');
  });
  it('clasifica según OMS', () => {
    expect(clasificarIMC(18.4)).toBe('BAJO PESO');
    expect(clasificarIMC(18.5)).toBe('PESO NORMAL');
    expect(clasificarIMC(24.9)).toBe('PESO NORMAL');
    expect(clasificarIMC(25)).toBe('SOBREPESO');
    expect(clasificarIMC(30)).toBe('OBESIDAD I');
    expect(clasificarIMC(35)).toBe('OBESIDAD II');
    expect(clasificarIMC(40)).toBe('OBESIDAD III');
  });
});

describe('siguiente valoración', () => {
  it('suma 6 meses como en el formato TX', () => {
    expect(sumarMeses('2026-09-28', 6)).toBe('2027-03-28');
    expect(sumarMeses('2026-08-31', 6)).toBe('2027-02-28');
  });
});

describe('T/A', () => {
  it('arma la lectura conjunta; la clasificación es libre', () => {
    expect(formatearTA('122', '82')).toBe('122/82');
    expect(formatearTA('122', '')).toBeNull();
    expect(FIELDS[80].type).toBe('text');
  });
});

describe('estructura del formulario', () => {
  it('tiene 206 campos numerados 1..206 con claves únicas', () => {
    expect(FIELDS).toHaveLength(206);
    FIELDS.forEach((f, i) => expect(f.n).toBe(i + 1));
    expect(new Set(ALL_FIELDS.map((f) => f.key)).size).toBe(ALL_FIELDS.length);
  });
  it('cada campo capturable aparece en exactamente una sección; los del sistema en ninguna', () => {
    const all = SECTIONS.flatMap((s) => s.fields).sort((a, b) => a - b);
    const capturables = ALL_FIELDS.filter((f) => !CAMPOS_SISTEMA.has(f.key));
    expect(all).toEqual(capturables.map((f) => f.n).sort((a, b) => a - b));
  });
  it('campos 7 y 15 se distinguen y mapean a snake_case', () => {
    expect(toDbPayload({ ...EMPTY_VALUES, tipoExamenMotivo: 'RENOVACIÓN ANUAL' }).tipo_examen_motivo).toBe('RENOVACIÓN ANUAL');
    expect('tipo_examen_categoria' in toDbPayload(EMPTY_VALUES)).toBe(true);
  });
  it('el código postal no forma parte del expediente ni del PDF', () => {
    expect(ALL_FIELDS.some((f) => /^cp|codigoPostal/i.test(f.key) || /postal/i.test(f.label))).toBe(false);
  });
});
