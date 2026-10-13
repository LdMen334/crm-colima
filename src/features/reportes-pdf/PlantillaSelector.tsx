'use client';

import { PLANTILLAS, type PlantillaId } from './templates/config';

export function PlantillaSelector({ value, onChange }: { value: PlantillaId; onChange: (p: PlantillaId) => void }) {
  return (
    <div role="radiogroup" aria-label="Plantilla" className="flex rounded-full bg-well p-1">
      {(Object.keys(PLANTILLAS) as PlantillaId[]).map((id) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          title={PLANTILLAS[id].cliente}
          onClick={() => onChange(id)}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-[0.97] ${
            value === id ? 'bg-crm-red text-white shadow-md shadow-red-500/20' : 'text-slate-500 hover:bg-white hover:text-slate-800'
          }`}
        >
          {id}
        </button>
      ))}
    </div>
  );
}
