'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/**
 * Diálogo modal con fondo difuminado, cierre con Esc y foco inicial dentro del panel.
 * El panel nunca excede el 85 % del alto de la pantalla: el contenido hace scroll
 * por dentro y el `footer` (botones de acción) queda fijo y siempre visible.
 * Se monta en <body> (portal): un ancestro con animación de `transform` volvería
 * relativo a él el `position: fixed` y el diálogo quedaría recortado.
 */
export function Modal({
  title,
  description,
  onClose,
  footer,
  children,
}: {
  title: string;
  description?: string;
  onClose: () => void;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    panelRef.current?.querySelector<HTMLElement>('input, select, textarea, button:not([data-close])')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeRef.current();
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      prev?.focus();
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div aria-hidden onClick={onClose} className="absolute inset-0 animate-fade bg-navy/30 backdrop-blur-sm" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md max-h-[85vh] animate-pop overflow-y-auto overscroll-contain rounded-[28px] bg-white shadow-2xl ring-1 ring-slate-900/5"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-line bg-white/95 px-6 py-4 backdrop-blur">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-ink">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
          </div>
          <button
            type="button"
            data-close
            onClick={onClose}
            aria-label="Cerrar"
            className="-mr-2 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink-subtle transition-colors hover:bg-canvas hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
        {footer && (
          <div className="sticky bottom-0 z-10 flex justify-end gap-2 border-t border-line bg-white/95 px-6 py-4 backdrop-blur">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
