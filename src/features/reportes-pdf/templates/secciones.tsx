import { Image, Text, View } from '@react-pdf/renderer';
import { AUDIO_FRECUENCIAS, type FieldKey, type HistoriaClinicaValues } from '@/features/historia-clinica/config/fields';
import { OFTALMOLOGO, type MedicoFirmante } from '@/features/historia-clinica/config/medicos';
import type { PdfLogos, PlantillaId } from './config';
import {
  Audiograma,
  Bar,
  CruzRojaLogo,
  Group,
  Hoja,
  Paragraph,
  RightTitle,
  Rows,
  Signature,
  SubBar,
  Table,
  TwoCol,
  useTheme,
  type CellDef,
  type Get,
} from './primitives';
import { AVISO_PRESUNTIVO, DROGAS, METODO_DROGAS, METODO_GRUPO_RH, ORDEN_TABLA_TX, TEXTO_GRUPO_RH } from './textos-laboratorio';

/**
 * Secciones comunes a PECO y TX. Donde los formatos difieren solo en rótulos
 * u orden, se resuelve con la variante `v`.
 */

type V = PlantillaId;
interface P {
  get: Get;
  v: V;
}

const BOLD = 'Helvetica-Bold';

/** Ancho útil de la página (carta = 612 pt). */
export const useContentWidth = () => {
  const t = useTheme();
  return 612 - t.marginLeft - t.marginRight;
};

export function Antecedentes({ get, v }: P) {
  return (
    <TwoCol
      left={
        <View>
          <Bar>Antecedentes Heredofamiliares</Bar>
          <Rows
            cols={2}
            labelW={46}
            get={get}
            rows={[
              [{ l: 'Diabetes', k: 'ahfDiabetes' }, { l: 'Cardiopatía', k: 'ahfCardiopatia' }],
              [{ l: 'Hipertensión', k: 'ahfHipertension' }, { l: 'Neoplasias', k: 'ahfNeoplasias' }],
              [{ l: 'Infecciosas', k: 'ahfInfecciosa' }, { l: 'Otra', k: 'ahfOtras' }],
              [{ l: v === 'TX' ? 'Abuelos Pat.' : 'Abuelos P.', k: 'ahfAbuelosPaternos', span: 2 }],
              [{ l: v === 'TX' ? 'Abuelos Mat.' : 'Abuelos M.', k: 'ahfAbuelosMaternos', span: 2 }],
              [{ l: 'Padre', k: 'ahfPadre', span: 2 }],
              [{ l: 'Madre', k: 'ahfMadre', span: 2 }],
              [{ l: 'Hermanos', k: 'ahfHermanos' }, { l: 'Hijos', k: 'ahfHijos' }],
            ]}
          />
        </View>
      }
      right={
        <View>
          <Bar>{v === 'TX' ? 'Antecedentes Personales No Patológicos' : 'Antecedentes personales no patológicos'}</Bar>
          <Rows
            cols={1}
            labelW={54}
            get={get}
            rows={[
              [{ l: 'Escolaridad', k: 'escolaridad' }],
              [{ l: v === 'TX' ? 'Vivienda (Especifique)' : 'Vivienda', k: 'vivienda' }],
              [{ l: 'Alimentación', k: 'alimentacion' }],
              [{ l: 'Conv. Animales', k: 'convivenciaAnimales' }],
              [{ l: 'Actividad Física', k: 'actividadFisica' }],
              [{ l: v === 'TX' ? 'Vacunas (Especifique)' : 'Inmunización', k: 'inmunizaciones' }],
              [{ l: 'Tatuajes', k: 'tatuajes' }],
            ]}
          />
        </View>
      }
    />
  );
}

