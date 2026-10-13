/** "Leo" = Administración (gestión de usuarios, bitácora, reportes y PDF). */
export type Role = 'ServiciosMedicos' | 'Leo';

export interface SessionUser {
  id: string;
  email: string;
  nombre: string;
  role: Role;
  cedula?: string;
  universidad?: string;
  /** La contraseña la asignó Administración: se pide cambiarla en el perfil. */
  passwordTemporal?: boolean;
}

export const ROLE_LABEL: Record<Role, string> = {
  ServiciosMedicos: 'Servicios Médicos',
  Leo: 'Administrador',
};

export const ROLES: readonly Role[] = ['ServiciosMedicos', 'Leo'];
