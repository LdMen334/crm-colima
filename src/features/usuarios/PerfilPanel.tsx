'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Check, Eye, EyeOff, KeyRound, Loader2, Save, ShieldAlert, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { Toast } from '@/components/ui/Toast';
import { btnPrimary, card, inputBase } from '@/components/ui/styles';
import { useAuth } from '@/features/auth/AuthProvider';
import { ROLE_LABEL } from '@/features/auth/types';
import { actualizarPerfil, cambiarPassword, obtenerPerfil, type DatosPerfil } from './api';
import { MIN_PASSWORD } from './password';

/** Perfil del usuario en sesión: datos personales y cambio de contraseña. */
export function PerfilPanel() {
  const { user } = useAuth();
  const [toast, setToast] = useState<string | null>(null);
  if (!user) return null;

  return (
    <div className="w-full animate-enter px-4 pb-16 pt-6 sm:px-6">
      <PageHeader title="Mi perfil" description="Tus datos aparecen en la lista de médicos que atienden y en la firma de los reportes." />

      {user.passwordTemporal && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3.5 text-sm text-amber-900"
        >
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <p>
            <span className="font-semibold">Tu contraseña es temporal.</span> La asignó Administración; cámbiala por una que
            solo tú conozcas.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
        <DatosPersonales onSaved={() => setToast('Datos personales actualizados')} />
        <CambiarPassword onSaved={() => setToast('Contraseña actualizada')} />
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

function DatosPersonales({ onSaved }: { onSaved: () => void }) {
  const { user, actualizarSesion } = useAuth();
  const [datos, setDatos] = useState<DatosPerfil | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) obtenerPerfil(user).then(setDatos).catch((e: Error) => setError(e.message));
    // Solo al montar: después, el formulario es la fuente de verdad
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) return null;
  const medico = user.role === 'ServiciosMedicos';
  const set = (k: keyof DatosPerfil) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDatos((d) => (d ? { ...d, [k]: e.target.value } : d));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !datos) return;
    setError(null);
    setSaving(true);
    try {
      const sesion = await actualizarPerfil(user, datos);
      actualizarSesion(sesion);
      setDatos({ nombre: sesion.nombre, email: sesion.email, cedula: sesion.cedula ?? '', universidad: sesion.universidad ?? '' });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible guardar los datos.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={`${card} p-6`}>
      <Encabezado icon={<UserRound className="h-4 w-4" />} titulo="Datos personales">
        <Badge tone={user.role === 'Leo' ? 'dark' : 'blue'}>{ROLE_LABEL[user.role]}</Badge>
      </Encabezado>

      {!datos ? (
        <div className="grid place-items-center py-14">
          {error ? <p className="text-sm text-crm-red-dark">{error}</p> : <Loader2 className="h-5 w-5 animate-spin text-ink-subtle" />}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Campo label="Nombre completo">
            <input value={datos.nombre} onChange={set('nombre')} autoComplete="name" className={inputBase} />
          </Campo>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Campo label={medico ? 'Cédula profesional' : 'Cédula profesional (opcional)'}>
              <input value={datos.cedula} onChange={set('cedula')} inputMode="numeric" className={`${inputBase} font-mono`} />
            </Campo>
            <Campo label={medico ? 'Universidad' : 'Universidad (opcional)'}>
              <input value={datos.universidad} onChange={set('universidad')} className={inputBase} />
            </Campo>
          </div>
          <Campo label="Correo electrónico" hint="Es tu usuario para iniciar sesión.">
            <input type="email" value={datos.email} onChange={set('email')} autoComplete="email" className={inputBase} />
          </Campo>

          {error && <MensajeError>{error}</MensajeError>}

          <div className="flex justify-end border-t border-slate-100 pt-4">
            <button type="submit" disabled={saving} className={btnPrimary}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar datos
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function CambiarPassword({ onSaved }: { onSaved: () => void }) {
  const { user, actualizarSesion } = useAuth();
  const [f, setF] = useState({ actual: '', nueva: '', confirmar: '' });
  const [ver, setVer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  const reglas = [
    { ok: f.nueva.length >= MIN_PASSWORD, texto: `Al menos ${MIN_PASSWORD} caracteres` },
    { ok: /[A-Za-zÑñ]/.test(f.nueva) && /\d/.test(f.nueva), texto: 'Letras y números' },
    { ok: !!f.nueva && f.nueva === f.confirmar, texto: 'Las dos contraseñas coinciden' },
  ];

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    if (f.nueva !== f.confirmar) {
      setError('La confirmación no coincide con la nueva contraseña.');
      return;
    }
    setSaving(true);
    try {
      actualizarSesion(await cambiarPassword(user, f.actual, f.nueva));
      setF({ actual: '', nueva: '', confirmar: '' });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cambiar la contraseña.');
    } finally {
      setSaving(false);
    }
  }

  const tipo = ver ? 'text' : 'password';
  return (
    <section className={`${card} p-6`}>
      <Encabezado icon={<KeyRound className="h-4 w-4" />} titulo="Cambiar contraseña">
        <button
          type="button"
          onClick={() => setVer((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-ink-muted transition-colors hover:bg-slate-100 hover:text-ink"
        >
          {ver ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {ver ? 'Ocultar' : 'Mostrar'}
        </button>
      </Encabezado>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Usuario oculto para que el gestor de contraseñas asocie el cambio a la cuenta correcta */}
        <input type="email" autoComplete="username" value={user?.email ?? ''} readOnly hidden />
        <Campo label="Contraseña actual">
          <input type={tipo} value={f.actual} onChange={set('actual')} autoComplete="current-password" className={inputBase} />
        </Campo>
        <Campo label="Nueva contraseña">
          <input type={tipo} value={f.nueva} onChange={set('nueva')} autoComplete="new-password" className={inputBase} />
        </Campo>
        <Campo label="Confirmar nueva contraseña">
          <input type={tipo} value={f.confirmar} onChange={set('confirmar')} autoComplete="new-password" className={inputBase} />
        </Campo>

        <ul className="space-y-1.5" aria-label="Requisitos de la contraseña">
          {reglas.map((r) => (
            <li key={r.texto} className={`flex items-center gap-2 text-xs transition-colors ${r.ok ? 'text-emerald-700' : 'text-ink-subtle'}`}>
              <span
                className={`grid h-4 w-4 place-items-center rounded-full border transition-colors ${
                  r.ok ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                }`}
              >
                {r.ok && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
              </span>
              {r.texto}
            </li>
          ))}
        </ul>

        {error && <MensajeError>{error}</MensajeError>}

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <button type="submit" disabled={saving || !f.actual || !reglas.every((r) => r.ok)} className={btnPrimary}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Cambiar contraseña
          </button>
        </div>
      </form>
    </section>
  );
}

function Encabezado({ icon, titulo, children }: { icon: ReactNode; titulo: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2.5 text-base font-semibold text-ink">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-red-50 text-crm-red">{icon}</span>
        {titulo}
      </h2>
      {children}
    </div>
  );
}

function Campo({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-500">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ink-subtle">{hint}</span>}
    </label>
  );
}

function MensajeError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="animate-pop rounded-xl border border-crm-red/15 bg-crm-red-soft px-3 py-2.5 text-sm text-crm-red-dark">
      {children}
    </p>
  );
}
