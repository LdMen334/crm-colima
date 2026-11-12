/**
 * Borrador cifrado de lo capturado que todavía no llega al servidor: un expediente
 * nuevo sin guardar, o los cambios sin guardar de un expediente ya creado.
 *
 * Existe para un solo caso: el médico está capturando y se va el internet, se
 * cierra su sesión (otro login con su cuenta, inactividad) o cierra la ventana
 * por error. Al volver a entrar con la misma cuenta se le ofrece recuperarlo.
 *
 * Cada borrador ocupa una "ranura": `{userId}` para el expediente nuevo y
 * `{userId}:{clave}` para los cambios de un expediente guardado (ver ranura()).
 *
 * Por qué cifrado: son datos clínicos (LFPDPPP) y `localStorage` sobrevive a
 * cerrar el navegador. En el equipo solo queda texto cifrado con AES-GCM; la
 * llave la entrega el backend al iniciar sesión (distinta por cuenta) y vive
 * solo en memoria, así que sin iniciar sesión con esa cuenta no se puede leer.
 */

const PREFIJO = 'crm-hc-borrador:';
const VERSION = 1;
/** Pasado este tiempo el borrador se borra aunque nadie lo haya recuperado. */
export const VIGENCIA_MS = 24 * 60 * 60 * 1000;

let llave: CryptoKey | null = null;

/** Ranura del borrador: el expediente nuevo de la cuenta o un expediente guardado ("{anio}-{folio}"). */
export function ranura(userId: string, clave?: string | null): string {
  return clave ? `${userId}:${clave}` : userId;
}

/** Importa la llave de la cuenta (base64, 32 bytes) para cifrar y descifrar borradores. */
export async function establecerLlave(base64: string | undefined): Promise<void> {
  llave = null;
  // crypto.subtle solo existe en HTTPS o localhost. Sin él (o sin llave del
  // backend) simplemente no hay borrador: nunca debe impedir iniciar sesión.
  if (!base64 || typeof crypto === 'undefined' || !crypto.subtle) return;
  try {
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    // extractable = false: ni siquiera el propio código puede volver a exportarla.
    llave = await crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
  } catch {
    llave = null;
  }
}

export function hayLlave(): boolean {
  return llave !== null;
}

export function olvidarLlave(): void {
  llave = null;
}

/** Lo que se guarda en `localStorage`. `guardadoEn` va en claro solo para poder purgar sin la llave. */
interface Sobre {
  v: number;
  iv: string;
  datos: string;
  guardadoEn: string;
}

export interface Borrador<T> {
  values: T;
  guardadoEn: Date;
}

/** Almacenamiento inyectable para las pruebas; en el navegador es `localStorage`. */
type Almacen = Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;

function almacen(): Almacen | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null; // modo privado o almacenamiento bloqueado: no hay borrador
  }
}

const aBase64 = (b: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(b)));
const deBase64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
// La ranura (cuenta + expediente) va como dato autenticado: un borrador copiado a
// otra cuenta u otro expediente no se descifra.
const aad = (id: string) => new TextEncoder().encode(id);

/**
 * Cifra y guarda el borrador de una ranura. Si todavía no hay llave (sesión
 * restaurándose o sin HTTPS) no hace nada.
 */
export async function guardarBorrador<T>(id: string, values: T, s: Almacen | null = almacen()): Promise<void> {
  const k = llave;
  if (!k || !s) return;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const guardadoEn = new Date().toISOString();
  const claro = new TextEncoder().encode(JSON.stringify({ values, guardadoEn }));
  const cifrado = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: aad(id) }, k, claro);
  const sobre: Sobre = { v: VERSION, iv: aBase64(iv), datos: aBase64(cifrado), guardadoEn };
  try {
    s.setItem(PREFIJO + id, JSON.stringify(sobre));
  } catch {
    /* almacenamiento lleno o bloqueado: se pierde solo la red de seguridad */
  }
}

/**
 * Descifra el borrador de una ranura. Devuelve null si no hay, si venció o si no
 * se puede descifrar (otra llave, datos alterados); en esos dos casos lo borra.
 */
export async function leerBorrador<T>(id: string, s: Almacen | null = almacen()): Promise<Borrador<T> | null> {
  const k = llave;
  const raw = s?.getItem(PREFIJO + id);
  if (!k || !s || !raw) return null;
  try {
    const sobre = JSON.parse(raw) as Sobre;
    if (sobre.v !== VERSION || Date.now() - Date.parse(sobre.guardadoEn) > VIGENCIA_MS) throw new Error('vencido');
    const claro = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: deBase64(sobre.iv), additionalData: aad(id) },
      k,
      deBase64(sobre.datos),
    );
    const { values, guardadoEn } = JSON.parse(new TextDecoder().decode(claro)) as { values: T; guardadoEn: string };
    return { values, guardadoEn: new Date(guardadoEn) };
  } catch {
    s.removeItem(PREFIJO + id);
    return null;
  }
}

export function borrarBorrador(id: string, s: Almacen | null = almacen()): void {
  try {
    s?.removeItem(PREFIJO + id);
  } catch {
    /* sin almacenamiento: no hay nada que borrar */
  }
}

/** Borra los borradores vencidos de cualquier cuenta del equipo (no necesita la llave). */
export function purgarBorradoresVencidos(s: Almacen | null = almacen()): void {
  if (!s) return;
  try {
    const claves: string[] = [];
    for (let i = 0; i < s.length; i++) {
      const k = s.key(i);
      if (k?.startsWith(PREFIJO)) claves.push(k);
    }
    for (const k of claves) {
      let vencido = true;
      try {
        const { guardadoEn } = JSON.parse(s.getItem(k) ?? '') as Sobre;
        vencido = !(Date.now() - Date.parse(guardadoEn) <= VIGENCIA_MS);
      } catch {
        /* ilegible: se borra */
      }
      if (vencido) s.removeItem(k);
    }
  } catch {
    /* almacenamiento bloqueado */
  }
}

/**
 * Borradores de la cuenta que existen en este navegador (sin descifrar), para
 * llevar al médico a recuperarlos tras el login. `null` = el expediente nuevo;
 * texto = clave del expediente guardado con cambios pendientes. El nuevo va primero.
 */
export function borradoresDe(userId: string, s: Almacen | null = almacen()): (string | null)[] {
  const encontrados: (string | null)[] = [];
  try {
    for (let i = 0; s && i < s.length; i++) {
      const k = s.key(i);
      if (k === PREFIJO + userId) encontrados.unshift(null);
      else if (k?.startsWith(`${PREFIJO}${userId}:`)) encontrados.push(k.slice(PREFIJO.length + userId.length + 1));
    }
  } catch {
    /* almacenamiento bloqueado */
  }
  return encontrados;
}
