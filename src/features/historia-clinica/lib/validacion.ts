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
 * Reglas del expediente: por solicitud del cliente, los únicos campos
 * obligatorios son el Nombre completo (003), la CURP o el NSS (al menos uno
 * de los dos: no todos los pacientes tienen NSS) y el Médico dictaminador /
 * médico que atiende (206). Los otros 200+ campos son opcionales; el backend
 * aplica las mismas reglas (StoreExpedienteRequest en CR_Backend).
 */
export const esquemaExpediente = z
  .looseObject({
    nombreCompleto: nombreObligatorio,
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
