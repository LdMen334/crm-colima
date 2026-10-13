import { apiFetch, setToken } from '@/lib/api-client';
import { refrescarMedicos } from '@/features/historia-clinica/config/medicos';
import type { Role, SessionUser } from '@/features/auth/types';

export interface UsuarioPublico {
  id: string;
  nombre: string;
  email: string;
  role: Role;
  cedula: string;
  universidad: string;
  activo: boolean;
  creadoEn: string;
  /** null = cuenta inicial del sistema */
  creadoPor: string | null;
  passwordTemporal?: boolean;
  ultimoAcceso?: string;
}

export interface NuevoUsuario {
  nombre: string;
  email: string;
  password: string;
  cedula?: string;
  universidad?: string;
}

export interface CambiosUsuario {
  nombre: string;
  email: string;
  role: Role;
  cedula: string;
  universidad: string;
  activo: boolean;
}

export interface DatosPerfil {
  nombre: string;
  email: string;
  cedula: string;
  universidad: string;
}

/** Se emite en `window` cada vez que cambia la lista de usuarios (alta, edición de perfil, activar/desactivar). */
export const USUARIOS_CAMBIARON = 'crm-hc:usuarios-cambiaron';

const ROL_BACKEND: Record<Role, string> = { ServiciosMedicos: 'servicios_medicos', Leo: 'admin' };
const ROL_FRONTEND: Record<string, Role> = { servicios_medicos: 'ServiciosMedicos', admin: 'Leo' };

interface BackendUser {
  id: string;
  email: string;
  nombre_completo: string;
  rol: string;
  estado: 'activo' | 'inactivo';
  cedula_profesional: string | null;
  universidad: string | null;
  is_temporary_password: boolean;
  ultimo_acceso: string | null;
  creado_por: string | null;
  created_at: string;
}

const aUsuarioPublico = (u: BackendUser): UsuarioPublico => ({
  id: u.id,
  nombre: u.nombre_completo,
  email: u.email,
  role: ROL_FRONTEND[u.rol] ?? 'ServiciosMedicos',
  cedula: u.cedula_profesional ?? '',
  universidad: u.universidad ?? '',
  activo: u.estado === 'activo',
  creadoEn: u.created_at,
  creadoPor: u.creado_por,
  passwordTemporal: u.is_temporary_password,
  ultimoAcceso: u.ultimo_acceso ?? undefined,
});

const aSesion = (u: BackendUser): SessionUser => ({
  id: u.id,
  email: u.email,
  nombre: u.nombre_completo,
  role: ROL_FRONTEND[u.rol] ?? 'ServiciosMedicos',
  cedula: u.cedula_profesional || undefined,
  universidad: u.universidad || undefined,
  passwordTemporal: u.is_temporary_password || undefined,
});

const avisarCambio = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(USUARIOS_CAMBIARON));
};

/** Inicia sesión: valida en el servidor y guarda el token Bearer de la sesión. */
export async function authenticate(email: string, password: string, perfil?: Role): Promise<SessionUser> {
  const { user, token } = await apiFetch<{ user: BackendUser; token: string }>('/auth/login', {
    method: 'POST',
    body: { email, password, perfil: perfil ? ROL_BACKEND[perfil] : undefined },
  });
  setToken(token);
  await refrescarMedicos();
  return aSesion(user);
}

/** Cierra la sesión en el servidor (revoca el token) y limpia la local. */
export async function cerrarSesion(): Promise<void> {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } finally {
    setToken(null);
  }
}

/** Alta directa desde el panel de Administración, con el rol que se elija. */
export async function crearUsuario(nuevo: NuevoUsuario, role: Role, _admin: SessionUser): Promise<UsuarioPublico> {
  const { user } = await apiFetch<{ user: BackendUser }>('/users', {
    method: 'POST',
    body: {
      nombre_completo: nuevo.nombre,
      email: nuevo.email,
      rol: ROL_BACKEND[role],
      cedula_profesional: nuevo.cedula || undefined,
      universidad: nuevo.universidad || undefined,
      password: nuevo.password,
    },
  });
  avisarCambio();
  return aUsuarioPublico(user);
}

export async function listUsuarios(): Promise<UsuarioPublico[]> {
  const { items } = await apiFetch<{ items: BackendUser[] }>('/users');
  return items.map(aUsuarioPublico);
}

export async function setUsuarioActivo(id: string, activo: boolean, admin: SessionUser): Promise<void> {
  const { items } = await apiFetch<{ items: BackendUser[] }>('/users');
  const u = items.find((x) => x.id === id);
  if (!u) throw new Error('El usuario ya no existe.');
  await actualizarUsuario(admin, id, {
    nombre: u.nombre_completo,
    email: u.email,
    role: ROL_FRONTEND[u.rol] ?? 'ServiciosMedicos',
    cedula: u.cedula_profesional ?? '',
    universidad: u.universidad ?? '',
    activo,
  });
}

/**
 * Edición de cualquier cuenta por Administración. Las salvaguardas (nadie se
 * desactiva ni se quita el rol de Administrador a sí mismo; siempre debe
 * quedar al menos un Administrador activo) las aplica el servidor.
 */
export async function actualizarUsuario(_admin: SessionUser, id: string, c: CambiosUsuario): Promise<UsuarioPublico> {
  const { user } = await apiFetch<{ user: BackendUser }>(`/users/${id}`, {
    method: 'PUT',
    body: {
      nombre_completo: c.nombre,
      email: c.email,
      rol: ROL_BACKEND[c.role],
      cedula_profesional: c.cedula || undefined,
      universidad: c.universidad || undefined,
      estado: c.activo ? 'activo' : 'inactivo',
    },
  });
  avisarCambio();
  return aUsuarioPublico(user);
}

/**
 * Reemplaza la contraseña por una temporal nueva y la devuelve (única vez que se ve).
 * La anterior deja de funcionar al instante.
 */
export async function restablecerPassword(_admin: SessionUser, id: string): Promise<string> {
  const { temporary_password } = await apiFetch<{ temporary_password: string }>(`/users/${id}/reset-password`, {
    method: 'POST',
  });
  return temporary_password;
}

/** Datos actuales del usuario en sesión. */
export async function obtenerPerfil(_user: SessionUser): Promise<DatosPerfil> {
  const { user } = await apiFetch<{ user: BackendUser }>('/auth/me');
  return {
    nombre: user.nombre_completo,
    email: user.email,
    cedula: user.cedula_profesional ?? '',
    universidad: user.universidad ?? '',
  };
}

/** El usuario en sesión actualiza sus propios datos. Devuelve la sesión actualizada. */
export async function actualizarPerfil(_user: SessionUser, datos: DatosPerfil): Promise<SessionUser> {
  const { user } = await apiFetch<{ user: BackendUser }>('/me', {
    method: 'PUT',
    body: {
      nombre_completo: datos.nombre,
      email: datos.email,
      cedula_profesional: datos.cedula || undefined,
      universidad: datos.universidad || undefined,
    },
  });
  return aSesion(user);
}

/** Cambio de contraseña con verificación de la actual. Quita la marca de temporal. */
export async function cambiarPassword(_user: SessionUser, actual: string, nueva: string): Promise<SessionUser> {
  const { user } = await apiFetch<{ user: BackendUser }>('/me/password', {
    method: 'POST',
    body: { actual, nueva },
  });
  return aSesion(user);
}
