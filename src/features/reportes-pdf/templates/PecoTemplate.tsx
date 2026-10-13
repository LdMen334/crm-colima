import { Document, Text, View } from '@react-pdf/renderer';
import type { HistoriaClinicaValues } from '@/features/historia-clinica/config/fields';
import { findMedico } from '@/features/historia-clinica/config/medicos';
import { CLASIFICACION_PECO, GRADIENTE_COLOR, magnitudRiesgoPeco, nivelGradiente } from '@/features/historia-clinica/lib/gradiente';
import { PLANTILLAS, type PdfLogos } from './config';
import { Bar, Hoja, Img, MetaBlock, PdfThemeProvider, Rows, Signature, makeGet } from './primitives';
import {
  Antecedentes,
  Audiometria,
  DiagnosticoGeneral,
  ExploracionRegional,
  Gabinete,
  HistoriaTrabajo,
  HojaExamenesVisuales,
  HojaPruebasComplementarias,
  Laboratorio,
  Patologicos,
} from './secciones';

/**
 * Formato PECO — Peña Colorada (réplica de Reporte_Folio_106).
 * Hojas: Historia Clínica (2 págs.) · Pruebas Complementarias · Exámenes Visuales.
 */
export function PecoTemplate({ values, logos }: { values: HistoriaClinicaValues; logos: PdfLogos }) {
  const { theme } = PLANTILLAS.PECO;
  const get = makeGet(values);
  const medico = findMedico(values.medicoDictaminador);
  // Magnitud de Riesgo = clasificación base "B" + gradiente (B1…B4), con el color del nivel
  const nivel = nivelGradiente(values.gradiente);
  const colorNivel = nivel ? GRADIENTE_COLOR[nivel] : undefined;
  const firma = [
    medico ? `DR ${medico.nombre} ${medico.siglasUniversidad} ${medico.cedula}` : values.medicoDictaminador?.trim() || ' ',
    'Médico dictaminador',
  ];
  const datosHojas = [
    [{ l: 'Nombre', k: 'nombreCompleto' as const, span: 3, center: true }, { l: 'Edad', k: 'edad' as const, center: true }],
    [{ l: 'Género', k: 'genero' as const }, { l: 'Empresa', k: 'empresa' as const, span: 2, center: true }, { l: 'Fecha', k: 'fechaEstudios' as const, center: true }],
  ];

  return (
    <Document title={`Historia Clínica PECO ${values.folio || ''}`.trim()} author="Cruz Roja Mexicana · Delegación Estatal Colima">
      <PdfThemeProvider value={theme}>
        <Hoja footer="PECO · Jefatura de Salud, Higiene & Bienestar">
          {/* Encabezado: Peña Colorada · título · Servicios Médicos */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Img src={logos.penaColorada} w={70} h={28} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: theme.titleSize, fontFamily: 'Helvetica-Bold', color: theme.title }}>Historia Clínica</Text>
              <Text style={{ fontSize: 7.2, fontFamily: 'Helvetica-Bold', marginTop: 3 }}>Jefatura de Salud, Higiene & Bienestar</Text>
            </View>
            <Img src={logos.serviciosMedicos} w={67} h={22} />
          </View>

          <MetaBlock
            get={get}
            folio={{ l: 'Número', k: 'folio' }}
            fechas={[
              { l: 'Fecha de entrega resultados', k: 'fechaEntregaResultados' },
              { l: 'Fecha de exámenes médicos', k: 'fechaEstudios' },
            ]}
            box={{ label: 'Magnitud de Riesgo', value: magnitudRiesgoPeco(values.gradiente) ?? '---', color: colorNivel }}
          />

          <Bar>Datos Generales</Bar>
          <Rows
            get={get}
            h={16}
            grid={[
              { w: 149, lw: 44 },
              { w: 118, lw: 53 },
              { w: 105, lw: 52 },
              { w: 128, lw: 53 },
            ]}
            rows={[
              [{ l: 'Nombre', k: 'nombreCompleto', span: 3, center: true }, { l: 'Fecha nacimiento', k: 'fechaNacimiento' }],
              [{ l: 'Género', k: 'genero' }, { l: 'Teléfono', k: 'telefono' }, { l: 'Edad', k: 'edad' }, { l: 'Gpo Sanguíneo', k: 'bhGrupoRh' }],
              [{ l: 'Puesto', k: 'puesto' }, { l: 'Originario', k: 'originario' }, { l: 'Rango Edad', k: 'grupoEdad' }, { l: 'Tipo empleado', k: 'tipoEmpleado' }],
              [{ l: 'Empresa', k: 'empresa' }, { l: 'Religión', k: 'religion' }, { l: 'Domicilio', k: 'domicilioCalle' }, { l: 'Tipo examen', k: 'tipoExamenCategoria' }],
              [{ l: 'Zona de trabajo', k: 'zonaTrabajo' }, { l: 'Estado Civil', k: 'estadoCivil' }, { l: 'Localidad', k: 'domicilioColonia' }, { l: 'Exposición POE', k: 'exposicionPoe' }],
              [{ l: 'Antigüedad E.', k: 'antiguedadEmpresa' }, { l: 'IMSS', k: 'nss' }, { l: 'Municipio', k: 'domicilioMunicipio' }, { l: 'Clasificación', v: CLASIFICACION_PECO, hl: true, center: true, bold: true }],
              [{ l: 'Antigüedad P.', k: 'antiguedadPuesto' }, { l: 'CURP', k: 'curp' }, { l: 'Estado', k: 'domicilioEstado' }, { l: 'Gradiente', v: nivel ? String(nivel) : '---', hl: true, box: !!nivel, boxColor: colorNivel }],
            ]}
          />

          <Antecedentes get={get} v="PECO" />
          <HistoriaTrabajo get={get} v="PECO" />
          <Patologicos get={get} v="PECO" />

          <Bar>Exploración Física</Bar>
          {/* "Per. Abdominal" se conserva por fidelidad al formato oficial y repite el 086 Tipo:
              no hay campo propio (R6 se retiró) y el médico no lo captura dos veces. */}
          <Rows
            get={get}
            labelW={46}
            h={10}
            rows={[
              [{ l: 'Pulso', k: 'pulso' }, { l: 'T/A', k: 'taConjunta' }, { l: 'Talla', k: 'talla' }, { l: 'Per. Abdominal', k: 'constitucion' }],
              [{ l: 'Respiración', k: 'respiracion' }, { l: 'Clasificación', k: 'clasificacionAha' }, { l: 'IMC', k: 'imc' }, { l: 'Tipo', k: 'constitucion' }],
              [{ l: 'Temperatura', k: 'temperatura' }, { l: 'Peso', k: 'peso' }, { l: 'Estado Nutricional', k: 'estadoNutricional' }, { l: 'Piel', k: 'pielFaneras' }],
            ]}
          />
          <ExploracionRegional get={get} v="PECO" />
          <Audiometria get={get} v="PECO" values={values} />
          <Laboratorio get={get} v="PECO" />
          <Gabinete get={get} v="PECO" />
          <DiagnosticoGeneral get={get} />
          <Signature lines={firma} imagenSrc={medico ? logos.firmaCoriaSalas : undefined} />
        </Hoja>

        <HojaPruebasComplementarias get={get} v="PECO" logos={logos} datos={datosHojas} firmaPeco={firma} medico={medico} nombreCapturado={values.medicoDictaminador} />
        <HojaExamenesVisuales get={get} v="PECO" logos={logos} datos={datosHojas} />
      </PdfThemeProvider>
    </Document>
  );
}
