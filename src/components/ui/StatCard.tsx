import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { card } from './styles';

export type StatTone = 'red' | 'blue' | 'amber' | 'green';

const TONE: Record<StatTone, string> = {
  red: 'bg-red-100 text-red-600',
  blue: 'bg-blue-100 text-blue-600',
  amber: 'bg-amber-100 text-amber-700',
  green: 'bg-emerald-100 text-emerald-700',
};

/**
 * Tarjeta de métrica Bento: ícono en círculo de color suave a la izquierda del
 * título y la cifra en tipografía grande. `children` reemplaza la cifra cuando
 * la métrica se compone de varias (p. ej. desglose por tipo).
 */
export function StatCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = 'red',
  children,
}: {
  icon: LucideIcon;
  label: string;
  value?: ReactNode;
  detail?: ReactNode;
  tone?: StatTone;
  children?: ReactNode;
}) {
  return (
    <div className={`${card} p-6`}>
      <div className="flex items-center gap-2.5">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${TONE[tone]}`}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <p className="text-[15px] font-medium text-slate-700">{label}</p>
      </div>
      {children ?? (
        <div className="mt-4 flex items-baseline gap-2.5">
          <p className="text-3xl font-extrabold tabular-nums tracking-tight text-slate-900 md:text-[34px]">{value}</p>
          {detail && <p className="text-xs text-slate-500">{detail}</p>}
        </div>
      )}
    </div>
  );
}
