import type { FieldErrors, Resolver } from 'react-hook-form';
import { z } from 'zod';
import { nombreObligatorio } from '@/features/usuarios/validacion';
import type { FieldKey, HistoriaClinicaValues } from '../config/fields';

/**
 * No bloquean el guardado (dejaron de ser obligatorios), pero si siguen
 * vacíos tras el primer guardado de un expediente se avisa al médico con un
 * aviso descartable, no con un error que le impida guardar.
 */
export const CAMPOS_ADVERTENCIA: readonly FieldKey[] = [
  'bhGrupoRh',
  'gradiente',
  'adOpi',
  'adCoc',
  'adThc',
  'adBzo',
  'adMet',
  'adAmp',
];

const campoObligatorio = (mensaje: string) => z.string().trim().min(1, mensaje);

/**
 * Reglas del expediente: son obligatorios los campos de "Datos Generales"
 * (Identificación y datos laborales, Datos personales, Domicilio) más el
 * Médico dictaminador / médico que atiende (206). El resto de los 200+
 * campos clínicos sigue siendo opcional.
 *
 * Quedan fuera, aunque viven en la pestaña "Datos Generales": los 2 campos
 * de "Datos del reporte" (Fecha de entrega de resultados la estampa el
 * sistema hasta que se entrega el PDF, no existe al capturar, y Fecha de
 * siguiente valoración ya se autocalcula sola en useAutoCalculos), y Zona
 * de trabajo / Área, que vuelven a ser opcionales.
 *
 * CURP/NSS: se mantiene "al menos uno de los dos", no ambos obligatorios —
 * no todos los pacientes tienen NSS.
 */
export const esquemaExpediente = z
  .looseObject({
    nombreCompleto: nombreObligatorio,
    fechaEstudios: campoObligatorio('La fecha de realización de los estudios es obligatoria.'),
    puesto: campoObligatorio('El puesto es obligatorio.'),
    empresa: campoObligatorio('La empresa es obligatoria.'),
    tipoExamenMotivo: campoObligatorio('Selecciona el motivo del examen.'),
    antiguedadEmpresa: campoObligatorio('La antigüedad en la empresa es obligatoria.'),
    antiguedadPuesto: campoObligatorio('La antigüedad en el puesto es obligatoria.'),
    exposicionPoe: campoObligatorio('La exposición (POE) es obligatoria.'),
    genero: campoObligatorio('Selecciona el género.'),
    tipoExamenCategoria: campoObligatorio('Selecciona la categoría del examen / puesto.'),
    fechaNacimiento: campoObligatorio('La fecha de nacimiento es obligatoria.'),
    domicilioCalle: campoObligatorio('La calle y número son obligatorios.'),
    domicilioColonia: campoObligatorio('La colonia es obligatoria.'),
    domicilioMunicipio: campoObligatorio('El municipio es obligatorio.'),
    domicilioEstado: campoObligatorio('El estado es obligatorio.'),
    telefono: campoObligatorio('El teléfono es obligatorio.'),
    originario: campoObligatorio('El estado de origen es obligatorio.'),
    religion: campoObligatorio('Selecciona la religión.'),
    estadoCivil: campoObligatorio('Selecciona el estado civil.'),
    curp: z.string().trim(),
    nss: z.string().trim(),
    medicoDictaminador: campoObligatorio('Selecciona el médico dictaminador / médico que atiende.'),
  })
  .superRefine((d, ctx) => {
    if (!d.curp && !d.nss) {
      ctx.addIssue({ code: 'custom', path: ['curp'], message: 'Captura la CURP o el NSS del paciente.' });
    }
  });

/** Resolver de React Hook Form: valida con Zod y deja el resto de los 200+ campos libres. */
export const resolverExpediente: Resolver<HistoriaClinicaValues> = async (values) => {
  const r = esquemaExpediente.safeParse(values);
  if (r.success) return { values, errors: {} };
  const errors: FieldErrors<HistoriaClinicaValues> = {};
  for (const issue of r.error.issues) {
    const key = issue.path[0] as keyof HistoriaClinicaValues;
    errors[key] ??= { type: 'validate', message: issue.message };
  }
  return { values: {}, errors };
};
