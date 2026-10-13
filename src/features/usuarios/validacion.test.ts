import { describe, expect, it } from 'vitest';
import { EMPTY_VALUES } from '@/features/historia-clinica/config/fields';
import { resolverExpediente } from '@/features/historia-clinica/lib/validacion';
import { esquemaDatosUsuario, MENSAJE_NOMBRE, NOMBRE_RE } from './validacion';

const base = { nombre: 'Ana López', email: 'ana@test.mx', cedula: '', universidad: '' };
const errores = (d: Parameters<typeof esquemaDatosUsuario.safeParse>[0]) => {
  const r = esquemaDatosUsuario.safeParse(d);
  return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]));
};

describe('nombre completo', () => {
  it('acepta letras con acentos, ñ, ü, espacios e iniciales con punto', () => {
    for (const n of ['J. Jesus', 'Ma. Fernanda', 'José Ñúñez Güemes', 'GARCÍA LÓPEZ JUAN CARLOS']) expect(NOMBRE_RE.test(n)).toBe(true);
  });
  it('rechaza números y otros signos', () => {
    for (const n of ['Juan2', 'Ana_López', 'Luis@', 'Pérez-López', "O'Brien"]) expect(NOMBRE_RE.test(n)).toBe(false);
    expect(errores({ ...base, role: 'Leo', nombre: 'Juan 2' }).nombre).toBe(MENSAJE_NOMBRE);
  });
});

describe('cédula y universidad por rol', () => {
  it('Servicios Médicos: ambas obligatorias', () => {
    const e = errores({ ...base, role: 'ServiciosMedicos' });
    expect(Object.keys(e).sort()).toEqual(['cedula', 'universidad']);
  });
  it('Servicios Médicos: cédula de al menos 5 caracteres alfanuméricos y universidad de al menos 2', () => {
    expect(errores({ ...base, role: 'ServiciosMedicos', cedula: '1234', universidad: 'U' })).toHaveProperty('cedula');
    expect(errores({ ...base, role: 'ServiciosMedicos', cedula: '12-345', universidad: 'UdeC' })).toHaveProperty('cedula');
    expect(errores({ ...base, role: 'ServiciosMedicos', cedula: '12345', universidad: 'U' })).toHaveProperty('universidad');
    expect(errores({ ...base, role: 'ServiciosMedicos', cedula: 'AB12345', universidad: 'UdeC' })).toEqual({});
  });
  it('Administrador: opcionales', () => {
    expect(errores({ ...base, role: 'Leo' })).toEqual({});
  });
});

describe('expediente: 003 Nombre completo', () => {
  const validar = (nombreCompleto: string) =>
    resolverExpediente({ ...EMPTY_VALUES, nombreCompleto }, undefined, { fields: {}, shouldUseNativeValidation: false });
  it('vacío es válido (ningún campo es obligatorio)', async () => {
    expect((await validar('')).errors).toEqual({});
  });
  it('acepta iniciales con punto y rechaza números', async () => {
    expect((await validar('Ma. Fernanda Ruiz')).errors).toEqual({});
    expect((await validar('Paciente 1')).errors.nombreCompleto?.message).toBe(MENSAJE_NOMBRE);
  });
});
