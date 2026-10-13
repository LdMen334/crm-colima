'use client';

import { LucideProvider } from 'lucide-react';
import { AuthProvider } from '@/features/auth/AuthProvider';

/** Proveedores globales del cliente: sesión e iconos con trazo medio uniforme. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LucideProvider strokeWidth={1.75}>
      <AuthProvider>{children}</AuthProvider>
    </LucideProvider>
  );
}
