import { Image, Text, View } from '@react-pdf/renderer';
import {
  AUDIO_FRECUENCIAS,
  type FieldKey,
  type HistoriaClinicaValues,
} from '@/features/historia-clinica/config/fields';
import { OFTALMOLOGO, type MedicoFirmante } from '@/features/historia-clinica/config/medicos';
import type { PdfLogos, PlantillaId } from './config';
import {
  Ancho,
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
  useAncho,
  useContentWidth,
  useTheme,
  type CellDef,
  type Get,
} from './primitives';
import { tamanoAjustado } from './ajuste';
import {
  AVISO_PRESUNTIVO,
  DROGAS,
  METODO_DROGAS,
  METODO_GRUPO_RH,
  ORDEN_TABLA_TX,
  TEXTO_GRUPO_RH,
} from './textos-laboratorio';

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
              [
                { l: 'Diabetes', k: 'ahfDiabetes' },
                { l: 'Cardiopatía', k: 'ahfCardiopatia' },
              ],
              [
                { l: 'Hipertensión', k: 'ahfHipertension' },
                { l: 'Neoplasias', k: 'ahfNeoplasias' },
              ],
              [
                { l: 'Infecciosas', k: 'ahfInfecciosa' },
                { l: 'Otra', k: 'ahfOtras' },
              ],
              [{ l: v === 'TX' ? 'Abuelos Pat.' : 'Abuelos P.', k: 'ahfAbuelosPaternos', span: 2 }],
              [{ l: v === 'TX' ? 'Abuelos Mat.' : 'Abuelos M.', k: 'ahfAbuelosMaternos', span: 2 }],
              [{ l: 'Padre', k: 'ahfPadre', span: 2 }],
              [{ l: 'Madre', k: 'ahfMadre', span: 2 }],
              [
                { l: 'Hermanos', k: 'ahfHermanos' },
                { l: 'Hijos', k: 'ahfHijos' },
              ],
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
            h={16}
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
        head={[
          'Trabajo',
          'Empresa',
          'Puesto',
          'Tiempo',
          v === 'TX' ? 'Condiciones Especiales' : 'Condiciones especiales',
        ]}
        widths={[11, 31, 24, 12, 22]}
        rows={[fila('Actual', 'tActual'), fila('Último', 'tPenultimo'), fila('Penúltimo', 'tAntepenultimo')]}
      />
      <Rows
        cols={1}
        h={10}
        get={get}
        rows={[
          [
            {
              l: v === 'TX' ? 'Accidentes laborales y/o secuelas' : 'Enfermedades profesionales y/o secuelas',
              k: 'enfermedadesProfesionales',
              labelW: 210,
            },
          ],
        ]}
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

/**
 * Tórax, abdomen y ojos: cierran la primera hoja de la historia clínica, como en los formatos.
 * Oídos y lo que sigue van en `ExploracionRegional2`, que siempre abre la segunda hoja.
 */
