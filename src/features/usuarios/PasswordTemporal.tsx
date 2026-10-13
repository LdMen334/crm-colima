'use client';

import { useEffect, useId, useState } from 'react';
import { Check, Copy, RefreshCw } from 'lucide-react';
import { inputBase } from '@/components/ui/styles';
import { generarPasswordTemporal, LONGITUD_TEMPORAL } from './password';

/**
 * Contraseña temporal visible (el administrador debe poder leerla y enviarla),
 * con "Generar" y "Copiar". Sin `onChange` se muestra solo para copiar.
 */
export function PasswordTemporal({ value, onChange }: { value: string; onChange?: (v: string) => void }) {
  const [copiada, setCopiada] = useState(false);
  const inputId = useId();

  useEffect(() => {
    if (!copiada) return;
    const t = setTimeout(() => setCopiada(false), 2000);
    return () => clearTimeout(t);
  }, [copiada]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Sin API de portapapeles (HTTP sin TLS): seleccionar y copiar a la antigua
      const input = document.getElementById(inputId) as HTMLInputElement | null;
      input?.select();
      document.execCommand('copy');
    }
    setCopiada(true);
  }

  const btn =
    'inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-slate-200/80 bg-white/90 px-3 text-xs font-semibold text-ink transition-[background-color,border-color,transform] duration-200 hover:border-slate-300 hover:bg-white active:scale-[0.97]';

  return (
    <div>
      <label htmlFor={inputId} className="mb-1.5 block text-xs font-medium text-ink-muted">
        Contraseña temporal
      </label>
      <input
          id={inputId}
          value={value}
          readOnly={!onChange}
          onChange={(e) => onChange?.(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          className={`${inputBase} font-mono tracking-wider`}
        />
      <div className={`mt-2 grid gap-2 ${onChange ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {onChange && (
          <button type="button" onClick={() => onChange(generarPasswordTemporal())} className={btn} title="Generar otra contraseña">
            <RefreshCw className="h-3.5 w-3.5" />
            Generar contraseña temporal
          </button>
        )}
        <button type="button" onClick={copiar} className={`${btn} ${copiada ? '!border-emerald-200 !bg-emerald-50 !text-emerald-700' : ''}`}>
          {copiada ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copiada ? 'Copiada' : 'Copiar contraseña'}
        </button>
      </div>
      {onChange && (
        <p className="mt-1 text-[11px] text-ink-subtle">
          {LONGITUD_TEMPORAL} caracteres con mayúsculas, minúsculas, números y símbolos. El usuario deberá cambiarla al entrar.
        </p>
      )}
      <span role="status" aria-live="polite" className="sr-only">
        {copiada ? 'Contraseña copiada al portapapeles' : ''}
      </span>
    </div>
  );
}
