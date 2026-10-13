import type { ReactNode } from 'react';
import { Activity, FileText, Heart, HeartPulse, Pill, Plus, Shield, ShieldCheck, Stethoscope, type LucideIcon } from 'lucide-react';

/**
 * Pantalla de acceso: tarjeta blanca dividida 50/50 que flota sobre un lienzo
 * azul marino profundo. Izquierda: ilustración. Derecha: `children`.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative isolate grid min-h-dvh place-items-center overflow-hidden bg-gradient-to-br from-[#0d1b3e] via-[#162a56] to-[#0a1228] px-4 py-8 sm:py-12">
      <LienzoExterior />
      <div className="relative grid w-full max-w-4xl animate-enter grid-cols-1 overflow-hidden rounded-[32px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.35)] ring-1 ring-white/10 md:grid-cols-2">
        <Ilustracion />
        <div className="flex flex-col justify-center px-6 py-9 sm:px-12 sm:py-12">{children}</div>
      </div>
    </main>
  );
}

/** Íconos grandes en las cuatro esquinas de la pantalla, cada uno con su propio ritmo de flotación. */
const ESQUINAS: { icon: LucideIcon; pos: string; size: string; retraso: string; duracion: string; soloEscritorio?: boolean }[] = [
  { icon: Stethoscope, pos: 'left-[5%] top-[8%]', size: 'h-28 w-28', retraso: '0s', duracion: '7s' },
  { icon: Activity, pos: 'right-[6%] top-[10%]', size: 'h-24 w-24', retraso: '-2s', duracion: '8s' },
  { icon: HeartPulse, pos: 'left-[7%] bottom-[9%]', size: 'h-24 w-24', retraso: '-4s', duracion: '9s', soloEscritorio: true },
  { icon: Shield, pos: 'right-[5%] bottom-[8%]', size: 'h-28 w-28', retraso: '-1s', duracion: '7.5s' },
  { icon: Plus, pos: 'left-[22%] top-[4%]', size: 'h-12 w-12', retraso: '-3s', duracion: '6.5s', soloEscritorio: true },
  { icon: Plus, pos: 'right-[20%] bottom-[5%]', size: 'h-10 w-10', retraso: '-5s', duracion: '8.5s', soloEscritorio: true },
];

/** Ambientación del lienzo: resplandores, íconos de esquina y un ECG que cruza por detrás de la tarjeta. */
function LienzoExterior() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-red-500/10 blur-3xl" />

      {ESQUINAS.map(({ icon: Icon, pos, size, retraso, duracion, soloEscritorio }, i) => (
        <span key={i} className={`absolute text-white opacity-10 ${pos} ${soloEscritorio ? 'hidden lg:block' : 'hidden sm:block'}`}>
          <Icon
            className={`${size} animate-float-sm`}
            style={{ animationDelay: retraso, animationDuration: duracion }}
            strokeWidth={1.25}
          />
        </span>
      ))}

      {/* ECG continuo a lo ancho; los latidos quedan a los lados, fuera de la tarjeta */}
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className="absolute inset-x-0 top-1/2 h-20 w-full -translate-y-1/2 text-red-400/30">
        <path
          d="M0 44h110l10-14 12 30 15-50 13 56 10-22h28l8-10 9 10h960l10-14 12 30 15-50 13 56 10-22h28l8-10 9 10h110"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          pathLength={1}
          strokeDasharray={1}
          className="animate-pulse-line"
        />
      </svg>
    </div>
  );
}

/**
 * Íconos médicos de fondo (marca de agua). Posiciones en % del panel, en los bordes,
 * lejos del estetoscopio central y de la línea de pulso. `flota` = flotación sutil
 * con desfase propio para que no se muevan al unísono.
 */
const DECORACION: { icon: LucideIcon; pos: string; size: string; flota?: string; soloEscritorio?: boolean }[] = [
  { icon: Plus, pos: 'left-[9%] top-[9%]', size: 'h-9 w-9', flota: '0s' },
  { icon: Activity, pos: 'right-[10%] top-[13%]', size: 'h-10 w-10' },
  { icon: Pill, pos: 'left-[12%] top-[44%]', size: 'h-9 w-9', soloEscritorio: true },
  { icon: HeartPulse, pos: 'right-[9%] top-[42%]', size: 'h-11 w-11', flota: '-2.3s' },
  { icon: FileText, pos: 'left-[7%] top-[76%]', size: 'h-8 w-8', soloEscritorio: true },
  { icon: ShieldCheck, pos: 'right-[8%] top-[74%]', size: 'h-9 w-9', soloEscritorio: true, flota: '-4.6s' },
  { icon: Stethoscope, pos: 'left-[40%] top-[5%]', size: 'h-7 w-7', soloEscritorio: true },
  { icon: Plus, pos: 'right-[27%] top-[8%]', size: 'h-6 w-6', soloEscritorio: true },
];

