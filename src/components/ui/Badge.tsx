import type { ReactNode } from 'react';

export type BadgeTone = 'neutral' | 'red' | 'blue' | 'green' | 'amber' | 'dark' | 'primary';

/** Cápsulas en tonos pastel con borde del mismo tono y un leve degradado. */
const TONES: Record<BadgeTone, string> = {
  neutral: 'border-slate-200 bg-gradient-to-b from-white to-slate-50 text-slate-600',
  red: 'border-red-200/70 bg-gradient-to-b from-red-50 to-red-100/60 text-red-700',
  blue: 'border-blue-200/70 bg-gradient-to-b from-blue-50 to-blue-100/60 text-blue-700',
  green: 'border-emerald-200/70 bg-gradient-to-b from-emerald-50 to-emerald-100/60 text-emerald-700',
  amber: 'border-amber-200/70 bg-gradient-to-b from-amber-50 to-amber-100/60 text-amber-800',
  dark: 'border-navy bg-gradient-to-b from-navy-3 to-navy text-white',
  /** Destacado: rojo institucional sólido */
  primary: 'border-crm-red bg-crm-red text-white shadow-sm shadow-red-500/20',
};

export function Badge({ tone = 'neutral', dot, children }: { tone?: BadgeTone; dot?: boolean; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium ${TONES[tone]}`}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}
