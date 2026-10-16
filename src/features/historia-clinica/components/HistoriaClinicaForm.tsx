'use client';

import { useMemo, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { ChevronDown } from 'lucide-react';
import { card } from '@/components/ui/styles';
import { FIELD_BY_N, type FieldKey, type HistoriaClinicaValues } from '../config/fields';
import { SECTIONS, TABS, sectionsOf, type SectionDef, type TabId } from '../config/sections';
import { CpAssistant } from '@/features/domicilio/CpAssistant';
import { FieldRenderer } from './FieldRenderer';
import { AudiometriaGrid } from './AudiometriaGrid';

/** Acciones al salir de un campo (p. ej. talla → metros, CURP/NSS → paciente recurrente). */
export type BlurHandlers = Partial<Record<FieldKey, () => void>>;

export function HistoriaClinicaForm({
  onFieldBlur,
  tab,
  onTabChange: setTab,
}: {
  onFieldBlur: BlurHandlers;
  /** La pestaña vive en el workspace para poder llevar al médico al campo con error. */
  tab: TabId;
  onTabChange: (tab: TabId) => void;
}) {
  const { control } = useFormContext<HistoriaClinicaValues>();
  const values = useWatch({ control }) as Partial<HistoriaClinicaValues>;

  // Avance por pestaña (campos capturados / total)
  const progress = useMemo(() => {
    const out = {} as Record<TabId, { filled: number; total: number }>;
    for (const t of TABS) out[t.id] = { filled: 0, total: 0 };
    for (const s of SECTIONS) {
      for (const n of s.fields) {
        const f = FIELD_BY_N.get(n)!;
        out[s.tab].total++;
        if ((values[f.key] ?? '').toString().trim()) out[s.tab].filled++;
      }
    }
    return out;
  }, [values]);

  const tabActual = TABS.find((t) => t.id === tab)!;
  const progresoActual = progress[tab];

  return (
    <section className={`${card} min-w-0`}>
      <div className="relative m-3">
        <label htmlFor="tab-select" className="sr-only">
          Módulo de la historia clínica
        </label>
        <select
          id="tab-select"
          aria-label="Módulo de la historia clínica"
          value={tab}
          onChange={(e) => setTab(e.target.value as TabId)}
          className="w-full cursor-pointer appearance-none rounded-full bg-crm-red py-2.5 pl-5 pr-11 text-sm font-semibold text-white shadow-md shadow-red-500/20 outline-none transition-colors duration-200 focus:ring-2 focus:ring-crm-red/35"
        >
          {TABS.map((t) => {
            const p = progress[t.id];
            return (
              <option key={t.id} value={t.id} className="bg-white text-ink">
                {t.label} · {p.filled}/{p.total}
              </option>
            );
          })}
        </select>
        <ChevronDown
          strokeWidth={2}
          aria-hidden
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white"
        />
        {progresoActual.filled === progresoActual.total && (
          <span className="pointer-events-none absolute right-10 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white sm:inline-block">
            Completo
          </span>
        )}
      </div>
      <p className="mx-3 mb-2 text-xs text-ink-subtle">{tabActual.label}: {progresoActual.filled} de {progresoActual.total} campos capturados.</p>

      <div key={tab} className="animate-fade space-y-3 px-3 pb-3 sm:px-4 sm:pb-4" role="tabpanel">
        {sectionsOf(tab).map((s, i) => (
          <Section key={s.id} section={s} defaultOpen={i < 2} onFieldBlur={onFieldBlur} />
        ))}
      </div>
    </section>
  );
}

function Section({ section, defaultOpen, onFieldBlur }: { section: SectionDef; defaultOpen: boolean; onFieldBlur: BlurHandlers }) {
  // Colonias del CP capturado: se sugieren en el campo Colonia, que sigue aceptando texto libre
  const [colonias, setColonias] = useState<string[]>([]);
  const fields = section.fields.map((n) => FIELD_BY_N.get(n)!);

  return (
    <details open={defaultOpen} className="group rounded-[22px] bg-well transition-colors duration-200 hover:bg-[#F2F3FA]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-[22px] px-5 py-4 [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-2.5">
          <span className="h-2 w-2 rounded-full bg-crm-red shadow-[0_0_0_3px_rgba(227,27,35,0.12)]" />
          <span className="text-sm font-semibold text-ink">{section.title}</span>
          <span className="font-mono text-[10px] text-ink-subtle">
            {fields[0].code}–{fields[fields.length - 1].code}
          </span>
        </span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-slate-500 shadow-sm">
          <ChevronDown strokeWidth={1.75} className="h-4 w-4 transition-transform duration-300 ease-[var(--ease-out-soft)] group-open:rotate-180" />
        </span>
      </summary>

      <div className="grid grid-cols-1 gap-5 px-5 pb-5 pt-1 md:grid-cols-2 lg:grid-cols-3">
        {section.layout === 'audiogram' ? (
          <AudiometriaGrid />
        ) : (
          <>
            {section.layout === 'address' && <CpAssistant onColonias={setColonias} />}
            {fields.map((f) => (
              <FieldRenderer
                key={f.key}
                field={f}
                suggestions={f.key === 'domicilioColonia' ? colonias : undefined}
                onBlur={onFieldBlur[f.key]}
                hint={f.key === 'talla' ? 'Acepta metros (1.70) o centímetros (170).' : undefined}
              />
            ))}
          </>
        )}
      </div>
    </details>
  );
}