export function HistoriaTrabajo({ get, v }: P) {
  const fila = (nombre: string, p: 'tActual' | 'tPenultimo' | 'tAntepenultimo') => [
    nombre,
    get(`${p}Empresa` as FieldKey),
    get(`${p}Puesto` as FieldKey),
    get(`${p}Tiempo` as FieldKey),
    get(`${p}Condiciones` as FieldKey),
  ];
  return (
    <View wrap={false}>
      <Bar>Historia de Trabajo</Bar>
      <Table
        firstBold
        head={['Trabajo', 'Empresa', 'Puesto', 'Tiempo', v === 'TX' ? 'Condiciones Especiales' : 'Condiciones especiales']}
        widths={[11, 31, 24, 12, 22]}
        rows={[fila('Actual', 'tActual'), fila('Último', 'tPenultimo'), fila('Penúltimo', 'tAntepenultimo')]}
      />
      <Rows
        cols={1}
        h={10}
        get={get}
        rows={[[{ l: v === 'TX' ? 'Accidentes laborales y/o secuelas' : 'Enfermedades profesionales y/o secuelas', k: 'enfermedadesProfesionales', labelW: 210 }]]}
      />
    </View>
  );
}

export function Patologicos({ get, v }: P) {
  return (
    <TwoCol
      left={
        <View>
          <Bar>{v === 'TX' ? 'Antecedentes Personales Patológicos' : 'Antecedentes personales patológicos'}</Bar>
          <Rows
            cols={1}
            labelW={96}
            get={get}
            rows={[
              [{ l: 'Etilismo', k: 'etilismo' }],
              [{ l: 'Tabaquismo', k: 'tabaquismo' }],
              [{ l: 'Adicciones', k: 'adicciones' }],
              [{ l: 'Alergias', k: 'alergias' }],
              [{ l: 'Quirúrgicos', k: 'quirurgicos' }],
              [{ l: 'Traumatismos', k: 'traumatismos' }],
              [{ l: 'Hemotransfusiones', k: 'hemotransfusiones' }],
            ]}
          />
        </View>
      }
      right={
        <View>
          <Bar>Enfermedades</Bar>
          <Rows
            cols={1}
            labelW={96}
            h={11}
            get={get}
            rows={[
              [{ l: 'Hipertensión Arterial', k: 'appHta' }],
              [{ l: 'Diabetes Mellitus', k: 'appDm' }],
              [{ l: 'Patología Cardiaca', k: 'appCardiaca' }],
              [{ l: 'Patología Respiratoria', k: 'appRespiratoria' }],
              [{ l: 'Patología Renal', k: 'appRenal' }],
              [{ l: 'Patología Músculo-Esquelética', k: 'appMusculoEsqueletica' }],
              [{ l: 'Patología Lumbar', k: 'appLumbar' }],
              [{ l: 'Enfermedad Ácido Péptica', k: 'appAcidoPeptica' }],
              [{ l: 'Otras (Especificar)', k: 'appOtras' }],
            ]}
          />
        </View>
      }
    />
  );
}

