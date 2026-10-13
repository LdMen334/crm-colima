'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, FilePlus2, Loader2, PencilLine, ScrollText, Search } from 'lucide-react';
import { Badge, type BadgeTone } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { Pagination } from '@/components/ui/Pagination';
import { card, inputPill, pillTab } from '@/components/ui/styles';
import { todayIso } from '@/lib/local-db';
import { clave } from '@/features/historia-clinica/api';
import { ACCIONES, listEventos, type AccionAuditoria, type EventoAuditoria } from './api';

const PAGE_SIZE = 20;

const ACCION_STYLE: Record<AccionAuditoria, { tone: BadgeTone; icon: typeof Eye }> = {
  'Creación de Folio': { tone: 'green', icon: FilePlus2 },
  'Edición de Expediente': { tone: 'amber', icon: PencilLine },
  Consulta: { tone: 'blue', icon: Eye },
  'Importación Histórica': { tone: 'blue', icon: ScrollText },
};

export function BitacoraPanel() {
  const [eventos, setEventos] = useState<EventoAuditoria[] | null>(null);
  const [total, setTotal] = useState(0);
  const [totalHoy, setTotalHoy] = useState(0);
  const [q, setQ] = useState('');
  const [accion, setAccion] = useState<AccionAuditoria | ''>('');
  const [fecha, setFecha] = useState('');
  const [page, setPage] = useState(0);

  // La búsqueda/filtros/paginación los resuelve el servidor; la página aquí es 0-indexada,
  // el backend espera 1-indexada.
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      listEventos({ q, accion, fecha, page: page + 1 }).then((r) => {
        if (cancelled) return;
        setEventos(r.items);
        setTotal(r.total);
      });
    }, 220);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, accion, fecha, page]);

  useEffect(() => setPage(0), [q, accion, fecha]);

  const hoy = todayIso();
  useEffect(() => {
    listEventos({ fecha: hoy }).then((r) => setTotalHoy(r.total));
    // Solo al montar: "hoy" no cambia durante la sesión.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <PageHeader
        title="Bitácora de auditoría"
        description={
          eventos
            ? `${total} eventos registrados · ${totalHoy} hoy. Creaciones, ediciones y consultas de expedientes.`
            : 'Creaciones, ediciones y consultas de expedientes.'
        }
      />

      <div className={`${card} overflow-hidden`}>
        <div className="space-y-4 p-6 pb-5">
          <div role="tablist" aria-label="Tipo de acción" className="no-scrollbar flex w-fit max-w-full gap-1 overflow-x-auto rounded-full bg-well p-1">
            {([{ valor: '', corto: 'Todas' }, ...ACCIONES.map((a) => ({ valor: a, corto: a.split(' ')[0] }))] as { valor: AccionAuditoria | ''; corto: string }[]).map((t) => (
              <button
                key={t.valor || 'todas'}
                type="button"
                role="tab"
                aria-selected={accion === t.valor}
                onClick={() => setAccion(t.valor)}
                className={`${pillTab(accion === t.valor)} shrink-0 !px-4 !py-2`}
              >
                {t.corto}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <label className="relative">
              <span className="sr-only">Buscar en la bitácora</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por médico, folio, paciente o detalle" className={`${inputPill} pl-10`} />
            </label>
            <input type="date" aria-label="Fecha" value={fecha} onChange={(e) => setFecha(e.target.value)} className={`${inputPill} tabular-nums`} />
          </div>
        </div>

        {!eventos ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-ink-subtle" />
          </div>
        ) : eventos.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-ink-subtle">
              <ScrollText className="h-5 w-5" />
            </span>
            <p className="mt-4 text-sm font-semibold text-ink">{total ? 'Sin coincidencias' : 'Sin eventos todavía'}</p>
            <p className="mt-1 text-sm text-ink-muted">
              {total ? 'Ajusta la búsqueda o los filtros.' : 'Cada folio creado, edición o consulta aparecerá aquí.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200/60 bg-slate-50/70 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3">Fecha y hora</th>
                    <th className="px-4 py-3">Médico / usuario</th>
                    <th className="px-4 py-3">Acción</th>
                    <th className="px-4 py-3">Folio / paciente</th>
                    <th className="px-4 py-3">Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {eventos.map((e) => {
                    const { tone, icon: Icon } = ACCION_STYLE[e.accion];
                    const d = new Date(e.fecha);
                    return (
                      <tr key={e.id} className="border-b border-slate-100 align-top transition-colors duration-150 last:border-0 hover:bg-crm-red-soft/30">
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                          <span className="block text-ink">{d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                          <span className="block font-mono text-[11px] text-ink-subtle">
                            {d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </td>
                        <td className="max-w-52 truncate px-4 py-3 font-medium text-ink">{e.usuarioNombre}</td>
                        <td className="px-4 py-3">
                          <Badge tone={tone}>
                            <Icon className="h-3 w-3" />
                            {e.accion}
                          </Badge>
                        </td>
                        <td className="max-w-64 px-4 py-3">
                          <Link href={`/expediente/${clave(e.anio, e.folio)}`} className="font-mono text-xs font-semibold text-ink hover:text-crm-red hover:underline">
                            Folio {e.folio}
                          </Link>
                          <span className="block truncate text-xs text-ink-muted">{e.paciente || 'Sin nombre'}</span>
                        </td>
                        <td className="px-4 py-3 text-xs leading-relaxed text-ink-muted">{e.detalle}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} />
          </>
        )}
      </div>
    </>
  );
}
