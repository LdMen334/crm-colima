'use client';

import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { Ban, CalendarDays, Lock } from 'lucide-react';
import { useRef } from 'react';
import { Combobox } from '@/components/ui/Combobox';
import { Select } from '@/components/ui/Select';
import { useMedicos } from '@/features/usuarios/useMedicos';
import { etiquetaMedico } from '../config/medicos';
import { inputBase, inputReadOnly } from '@/components/ui/styles';
import { CATALOGOS } from '../config/catalogs';
import { NO_APTO, type FieldDef, type FieldKey, type HistoriaClinicaValues } from '../config/fields';
import { formatFechaMx } from '../lib/format';
import { sumarMeses } from '../lib/calculations';

/**
 * Campos que el sistema asigna y nadie captura: el folio consecutivo y la
 * fecha de realización (el día en que se crea la historia).
 */
export const SYSTEM_FIELDS: ReadonlySet<FieldKey> = new Set(['folio', 'fechaEstudios']);

interface Props {
  field: FieldDef;
  onBlur?: () => void;
  /** Sugerencias en tiempo de ejecución (p. ej. colonias del CP); el campo sigue aceptando texto libre. */
  suggestions?: readonly string[];
  hint?: string;
}

export function FieldRenderer({ field, onBlur, suggestions, hint }: Props) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<HistoriaClinicaValues>();
  const id = `f-${field.key}`;
  const error = errors[field.key]?.message;
  const wide = field.type === 'textarea';

  let widget: React.ReactNode;
  if (SYSTEM_FIELDS.has(field.key)) {
    widget = <SystemValue id={id} field={field} />;
  } else {
    const especial =
      field.key === 'medicoDictaminador'
        ? 'medico'
        : field.key === 'domicilioColonia'
          ? 'colonia'
          : field.key === 'fechaSiguienteValoracion'
            ? 'valoracion'
            : field.type;
    switch (especial) {
      case 'medico':
        widget = <MedicoSelect id={id} />;
        break;
      case 'colonia':
        widget = (
          <Controller
            control={control}
            name="domicilioColonia"
            render={({ field: f }) => (
              <Combobox
                id={id}
                ref={f.ref}
                value={f.value ?? ''}
                onChange={f.onChange}
                onBlur={f.onBlur}
                suggestions={suggestions ?? []}
                placeholder={suggestions?.length ? 'Elige o escribe la colonia' : undefined}
                className={inputBase}
              />
            )}
          />
        );
        break;
      case 'valoracion':
        widget = <FechaONoApto id={id} />;
        break;
      case 'textarea':
        widget = (
          <textarea id={id} rows={3} {...register(field.key)} className={`${inputBase} h-auto min-h-20 py-2 leading-relaxed`} />
        );
        break;
      case 'select':
        widget = (
          <Controller
            control={control}
            name={field.key}
            render={({ field: f }) => (
              <Select
                id={id}
                value={f.value ?? ''}
                onChange={f.onChange}
                onBlur={f.onBlur}
                options={field.catalog ? CATALOGOS[field.catalog] : []}
                className={inputBase}
              />
            )}
          />
        );
        break;
      case 'computed':
        widget = <input id={id} readOnly tabIndex={-1} {...register(field.key)} className={inputReadOnly} />;
        break;
      case 'number':
        widget = (
          <div className="relative">
            <input
              id={id}
              type="text"
              inputMode="decimal"
              {...register(field.key, onBlur ? { onBlur } : undefined)}
              className={`${inputBase} ${field.unit ? 'pr-14' : ''} tabular-nums`}
            />
            {field.unit && (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ink-subtle">
                {field.unit}
              </span>
            )}
          </div>
        );
        break;
      default: {
        // Texto con catálogo → sugerencias (datalist) sin impedir texto libre
        const suggestId = field.catalog ? `${id}-sugerencias` : undefined;
        const upper = field.key === 'curp';
        widget = (
          <>
            <input
              id={id}
              type={field.type === 'date' ? 'date' : field.type === 'tel' ? 'tel' : 'text'}
              inputMode={field.key === 'nss' ? 'numeric' : undefined}
              maxLength={upper ? 18 : undefined}
              list={suggestId}
              autoComplete="off"
              {...register(field.key, { ...(upper && { setValueAs: (v: string) => v.toUpperCase() }), ...(onBlur && { onBlur }) })}
              className={`${inputBase} ${upper || field.key === 'nss' ? 'font-mono tracking-wide' : ''} ${upper ? 'uppercase' : ''}`}
            />
            {suggestId && field.catalog && (
              <datalist id={suggestId}>
                {CATALOGOS[field.catalog].map((o) => (
                  <option key={o} value={o} />
                ))}
              </datalist>
            )}
          </>
        );
      }
    }
  }

  return (
    <div className={`min-w-0 ${wide ? 'md:col-span-2 lg:col-span-3' : ''}`}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline gap-1.5 text-xs font-medium text-slate-500">
        <span className={`font-mono text-[10px] ${field.n > 1000 ? 'text-med-blue' : 'text-ink-subtle'}`}>{field.code}</span>
        <span className="truncate">{field.label}</span>
      </label>
      <div className={error ? '[&_input]:!border-crm-red [&_input]:!ring-2 [&_input]:!ring-crm-red/20' : ''}>{widget}</div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 text-[11px] font-medium text-crm-red-dark">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-[11px] text-ink-subtle">{hint}</p>
      )}
    </div>
  );
}

