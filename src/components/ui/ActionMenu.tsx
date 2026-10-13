'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, type LucideIcon } from 'lucide-react';

export interface ActionItem {
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  /** Acción destructiva (desactivar): se pinta en rojo. */
  danger?: boolean;
  disabled?: boolean;
  /** Motivo si está deshabilitada (se muestra como texto de ayuda). */
  hint?: string;
}

const ANCHO = 248;

/**
 * Menú de acciones (botón "⋯"). Se monta en <body> con posición fija anclada al botón,
 * para que no lo recorte el contenedor con scroll horizontal de la tabla.
 * Se alinea al borde derecho del botón y se abre hacia arriba si no cabe abajo.
 * Teclado: Enter/Espacio/↓ abre, ↑ ↓ Inicio Fin recorren, Esc cierra y devuelve el foco.
 */
export function ActionMenu({ label, items }: { label: string; items: ActionItem[] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; arriba: boolean } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const cerrar = useCallback((devolverFoco = true) => {
    setOpen(false);
    if (devolverFoco) btnRef.current?.focus();
  }, []);

  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    const alto = menuRef.current?.offsetHeight ?? 220;
    const arriba = r.bottom + 6 + alto > window.innerHeight && r.top - 6 - alto > 0;
    setPos({
      top: arriba ? r.top - 6 - alto : r.bottom + 6,
      left: Math.max(8, Math.min(r.right - ANCHO, window.innerWidth - ANCHO - 8)),
      arriba,
    });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not([disabled])')?.focus();
    const fuera = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !btnRef.current?.contains(t)) cerrar(false);
    };
    const mover = () => cerrar(false);
    document.addEventListener('mousedown', fuera);
    window.addEventListener('resize', mover);
    window.addEventListener('scroll', mover, true);
    return () => {
      document.removeEventListener('mousedown', fuera);
      window.removeEventListener('resize', mover);
      window.removeEventListener('scroll', mover, true);
    };
  }, [open, cerrar]);

  function onMenuKey(e: React.KeyboardEvent) {
    const opciones = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? [])];
    const i = opciones.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') opciones[(i + 1) % opciones.length]?.focus();
    else if (e.key === 'ArrowUp') opciones[(i - 1 + opciones.length) % opciones.length]?.focus();
    else if (e.key === 'Home') opciones[0]?.focus();
    else if (e.key === 'End') opciones.at(-1)?.focus();
    else if (e.key === 'Escape') cerrar();
    else if (e.key === 'Tab') cerrar(false);
    else return;
    if (e.key !== 'Tab') e.preventDefault();
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className={`grid h-9 w-9 place-items-center rounded-full transition-[background-color,color,transform] duration-200 active:scale-[0.94] ${
          open ? 'bg-slate-100 text-ink' : 'text-slate-500 hover:bg-slate-100 hover:text-ink'
        }`}
      >
        <MoreHorizontal className="h-[18px] w-[18px]" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={label}
            onKeyDown={onMenuKey}
            style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width: ANCHO }}
            className={`fixed z-[65] animate-pop rounded-2xl bg-white p-1.5 shadow-pop ring-1 ring-slate-900/5 ${
              pos?.arriba ? 'origin-bottom-right' : 'origin-top-right'
            }`}
          >
            {items.map((it, idx) => (
              <MenuItem
                key={it.label}
                item={it}
                separado={idx > 0 && !!it.danger && !items[idx - 1].danger}
                onSelect={() => {
                  cerrar();
                  it.onSelect();
                }}
              />
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

function MenuItem({ item, separado, onSelect }: { item: ActionItem; separado: boolean; onSelect: () => void }): ReactNode {
  const { icon: Icon, label, danger, disabled, hint } = item;
  return (
    <>
      {separado && <div role="separator" className="mx-2 my-1 h-px bg-slate-100" />}
      <button
        type="button"
        role="menuitem"
        disabled={disabled}
        onClick={onSelect}
        className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2 text-left text-sm outline-none transition-colors duration-100 disabled:cursor-not-allowed disabled:opacity-50 ${
          danger ? 'text-red-600 hover:bg-red-50 focus-visible:bg-red-50' : 'text-ink hover:bg-slate-100/80 focus-visible:bg-slate-100/80'
        }`}
      >
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="min-w-0">
          <span className="block font-medium">{label}</span>
          {hint && <span className="block text-[11px] leading-snug text-ink-subtle">{hint}</span>}
        </span>
      </button>
    </>
  );
}
