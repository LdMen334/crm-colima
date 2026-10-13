'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
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
  const navRef = useRef<HTMLElement>(null);

  // La pestaña activa siempre a la vista (también cuando se llega por un error de validación)
  useEffect(() => {
    navRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [tab]);
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

  return (
    <section className={`${card} min-w-0`}>
      <nav ref={navRef} className="no-scrollbar m-3 flex gap-1 overflow-x-auto rounded-full bg-well p-1.5" role="tablist" aria-label="Módulos de la historia clínica">
        {TABS.map((t) => {
          const active = t.id === tab;
          const p = progress[t.id];
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`relative flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors duration-200 active:scale-[0.98] ${
                active ? 'text-white' : 'text-slate-500 hover:bg-white hover:text-slate-800'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="tab-activa"
                  transition={{ type: 'spring', stiffness: 520, damping: 40 }}
                  className="absolute inset-0 rounded-full bg-crm-red shadow-md shadow-red-500/20"
                />
              )}
              <span className="relative">{t.label}</span>
              <span
                className={`relative rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums ${
                  active ? 'bg-white/20 text-white' : p.filled === p.total ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-slate-400'
                }`}
              >
                {p.filled}/{p.total}
              </span>
            </button>
          );
        })}
      </nav>

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
