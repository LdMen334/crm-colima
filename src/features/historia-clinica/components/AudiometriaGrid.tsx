'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import { AUDIO_FRECUENCIAS, FIELD_BY_N, type FieldKey, type HistoriaClinicaValues } from '../config/fields';
import { FieldRenderer } from './FieldRenderer';

const keyOf = (hz: number, oido: 'Od' | 'Oi') => `aud${hz}${oido}` as FieldKey;

/** Captura de umbrales (campos 182-199) en tabla + audiograma en vivo + resultado (200). */
export function AudiometriaGrid() {
  const { register, control } = useFormContext<HistoriaClinicaValues>();
  const values = useWatch({ control });

  return (
    <div className="space-y-4 md:col-span-2 lg:col-span-3">
      <div className="overflow-x-auto rounded-xl border border-line">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-canvas text-xs text-ink-muted">
            <tr>
              <th className="px-3 py-2 text-left font-medium">dB HL</th>
              {AUDIO_FRECUENCIAS.map((hz) => (
                <th key={hz} className="px-1 py-2 font-medium tabular-nums">
                  {hz >= 1000 ? `${hz / 1000}k` : hz}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(['Od', 'Oi'] as const).map((oido) => (
              <tr key={oido} className="border-t border-line">
                <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold">
                  <span className={oido === 'Od' ? 'text-crm-red' : 'text-med-blue'}>
                    {oido === 'Od' ? '● Oído derecho' : '✕ Oído izquierdo'}
                  </span>
                </th>
                {AUDIO_FRECUENCIAS.map((hz) => (
                  <td key={hz} className="px-1 py-1.5">
                    <input
                      aria-label={`${hz} Hz ${oido === 'Od' ? 'oído derecho' : 'oído izquierdo'}`}
                      inputMode="numeric"
                      {...register(keyOf(hz, oido))}
                      className="h-9 w-full min-w-12 rounded-md border border-line text-center text-sm tabular-nums outline-none focus:border-crm-red focus:ring-2 focus:ring-crm-red/15"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Audiograma values={values as Partial<HistoriaClinicaValues>} />
      <FieldRenderer field={FIELD_BY_N.get(200)!} />
    </div>
  );
}

function Audiograma({ values }: { values: Partial<HistoriaClinicaValues> }) {
  const W = 640, H = 220, padL = 36, padR = 12, padT = 12, padB = 24;
  const minDb = -10, maxDb = 120;
  const x = (i: number) => padL + (i * (W - padL - padR)) / (AUDIO_FRECUENCIAS.length - 1);
  const y = (db: number) => padT + ((db - minDb) * (H - padT - padB)) / (maxDb - minDb);

  const points = (oido: 'Od' | 'Oi') =>
    AUDIO_FRECUENCIAS.map((hz, i) => {
      const v = Number(values[keyOf(hz, oido)]);
      const raw = values[keyOf(hz, oido)];
      return raw !== undefined && raw !== '' && Number.isFinite(v) ? { x: x(i), y: y(Math.max(minDb, Math.min(maxDb, v))) } : null;
    }).filter(Boolean) as { x: number; y: number }[];

  const od = points('Od');
  const oi = points('Oi');
  if (!od.length && !oi.length) return null;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-xl border border-line bg-white" role="img" aria-label="Audiograma">
      {[0, 20, 40, 60, 80, 100, 120].map((db) => (
        <g key={db}>
          <line x1={padL} x2={W - padR} y1={y(db)} y2={y(db)} stroke="#E7E7E4" />
          <text x={padL - 6} y={y(db) + 3} fontSize="9" textAnchor="end" fill="#9A9DA5">{db}</text>
        </g>
      ))}
      <rect x={padL} y={y(-10)} width={W - padL - padR} height={y(25) - y(-10)} fill="#16A34A" opacity="0.05" />
      {AUDIO_FRECUENCIAS.map((hz, i) => (
        <text key={hz} x={x(i)} y={H - 6} fontSize="9" textAnchor="middle" fill="#9A9DA5">
          {hz >= 1000 ? `${hz / 1000}k` : hz}
        </text>
      ))}
      <polyline points={od.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#E31B23" strokeWidth="1.5" />
      {od.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke="#E31B23" strokeWidth="1.5" />)}
      <polyline points={oi.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="#1D5FD1" strokeWidth="1.5" strokeDasharray="4 3" />
      {oi.map((p, i) => (
        <g key={i} stroke="#1D5FD1" strokeWidth="1.5">
          <line x1={p.x - 4} y1={p.y - 4} x2={p.x + 4} y2={p.y + 4} />
          <line x1={p.x - 4} y1={p.y + 4} x2={p.x + 4} y2={p.y - 4} />
        </g>
      ))}
    </svg>
  );
}
