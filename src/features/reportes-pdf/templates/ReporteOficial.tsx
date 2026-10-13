import type { HistoriaClinicaValues } from '@/features/historia-clinica/config/fields';
import type { PdfLogos, PlantillaId } from './config';
import { PecoTemplate } from './PecoTemplate';
import { TxTemplate } from './TxTemplate';

/**
 * Punto de entrada único de las plantillas oficiales.
 * El Código Postal no es un campo del expediente, por lo que ninguna plantilla puede imprimirlo.
 */
export function ReporteOficial({ plantilla, values, logos }: { plantilla: PlantillaId; values: HistoriaClinicaValues; logos: PdfLogos }) {
  return plantilla === 'PECO' ? <PecoTemplate values={values} logos={logos} /> : <TxTemplate values={values} logos={logos} />;
}
