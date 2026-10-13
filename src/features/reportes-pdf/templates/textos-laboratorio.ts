import type { FieldKey } from '@/features/historia-clinica/config/fields';

/** Leyendas de la hoja "Pruebas Complementarias", tal como aparecen en los formatos oficiales. */

export const DROGAS: { key: FieldKey; nombre: string; abrev: string; descripcion: string }[] = [
  {
    key: 'adCoc',
    nombre: 'COCAÍNA',
    abrev: 'COC',
    descripcion:
      'Esta prueba es útil para detectar la presencia de Cocaína y sus metabolitos Benzoilecgonina como el principal y Ecgonina. Un resultado "Reactivo" a Metabolitos de Cocaína puede deberse a la presencia de Cocaína o cualquiera de los metabolitos antes mencionados; sin embargo, por esta metodología no se puede diferenciar cuál de ellas es la que está presente.',
  },
  {
    key: 'adThc',
    nombre: 'TETRAHIDROCANNABINOL (THC)',
    abrev: 'THC',
    descripcion:
      'Esta prueba es de utilidad para detectar al metabolito principal de la marihuana y el hachís, el 11-nor-delta 9-THC-9-ácido carboxílico. Un resultado "Reactivo" a Metabolitos de THC puede deberse a la presencia de cualquiera de las antes mencionadas; sin embargo, por esta metodología no se puede diferenciar cuál de ellas es la que está presente.',
  },
  {
    key: 'adAmp',
    nombre: 'ANFETAMINAS',
    abrev: 'AMP',
    descripcion:
      'Esta prueba es útil para detectar la presencia de: Anfetamina, Metanfetamina, Metilendioxianfetamina (MDA), Metilendioximetanfetamina (MDMA) y Metilendioxietilanfetamina (MDEA). Un resultado "Reactivo" al Grupo de Anfetaminas puede deberse a la presencia de cualquiera de las antes mencionadas; sin embargo, por esta metodología no se puede diferenciar cuál de ellas es la que está presente.',
  },
  {
    key: 'adMet',
    nombre: 'METANFETAMINAS',
    abrev: 'MET',
    descripcion:
      'Esta prueba es útil para detectar la presencia de: Anfetamina, Metanfetamina, Metilendioxianfetamina (MDA), Metilendioximetanfetamina (MDMA) y Metilendioxietilanfetamina (MDEA). Un resultado "Reactivo" al Grupo de Anfetaminas puede deberse a la presencia de cualquiera de las antes mencionadas; sin embargo, por esta metodología no se puede diferenciar cuál de ellas es la que está presente.',
  },
  {
    key: 'adOpi',
    nombre: 'OPIÁCEOS',
    abrev: 'OPI',
    descripcion:
      'Esta prueba es útil para detectar la presencia de: Morfina, Morfina-3-glucurónido y Codeína. También detecta opiáceos sintéticos derivados de la morfina, como la hidromorfona, el analgésico meperidina y el antagonista narcótico nalorfina cuando se consumen en grandes cantidades. La heroína se convierte casi de inmediato en morfina, que se excreta a través de la orina tanto inalterada como en forma de metabolito glucuronado. Un resultado "Reactivo" al Grupo de Opiáceos puede deberse a la presencia de cualquiera de las drogas o su metabolito antes mencionados; sin embargo, por esta metodología no se puede diferenciar cuál de ellas es la que está presente.',
  },
  {
    key: 'adBzo',
    nombre: 'BENZODIACEPINAS',
    abrev: 'BZO',
    descripcion:
      'Esta prueba es útil para detectar la presencia de: Alprazolam, Clonazepam, Diazepam, Estazolam, Flunitrazepam, Flurazepam, Halazepam, Ketozolam, Medazepam, Nitrazepam, Midazolam, Oxazepam, Fenazepam, Prazepam, Temazepam, Tetrazepam, Triazolam y Lorazepam, Clordiazepóxido, Demoxepam y Bromazepam cuando se consumen en grandes cantidades. Un resultado "Reactivo" al Grupo de Benzodiacepinas puede deberse a la presencia de cualquiera de las antes mencionadas; sin embargo, por esta metodología no se puede diferenciar cuál de ellas es la que está presente.',
  },
];

/** Orden de la tabla horizontal de la hoja principal TX. */
export const ORDEN_TABLA_TX: FieldKey[] = ['adMet', 'adCoc', 'adOpi', 'adAmp', 'adBzo', 'adThc'];

export const AVISO_PRESUNTIVO =
  'El presente resultado es presuntivo y tiene utilidad clínica. Cualquier resultado Reactivo no confirmado, solo debe ser utilizado con fines médicos. En caso de requerir la prueba confirmatoria solicitarla al Laboratorio de manera expresa y sobre la misma muestra.';

export const METODO_DROGAS = 'Método: Inmunoensayo cromatográfico de flujo lateral (Lateral Flow Immunoassay, LFIA)';

export const TEXTO_GRUPO_RH =
  'Para la investigación del factor Rh se usa un suero anti-Rho (anti-D) mezcla monoclonal-policlonal. En los casos de Rh negativo se hace la investigación de la variante Du, la cual es tan antigénica como el antígeno D. La Norma Oficial Mexicana NOM-253-SSA1-2012 establece que "los tipos Rho(D), incluyendo el antígeno D expresado débilmente (Du) se clasificarán como positivos".';

export const METODO_GRUPO_RH = 'Método: Prueba de aglutinación directa en portaobjetos con antisueros.';
