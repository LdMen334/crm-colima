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

describe('expediente: campos obligatorios (Datos Generales + médico dictaminador)', () => {
  /** Expediente con todos los campos de Datos Generales + médico dictaminador completos. */
  const VALIDO = {
    ...EMPTY_VALUES,
    nombreCompleto: 'Ma. Fernanda Ruiz',
    fechaEstudios: '2026-10-15',
    puesto: 'OPERADOR',
    empresa: 'CONSORCIO MINERO DEMO',
    tipoExamenMotivo: 'INGRESO / EVALUACIÓN INICIAL',
    antiguedadEmpresa: '2 AÑOS',
    antiguedadPuesto: '1 AÑO',
    exposicionPoe: 'NINGUNA',
    genero: 'FEMENINO',
    tipoExamenCategoria: 'PERSONAL GENERAL',
    fechaNacimiento: '1990-01-01',
    domicilioCalle: 'AV REFORMA 123',
    domicilioColonia: 'CENTRO',
    domicilioMunicipio: 'COLIMA',
    domicilioEstado: 'COLIMA',
    telefono: '3121234567',
    originario: 'COLIMA',
    religion: 'Ninguna',
    estadoCivil: 'SOLTERO',
    curp: 'RUFM900101MCLZRR05',
    medicoDictaminador: 'MANUEL ALEJANDRO CORIA SALAS',
  };
  const validar = (valores: typeof VALIDO) =>
    resolverExpediente(valores, undefined, { fields: {}, shouldUseNativeValidation: false });

  it('con todos los obligatorios completos no hay errores', async () => {
    expect((await validar(VALIDO)).errors).toEqual({});
  });
  it('nombre completo: acepta iniciales con punto y rechaza números', async () => {
    expect((await validar({ ...VALIDO, nombreCompleto: 'Paciente 1' })).errors.nombreCompleto?.message).toBe(MENSAJE_NOMBRE);
  });
  it('exige empresa', async () => {
    expect((await validar({ ...VALIDO, empresa: '' })).errors.empresa?.message).toBe('La empresa es obligatoria.');
  });
  it('exige al menos uno de CURP/NSS', async () => {
    expect((await validar({ ...VALIDO, curp: '' })).errors.curp?.message).toBe('Captura la CURP o el NSS del paciente.');
    expect((await validar({ ...VALIDO, curp: '', nss: '12345678901' })).errors).toEqual({});
  });
  it('exige médico dictaminador / médico que atiende', async () => {
    expect((await validar({ ...VALIDO, medicoDictaminador: '' })).errors.medicoDictaminador?.message).toBe(
      'Selecciona el médico dictaminador / médico que atiende.',
    );
  });
  it('tipo de sangre y los 6 resultados de antidoping ya no son obligatorios', async () => {
    expect(
      (await validar({ ...VALIDO, bhGrupoRh: '', adOpi: '', adCoc: '', adThc: '', adBzo: '', adMet: '', adAmp: '' })).errors,
    ).toEqual({});
  });
  it('zona de trabajo y área ya no son obligatorias', async () => {
    expect((await validar({ ...VALIDO, zonaTrabajo: '', area: '' })).errors).toEqual({});
  });
});
