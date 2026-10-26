import { describe, expect, it } from 'vitest';
import { ALTO_LINEA, anchoTexto, lineasTexto, tamanoAjustado } from './ajuste';

describe('anchoTexto', () => {
  it('usa las métricas AFM de Helvetica', () => {
    expect(anchoTexto('A', 10)).toBeCloseTo(6.67);
    expect(anchoTexto('A', 10, true)).toBeCloseTo(7.22);
  });

  it('mide las letras acentuadas como su letra base', () => {
    expect(anchoTexto('ÁÉÍÓÚñ', 8)).toBeCloseTo(anchoTexto('AEIOUn', 8));
  });
});

describe('lineasTexto', () => {
  it('parte solo entre palabras y respeta los saltos de línea', () => {
    const palabra = anchoTexto('NORMAL', 6);
    expect(lineasTexto('NORMAL NORMAL', palabra * 2 + 5, 6)).toBe(1);
    expect(lineasTexto('NORMAL NORMAL', palabra + 1, 6)).toBe(2);
    expect(lineasTexto('NORMAL\nNORMAL', 500, 6)).toBe(2);
  });

  it('una palabra más ancha que la celda no cabe (no hay división silábica)', () => {
    expect(lineasTexto('PEPJ890824HCMRRN01', 20, 6)).toBe(Infinity);
  });
});

describe('tamanoAjustado', () => {
  it('conserva el tamaño base si el texto cabe', () => {
    expect(tamanoAjustado('NORMAL', 100, 10, 6.2)).toBe(6.2);
  });

  it('reduce la letra hasta que el texto quepa en el recuadro', () => {
    const texto = 'SIN ALTERACIONES APARENTES A LA EXPLORACION';
    const size = tamanoAjustado(texto, 60, 12, 6.2);
    expect(size).toBeLessThan(6.2);
    expect(lineasTexto(texto, 60, size) * size * ALTO_LINEA).toBeLessThanOrEqual(12);
  });

  it('reduce un CURP hasta que entre completo en una línea', () => {
    const size = tamanoAjustado('PEPJ890824HCMRRN01', 54, 8, 6.2);
    expect(anchoTexto('PEPJ890824HCMRRN01', size)).toBeLessThanOrEqual(54);
  });

  it('no baja del mínimo aunque el texto no quepa', () => {
    expect(tamanoAjustado('X'.repeat(500), 20, 8, 6, { minimo: 3 })).toBe(3);
  });

  it('texto vacío conserva el tamaño base', () => {
    expect(tamanoAjustado('', 20, 8, 6)).toBe(6);
  });
});
