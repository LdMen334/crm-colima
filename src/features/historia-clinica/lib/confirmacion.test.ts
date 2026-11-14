import { describe, expect, it } from 'vitest';
import { cambioDeIdentidad, evaluarIdentidad, hayBloqueo } from './confirmacion';
import type { PacienteRegistrado, IdentidadServidor, Capturado } from './confirmacion';
import type { HistoriaClinicaValues } from '../config/fields';

const p = (o: Partial<PacienteRegistrado> = {}): PacienteRegistrado => ({
  id: 'a',
  nombreCompleto: 'JUAN PEREZ',
  curp: 'GALJ850312HCMRPN09',
  nss: '12345678901',
  expedientes: 1,
  esEste: false,
  ...o,
});

const id = (o: Partial<IdentidadServidor> = {}): IdentidadServidor => ({
  porCurp: null,
  porNss: null,
  expedientesDelPaciente: null,
  ...o,
});

describe('confirmacion', () => {
  describe('evaluarIdentidad con esNuevo=true', () => {
    it('sin coincidencias → un solo aviso tipo "info" y texto contiene "Paciente nuevo"', () => {
      const identidad = id();
      const capturado: Capturado = {
        nombreCompleto: 'JUAN PEREZ',
        curp: 'GALJ850312HCMRPN09',
        nss: '12345678901',
      };
      const avisos = evaluarIdentidad(identidad, capturado, true);
      expect(avisos).toHaveLength(1);
      expect(avisos[0].tipo).toBe('info');
      expect(avisos[0].texto).toContain('Paciente nuevo');
    });

    it('porCurp p({id:"a"}) y porNss p({id:"b", nombreCompleto:"MARIA LOPEZ"}) → tipo "bloqueo" y el texto contiene "JUAN PEREZ" y "MARIA LOPEZ"', () => {
      const identidad = id({
        porCurp: p(),
        porNss: p({ id: 'b', nombreCompleto: 'MARIA LOPEZ' }),
      });
      const capturado: Capturado = {
        nombreCompleto: 'JUAN PEREZ',
        curp: 'GALJ850312HCMRPN09',
        nss: '12345678901',
      };
      const avisos = evaluarIdentidad(identidad, capturado, true);
      expect(avisos).toHaveLength(1);
      expect(avisos[0].tipo).toBe('bloqueo');
      expect(avisos[0].texto).toContain('JUAN PEREZ');
      expect(avisos[0].texto).toContain('MARIA LOPEZ');
    });

    it('porCurp p({nss:"99999999990"}) con capturado nss "12345678901" → "bloqueo" (otra NSS)', () => {
      const identidad = id({ porCurp: p({ nss: '99999999990' }) });
      const capturado: Capturado = {
        nombreCompleto: 'JUAN PEREZ',
        curp: 'GALJ850312HCMRPN09',
        nss: '12345678901',
      };
      const avisos = evaluarIdentidad(identidad, capturado, true);
      expect(avisos).toHaveLength(1);
      expect(avisos[0].tipo).toBe('bloqueo');
    });

    it('porNss p({curp:"PELM900101MCMRRR05"}) con capturado curp "GALJ850312HCMRPN09" → "bloqueo"', () => {
      const identidad = id({ porNss: p({ curp: 'PELM900101MCMRRR05' }) });
      const capturado: Capturado = {
        nombreCompleto: 'JUAN PEREZ',
        curp: 'GALJ850312HCMRPN09',
        nss: '12345678901',
      };
      const avisos = evaluarIdentidad(identidad, capturado, true);
      expect(avisos).toHaveLength(1);
      expect(avisos[0].tipo).toBe('bloqueo');
    });

    it('porCurp p({expedientes:2}) y capturado nombre "juan  pérez" (minúsculas, acento y doble espacio) → "info" y texto contiene "2 expedientes"', () => {
      const identidad = id({ porCurp: p({ expedientes: 2 }) });
      const capturado: Capturado = {
        nombreCompleto: 'juan  pérez',
        curp: 'GALJ850312HCMRPN09',
        nss: '12345678901',
      };
      const avisos = evaluarIdentidad(identidad, capturado, true);
      expect(avisos).toHaveLength(1);
      expect(avisos[0].tipo).toBe('info');
      expect(avisos[0].texto).toContain('2 expedientes');
    });

    it('porCurp p({}) y capturado nombre "CARLA SELENE" → "alerta", texto contiene "JUAN PEREZ" y "CARLA SELENE"', () => {
      const identidad = id({ porCurp: p() });
      const capturado: Capturado = {
        nombreCompleto: 'CARLA SELENE',
        curp: 'GALJ850312HCMRPN09',
        nss: '12345678901',
      };
      const avisos = evaluarIdentidad(identidad, capturado, true);
      expect(avisos).toHaveLength(1);
      expect(avisos[0].tipo).toBe('alerta');
      expect(avisos[0].texto).toContain('JUAN PEREZ');
      expect(avisos[0].texto).toContain('CARLA SELENE');
    });

    it('porCurp p({nss:""}) y capturado nss "12345678901" → NO es bloqueo (completa el NSS que faltaba): tipo "info"', () => {
      const identidad = id({ porCurp: p({ nss: '' }) });
      const capturado: Capturado = {
        nombreCompleto: 'JUAN PEREZ',
        curp: 'GALJ850312HCMRPN09',
        nss: '12345678901',
      };
      const avisos = evaluarIdentidad(identidad, capturado, true);
      expect(avisos).toHaveLength(1);
      expect(avisos[0].tipo).toBe('info');
    });
  });

  describe('evaluarIdentidad con esNuevo=false', () => {
    it('porCurp p({esEste:false}) → "bloqueo"', () => {
      const identidad = id({ porCurp: p({ esEste: false }) });
      const capturado: Capturado = {
        nombreCompleto: 'JUAN PEREZ',
        curp: 'GALJ850312HCMRPN09',
        nss: '12345678901',
      };
      const avisos = evaluarIdentidad(identidad, capturado, false);
      expect(avisos).toHaveLength(1);
      expect(avisos[0].tipo).toBe('bloqueo');
    });

    it('porCurp p({esEste:true}) con expedientesDelPaciente 3 → "alerta" y texto contiene "3 expedientes"', () => {
      const identidad = id({
        porCurp: p({ esEste: true }),
        expedientesDelPaciente: 3,
      });
      const capturado: Capturado = {
        nombreCompleto: 'JUAN PEREZ',
        curp: 'GALJ850312HCMRPN09',
        nss: '12345678901',
      };
      const avisos = evaluarIdentidad(identidad, capturado, false);
      expect(avisos).toHaveLength(1);
      expect(avisos[0].tipo).toBe('alerta');
      expect(avisos[0].texto).toContain('3 expedientes');
    });

    it('porCurp p({esEste:true}) con expedientesDelPaciente 1 → "info"', () => {
      const identidad = id({
        porCurp: p({ esEste: true }),
        expedientesDelPaciente: 1,
      });
      const capturado: Capturado = {
        nombreCompleto: 'JUAN PEREZ',
        curp: 'GALJ850312HCMRPN09',
        nss: '12345678901',
      };
      const avisos = evaluarIdentidad(identidad, capturado, false);
      expect(avisos).toHaveLength(1);
      expect(avisos[0].tipo).toBe('info');
    });
  });

  describe('hayBloqueo', () => {
    it('null → false', () => {
      expect(hayBloqueo(null)).toBe(false);
    });

    it('[{tipo:"alerta",texto:"x"}] → false', () => {
      expect(hayBloqueo([{ tipo: 'alerta', texto: 'x' }])).toBe(false);
    });

    it('[{tipo:"bloqueo",texto:"x"}] → true', () => {
      expect(hayBloqueo([{ tipo: 'bloqueo', texto: 'x' }])).toBe(true);
    });
  });

  describe('cambioDeIdentidad', () => {
    it('antes undefined → true', () => {
      const valores: Partial<HistoriaClinicaValues> = {
        nombreCompleto: 'JUAN PEREZ',
        curp: 'GALJ850312HCMRPN09',
        nss: '12345678901',
      };
      expect(cambioDeIdentidad(valores, undefined)).toBe(true);
    });

    it('mismo nombre con distinto acento/mayúsculas ("Juan Pérez" vs "JUAN PEREZ") → false', () => {
      const valores: Partial<HistoriaClinicaValues> = {
        nombreCompleto: 'Juan Pérez',
        curp: 'GALJ850312HCMRPN09',
        nss: '12345678901',
      };
      const antes: Partial<HistoriaClinicaValues> = {
        nombreCompleto: 'JUAN PEREZ',
        curp: 'GALJ850312HCMRPN09',
        nss: '12345678901',
      };
      expect(cambioDeIdentidad(valores, antes)).toBe(false);
    });

    it('curp "galj850312hcmrpn09" vs "GALJ850312HCMRPN09" → false', () => {
      const valores: Partial<HistoriaClinicaValues> = {
        nombreCompleto: 'JUAN PEREZ',
        curp: 'galj850312hcmrpn09',
        nss: '12345678901',
      };
      const antes: Partial<HistoriaClinicaValues> = {
        nombreCompleto: 'JUAN PEREZ',
        curp: 'GALJ850312HCMRPN09',
        nss: '12345678901',
      };
      expect(cambioDeIdentidad(valores, antes)).toBe(false);
    });

    it('nss "1234-56-78901" vs "12345678901" → false', () => {
      const valores: Partial<HistoriaClinicaValues> = {
        nombreCompleto: 'JUAN PEREZ',
        curp: 'GALJ850312HCMRPN09',
        nss: '1234-56-78901',
      };
      const antes: Partial<HistoriaClinicaValues> = {
        nombreCompleto: 'JUAN PEREZ',
        curp: 'GALJ850312HCMRPN09',
        nss: '12345678901',
      };
      expect(cambioDeIdentidad(valores, antes)).toBe(false);
    });

    it('fechaNacimiento distinta → true', () => {
      const valores: Partial<HistoriaClinicaValues> = {
        nombreCompleto: 'JUAN PEREZ',
        curp: 'GALJ850312HCMRPN09',
        nss: '12345678901',
        fechaNacimiento: '1985-03-12',
      };
      const antes: Partial<HistoriaClinicaValues> = {
        nombreCompleto: 'JUAN PEREZ',
        curp: 'GALJ850312HCMRPN09',
        nss: '12345678901',
        fechaNacimiento: '1985-03-13',
      };
      expect(cambioDeIdentidad(valores, antes)).toBe(true);
    });

    it('solo cambia un campo que no es de identidad (empresa) → false', () => {
      const valores: Partial<HistoriaClinicaValues> = {
        nombreCompleto: 'JUAN PEREZ',
        curp: 'GALJ850312HCMRPN09',
        nss: '12345678901',
        empresa: 'EMPRESA NUEVA',
      };
      const antes: Partial<HistoriaClinicaValues> = {
        nombreCompleto: 'JUAN PEREZ',
        curp: 'GALJ850312HCMRPN09',
        nss: '12345678901',
      };
      expect(cambioDeIdentidad(valores, antes)).toBe(false);
    });
  });
});
