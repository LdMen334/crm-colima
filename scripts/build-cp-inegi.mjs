#!/usr/bin/env node
/**
 * Genera el catálogo de códigos postales a partir de
 * https://github.com/angelsantosa/inegi-lista-estados (carpeta codes/{estado}/{municipio}.json).
 *
 *   git clone --depth 1 https://github.com/angelsantosa/inegi-lista-estados.git /ruta/inegi
 *   node scripts/build-cp-inegi.mjs /ruta/inegi
 *
 * Salida: public/data/cp/{NN}.json, un archivo por los 2 primeros dígitos del CP,
 * con la forma { "28000": { "e": estado, "m": municipio, "c": [colonias] } }.
 * Así el navegador descarga solo el fragmento del CP que se escribe, no 69 MB.
 *
 * ⚠️ Licencia: los datos de ese repositorio se publican bajo GPL-3.0 (ver README › Código postal).
 */
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const src = process.argv[2];
if (!src) {
  console.error('Uso: node scripts/build-cp-inegi.mjs <ruta al clon de inegi-lista-estados>');
  process.exit(1);
}

/** Clave INEGI de entidad → nombre tal como está en el catálogo `estados` del formulario. */
const ESTADOS = [
  '', 'AGUASCALIENTES', 'BAJA CALIFORNIA', 'BAJA CALIFORNIA SUR', 'CAMPECHE', 'COAHUILA', 'COLIMA',
  'CHIAPAS', 'CHIHUAHUA', 'CIUDAD DE MEXICO', 'DURANGO', 'GUANAJUATO', 'GUERRERO', 'HIDALGO', 'JALISCO',
  'ESTADO DE MEXICO', 'MICHOACAN', 'MORELOS', 'NAYARIT', 'NUEVO LEON', 'OAXACA', 'PUEBLA', 'QUERETARO',
  'QUINTANA ROO', 'SAN LUIS POTOSI', 'SINALOA', 'SONORA', 'TABASCO', 'TAMAULIPAS', 'TLAXCALA', 'VERACRUZ',
  'YUCATAN', 'ZACATECAS',
];

const upper = (s) => String(s ?? '').trim().replace(/\s+/g, ' ').toLocaleUpperCase('es-MX');

const codesDir = join(resolve(src), 'codes');
const porCp = new Map();
let registros = 0;

for (const estadoDir of readdirSync(codesDir)) {
  for (const archivo of readdirSync(join(codesDir, estadoDir))) {
    if (!archivo.endsWith('.json')) continue;
    const filas = JSON.parse(readFileSync(join(codesDir, estadoDir, archivo), 'utf8'));
    for (const r of filas) {
      const cp = String(r.codigo_postal_asentamiento ?? '').padStart(5, '0');
      const estado = ESTADOS[Number(r.clave_estado)];
      if (!/^\d{5}$/.test(cp) || !estado || !r.nombre_asentamiento) continue;
      registros++;
      let info = porCp.get(cp);
      if (!info) {
        // Un CP pertenece a un solo municipio en SEPOMEX; se conserva el primero encontrado.
        info = { e: estado, m: upper(r.nombre_municipio), c: [] };
        porCp.set(cp, info);
      }
      const colonia = upper(r.nombre_asentamiento);
      if (!info.c.includes(colonia)) info.c.push(colonia);
    }
  }
}

const out = resolve('public/data/cp');
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const shards = new Map();
for (const cp of [...porCp.keys()].sort()) {
  const info = porCp.get(cp);
  info.c.sort((a, b) => a.localeCompare(b, 'es'));
  const k = cp.slice(0, 2);
  if (!shards.has(k)) shards.set(k, {});
  shards.get(k)[cp] = info;
}
let bytes = 0;
for (const [k, data] of shards) {
  const json = JSON.stringify(data);
  bytes += json.length;
  writeFileSync(join(out, `${k}.json`), json);
}

console.log(
  `${registros} asentamientos → ${porCp.size} códigos postales en ${shards.size} archivos (${(bytes / 1e6).toFixed(1)} MB) en public/data/cp/`,
);