export function ExploracionRegional({ get, v }: P) {
  const tx = v === 'TX';
  const ancho = useAncho() - 46; // dentro del rótulo "Ojos"
  const fila = (titulo: string, cells: CellDef[], h = 10) => (
    <Group label={titulo} w={84} tone="label">
      <Rows cols={cells.length} labelW={tx ? 38 : 46} h={h} get={get} rows={[cells]} />
    </Group>
  );
  const od = (k: FieldKey): CellDef => ({ l: tx ? 'Ojo Der.' : 'Ojo derecho', k });
  const oi = (k: FieldKey): CellDef => ({ l: tx ? 'Ojo Izq.' : 'Ojo izquierdo', k });
  return (
    <View wrap={false}>
      <Group label="Tórax">
        <Rows
          cols={3}
          labelW={50}
          h={9}
          get={get}
          rows={[
            [
              { l: 'Observaciones', k: 'toraxObs' },
              { l: 'Pulmones', k: 'toraxPulmones' },
              { l: 'Corazón', k: 'toraxCorazon' },
            ],
          ]}
        />
      </Group>
      <Group label="Abdomen">
        <Rows
          cols={3}
          labelW={50}
          h={9}
          get={get}
          rows={[
            [
              { l: 'Observaciones', k: 'abdomenObs', span: 2 },
              { l: 'Hígado', k: 'abdomenHigado' },
            ],
            [
              { l: 'Hernias', k: 'abdomenHernias' },
              { l: 'Hemorroides', k: 'abdomenHemorroides' },
              { l: 'Bazo', k: 'abdomenBazo' },
            ],
          ]}
        />
      </Group>

      <SubBar>Cabeza</SubBar>
      <Group label="Ojos" center={tx}>
        {tx ? (
          <>
            {/* TX: agudeza visual solo OD/OI (el examen con lentes va en la hoja de Exámenes Visuales) */}
            {fila(
              'Visión Lejana (Snellen)',
              [
                { l: 'Ojo Derecho', k: 'vlOd' },
                { l: 'Ojo Izquierdo', k: 'vlOi' },
              ],
              15,
            )}
            {fila(
              'Visión Cercana (Jaeger)',
              [
                { l: 'Ojo Derecho', k: 'vcOd' },
                { l: 'Ojo Izquierdo', k: 'vcOi' },
              ],
              15,
            )}
            <View style={{ flexDirection: 'row' }}>
              <View style={{ width: '66.67%' }}>
                <Ancho pt={(ancho * 2) / 3}>
                  {fila('Reflejos', [od('reflejosOcularesOd'), oi('reflejosOcularesOi')], 8)}
                  {fila('Pterigiones', [od('pterigionOd'), oi('pterigionOi')], 8)}
                  {fila('Cataratas', [od('catarataOd'), oi('catarataOi')], 8)}
                </Ancho>
              </View>
              <View style={{ flex: 1 }}>
                <Ancho pt={ancho / 3}>
                  <Rows cols={1} labelW={38} h={8} get={get} rows={[[{ l: 'Estrabismo', k: 'estrabismo' }]]} />
                  <Rows cols={1} labelW={38} h={16} get={get} rows={[[{ l: 'Otro', k: 'oftalRecomendaciones' }]]} />
                </Ancho>
              </View>
            </View>
            {fila('Colorimetría (Test de Ishihara)', [{ l: 'Resultado', k: 'ishihara', span: 3 }], 11)}
          </>
        ) : (
          <>
            <Group label="Visión lejana (Tabla de Snellen)" w={84} tone="label">
              <Rows
                cols={2}
                labelW={46}
                h={10}
                get={get}
                rows={[
                  [od('vlOd'), oi('vlOi')],
                  [
                    { l: 'Examen con lentes', k: 'vlConLentes' },
                    { l: 'Resultado', k: 'vlResultado' },
                  ],
                ]}
              />
            </Group>
            <Group label="Visión cercana (Tabla de Jaeger)" w={84} tone="label">
              <Rows
                cols={2}
                labelW={46}
                h={10}
                get={get}
                rows={[
                  [od('vcOd'), oi('vcOi')],
                  [
                    { l: 'Examen con lentes', k: 'vcConLentes' },
                    { l: 'Resultado', k: 'vcResultado' },
                  ],
                ]}
              />
            </Group>
            {fila(
              'Reflejos',
              [od('reflejosOcularesOd'), oi('reflejosOcularesOi'), { l: 'Estrabismo', k: 'estrabismo' }],
              14,
            )}
            {fila('Pterigiones', [od('pterigionOd'), oi('pterigionOi'), { l: 'Diferencia color', k: 'ishihara' }], 14)}
            {fila('Cataratas', [od('catarataOd'), oi('catarataOi'), { l: 'Otro', k: 'oftalRecomendaciones' }], 14)}
          </>
        )}
        <Rows
          grid={[
            { w: tx ? 1.6 : 2.5, lw: 0 },
            { w: 1, lw: 0 },
          ]}
          h={tx ? 18 : 13}
          get={get}
          rows={[
            [
              {
                v: tx ? 'Lentes Graduados de Seguridad' : 'Lentes graduados de seguridad',
                center: true,
                labelText: true,
              },
              { k: 'lentesSeguridad' },
            ],
          ]}
        />
      </Group>
    </View>
  );
}

