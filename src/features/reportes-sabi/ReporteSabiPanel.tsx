'use client';

import { useState } from 'react';
import { CalendarDays, FileSpreadsheet, Loader2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { btnPrimary, card, inputPill } from '@/components/ui/styles';
import { listExpedientes, type ExpedienteResumen } from '@/features/historia-clinica/api';
import { formatFechaMx } from '@/features/historia-clinica/lib/format';
import { todayIso } from '@/lib/local-db';

/** Reporte de pacientes atendidos (Fundación SABI), filtrado por periodo y empresa. */
export function ReporteSabiPanel() {
  const [desde, setDesde] = useState(todayIso);
  const [hasta, setHasta] = useState(todayIso);
  const [empresa, setEmpresa] = useState('');
  const [items, setItems] = useState<ExpedienteResumen[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buscar() {
    setError(null);
    setBuscando(true);
    try {
      const { items: encontrados } = await listExpedientes({ desde, hasta, empresa: empresa.trim() || undefined, pageSize: 10000 });
      setItems(encontrados);
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : 'No fue posible cargar el reporte.');
    } finally {
      setBuscando(false);
    }
  }

  async function exportar() {
    if (!items) return;
    setError(null);
    setExportando(true);
    try {
      const { descargarExcelSabi } = await import('./export');
      const titulo = `Pacientes atendidos${empresa ? ` · ${empresa}` : ''} · ${formatFechaMx(desde, '/')} al ${formatFechaMx(hasta, '/')}`;
      await descargarExcelSabi(items, `pacientes-atendidos_${desde}_${hasta}.xlsx`, titulo);
    } catch {
      setError('No fue posible generar el archivo. Intenta de nuevo.');
    } finally {
      setExportando(false);
    }
  }

  return (
    <div className="w-full animate-enter px-4 pb-16 pt-6 sm:px-6">
      <PageHeader title="Reporte SABI" description="Pacientes atendidos por periodo y empresa, con el estatus de su examen visual." />

      <div className={`${card} overflow-hidden`}>
        <div className="flex flex-wrap items-end gap-4 border-b border-slate-200/60 p-5">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink-muted">
              <CalendarDays className="h-3.5 w-3.5" /> Desde
            </span>
            <input type="date" value={desde} max={hasta} onChange={(e) => e.target.value && setDesde(e.target.value)} className={`${inputPill} w-44 tabular-nums`} />
          </label>
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink-muted">
              <CalendarDays className="h-3.5 w-3.5" /> Hasta
            </span>
            <input type="date" value={hasta} min={desde} max={todayIso()} onChange={(e) => e.target.value && setHasta(e.target.value)} className={`${inputPill} w-44 tabular-nums`} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-ink-muted">Empresa</span>
            <input
              type="text"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              placeholder="Todas"
              className={`${inputPill} w-52`}
            />
          </label>
          <button type="button" onClick={buscar} disabled={buscando} className={`${btnPrimary} h-11 px-5`}>
            {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Buscar
          </button>
          <button
            type="button"
            onClick={exportar}
            disabled={!items || exportando || items.length === 0}
            className={`${btnPrimary} ml-auto h-11 px-5`}
          >
            {exportando ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            Descargar Reporte Excel (.xlsx)
          </button>
        </div>

        {error && (
          <p role="alert" className="m-5 mb-0 rounded-xl border border-crm-red/15 bg-crm-red-soft px-3 py-2.5 text-sm text-crm-red-dark">
            {error}
          </p>
        )}

        {!items ? (
          <p className="px-5 py-14 text-center text-sm text-ink-muted">Elige un periodo y da clic en Buscar.</p>
        ) : items.length === 0 ? (
          <p className="px-5 py-14 text-center text-sm text-ink-muted">No hay expedientes en ese periodo/empresa.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-200/60 bg-slate-50/70 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">Empresa</th>
                  <th className="px-5 py-3">Paciente</th>
                  <th className="px-5 py-3">Examen visual</th>
                </tr>
              </thead>
              <tbody>
                {items.map((e) => (
                  <tr key={`${e.anio}-${e.folio}`} className="border-b border-slate-100 transition-colors duration-150 last:border-0 hover:bg-crm-red-soft/30">
                    <td className="px-5 py-2.5 tabular-nums">{formatFechaMx(e.fechaEstudios, '/')}</td>
                    <td className="max-w-48 truncate px-5 py-2.5 text-ink-muted">{e.empresa || '—'}</td>
                    <td className="max-w-64 truncate px-5 py-2.5 font-medium text-ink">{e.nombreCompleto || 'Sin nombre'}</td>
                    <td className="px-5 py-2.5">
                      {e.examenesVisualesRealizados ? <Badge tone="green">Realizado</Badge> : <Badge tone="amber">Pendiente</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
