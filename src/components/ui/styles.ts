/** Clases compartidas (Bento Soft UI): tarjetas blancas muy redondeadas, controles en cápsula. */

const focus =
  'outline-none transition-[border-color,box-shadow,background-color] duration-200 ease-[var(--ease-out-soft)] placeholder:text-ink-subtle hover:border-slate-300 focus:border-crm-red focus:bg-white focus:ring-2 focus:ring-crm-red/20 focus-visible:border-crm-red focus-visible:ring-2 focus-visible:ring-crm-red/25';

/** Campos del formulario clínico: esquinas suaves (no cápsula) para captura densa. */
export const inputBase = `h-11 w-full rounded-2xl border border-slate-200/80 bg-white px-3.5 text-sm text-ink ${focus}`;

/** Filtros, buscadores y selects de barra de herramientas: cápsula completa. */
export const inputPill = `h-11 w-full rounded-full border border-slate-200/70 bg-well px-4 text-sm text-ink ${focus}`;

/** Solo lectura (calculados y asignados por el sistema): mismo tamaño, borde punteado, sin foco de edición. */
export const inputReadOnly =
  'h-11 w-full cursor-default rounded-2xl border border-dashed border-slate-300/80 bg-white/60 px-3.5 text-sm font-medium text-slate-700 outline-none tabular-nums';

const press = 'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60';

/** Acción principal: rojo institucional sólido en cápsula. */
export const btnPrimary = `inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-crm-red px-5 text-sm font-semibold text-white shadow-md shadow-red-500/20 transition-[background-color,box-shadow,transform] duration-200 ease-[var(--ease-out-soft)] hover:bg-crm-red-dark hover:shadow-lg hover:shadow-red-500/25 ${press}`;

export const btnSecondary = `inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-sm font-medium text-ink shadow-card ring-1 ring-slate-200/70 transition-[background-color,box-shadow,transform] duration-200 hover:bg-slate-50 ${press}`;

export const btnDark = `inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-navy px-5 text-sm font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-navy-2 ${press}`;

/** Tarjeta Bento: blanco puro, esquinas de 28 px, sombra difusa, sin borde. */
export const card = 'rounded-[28px] bg-white shadow-card';

/** Cápsula de pestaña / filtro: activa en rojo sólido, inactiva gris discreta. */
export const pillTab = (active: boolean) =>
  `inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ease-[var(--ease-out-soft)] active:scale-[0.98] ${
    active ? 'bg-crm-red text-white shadow-md shadow-red-500/20' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
  }`;

/** Encabezado de tabla: mayúsculas discretas. */
export const th = 'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400';

/** Fila de tabla con resalte suave al pasar el cursor. */
export const tr = 'border-b border-slate-100 transition-colors duration-150 last:border-0 hover:bg-slate-50/80';
