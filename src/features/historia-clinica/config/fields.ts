import type { CatalogoKey } from './catalogs';

/**
 * Fuente única de verdad de los 206 encabezados de la Historia Clínica.
 * El formulario, el panel de resumen y las plantillas PDF (PECO / TX) se
 * generan a partir de esta lista, así que el orden y las etiquetas se
 * mantienen idénticos en pantalla y en el documento impreso.
 *
 * El Código Postal NO está aquí a propósito: es un asistente de captura
 * exclusivo del front-end y nunca debe llegar al PDF.
 */

export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'tel' | 'computed';

type Raw = readonly [n: number, key: string, label: string, type?: FieldType, catalog?: CatalogoKey];

const RAW = [
  // ── Módulo 1 · Identificación y Datos Generales (1-26)
  [1, 'folio', 'Folio de paciente'],
  [2, 'fechaEstudios', 'Fecha de realización de los estudios', 'date'],
  [3, 'nombreCompleto', 'Nombre completo'],
  [4, 'puesto', 'Puesto'],
  [5, 'empresa', 'Empresa (tarjeta de acceso)'],
  [6, 'zonaTrabajo', 'Zona de trabajo'],
  [7, 'tipoExamenMotivo', 'Motivo del Examen', 'select', 'motivoExamen'],
  [8, 'antiguedadEmpresa', 'Antigüedad en la empresa'],
  [9, 'antiguedadPuesto', 'Antigüedad en el puesto'],
  [10, 'exposicionPoe', 'Exposición (POE)', 'text', 'exposicionPoe'],
  [11, 'nss', 'IMSS NSS'],
  [12, 'curp', 'CURP'],
  [13, 'genero', 'Género', 'select', 'genero'],
  [14, 'area', 'Área'],
  [15, 'tipoExamenCategoria', 'Categoría del Examen / Puesto', 'select', 'categoriaExamen'],
  [16, 'fechaNacimiento', 'Fecha de nacimiento', 'date'],
  [17, 'edad', 'Edad', 'computed'],
  [18, 'grupoEdad', 'Grupo de edad', 'computed'],
  [19, 'domicilioCalle', 'Calle y número'],
  [20, 'domicilioColonia', 'Colonia'],
  [21, 'domicilioMunicipio', 'Municipio'],
  [22, 'domicilioEstado', 'Estado', 'text', 'estados'],
  [23, 'telefono', 'Teléfono', 'tel'],
  [24, 'originario', 'Originario (estado)', 'text', 'estados'],
  [25, 'religion', 'Religión', 'select', 'religion'],
  [26, 'estadoCivil', 'Estado civil', 'select', 'estadoCivil'],

  // ── Módulo 2 · Antecedentes Heredofamiliares y No Patológicos (27-45)
  [27, 'ahfDiabetes', 'Diabetes'],
  [28, 'ahfHipertension', 'Hipertensión'],
  [29, 'ahfCardiopatia', 'Cardiopatía'],
  [30, 'ahfNeoplasias', 'Neoplasias'],
  [31, 'ahfInfecciosa', 'Infecciosa'],
  [32, 'ahfOtras', 'Otras'],
  [33, 'ahfAbuelosPaternos', 'Abuelos paternos'],
  [34, 'ahfAbuelosMaternos', 'Abuelos maternos'],
  [35, 'ahfPadre', 'Padre'],
  [36, 'ahfMadre', 'Madre'],
  [37, 'ahfHermanos', 'Hermanos'],
  [38, 'ahfHijos', 'Hijos'],
  [39, 'escolaridad', 'Escolaridad', 'select', 'escolaridad'],
  [40, 'vivienda', 'Vivienda (materiales de construcción)', 'text', 'vivienda'],
  [41, 'alimentacion', 'Alimentación (calidad / frecuencia)'],
  [42, 'convivenciaAnimales', 'Convivencia con animales'],
  [43, 'actividadFisica', 'Actividad física'],
  [44, 'inmunizaciones', 'Inmunizaciones (esquema de vacunación)'],
  [45, 'tatuajes', 'Tatuajes'],

  // ── Módulo 3 · Historia de Trabajo (46-58)
  [46, 'tActualEmpresa', 'Empresa'],
  [47, 'tActualPuesto', 'Puesto'],
  [48, 'tActualTiempo', 'Tiempo'],
  [49, 'tActualCondiciones', 'Condiciones especiales'],
  [50, 'tPenultimoEmpresa', 'Empresa'],
  [51, 'tPenultimoPuesto', 'Puesto'],
  [52, 'tPenultimoTiempo', 'Tiempo'],
  [53, 'tPenultimoCondiciones', 'Condiciones especiales'],
  [54, 'tAntepenultimoEmpresa', 'Empresa'],
  [55, 'tAntepenultimoPuesto', 'Puesto'],
  [56, 'tAntepenultimoTiempo', 'Tiempo'],
  [57, 'tAntepenultimoCondiciones', 'Condiciones especiales'],
  [58, 'enfermedadesProfesionales', 'Enfermedades profesionales y/o secuelas', 'textarea'],

  // ── Módulo 4 · Antecedentes Personales Patológicos y Hábitos (59-74)
  [59, 'etilismo', 'Etilismo (frecuencia / cantidad)'],
  [60, 'tabaquismo', 'Tabaquismo (frecuencia / cantidad)'],
  [61, 'adicciones', 'Adicciones'],
  [62, 'alergias', 'Alergias'],
  [63, 'quirurgicos', 'Quirúrgicos'],
  [64, 'traumatismos', 'Traumatismos'],
  [65, 'hemotransfusiones', 'Hemotransfusiones'],
  [66, 'appHta', 'Hipertensión arterial'],
  [67, 'appDm', 'Diabetes mellitus'],
  [68, 'appCardiaca', 'Patología cardíaca'],
  [69, 'appRespiratoria', 'Patología respiratoria'],
  [70, 'appRenal', 'Patología renal'],
  [71, 'appMusculoEsqueletica', 'Patología músculo-esquelética'],
  [72, 'appLumbar', 'Patología lumbar'],
  [73, 'appAcidoPeptica', 'Enfermedad ácido péptica'],
  [74, 'appOtras', 'Otras (especificar)'],

  // ── Módulo 5 · Signos Vitales, Somatometría y Exploración (75-95)
  [75, 'pulso', 'Pulso', 'number'],
  [76, 'respiracion', 'Respiración', 'number'],
  [77, 'temperatura', 'Temperatura', 'number'],
  [78, 'taSistolica', 'TA sistólica', 'number'],
  [79, 'taDiastolica', 'TA diastólica', 'number'],
  [80, 'taConjunta', 'TA (lectura conjunta)', 'computed'],
  [81, 'clasificacionAha', 'Clasificación de T/A', 'text', 'clasificacionTa'],
  [82, 'peso', 'Peso', 'number'],
  [83, 'talla', 'Talla', 'number'],
  [84, 'imc', 'Índice de Masa Corporal (IMC)', 'computed'],
  [85, 'estadoNutricional', 'Estado nutricional', 'computed'],
  [86, 'constitucion', 'Tipo'],
  [87, 'pielFaneras', 'Piel(Aspecto)'],
  [88, 'toraxObs', 'Tórax: observaciones'],
  [89, 'toraxPulmones', 'Tórax: pulmones'],
  [90, 'toraxCorazon', 'Tórax: corazón'],
  [91, 'abdomenObs', 'Abdomen: observaciones'],
  [92, 'abdomenHigado', 'Abdomen: hígado'],
  [93, 'abdomenHernias', 'Abdomen: hernias'],
  [94, 'abdomenHemorroides', 'Abdomen: hemorroides'],
  [95, 'abdomenBazo', 'Abdomen: bazo'],

  // ── Módulo 6 · Examen Físico Regional, Ojos y Oídos (96-133)
  [96, 'vlOd', 'Visión lejana (Snellen) OD'],
  [97, 'vlOi', 'Visión lejana (Snellen) OI'],
  [98, 'vlConLentes', 'Visión lejana: examen con lentes'],
  [99, 'vlResultado', 'Visión lejana: resultado'],
  [100, 'vcOd', 'Visión cercana (Jaeger) OD'],
  [101, 'vcOi', 'Visión cercana (Jaeger) OI'],
  [102, 'vcConLentes', 'Visión cercana: examen con lentes'],
  [103, 'vcResultado', 'Visión cercana: resultado'],
  [104, 'reflejosOcularesOd', 'Reflejos oculares OD'],
  [105, 'reflejosOcularesOi', 'Reflejos oculares OI'],
  [106, 'pterigionOd', 'Pterigiones OD'],
  [107, 'pterigionOi', 'Pterigiones OI'],
  [108, 'catarataOd', 'Cataratas OD'],
  [109, 'catarataOi', 'Cataratas OI'],
  [110, 'estrabismo', 'Estrabismo'],
  [111, 'ishihara', 'Diferenciación de colores (Ishihara)'],
  [112, 'oftalRecomendaciones', 'Oftalmología: recomendaciones', 'textarea'],
  [113, 'lentesSeguridad', 'Lentes de seguridad graduados', 'text', 'lentesSeguridad'],
  [114, 'canalAuditivoOd', 'Canal auditivo: oído derecho'],
  [115, 'canalAuditivoOi', 'Canal auditivo: oído izquierdo'],
  [116, 'membranaTimpanicaD', 'Membrana timpánica derecha'],
  [117, 'membranaTimpanicaI', 'Membrana timpánica izquierda'],
  [118, 'narizObs', 'Nariz: observaciones'],
  [119, 'narizObstrucciones', 'Nariz: obstrucciones'],
  [120, 'orofaringe', 'Orofaringe: observaciones'],
  [121, 'dentadura', 'Dentadura'],
  [122, 'cuello', 'Cuello: observaciones'],
  [123, 'guObs', 'Genitourinario: observaciones'],
  [124, 'guHernias', 'Genitourinario: hernias'],
  [125, 'guHidrocele', 'Genitourinario: hidrocele'],
  [126, 'guVaricocele', 'Genitourinario: varicocele'],
  [127, 'extSupObs', 'Extremidades superiores: observaciones'],
  [128, 'extSupManos', 'Extremidades superiores: manos'],
  [129, 'extInfObs', 'Extremidades inferiores: observaciones'],
  [130, 'extInfHalluxValgus', 'Extremidades inferiores: hallux valgus'],
  [131, 'reflejosOsteotendinosos', 'Reflejos osteotendinosos'],
  [132, 'psiquismo', 'Psiquismo'],
  [133, 'padecimientoActual', 'Padecimiento actual / toma de medicamentos', 'textarea'],

  // ── Módulo 7 · Pruebas de Laboratorio (134-179)
  [134, 'qsGlucosa', 'Glucosa'],
  [135, 'qsUrea', 'Urea'],
  [136, 'qsCreatinina', 'Creatinina'],
  [137, 'qsAcidoUrico', 'Ácido úrico'],
  [138, 'qsColesterol', 'Colesterol total'],
  [139, 'qsTrigliceridos', 'Triglicéridos'],
  [140, 'qsAlbumina', 'Albúmina'],
  [141, 'qsBilirrubinaTotal', 'Bilirrubina total'],
  [142, 'qsAst', 'AST (TGO)'],
  [143, 'qsFosfatasaAlcalina', 'Fosfatasa alcalina'],
  [144, 'qsDhl', 'DHL'],
  [145, 'qsHba1c', 'HbA1c'],
  [146, 'bhGrupoRh', 'Grupo sanguíneo y Rh', 'select', 'grupoSanguineo'],
  [147, 'bhLeucocitos', 'Leucocitos'],
  [148, 'bhEritrocitos', 'Eritrocitos'],
  [149, 'bhHemoglobina', 'Hemoglobina'],
  [150, 'bhHematocrito', 'Hematocrito'],
  [151, 'bhVcm', 'VCM'],
  [152, 'bhMch', 'MCH'],
  [153, 'bhMchc', 'MCHC'],
  [154, 'bhPlaquetas', 'Plaquetas'],
  [155, 'bhMpv', 'MPV'],
  [156, 'bhNeutrofilos', 'Neutrófilos (%)'],
  [157, 'bhLinfocitosPct', 'Linfocitos (%)'],
  [158, 'bhMonocitos', 'Monocitos (%)'],
  [159, 'bhLinfocitosAbs', 'Linfocitos (absoluto)'],
  [160, 'adOpi', 'Opiáceos (OPI)', 'select', 'antidoping'],
  [161, 'adCoc', 'Cocaína (COC)', 'select', 'antidoping'],
  [162, 'adThc', 'Cannabinoides (THC)', 'select', 'antidoping'],
  [163, 'adBzo', 'Benzodiacepinas (BZO)', 'select', 'antidoping'],
  [164, 'adMet', 'Metanfetaminas (MET)', 'select', 'antidoping'],
  [165, 'adAmp', 'Anfetaminas (AMP)', 'select', 'antidoping'],
  [166, 'egoColor', 'Color'],
  [167, 'egoAspecto', 'Aspecto'],
  [168, 'egoDensidad', 'Densidad'],
  [169, 'egoPh', 'pH'],
  [170, 'egoNitritos', 'Nitritos'],
  [171, 'egoProteinas', 'Proteínas'],
  [172, 'egoGlucosa', 'Glucosa'],
  [173, 'egoCetonas', 'Cetonas'],
  [174, 'egoBilirrubina', 'Bilirrubina'],
  [175, 'egoUrobilinogeno', 'Urobilinógeno'],
  [176, 'egoHemoglobina', 'Hemoglobina'],
  [177, 'egoLeucocitos', 'Leucocitos'],
  [178, 'egoEritrocitos', 'Eritrocitos'],
  [179, 'egoCristales', 'Cristales'],

  // ── Módulo 8 · Estudios Complementarios y Audiometría (180-203)
  [180, 'rxTorax', 'Radiografía de tórax (interpretación)', 'textarea'],
  [181, 'rxLumbar', 'Radiografía lumbar (interpretación)', 'textarea'],
  [182, 'aud150Od', '150 Hz OD', 'number'],
  [183, 'aud150Oi', '150 Hz OI', 'number'],
  [184, 'aud250Od', '250 Hz OD', 'number'],
  [185, 'aud250Oi', '250 Hz OI', 'number'],
  [186, 'aud500Od', '500 Hz OD', 'number'],
  [187, 'aud500Oi', '500 Hz OI', 'number'],
  [188, 'aud1000Od', '1000 Hz OD', 'number'],
  [189, 'aud1000Oi', '1000 Hz OI', 'number'],
  [190, 'aud2000Od', '2000 Hz OD', 'number'],
  [191, 'aud2000Oi', '2000 Hz OI', 'number'],
  [192, 'aud3000Od', '3000 Hz OD', 'number'],
  [193, 'aud3000Oi', '3000 Hz OI', 'number'],
  [194, 'aud4000Od', '4000 Hz OD', 'number'],
  [195, 'aud4000Oi', '4000 Hz OI', 'number'],
  [196, 'aud6000Od', '6000 Hz OD', 'number'],
  [197, 'aud6000Oi', '6000 Hz OI', 'number'],
  [198, 'aud8000Od', '8000 Hz OD', 'number'],
  [199, 'aud8000Oi', '8000 Hz OI', 'number'],
  [200, 'audiometriaResultado', 'Resultado / diagnóstico auditivo', 'textarea'],
  [201, 'ecg', 'Electrocardiograma (ECG / PF)', 'textarea'],
  [202, 'espirometria', 'Espirometría (interpretación)', 'textarea'],
  [203, 'valoracionOftalmologica', 'Valoración oftalmológica especializada', 'textarea'],

  // ── Módulo 9 · Diagnóstico Final, Gradiente y Dictamen (204-206)
  [204, 'diagnostico', 'Diagnóstico general / impresión diagnóstica', 'textarea'],
  [205, 'gradiente', 'Gradiente (evaluación global de aptitud)', 'select', 'gradiente'],
  [206, 'medicoDictaminador', 'Médico dictaminador / médico que atiende', 'select', 'medicos'],
] as const satisfies readonly Raw[];

