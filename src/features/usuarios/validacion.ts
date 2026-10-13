import { z } from 'zod';

/**
 * Reglas compartidas de validación (formularios en el navegador y api.ts).
 * Una sola definición para que la pantalla y el "servidor" no se contradigan.
 */

/** Letras (con acentos, ñ y ü), espacios y puntos: admite iniciales como "J. Jesus" o "Ma. Fernanda". */
export const NOMBRE_RE = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.]+$/;
export const MENSAJE_NOMBRE = 'El nombre solo debe contener letras, espacios y puntos (ej. J. Jesus)';

/** Nombre completo obligatorio (usuarios). */
export const nombreObligatorio = z
  .string()
  .trim()
  .min(1, 'Escribe el nombre completo.')
  .regex(NOMBRE_RE, MENSAJE_NOMBRE);

/** Nombre del paciente: opcional en el expediente (ningún campo es obligatorio), pero con formato si se escribe. */
export const nombreOpcional = z
  .string()
  .trim()
  .refine((v) => v === '' || NOMBRE_RE.test(v), MENSAJE_NOMBRE);

/** Cédula profesional: al menos 5 caracteres, solo letras y números. */
export const CEDULA_RE = /^[A-Za-z0-9]{5,}$/;
export const MENSAJE_CEDULA = 'La cédula debe tener al menos 5 caracteres, solo letras y números.';
export const MENSAJE_UNIVERSIDAD = 'Escribe la universidad (al menos 2 caracteres).';

const ROLES = ['ServiciosMedicos', 'Leo'] as const;

/**
 * Datos de una cuenta. Para "Servicios Médicos" la cédula y la universidad son
 * obligatorias; para "Administrador" son opcionales, pero si se escribe una
 * cédula debe tener formato válido.
 */
export const baseUsuario = z.object({
  nombre: nombreObligatorio,
  email: z.string().trim().email('El correo no es válido.'),
  role: z.enum(ROLES),
  cedula: z.string().trim(),
  universidad: z.string().trim(),
});

/** Regla condicional por rol; se reutiliza en los esquemas de alta y edición. */
export function refinarPorRol(d: { role: (typeof ROLES)[number]; cedula: string; universidad: string }, ctx: z.RefinementCtx) {
  const medico = d.role === 'ServiciosMedicos';
  if (medico || d.cedula) {
    if (!CEDULA_RE.test(d.cedula)) ctx.addIssue({ code: 'custom', path: ['cedula'], message: MENSAJE_CEDULA });
  }
  if (medico && d.universidad.length < 2) {
    ctx.addIssue({ code: 'custom', path: ['universidad'], message: MENSAJE_UNIVERSIDAD });
  }
}

export const esquemaDatosUsuario = baseUsuario.superRefine(refinarPorRol);

export type DatosUsuarioValidados = z.infer<typeof esquemaDatosUsuario>;

/** Para api.ts: lanza el primer error con su mensaje legible. */
export function validarDatosUsuario(datos: z.input<typeof esquemaDatosUsuario>): DatosUsuarioValidados {
  const r = esquemaDatosUsuario.safeParse(datos);
  if (!r.success) throw new Error(r.error.issues[0]?.message ?? 'Datos inválidos.');
  return r.data;
}
