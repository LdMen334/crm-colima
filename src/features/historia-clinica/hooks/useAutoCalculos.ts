'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import type { FieldKey, HistoriaClinicaValues } from '../config/fields';
import {
  calcularEdad,
  calcularGrupoEdad,
  calcularIMC,
  clasificarIMC,
  formatearTA,
  normalizarTallaMetros,
  parseFecha,
  sumarMeses,
} from '../lib/calculations';

/**
 * Observadores de React Hook Form para los campos autocalculados:
 *
 *  Fecha de nacimiento (16) ─┬─► Edad (17)
 *  Fecha de estudios (2)  ───┘   └─► Grupo de edad (18)
 *
 *  Peso (82) + Talla (83) ─► IMC (84) ─► Estado nutricional (85)
 *
 *  TA sistólica (78) + diastólica (79) ─► TA conjunta (80)
 *  (La clasificación de T/A, campo 81, la escribe el médico.)
 *
 *  Fecha de estudios (2) ─► Fecha de siguiente valoración (R2) = +6 meses, solo como
 *  sugerencia: si el médico la escribe a mano, ya no se sobrescribe.
 *
 * La edad se calcula a la fecha de realización de los estudios cuando existe
 * (lo correcto para un expediente laboral); si no, a la fecha de hoy.
 */
export function useAutoCalculos(form: UseFormReturn<HistoriaClinicaValues>) {
  const { control, setValue, getValues } = form;

  const [fechaNacimiento, fechaEstudios, peso, talla, sistolica, diastolica] = useWatch({
    control,
    name: ['fechaNacimiento', 'fechaEstudios', 'peso', 'talla', 'taSistolica', 'taDiastolica'],
  });

  /** Solo escribe si el valor cambió, para no provocar renders en cadena. */
  const setDerived = useCallback(
    (key: FieldKey, value: string) => {
      if (getValues(key) !== value) setValue(key, value, { shouldDirty: true });
    },
    [getValues, setValue],
  );

  // Edad + Grupo de edad
  useEffect(() => {
    const referencia = parseFecha(fechaEstudios) ?? new Date();
    const edad = calcularEdad(fechaNacimiento, referencia);
    setDerived('edad', edad === null ? '' : String(edad));
    setDerived('grupoEdad', calcularGrupoEdad(edad) ?? '');
  }, [fechaNacimiento, fechaEstudios, setDerived]);

  // IMC + Estado nutricional (la talla en cm se convierte a m dentro de calcularIMC)
  useEffect(() => {
    const imc = calcularIMC(peso, talla);
    setDerived('imc', imc === null ? '' : imc.toFixed(2));
    setDerived('estadoNutricional', clasificarIMC(imc) ?? '');
  }, [peso, talla, setDerived]);

  // Presión arterial: lectura conjunta "122/82"
  useEffect(() => {
    setDerived('taConjunta', formatearTA(sistolica, diastolica) ?? '');
  }, [sistolica, diastolica, setDerived]);

  // Siguiente valoración sugerida (+6 meses), respetando una captura manual
  const ultimaSugerencia = useRef('');
  useEffect(() => {
    const actual = getValues('fechaSiguienteValoracion');
    if (actual && actual !== ultimaSugerencia.current) return; // capturada a mano
    const sugerida = sumarMeses(fechaEstudios, 6) ?? '';
    ultimaSugerencia.current = sugerida;
    setDerived('fechaSiguienteValoracion', sugerida);
  }, [fechaEstudios, getValues, setDerived]);

  /**
   * Al salir del campo Talla, si el usuario escribió centímetros (170),
   * se reescribe en metros (1.70) para que el expediente y el PDF queden en la unidad oficial.
   */
  const normalizarTallaAlSalir = useCallback(() => {
    const actual = getValues('talla');
    const metros = normalizarTallaMetros(actual);
    if (metros !== null && Number(actual) !== metros) {
      setValue('talla', metros.toFixed(2), { shouldDirty: true });
    }
  }, [getValues, setValue]);

  return { normalizarTallaAlSalir };
}
