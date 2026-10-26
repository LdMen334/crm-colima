/**
 * "Reducir hasta ajustar" (como en Excel) para las celdas del PDF: calcula el
 * tamaño de letra con el que un texto cabe en un recuadro dado, para que los
 * valores largos no agranden las filas ni empujen tablas a la hoja siguiente.
 *
 * Mide con las métricas AFM de Helvetica / Helvetica-Bold (las fuentes de las
 * plantillas) y simula el ajuste de línea por palabras, igual que @react-pdf
 * con la división silábica desactivada.
 */

// Ancho de los caracteres ASCII 32-126 en milésimas de em (pdfkit/js/data/*.afm)
const AFM = {
  regular:
    '278,278,355,556,556,889,667,222,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,222,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584',
  bold: '278,333,474,556,556,889,722,278,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,278,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584',
};
const ANCHOS = { regular: AFM.regular.split(',').map(Number), bold: AFM.bold.split(',').map(Number) };

/** Alto de línea de Helvetica en @react-pdf: (ascender − descender + lineGap) / 1000 del FontBBox. */
export const ALTO_LINEA = 1.16;

/** Ancho en pt de `texto` a `size` pt. Las letras acentuadas miden como su letra base. */
export function anchoTexto(texto: string, size: number, bold = false): number {
  const tabla = bold ? ANCHOS.bold : ANCHOS.regular;
  let total = 0;
  for (const ch of texto.normalize('NFD')) {
    const c = ch.charCodeAt(0);
    if (c >= 0x300 && c <= 0x36f) continue; // marca de acento combinada
    total += c >= 32 && c <= 126 ? tabla[c - 32] : 556;
  }
  return (total * size) / 1000;
}

/** Líneas que ocupa `texto` en un ancho de `ancho` pt, partiendo solo entre palabras (Infinity si una palabra no cabe). */
export function lineasTexto(texto: string, ancho: number, size: number, bold = false): number {
  const espacio = anchoTexto(' ', size, bold);
  let lineas = 0;
  for (const parrafo of texto.split('\n')) {
    lineas++;
    let actual = 0;
    for (const palabra of parrafo.split(/\s+/).filter(Boolean)) {
      const w = anchoTexto(palabra, size, bold);
      // Sin división silábica una palabra más ancha que la celda se desborda: no cabe con este tamaño
      if (w > ancho) return Infinity;
      if (actual > 0 && actual + espacio + w > ancho) {
        lineas++;
        actual = w;
      } else {
        actual += (actual > 0 ? espacio : 0) + w;
      }
    }
  }
  return lineas;
}

/**
 * Mayor tamaño de letra (≤ `base`, ≥ `minimo`) con el que `texto` cabe en el
 * recuadro `ancho` × `alto` pt. Si ni con el mínimo cabe, devuelve el mínimo y
 * la celda crece lo indispensable.
 */
export function tamanoAjustado(
  texto: string,
  ancho: number,
  alto: number,
  base: number,
  { bold = false, minimo = base * 0.5 } = {},
): number {
  if (!texto || ancho <= 0) return base;
  for (let size = base; size > minimo; size = Math.round((size - 0.1) * 100) / 100) {
    const caben = Math.max(1, Math.floor(alto / (size * ALTO_LINEA)));
    if (lineasTexto(texto, ancho, size, bold) <= caben) return size;
  }
  return minimo;
}
