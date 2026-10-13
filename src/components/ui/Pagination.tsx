'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Pie de tabla: rango mostrado y botones tipo píldora. `page` empieza en 0. */
export function Pagination({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);
  const btn =
    'inline-flex h-8 items-center gap-1 rounded-full border border-slate-200/80 bg-white/90 px-3 text-xs font-medium text-ink-muted transition-[background-color,color,transform] duration-200 hover:bg-white hover:text-ink active:scale-[0.96] disabled:pointer-events-none disabled:opacity-40';

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-ink-muted">
      <span className="tabular-nums">
        {from}–{to} de {total}
      </span>
      <div className="flex items-center gap-2">
        <button type="button" className={btn} onClick={() => onPage(page - 1)} disabled={page === 0} aria-label="Página anterior">
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.75} /> Anterior
        </button>
        <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium tabular-nums text-ink">
          {page + 1} / {pages}
        </span>
        <button
          type="button"
          className={btn}
          onClick={() => onPage(page + 1)}
          disabled={page >= pages - 1}
          aria-label="Página siguiente"
        >
          Siguiente <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
