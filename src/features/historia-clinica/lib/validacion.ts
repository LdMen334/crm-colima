import type { FieldErrors, Resolver } from 'react-hook-form';
import { z } from 'zod';
import { nombreOpcional } from '@/features/usuarios/validacion';
import type { HistoriaClinicaValues } from '../config/fields';

/**
 * Reglas del expediente. Ningún campo es obligatorio; solo se valida el formato
 * de los que lo requieren cuando se capturan (hoy: 003 Nombre completo).
 */
export const esquemaExpediente = z.looseObject({
  nombreCompleto: nombreOpcional,
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
