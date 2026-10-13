'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { btnPrimary, card, inputPill } from '@/components/ui/styles';
import { ALL_FIELDS } from '@/features/historia-clinica/config/fields';
import { obtenerJornada, type Expediente } from '@/features/historia-clinica/api';
import { formatFechaMx } from '@/features/historia-clinica/lib/format';
import { todayIso } from '@/lib/local-db';

export function ReporteExcelPanel() {
  const [data, setData] = useState<Expediente[] | null>(null);
  const [dia, setDia] = useState(todayIso);
  const [exportando, setExportando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // El servidor ya filtra por jornada (realizados o editados ese día); se vuelve a pedir cuando cambia el día.
  useEffect(() => {
    setData(null);
    setError(null);
    obtenerJornada(dia)
      .then(setData)
      .catch((err: unknown) => {
        setData([]);
        setError(err instanceof Error ? err.message : 'No fue posible cargar los expedientes de la jornada.');
      });
  }, [dia]);

  const delDia = useMemo(() => [...(data ?? [])].sort((a, b) => Number(a.folio) - Number(b.folio)), [data]);
  const ultimo = delDia.reduce<string | null>((m, e) => (!m || e.actualizadoEn > m ? e.actualizadoEn : m), null);

  async function exportar() {
    setError(null);
    setExportando(true);
    try {
      const { descargarExcel } = await import('./export');
      await descargarExcel(delDia, `historias-clinicas_${dia}.xlsx`, `Historias clínicas - Jornada del ${formatFechaMx(dia, '/')}`);
    } catch {
      setError('No fue posible generar el archivo. Intenta de nuevo.');
    } finally {
      setExportando(false);
    }
  }

  const esHoy = dia === todayIso();

  return (
    <>
      <PageHeader
        title="Reporte Excel"
        description={`Exporta los expedientes con sus ${ALL_FIELDS.length} campos como columnas, listo para abrir en Microsoft Excel.`}
      />

      <div className={`${card} overflow-hidden`}>
        <div className="flex flex-wrap items-end gap-4 border-b border-slate-200/60 p-5">
          <label className="block">
            <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink-muted">
              <CalendarDays className="h-3.5 w-3.5" /> Jornada
            </span>
            <input
              type="date"
              value={dia}
              max={todayIso()}
              onChange={(e) => e.target.value && setDia(e.target.value)}
              className={`${inputPill} w-52 tabular-nums`}
            />
          </label>
          {!esHoy && (
            <button type="button" onClick={() => setDia(todayIso())} className="h-10 rounded-lg px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-slate-100 hover:text-ink">
              Volver a hoy
            </button>
          )}
          <p className="pb-2.5 text-xs text-ink-muted">
            <span className="font-semibold tabular-nums text-ink">{data ? delDia.length : '—'}</span>{' '}
            {delDia.length === 1 ? 'expediente' : 'expedientes'}
            {ultimo &&
              ` · último movimiento ${new Date(ultimo).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`}
          </p>
          <button
            type="button"
            onClick={exportar}
            disabled={!data || exportando || delDia.length === 0}
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

        {!data ? (
          <div className="grid place-items-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-ink-subtle" />
          </div>
        ) : delDia.length === 0 ? (
          <p className="px-5 py-14 text-center text-sm text-ink-muted">
            No hay expedientes realizados ni editados el {formatFechaMx(dia, '/')}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-200/60 bg-slate-50/70 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-5 py-3">Folio</th>
                  <th className="px-5 py-3">Paciente</th>
                  <th className="px-5 py-3">Empresa</th>
                  <th className="px-5 py-3">Movimiento</th>
                </tr>
              </thead>
              <tbody>
                {delDia.map((e) => (
                  <tr key={e.folio} className="border-b border-slate-100 transition-colors duration-150 last:border-0 hover:bg-crm-red-soft/30">
                    <td className="px-5 py-2.5 font-mono text-xs font-semibold">{e.folio}</td>
                    <td className="max-w-64 truncate px-5 py-2.5 font-medium text-ink">{e.values.nombreCompleto || 'Sin nombre'}</td>
                    <td className="max-w-48 truncate px-5 py-2.5 text-ink-muted">{e.values.empresa || '—'}</td>
                    <td className="px-5 py-2.5">
                      {e.values.fechaEstudios === dia ? <Badge tone="green">Realizado</Badge> : <Badge tone="amber">Editado</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