/** Panel izquierdo: el elemento memorable de la pantalla; todo lo demás se mantiene sobrio. */
function Ilustracion() {
  return (
    <div aria-hidden className="relative flex min-h-72 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#426bc2] to-[#2e4d93] px-8 pb-24 pt-10 md:min-h-[600px]">
      {/* Profundidad: luz arriba a la izquierda, sombra fría abajo */}
      <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
      <div className="absolute -bottom-28 -right-16 h-72 w-72 rounded-full bg-[#1d3570]/50 blur-3xl" />

      {/* Patrón de íconos médicos (marca de agua) */}
      {DECORACION.map(({ icon: Icon, pos, size, flota, soloEscritorio }, i) => (
        <span key={i} className={`absolute text-white opacity-[0.18] ${pos} ${soloEscritorio ? 'hidden md:block' : ''}`}>
          <Icon
            className={`${size} ${flota ? 'animate-float-sm' : ''}`}
            style={flota ? { animationDelay: flota } : undefined}
            strokeWidth={1.5}
          />
        </span>
      ))}

      {/* Estetoscopio sobre pedestal circular, flotando */}
      <div className="relative flex flex-col items-center">
        <div className="animate-float">
          <div className="grid h-40 w-40 place-items-center rounded-full bg-white/15 ring-1 ring-white/25 md:h-52 md:w-52">
            <div className="grid place-items-center rounded-full bg-white p-6 text-[#E53E3E] shadow-2xl shadow-[#14254f]/40 md:p-8">
              <Stethoscope className="h-14 w-14 md:h-[72px] md:w-[72px]" strokeWidth={1.5} />
            </div>
          </div>
        </div>
        {/* Pedestal: sombra elíptica que se encoge cuando el estetoscopio sube */}
        <div className="mt-5 h-3.5 w-32 animate-float-shadow rounded-[50%] bg-[#14254f]/60 blur-[3px] md:w-40" />
      </div>

      <div className="relative mt-8 hidden max-w-xs text-center md:block">
        <p className="text-base font-semibold text-white">Historias clínicas y expediente laboral</p>
        <p className="mt-1 text-sm leading-relaxed text-blue-100">Coordinación de Servicios Médicos, Delegación Estatal Colima.</p>
      </div>

      {/* Línea de pulso en rojo vivo con latido */}
      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 px-6 pb-7">
        <svg viewBox="0 0 400 48" preserveAspectRatio="none" className="h-12 min-w-0 flex-1 overflow-visible text-[#FF3B30] drop-shadow-[0_0_6px_rgba(255,59,48,0.55)]">
          <path
            d="M0 26h120l9-12 11 26 14-38 12 44 9-20h24l7-8 7 8h187"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            pathLength={1}
            strokeDasharray={1}
            className="animate-pulse-line"
          />
        </svg>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white shadow-lg shadow-[#14254f]/40">
          <Heart className="h-5 w-5 animate-heartbeat fill-[#E53E3E] text-[#E53E3E]" strokeWidth={1.5} />
        </span>
      </div>
    </div>
  );
}

/** Campo de texto con ícono interno para la pantalla de acceso. */
export function AuthField({
  label,
  icon: Icon,
  trailing,
  ...input
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  trailing?: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-slate-600">{label}</span>
      <span className="group flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 transition-[border-color,box-shadow] duration-200 ease-[var(--ease-out-soft)] hover:border-slate-300 focus-within:border-crm-red focus-within:ring-2 focus-within:ring-crm-red/20">
        <Icon strokeWidth={1.75} className="h-4 w-4 shrink-0 text-slate-400 transition-colors duration-200 group-focus-within:text-crm-red" />
        <input {...input} className="h-12 w-full min-w-0 bg-transparent text-sm text-ink outline-none placeholder:text-slate-400" />
        {trailing}
      </span>
    </label>
  );
}

/** Acción principal: rojo institucional en cápsula. */
export const authSubmit =
  'group flex w-full items-center justify-center gap-2 rounded-full bg-crm-red py-3 text-sm font-semibold text-white shadow-md shadow-red-500/20 transition-[background-color,box-shadow,transform] duration-200 ease-[var(--ease-out-soft)] hover:bg-crm-red-dark hover:shadow-lg hover:shadow-red-500/25 active:scale-[0.98] disabled:opacity-70';
