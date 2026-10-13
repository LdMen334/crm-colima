/**
 * Contraseñas temporales para las altas que hace Administración.
 *
 * - Aleatoriedad criptográfica (crypto.getRandomValues), sin sesgo de módulo.
 * - Siempre incluye mayúscula, minúscula, número y símbolo.
 * - Sin caracteres que se confunden al dictarla o copiarla a mano (0/O, 1/l/I).
 */

const MAYUSCULAS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const MINUSCULAS = 'abcdefghijkmnpqrstuvwxyz';
const NUMEROS = '23456789';
const SIMBOLOS = '!#$%&*+-=?@_';
const GRUPOS = [MAYUSCULAS, MINUSCULAS, NUMEROS, SIMBOLOS] as const;

export const LONGITUD_TEMPORAL = 12;
export const MIN_PASSWORD = 8;

/** Entero uniforme en [0, max) usando rechazo para no favorecer valores bajos. */
function aleatorio(max: number): number {
  const limite = Math.floor(0x1_0000_0000 / max) * max;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf);
  while (buf[0] >= limite);
  return buf[0] % max;
}

export function generarPasswordTemporal(longitud = LONGITUD_TEMPORAL): string {
  if (longitud < GRUPOS.length) throw new Error('Longitud insuficiente.');
  const todos = GRUPOS.join('');
  const chars = [
    ...GRUPOS.map((g) => g[aleatorio(g.length)]), // uno de cada grupo, garantizado
    ...Array.from({ length: longitud - GRUPOS.length }, () => todos[aleatorio(todos.length)]),
  ];
  // Fisher-Yates para que los obligatorios no queden siempre al inicio
  for (let i = chars.length - 1; i > 0; i--) {
    const j = aleatorio(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

/** Regla para contraseñas nuevas: mínimo 8 caracteres con al menos una letra y un número. */
export function problemaPassword(password: string): string | null {
  if (password.length < MIN_PASSWORD) return `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`;
  if (!/[A-Za-zÑñ]/.test(password) || !/\d/.test(password)) return 'La contraseña debe incluir letras y números.';
  return null;
}
