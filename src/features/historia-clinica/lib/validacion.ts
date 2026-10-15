import type { FieldErrors, Resolver } from 'react-hook-form';
import { z } from 'zod';
import { nombreObligatorio } from '@/features/usuarios/validacion';
import type { HistoriaClinicaValues } from '../config/fields';

const MENSAJE_RESULTADO_DOPING = 'Selecciona un resultado.';
const resultadoDoping = z.string().min(1, MENSAJE_RESULTADO_DOPING);

/**
 * Reglas del expediente. La mayoría de los campos siguen siendo opcionales;
 * son obligatorios: Nombre completo, Empresa, Tipo de sangre, Gradiente, al
 * menos uno de CURP/NSS, y los 6 resultados de antidoping (que ya parten en
 * blanco, sin "NO REACTIVO" predeterminado — aquí solo se bloquea el
 * guardado si se quedan sin seleccionar).
 */
export const esquemaExpediente = z
  .looseObject({
    nombreCompleto: nombreObligatorio,
    empresa: z.string().trim().min(1, 'La empresa es obligatoria.'),
    bhGrupoRh: z.string().min(1, 'Selecciona el tipo de sangre.'),
    gradiente: z.string().min(1, 'Selecciona el gradiente.'),
    curp: z.string().trim(),
    nss: z.string().trim(),
    adOpi: resultadoDoping,
    adCoc: resultadoDoping,
    adThc: resultadoDoping,
    adBzo: resultadoDoping,
    adMet: resultadoDoping,
    adAmp: resultadoDoping,
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
