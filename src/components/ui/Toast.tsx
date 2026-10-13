'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, X } from 'lucide-react';

/**
 * Aviso de confirmación en la esquina inferior; se cierra solo.
 * Se monta en <body> para que ningún ancestro animado atrape el `position: fixed`.
 */
export function Toast({ message, onClose, duration = 4000 }: { message: string; onClose: () => void; duration?: number }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const t = setTimeout(() => closeRef.current(), duration);
    return () => clearTimeout(t);
  }, [message, duration]);

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] right-5 z-[70] flex w-[min(380px,calc(100vw-2.5rem))] animate-pop items-center gap-3 rounded-xl border border-slate-200/70 bg-white/95 p-3.5 shadow-pop backdrop-blur-xl"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700">
        <CheckCircle2 className="h-4 w-4" />
      </span>
      <p className="min-w-0 flex-1 text-sm font-medium text-ink">{message}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar aviso"
        className="grid h-7 w-7 place-items-center rounded-lg text-ink-subtle transition-colors hover:bg-slate-100 hover:text-ink"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>,
    document.body,
  );
}
