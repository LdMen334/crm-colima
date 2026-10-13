'use client';

import { useState, type ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyRound, Loader2, Pencil, Save, ShieldCheck, Stethoscope } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { btnPrimary, btnSecondary, inputBase } from '@/components/ui/styles';
import { useAuth } from '@/features/auth/AuthProvider';
import { ROLE_LABEL, type Role } from '@/features/auth/types';
import { actualizarUsuario, restablecerPassword, type UsuarioPublico } from './api';
import { PasswordTemporal } from './PasswordTemporal';
import { baseUsuario, refinarPorRol } from './validacion';

const fechaHora = (iso?: string) =>
  iso ? new Date(iso).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' }) : null;

// ───────────────────────── Ver detalle ─────────────────────────

export function DetalleUsuarioModal({
  usuario,
  creadoPorNombre,
  onEditar,
  onClose,
}: {
  usuario: UsuarioPublico;
  creadoPorNombre: string | null;
  onEditar: () => void;
  onClose: () => void;
}) {
  const u = usuario;
  return (
    <Modal
      title={u.nombre}
      description="Detalle de la cuenta"
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cerrar
          </button>
          <button type="button" onClick={onEditar} className={btnPrimary}>
            <Pencil className="h-4 w-4" /> Editar información
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <Bloque titulo="Información general">
          <Dato etiqueta="Nombre completo">{u.nombre}</Dato>
          <Dato etiqueta="Correo electrónico">{u.email}</Dato>
          <Dato etiqueta="Rol">
            <Badge tone={u.role === 'Leo' ? 'dark' : 'blue'}>{ROLE_LABEL[u.role]}</Badge>
          </Dato>
          <Dato etiqueta="Estado">
            <Badge tone={u.activo ? 'green' : 'neutral'} dot>
              {u.activo ? 'Activo' : 'Inactivo'}
            </Badge>
          </Dato>
        </Bloque>

        <Bloque titulo="Información profesional">
          <Dato etiqueta="Cédula profesional" mono>
            {u.cedula || null}
          </Dato>
          <Dato etiqueta="Universidad de egreso">{u.universidad || null}</Dato>
        </Bloque>

        <Bloque titulo="Auditoría">
          <Dato etiqueta="Fecha de alta">{fechaHora(u.creadoEn)}</Dato>
          <Dato etiqueta="Dado de alta por">{u.creadoPor ? (creadoPorNombre ?? 'Cuenta eliminada') : 'Cuenta inicial del sistema'}</Dato>
          <Dato etiqueta="Última sesión activa">{fechaHora(u.ultimoAcceso) ?? 'Aún no ha iniciado sesión'}</Dato>
          <Dato etiqueta="Contraseña">
            {u.passwordTemporal ? (
              <Badge tone="amber">Temporal, pendiente de cambio</Badge>
            ) : (
              <Badge tone="neutral">Definida por el usuario</Badge>
            )}
          </Dato>
        </Bloque>
      </div>
    </Modal>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold text-slate-500">{titulo}</h3>
      <dl className="divide-y divide-slate-100 rounded-2xl bg-well px-4">{children}</dl>
    </section>
  );
}

function Dato({ etiqueta, mono, children }: { etiqueta: string; mono?: boolean; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-xs text-slate-500">{etiqueta}</dt>
      <dd className={`min-w-0 text-right text-sm font-medium text-ink ${mono ? 'font-mono' : ''}`}>
        {children ?? <span className="font-sans font-normal text-ink-subtle">Sin capturar</span>}
      </dd>
    </div>
  );
}

// ───────────────────────── Editar ─────────────────────────

/** Mismas reglas que api.ts (validacion.ts), para avisar antes de enviar. */
const esquemaUsuario = baseUsuario.extend({ activo: z.boolean() }).superRefine(refinarPorRol);

type FormUsuario = z.infer<typeof esquemaUsuario>;

const ROLES: { id: Role; label: string; icon: typeof ShieldCheck }[] = [
  { id: 'ServiciosMedicos', label: 'Servicios Médicos', icon: Stethoscope },
  { id: 'Leo', label: 'Administrador', icon: ShieldCheck },
];