/** Tórax, abdomen, cabeza (ojos, oídos…), extremidades y padecimiento actual. */
export function ExploracionRegional({ get, v }: P) {
  const ojo = (titulo: string, od: FieldKey, oi: FieldKey, extra?: CellDef) => (
    <Group label={titulo} w={84} tone="label">
      <Rows cols={extra ? 3 : 2} labelW={40} h={11} get={get} rows={[[{ l: 'Ojo derecho', k: od }, { l: 'Ojo izquierdo', k: oi }, ...(extra ? [extra] : [])]]} />
    </Group>
  );
  return (
    <View>
      <Group label="Tórax">
        <Rows cols={3} labelW={48} h={10} get={get} rows={[[{ l: 'Observaciones', k: 'toraxObs' }, { l: 'Pulmones', k: 'toraxPulmones' }, { l: 'Corazón', k: 'toraxCorazon' }]]} />
      </Group>
      <Group label="Abdomen">
        <Rows
          cols={3}
          labelW={48}
          h={10}
          get={get}
          rows={[
            [{ l: 'Observaciones', k: 'abdomenObs', span: 2 }, { l: 'Hígado', k: 'abdomenHigado' }],
            [{ l: 'Hernias', k: 'abdomenHernias' }, { l: 'Hemorroides', k: 'abdomenHemorroides' }, { l: 'Bazo', k: 'abdomenBazo' }],
          ]}
        />
      </Group>

      <SubBar>Cabeza</SubBar>
      <Group label="Ojos">
        <Group label={v === 'TX' ? 'Visión Lejana (Snellen)' : 'Visión lejana (Tabla de Snellen)'} w={84} tone="label">
          <Rows
            cols={2}
            labelW={40}
            h={11}
            get={get}
            rows={[
              [{ l: 'Ojo derecho', k: 'vlOd' }, { l: 'Ojo izquierdo', k: 'vlOi' }],
              [{ l: 'Examen con lentes', k: 'vlConLentes' }, { l: 'Resultado', k: 'vlResultado' }],
            ]}
          />
        </Group>
        <Group label={v === 'TX' ? 'Visión Cercana (Jaeger)' : 'Visión cercana (Tabla de Jaeger)'} w={84} tone="label">
          <Rows
            cols={2}
            labelW={40}
            h={11}
            get={get}
            rows={[
              [{ l: 'Ojo derecho', k: 'vcOd' }, { l: 'Ojo izquierdo', k: 'vcOi' }],
              [{ l: 'Examen con lentes', k: 'vcConLentes' }, { l: 'Resultado', k: 'vcResultado' }],
            ]}
          />
        </Group>
        {ojo('Reflejos', 'reflejosOcularesOd', 'reflejosOcularesOi', { l: 'Estrabismo', k: 'estrabismo' })}
        {ojo('Pterigiones', 'pterigionOd', 'pterigionOi', { l: 'Diferencia color', k: 'ishihara' })}
        {ojo('Cataratas', 'catarataOd', 'catarataOi', { l: 'Otro', k: 'oftalRecomendaciones' })}
        <Group label="Lentes graduados de seguridad" w={84} tone="label">
          <Rows cols={1} h={11} get={get} rows={[[{ k: 'lentesSeguridad', center: true }]]} />
        </Group>
      </Group>

      {/* En TX los oídos abren la segunda hoja */}
      <View break={v === 'TX'} style={{ marginTop: 6 }}>
        <Group label="Oídos">
          <Group label="Canal Auditivo" w={70} tone="label">
            <Rows cols={2} labelW={40} h={10} get={get} rows={[[{ l: 'Oído der.', k: 'canalAuditivoOd' }, { l: 'Oído izq.', k: 'canalAuditivoOi' }]]} />
          </Group>
          <Group label="Membrana" w={70} tone="label">
            <Rows cols={2} labelW={40} h={10} get={get} rows={[[{ l: 'Oído der.', k: 'membranaTimpanicaD' }, { l: 'Oído izq.', k: 'membranaTimpanicaI' }]]} />
          </Group>
        </Group>
      </View>
      <Group label="Nariz">
        <Rows cols={2} labelW={48} h={10} get={get} rows={[[{ l: 'Observaciones', k: 'narizObs' }, { l: 'Obstrucción', k: 'narizObstrucciones' }]]} />
      </Group>
      <Rows cols={3} labelW={46} h={11} get={get} rows={[[{ l: 'Orofaringe', k: 'orofaringe', hl: true }, { l: 'Dentadura', k: 'dentadura', hl: v === 'PECO' }, { l: 'Cuello', k: 'cuello', hl: true }]]} />
      <Group label="Genitourinario">
        <Rows
          cols={3}
          labelW={48}
          h={10}
          get={get}
          rows={[
            [{ l: 'Observaciones', k: 'guObs', span: 3 }],
            [{ l: 'Hernias', k: 'guHernias' }, { l: 'Hidrocele', k: 'guHidrocele' }, { l: 'Varicocele', k: 'guVaricocele' }],
          ]}
        />
      </Group>
      <Group label={v === 'TX' ? 'Extremidades Superiores' : 'Ext. Superiores'}>
        <Rows cols={2} labelW={48} h={12} get={get} rows={[[{ l: 'Observaciones', k: 'extSupObs' }, { l: 'Manos', k: 'extSupManos' }]]} />
      </Group>
      <Group label="Ext. Inferiores">
        <Rows cols={2} labelW={48} h={12} get={get} rows={[[{ l: 'Observaciones', k: 'extInfObs' }, { l: 'H. Valgus', k: 'extInfHalluxValgus' }]]} />
      </Group>
      <Rows cols={2} labelW={v === 'TX' ? 100 : 46} h={10} get={get} rows={[[{ l: v === 'TX' ? 'Reflejos Osteotendinosos' : 'Reflejos OT', k: 'reflejosOsteotendinosos', hl: true }, { l: 'Psiquismo', k: 'psiquismo', hl: true }]]} />

      <View style={{ marginTop: 6 }}>
        <Rows
          cols={1}
          h={v === 'PECO' ? 18 : 12}
          get={get}
          rows={[[{ l: v === 'TX' ? 'Padecimiento Actual / Toma Medicamentos' : 'Padecimiento actual / Toma medicamento', k: 'padecimientoActual', hl: v === 'PECO', labelW: 210, center: true }]]}
        />
      </View>
    </View>
  );
}

