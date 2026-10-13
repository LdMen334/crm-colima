import { Document, View } from '@react-pdf/renderer';
import type { HistoriaClinicaValues } from '@/features/historia-clinica/config/fields';
import { findMedico } from '@/features/historia-clinica/config/medicos';
import { GRADIENTE_COLOR, nivelGradiente } from '@/features/historia-clinica/lib/gradiente';
import { PLANTILLAS, type PdfLogos } from './config';
import { Bar, CruzRojaLogo, Hoja, MetaBlock, PdfThemeProvider, RightTitle, Rows, makeGet } from './primitives';
import {
  Antecedentes,
  Audiometria,
  DiagnosticoGeneral,
  DrogasTablaTx,
  ExploracionRegional,
  Gabinete,
  HistoriaTrabajo,
  HojaExamenesVisuales,
  HojaPruebasComplementarias,
  Laboratorio,
  MedicoDictaminadorTx,
  Patologicos,
} from './secciones';

/**
 * Formato TX — Transformación (réplica de Reporte_Folio_108).
 * Formato institucional Cruz Roja Mexicana: membretes rojos, etiquetas azul petróleo,
 * gradiente en casilla con el color de su nivel. Hojas: Historia Clínica (2 págs., encabezado repetido)
 * · Pruebas Complementarias · Exámenes Visuales.
 */
export function TxTemplate({ values, logos }: { values: HistoriaClinicaValues; logos: PdfLogos }) {
  const { theme } = PLANTILLAS.TX;
  const get = makeGet(values);
  const medico = findMedico(values.medicoDictaminador);
  // Solo el número (1…4), con el fondo del nivel: 1 verde · 2 amarillo · 3 naranja · 4 rojo
  const nivel = nivelGradiente(values.gradiente);
  const gradiente = nivel ? String(nivel) : '---';
  const colorNivel = nivel ? GRADIENTE_COLOR[nivel] : undefined;
  const datosHojas = [
    [{ l: 'Nombre', k: 'nombreCompleto' as const, span: 3 }, { l: 'Fecha Nacimiento', k: 'fechaNacimiento' as const }],
    [{ l: 'Empresa', k: 'empresa' as const, span: 2 }, { l: 'Sexo', k: 'genero' as const }, { l: 'Fecha de Examen', k: 'fechaEstudios' as const }],
  ];

  return (
    <Document title={`Historia Clínica TX ${values.folio || ''}`.trim()} author="Cruz Roja Mexicana · Delegación Estatal Colima">
      <PdfThemeProvider value={theme}>
        <Hoja footer="TX · Cruz Roja Mexicana · Coordinación de Servicios Médicos">
          {/* Encabezado repetido en cada página de la historia clínica */}
          <View fixed style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <CruzRojaLogo src={logos.cruzRoja} w={77} delegacion={theme.delegacion} />
            <View style={{ marginTop: 6 }}>
              <RightTitle title="HISTORIA CLÍNICA" subtitle="COORDINACIÓN DE SERVICIOS MÉDICOS" />
            </View>
          </View>

          <MetaBlock
            get={get}
            folio={{ l: 'Folio', k: 'folio' }}
            fechas={[
              { l: 'Fecha de exámenes médicos', k: 'fechaEstudios' },
              { l: 'Fecha de siguiente valoración', k: 'fechaSiguienteValoracion' },
            ]}
            box={{ label: 'Gradiente', value: gradiente, color: colorNivel }}
          />

          <Bar>Datos Generales</Bar>
          <Rows
            get={get}
            h={15}
            grid={[
              { w: 165, lw: 55 },
              { w: 115, lw: 55 },
              { w: 116, lw: 55 },
              { w: 116, lw: 56 },
            ]}
            rows={[
              [{ l: 'Nombre', k: 'nombreCompleto', span: 3 }, { l: 'Fecha Nacimiento', k: 'fechaNacimiento' }],
              [{ l: 'Sexo', k: 'genero' }, { l: 'Teléfono', k: 'telefono' }, { l: 'Edad', k: 'edad' }, { l: 'Gpo Sanguíneo', k: 'bhGrupoRh' }],
              [{ l: 'Puesto', k: 'puesto' }, { l: 'Estado Originario', k: 'originario' }, { l: 'Rango Edad', k: 'grupoEdad' }, { l: 'Tipo Examen', k: 'tipoExamenMotivo' }],
              [{ l: 'Empresa', k: 'empresa' }, { l: 'Religión', k: 'religion' }, { l: 'Domicilio (Calle y número)', k: 'domicilioCalle' }, { l: 'Categoría', k: 'tipoExamenCategoria' }],
              [{ l: 'Zona de trabajo', k: 'zonaTrabajo' }, { l: 'Estado Civil', k: 'estadoCivil' }, { l: 'Colonia (Domicilio)', k: 'domicilioColonia' }, { l: 'Exposición POE', k: 'exposicionPoe' }],
              [{ l: 'Antigüedad Empresa', k: 'antiguedadEmpresa' }, { l: 'NSS IMSS', k: 'nss' }, { l: 'Municipio (Domicilio)', k: 'domicilioMunicipio' }, { l: 'Gradiente', v: gradiente, box: true, boxColor: colorNivel }],
              [{ l: 'Antigüedad Puesto Actual', k: 'antiguedadPuesto' }, { l: 'CURP', k: 'curp' }, { l: 'Estado (Domicilio)', k: 'domicilioEstado' }, { l: '', v: '' }],
            ]}
          />

          <Antecedentes get={get} v="TX" />
          <HistoriaTrabajo get={get} v="TX" />
          <Patologicos get={get} v="TX" />

          <Bar>Exploración Física</Bar>
          <Rows
            get={get}
            labelW={46}
            h={10}
            rows={[
              [{ l: 'Pulso', k: 'pulso' }, { l: 'T/A', k: 'taConjunta' }, { l: 'Talla (metros)', k: 'talla' }, { l: 'Glucosa', k: 'qsGlucosa' }],
              [{ l: 'Respiración', k: 'respiracion' }, { l: 'Clasificación', k: 'clasificacionAha' }, { l: 'IMC', k: 'imc' }, { l: 'Piel', k: 'pielFaneras' }],
              [{ l: 'Temperatura', k: 'temperatura' }, { l: 'Peso (kilos)', k: 'peso' }, { l: 'Estado Nutricional', k: 'estadoNutricional', span: 2 }],
            ]}
          />
          <ExploracionRegional get={get} v="TX" />
          <Audiometria get={get} v="TX" values={values} />
          <Laboratorio get={get} v="TX" />
          <DrogasTablaTx get={get} />
          <Gabinete get={get} v="TX" />
          <DiagnosticoGeneral get={get} />
          <MedicoDictaminadorTx medico={medico} nombreCapturado={values.medicoDictaminador} logos={logos} />
        </Hoja>

        <HojaPruebasComplementarias get={get} v="TX" logos={logos} datos={datosHojas} firmaPeco={[]} medico={medico} nombreCapturado={values.medicoDictaminador} />
        <HojaExamenesVisuales get={get} v="TX" logos={logos} datos={datosHojas} />
      </PdfThemeProvider>
    </Document>
  );
}
