/**
 * Agrupación visual de los 206 campos: 7 pestañas → acordeones por sección.
 * Las plantillas PDF recorren estas mismas secciones en el mismo orden.
 */

export type TabId =
  | 'generales'
  | 'antecedentes'
  | 'laboral'
  | 'exploracion'
  | 'laboratorio'
  | 'gabinete'
  | 'diagnostico';

export interface TabDef {
  id: TabId;
  label: string;
}

export type SectionLayout = 'grid' | 'address' | 'audiogram';

export interface SectionDef {
  id: string;
  tab: TabId;
  title: string;
  fields: number[];
  layout?: SectionLayout;
}

const r = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

export const TABS: readonly TabDef[] = [
  { id: 'generales', label: 'Datos Generales' },
  { id: 'antecedentes', label: 'Antecedentes' },
  { id: 'laboral', label: 'Historia Laboral' },
  { id: 'exploracion', label: 'Exploración Física' },
  { id: 'laboratorio', label: 'Laboratoriales' },
  { id: 'gabinete', label: 'Audiometría y Gabinete' },
  { id: 'diagnostico', label: 'Diagnóstico' },
];

export const SECTIONS: readonly SectionDef[] = [
  // Datos generales
  { id: 'identificacion', tab: 'generales', title: 'Identificación y datos laborales', fields: r(1, 15) },
  { id: 'reporte', tab: 'generales', title: 'Datos del reporte', fields: [1001, 1002] },
  { id: 'personales', tab: 'generales', title: 'Datos personales', fields: [16, 17, 18, 23, 24, 25, 26] },
  { id: 'domicilio', tab: 'generales', title: 'Domicilio', fields: r(19, 22), layout: 'address' },

  // Antecedentes
  { id: 'ahf', tab: 'antecedentes', title: 'Antecedentes heredofamiliares', fields: r(27, 38) },
  { id: 'apnp', tab: 'antecedentes', title: 'Antecedentes personales no patológicos', fields: r(39, 45) },
  { id: 'habitos', tab: 'antecedentes', title: 'Hábitos y antecedentes personales', fields: r(59, 65) },
  { id: 'app', tab: 'antecedentes', title: 'Antecedentes personales patológicos', fields: r(66, 74) },

  // Historia laboral
  { id: 'tActual', tab: 'laboral', title: 'Trabajo actual', fields: r(46, 49) },
  { id: 'tPenultimo', tab: 'laboral', title: 'Trabajo penúltimo', fields: r(50, 53) },
  { id: 'tAntepenultimo', tab: 'laboral', title: 'Trabajo antepenúltimo', fields: r(54, 57) },
  { id: 'enfProf', tab: 'laboral', title: 'Enfermedades profesionales', fields: [58] },

  // Exploración física
  { id: 'signos', tab: 'exploracion', title: 'Signos vitales', fields: r(75, 81) },
  // Aspecto general: 082 Peso · 083 Talla · 084 IMC · 085 Estado nutricional · 086 Tipo · 087 Piel
  { id: 'aspectoGeneral', tab: 'exploracion', title: 'Aspecto general', fields: r(82, 87) },
  { id: 'toraxAbdomen', tab: 'exploracion', title: 'Tórax y abdomen', fields: r(88, 95) },
  { id: 'ojos', tab: 'exploracion', title: 'Ojos y agudeza visual', fields: r(96, 113) },
  { id: 'oidos', tab: 'exploracion', title: 'Oídos', fields: r(114, 117) },
  { id: 'orl', tab: 'exploracion', title: 'Nariz, orofaringe y cuello', fields: r(118, 122) },
  { id: 'gu', tab: 'exploracion', title: 'Genitourinario', fields: r(123, 126) },
  { id: 'extremidades', tab: 'exploracion', title: 'Extremidades y neurológico', fields: r(127, 131) },
  { id: 'psiquismo', tab: 'exploracion', title: 'Psiquismo y padecimiento actual', fields: [132, 133] },

  // Laboratorio
  { id: 'qs', tab: 'laboratorio', title: 'Química sanguínea y perfil hepático', fields: r(134, 145) },
  { id: 'bh', tab: 'laboratorio', title: 'Biometría hemática', fields: r(146, 159) },
  { id: 'antidoping', tab: 'laboratorio', title: 'Tamizaje antidoping (orina)', fields: r(160, 165) },
  { id: 'ego', tab: 'laboratorio', title: 'Examen general de orina (EGO)', fields: r(166, 179) },

  // Gabinete y audiometría
  { id: 'rx', tab: 'gabinete', title: 'Radiografías', fields: [180, 181] },
  { id: 'audiometria', tab: 'gabinete', title: 'Audiometría', fields: r(182, 200), layout: 'audiogram' },
  { id: 'otrosEstudios', tab: 'gabinete', title: 'ECG, espirometría y oftalmología', fields: r(201, 203) },

  // Diagnóstico
  { id: 'dictamen', tab: 'diagnostico', title: 'Diagnóstico final y dictamen', fields: [204, 205, 206] },
];

export const sectionsOf = (tab: TabId) => SECTIONS.filter((s) => s.tab === tab);
