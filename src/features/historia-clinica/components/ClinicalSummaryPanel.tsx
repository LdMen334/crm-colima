'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import { Activity, HeartPulse, Scale, Thermometer, UserRound } from 'lucide-react';
import { FIELDS, type HistoriaClinicaValues } from '../config/fields';
import { formatFechaMx } from '../lib/format';

const NUTRI_TONE: Record<string, string> = {
  'BAJO PESO': 'bg-amber-50 text-amber-800',
  'PESO NORMAL': 'bg-emerald-50 text-emerald-700',
  SOBREPESO: 'bg-amber-50 text-amber-800',
  'OBESIDAD I': 'bg-orange-50 text-orange-700',
  'OBESIDAD II': 'bg-red-50 text-red-700',
  'OBESIDAD III': 'bg-red-100 text-red-800',
};

export function ClinicalSummaryPanel() {
  const { control } = useFormContext<HistoriaClinicaValues>();
  const v = useWatch({ control }) as Partial<HistoriaClinicaValues>;
  const filled = FIELDS.filter((f) => (v[f.key] ?? '').toString().trim()).length;
  const pct = Math.round((filled / FIELDS.length) * 100);

  return (
    <aside className="space-y-4 xl:sticky xl:top-24">
      {/* Paciente */}
      <div className="rounded-[28px] bg-white p-6 shadow-card">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-red-100">
            <UserRound strokeWidth={1.75} className="h-5 w-5 text-crm-red" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-ink">{v.nombreCompleto || 'Paciente sin nombre'}</p>
            <p className="text-xs text-ink-muted">Folio {v.folio || '—'}</p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5 text-xs">
          <Info label="CURP" value={v.curp} mono />
          <Info label="NSS" value={v.nss} mono />
          <Info label="Nacimiento" value={v.fechaNacimiento ? formatFechaMx(v.fechaNacimiento) : ''} />
          <Info label="Edad" value={v.edad ? `${v.edad} años · ${v.grupoEdad}` : ''} />
          <Info label="Empresa" value={v.empresa} />
          <Info label="Puesto" value={v.puesto} />
        </dl>
      </div>

      {/* Métricas clínicas */}
      <div className="grid grid-cols-2 gap-4">
        <Metric icon={Scale} label="IMC" value={v.imc} unit="kg/m²" tag={v.estadoNutricional} tone={NUTRI_TONE} tint="blue" />
        <Metric icon={HeartPulse} label="Presión arterial" value={v.taConjunta} unit="mmHg" tag={v.clasificacionAha} tone={{}} tint="red" />
        <Metric icon={Activity} label="Pulso" value={v.pulso} unit="lpm" tint="amber" />
        <Metric icon={Thermometer} label="Temperatura" value={v.temperatura} unit="°C" tint="green" />
      </div>

      {/* Avance */}
      <div className="rounded-[28px] bg-white p-6 shadow-card">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-medium text-ink-muted">Avance del expediente</p>
          <p className="text-sm font-semibold tabular-nums text-ink">
            {filled}<span className="text-ink-subtle">/{FIELDS.length}</span>
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-well">
          <div className="h-full rounded-full bg-crm-red transition-[width] duration-500 ease-[var(--ease-out-soft)]" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-2 text-[11px] text-ink-subtle">Todos los campos son opcionales.</p>
      </div>
    </aside>
  );
}

function Info({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-ink-subtle">{label}</dt>
      <dd className={`truncate font-medium text-ink ${mono ? 'font-mono text-[11px]' : ''}`}>{value || '—'}</dd>
    </div>
  );
}

/** Color del círculo del ícono por métrica (Bento: círculo suave + ícono del mismo tono). */
const TINTS = {
  blue: 'bg-blue-100 text-blue-600',
  red: 'bg-red-100 text-red-600',
  amber: 'bg-amber-100 text-amber-700',
  green: 'bg-emerald-100 text-emerald-700',
} as const;

function Metric({
  icon: Icon,
  label,
  value,
  unit,
  tag,
  tone,
  tint,
}: {
  tint: keyof typeof TINTS;
  icon: typeof Scale;
  label: string;
  value?: string;
  unit: string;
  tag?: string;
  tone?: Record<string, string>;
}) {
  return (
    <div className="rounded-[28px] bg-white p-5 shadow-card">
      <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${TINTS[tint]}`}>
          <Icon strokeWidth={1.75} className="h-4 w-4" />
        </span>
        {label}
      </div>
      <p className="mt-3 text-2xl font-extrabold tabular-nums tracking-tight text-slate-900">
        {value || '—'}
        {value && <span className="ml-1 text-[11px] font-normal text-ink-subtle">{unit}</span>}
      </p>
      {tag && tone && (
        <span className={`mt-2 inline-block rounded-full border border-current/15 px-2.5 py-0.5 text-[10px] font-semibold ${tone[tag] ?? 'bg-canvas text-ink-muted'}`}>
          {tag}
        </span>
      )}
    </div>
  );
}
