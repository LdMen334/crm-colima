import { MEDICOS_DICTAMINADORES } from './medicos';

/**
 * Catálogos pre-cargados.
 *  - En campos `select` se muestran como lista cerrada (con opción vacía: nada es obligatorio).
 *  - En campos `text` con catálogo se ofrecen como sugerencias, pero se permite texto libre.
 */
export const CATALOGOS = {
  religion: ['Católica', 'Cristiana', 'Ninguna', 'Atea', 'Negado', 'Otra'],
  escolaridad: [
    'Sin Escolaridad',
    'Primaria Incompleta',
    'Primaria Terminada',
    'Secundaria Incompleta',
    'Secundaria Terminada',
    'Preparatoria Incompleta',
    'Preparatoria Terminada',
    'Licenciatura Incompleta',
    'Licenciatura Terminada',
    'Maestría / Postgrado',
  ],
  // Campo 7 — "Motivo del Examen" (tipo_examen_motivo)
  motivoExamen: ['INGRESO / EVALUACIÓN INICIAL', 'RENOVACIÓN ANUAL', 'CONTROL PERIÓDICO / SEGUIMIENTO'],
  // Campo 15 — "Categoría del Examen / Puesto" (tipo_examen_categoria)
  categoriaExamen: ['PERSONAL GENERAL', 'OPERADORES', 'CAT B', 'CAT C', 'VISITA TEC'],
  genero: ['MASCULINO', 'FEMENINO'],
  estadoCivil: ['SOLTERO', 'CASADO', 'UNION LIBRE', 'DIVORCIADO', 'SEPARADO', 'VIUDO'],
  exposicionPoe: ['NEGADO', 'RUIDO', 'POLVO', 'RUIDO Y POLVO'],
  vivienda: ['CEMENTO', 'LADRILLO', 'MADERA', 'ADOBE', 'DEPARTAMENTO', 'RANCHO', 'VIVIENDA TEMPORAL', 'OTRA'],
  // Campo 81 — captura libre; solo sugerencias (valores vistos en los formatos)
  clasificacionTa: ['NORMAL', 'LIGERAMENTE ELEVADA', 'ALTA', 'MUY ALTA'],
  siNo: ['SI', 'NO'],
  lentesSeguridad: ['PX NO NECESITA LENTES GRADUADOS DE SEGURIDAD', 'PX REQUIERE LENTES GRADUADOS DE SEGURIDAD'],
  antidoping: ['NO REACTIVO', 'REACTIVO', 'NO REALIZADO'],
  grupoSanguineo: ['O POSITIVO', 'O NEGATIVO', 'A POSITIVO', 'A NEGATIVO', 'B POSITIVO', 'B NEGATIVO', 'AB POSITIVO', 'AB NEGATIVO'],
  gradiente: ['1', '2', '3', '4'],
  medicos: MEDICOS_DICTAMINADORES.map((m) => m.nombre),
  estados: [
    'AGUASCALIENTES', 'BAJA CALIFORNIA', 'BAJA CALIFORNIA SUR', 'CAMPECHE', 'CHIAPAS', 'CHIHUAHUA',
    'CIUDAD DE MEXICO', 'COAHUILA', 'COLIMA', 'DURANGO', 'ESTADO DE MEXICO', 'GUANAJUATO', 'GUERRERO',
    'HIDALGO', 'JALISCO', 'MICHOACAN', 'MORELOS', 'NAYARIT', 'NUEVO LEON', 'OAXACA', 'PUEBLA', 'QUERETARO',
    'QUINTANA ROO', 'SAN LUIS POTOSI', 'SINALOA', 'SONORA', 'TABASCO', 'TAMAULIPAS', 'TLAXCALA',
    'VERACRUZ', 'YUCATAN', 'ZACATECAS',
  ],
} as const;

export type CatalogoKey = keyof typeof CATALOGOS;
