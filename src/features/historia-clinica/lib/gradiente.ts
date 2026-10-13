/**
 * Gradiente (campo 205): evaluación global de aptitud, 1 a 4.
 * Una sola regla de color para los reportes PDF (PECO / TX) y el Excel.
 *
 *  1 → verde · 2 → amarillo · 3 → naranja · 4 → rojo
 *
 * PECO lo imprime como Magnitud de Riesgo: clasificación base "B" + gradiente (B1…B4).
 * TX lo imprime solo como número (1…4).
 */

export type NivelGradiente = 1 | 2 | 3 | 4;

/** Clasificación base de la plantilla PECO. */
export const CLASIFICACION_PECO = 'B';

export const GRADIENTE_COLOR: Record<NivelGradiente, { fondo: string; texto: string }> = {
  1: { fondo: '#00B050', texto: '#FFFFFF' },
  2: { fondo: '#FFFF00', texto: '#000000' },
  3: { fondo: '#FF9800', texto: '#000000' },
  4: { fondo: '#FF0000', texto: '#FFFFFF' },
};

/** "1", " 2 ", "G3" o "B4" → 1-4; cualquier otro valor → null. */
export function nivelGradiente(valor: string | null | undefined): NivelGradiente | null {
  const m = /^\s*[GB]?\s*([1-4])\s*$/i.exec(valor ?? '');
  return m ? (Number(m[1]) as NivelGradiente) : null;
}

/** Magnitud de Riesgo de PECO: "B" + gradiente (B1…B4), o null sin gradiente válido. */
export function magnitudRiesgoPeco(valor: string | null | undefined): string | null {
  const n = nivelGradiente(valor);
  return n ? `${CLASIFICACION_PECO}${n}` : null;
}
