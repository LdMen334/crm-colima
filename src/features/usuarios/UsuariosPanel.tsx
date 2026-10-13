'use client';

import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ban, Check, Eye, KeyRound, Loader2, Pencil, Search, ShieldCheck, Stethoscope, UserCheck, UserPlus } from 'lucide-react';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { Toast } from '@/components/ui/Toast';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { PageHeader } from '@/components/ui/PageHeader';
import { btnPrimary, btnSecondary, card, inputBase, inputPill } from '@/components/ui/styles';
import { useAuth } from '@/features/auth/AuthProvider';
import { ROLE_LABEL, type Role } from '@/features/auth/types';
import { normalize } from '@/features/historia-clinica/lib/format';
import { crearUsuario, listUsuarios, setUsuarioActivo, type UsuarioPublico } from './api';
import { generarPasswordTemporal, problemaPassword } from './password';
import { baseUsuario, refinarPorRol } from './validacion';
import { PasswordTemporal } from './PasswordTemporal';
import { DetalleUsuarioModal, EditarUsuarioModal, RestablecerPasswordModal } from './UsuarioModales';

export function UsuariosPanel() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<UsuarioPublico[] | null>(null);
  const [q, setQ] = useState('');
  const [alta, setAlta] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [detalle, setDetalle] = useState<UsuarioPublico | null>(null);
  const [edicion, setEdicion] = useState<UsuarioPublico | null>(null);
  const [reset, setReset] = useState<UsuarioPublico | null>(null);

  const recargar = useCallback(() => listUsuarios().then(setUsuarios), []);
  useEffect(() => {
    recargar();
  }, [recargar]);

  const filtrados = useMemo(() => {
    const nq = normalize(q);
    return (usuarios ?? []).filter((u) => !nq || [u.nombre, u.email, u.cedula].some((s) => normalize(s).includes(nq)));
  }, [usuarios, q]);

  async function toggle(u: UsuarioPublico) {
    if (!user) return;
    setError(null);
    try {
      await setUsuarioActivo(u.id, !u.activo, user);
      await recargar();
      setToast(u.activo ? `${u.nombre} quedó inactivo` : `${u.nombre} está activo de nuevo`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cambiar el estado.');
    }
  }

  const activos = usuarios?.filter((u) => u.activo).length ?? 0;

  return (
    <>
      <PageHeader
        title="Usuarios"
        description={
          usuarios ? `${usuarios.length} cuentas registradas · ${activos} activas` : 'Médicos y administradores con acceso al sistema.'
        }
        actions={
          <button type="button" onClick={() => setAlta(true)} className={btnPrimary}>
            <UserPlus className="h-4 w-4" /> Dar de alta usuario / administrativo
          </button>
        }
      />

      {error && (
        <p role="alert" className="mb-4 animate-pop rounded-xl border border-crm-red/15 bg-crm-red-soft px-3 py-2.5 text-sm text-crm-red-dark">
          {error}
        </p>
      )}

      <div className={`${card} overflow-hidden`}>
        <div className="border-b border-slate-200/60 p-4">
          <label className="relative block max-w-md">
            <span className="sr-only">Buscar usuario</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, correo o cédula" className={`${inputPill} pl-10`} />
          </label>
        </div>

        {!usuarios ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-ink-subtle" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-slate-200/60 bg-slate-50/70 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Correo</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Cédula</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((u) => (
                  <tr key={u.id} className="border-b border-slate-100 transition-colors duration-150 last:border-0 hover:bg-crm-red-soft/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                            u.role === 'Leo' ? 'bg-ink text-white' : 'bg-med-blue-soft text-med-blue'
                          }`}
                        >
                          {u.role === 'Leo' ? <ShieldCheck className="h-4 w-4" /> : <Stethoscope className="h-4 w-4" />}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{u.nombre}</p>
                          {u.universidad && <p className="truncate text-[11px] text-ink-subtle">{u.universidad}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge tone={u.role === 'Leo' ? 'dark' : 'blue'}>{ROLE_LABEL[u.role]}</Badge>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-muted">{u.cedula || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={u.activo ? 'green' : 'neutral'} dot>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <ActionMenu
                        label={`Acciones para ${u.nombre}`}
                        items={[
                          { label: 'Ver detalle', icon: Eye, onSelect: () => setDetalle(u) },
                          { label: 'Editar información', icon: Pencil, onSelect: () => setEdicion(u) },
                          { label: 'Generar nueva contraseña temporal', icon: KeyRound, onSelect: () => setReset(u) },
                          u.activo
                            ? {
                                label: 'Desactivar usuario',
                                icon: Ban,
                                danger: true,
                                onSelect: () => toggle(u),
                                disabled: u.id === user?.id,
                                hint: u.id === user?.id ? 'No puedes desactivar tu propia cuenta' : undefined,
                              }
                            : { label: 'Activar usuario', icon: UserCheck, onSelect: () => toggle(u) },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-ink-muted">
                      Sin coincidencias.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detalle && (
        <DetalleUsuarioModal
          usuario={detalle}
          creadoPorNombre={usuarios?.find((x) => x.id === detalle.creadoPor)?.nombre ?? null}
          onClose={() => setDetalle(null)}
          onEditar={() => {
            setEdicion(detalle);
            setDetalle(null);
          }}
        />
      )}

      {edicion && (
        <EditarUsuarioModal
          usuario={edicion}
          onClose={() => setEdicion(null)}
          onSaved={(u) => {
            setEdicion(null);
            recargar();
            setToast(`Cambios guardados para ${u.nombre}`);
          }}
        />
      )}

      {reset && (
        <RestablecerPasswordModal
          usuario={reset}
          onClose={() => setReset(null)}
          onDone={() => {
            recargar();
            setToast('Contraseña temporal generada');
          }}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {alta && (
        <AltaUsuarioModal
          onClose={() => setAlta(false)}
          // La lista se refresca de inmediato; el modal sigue abierto para copiar las credenciales
          onCreated={recargar}
        />
      )}
    </>
  );
}

const ROLE_OPTIONS: { id: Role; label: string; desc: string; icon: typeof ShieldCheck }[] = [
  { id: 'ServiciosMedicos', label: 'Servicios Médicos', desc: 'Captura y consulta expedientes', icon: Stethoscope },
  { id: 'Leo', label: 'Administrador', desc: 'Usuarios, bitácora, reportes y PDF', icon: ShieldCheck },
];

function AltaUsuarioModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth();
  const [creado, setCreado] = useState<{ nombre: string; email: string; password: string } | null>(null);
  const formId = useId(); // todos los hooks antes del retorno anticipado de "Cuenta creada"
  const {
    register,
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormAlta>({
    resolver: zodResolver(esquemaAlta),
    // Abre con una contraseña temporal ya generada; se puede regenerar o escribir otra
    defaultValues: { role: 'ServiciosMedicos', nombre: '', email: '', cedula: '', universidad: '', password: generarPasswordTemporal() },
  });
  const role = watch('role');

  const onSubmit = handleSubmit(async ({ role, ...datos }) => {
    if (!user) return;
    try {
      const u = await crearUsuario(datos, role, user);
      setCreado({ nombre: u.nombre, email: u.email, password: datos.password });
      onCreated();
    } catch (err) {
      setError('root', { message: err instanceof Error ? err.message : 'No fue posible crear el usuario.' });
    }
  });

  if (creado) {
    return (
      <Modal
        title="Cuenta creada"
        description="Envía estas credenciales al usuario. Al entrar por primera vez se le pedirá cambiar la contraseña."
        onClose={onClose}
        footer={
          <button type="button" onClick={onClose} className={btnPrimary}>
            Listo
          </button>
        }
      >
        <div className="space-y-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-50 text-emerald-700">
              <Check className="h-4 w-4" />
            </span>
            {creado.nombre}
          </p>
          <div>
            <span className="mb-1.5 block text-xs font-medium text-ink-muted">Usuario (correo)</span>
            <p className="rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 font-mono text-sm text-ink">{creado.email}</p>
          </div>
          <PasswordTemporal value={creado.password} />
          <p className="text-[11px] leading-relaxed text-ink-subtle">
            Por seguridad, esta contraseña no se vuelve a mostrar. Envíala por un canal privado (no por grupos).
          </p>
        </div>
      </Modal>
    );
  }

  const medico = role === 'ServiciosMedicos';

  return (
    <Modal
      title="Dar de alta usuario"
      description="La cuenta queda activa y puede iniciar sesión de inmediato."
      onClose={onClose}
      footer={
        <>
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancelar
          </button>
          <button type="submit" form={formId} disabled={isSubmitting} className={btnPrimary}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Crear cuenta
          </button>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} noValidate className="space-y-4">
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
        <fieldset>
          <legend className="mb-1.5 text-xs font-medium text-ink-muted">Rol</legend>
          <div role="radiogroup" className="grid grid-cols-2 gap-2">
            {ROLE_OPTIONS.map(({ id, label, desc, icon: Icon }) => {
              const active = field.value === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => field.onChange(id)}
                  className={`flex items-start gap-2 rounded-xl border p-3 text-left transition-[border-color,background-color,box-shadow] duration-150 ${
                    active ? 'border-crm-red bg-crm-red-soft/50 ring-4 ring-crm-red/10' : 'border-slate-200/60 hover:border-ink-subtle/60 hover:bg-slate-100/50'
                  }`}
                >
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${active ? 'text-crm-red' : 'text-ink-subtle'}`} />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink">{label}</span>
                    <span className="block text-[11px] leading-snug text-ink-muted">{desc}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
          )}
        />

        <Campo label="Nombre completo" error={errors.nombre?.message}>
          <input {...register('nombre')} autoComplete="off" placeholder="Ej. J. Jesús Pérez López" className={inputBase} />
        </Campo>
        <Campo label={medico ? 'Cédula profesional' : 'Cédula profesional (opcional)'} error={errors.cedula?.message}>
          <input {...register('cedula')} inputMode="numeric" className={`${inputBase} font-mono`} />
        </Campo>
        <Campo label={medico ? 'Universidad' : 'Universidad (opcional)'} error={errors.universidad?.message}>
          <input {...register('universidad')} className={inputBase} />
        </Campo>
        <Campo label="Correo electrónico" error={errors.email?.message}>
          <input type="email" {...register('email')} autoComplete="off" className={inputBase} />
        </Campo>
        <Controller
          control={control}
          name="password"
          render={({ field }) => <PasswordTemporal value={field.value} onChange={field.onChange} />}
        />
        {errors.password && <p className="-mt-2 text-[11px] font-medium text-crm-red-dark">{errors.password.message}</p>}

        {errors.root && (
          <p role="alert" className="animate-pop rounded-xl border border-crm-red/15 bg-crm-red-soft px-3 py-2.5 text-sm text-crm-red-dark">
            {errors.root.message}
          </p>
        )}
      </form>
    </Modal>
  );
}

function Campo({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink-muted">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-[11px] font-medium text-crm-red-dark">{error}</span>
      ) : (
        hint && <span className="mt-1 block text-[11px] text-ink-subtle">{hint}</span>
      )}
    </label>
  );
}

/** Alta: datos de la cuenta (regla por rol compartida) + contraseña inicial. */
const esquemaAlta = baseUsuario
  .extend({ password: z.string() })
  .superRefine((d, ctx) => {
    refinarPorRol(d, ctx);
    const problema = problemaPassword(d.password);
    if (problema) ctx.addIssue({ code: 'custom', path: ['password'], message: problema });
  });
type FormAlta = z.infer<typeof esquemaAlta>;
