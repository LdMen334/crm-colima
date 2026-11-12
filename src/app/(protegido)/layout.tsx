'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthProvider';
import { InstitutionalHeader } from '@/components/layout/InstitutionalHeader';
import { Sidebar } from '@/components/layout/Sidebar';
import { SidebarProvider } from '@/components/layout/sidebar-state';
import { refrescarMedicos } from '@/features/historia-clinica/config/medicos';
import { revisarSesion } from '@/features/usuarios/api';

/** Cada cuánto se confirma con el servidor que la sesión sigue vigente. */
const REVISION_MS = 60_000;

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

  // Revisión periódica de la sesión: si otro equipo entró con la cuenta o venció
  // por inactividad, el médico se entera en menos de un minuto (o al volver a la
  // pestaña), no hasta que intenta guardar. No cuenta como actividad en el backend.
  useEffect(() => {
    if (!user) return;
    const revisar = () => {
      if (document.visibilityState === 'visible') revisarSesion().catch(() => {});
    };
    const intervalo = setInterval(revisar, REVISION_MS);
    document.addEventListener('visibilitychange', revisar);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', revisar);
    };
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
