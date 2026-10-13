import type { Role } from './types';

export type Permission =
  | 'expediente:read'
  | 'expediente:write'
  | 'paciente:search'
  | 'pdf:preview'
  | 'pdf:download'
  | 'pdf:template-select'
  | 'admin:usuarios'
  | 'admin:bitacora'
  | 'admin:reportes'
  | 'perfil:editar';

/**
 * Matriz de permisos. "Servicios Médicos" captura y consulta, pero nunca
 * ve, descarga ni emite reportes oficiales. Solo "Leo" (Administración) puede,
 * y es también el único que gestiona usuarios, revisa la bitácora y exporta a Excel.
 *
 * ⚠️ Esto oculta la UI; el backend DEBE aplicar la misma regla en los
 * endpoints que generan o sirven PDFs, usuarios, bitácora y reportes (ver README › Seguridad).
 */
const MATRIX: Record<Role, readonly Permission[]> = {
  ServiciosMedicos: ['expediente:read', 'expediente:write', 'paciente:search', 'perfil:editar'],
  Leo: [
    'expediente:read',
    'expediente:write',
    'paciente:search',
    'pdf:preview',
    'pdf:download',
    'pdf:template-select',
    'admin:usuarios',
    'admin:bitacora',
    'admin:reportes',
    'perfil:editar',
  ],
};

export const can = (role: Role | undefined, permission: Permission): boolean =>
  !!role && MATRIX[role].includes(permission);
