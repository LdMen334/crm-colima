'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { CalendarDays, Eye, FileSpreadsheet, Loader2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { Select } from '@/components/ui/Select';
import { btnDark, btnPrimary, card, inputPill, inputReadOnly, pillTab, th, tr } from '@/components/ui/styles';
import { useAuth } from '@/features/auth/AuthProvider';
import { listExpedientes, listarEmpresas, type ExpedienteResumen } from '@/features/historia-clinica/api';
import { listarMedicosConId } from '@/features/historia-clinica/config/medicos';
import { useMedicos } from '@/features/usuarios/useMedicos';
import { formatFechaMx } from '@/features/historia-clinica/lib/format';
import { todayIso } from '@/lib/local-db';
import { curpONss, dictamenDe } from './lib';
import type { ModoReporte } from './ReporteSabiPdfDocument';

// El visor de PDF solo se descarga cuando se abre el modal de vista previa.
const ReporteSabiPdfModal = dynamic(() => import('./ReporteSabiPdfModal'), { ssr: false });

const MODOS: { valor: ModoReporte; label: string }[] = [
  { valor: 'sabi', label: 'Exámenes Visuales (SABI)' },
  { valor: 'medico', label: 'Atenciones por Médico' },
];

/** Reporte de pacientes atendidos (Fundación SABI / Atenciones por médico), filtrado por periodo, empresa y médico. */
export function ReporteSabiPanel() {
  const { user } = useAuth();
  useMedicos(); // dispara refrescarMedicos(): listarMedicosConId() necesita la caché llena
  const esAdmin = user?.role === 'Leo';

  const [modo, setModo] = useState<ModoReporte>('sabi');
  const [desde, setDesde] = useState(todayIso);
  const [hasta, setHasta] = useState(todayIso);
  const [empresa, setEmpresa] = useState('');
  const [empresas, setEmpresas] = useState<string[]>([]);
  const [medicoId, setMedicoId] = useState(''); // solo aplica si esAdmin; '' = todos los médicos
  const [items, setItems] = useState<ExpedienteResumen[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [vistaPrevia, setVistaPrevia] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listarEmpresas()
      .then(setEmpresas)
      .catch(() => {});
  }, []);

  const medicosConId = esAdmin ? listarMedicosConId() : [];

  function tituloReporte() {
    const nombreMedico = esAdmin ? (medicoId ? medicosConId.find((m) => m.id === medicoId)?.nombre : 'Todos los médicos') : user?.nombre;
    const partes = [MODOS.find((m) => m.valor === modo)?.label, empresa || null, nombreMedico];
    return `${partes.filter(Boolean).join(' · ')} · ${formatFechaMx(desde, '/')} al ${formatFechaMx(hasta, '/')}`;
  }

  async function buscar() {
    setError(null);
    setBuscando(true);
    try {
      const { items: encontrados } = await listExpedientes({
        desde,
        hasta,
        empresa: empresa || undefined,
        medicoId: esAdmin ? medicoId || undefined : user?.id,
        soloExamenesVisuales: modo === 'sabi',
        pageSize: 10000,
      });
      setItems(encontrados);
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err.message : 'No fue posible cargar el reporte.');
    } finally {
      setBuscando(false);
    }
  }

  async function exportarExcel() {
    if (!items) return;
    setError(null);
    setExportando(true);
    try {
      const { descargarExcelSabi } = await import('./export');
      await descargarExcelSabi(items, modo, `reporte-sabi_${desde}_${hasta}.xlsx`, tituloReporte());
    } catch {
      setError('No fue posible generar el archivo. Intenta de nuevo.');
    } finally {
      setExportando(false);
    }
  }

  return (
    <div className="w-full animate-enter px-4 pb-16 pt-6 sm:px-6">
      <PageHeader title="Reporte SABI" description="Pacientes atendidos por periodo, empresa y médico, con el estatus de su examen visual." />

      <div className={`${card} overflow-hidden`}>
        <div className="space-y-4 border-b border-slate-200/60 p-5">
          <div role="tablist" aria-label="Modo de vista" className="flex w-fit flex-wrap gap-1 rounded-full bg-well p-1">
            {MODOS.map((m) => (
              <button
                key={m.valor}
                type="button"
                role="tab"
                aria-selected={modo === m.valor}
                onClick={() => setModo(m.valor)}
                className={`${pillTab(modo === m.valor)} !px-4 !py-2`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                <CalendarDays className="h-3.5 w-3.5" /> Desde
              </span>
              <input
                type="date"
                value={desde}
                max={hasta}
                onChange={(e) => e.target.value && setDesde(e.target.value)}
                className={`${inputPill} w-44 tabular-nums`}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                <CalendarDays className="h-3.5 w-3.5" /> Hasta
              </span>
              <input
                type="date"
                value={hasta}
                min={desde}
                max={todayIso()}
                onChange={(e) => e.target.value && setHasta(e.target.value)}
                className={`${inputPill} w-44 tabular-nums`}
              />
            </label>
            <label className="block w-52">
              <span className="mb-1.5 block text-xs font-medium text-ink-muted">Empresa</span>
              <Select value={empresa} onChange={setEmpresa} options={empresas} emptyLabel="Todas" placeholder="Todas" className={inputPill} />
            </label>
            <label className="block w-60">
              <span className="mb-1.5 block text-xs font-medium text-ink-muted">Médico</span>
              {esAdmin ? (
                <Select
                  value={medicoId}
                  onChange={setMedicoId}
                  options={medicosConId.map((m) => ({ value: m.id, label: m.nombre }))}
                  emptyLabel="Todos los médicos"
                  placeholder="Todos los médicos"
                  className={inputPill}
                />
              ) : (
                <input type="text" value={user?.nombre ?? ''} disabled readOnly className={inputReadOnly} />
              )}
            </label>
            <button type="button" onClick={buscar} disabled={buscando} className={`${btnPrimary} h-11 px-5`}>
              {buscando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar
            </button>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setVistaPrevia(true)}
                disabled={!items || items.length === 0}
                className={`${btnDark} h-11 px-5`}
              >
                <Eye className="h-4 w-4" />
                Vista previa PDF
              </button>
              <button
                type="button"
                onClick={exportarExcel}
                disabled={!items || exportando || items.length === 0}
                className={`${btnPrimary} h-11 px-5`}
              >
                {exportando ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                Descargar Reporte Excel (.xlsx)
              </button>
            </div>
          </div>
        </div>

        {error && (
          <p role="alert" className="m-5 mb-0 rounded-xl border border-crm-red/15 bg-crm-red-soft px-3 py-2.5 text-sm text-crm-red-dark">
            {error}
          </p>
        )}

        {!items ? (
          <p className="px-5 py-14 text-center text-sm text-ink-muted">Elige un periodo y da clic en Buscar.</p>
        ) : items.length === 0 ? (
          <p className="px-5 py-14 text-center text-sm text-ink-muted">No hay expedientes con esos filtros.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="border-b border-slate-200/60 bg-slate-50/70">
                  <th className={th}>Fecha</th>
                  <th className={th}>Folio</th>
                  <th className={th}>Paciente</th>
                  <th className={th}>CURP / NSS</th>
                  <th className={th}>Empresa</th>
                  <th className={th}>Zona de trabajo</th>
                  {modo === 'sabi' && <th className={th}>Examen visual</th>}
                  <th className={th}>Dictamen / Aptitud</th>
                  <th className={th}>Médico atendió</th>
                </tr>
              </thead>
              <tbody>
                {items.map((e) => (
                  <tr key={`${e.anio}-${e.folio}`} className={tr}>
                    <td className="px-4 py-2.5 tabular-nums">{formatFechaMx(e.fechaEstudios, '/')}</td>
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold">{e.folio}</td>
                    <td className="max-w-56 truncate px-4 py-2.5 font-medium text-ink">{e.nombreCompleto || 'Sin nombre'}</td>
                    <td className="px-4 py-2.5 font-mono text-xs">{curpONss(e)}</td>
                    <td className="max-w-40 truncate px-4 py-2.5 text-ink-muted">{e.empresa || '—'}</td>
                    <td className="px-4 py-2.5 text-ink-muted">{e.zonaTrabajo || '—'}</td>
                    {modo === 'sabi' && (
                      <td className="px-4 py-2.5">
                        {e.examenesVisualesRealizados ? <Badge tone="green">Realizado</Badge> : <Badge tone="amber">Pendiente</Badge>}
                      </td>
                    )}
                    <td className="px-4 py-2.5">
                      <Badge tone={e.noApto ? 'red' : 'green'}>{dictamenDe(e)}</Badge>
                    </td>
                    <td className="max-w-48 truncate px-4 py-2.5 text-ink-muted">{e.medico || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {vistaPrevia && items && (
        <ReporteSabiPdfModal
          items={items}
          modo={modo}
          titulo={tituloReporte()}
          nombreArchivo={`reporte-sabi_${desde}_${hasta}.pdf`}
          onClose={() => setVistaPrevia(false)}
        />
      )}
    </div>
  );
}
