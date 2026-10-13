'use client';

import { forwardRef, useEffect, useId, useRef, useState, type InputHTMLAttributes, type KeyboardEvent } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { normalize } from '@/features/historia-clinica/lib/format';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  /** Sugerencias; el texto libre siempre se acepta. */
  suggestions: readonly string[];
}

/**
 * Campo de texto con sugerencias (combobox "creatable"): muestra la lista anclada
 * justo debajo, la filtra mientras se escribe y acepta cualquier texto aunque no esté en ella.
 * Teclado: ↓ ↑ para moverse, Enter para elegir, Esc para cerrar sin cambiar el texto.
 */
export const Combobox = forwardRef<HTMLInputElement, Props>(function Combobox(
  { value, onChange, suggestions, className = '', onBlur, ...input },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [filtrar, setFiltrar] = useState(false); // al abrir se ven todas; al escribir se filtra
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const q = normalize(value);
  const visibles = filtrar && q ? suggestions.filter((s) => normalize(s).includes(q)) : suggestions;
  const mostrar = open && visibles.length > 0;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  useEffect(() => {
    if (mostrar && active >= 0) listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' });
  }, [mostrar, active]);

  function elegir(s: string) {
    onChange(s);
    setOpen(false);
    setFiltrar(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        setActive(0);
        return;
      }
      const delta = e.key === 'ArrowDown' ? 1 : -1;
      setActive((a) => Math.min(visibles.length - 1, Math.max(0, a + delta)));
    } else if (e.key === 'Enter' && mostrar && active >= 0) {
      e.preventDefault(); // no enviar el formulario al elegir
      elegir(visibles[active]);
    } else if (e.key === 'Escape' && open) {
      e.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        {...input}
        ref={ref}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={mostrar}
        aria-controls={listId}
        aria-activedescendant={mostrar && active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setFiltrar(true);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => suggestions.length && setOpen(true)}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className={`${className} ${suggestions.length ? 'pr-9' : ''}`}
      />
      {suggestions.length > 0 && (
        <button
          type="button"
          tabIndex={-1}
          aria-label="Ver sugerencias"
          onMouseDown={(e) => {
            e.preventDefault();
            setFiltrar(false);
            setOpen((o) => !o);
          }}
          className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-ink-subtle transition-colors hover:bg-slate-100 hover:text-ink"
        >
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ease-[var(--ease-out-soft)] ${mostrar ? 'rotate-180' : ''}`} />
        </button>
      )}

      {mostrar && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          className="absolute left-0 top-full z-50 mt-1 max-h-64 w-full min-w-48 origin-top animate-pop overflow-y-auto rounded-xl border border-slate-200/70 bg-white/95 p-1 shadow-pop backdrop-blur-xl"
        >
          {visibles.map((s, i) => {
            const selected = s === value;
            return (
              <li
                key={s}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={selected}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  elegir(s);
                }}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-sm text-ink transition-colors duration-100 ${
                  i === active ? 'bg-slate-100/80' : ''
                } ${selected ? 'font-medium' : ''}`}
              >
                <span>{s}</span>
                {selected && <Check className="h-3.5 w-3.5 text-crm-red" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
});
