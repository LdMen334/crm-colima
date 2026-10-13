'use client';

import { Menu } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { useSidebar } from './sidebar-state';

/**
 * Barra superior flotante de cristal con la titulación oficial. No navega:
 * en móvil/tablet solo abre el sidebar como cajón.
 */
export function InstitutionalHeader() {
  const { mobileOpen, setMobileOpen } = useSidebar();
  const hoy = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  const today = hoy.charAt(0).toUpperCase() + hoy.slice(1); // "Viernes, 9 de octubre"

  return (
    <header className="sticky top-3 z-40 mx-3 mt-3 rounded-full bg-white/95 shadow-card ring-1 ring-black/[0.02] backdrop-blur-md sm:mx-6">
      <div className="flex h-14 items-center gap-3 pl-2 pr-5 sm:pl-6">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={mobileOpen}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-ink transition-[background-color,transform] duration-200 hover:bg-slate-100 active:scale-[0.94] lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="lg:hidden">
          <Logo height={34} />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-ink">Coordinación de Servicios Médicos</p>
          <p className="truncate text-xs text-ink-muted">Cruz Roja Mexicana, Delegación Estatal Colima</p>
        </div>
        <p className="ml-auto hidden shrink-0 rounded-full bg-well px-4 py-2 text-xs font-medium text-slate-600 md:block">{today}</p>
      </div>
    </header>
  );
}
