import { createContext, useContext, type ReactNode } from 'react';
import { Circle, G, Image, Line, Page, Polyline, Svg, Text, View } from '@react-pdf/renderer';
import { AUDIO_FRECUENCIAS, FIELD_BY_KEY, type FieldKey, type HistoriaClinicaValues } from '@/features/historia-clinica/config/fields';
import { pdfValue } from '@/features/historia-clinica/lib/format';
import { PLANTILLAS, type PdfTheme } from './config';

/**
 * Piezas de maquetación con el lenguaje visual de los formatos oficiales:
 * celdas de etiqueta en color con texto blanco, celdas de valor gris claro,
 * separadas por filetes blancos, y barras de sección con título centrado.
 */

const REG = 'Helvetica';
const BOLD = 'Helvetica-Bold';
const GAP = 0.6; // filete blanco entre celdas

const ThemeCtx = createContext<PdfTheme>(PLANTILLAS.TX.theme);
export const PdfThemeProvider = ThemeCtx.Provider;
export const useTheme = (): PdfTheme => useContext(ThemeCtx);

// ───────── Valores ─────────

export type Get = (k: FieldKey) => string;
export const makeGet =
  (values: HistoriaClinicaValues): Get =>
  (k) =>
    pdfValue(FIELD_BY_KEY.get(k), values[k]);

// ───────── Página ─────────

export function Hoja({ children, footer }: { children: ReactNode; footer: string }) {
  const t = useTheme();
  return (
    <Page
      size="LETTER"
      style={{
        paddingTop: t.marginTop,
        paddingBottom: t.marginBottom,
        paddingLeft: t.marginLeft,
        paddingRight: t.marginRight,
        fontFamily: REG,
        fontSize: t.fontSize,
        color: t.ink,
      }}
    >
      {children}
      <View
        fixed
        style={{ position: 'absolute', bottom: 16, left: t.marginLeft, right: t.marginRight, flexDirection: 'row', justifyContent: 'space-between', fontSize: 5.4, color: '#808080' }}
      >
        <Text>{footer}</Text>
        <Text render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `Página ${pageNumber} de ${totalPages}`} />
      </View>
    </Page>
  );
}

// ───────── Celdas ─────────

export interface CellDef {
  /** Etiqueta impresa (la del formato oficial) */
  l?: string;
  /** Campo del expediente */
  k?: FieldKey;
  /** Valor ya resuelto (si no viene de un campo) */
  v?: string;
  /** Columnas que ocupa */
  span?: number;
  /** Ancho de la etiqueta en pt */
  labelW?: number;
  /** Etiqueta con el color destacado (rojo) */
  hl?: boolean;
  /** Valor centrado */
  center?: boolean;
  /** Valor en negritas */
  bold?: boolean;
  /** Casilla destacada (gradiente / magnitud de riesgo) */
  box?: boolean;
  /** Color de la casilla destacada (p. ej. el del nivel de gradiente); por defecto, el del tema */
  boxColor?: BoxColor;
}

/** Fondo y texto de una casilla destacada. */
export interface BoxColor {
  fondo: string;
  texto: string;
}