export function Audiometria({ get, v, values }: P & { values: HistoriaClinicaValues }) {
  const ancho = useContentWidth();
  return (
    <View wrap={false}>
      <Bar>Audiometría</Bar>
      {v === 'TX' && <Rows cols={1} h={14} get={get} rows={[[{ l: 'Resultado de Audiometría', k: 'audiometriaResultado', labelW: 120, center: true }]]} />}
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        <View style={{ width: '34%', paddingRight: 6 }}>
          <Table
            head={['Frecuencia', 'Oído derecho', 'Oído izquierdo']}
            widths={[34, 33, 33]}
            rows={AUDIO_FRECUENCIAS.map((hz) => [String(hz), get(`aud${hz}Od` as FieldKey), get(`aud${hz}Oi` as FieldKey)])}
          />
        </View>
        <Audiograma values={values} width={ancho * 0.66 - 2} height={100} />
      </View>
      {v === 'PECO' && (
        <View style={{ marginTop: 2 }}>
          <Rows cols={1} h={11} get={get} rows={[[{ l: 'Resultado de audiometría', k: 'audiometriaResultado', labelW: 120 }]]} />
        </View>
      )}
    </View>
  );
}

export function Laboratorio({ get, v }: P) {
  return (
    <View wrap={false}>
      {v === 'PECO' ? <Bar>Laboratoriales</Bar> : <View style={{ marginTop: 7 }} />}
      <SubBar>Química Sanguínea</SubBar>
      <Rows
        get={get}
        labelW={48}
        h={9}
        rows={[
          [{ l: 'Glucosa', k: 'qsGlucosa' }, { l: 'Urea', k: 'qsUrea' }, { l: 'Creatinina', k: 'qsCreatinina' }, { l: 'Ácido úrico', k: 'qsAcidoUrico' }],
          [{ l: 'Colesterol', k: 'qsColesterol' }, { l: 'Triglicéridos', k: 'qsTrigliceridos' }, { l: 'Albúmina', k: 'qsAlbumina' }, { l: 'Bilirrubina total', k: 'qsBilirrubinaTotal' }],
          [{ l: 'AST (TGO)', k: 'qsAst' }, { l: 'F. Alcalina total', k: 'qsFosfatasaAlcalina' }, { l: 'LDH', k: 'qsDhl' }, { l: 'HbA1C', k: 'qsHba1c' }],
        ]}
      />
      <SubBar>Biometría Hemática</SubBar>
      <Rows
        get={get}
        labelW={48}
        h={9}
        rows={[
          [{ l: 'Hemoglobina', k: 'bhHemoglobina' }, { l: 'Hematocrito', k: 'bhHematocrito' }, { l: 'Plaquetas', k: 'bhPlaquetas' }, { l: 'Leucocitos', k: 'bhLeucocitos' }],
          [{ l: 'Linfocitos', k: 'bhLinfocitosPct' }, { l: 'Monocitos', k: 'bhMonocitos' }, { l: 'Neutrófilos', k: 'bhNeutrofilos' }, { l: 'Eritrocitos', k: 'bhEritrocitos' }],
          [{ l: 'VCM', k: 'bhVcm' }, { l: 'MCH', k: 'bhMch' }, { l: 'MCHC', k: 'bhMchc' }, { l: 'MPV', k: 'bhMpv' }],
        ]}
      />
      <SubBar>{v === 'TX' ? 'Orina' : 'General de Orina'}</SubBar>
      <Rows
        get={get}
        labelW={48}
        h={11}
        rows={[
          [{ l: 'Color', k: 'egoColor' }, { l: 'pH', k: 'egoPh' }, { l: 'Proteínas', k: 'egoProteinas' }, { l: 'Bilirrubina', k: 'egoBilirrubina' }],
          [{ l: 'Aspecto', k: 'egoAspecto' }, { l: 'Leucocitos', k: 'egoLeucocitos' }, { l: 'Glucosa', k: 'egoGlucosa' }, { l: 'Hemoglobina', k: 'egoHemoglobina' }],
          [{ l: 'Densidad', k: 'egoDensidad' }, { l: 'Nitritos', k: 'egoNitritos' }, { l: 'Cetonas', k: 'egoCetonas' }, { l: 'Cristales', k: 'egoCristales' }],
          [{ l: 'Urobilinógeno', k: 'egoUrobilinogeno', span: 2 }, { l: 'Eritrocitos', k: 'egoEritrocitos', span: 2 }],
        ]}
      />
    </View>
  );
}