/** Oídos, nariz, orofaringe, genitourinario, extremidades, reflejos y padecimiento actual (abre la 2.ª hoja). */
export function ExploracionRegional2({ get, v }: P) {
  const tx = v === 'TX';
  return (
    <View break wrap={false}>
      <Group label="Oídos">
        <Group label="Canal Auditivo" w={70} tone="label">
          <Rows
            cols={2}
            labelW={46}
            h={9}
            get={get}
            rows={[
              [
                { l: tx ? 'Oído Der.' : 'Oído derecho', k: 'canalAuditivoOd' },
                { l: tx ? 'Oído Izq.' : 'Oído izquierdo', k: 'canalAuditivoOi' },
              ],
            ]}
          />
        </Group>
        <Group label="Membrana" w={70} tone="label">
          <Rows
            cols={2}
            labelW={46}
            h={12}
            get={get}
            rows={[
              [
                { l: tx ? 'Oído Der.' : 'Oído derecho', k: 'membranaTimpanicaD' },
                { l: tx ? 'Oído Izq.' : 'Oído izquierdo', k: 'membranaTimpanicaI' },
              ],
            ]}
          />
        </Group>
      </Group>
      <Group label="Nariz">
        <Rows
          cols={2}
          labelW={50}
          h={8}
          get={get}
          rows={[
            [
              { l: 'Observaciones', k: 'narizObs' },
              { l: 'Obstrucción', k: 'narizObstrucciones' },
            ],
          ]}
        />
      </Group>
      <Rows
        cols={3}
        labelW={46}
        h={12}
        get={get}
        rows={[
          [
            { l: 'Orofaringe', k: 'orofaringe', hl: true },
            { l: 'Dentadura', k: 'dentadura', hl: !tx },
            { l: 'Cuello', k: 'cuello', hl: true },
          ],
        ]}
      />
      <Group label="Genitourinario">
        <Rows
          cols={3}
          labelW={50}
          h={8}
          get={get}
          rows={[
            [{ l: 'Observaciones', k: 'guObs', span: 3 }],
            [
              { l: 'Hernias', k: 'guHernias' },
              { l: 'Hidrocele', k: 'guHidrocele' },
              { l: 'Varicocele', k: 'guVaricocele' },
            ],
          ]}
        />
      </Group>
      <Group label={tx ? 'Extremidades Superiores' : 'Ext. Superiores'}>
        <Rows
          cols={2}
          labelW={50}
          h={14}
          get={get}
          rows={[
            [
              { l: 'Observaciones', k: 'extSupObs' },
              { l: 'Manos', k: 'extSupManos' },
            ],
          ]}
        />
      </Group>
      <Group label="Ext. Inferiores">
        <Rows
          cols={2}
          labelW={50}
          h={12}
          get={get}
          rows={[
            [
              { l: 'Observaciones', k: 'extInfObs' },
              { l: 'H. Valgus', k: 'extInfHalluxValgus' },
            ],
          ]}
        />
      </Group>
      <Rows
        cols={2}
        labelW={tx ? 100 : 46}
        h={8}
        get={get}
        rows={[
          [
            { l: tx ? 'Reflejos Osteotendinosos' : 'Reflejos OT', k: 'reflejosOsteotendinosos', hl: true },
            { l: 'Psiquismo', k: 'psiquismo', hl: true },
          ],
        ]}
      />

      <View style={{ marginTop: tx ? 10 : 7 }}>
        <Rows
          cols={2}
          h={tx ? 15 : 22}
          get={get}
          rows={[
            [
              {
                v: tx ? 'Padecimiento Actual / Toma Medicamentos' : 'Padecimiento actual / Toma medicamento',
                labelText: true,
                hl: !tx,
                center: !tx,
              },
              { k: 'padecimientoActual', center: !tx },
            ],
          ]}
        />
      </View>
    </View>
  );
}

export function Audiometria({ get, v, values }: P & { values: HistoriaClinicaValues }) {
  const ancho = useContentWidth();
  const tx = v === 'TX';
  return (
    <View wrap={false}>
      <Bar mt={tx ? 8 : 6}>Audiometría</Bar>
      {tx && (
        <Rows
          cols={1}
          h={14}
          get={get}
          rows={[[{ l: 'Resultado de Audiometría', k: 'audiometriaResultado', labelW: 120, center: true, bold: true }]]}
        />
      )}
      <View style={{ flexDirection: 'row', marginTop: tx ? 3 : 0 }}>
        <View style={{ width: '34%', paddingRight: 4 }}>
          <Ancho pt={ancho * 0.34 - 4}>
            <Table
              padV={0.6}
              head={['Frecuencia', 'Oído derecho', 'Oído izquierdo']}
              widths={[34, 33, 33]}
              rows={AUDIO_FRECUENCIAS.map((hz) => [
                String(hz),
                get(`aud${hz}Od` as FieldKey),
                get(`aud${hz}Oi` as FieldKey),
              ])}
            />
          </Ancho>
        </View>
        <Audiograma values={values} width={ancho * 0.66 - 2} height={78} />
      </View>
      {!tx && (
        <Rows
          cols={1}
          h={9}
          get={get}
          rows={[[{ l: 'Resultado de audiometría', k: 'audiometriaResultado', labelW: 120 }]]}
        />
      )}
    </View>
  );
}