/** R4: en la práctica siempre es este valor; lo asigna el sistema y no se captura. */
export const TIPO_EMPLEADO_PREDETERMINADO = 'CONTRATISTA';
/** Alternativa a una fecha en R2 (Fecha de siguiente valoración). */
export const NO_APTO = 'NO APTO';

/**
 * Campos complementarios (R1, R2, R4). No forman parte de los 206 encabezados
 * de la base de datos, pero aparecen en los formatos impresos oficiales PECO / TX.
 *
 * Retirados (sus códigos no se reutilizan): R3 Lugar de certificación (lo cubre
 * Zona de trabajo, 006), R5 Clasificación PECO (siempre "B"), R6 Perímetro
 * abdominal (redundante con Aspecto general, 082-086) y R7 Magnitud de riesgo
 * (se deriva del Gradiente, 205: B + gradiente; ver lib/gradiente.ts).
 */
const RAW_REPORTE = [
  [1001, 'fechaEntregaResultados', 'Fecha de entrega de resultados', 'date'],
  [1002, 'fechaSiguienteValoracion', 'Fecha de siguiente valoración', 'date'],
  [1004, 'tipoEmpleado', 'Tipo de empleado'],
] as const satisfies readonly Raw[];

export type FieldKey = (typeof RAW)[number][1] | (typeof RAW_REPORTE)[number][1];

