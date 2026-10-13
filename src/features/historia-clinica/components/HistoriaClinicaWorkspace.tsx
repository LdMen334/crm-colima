'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FormProvider, useForm, type FieldErrors } from 'react-hook-form';
import { ArrowLeft, Check, FilePlus2, Loader2, RotateCcw, Save, UserCheck, X } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { btnPrimary, btnSecondary } from '@/components/ui/styles';
import { Badge } from '@/components/ui/Badge';
import { FIELD_BY_KEY, type FieldKey, type HistoriaClinicaValues } from '../config/fields';
import { SECTIONS, type TabId } from '../config/sections';
import { resolverExpediente } from '../lib/validacion';
import { useAutoCalculos } from '../hooks/useAutoCalculos';
import { abrirExpediente, clave, guardarExpediente, siguienteFolio, valoresNuevoExpediente } from '../api';
import { formatFechaMx } from '../lib/format';
import { HistoriaClinicaForm } from './HistoriaClinicaForm';
import { ClinicalSummaryPanel } from './ClinicalSummaryPanel';
import { PatientSearch } from '@/features/pacientes/PatientSearch';
import { usePacienteRecurrente } from '@/features/pacientes/usePacienteRecurrente';
import { PdfActionBar } from '@/features/reportes-pdf/PdfActionBar';

type Carga = 'cargando' | 'listo' | 'no-encontrado';

/**
 * Sin `folio`: historia nueva con folio consecutivo y fecha de hoy.
 * Con `folio`: abre el expediente guardado (queda registrado como "Consulta").
 */
