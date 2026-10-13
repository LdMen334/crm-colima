'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export type SelectOption = string | { value: string; label: string };

interface Props {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  /** Texto simple, o `{ value, label }` cuando lo visible difiere de lo que se guarda. */
  options: readonly SelectOption[];
  /** Texto de la opción vacía (todos los campos son opcionales). */
  emptyLabel?: string;
  placeholder?: string;
  className?: string;
  'aria-label'?: string;
}

/**
 * Lista desplegable anclada justo debajo del control (side="bottom", align="start"),
 * a diferencia del <select> nativo, que en macOS / iOS se centra sobre la pantalla.
 * Teclado: ↑ ↓ Inicio Fin para moverse, Enter / Espacio para elegir, Esc para cerrar,
 * y escribir letras salta a la primera opción que empiece así.
 */
export function Select({
  id,
  value,
  onChange,
  onBlur,
  options,
  emptyLabel = 'Sin especificar',
  placeholder = 'Seleccionar…',
  className = '',
  'aria-label': ariaLabel,
}: Props) {
  const all = ['', ...options].map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  const values = all.map((o) => o.value);
  // Un valor guardado que ya no está en la lista (p. ej. un médico dado de baja) se sigue mostrando tal cual
  const shown = all.find((o) => o.value === value)?.label ?? value;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: '', at: 0 });
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open, onBlur]);

  // Mantener visible la opción activa al navegar con teclado
  useEffect(() => {
    if (open) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  function openList() {
    setActive(Math.max(0, values.indexOf(value)));
    setOpen(true);
  }

  function choose(i: number) {
    onChange(all[i].value);
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    const last = all.length - 1;
    if (e.key === 'ArrowDown') setActive((a) => Math.min(last, a + 1));
    else if (e.key === 'ArrowUp') setActive((a) => Math.max(0, a - 1));
    else if (e.key === 'Home') setActive(0);
    else if (e.key === 'End') setActive(last);
    else if (e.key === 'Enter' || e.key === ' ') choose(active);
    else if (e.key === 'Escape' || e.key === 'Tab') {
      setOpen(false);
      if (e.key === 'Tab') return;
    } else if (e.key.length === 1) {
      const now = Date.now();
      typed.current.text = (now - typed.current.at > 600 ? '' : typed.current.text) + e.key.toLowerCase();
      typed.current.at = now;
      const hit = all.findIndex((o, i) => i > 0 && o.label.toLowerCase().startsWith(typed.current.text));
      if (hit >= 0) setActive(hit);
    } else return;
    e.preventDefault();
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        aria-label={ariaLabel}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={`flex items-center justify-between gap-2 text-left ${className} ${open ? '!border-crm-red ring-2 ring-crm-red/25' : ''}`}
      >
        <span className={`truncate ${value ? '' : 'text-ink-subtle'}`}>{shown || placeholder}</span>
        <ChevronDown
          strokeWidth={1.75}
          className={`h-4 w-4 shrink-0 text-ink-subtle transition-transform duration-200 ease-[var(--ease-out-soft)] ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1 max-h-64 w-full min-w-48 origin-top animate-pop overflow-y-auto rounded-xl border border-slate-200/70 bg-white/95 p-1 shadow-pop backdrop-blur-xl"
        >
          {all.map((o, i) => {
            const selected = o.value === value;
            return (
              <li
                key={o.value || '__vacio'}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(i);
                }}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm transition-colors duration-100 ${
                  i === active ? 'bg-slate-100/80' : ''
                } ${o.value ? 'text-ink' : 'text-ink-subtle'} ${selected ? 'font-medium' : ''}`}
              >
                <span>{o.value ? o.label : emptyLabel}</span>
                {selected && <Check className="h-3.5 w-3.5 text-crm-red" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
