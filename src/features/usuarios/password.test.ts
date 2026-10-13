import { describe, expect, it } from 'vitest';
import { generarPasswordTemporal, LONGITUD_TEMPORAL, problemaPassword } from './password';

describe('contraseña temporal', () => {
  const muestras = Array.from({ length: 300 }, () => generarPasswordTemporal());

  it('tiene entre 8 y 12 caracteres (12 por defecto)', () => {
    expect(LONGITUD_TEMPORAL).toBeGreaterThanOrEqual(8);
    expect(LONGITUD_TEMPORAL).toBeLessThanOrEqual(12);
    for (const p of muestras) expect(p).toHaveLength(LONGITUD_TEMPORAL);
  });

  it('siempre incluye mayúscula, minúscula, número y símbolo', () => {
    for (const p of muestras) {
      expect(p).toMatch(/[A-Z]/);
      expect(p).toMatch(/[a-z]/);
      expect(p).toMatch(/\d/);
      expect(p).toMatch(/[^A-Za-z0-9]/);
    }
  });

  it('evita caracteres ambiguos y no se repite', () => {
    for (const p of muestras) expect(p).not.toMatch(/[0O1lI]/);
    expect(new Set(muestras).size).toBe(muestras.length);
  });

  it('cumple la regla de contraseñas nuevas', () => {
    for (const p of muestras) expect(problemaPassword(p)).toBeNull();
    expect(problemaPassword('corta1')).toMatch(/al menos 8/);
    expect(problemaPassword('soloLetrasLargas')).toMatch(/letras y números/);
  });
});