export interface FieldDef {
  /** 1-206 = encabezados oficiales · 1001+ = complementarios de reporte (R1, R2…) */
  n: number;
  /** Código visible: "001"…"206" o "R1"…"R4". */
  code: string;
  key: FieldKey;
  label: string;
  type: FieldType;
  catalog?: CatalogoKey;
  unit?: string;
}

/** Unidades que se muestran junto al input y en el PDF. */
const UNITS: Partial<Record<FieldKey, string>> = {
  pulso: 'lpm',
  respiracion: 'rpm',
  temperatura: '°C',
  taSistolica: 'mmHg',
  taDiastolica: 'mmHg',
  taConjunta: 'mmHg',
  peso: 'kg',
  talla: 'm',
  imc: 'kg/m²',
  edad: 'años',
};

const toDef = (r: Raw): FieldDef => {
  const [n, key, label, type, catalog] = r;
  const k = key as FieldKey;
  return {
    n,
    code: n > 1000 ? `R${n - 1000}` : String(n).padStart(3, '0'),
    key: k,
    label,
    type: type ?? 'text',
    catalog,
    // Solo los umbrales aud150Od…aud8000Oi; no audiometriaResultado (texto)
    unit: UNITS[k] ?? (/^aud\d/.test(k) ? 'dB' : undefined),
  };
};

