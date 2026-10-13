import { describe, expect, it } from 'vitest';
import { etiquetaMedico, listarMedicos } from './medicos';

describe('médico que atiende', () => {
  it('muestra nombre, cédula y universidad', () => {
    expect(etiquetaMedico({ nombre: 'ANA PÉREZ', cedula: '12345678', universidad: 'UNIVERSIDAD DE COLIMA', siglasUniversidad: '' })).toBe(
      'ANA PÉREZ - Cédula: 12345678 (UNIVERSIDAD DE COLIMA)',
    );
  });

  it('sin usuarios registrados conserva al firmante oficial', () => {
    expect(listarMedicos().map((m) => m.nombre)).toContain('MANUEL ALEJANDRO CORIA SALAS');
  });
});