export function Laboratorio({ get, v }: P) {
  return (
    <View wrap={false}>
      {v === 'PECO' ? <Bar mt={5}>Laboratoriales</Bar> : <View style={{ marginTop: 6 }} />}
      <SubBar>Química Sanguínea</SubBar>
      <Rows
        get={get}
        labelW={50}
        h={8}
        rows={[
          [
            { l: 'Glucosa', k: 'qsGlucosa' },
            { l: 'Urea', k: 'qsUrea' },
            { l: 'Creatinina', k: 'qsCreatinina' },
            { l: 'Ácido úrico', k: 'qsAcidoUrico' },
          ],
          [
            { l: 'Colesterol', k: 'qsColesterol' },
            { l: 'Triglicéridos', k: 'qsTrigliceridos' },
            { l: 'Albúmina', k: 'qsAlbumina' },
            { l: 'Bilirrubina total', k: 'qsBilirrubinaTotal' },
          ],
          [
            { l: 'AST (TGO)', k: 'qsAst' },
            { l: 'F. Alcalina total', k: 'qsFosfatasaAlcalina' },
            { l: 'LDH', k: 'qsDhl' },
            { l: 'HbA1C', k: 'qsHba1c' },
          ],
        ]}
      />
      <SubBar>Biometría Hemática</SubBar>
      <Rows
        get={get}
        labelW={50}
        h={8}
        rows={[
          [
            { l: 'Hemoglobina', k: 'bhHemoglobina' },
            { l: 'Hematocrito', k: 'bhHematocrito' },
            { l: 'Plaquetas', k: 'bhPlaquetas' },
            { l: 'Leucocitos', k: 'bhLeucocitos' },
          ],
          [
            { l: 'Linfocitos', k: 'bhLinfocitosPct' },
            { l: 'Monocitos', k: 'bhMonocitos' },
            { l: 'Neutrófilos', k: 'bhNeutrofilos' },
            { l: 'Eritrocitos', k: 'bhEritrocitos' },
          ],
        ]}
      />
      <SubBar>{v === 'TX' ? 'Orina' : 'General de Orina'}</SubBar>
      <Rows
        get={get}
        labelW={50}
        h={9}
        rows={[
          [
            { l: 'Color', k: 'egoColor' },
            { l: 'pH', k: 'egoPh' },
            { l: 'Proteínas', k: 'egoProteinas' },
            { l: 'Bilirrubina', k: 'egoBilirrubina' },
          ],
          [
            { l: 'Aspecto', k: 'egoAspecto' },
            { l: 'Leucocitos', k: 'egoLeucocitos' },
            { l: 'Glucosa', k: 'egoGlucosa' },
            { l: 'Hemoglobina', k: 'egoHemoglobina' },
          ],
          [
            { l: 'Densidad', k: 'egoDensidad' },
            { l: 'Nitritos', k: 'egoNitritos' },
            { l: 'Cetonas', k: 'egoCetonas' },
            { l: 'Cristales', k: 'egoCristales' },
          ],
        ]}
      />
    </View>
  );
}

