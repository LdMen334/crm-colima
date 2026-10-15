import { Document, Page, Text, View } from '@react-pdf/renderer';
import type { ExpedienteResumen } from '@/features/historia-clinica/api';
import { formatFechaMx } from '@/features/historia-clinica/lib/format';
import { curpONss, dictamenDe } from './lib';

const REG = 'Helvetica';
const BOLD = 'Helvetica-Bold';
const ROJO = '#E31B23';

export type ModoReporte = 'sabi' | 'medico';

interface Columna {
  header: string;
  width: number;
  valor: (e: ExpedienteResumen) => string;
}

/** Columnas del reporte; "Examen visual" solo aplica en modo SABI. */
function columnasDe(modo: ModoReporte): Columna[] {
  const columnas: Columna[] = [
    { header: 'Fecha', width: 8, valor: (e) => formatFechaMx(e.fechaEstudios, '/') },
    { header: 'Folio', width: 6, valor: (e) => e.folio },
    { header: 'Paciente', width: modo === 'sabi' ? 18 : 20, valor: (e) => e.nombreCompleto || 'Sin nombre' },
    { header: 'CURP / NSS', width: 13, valor: curpONss },
    { header: 'Empresa', width: 14, valor: (e) => e.empresa || '—' },
    { header: 'Zona de trabajo', width: 10, valor: (e) => e.zonaTrabajo || '—' },
  ];
  if (modo === 'sabi') {
    columnas.push({
      header: 'Examen visual',
      width: 9,
      valor: (e) => (e.examenesVisualesRealizados ? 'Realizado' : 'Pendiente'),
    });
  }
  columnas.push(
    { header: 'Dictamen / Aptitud', width: 13, valor: dictamenDe },
    { header: 'Médico atendió', width: modo === 'sabi' ? 17 : 19, valor: (e) => e.medico || '—' },
  );
  return columnas;
}

/** Reporte tabular (no clínico de un solo paciente): landscape, con el encabezado repetido en cada página. */
export function ReporteSabiPdfDocument({ items, modo, titulo }: { items: ExpedienteResumen[]; modo: ModoReporte; titulo: string }) {
  const columnas = columnasDe(modo);

  return (
    <Document title={titulo}>
      <Page size="A4" orientation="landscape" style={{ paddingTop: 28, paddingBottom: 28, paddingHorizontal: 24, fontFamily: REG, fontSize: 7.5 }}>
        <Text style={{ fontSize: 13, fontFamily: BOLD, marginBottom: 2 }}>{titulo}</Text>
        <Text style={{ fontSize: 8, color: '#666666', marginBottom: 10 }}>
          {items.length} {items.length === 1 ? 'registro' : 'registros'}
        </Text>

        <View style={{ flexDirection: 'row' }} fixed>
          {columnas.map((c, i) => (
            <Text
              key={i}
              style={{
                width: `${c.width}%`,
                backgroundColor: ROJO,
                color: '#FFFFFF',
                fontFamily: BOLD,
                fontSize: 7,
                paddingVertical: 3,
                paddingHorizontal: 3,
              }}
            >
              {c.header}
            </Text>
          ))}
        </View>

        {items.map((e, i) => (
          <View
            key={`${e.anio}-${e.folio}`}
            wrap={false}
            style={{ flexDirection: 'row', backgroundColor: i % 2 === 1 ? '#F7F7F5' : '#FFFFFF' }}
          >
            {columnas.map((c, j) => (
              <Text
                key={j}
                style={{
                  width: `${c.width}%`,
                  paddingVertical: 2.5,
                  paddingHorizontal: 3,
                  borderBottomWidth: 0.5,
                  borderBottomColor: '#E5E5E5',
                }}
              >
                {c.valor(e)}
              </Text>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}
