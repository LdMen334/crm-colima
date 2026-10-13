/**
 * Cálculos clínicos puros (sin React) — fáciles de probar y reutilizables
 * en el formulario, en el PDF y en el backend.
 */

// ───────────────────────── Edad y grupo de edad ─────────────────────────

export type GrupoEdad = '< 26' | '26-35' | '36-45' | '46-50' | '> 50';

/** Acepta "AAAA-MM-DD" (input type=date) o "DD-MM-AAAA" (formato institucional). */
export function parseFecha(value: string | null | undefined): Date | null {
  if (!value) return null;
  const v = value.trim();
  let y: number, m: number, d: number;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
    [y, m, d] = v.split('-').map(Number);
  } else if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(v)) {
    [d, m, y] = v.split(/[-/]/).map(Number);
  } else {
    return null;
  }
  const date = new Date(y, m - 1, d);
  // Rechaza fechas imposibles como 31-02-2000
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

/** Edad en años cumplidos. `referencia` = hoy por defecto (o la fecha de estudios). */
export function calcularEdad(fechaNacimiento: string | null | undefined, referencia: Date = new Date()): number | null {
  const fn = parseFecha(fechaNacimiento);
  if (!fn || fn > referencia) return null;
  let edad = referencia.getFullYear() - fn.getFullYear();
  const aunNoCumple =
    referencia.getMonth() < fn.getMonth() ||
    (referencia.getMonth() === fn.getMonth() && referencia.getDate() < fn.getDate());
  if (aunNoCumple) edad--;
  return edad >= 0 && edad <= 120 ? edad : null;
}

export function calcularGrupoEdad(edad: number | null): GrupoEdad | null {
  if (edad === null) return null;
  if (edad < 26) return '< 26';
  if (edad <= 35) return '26-35';
  if (edad <= 45) return '36-45';
  if (edad <= 50) return '46-50';
  return '> 50';
}

// ───────────────────────── IMC y estado nutricional ─────────────────────────

export type EstadoNutricional =
  | 'BAJO PESO'
  | 'PESO NORMAL'
  | 'SOBREPESO'
  | 'OBESIDAD I'
  | 'OBESIDAD II'
  | 'OBESIDAD III';

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/**
 * Normaliza la talla a metros.
 *  - 0.30 – 3.00  → ya está en metros (1.70)
 *  - 50 – 250     → está en centímetros (170 → 1.70)
 *  - otro valor   → incompleto o implausible (p. ej. el usuario va tecleando "17") → null
 */
export function normalizarTallaMetros(talla: unknown): number | null {
  const t = toNumber(talla);
  if (t === null || t <= 0) return null;
  if (t >= 0.3 && t <= 3) return t;
  if (t >= 50 && t <= 250) return t / 100;
  return null;
}

/** IMC redondeado a 2 decimales, como en los formatos oficiales (el valor mostrado es el que se clasifica). */
export function calcularIMC(peso: unknown, talla: unknown): number | null {
  const p = toNumber(peso);
  const tM = normalizarTallaMetros(talla);
  if (p === null || p <= 0 || p > 400 || tM === null) return null;
  return Math.round((p / (tM * tM)) * 100) / 100;
}

/** Clasificación OMS. */
export function clasificarIMC(imc: number | null): EstadoNutricional | null {
  if (imc === null) return null;
  if (imc < 18.5) return 'BAJO PESO';
  if (imc < 25) return 'PESO NORMAL';
  if (imc < 30) return 'SOBREPESO';
  if (imc < 35) return 'OBESIDAD I';
  if (imc < 40) return 'OBESIDAD II';
  return 'OBESIDAD III';
}

// ───────────────────────── Presión arterial (campo 80) ─────────────────────────

export function formatearTA(sis: unknown, dia: unknown): string | null {
  const s = toNumber(sis);
  const d = toNumber(dia);
  return s !== null && d !== null ? `${s}/${d}` : null;
}

// ───────────────────────── Fecha de siguiente valoración ─────────────────────────

/** Fecha + N meses en formato AAAA-MM-DD (ajusta fin de mes: 31-ago + 6 → 28/29-feb). */
export function sumarMeses(fecha: string, meses: number): string | null {
  const d = parseFecha(fecha);
  if (!d) return null;
  const objetivo = new Date(d.getFullYear(), d.getMonth() + meses, 1);
  const ultimoDia = new Date(objetivo.getFullYear(), objetivo.getMonth() + 1, 0).getDate();
  objetivo.setDate(Math.min(d.getDate(), ultimoDia));
  const mm = String(objetivo.getMonth() + 1).padStart(2, '0');
  const dd = String(objetivo.getDate()).padStart(2, '0');
  return `${objetivo.getFullYear()}-${mm}-${dd}`;
}
