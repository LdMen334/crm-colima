import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { borradoresDe, borrarBorrador, establecerLlave, ranura, guardarBorrador, leerBorrador, olvidarLlave, purgarBorradoresVencidos, VIGENCIA_MS } from './borrador';

/** localStorage mínimo en memoria (las pruebas corren en Node). */
function memoria(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    key: (i) => [...m.keys()][i] ?? null,
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
  };
}

const LLAVE_A = btoa(String.fromCharCode(...new Uint8Array(32).fill(7)));
const LLAVE_B = btoa(String.fromCharCode(...new Uint8Array(32).fill(9)));
const valores = { nombreCompleto: 'PACIENTE DE PRUEBA', curp: 'XAXX010101HCMXXX01' };

describe('borrador cifrado', () => {
  let s: Storage;
  beforeEach(async () => {
    s = memoria();
    await establecerLlave(LLAVE_A);
  });
  afterEach(() => {
    vi.useRealTimers();
    olvidarLlave();
  });

  it('guarda cifrado: el texto del paciente no aparece en el almacenamiento', async () => {
    await guardarBorrador('u1', valores, s);
    const raw = s.getItem('crm-hc-borrador:u1')!;
    expect(raw).toBeTruthy();
    expect(raw).not.toContain('PACIENTE');
    expect(raw).not.toContain('XAXX');
  });

  it('se recupera con la misma llave y la misma cuenta', async () => {
    await guardarBorrador('u1', valores, s);
    const b = await leerBorrador<typeof valores>('u1', s);
    expect(b?.values).toEqual(valores);
  });

  it('con otra llave no se descifra y se borra', async () => {
    await guardarBorrador('u1', valores, s);
    await establecerLlave(LLAVE_B);
    expect(await leerBorrador('u1', s)).toBeNull();
    expect(s.getItem('crm-hc-borrador:u1')).toBeNull();
  });

  it('copiado a otra cuenta no se descifra', async () => {
    await guardarBorrador('u1', valores, s);
    s.setItem('crm-hc-borrador:u2', s.getItem('crm-hc-borrador:u1')!);
    expect(await leerBorrador('u2', s)).toBeNull();
  });

  it('sin llave no guarda ni lee', async () => {
    olvidarLlave();
    await guardarBorrador('u1', valores, s);
    expect(s.length).toBe(0);
  });

  it('vence a las 24 horas', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    await guardarBorrador('u1', valores, s);
    vi.setSystemTime(Date.now() + VIGENCIA_MS + 1000);
    expect(await leerBorrador('u1', s)).toBeNull();
  });

  it('purga sin llave solo los vencidos', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    await guardarBorrador('viejo', valores, s);
    vi.setSystemTime(Date.now() + VIGENCIA_MS + 1000);
    await guardarBorrador('nuevo', valores, s);
    olvidarLlave();
    purgarBorradoresVencidos(s);
    expect(s.getItem('crm-hc-borrador:viejo')).toBeNull();
    expect(s.getItem('crm-hc-borrador:nuevo')).not.toBeNull();
  });

  it('cada expediente tiene su ranura y no se cruzan', async () => {
    await guardarBorrador(ranura('u1', '2026-6'), { a: '1' }, s);
    s.setItem('crm-hc-borrador:u1:2026-7', s.getItem('crm-hc-borrador:u1:2026-6')!);
    expect(await leerBorrador(ranura('u1', '2026-6'), s)).not.toBeNull();
    expect(await leerBorrador(ranura('u1', '2026-7'), s)).toBeNull();
  });

  it('lista los borradores de la cuenta con el nuevo primero', async () => {
    await guardarBorrador(ranura('u1', '2026-6'), valores, s);
    await guardarBorrador(ranura('u1'), valores, s);
    await guardarBorrador(ranura('u10'), valores, s);
    expect(borradoresDe('u1', s)).toEqual([null, '2026-6']);
  });

  it('borrar elimina el de la cuenta', async () => {
    await guardarBorrador('u1', valores, s);
    borrarBorrador('u1', s);
    expect(s.getItem('crm-hc-borrador:u1')).toBeNull();
  });
});
