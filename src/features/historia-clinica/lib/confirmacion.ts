import { claveCurp, claveNss } from '@/features/pacientes/api';
import type { HistoriaClinicaValues } from '../config/fields';

/**
 * Lógica de la ventana "Confirma los datos del paciente" que aparece antes de
 * guardar. Existe porque en nov-2026 varias altas con la CURP de otra persona
 * juntaron a pacientes distintos en un solo registro (auditoría run-1, H01): la
 * ventana dice a quién pertenecen la CURP y el NSS ANTES de enviar.
 */

/** Datos fijos del paciente: viven en el registro del paciente, no en el folio. */
export const CAMPOS_IDENTIDAD = ['nombreCompleto', 'curp', 'nss', 'fechaNacimiento', 'genero'] as const;

/** Paciente ya registrado con la CURP o el NSS capturados (respuesta de GET /pacientes/identidad). */
export interface PacienteRegistrado {
  id: string;
  nombreCompleto: string;
  curp: string;
  nss: string;
  expedientes: number;
  /** true si es el paciente del expediente que se está editando. */
  esEste: boolean;
}

export interface IdentidadServidor {
  porCurp: PacienteRegistrado | null;
  porNss: PacienteRegistrado | null;
  /** Expedientes del paciente del folio que se edita; null en un expediente nuevo. */
  expedientesDelPaciente: number | null;
}

export interface Aviso {
  /** bloqueo: el servidor lo rechazaría; alerta: revisar antes de enviar; info: contexto. */
  tipo: 'bloqueo' | 'alerta' | 'info';
  texto: string;
}

export type Capturado = Pick<HistoriaClinicaValues, 'nombreCompleto' | 'curp' | 'nss'>;

/** Nombre comparable: mayúsculas, sin acentos ni espacios repetidos. */
const claveNombre = (v: string | undefined) =>
  (v ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]+/g, ' ')
    .trim();

const plural = (n: number) => `${n} expediente${n === 1 ? '' : 's'}`;

/**
 * ¿Cambió algún dato fijo del paciente respecto a lo guardado? Al editar, solo en
 * ese caso se pide confirmación: el cambio se aplica a todos sus expedientes. Los
 * guardados de datos clínicos (lo más frecuente) no muestran la ventana.
 */
export function cambioDeIdentidad(
  valores: Partial<HistoriaClinicaValues>,
  antes: Partial<HistoriaClinicaValues> | undefined,
): boolean {
  if (!antes) return true;
  return (
    claveNombre(valores.nombreCompleto) !== claveNombre(antes.nombreCompleto) ||
    claveCurp(valores.curp) !== claveCurp(antes.curp) ||
    claveNss(valores.nss) !== claveNss(antes.nss) ||
    (valores.fechaNacimiento ?? '') !== (antes.fechaNacimiento ?? '') ||
    (valores.genero ?? '') !== (antes.genero ?? '')
  );
}

/**
 * Traduce la respuesta del servidor a avisos para el médico. Las reglas de
 * "bloqueo" son las mismas con las que el backend rechaza el guardado
 * (PacienteUpsertService), para que el médico lo sepa antes de enviar.
 *
 * @param identidad respuesta de GET /pacientes/identidad
 * @param capturado nombre, CURP y NSS escritos en el formulario
 * @param esNuevo true en un expediente que aún no está guardado
 */
export function evaluarIdentidad(identidad: IdentidadServidor, capturado: Capturado, esNuevo: boolean): Aviso[] {
  const { porCurp, porNss } = identidad;
  const curp = claveCurp(capturado.curp);
  const nss = claveNss(capturado.nss);

  if (!esNuevo) {
    const avisos: Aviso[] = [];
    if (porCurp && !porCurp.esEste) {
      avisos.push({
        tipo: 'bloqueo',
        texto: `Esa CURP ya pertenece a ${porCurp.nombreCompleto}. Verifica la captura.`,
      });
    }
    if (porNss && !porNss.esEste) {
      avisos.push({
        tipo: 'bloqueo',
        texto: `Ese NSS ya pertenece a ${porNss.nombreCompleto}. Verifica la captura.`,
      });
    }
    if (avisos.length) return avisos;
    const n = identidad.expedientesDelPaciente ?? 1;
    return [
      n > 1
        ? {
            tipo: 'alerta',
            texto: `Estos datos son del paciente, no solo de este folio: el cambio se aplicará en sus ${plural(n)}.`,
          }
        : {
            tipo: 'info',
            texto: 'El cambio se aplicará a los datos del paciente.',
          },
    ];
  }

  if (porCurp && porNss && porCurp.id !== porNss.id) {
    return [
      {
        tipo: 'bloqueo',
        texto: `La CURP es de ${porCurp.nombreCompleto} y el NSS es de ${porNss.nombreCompleto}: son pacientes distintos. Revisa cuál está mal.`,
      },
    ];
  }
  if (porCurp && nss && porCurp.nss && porCurp.nss !== nss) {
    return [
      {
        tipo: 'bloqueo',
        texto: `Esa CURP ya está registrada a nombre de ${porCurp.nombreCompleto} con otro NSS. Verifica la captura.`,
      },
    ];
  }
  if (porNss && curp && porNss.curp && porNss.curp !== curp) {
    return [
      {
        tipo: 'bloqueo',
        texto: `Ese NSS ya está registrado a nombre de ${porNss.nombreCompleto} con otra CURP. Verifica la captura.`,
      },
    ];
  }

  const registrado = porCurp ?? porNss;
  if (!registrado) return [{ tipo: 'info', texto: 'Paciente nuevo: se creará su registro.' }];

  const clave = porCurp ? 'CURP' : 'NSS';
  if (claveNombre(registrado.nombreCompleto) === claveNombre(capturado.nombreCompleto)) {
    return [
      {
        tipo: 'info',
        texto: `Paciente ya registrado (${plural(registrado.expedientes)}): este folio se agregará a su historial.`,
      },
    ];
  }
  return [
    {
      tipo: 'alerta',
      texto:
        `Esa ${clave} ya está registrada a nombre de ${registrado.nombreCompleto} (${plural(registrado.expedientes)}). ` +
        `Si es la misma persona, su nombre cambiará a «${capturado.nombreCompleto.trim()}» en todos sus expedientes. ` +
        `Si es otra persona, corrige la ${clave} antes de enviar.`,
    },
  ];
}

/** Hay algún aviso que el servidor rechazaría: no se permite enviar. */
export const hayBloqueo = (avisos: Aviso[] | null) => !!avisos?.some((a) => a.tipo === 'bloqueo');
