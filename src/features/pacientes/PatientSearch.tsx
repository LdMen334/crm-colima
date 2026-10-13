'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Loader2, Search, UserRound } from 'lucide-react';
import { searchPacientes, type PacienteBusqueda } from './api';

export function PatientSearch({ onSelect }: { onSelect: (p: PacienteBusqueda) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PacienteBusqueda[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const boxRef = useRef<HTMLDivElement>(null);

  // Búsqueda con debounce
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    let cancelled = false;
    const t = setTimeout(async () => {
      const r = await searchPacientes(query);
      if (!cancelled) {
        setResults(r);
        setActive(0);
        setLoading(false);
      }
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  function choose(p: PacienteBusqueda) {
    onSelect(p);
    setQuery(p.nombreCompleto);
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative w-full max-w-xl">
      <div className="flex h-11 items-center gap-2 rounded-full bg-white px-4 shadow-card ring-1 ring-slate-200/60 transition-shadow focus-within:ring-2 focus-within:ring-crm-red/25">
        <Search className="h-4 w-4 text-ink-subtle" />
        <input
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls={listId}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (!results.length) return;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => (a + 1) % results.length);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => (a - 1 + results.length) % results.length);
            } else if (e.key === 'Enter') {
              e.preventDefault();
              choose(results[active]);
            } else if (e.key === 'Escape') setOpen(false);
          }}
          placeholder="Buscar paciente por CURP, NSS o nombre completo"
          className="w-full bg-transparent text-sm outline-none placeholder:text-ink-subtle"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-ink-subtle" />}
      </div>

      {open && results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-line bg-white py-1 shadow-xl"
        >
          {results.map((p, i) => (
            <li
              key={p.id}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(p);
              }}
              className={`flex cursor-pointer items-center gap-3 px-3 py-2.5 ${i === active ? 'bg-med-blue-soft' : ''}`}
            >
              <span className="grid h-8 w-8 place-items-center rounded-full bg-canvas">
                <UserRound className="h-4 w-4 text-ink-muted" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-ink">{p.nombreCompleto}</span>
                <span className="block font-mono text-[11px] text-ink-muted">
                  CURP {p.curp} · NSS {p.nss}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {open && !loading && query.trim().length >= 2 && results.length === 0 && (
        <p className="absolute z-30 mt-2 w-full rounded-xl border border-line bg-white px-3 py-3 text-sm text-ink-muted shadow-xl">
          Sin coincidencias. Captura los datos como paciente nuevo.
        </p>
      )}
    </div>
  );
}