function Cell({ c, get, width, labelW, minH }: { c: CellDef; get: Get; width: string; labelW: number; minH: number }) {
  const t = useTheme();
  const value = c.v ?? (c.k ? get(c.k) : '');
  return (
    <View style={{ width, flexDirection: 'row', minHeight: minH, borderRightWidth: GAP, borderBottomWidth: GAP, borderColor: '#FFFFFF' }}>
      {c.l !== undefined && (
        <View style={{ width: c.labelW ?? labelW, backgroundColor: c.hl ? t.highlight : t.label, justifyContent: 'center', paddingHorizontal: 2.2, paddingVertical: 1 }}>
          <Text style={{ color: '#FFFFFF' }}>{c.l}</Text>
        </View>
      )}
      <View
        style={{
          flex: 1,
          backgroundColor: c.box ? (c.boxColor?.fondo ?? t.boxValue) : t.value,
          justifyContent: 'center',
          paddingHorizontal: 2.5,
          paddingVertical: 1,
        }}
      >
        <Text
          style={{
            textAlign: c.center || c.box ? 'center' : 'left',
            fontFamily: c.bold || c.box ? BOLD : REG,
            color: c.box ? (c.boxColor?.texto ?? t.boxValueText) : t.ink,
            fontSize: c.box ? t.fontSize * 1.5 : t.fontSize,
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

/**
 * Cuadrícula etiqueta/valor.
 * - `cols`: columnas iguales, o
 * - `grid`: anchos medidos del formato por columna `{ w, lw }` en pt (w = etiqueta + valor).
 */
export function Rows({
  rows,
  get,
  cols = 4,
  labelW = 52,
  grid,
  h,
}: {
  rows: CellDef[][];
  get: Get;
  cols?: number;
  labelW?: number;
  grid?: { w: number; lw: number }[];
  h?: number;
}) {
  const t = useTheme();
  const total = grid?.reduce((a, g) => a + g.w, 0) ?? 0;
  return (
    <View>
      {rows.map((row, i) => {
        let col = 0;
        return (
          <View key={i} style={{ flexDirection: 'row' }} wrap={false}>
            {row.map((c, j) => {
              const span = c.span ?? 1;
              let width: string;
              let lw = labelW;
              if (grid) {
                const w = grid.slice(col, col + span).reduce((a, g) => a + g.w, 0);
                width = `${(w / total) * 100}%`;
                lw = grid[col]?.lw ?? labelW;
              } else {
                width = `${(span / cols) * 100}%`;
              }
              col += span;
              return <Cell key={j} c={c} get={get} width={width} labelW={lw} minH={h ?? t.rowH} />;
            })}
          </View>
        );
      })}
    </View>
  );
}

/** Rótulo de grupo a la izquierda (Tórax, Abdomen, Ojos, Oídos…) que abarca varias filas. */
export function Group({ label, children, w = 46, tone = 'highlight' }: { label: string; children: ReactNode; w?: number; tone?: 'highlight' | 'label' }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row' }} wrap={false}>
      <View style={{ width: w, backgroundColor: tone === 'highlight' ? t.highlight : t.label, justifyContent: 'center', paddingHorizontal: 2.5, borderRightWidth: GAP, borderBottomWidth: GAP, borderColor: '#FFFFFF' }}>
        <Text style={{ color: '#FFFFFF' }}>{label}</Text>
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

export function Bar({ children, mt = 7 }: { children: string; mt?: number }) {
  const t = useTheme();
  return (
    <Text style={{ backgroundColor: t.bar, color: '#FFFFFF', fontFamily: BOLD, textAlign: 'center', paddingVertical: 1.6, marginTop: mt, borderBottomWidth: GAP, borderColor: '#FFFFFF' }} minPresenceAhead={30}>
      {children}
    </Text>
  );
}

export function SubBar({ children }: { children: string }) {
  const t = useTheme();
  return (
    <Text style={{ backgroundColor: t.sub, color: '#FFFFFF', textAlign: 'center', paddingVertical: 1.4, borderBottomWidth: GAP, borderColor: '#FFFFFF' }} minPresenceAhead={20}>
      {children}
    </Text>
  );
}

export function TwoCol({ left, right, split = 50 }: { left: ReactNode; right: ReactNode; split?: number }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      <View style={{ width: `${split}%`, paddingRight: 1 }}>{left}</View>
      <View style={{ width: `${100 - split}%`, paddingLeft: 1 }}>{right}</View>
    </View>
  );
}

/** Tabla con encabezado en color de etiqueta. `widths` en %. */
export function Table({ head, rows, widths, firstBold = false }: { head: string[]; rows: string[][]; widths: number[]; firstBold?: boolean }) {
  const t = useTheme();
  const cell = { borderRightWidth: GAP, borderBottomWidth: GAP, borderColor: '#FFFFFF', paddingVertical: 1.6, paddingHorizontal: 2.5 };
  return (
    <View wrap={false}>
      <View style={{ flexDirection: 'row' }}>
        {head.map((h, i) => (
          <Text key={i} style={[cell, { width: `${widths[i]}%`, backgroundColor: t.label, color: '#FFFFFF', textAlign: 'center' }]}>
            {h}
          </Text>
        ))}
      </View>
      {rows.map((r, i) => (
        <View key={i} style={{ flexDirection: 'row' }}>
          {r.map((c, j) => (
            <Text
              key={j}
              style={[
                cell,
                {
                  width: `${widths[j]}%`,
                  backgroundColor: firstBold && j === 0 ? '#FFFFFF' : t.value,
                  fontFamily: firstBold && j === 0 ? BOLD : REG,
                  textAlign: j === 0 ? 'left' : 'center',
                },
              ]}
            >
              {c}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

/**
 * Bloque superior: [Número/Folio | valor] … [fecha 1 | valor | CASILLA etiqueta]
 *                                            [fecha 2 | valor | CASILLA valor   ]
 */
export function MetaBlock({
  get,
  folio,
  fechas,
  box,
}: {
  get: Get;
  folio: { l: string; k: FieldKey };
  fechas: [{ l: string; k: FieldKey }, { l: string; k: FieldKey }];
  box: { label: string; value: string; color?: BoxColor };
}) {
  const t = useTheme();
  const base = { textAlign: 'center' as const, paddingVertical: 1.5, borderBottomWidth: GAP, borderRightWidth: GAP, borderColor: '#FFFFFF' };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 4 }} wrap={false}>
      <View style={{ width: '30%', flexDirection: 'row', height: 18 }}>
        <View style={{ width: '30%', backgroundColor: t.highlight, justifyContent: 'center' }}>
          <Text style={{ color: '#FFFFFF', textAlign: 'center', fontFamily: BOLD }}>{folio.l}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: t.value, justifyContent: 'center', borderWidth: 0.5, borderColor: '#D0CECE' }}>
          <Text style={{ textAlign: 'center' }}>{get(folio.k)}</Text>
        </View>
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ width: '60%' }}>
        {fechas.map((f, i) => (
          <View key={f.l} style={{ flexDirection: 'row' }}>
            <Text style={[base, { width: '57%', backgroundColor: t.highlight, color: '#FFFFFF', fontFamily: BOLD }]}>{f.l}</Text>
            <Text style={[base, { width: '18%', backgroundColor: t.value }]}>{get(f.k)}</Text>
            {i === 0 ? (
              <Text style={[base, { width: '25%', backgroundColor: t.boxLabel, color: '#FFFFFF' }]}>{box.label}</Text>
            ) : (
              <Text
                style={[
                  base,
                  {
                    width: '25%',
                    backgroundColor: box.color?.fondo ?? t.boxValue,
                    color: box.color?.texto ?? t.boxValueText,
                    fontFamily: BOLD,
                  },
                ]}
              >
                {box.value}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

// ───────── Logotipos y encabezados ─────────

export function Img({ src, w, h }: { src?: string; w: number; h: number }) {
  return src ? <Image src={src} style={{ width: w, height: h, objectFit: 'contain' }} /> : <View style={{ width: w, height: h }} />;
}

/** Logo Cruz Roja (horizontal) con la delegación debajo, como en los formatos. */
export function CruzRojaLogo({ src, w = 77, delegacion }: { src?: string; w?: number; delegacion?: string }) {
  return (
    <View>
      <Img src={src} w={w} h={w / (316 / 101)} />
      {delegacion ? <Text style={{ fontSize: 4.6, marginTop: 1.5 }}>{delegacion}</Text> : null}
    </View>
  );
}

/** Título alineado a la derecha (TX y hojas complementarias). */
export function RightTitle({ title, subtitle, bold = false }: { title: string; subtitle: string; bold?: boolean }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={{ fontSize: t.titleSize * 0.95, fontFamily: BOLD, color: t.title }}>{title}</Text>
      <Text style={{ fontSize: t.fontSize, fontFamily: bold ? BOLD : REG, marginTop: 1.5 }}>{subtitle}</Text>
    </View>
  );
}

/** Firma: rúbrica (si hay), línea, nombre y cargo. */
export function Signature({ lines, width = 200, label, imagenSrc }: { lines: string[]; width?: number; label?: string; imagenSrc?: string }) {
  return (
    <View style={{ marginTop: imagenSrc ? 6 : 30, alignSelf: 'center', alignItems: 'center' }} wrap={false}>
      {label ? <Text style={{ marginBottom: 26 }}>{label}</Text> : null}
      {imagenSrc ? <Image src={imagenSrc} style={{ width: 62, height: 37, objectFit: 'contain', marginBottom: -6 }} /> : null}
      <View style={{ width, borderTopWidth: 0.7, borderTopColor: '#000000', paddingTop: 2, alignItems: 'center' }}>
        {lines.map((l, i) => (
          <Text key={i} style={{ marginTop: i ? 1 : 0 }}>
            {l}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function Paragraph({ children, size = 5.4, bold = false }: { children: string; size?: number; bold?: boolean }) {
  return <Text style={{ fontSize: size, fontFamily: bold ? BOLD : REG, lineHeight: 1.3, marginTop: 2, marginBottom: 5, textAlign: 'justify' }}>{children}</Text>;
}

// ───────── Audiograma ─────────

/** Gráfica de líneas OD (rojo) / OI (azul), como la de los formatos oficiales. */
export function Audiograma({ values, width = 300, height = 96 }: { values: HistoriaClinicaValues; width?: number; height?: number }) {
  const pad = { l: 16, r: 6, t: 6, b: 22 };
  const read = (hz: number, o: 'Od' | 'Oi') => {
    const raw = values[`aud${hz}${o}` as FieldKey]?.trim();
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  };
  const all = AUDIO_FRECUENCIAS.flatMap((hz) => [read(hz, 'Od'), read(hz, 'Oi')]).filter((n): n is number => n !== null);
  const yMax = Math.max(60, Math.ceil(Math.max(0, ...all) / 10) * 10);
  const x = (i: number) => pad.l + (i * (width - pad.l - pad.r)) / (AUDIO_FRECUENCIAS.length - 1);
  const y = (v: number) => pad.t + (1 - v / yMax) * (height - pad.t - pad.b);
  const pts = (o: 'Od' | 'Oi') =>
    AUDIO_FRECUENCIAS.map((hz, i) => {
      const v = read(hz, o);
      return v === null ? null : { x: x(i), y: y(Math.max(0, v)) };
    }).filter((p): p is { x: number; y: number } => p !== null);
  const ticks = Array.from({ length: yMax / 10 + 1 }, (_, i) => i * 10);
  const series: { o: 'Od' | 'Oi'; color: string }[] = [
    { o: 'Od', color: '#E31B23' },
    { o: 'Oi', color: '#1F4E79' },
  ];

  return (
    <View style={{ borderWidth: 0.5, borderColor: '#D9D9D9' }}>
      <Svg width={width} height={height}>
        {ticks.map((v) => (
          <Line key={v} x1={pad.l} x2={width - pad.r} y1={y(v)} y2={y(v)} stroke="#E4E4E4" strokeWidth={0.5} />
        ))}
        {ticks.map((v) => (
          <Text key={`t${v}`} x={pad.l - 3} y={y(v) + 1.6} style={{ fontSize: 4.4 }} textAnchor="end" fill="#808080">
            {String(v)}
          </Text>
        ))}
        {AUDIO_FRECUENCIAS.map((hz, i) => (
          <Text key={hz} x={x(i)} y={height - pad.b + 7} style={{ fontSize: 4.4 }} textAnchor="middle" fill="#808080">
            {String(hz)}
          </Text>
        ))}
        {series.map(({ o, color }) => {
          const p = pts(o);
          return (
            <G key={o}>
              {p.length > 1 ? <Polyline points={p.map((q) => `${q.x},${q.y}`).join(' ')} stroke={color} strokeWidth={1} fill="none" /> : null}
              {p.map((q, i) => (
                <Circle key={i} cx={q.x} cy={q.y} r={1.5} fill={color} />
              ))}
            </G>
          );
        })}
        <Line x1={width / 2 - 52} x2={width / 2 - 40} y1={height - 5} y2={height - 5} stroke="#E31B23" strokeWidth={1} />
        <Text x={width / 2 - 37} y={height - 3.5} style={{ fontSize: 4.6 }}>
          Oído derecho
        </Text>
        <Line x1={width / 2 + 8} x2={width / 2 + 20} y1={height - 5} y2={height - 5} stroke="#1F4E79" strokeWidth={1} />
        <Text x={width / 2 + 23} y={height - 3.5} style={{ fontSize: 4.6 }}>
          Oído izquierdo
        </Text>
      </Svg>
    </View>
  );
}
