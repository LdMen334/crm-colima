'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { InstitutionalHeader } from '@/components/layout/InstitutionalHeader';
import { Sidebar } from '@/components/layout/Sidebar';
import { SidebarProvider } from '@/components/layout/sidebar-state';
import { refrescarMedicos } from '@/features/historia-clinica/config/medicos';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !user) router.replace('/login');
  }, [ready, user, router]);

  // Precarga el catálogo de médicos en cuanto hay sesión: así el nombre del
  // médico dictaminador (id → nombre) ya está listo cuando se abra cualquier
  // expediente, sin importar cuál sea la primera pantalla que visite el
  // usuario (si no, la firma/nombre del reporte podía salir en blanco por
  // una carrera entre este fetch y el del expediente).
  useEffect(() => {
    if (user) refrescarMedicos();
  }, [user]);

  if (!ready || !user) {
    return (
      <div className="ambient grid min-h-dvh place-items-center">
        <Loader2 className="h-5 w-5 animate-spin text-ink-subtle" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="ambient flex min-h-dvh">
        <Sidebar />
        {/* flex-1: al colapsar el sidebar, el contenido ocupa todo el ancho liberado */}
        <div className="min-w-0 flex-1">
          <InstitutionalHeader />
          <main className="w-full">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