export function EditarUsuarioModal({
  usuario,
  onSaved,
  onClose,
}: {
  usuario: UsuarioPublico;
  onSaved: (u: UsuarioPublico) => void;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const propio = usuario.id === user?.id;
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormUsuario>({
    resolver: zodResolver(esquemaUsuario),
    defaultValues: {
      nombre: usuario.nombre,
      email: usuario.email,
      role: usuario.role,
      cedula: usuario.cedula,
      universidad: usuario.universidad,
      activo: usuario.activo,
    },
  });

  const onSubmit = handleSubmit(async (datos) => {
    if (!user) return;
    try {
      onSaved(await actualizarUsuario(user, usuario.id, datos));
    } catch (err) {
      setError('root', { message: err instanceof Error ? err.message : 'No fue posible guardar los cambios.' });
    }
  });

  return (
    <Modal
      title="Editar usuario"
      description={usuario.email}
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancelar
          </button>
          <button type="submit" form="form-editar-usuario" disabled={isSubmitting || !isDirty} className={btnPrimary}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar cambios
          </button>
        </>
      }
    >
      <form id="form-editar-usuario" onSubmit={onSubmit} noValidate className="space-y-4">
        <Campo label="Nombre completo" error={errors.nombre?.message}>
          <input {...register('nombre')} autoComplete="off" className={inputBase} />
        </Campo>
        <Campo label="Correo electrónico" error={errors.email?.message}>
          <input type="email" {...register('email')} autoComplete="off" className={inputBase} />
        </Campo>

        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <fieldset disabled={propio}>
              <legend className="mb-1.5 text-xs font-medium text-slate-500">Rol asignado</legend>
              <div role="radiogroup" className="grid grid-cols-2 gap-1 rounded-full bg-well p-1">
                {ROLES.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={field.value === id}
                    onClick={() => field.onChange(id)}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed ${
                      field.value === id ? 'bg-crm-red text-white shadow-md shadow-red-500/20' : 'text-slate-500 enabled:hover:text-slate-800'
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                ))}
              </div>
              {propio && <p className="mt-1 text-[11px] text-ink-subtle">No puedes cambiar tu propio rol.</p>}
            </fieldset>
          )}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo label="Cédula profesional" error={errors.cedula?.message}>
            <input {...register('cedula')} inputMode="numeric" className={`${inputBase} font-mono`} />
          </Campo>
          <Campo label="Universidad de egreso" error={errors.universidad?.message}>
            <input {...register('universidad')} className={inputBase} />
          </Campo>
        </div>

        <Controller
          control={control}
          name="activo"
          render={({ field }) => (
            <div className="flex items-center justify-between gap-4 rounded-2xl bg-well px-4 py-3">
              <div>
                <p className="text-sm font-medium text-ink">Estado de la cuenta</p>
                <p className="text-[11px] text-ink-subtle">
                  {propio ? 'No puedes desactivar tu propia cuenta.' : 'Una cuenta inactiva no puede iniciar sesión.'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={field.value}
                aria-label="Cuenta activa"
                disabled={propio}
                onClick={() => field.onChange(!field.value)}
                className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                  field.value ? 'bg-emerald-500' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[left] duration-200 ease-[var(--ease-out-soft)] ${
                    field.value ? 'left-6' : 'left-1'
                  }`}
                />
              </button>
            </div>
          )}
        />

        {errors.root && (
          <p role="alert" className="animate-pop rounded-xl border border-crm-red/15 bg-crm-red-soft px-3 py-2.5 text-sm text-crm-red-dark">
            {errors.root.message}
          </p>
        )}
      </form>
    </Modal>
  );
}

function Campo({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-500">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[11px] font-medium text-crm-red-dark">{error}</span>}
    </label>
  );
}

// ───────────────────────── Nueva contraseña temporal ─────────────────────────

export function RestablecerPasswordModal({
  usuario,
  onDone,
  onClose,
}: {
  usuario: UsuarioPublico;
  onDone: () => void;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [password, setPassword] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generar() {
    if (!user) return;
    setCargando(true);
    setError(null);
    try {
      setPassword(await restablecerPassword(user, usuario.id));
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible generar la contraseña.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal
      title={password ? 'Nueva contraseña temporal' : 'Generar nueva contraseña temporal'}
      description={usuario.nombre}
      onClose={onClose}
      footer={
        password ? (
          <button type="button" onClick={onClose} className={btnPrimary}>
            Listo
          </button>
        ) : (
          <>
            <button type="button" onClick={onClose} className={btnSecondary}>
              Cancelar
            </button>
            <button type="button" onClick={generar} disabled={cargando} className={btnPrimary}>
              {cargando ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Generar contraseña
            </button>
          </>
        )
      }
    >
      {password ? (
        <div className="space-y-4">
          <div>
            <span className="mb-1.5 block text-xs font-medium text-ink-muted">Usuario (correo)</span>
            <p className="rounded-2xl bg-well px-3.5 py-2.5 font-mono text-sm text-ink">{usuario.email}</p>
          </div>
          <PasswordTemporal value={password} />
          <p className="text-[11px] leading-relaxed text-ink-subtle">
            La contraseña anterior ya no funciona. Envía esta por un canal privado; al entrar se le pedirá cambiarla.
          </p>
        </div>
      ) : (
        <div className="space-y-3 text-sm text-ink-muted">
          <p>
            Se generará una contraseña temporal para <span className="font-semibold text-ink">{usuario.email}</span>.
          </p>
          <p className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-amber-900">
            La contraseña actual dejará de funcionar de inmediato.
          </p>
          {error && (
            <p role="alert" className="rounded-xl border border-crm-red/15 bg-crm-red-soft px-3 py-2.5 text-crm-red-dark">
              {error}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