export function HistoriaClinicaWorkspace({ folio }: { folio?: string }) {
  const { user } = useAuth();
  // Sin reglas de validación: los 206 campos son opcionales.
  const [iniciales] = useState(valoresNuevoExpediente);
  const form = useForm<HistoriaClinicaValues>({ defaultValues: iniciales, resolver: resolverExpediente });
  const [tab, setTab] = useState<TabId>('generales');
  const { normalizarTallaAlSalir } = useAutoCalculos(form);
  const [carga, setCarga] = useState<Carga>(folio ? 'cargando' : 'listo');
  const [guardado, setGuardado] = useState(!!folio); // ¿existe ya en la base?
  // Clave de ruta "{anio}-{folio}" del expediente abierto; se actualiza tras
  // el primer guardado de una historia nueva (antes de eso no existe en la base).
  const [claveActual, setClaveActual] = useState<string | undefined>(folio);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recurrente = usePacienteRecurrente(form, carga === 'listo' && !guardado);

  useEffect(() => {
    if (!folio || !user) return;
    let cancelled = false;
    abrirExpediente(folio, user).then((exp) => {
      if (cancelled) return;
      if (exp) form.reset(exp.values);
      setCarga(exp ? 'listo' : 'no-encontrado');
    });
    return () => {
      cancelled = true;
    };
    // Solo al abrir otro folio; `user` no cambia durante la sesión.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folio]);

  // Historia nueva: el folio real lo asigna el servidor al guardar; mientras
  // tanto se muestra el que asignaría ahora mismo (puramente informativo).
  useEffect(() => {
    if (folio || guardado) return;
    let cancelled = false;
    siguienteFolio().then((f) => {
      if (!cancelled) form.setValue('folio', f);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folio, guardado]);

  function nuevo() {
    form.reset(valoresNuevoExpediente());
    recurrente.limpiar();
    setGuardado(false);
    setClaveActual(undefined);
    setSavedAt(null);
    window.history.replaceState(null, '', '/expediente');
    siguienteFolio().then((f) => form.setValue('folio', f));
  }

  const onSubmit = form.handleSubmit(async (values) => {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const exp = await guardarExpediente(values, user, guardado ? (claveActual ?? null) : null);
      form.reset(exp.values);
      setSavedAt(new Date(exp.actualizadoEn));
      const claveNueva = clave(exp.anio, exp.folio);
      setClaveActual(claveNueva);
      if (!guardado) {
        setGuardado(true);
        recurrente.limpiar();
        // Cambia la URL sin volver a montar la página (no genera una "Consulta" extra)
        window.history.replaceState(null, '', `/expediente/${claveNueva}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible guardar el expediente.');
    } finally {
      setSaving(false);
    }
  }, irAlPrimerError);

  /** Si un campo no pasa la validación, abre su pestaña y su sección y lo enfoca. */
  function irAlPrimerError(errors: FieldErrors<HistoriaClinicaValues>) {
    const key = Object.keys(errors)[0] as FieldKey | undefined;
    const field = key && FIELD_BY_KEY.get(key);
    const seccion = field && SECTIONS.find((s) => s.fields.includes(field.n));
    if (!key || !seccion) return;
    setTab(seccion.tab);
    setTimeout(() => {
      document.getElementById(`f-${key}`)?.closest('details')?.setAttribute('open', '');
      form.setFocus(key);
    }, 60);
  }

  if (carga !== 'listo') {
    return (
      <div className="grid w-full place-items-center px-4 py-24 text-center">
        {carga === 'cargando' ? (
          <Loader2 className="h-5 w-5 animate-spin text-ink-subtle" />
        ) : (
          <div className="animate-enter">
            <p className="text-base font-semibold text-ink">No existe el folio {folio}</p>
            <p className="mt-1 text-sm text-ink-muted">Puede que se haya capturado en otro equipo.</p>
            <Link href="/expedientes" className={`${btnSecondary} mt-5`}>
              <ArrowLeft className="h-4 w-4" /> Volver al navegador
            </Link>
          </div>
        )}
      </div>
    );
  }

  const { folio: folioActual, fechaEstudios } = form.getValues();

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="w-full animate-enter px-4 pb-16 pt-6 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">Historia clínica</h1>
              {guardado ? (
                <Badge tone="blue">Folio {folioActual}</Badge>
              ) : (
                <Badge tone="primary" dot>
                  Nueva · folio {folioActual}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-ink-muted">Realizada el {formatFechaMx(fechaEstudios, '/')}</p>
          </div>
          <PdfActionBar />
        </div>

        {error && (
          <p role="alert" className="mb-5 animate-pop rounded-2xl border border-crm-red/15 bg-crm-red-soft px-4 py-3 text-sm text-crm-red-dark">
            {error}
          </p>
        )}

        <div className="mb-5 flex flex-wrap items-center gap-3">
          {!guardado && <PatientSearch onSelect={recurrente.aplicarDesdeBusqueda} />}
          <div className="ml-auto flex items-center gap-2">
            {savedAt && !form.formState.isDirty && (
              <span className="flex animate-fade items-center gap-1 text-xs text-emerald-700">
                <Check className="h-3.5 w-3.5" />
                Guardado {savedAt.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button type="button" onClick={nuevo} className={btnSecondary}>
              <FilePlus2 className="h-4 w-4" /> Nueva
            </button>
            <button type="submit" disabled={saving} className={btnPrimary}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {guardado ? 'Guardar cambios' : 'Guardar expediente'}
            </button>
          </div>
        </div>

        {recurrente.precarga && (
          <PacienteToast
            key={recurrente.precarga.paciente.id}
            nombre={recurrente.precarga.paciente.nombreCompleto}
            folio={recurrente.precarga.paciente.ultimoFolio}
            onDeshacer={recurrente.deshacer}
            onClose={recurrente.descartarAviso}
          />
        )}

        <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <HistoriaClinicaForm
            tab={tab}
            onTabChange={setTab}
            onFieldBlur={{ talla: normalizarTallaAlSalir, curp: recurrente.verificar, nss: recurrente.verificar }}
          />
          <ClinicalSummaryPanel />
        </div>
      </form>
    </FormProvider>
  );
}

/** Aviso discreto (esquina inferior) que se cierra solo; permite deshacer la precarga. */
function PacienteToast({
  nombre,
  folio,
  onDeshacer,
  onClose,
}: {
  nombre: string;
  folio: string;
  onDeshacer: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);

  // Portal: el formulario tiene animación de entrada, que atraparía el `position: fixed`
  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom,0px))] right-5 z-50 flex w-[min(400px,calc(100vw-2.5rem))] animate-pop items-start gap-3 rounded-xl border border-line bg-white p-3.5 shadow-pop"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700">
        <UserCheck className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">Datos del paciente cargados automáticamente</p>
        <p className="mt-0.5 truncate text-xs text-ink-muted">
          {nombre}
          {folio && ` · folio ${folio}`}
        </p>
        <button
          type="button"
          onClick={onDeshacer}
          className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-crm-red transition-colors hover:text-crm-red-dark"
        >
          <RotateCcw className="h-3 w-3" /> Deshacer
        </button>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar aviso"
        className="-mr-1 -mt-1 grid h-7 w-7 place-items-center rounded-lg text-ink-subtle transition-colors hover:bg-canvas hover:text-ink"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>,
    document.body,
  );
}
