'use client';

import { useEffect, useState } from 'react';
import { listarMedicos, refrescarMedicos, type MedicoFirmante } from '@/features/historia-clinica/config/medicos';
import { USUARIOS_CAMBIARON } from './api';

/**
 * Lista viva de médicos que pueden atender. Se actualiza al instante cuando se
 * da de alta, registra o desactiva un usuario (en esta pestaña o en otra).
 */
export function useMedicos(): MedicoFirmante[] {
  const [medicos, setMedicos] = useState(listarMedicos);

  useEffect(() => {
    const recargar = () => refrescarMedicos().then(() => setMedicos(listarMedicos()));
    recargar(); // por si cambió entre el render y el montaje
    window.addEventListener(USUARIOS_CAMBIARON, recargar);
    window.addEventListener('storage', recargar); // otras pestañas
    return () => {
      window.removeEventListener(USUARIOS_CAMBIARON, recargar);
      window.removeEventListener('storage', recargar);
    };
  }, []);

  return medicos;
}