/** Tabla horizontal de drogas (hoja principal TX): cada celda se pinta de REACTIVO_FONDO.TX si dio reactivo. */
export function DrogasTablaTx({ get }: { get: Get }) {
  const t = useTheme();
  const abrev = Object.fromEntries(DROGAS.map((d) => [d.key, d.abrev]));
  const cell = { borderRightWidth: 0.6, borderBottomWidth: 0.6, borderColor: '#FFFFFF', paddingVertical: 1.6, paddingHorizontal: 2.5 };
  return (
    <View style={{ flexDirection: 'row', marginTop: 8 }} wrap={false}>
      <View style={{ width: '36%', backgroundColor: t.highlight, justifyContent: 'center', marginRight: 2 }}>
        <Text style={{ color: '#FFFFFF', textAlign: 'center' }}>Búsqueda de drogas en orina</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row' }}>
          {ORDEN_TABLA_TX.map((k) => (
            <Text key={k} style={[cell, { width: `${100 / 6}%`, backgroundColor: t.label, color: '#FFFFFF', textAlign: 'center' }]}>
              {abrev[k]}
            </Text>
          ))}
        </View>
        <View style={{ flexDirection: 'row' }}>
          {ORDEN_TABLA_TX.map((k) => {
            const resultado = get(k);
            const reactivo = esReactivo(resultado);
            return (
              <Text key={k} style={[cell, { width: `${100 / 6}%`, backgroundColor: reactivo ? REACTIVO_FONDO.TX : t.value, color: reactivo ? '#FFFFFF' : undefined, textAlign: 'center' }]}>
                {resultado}
              </Text>
            );
          })}
        </View>
      </View>
    </View>
  );
}

export function Gabinete({ get, v }: P) {
  const bloque = (titulo: string, rows: { l: string; k: FieldKey }[]) => (
    <View wrap={false}>
      <Bar>{titulo}</Bar>
      <Rows cols={1} labelW={130} h={13} get={get} rows={rows.map((r) => [r])} />
    </View>
  );
  return (
    <View>
      {bloque(v === 'TX' ? 'Electrocardiograma' : 'Prueba Cardiológica', [{ l: v === 'TX' ? 'Diagnóstico Final' : 'Diagnóstico final', k: 'ecg' }])}
      {bloque('Radiografías', [
        { l: 'Tele Tórax', k: 'rxTorax' },
        { l: 'Tele Lumbar', k: 'rxLumbar' },
      ])}
      {bloque('Espirometría', [{ l: 'Espirometría', k: 'espirometria' }])}
      {bloque('Valoración Oftalmológica', [{ l: v === 'TX' ? 'Diagnóstico Final' : 'Diagnóstico final', k: 'valoracionOftalmologica' }])}
    </View>
  );
}

