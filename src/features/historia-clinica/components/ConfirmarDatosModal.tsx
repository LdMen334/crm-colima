'use client';

import { useState } from 'react';
import { AlertTriangle, Info, Loader2, XCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { btnPrimary, btnSecondary } from '@/components/ui/styles';
import { hayBloqueo, type Aviso } from '../lib/confirmacion';

export interface DatosConfirmacion {
  nombreCompleto: string;
  curp: string;
  nss: string;
  fechaNacimiento: string;
  edad: string;
  genero: string;
  empresa: string;
  medicoDictaminador: string;
}

/**
 * Ventana que aparece antes de guardar un expediente nuevo, o al cambiar los datos
 * fijos de un paciente. En nov-2026 varias altas con la CURP de otra persona
 * juntaron a pacientes distintos en un solo registro: aquí el médico ve a quién
 * pertenecen la CURP y el NSS y confirma con la casilla antes de enviar. Si el
 * servidor rechazaría el guardado (aviso de "bloqueo"), no se puede enviar.
 */
export function ConfirmarDatosModal({
  datos,
  avisos,
  errorVerificacion,
  esNuevo,
  enviando,
  onCancelar,
  onEnviar,
}: {
  datos: DatosConfirmacion;
  avisos: Aviso[] | null;
  errorVerificacion: string | null;
  esNuevo: boolean;
  enviando: boolean;
  onCancelar: () => void;
  onEnviar: () => void;
}) {
  const [revisado, setRevisado] = useState(false);

  return (
    <Modal
      title={esNuevo ? 'Confirma los datos del paciente' : 'Confirma el cambio de datos del paciente'}
      description="Revisa que sean correctos antes de enviar."
      onClose={() => !enviando && onCancelar()}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onCancelar} disabled={enviando}>
            Corregir
          </button>
          <button
            type="button"
            className={btnPrimary}
            onClick={onEnviar}
            disabled={!revisado || avisos === null || hayBloqueo(avisos) || enviando}
          >
            {enviando ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando…
              </>
            ) : (
              'Enviar'
            )}
          </button>
        </>
      }
    >
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        <dt className="text-ink-muted">Nombre completo</dt>
        <dd className="font-medium text-ink break-words">
          {datos.nombreCompleto || <span className="text-ink-subtle">Sin capturar</span>}
        </dd>
        <dt className="text-ink-muted">CURP</dt>
        <dd className="font-medium text-ink font-mono break-words">
          {datos.curp || <span className="text-ink-subtle">Sin capturar</span>}
        </dd>
        <dt className="text-ink-muted">NSS</dt>
        <dd className="font-medium text-ink font-mono break-words">
          {datos.nss || <span className="text-ink-subtle">Sin capturar</span>}
        </dd>
        <dt className="text-ink-muted">Fecha de nacimiento</dt>
        <dd className="font-medium text-ink break-words">
          {datos.fechaNacimiento ? (
            `${datos.fechaNacimiento.split('-').reverse().join('/')}${datos.edad ? ` (${datos.edad} años)` : ''}`
          ) : (
            <span className="text-ink-subtle">Sin capturar</span>
          )}
        </dd>
        <dt className="text-ink-muted">Género</dt>
        <dd className="font-medium text-ink break-words">
          {datos.genero || <span className="text-ink-subtle">Sin capturar</span>}
        </dd>
        <dt className="text-ink-muted">Empresa</dt>
        <dd className="font-medium text-ink break-words">
          {datos.empresa || <span className="text-ink-subtle">Sin capturar</span>}
        </dd>
        <dt className="text-ink-muted">Médico dictaminador</dt>
        <dd className="font-medium text-ink break-words">
          {datos.medicoDictaminador || <span className="text-ink-subtle">Sin capturar</span>}
        </dd>
      </dl>

      <div className="mt-5 space-y-2">
        {avisos === null ? (
          <div className="flex items-center gap-2 text-sm text-ink-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verificando la CURP y el NSS…
          </div>
        ) : (
          avisos.map((a, index) => (
            <div
              key={index}
              role={a.tipo === 'bloqueo' ? 'alert' : undefined}
              className={`flex gap-2 rounded-2xl p-3 text-sm ${
                a.tipo === 'bloqueo'
                  ? 'bg-red-50 text-red-800 ring-1 ring-red-200'
                  : a.tipo === 'alerta'
                    ? 'bg-amber-50 text-amber-900 ring-1 ring-amber-200'
                    : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200'
              }`}
            >
              {a.tipo === 'bloqueo' ? (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              ) : a.tipo === 'alerta' ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              ) : (
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              )}
              {a.texto}
            </div>
          ))
        )}

        {errorVerificacion && (
          <div
            role="alert"
            className="flex gap-2 rounded-2xl p-3 text-sm bg-amber-50 text-amber-900 ring-1 ring-amber-200"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {errorVerificacion}
          </div>
        )}
      </div>

      <label className="mt-5 flex items-start gap-3 text-sm font-medium text-ink">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 accent-crm-red"
          checked={revisado}
          disabled={hayBloqueo(avisos)}
          onChange={(e) => setRevisado(e.target.checked)}
        />
        Revisé los datos y son correctos.
      </label>
    </Modal>
  );
}
