'use client';

import { usePathname } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { CierreAnioAviso } from '@/features/anios/CierreAnioAviso';

/**
 * Panel de Leo. La navegación entre sus secciones vive solo en el sidebar.
 * La guardia es solo de interfaz: los endpoints de usuarios, bitácora y
 * reportes deben verificar el rol en el servidor.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();

  if (user?.role !== 'Leo') {
    return (
      <div className="mx-auto flex max-w-md animate-enter flex-col items-center px-4 py-24 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-crm-red-soft text-crm-red">
          <ShieldAlert className="h-5 w-5" />
        </span>
        <p className="mt-4 text-base font-semibold text-ink">Acceso restringido</p>
        <p className="mt-1 text-sm text-ink-muted">El Panel de Administración es exclusivo para Leo.</p>
      </div>
    );
  }

  return (
    <div key={pathname} className="w-full animate-enter px-4 pb-16 pt-6 sm:px-6">
      <CierreAnioAviso />
      {children}
    </div>
  );
}