export function DiagnosticoGeneral({ get }: { get: Get }) {
  return (
    <View wrap={false}>
      <Bar>Diagnóstico General</Bar>
      <Text style={{ textAlign: 'center', paddingVertical: 4, paddingHorizontal: 20, lineHeight: 1.35 }}>{get('diagnostico')}</Text>
    </View>
  );
}

/** Bloque de médico dictaminador del formato TX (hoja principal y pruebas complementarias). */
export function MedicoDictaminadorTx({ medico, nombreCapturado, logos }: { medico?: MedicoFirmante; nombreCapturado: string; logos: PdfLogos }) {
  const get: Get = () => '';
  return (
    <View wrap={false}>
      <Bar mt={10}>Médico Dictaminador</Bar>
      <Rows
        cols={2}
        labelW={60}
        h={14}
        get={get}
        rows={[
          [{ l: 'Nombre', v: medico?.nombre ?? (nombreCapturado || '---') }, { l: 'Cédula Profesional', v: medico?.cedula ?? '---', labelW: 70 }],
          [{ l: 'Universidad', v: medico?.universidad ?? '---' }, { l: 'Dirección', v: medico?.direccion ?? '---', labelW: 70 }],
        ]}
      />
      <Text style={{ textAlign: 'center', marginTop: 10 }}>Firma</Text>
      {medico && logos.firmaCoriaSalas ? (
        <Image src={logos.firmaCoriaSalas} style={{ alignSelf: 'center', width: 56, height: 34, objectFit: 'contain' }} />
      ) : (
        <View style={{ alignSelf: 'center', width: 150, height: 34, borderBottomWidth: 0.5, borderBottomColor: '#BFBFBF' }} />
      )}
    </View>
  );
}

// ───────────────────────── Hojas complementarias ─────────────────────────

function EncabezadoHoja({ titulo, logos, v }: { titulo: string; logos: PdfLogos; v: V }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
      <CruzRojaLogo src={logos.cruzRoja} w={v === 'PECO' ? 114 : 77} delegacion={t.delegacion} />
      <RightTitle title={titulo} subtitle="COORDINACIÓN DE SERVICIOS MÉDICOS" bold={v === 'PECO'} />
    </View>
  );
}

interface HojaProps {
  get: Get;
  v: V;
  logos: PdfLogos;
  datos: CellDef[][];
}

/** Fondo de un resultado "REACTIVO" en la tabla de drogas, tal como viene en los formatos oficiales. */
const REACTIVO_FONDO: Record<V, string> = { PECO: '#FFFF00', TX: '#FF3600' };

/** true solo con el texto exacto "REACTIVO" (no con "NO REACTIVO"). */
const esReactivo = (resultado: string) => resultado.trim().toUpperCase() === 'REACTIVO';

