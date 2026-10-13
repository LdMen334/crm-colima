'use client';

import { useState } from 'react';

/** Proporción del archivo oficial recortado (ancho / alto). */
const RATIO = 556 / 798;

/**
 * Logotipo oficial de la Cruz Roja Mexicana: /brand/logo-cruz-roja.png
 * (public/brand/logo-cruz-roja.png). Se usa en el login, el sidebar y los PDF.
 */
export function Logo({ height = 48, className = '' }: { height?: number; className?: string }) {
  const [failed, setFailed] = useState(false);
  const width = Math.round(height * RATIO);

  if (failed) {
    return (
      <div
        style={{ width, height }}
        className={`grid shrink-0 place-items-center rounded-lg bg-crm-red text-[10px] font-bold text-white ${className}`}
        aria-label="Cruz Roja Mexicana"
      >
        CRM
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/logo-cruz-roja.png"
      alt="Cruz Roja Mexicana"
      width={width}
      height={height}
      onError={() => setFailed(true)}
      className={`shrink-0 object-contain ${className}`}
      style={{ width, height }}
    />
  );
}
