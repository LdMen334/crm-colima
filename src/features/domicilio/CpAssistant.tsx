'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { CheckCircle2, Info, Loader2, MapPin, SearchX } from 'lucide-react';
import type { HistoriaClinicaValues } from '@/features/historia-clinica/config/fields';
import { buscarCp } from '@/lib/inegi-cp';

type Status = 'idle' | 'buscando' | 'found' | 'notfound';

/**
 * Asistente de Código Postal (catálogo INEGI / SEPOMEX, ver lib/inegi-cp.ts).
 *
 * REGLA DE NEGOCIO: el CP vive SOLO en el estado local de este componente.
 * No se registra en React Hook Form, por lo que nunca se guarda en el
 * expediente ni puede aparecer en los PDF PECO / TX.
 *
 * Con 5 dígitos: rellena Estado y Municipio; con una sola colonia la escribe, y todas
 * se entregan en `onColonias` como sugerencias del campo Colonia, que acepta texto libre.
 * Si el CP no existe, los campos siguen 100 % editables a mano.
 */
export function CpAssistant({ onColonias }: { onColonias: (colonias: string[]) => void }) {
  const { setValue, getValues } = useFormContext<HistoriaClinicaValues>();
  const [cp, setCp] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [total, setTotal] = useState(0);
  const inputId = useId();
  /** Última colonia escrita por este asistente (no por el médico). */
  const autollenada = useRef('');

  useEffect(() => {
    if (cp.length !== 5) {
      setStatus('idle');
      onColonias([]);
      return;
    }
    let cancelled = false;
    setStatus('buscando');
    buscarCp(cp).then((info) => {
      if (cancelled) return;
      if (!info) {
        setStatus('notfound');
        onColonias([]);
        return;
      }
      const opts = { shouldDirty: true };
      setValue('domicilioEstado', info.estado, opts);
      setValue('domicilioMunicipio', info.municipio, opts);
      const actual = getValues('domicilioColonia');
      const capturadaAMano = actual !== '' && actual !== autollenada.current;
      if (info.colonias.length === 1 && !capturadaAMano) {
        setValue('domicilioColonia', info.colonias[0], opts);
        autollenada.current = info.colonias[0];
      } else if (!capturadaAMano && !info.colonias.includes(actual)) {
        // Venía de un CP anterior: se limpia para elegir o escribir la del nuevo CP
        setValue('domicilioColonia', '', opts);
        autollenada.current = '';
      }
      // Lo escrito a mano nunca se sobrescribe; las colonias quedan como sugerencias
      onColonias(info.colonias);
      setTotal(info.colonias.length);
      setStatus('found');
    });
    return () => {
      cancelled = true;
    };
  }, [cp, setValue, getValues, onColonias]);

  return (
    <div className="rounded-2xl border border-dashed border-blue-300/60 bg-blue-50/60 p-3.5 md:col-span-2 lg:col-span-3">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor={inputId} className="flex items-center gap-1.5 text-xs font-medium text-med-blue">
          <MapPin className="h-3.5 w-3.5" />
          Código postal
        </label>
        <input
          id={inputId}
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={5}
          value={cp}
          onChange={(e) => setCp(e.target.value.replace(/\D/g, '').slice(0, 5))}
          placeholder="28000"
          className="h-9 w-28 rounded-xl border border-slate-200/80 bg-white px-3 font-mono text-sm outline-none transition-[border-color,box-shadow] duration-200 focus:border-med-blue focus:ring-2 focus:ring-med-blue/25"
        />
        <span role="status" aria-live="polite" className="text-xs">
          {status === 'buscando' && <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-subtle" />}
          {status === 'found' && (
            <span className="flex animate-pop items-center gap-1 text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Ubicación encontrada por CP{total > 1 && ` · elige o escribe la colonia (${total} sugeridas)`}
            </span>
          )}
          {status === 'notfound' && (
            <span className="flex animate-pop items-center gap-1 text-amber-700">
              <SearchX className="h-3.5 w-3.5" />
              Código postal no encontrado: captura el domicilio a mano
            </span>
          )}
        </span>
        <span className="ml-auto flex items-center gap-1 text-[11px] text-ink-muted">
          <Info className="h-3 w-3" /> Asistente de captura: no se guarda ni se imprime
        </span>
      </div>
    </div>
  );
}
