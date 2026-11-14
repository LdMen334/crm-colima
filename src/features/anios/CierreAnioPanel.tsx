'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  DatabaseBackup,
  Download,
  Loader2,
  ScrollText,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { btnPrimary, btnSecondary, card, inputPill } from '@/components/ui/styles';
import { descargarRespaldoAnio } from '@/features/historia-clinica/api';
import { cerrarAnio, confirmarRespaldoAnio, obtenerAniosPendientes, type AnioPendiente } from './api';
import { EVENTO_ANIOS_PENDIENTES } from './useHayAniosPendientes';

const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * Pantalla de cierre de año (decisión del dueño 2026-11-14: página propia en el menú en lugar del modal).
 * Respaldar y borrar son acciones separadas: el respaldo se descarga cuando se quiera y no borra nada; el
 * borrado solo se habilita con un respaldo vigente (nadie cambió el año después) y escribiendo "CERRAR {año}".
 * El servidor aplica las mismas reglas: esto solo guía al administrador.
 */
export function CierreAnioPanel() {
  const [anios, setAnios] = useState<AnioPendiente[] | null>(null);
  const [anioSel, setAnioSel] = useState<number | null>(null);
  const [accion, setAccion] = useState<'respaldando' | 'borrando' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [entendido, setEntendido] = useState(false);
  const [confirmacion, setConfirmacion] = useState('');

  const cargar = useCallback(async () => {
    const lista = await obtenerAniosPendientes();
    setAnios(lista);
    // Conserva el año elegido si sigue pendiente; si no, el más reciente.
    setAnioSel((actual) => (lista.some((a) => a.anio === actual) ? actual : (lista[0]?.anio ?? null)));
  }, []);

  useEffect(() => {
    cargar().catch(() => setError('No fue posible consultar los años pendientes.'));
  }, [cargar]);

  const seleccionado = anios?.find((a) => a.anio === anioSel) ?? null;
  const respaldo = seleccionado?.respaldo ?? null;
  const puedeBorrar = !!respaldo?.vigente;
  const textoConfirmacion = seleccionado ? `CERRAR ${seleccionado.anio}` : '';

  async function respaldar() {
    if (!seleccionado) return;
    setAccion('respaldando');
    setError(null);
    setAviso(null);
    try {
      const datos = await descargarRespaldoAnio(seleccionado.anio);
      const { descargarExcel } = await import('@/features/reportes-excel/export');
      await descargarExcel(
        datos.items,
        `historias-clinicas_${seleccionado.anio}.xlsx`,
        `Historias clínicas · Respaldo ${seleccionado.anio}`,
      );
      // Solo después de generar el Excel se avisa al servidor: ese respaldo es el que permite borrar.
      await confirmarRespaldoAnio(seleccionado.anio, datos.total, datos.huella);
      setAviso(`Respaldo de ${seleccionado.anio} descargado: ${datos.total} expedientes.`);
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible descargar el respaldo. Intenta de nuevo.');
    } finally {
      setAccion(null);
    }
  }

  async function borrar() {
    if (!seleccionado) return;
    setAccion('borrando');
    setError(null);
    setAviso(null);
    try {
      const r = await cerrarAnio(seleccionado.anio, confirmacion);
      setAviso(
        `Se borraron ${r.totalBorrado} expedientes de ${seleccionado.anio} y ${r.pacientesBorrados} pacientes sin otras visitas.`,
      );
      setEntendido(false);
      setConfirmacion('');
      await cargar();
      // El menú oculta «Cierre de año» cuando ya no queda ningún año anterior.
      window.dispatchEvent(new Event(EVENTO_ANIOS_PENDIENTES));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible borrar el año. Intenta de nuevo.');
    } finally {
      setAccion(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Cierre de año"
        description="Descarga el respaldo en Excel de un año anterior. Borrar sus registros es un paso aparte y solo se habilita con un respaldo al día."
      />
      {anios === null ? (
        <div className="grid place-items-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-ink-subtle" />
        </div>
      ) : anios.length === 0 ? (
        <div className={`${card} flex flex-col items-center px-6 py-16 text-center`}>
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" aria-hidden />
          </span>
          <p className="mt-4 text-sm font-semibold text-ink">No hay años pendientes</p>
          <p className="mt-1 text-sm text-ink-muted">
            Solo se cierra un año que ya terminó: el historial del año en curso se podrá cerrar a partir del siguiente.
          </p>
          {aviso && (
            <p role="status" className="mt-3 text-sm text-emerald-700">
              {aviso}
            </p>
          )}
        </div>
      ) : seleccionado ? (
        <>
          <div
            role="note"
            className="mb-6 flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
            <span>
              <strong>Años pendientes de respaldar:</strong> {anios.map((a) => `Empresas ${a.anio}`).join(' · ')}.
            </span>
          </div>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className={`${card} space-y-4 p-4 sm:p-6`}>
              <section className="rounded-3xl bg-well p-5">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <span className="h-2 w-2 rounded-full bg-crm-red" aria-hidden />1 · Año a cerrar
                </h2>
                <select
                  aria-label="Año a cerrar"
                  className={`${inputPill} mt-3 max-w-xs bg-white`}
                  value={anioSel ?? ''}
                  onChange={(e) => {
                    setAnioSel(Number(e.target.value));
                    setEntendido(false);
                    setConfirmacion('');
                  }}
                >
                  {anios.map((a) => (
                    <option key={a.anio} value={a.anio}>
                      {`${a.anio} · ${a.total} expedientes`}
                    </option>
                  ))}
                </select>
              </section>
              <section className="rounded-3xl bg-well p-5">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <span className="h-2 w-2 rounded-full bg-crm-red" aria-hidden />2 · Respaldo en Excel
                </h2>
                <p className="mt-2 text-sm text-ink-muted">
                  Se descargan los {seleccionado.total} expedientes de Empresas {seleccionado.anio}. No se borra nada.
                </p>
                <div
                  className={`mt-3 flex items-start gap-2 rounded-2xl px-3 py-2.5 text-sm ${
                    !respaldo
                      ? 'bg-white text-ink-muted ring-1 ring-slate-200'
                      : respaldo.vigente
                        ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
                        : 'bg-amber-50 text-amber-900 ring-1 ring-amber-200'
                  }`}
                >
                  {respaldo ? (
                    <>
                      {respaldo.vigente ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      ) : (
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      )}
                      {respaldo.vigente
                        ? `Respaldado el ${fechaHora(respaldo.fecha)} por ${respaldo.usuarioNombre} (${respaldo.total} expedientes).`
                        : `El respaldo del ${fechaHora(respaldo.fecha)} ya no está al día: hubo cambios después. Descárgalo otra vez antes de borrar.`}
                    </>
                  ) : (
                    <>
                      <DatabaseBackup className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      Este año todavía no tiene respaldo.
                    </>
                  )}
                </div>
                <button type="button" className={`${btnSecondary} mt-4`} onClick={respaldar} disabled={accion !== null}>
                  {accion === 'respaldando' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generando respaldo…
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      {respaldo ? 'Descargar otra vez' : 'Descargar respaldo'}
                    </>
                  )}
                </button>
              </section>
              <section className="rounded-3xl bg-well p-5">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <span className="h-2 w-2 rounded-full bg-crm-red" aria-hidden />3 · Borrar registros de{' '}
                  {seleccionado.anio}
                </h2>
                {!puedeBorrar && (
                  <p className="mt-2 text-sm text-ink-muted">Se habilita cuando el año tiene un respaldo al día.</p>
                )}
                {puedeBorrar && (
                  <>
                    <label className="mt-3 flex items-start gap-3 rounded-2xl bg-white p-3 text-sm text-ink ring-1 ring-slate-200">
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 accent-crm-red"
                        checked={entendido}
                        onChange={(e) => setEntendido(e.target.checked)}
                      />
                      {/* Un solo span: en un label flex, cada trozo de texto sería un elemento aparte y el gap se sumaría al espacio. */}
                      <span>
                        Entiendo que los registros de <strong>Empresas {seleccionado.anio}</strong> se borrarán de la
                        base de datos y no se pueden recuperar.
                      </span>
                    </label>
                    <label className="mt-4 block text-sm text-ink-muted">
                      Escribe <strong className="text-ink">{textoConfirmacion}</strong> para confirmar
                      <input
                        className={`${inputPill} mt-2 max-w-xs bg-white`}
                        value={confirmacion}
                        onChange={(e) => setConfirmacion(e.target.value)}
                        autoComplete="off"
                        spellCheck={false}
                      />
                    </label>
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                      <p className="flex items-center gap-1.5 text-sm text-crm-red-dark">
                        <ShieldAlert className="h-4 w-4" aria-hidden />
                        Esta acción no se puede deshacer
                      </p>
                      <button
                        type="button"
                        className={btnPrimary}
                        onClick={borrar}
                        disabled={
                          !entendido || confirmacion.trim().toUpperCase() !== textoConfirmacion || accion !== null
                        }
                      >
                        {accion === 'borrando' ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Borrando…
                          </>
                        ) : (
                          <>
                            <Archive className="h-4 w-4" />
                            Borrar registros de {seleccionado.anio}
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </section>
              {error && (
                <p role="alert" className="text-sm text-crm-red-dark">
                  {error}
                </p>
              )}
              {aviso && (
                <p role="status" className="text-sm text-emerald-700">
                  {aviso}
                </p>
              )}
            </div>
            <div className="space-y-4">
              <div className={`${card} p-6`}>
                <p className="text-sm text-ink-muted">Qué va a pasar</p>
                <ol className="mt-4 space-y-4">
                  <li className="flex gap-3 text-sm text-ink">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-well text-xs font-semibold">
                      1
                    </span>
                    Descargas el Excel del año: puedes hacerlo las veces que quieras.
                  </li>
                  <li className="flex gap-3 text-sm text-ink">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-well text-xs font-semibold">
                      2
                    </span>
                    Si alguien edita un expediente de ese año, el respaldo deja de estar al día y hay que descargarlo
                    otra vez.
                  </li>
                  <li className="flex gap-3 text-sm text-ink">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-well text-xs font-semibold">
                      3
                    </span>
                    Con un respaldo al día puedes borrar el año. Los pacientes que no tengan visitas en otros años
                    también se borran.
                  </li>
                </ol>
              </div>
              <div className={`${card} flex gap-3 p-6 text-sm text-ink-muted`}>
                <ScrollText className="mt-0.5 h-4 w-4 shrink-0 text-crm-red" aria-hidden />
                <p>
                  El respaldo y el borrado quedan registrados en la bitácora con usuario, fecha y número de registros.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
