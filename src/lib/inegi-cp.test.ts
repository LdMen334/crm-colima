import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseFragmento } from './inegi-cp';
import { CATALOGOS } from '@/features/historia-clinica/config/catalogs';

const fragmento = (nn: string) =>
  parseFragmento(JSON.parse(readFileSync(path.resolve(__dirname, `../../public/data/cp/${nn}.json`), 'utf8')));

describe('catálogo INEGI de códigos postales', () => {
  it('resuelve CP de Colima con estado, municipio y colonias', () => {
    const colima = fragmento('28');
    expect(colima.get('28000')).toEqual({ estado: 'COLIMA', municipio: 'COLIMA', colonias: ['COLIMA CENTRO'] });
    const varias = colima.get('28010')!;
    expect(varias.colonias.length).toBeGreaterThan(1);
    expect(colima.get('28970')?.municipio).toBe('VILLA DE ÁLVAREZ');
  });

  it('usa exactamente los nombres de estado del catálogo del formulario', () => {
    const estados = new Set<string>(CATALOGOS.estados);
    for (const nn of ['01', '06', '28', '44', '58', '91', '97']) {
      for (const info of fragmento(nn).values()) expect(estados.has(info.estado)).toBe(true);
    }
  });

  it('ignora entradas mal formadas', () => {
    expect(parseFragmento({ '2800': { e: 'X' }, '28001': { m: 'Y' } }).size).toBe(0);
    expect(parseFragmento([]).size).toBe(0);
    expect(parseFragmento(null).size).toBe(0);
  });
});
