'use client';

import { useState, type CSSProperties, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, Stethoscope } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { AuthField, AuthShell, authSubmit } from './AuthShell';
import type { Role } from './types';

const PERFILES: { id: Role; label: string; icon: typeof Stethoscope }[] = [
  { id: 'ServiciosMedicos', label: 'Servicios Médicos', icon: Stethoscope },
  { id: 'Leo', label: 'Administración', icon: ShieldCheck },
];

const step = (i: number) => ({ '--i': i }) as CSSProperties;

export function LoginCard() {
  const { login } = useAuth();
  const router = useRouter();
  const [perfil, setPerfil] = useState<Role>('ServiciosMedicos');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const u = await login(email, password, perfil);
      // Con contraseña temporal (asignada por Administración) se pide cambiarla primero
      router.replace(u.passwordTemporal ? '/perfil' : '/expedientes');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible iniciar sesión.');
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <form onSubmit={onSubmit}>
        <div className="animate-enter stagger" style={step(1)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-cruz-roja-horizontal.png" alt="Cruz Roja Mexicana" width={316} height={101} className="h-11 w-auto" />
          <h1 className="mt-8 text-[30px] font-semibold leading-tight tracking-[-0.025em] text-slate-900">Iniciar sesión</h1>
          <p className="mt-1.5 text-sm text-slate-500">Historias Clínicas · Delegación Estatal Colima</p>
        </div>

        {/* Perfil solicitado: se valida contra el rol real de la cuenta */}
        <fieldset className="mt-7 animate-enter stagger" style={step(2)}>
          <legend className="mb-2 text-xs font-medium text-slate-600">Ingresar como</legend>
          <div role="radiogroup" className="grid grid-cols-2 gap-1 rounded-full bg-well p-1">
            {PERFILES.map(({ id, label, icon: Icon }) => {
              const active = perfil === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    setPerfil(id);
                    setError(null);
                  }}
                  className={`relative flex items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-2 py-2.5 text-[13px] font-semibold transition-colors duration-200 ${
                    active ? 'text-white' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="perfil-activo"
                      transition={{ type: 'spring', stiffness: 520, damping: 38 }}
                      className="absolute inset-0 rounded-full bg-crm-red shadow-md shadow-red-500/20"
                    />
                  )}
                  <Icon strokeWidth={1.75} className="relative h-4 w-4" />
                  <span className="relative">{label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-5 animate-enter space-y-4 stagger" style={step(3)}>
          <AuthField
            label="Correo electrónico"
            icon={Mail}
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nombre@crm-colima.mx"
          />
          <AuthField
            label="Contraseña"
            icon={Lock}
            type={showPass ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            trailing={
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition-colors hover:bg-well hover:text-ink"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
        </div>

        {error && (
          <p role="alert" className="mt-4 animate-pop rounded-2xl border border-crm-red/15 bg-crm-red-soft px-4 py-3 text-sm text-crm-red-dark">
            {error}
          </p>
        )}

        <div className="animate-enter stagger" style={step(4)}>
          <button
            type="submit"
            disabled={loading}
            className={`${authSubmit} mt-6`}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Iniciar sesión
            {!loading && <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />}
          </button>
        </div>

        <div className="mt-7 animate-enter border-t border-slate-100 pt-5 stagger" style={step(5)}>
          <p className="text-sm text-slate-500">¿Sin cuenta o sin acceso? Solicítala a Administración.</p>
          <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck strokeWidth={1.75} className="h-3.5 w-3.5 shrink-0" /> Acceso exclusivo para personal autorizado. La actividad queda registrada.
          </p>
        </div>
      </form>
    </AuthShell>
  );
}