/** Tabla horizontal de drogas (hoja principal TX): cada celda se pinta de REACTIVO_FONDO.TX si dio reactivo. */
export function DrogasTablaTx({ get }: { get: Get }) {
  const t = useTheme();
  const abrev = Object.fromEntries(DROGAS.map((d) => [d.key, d.abrev]));
  const cell = {
    borderRightWidth: 0.6,
    borderBottomWidth: 0.6,
    borderColor: '#FFFFFF',
    paddingVertical: 1.6,
    paddingHorizontal: 2.5,
  };
  return (
    <View style={{ flexDirection: 'row', marginTop: 7 }} wrap={false}>
      <View style={{ width: '36%', backgroundColor: t.highlight, justifyContent: 'center', marginRight: 2 }}>
        <Text style={{ color: '#FFFFFF', textAlign: 'center' }}>Búsqueda de drogas en orina</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row' }}>
          {ORDEN_TABLA_TX.map((k) => (
            <Text
              key={k}
              style={[cell, { width: `${100 / 6}%`, backgroundColor: t.label, color: '#FFFFFF', textAlign: 'center' }]}
            >
              {abrev[k]}
            </Text>
          ))}
        </View>
        <View style={{ flexDirection: 'row' }}>
          {ORDEN_TABLA_TX.map((k) => {
            const resultado = get(k);
            const reactivo = esReactivo(resultado);
            return (
              <Text
                key={k}
                style={[
                  cell,
                  {
                    width: `${100 / 6}%`,
                    backgroundColor: reactivo ? REACTIVO_FONDO.TX : t.value,
                    color: reactivo ? '#FFFFFF' : undefined,
                    textAlign: 'center',
                  },
                ]}
              >
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
      <Bar mt={v === 'TX' ? 6 : 4}>{titulo}</Bar>
      <Rows cols={1} labelW={v === 'TX' ? 165 : 141} h={v === 'TX' ? 14 : 13} get={get} rows={rows.map((r) => [r])} />
    </View>
  );
  return (
    <View>
      {bloque(v === 'TX' ? 'Electrocardiograma' : 'Prueba Cardiológica', [
        { l: v === 'TX' ? 'Diagnóstico Final' : 'Diagnóstico final', k: 'ecg' },
      ])}
      {bloque('Radiografías', [
        { l: 'Tele Tórax', k: 'rxTorax' },
        { l: 'Tele Lumbar', k: 'rxLumbar' },
      ])}
      {bloque('Espirometría', [{ l: 'Espirometría', k: 'espirometria' }])}
      {bloque('Valoración Oftalmológica', [
        { l: v === 'TX' ? 'Diagnóstico Final' : 'Diagnóstico final', k: 'valoracionOftalmologica' },
      ])}
    </View>
  );
}

export function DiagnosticoGeneral({ get, v }: P) {
  const t = useTheme();
  const ancho = useContentWidth() - 40;
  const alto = v === 'TX' ? 24 : 18;
  const texto = get('diagnostico');
  return (
    <View wrap={false}>
      <Bar mt={v === 'TX' ? 6 : 4}>Diagnóstico General</Bar>
      <View
        style={{
          minHeight: alto + 6,
          justifyContent: 'center',
          paddingHorizontal: 20,
          backgroundColor: v === 'PECO' ? t.value : undefined,
        }}
      >
        <Text style={{ textAlign: 'center', fontSize: tamanoAjustado(texto, ancho, alto, t.fontSize) }}>{texto}</Text>
      </View>
    </View>
  );
}

/** Bloque de médico dictaminador del formato TX (hoja principal y pruebas complementarias). */
export function MedicoDictaminadorTx({
  medico,
  nombreCapturado,
  logos,
}: {
  medico?: MedicoFirmante;
  nombreCapturado: string;
  logos: PdfLogos;
}) {
  const get: Get = () => '';
  return (
    <View wrap={false}>
      <Bar mt={8}>Médico Dictaminador</Bar>
      <Rows
        cols={2}
        labelW={55}
        h={14}
        get={get}
        rows={[
          [
            { l: 'Nombre', v: medico?.nombre ?? (nombreCapturado || '---') },
            { l: 'Cédula Profesional', v: medico?.cedula ?? '---', labelW: 70 },
          ],
          [
            { l: 'Universidad', v: medico?.universidad ?? '---' },
            { l: 'Dirección', v: medico?.direccion ?? '---', labelW: 70 },
          ],
        ]}
      />
      <Text style={{ textAlign: 'center', marginTop: 8 }}>Firma</Text>
      {medico && logos.firmaCoriaSalas ? (
        <Image
          src={logos.firmaCoriaSalas}
          style={{ alignSelf: 'center', width: 56, height: 34, objectFit: 'contain' }}
        />
      ) : (
        <View
          style={{ alignSelf: 'center', width: 150, height: 34, borderBottomWidth: 0.5, borderBottomColor: '#BFBFBF' }}
        />
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

export function HojaPruebasComplementarias({
  get,
  v,
  logos,
  datos,
  firmaPeco,
  medico,
  nombreCapturado,
}: HojaProps & { firmaPeco: string[]; medico?: MedicoFirmante; nombreCapturado: string }) {
  const t = useTheme();
  const peco = v === 'PECO';
  const encabezadoTabla = (
    <View style={{ flexDirection: 'row', marginTop: 8 }}>
      <Text
        style={{
          width: '60%',
          backgroundColor: t.bar,
          color: '#FFFFFF',
          textAlign: 'center',
          fontFamily: BOLD,
          paddingVertical: 1.6,
          marginRight: 1,
        }}
      >
        Examen
      </Text>
      <Text
        style={{
          width: '40%',
          backgroundColor: t.bar,
          color: '#FFFFFF',
          textAlign: 'center',
          fontFamily: BOLD,
          paddingVertical: 1.6,
        }}
      >
        Resultado
      </Text>
    </View>
  );
  const fila = (nombre: string, resultado: string, cabecera = false) => {
    const reactivo = !cabecera && esReactivo(resultado);
    return peco ? (
      <View style={{ flexDirection: 'row', marginTop: 3 }}>
        <View
          style={{
            width: '60%',
            backgroundColor: t.label,
            justifyContent: 'center',
            minHeight: cabecera ? 20 : 15,
            marginRight: 1,
          }}
        >
          <Text style={{ color: '#FFFFFF', textAlign: 'center', fontFamily: BOLD }}>{nombre}</Text>
        </View>
        <View
          style={{
            width: '40%',
            backgroundColor: cabecera ? '#808080' : reactivo ? REACTIVO_FONDO.PECO : '#FFFFFF',
            justifyContent: 'center',
          }}
        >
          <Text style={{ textAlign: 'center', fontFamily: BOLD, color: '#000000' }}>{resultado}</Text>
        </View>
      </View>
    ) : (
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        <Text style={{ width: '60%', textAlign: cabecera ? 'left' : 'center', fontFamily: BOLD }}>{nombre}</Text>
        <Text
          style={{
            width: '40%',
            textAlign: 'center',
            backgroundColor: reactivo ? REACTIVO_FONDO.TX : undefined,
            color: reactivo ? '#FFFFFF' : undefined,
          }}
        >
          {resultado}
        </Text>
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
        <Text
          style={{
            backgroundColor: peco ? t.label : t.sub,
            color: '#FFFFFF',
            textAlign: 'center',
            paddingVertical: 1.4,
            borderBottomWidth: 0.6,
            borderColor: '#FFFFFF',
          }}
        >
          {titulo}
        </Text>
        <View style={{ flexDirection: 'row' }}>
          {['Ojo derecho:', 'Ojo izquierdo:'].map((l) => (
            <Text
              key={l}
              style={{
                width: '50%',
                backgroundColor: t.label,
                color: '#FFFFFF',
                textAlign: 'center',
                paddingVertical: 1.4,
                borderRightWidth: 0.6,
                borderBottomWidth: 0.6,
                borderColor: '#FFFFFF',
              }}
            >
              {l}
            </Text>
          ))}
        </View>
        <View style={{ flexDirection: 'row' }}>
          {[od, oi].map((k) => (
            <Text
              key={k}
              style={{
                width: '50%',
                backgroundColor: t.value,
                textAlign: 'center',
                paddingVertical: 3.5,
                borderRightWidth: 0.6,
                borderBottomWidth: 0.6,
                borderColor: '#FFFFFF',
              }}
            >
              {get(k)}
            </Text>
          ))}
        </View>
      </View>
    );
    return (
      <View wrap={false} style={{ marginTop: peco ? 0 : 2 }}>
        {peco ? (
          inner
        ) : (
          <Group label="Resultado" w={44}>
            {inner}
          </Group>
        )}
        {extra && (
          <Rows
            cols={2}
            labelW={60}
            h={9}
            get={get}
            rows={[
              [
                { l: 'Examen con lentes:', k: extra[0], center: true },
                { l: 'Resultado:', k: extra[1], center: true },
              ],
            ]}
          />
        )}
      </View>
    );
  };
  const finales: CellDef[][] = (
    peco
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
        {bloque(peco ? 'Visión Lejana (Snellen):' : 'Visión Lejana (Snellen):', 'vlOd', 'vlOi', [
          'vlConLentes',
          'vlResultado',
        ])}
        {bloque('Visión Cercana (Jaeger):', 'vcOd', 'vcOi', ['vcConLentes', 'vcResultado'])}
        {bloque(peco ? 'Reflejos:' : 'Reflejos oculares:', 'reflejosOcularesOd', 'reflejosOcularesOi')}
        {bloque('Pterigion:', 'pterigionOd', 'pterigionOi')}
        {bloque('Cataratas:', 'catarataOd', 'catarataOi')}
      </View>
      <View style={{ marginTop: 6 }}>
        <Rows get={get} cols={1} h={15} rows={finales} />
      </View>

      {peco ? (
        <Signature
          lines={[
            `DR. ${OFTALMOLOGO.nombre} ${OFTALMOLOGO.siglasUniversidad} ${OFTALMOLOGO.cedula}`,
            'Médico especialista en oftalmología',
          ]}
        />
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
