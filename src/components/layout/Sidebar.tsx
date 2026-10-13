'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import { LogOut, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { Pulse } from '@/components/brand/Pulse';
import { useAuth } from '@/features/auth/AuthProvider';
import { can } from '@/features/auth/permissions';
import { ROLE_LABEL } from '@/features/auth/types';
import { isActive, NAV_GROUPS } from './nav';
import { useSidebar } from './sidebar-state';

const SPRING = { type: 'spring', stiffness: 520, damping: 38, mass: 0.8 } as const;

const iniciales = (nombre: string) =>
  nombre
    .replace(/^(DRA?\.|LIC\.|MTRO\.)\s*/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

const SURFACE =
  'flex-col overflow-hidden bg-gradient-to-b from-navy-2 via-navy to-[#081B33] text-slate-300 shadow-[0_24px_60px_-20px_rgba(11,37,69,0.55),inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-white/5';

/**
 * Única navegación de la aplicación.
 *  - Escritorio: panel flotante colapsable (texto completo ↔ solo íconos).
 *  - Móvil/tablet: el mismo panel como cajón deslizable, abierto desde el encabezado.
 */
export function Sidebar() {
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const pathname = usePathname();

  // Al navegar desde el cajón móvil, cerrarlo
  useEffect(() => setMobileOpen(false), [pathname, setMobileOpen]);

  return (
    <>
      <aside
        className={`sticky top-3 m-3 mr-0 hidden h-[calc(100dvh-1.5rem)] shrink-0 rounded-[28px] transition-[width] duration-300 ease-in-out lg:flex ${SURFACE} ${
          collapsed ? 'w-20' : 'w-[272px]'
        }`}
      >
        <LayoutGroup id="sidebar">
          <SidebarContent compact={collapsed} onToggle={toggleCollapsed} />
        </LayoutGroup>
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              aria-hidden
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-navy/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Menú principal"
              className={`absolute inset-y-3 left-3 flex w-[min(288px,calc(100vw-1.5rem))] rounded-[28px] ${SURFACE}`}
              initial={{ x: '-110%' }}
              animate={{ x: 0 }}
              exit={{ x: '-110%' }}
              transition={{ type: 'spring', stiffness: 420, damping: 40 }}
            >
              <LayoutGroup id="sidebar-movil">
                <SidebarContent compact={false} onClose={() => setMobileOpen(false)} />
              </LayoutGroup>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarContent({ compact, onToggle, onClose }: { compact: boolean; onToggle?: () => void; onClose?: () => void }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  if (!user) return null;

  const iconBtn =
    'grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition-[background-color,color,transform] duration-200 hover:bg-white/10 hover:text-white active:scale-[0.94]';

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      {/* Marca + control de colapso */}
      <div className={compact ? 'flex flex-col items-center gap-3 px-0 pb-5 pt-6' : 'px-4 pb-5 pt-5'}>
        {compact ? (
          // Colapsado: solo la cruz, centrada
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/brand/logo-cruz-roja-cruz.png" alt="Cruz Roja Mexicana" width={36} height={36} className="h-9 w-9 object-contain" />
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="w-full max-w-[180px] animate-fade rounded-2xl bg-white/[0.04] px-3 py-2.5 ring-1 ring-white/[0.06]">
              {/* Versión para fondo oscuro: cruz roja y texto blanco */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo-cruz-roja-horizontal-blanco.png"
                alt="Cruz Roja Mexicana"
                width={540}
                height={160}
                className="h-auto w-full object-contain"
              />
            </div>
            {onToggle && (
              <button
                type="button"
                onClick={onToggle}
                aria-expanded
                aria-label="Colapsar menú"
                title="Colapsar menú"
                className={iconBtn}
              >
                <PanelLeftClose className="h-[18px] w-[18px]" />
              </button>
            )}
            {onClose && (
              <button type="button" onClick={onClose} aria-label="Cerrar menú" className={iconBtn}>
                <X className="h-[18px] w-[18px]" />
              </button>
            )}
          </div>
        )}
        {compact && onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={false}
            aria-label="Expandir menú"
            title="Expandir menú"
            className={iconBtn}
          >
            <PanelLeftOpen className="h-[18px] w-[18px]" />
          </button>
        )}
        {!compact && <Pulse className="mt-4 h-5 w-full text-crm-red/70" />}
      </div>

      <nav className={`no-scrollbar flex-1 space-y-6 overflow-y-auto pb-4 ${compact ? 'px-3' : 'px-3'}`} aria-label="Principal">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((i) => can(user.role, i.permission));
          if (!items.length) return null;
          return (
            <div key={group.title}>
              {compact ? (
                <div aria-hidden className="mx-auto mb-3 h-px w-8 bg-white/10" />
              ) : (
                <p className="whitespace-nowrap px-3 pb-2 text-[11px] font-medium text-slate-500">{group.title}</p>
              )}
              <ul className="space-y-1">
                {items.map(({ href, label, icon: Icon }) => {
                  const active = isActive(pathname, href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        aria-current={active ? 'page' : undefined}
                        aria-label={compact ? label : undefined}
                        title={compact ? label : undefined}
                        className={`group relative flex items-center rounded-full text-sm transition-[color,transform] duration-200 ease-[var(--ease-out-soft)] ${
                          compact ? 'mx-auto h-11 w-11 justify-center' : 'gap-3 px-4 py-2.5'
                        } ${active ? 'font-semibold text-white' : `hover:text-white ${compact ? '' : 'hover:translate-x-1'}`}`}
                      >
                        {active && (
                          <motion.span
                            layoutId="sidebar-active"
                            transition={SPRING}
                            className="absolute inset-0 rounded-full bg-crm-red shadow-md shadow-red-500/25"
                          />
                        )}
                        {!active && (
                          <span className="absolute inset-0 rounded-full bg-white/0 transition-colors duration-200 group-hover:bg-white/[0.07]" />
                        )}
                        <Icon
                          className={`relative h-[18px] w-[18px] shrink-0 transition-colors duration-200 ${
                            active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        />
                        {!compact && <span className="relative animate-fade truncate whitespace-nowrap">{label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div
        className={`m-3 flex items-center rounded-2xl bg-white/[0.06] ring-1 ring-white/[0.06] ${
          compact ? 'flex-col gap-2 px-0 py-3' : 'gap-3 p-3'
        }`}
      >
        <span
          title={compact ? `${user.nombre} · ${ROLE_LABEL[user.role]}` : undefined}
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold ${
            user.role === 'Leo' ? 'bg-crm-red text-white' : 'bg-blue-400/20 text-blue-200'
          }`}
        >
          {iniciales(user.nombre)}
        </span>
        {!compact && (
          <div className="min-w-0 flex-1 animate-fade leading-tight">
            <p className="truncate text-sm font-medium text-white" title={user.nombre}>
              {user.nombre}
            </p>
            <p className="truncate text-[11px] text-slate-400">{ROLE_LABEL[user.role]}</p>
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            logout();
            router.replace('/login');
          }}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className={iconBtn}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
