export type PlantillaId = 'PECO' | 'TX';

/**
 * Estilo de cada formato, medido sobre los reportes oficiales impresos
 * (Reporte_Folio_106 = PECO, Reporte_Folio_108 = TX). Medidas en puntos (72 pt = 1 in).
 */
export interface PdfTheme {
  /** Barras de sección ("Datos Generales", "Audiometría"…) */
  bar: string;
  /** Celdas de etiqueta */
  label: string;
  /** Celdas de valor */
  value: string;
  /** Sub-barras ("Cabeza", "Química Sanguínea"…) */
  sub: string;
  /** Título de la hoja */
  title: string;
  /** Etiquetas destacadas: Número/Folio, fechas, grupos (Tórax, Ojos…) */
  highlight: string;
  /** Casilla Magnitud de Riesgo (PECO) / Gradiente (TX) */
  boxLabel: string;
  boxValue: string;
  boxValueText: string;
  ink: string;
  delegacion: string;
  fontSize: number;
  titleSize: number;
  marginLeft: number;
  marginRight: number;
  marginTop: number;
  marginBottom: number;
  /** Alto mínimo de fila en las tablas principales */
  rowH: number;
}

export interface PlantillaConfig {
  id: PlantillaId;
  cliente: string;
  theme: PdfTheme;
}

export const PLANTILLAS: Record<PlantillaId, PlantillaConfig> = {
  PECO: {
    id: 'PECO',
    cliente: 'Peña Colorada',
    theme: {
      bar: '#C6361B',
      label: '#5D7388',
      value: '#F2F2F2',
      sub: '#808080',
      title: '#285775',
      highlight: '#C6361B',
      boxLabel: '#285775',
      boxValue: '#FF0000',
      boxValueText: '#FFFFFF',
      ink: '#000000',
      delegacion: 'DELEGACIÓN ESTATAL COLIMA',
      fontSize: 6.6,
      titleSize: 18,
      marginLeft: 57,
      marginRight: 54,
      marginTop: 54,
      marginBottom: 36,
      rowH: 14,
    },
  },
  TX: {
    id: 'TX',
    cliente: 'Transformación',
    theme: {
      bar: '#FF3300',
      label: '#01688A',
      value: '#F2F2F2',
      sub: '#485458',
      title: '#485458',
      highlight: '#FF3300',
      boxLabel: '#003399',
      boxValue: '#F8EC4C',
      boxValueText: '#C00000',
      ink: '#262626',
      delegacion: 'DELEGACIÓN COLIMA',
      fontSize: 6.2,
      titleSize: 15,
      marginLeft: 46,
      marginRight: 53,
      marginTop: 20,
      marginBottom: 36,
      rowH: 14,
    },
  },
};

/** Logotipos (data URL) que usan las plantillas. Ver public/brand/. */
export interface PdfLogos {
  cruzRoja?: string;
  penaColorada?: string;
  serviciosMedicos?: string;
  /** Rúbrica del médico dictaminador (Dr. Manuel Alejandro Coria Salas), para el campo de firma de PECO y TX. */
  firmaCoriaSalas?: string;
}
