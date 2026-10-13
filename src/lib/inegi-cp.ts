/**
 * Búsqueda de código postal → estado, municipio y colonias (datos INEGI / SEPOMEX).
 *
 * Los datos viven en public/data/cp/{NN}.json, un archivo por los 2 primeros dígitos
 * del CP, generados con scripts/build-cp-inegi.mjs. Solo se descarga el fragmento
 * del CP consultado (Colima, 28xxx, pesa ~26 KB) y se guarda en memoria.
 */

export interface CpInfo {
  estado: string;
  municipio: string;
  colonias: string[];
}

/** Forma compacta de cada entrada en los archivos de public/data/cp/. */
interface CpEntrada {
  e: string;
  m: string;
  c: string[];
}

export const CP_BASE_URL = '/data/cp';

/** Convierte un fragmento JSON en un mapa CP → info, ignorando entradas mal formadas. */
export function parseFragmento(json: unknown): Map<string, CpInfo> {
  const out = new Map<string, CpInfo>();
  if (!json || typeof json !== 'object' || Array.isArray(json)) return out;
  for (const [cp, v] of Object.entries(json as Record<string, Partial<CpEntrada>>)) {
    if (!/^\d{5}$/.test(cp) || !v?.e) continue;
    out.set(cp, { estado: v.e, municipio: v.m ?? '', colonias: Array.isArray(v.c) ? v.c : [] });
  }
  return out;
}

const fragmentos = new Map<string, Promise<Map<string, CpInfo>>>();

function cargarFragmento(prefijo: string): Promise<Map<string, CpInfo>> {
  let p = fragmentos.get(prefijo);
  if (!p) {
    p = fetch(`${CP_BASE_URL}/${prefijo}.json`)
      .then((r) => (r.ok ? r.json() : null)) // 404: no existe ningún CP con ese prefijo
      .then(parseFragmento)
      .catch(() => {
        fragmentos.delete(prefijo); // error de red: reintentar en la próxima búsqueda
        return new Map<string, CpInfo>();
      });
    fragmentos.set(prefijo, p);
  }
  return p;
}

/** `null` si el CP no tiene 5 dígitos o no existe en el catálogo. */
export async function buscarCp(cp: string): Promise<CpInfo | null> {
  if (!/^\d{5}$/.test(cp)) return null;
  return (await cargarFragmento(cp.slice(0, 2))).get(cp) ?? null;
}
