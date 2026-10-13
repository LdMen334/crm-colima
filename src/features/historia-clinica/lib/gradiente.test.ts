import { describe, expect, it } from 'vitest';
import { GRADIENTE_COLOR, magnitudRiesgoPeco, nivelGradiente } from './gradiente';
import { ALL_FIELDS } from '../config/fields';

describe('gradiente y magnitud de riesgo', () => {
  it('reconoce el nivel 1-4 con o sin prefijo', () => {
    expect(nivelGradiente('1')).toBe(1);
    expect(nivelGradiente(' 3 ')).toBe(3);
    expect(nivelGradiente('B4')).toBe(4);
    expect(nivelGradiente('g2')).toBe(2);
    expect(nivelGradiente('5')).toBeNull();
    expect(nivelGradiente('')).toBeNull();
  });

  it('PECO concatena la clasificación base B + gradiente', () => {
    expect(['1', '2', '3', '4'].map(magnitudRiesgoPeco)).toEqual(['B1', 'B2', 'B3', 'B4']);
    expect(magnitudRiesgoPeco('')).toBeNull();
  });

  it('asigna verde, amarillo, naranja y rojo', () => {
    expect(GRADIENTE_COLOR[1].fondo).toBe('#00B050');
    expect(GRADIENTE_COLOR[2].fondo).toBe('#FFFF00');
    expect(GRADIENTE_COLOR[3].fondo).toBe('#FF9800');
    expect(GRADIENTE_COLOR[4].fondo).toBe('#FF0000');
  });

  it('ya no existen R3, R5 ni R7 en el formulario', () => {
    const keys = ALL_FIELDS.map((f) => f.key as string);
    for (const k of ['lugarCertificacion', 'clasificacionPeco', 'magnitudRiesgo']) expect(keys).not.toContain(k);
    expect(ALL_FIELDS.filter((f) => f.n > 1000).map((f) => f.code)).toEqual(['R1', 'R2', 'R4']);
  });
});