/** Los 206 encabezados oficiales. */
export const FIELDS: readonly FieldDef[] = RAW.map((r) => toDef(r as Raw));
/** Complementarios de los formatos impresos. */
export const REPORT_FIELDS: readonly FieldDef[] = RAW_REPORTE.map((r) => toDef(r as Raw));
export const ALL_FIELDS: readonly FieldDef[] = [...FIELDS, ...REPORT_FIELDS];

export const FIELD_BY_N: ReadonlyMap<number, FieldDef> = new Map(ALL_FIELDS.map((f) => [f.n, f]));
export const FIELD_BY_KEY: ReadonlyMap<FieldKey, FieldDef> = new Map(ALL_FIELDS.map((f) => [f.key, f]));

/** Todos los valores son strings; vacío = no capturado (ningún campo es obligatorio). */
export type HistoriaClinicaValues = Record<FieldKey, string>;

export const EMPTY_VALUES = Object.fromEntries(ALL_FIELDS.map((f) => [f.key, ''])) as HistoriaClinicaValues;

/** Campos que asigna el sistema: existen en el expediente, PDF y Excel, pero no en el formulario. */
export const CAMPOS_SISTEMA: ReadonlySet<FieldKey> = new Set(['tipoEmpleado']);

/** Aplica los valores que no se capturan (hoy: R4 = CONTRATISTA). */
export const conValoresDeSistema = (values: HistoriaClinicaValues): HistoriaClinicaValues => ({
  ...values,
  tipoEmpleado: TIPO_EMPLEADO_PREDETERMINADO,
});

export const AUDIO_FRECUENCIAS = [150, 250, 500, 1000, 2000, 3000, 4000, 6000, 8000] as const;