export function HojaPruebasComplementarias({ get, v, logos, datos, firmaPeco, medico, nombreCapturado }: HojaProps & { firmaPeco: string[]; medico?: MedicoFirmante; nombreCapturado: string }) {
  const t = useTheme();
  const peco = v === 'PECO';
  const encabezadoTabla = (
    <View style={{ flexDirection: 'row', marginTop: 8 }}>
      <Text style={{ width: '60%', backgroundColor: t.bar, color: '#FFFFFF', textAlign: 'center', fontFamily: BOLD, paddingVertical: 1.6, marginRight: 1 }}>Examen</Text>
      <Text style={{ width: '40%', backgroundColor: t.bar, color: '#FFFFFF', textAlign: 'center', fontFamily: BOLD, paddingVertical: 1.6 }}>Resultado</Text>
    </View>
  );
  const fila = (nombre: string, resultado: string, cabecera = false) => {
    const reactivo = !cabecera && esReactivo(resultado);
    return peco ? (
      <View style={{ flexDirection: 'row', marginTop: 3 }}>
        <View style={{ width: '60%', backgroundColor: t.label, justifyContent: 'center', minHeight: cabecera ? 20 : 15, marginRight: 1 }}>
          <Text style={{ color: '#FFFFFF', textAlign: 'center', fontFamily: BOLD }}>{nombre}</Text>
        </View>
        <View style={{ width: '40%', backgroundColor: cabecera ? '#808080' : reactivo ? REACTIVO_FONDO.PECO : '#FFFFFF', justifyContent: 'center' }}>
          <Text style={{ textAlign: 'center', fontFamily: BOLD, color: '#000000' }}>{resultado}</Text>
        </View>
      </View>
    ) : (
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        <Text style={{ width: '60%', textAlign: cabecera ? 'left' : 'center', fontFamily: BOLD }}>{nombre}</Text>
        <Text style={{ width: '40%', textAlign: 'center', backgroundColor: reactivo ? REACTIVO_FONDO.TX : undefined, color: reactivo ? '#FFFFFF' : undefined }}>{resultado}</Text>
      </View>
    );
  };

  return (
    <Hoja footer="Pruebas complementarias · Coordinación de Servicios Médicos">
      <EncabezadoHoja titulo="PRUEBAS COMPLEMENTARIAS" logos={logos} v={v} />
      <Bar mt={4}>Datos Generales</Bar>
      <Rows get={get} cols={4} labelW={56} h={peco ? 9 : 14} rows={datos} />

      {encabezadoTabla}
      {fila('BÚSQUEDA DE DROGAS EN ORINA', peco ? 'INTERVALO DE REFERENCIA: NO REACTIVO' : '', true)}
      {DROGAS.map((d) => (
        <View key={d.key} wrap={false}>
          {fila(d.nombre, get(d.key))}
          <Paragraph size={peco ? 4.8 : 4.6}>{d.descripcion}</Paragraph>
        </View>
      ))}
      <Paragraph size={peco ? 6.6 : 4.8} bold={peco}>
        {AVISO_PRESUNTIVO}
      </Paragraph>
      <Text style={{ color: '#808080', fontSize: peco ? 6.6 : 4.8 }}>{METODO_DROGAS}</Text>

      <View wrap={false}>
        {encabezadoTabla}
        {fila('GRUPO SANGUÍNEO Y FACTOR RH', get('bhGrupoRh'))}
        <Paragraph size={peco ? 4.8 : 4.6}>{TEXTO_GRUPO_RH}</Paragraph>
        <Text style={{ color: '#808080', fontSize: peco ? 6.6 : 4.8 }}>{METODO_GRUPO_RH}</Text>
      </View>

      {peco ? (
        <Signature lines={firmaPeco} imagenSrc={medico ? logos.firmaCoriaSalas : undefined} />
      ) : (
        <MedicoDictaminadorTx medico={medico} nombreCapturado={nombreCapturado} logos={logos} />
      )}
    </Hoja>
  );
}