/** Folio y fecha: visibles, no editables y fuera del orden de tabulación. */
function SystemValue({ id, field }: { id: string; field: FieldDef }) {
  const value = useWatch<HistoriaClinicaValues>({ name: field.key }) as string;
  const shown = field.type === 'date' ? formatFechaMx(value ?? '', '/') : value;
  return (
    <div className="relative">
      <input
        id={id}
        readOnly
        tabIndex={-1}
        aria-readonly="true"
        value={shown ?? ''}
        className={`${inputReadOnly} pr-9 ${field.key === 'folio' ? 'font-mono' : ''}`}
      />
      <Lock aria-hidden strokeWidth={1.75} className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-subtle" />
    </div>
  );
}

/**
 * "Médico que atiende": usuarios registrados con cédula y universidad. Se guarda el
 * nombre (lo que imprime el PDF) y se muestra "Nombre - Cédula: … (Universidad)".
 */
function MedicoSelect({ id }: { id: string }) {
  const { control } = useFormContext<HistoriaClinicaValues>();
  const medicos = useMedicos();
  return (
    <Controller
      control={control}
      name="medicoDictaminador"
      render={({ field: f }) => (
        <Select
          id={id}
          value={f.value ?? ''}
          onChange={f.onChange}
          onBlur={f.onBlur}
          options={medicos.map((m) => ({ value: m.nombre, label: etiquetaMedico(m) }))}
          placeholder="Seleccionar médico…"
          className={inputBase}
        />
      )}
    />
  );
}

/**
 * R2 "Fecha de siguiente valoración": una fecha o la leyenda NO APTO.
 * Marcar NO APTO deshabilita el calendario; al desmarcar se recupera la fecha anterior
 * (o la sugerida: fecha de estudios + 6 meses).
 * El valor se guarda y se exporta tal cual ("AAAA-MM-DD" o "NO APTO").
 */
function FechaONoApto({ id }: { id: string }) {
  const { control, setValue, getValues } = useFormContext<HistoriaClinicaValues>();
  const fechaPrevia = useRef('');
  return (
    <Controller
      control={control}
      name="fechaSiguienteValoracion"
      render={({ field: f }) => {
        const noApto = f.value === NO_APTO;
        return (
          <div className="flex items-stretch gap-2">
            {noApto ? (
              // Calendario deshabilitado: se muestra la leyenda que se guardará e imprimirá
              <input
                id={id}
                disabled
                value={NO_APTO}
                aria-label="Fecha de siguiente valoración: NO APTO"
                className={`${inputBase} min-w-0 flex-1 cursor-not-allowed !border-red-200 !bg-red-50/60 font-semibold tracking-wide text-red-700`}
              />
            ) : (
              <input
                id={id}
                type="date"
                ref={f.ref}
                value={f.value ?? ''}
                onChange={(e) => f.onChange(e.target.value)}
                onBlur={f.onBlur}
                className={`${inputBase} min-w-0 flex-1`}
              />
            )}
            <button
              type="button"
              aria-pressed={noApto}
              onClick={() => {
                if (noApto) {
                  // Sin fecha previa (p. ej. al reabrir un expediente NO APTO): la sugerida, estudios + 6 meses
                  const fecha = fechaPrevia.current || sumarMeses(getValues('fechaEstudios'), 6) || '';
                  setValue('fechaSiguienteValoracion', fecha, { shouldDirty: true });
                } else {
                  fechaPrevia.current = f.value ?? '';
                  setValue('fechaSiguienteValoracion', NO_APTO, { shouldDirty: true });
                }
              }}
              title={noApto ? 'Quitar NO APTO y volver a la fecha' : 'Marcar como NO APTO'}
              className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.97] ${
                noApto
                  ? 'border-slate-200/80 bg-white/90 text-ink hover:border-slate-300'
                  : 'border-slate-200/80 bg-white/90 text-ink-muted hover:border-red-200 hover:bg-red-50 hover:text-red-700'
              }`}
            >
              {noApto ? <CalendarDays className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />}
              {noApto ? 'Usar fecha' : 'NO APTO'}
            </button>
          </div>
        );
      }}
    />
  );
}