export function HojaExamenesVisuales({ get, v, logos, datos }: HojaProps) {
  const t = useTheme();
  const peco = v === 'PECO';
  const bloque = (titulo: string, od: FieldKey, oi: FieldKey, extra?: [FieldKey, FieldKey]) => {
    const inner = (
      <View>
        <Text style={{ backgroundColor: peco ? t.label : t.sub, color: '#FFFFFF', textAlign: 'center', paddingVertical: 1.4, borderBottomWidth: 0.6, borderColor: '#FFFFFF' }}>{titulo}</Text>
        <View style={{ flexDirection: 'row' }}>
          {['Ojo derecho:', 'Ojo izquierdo:'].map((l) => (
            <Text key={l} style={{ width: '50%', backgroundColor: t.label, color: '#FFFFFF', textAlign: 'center', paddingVertical: 1.4, borderRightWidth: 0.6, borderBottomWidth: 0.6, borderColor: '#FFFFFF' }}>
              {l}
            </Text>
          ))}
        </View>
        <View style={{ flexDirection: 'row' }}>
          {[od, oi].map((k) => (
            <Text key={k} style={{ width: '50%', backgroundColor: t.value, textAlign: 'center', paddingVertical: 3.5, borderRightWidth: 0.6, borderBottomWidth: 0.6, borderColor: '#FFFFFF' }}>
              {get(k)}
            </Text>
          ))}
        </View>
      </View>
    );
    return (
      <View wrap={false} style={{ marginTop: peco ? 0 : 2 }}>
        {peco ? inner : <Group label="Resultado" w={44}>{inner}</Group>}
        {extra && (
          <Rows cols={2} labelW={60} h={9} get={get} rows={[[{ l: 'Examen con lentes:', k: extra[0], center: true }, { l: 'Resultado:', k: extra[1], center: true }]]} />
        )}
      </View>
    );
  };
  const finales: CellDef[][] = (peco
    ? [
        { l: 'Estrabismo:', k: 'estrabismo' as FieldKey },
        { l: 'Test de Ishihara:', k: 'ishihara' as FieldKey },
        { l: '¿Requiere lentes de seguridad graduados?:', k: 'lentesSeguridad' as FieldKey },
        { l: 'Recomendaciones:', k: 'oftalRecomendaciones' as FieldKey },
      ]
    : [
        { l: 'Test de Ishihara', k: 'ishihara' as FieldKey },
        { l: 'Estrabismo', k: 'estrabismo' as FieldKey },
        { l: '¿Requiere lentes de seguridad graduados?', k: 'lentesSeguridad' as FieldKey },
        { l: 'Recomendaciones', k: 'oftalRecomendaciones' as FieldKey },
      ]
  ).map((c) => [{ ...c, labelW: peco ? 214 : 230 }]);

  return (
    <Hoja footer="Exámenes visuales · Coordinación de Servicios Médicos">
      <EncabezadoHoja titulo="EXÁMENES VISUALES" logos={logos} v={v} />
      <Bar mt={4}>Datos Generales</Bar>
      <Rows get={get} cols={4} labelW={56} h={peco ? 9 : 14} rows={datos} />

      <View style={{ marginTop: 10 }}>
        {bloque(peco ? 'Visión Lejana (Snellen):' : 'Visión Lejana (Snellen):', 'vlOd', 'vlOi', ['vlConLentes', 'vlResultado'])}
        {bloque('Visión Cercana (Jaeger):', 'vcOd', 'vcOi', ['vcConLentes', 'vcResultado'])}
        {bloque(peco ? 'Reflejos:' : 'Reflejos oculares:', 'reflejosOcularesOd', 'reflejosOcularesOi')}
        {bloque('Pterigion:', 'pterigionOd', 'pterigionOi')}
        {bloque('Cataratas:', 'catarataOd', 'catarataOi')}
      </View>
      <View style={{ marginTop: 6 }}>
        <Rows get={get} cols={1} h={15} rows={finales} />
      </View>

      {peco ? (
        <Signature lines={[`DR. ${OFTALMOLOGO.nombre} ${OFTALMOLOGO.siglasUniversidad} ${OFTALMOLOGO.cedula}`, 'Médico especialista en oftalmología']} />
      ) : (
        <View style={{ marginTop: 34, alignItems: 'center' }} wrap={false}>
          <Text>Dr. Joaquín Lozano Guasch</Text>
          <Text style={{ marginTop: 1 }}>Médico Especialista en Oftalmología</Text>
          <Text style={{ marginTop: 1 }}>Ced. Prof. {OFTALMOLOGO.cedula} UdeM</Text>
        </View>
      )}
    </Hoja>
  );
}
