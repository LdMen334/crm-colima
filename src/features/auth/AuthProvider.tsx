'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authenticate, cerrarSesion, restaurarSesion } from '@/features/usuarios/api';
import { getToken, SESION_TERMINADA, type CodigoSesion } from '@/lib/api-client';
import { borrarBorrador, hayLlave, purgarBorradoresVencidos } from '@/features/borrador/borrador';
import type { Role, SessionUser } from './types';

interface AuthContextValue {
  user: SessionUser | null;
  ready: boolean;
  /** true cuando ya está en memoria la llave para cifrar/descifrar el borrador de esta cuenta. */
  llaveLista: boolean;
  login: (email: string, password: string, perfil?: Role) => Promise<SessionUser>;
  logout: () => void;
  /** Reemplaza los datos de la sesión tras editar el perfil o cambiar la contraseña. */
  actualizarSesion: (u: SessionUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = 'crm-hc-session';
const MOTIVO_KEY = 'crm-hc-motivo-salida';

/** Mensaje para el login según por qué el backend cerró la sesión. */
const MENSAJE_MOTIVO: Record<CodigoSesion, string> = {
  SESSION_REPLACED: 'Tu sesión se cerró porque tu cuenta inició sesión en otro equipo o pestaña.',
  SESSION_EXPIRED: 'Tu sesión venció por inactividad. Vuelve a iniciar sesión.',
  UNAUTHENTICATED: 'Tu sesión ya no es válida. Vuelve a iniciar sesión.',
};

/** Devuelve (una sola vez) el motivo por el que se cerró la sesión, para mostrarlo en el login. */
export function tomarMotivoSalida(): string | null {
  try {
    const codigo = sessionStorage.getItem(MOTIVO_KEY) as CodigoSesion | null;
    sessionStorage.removeItem(MOTIVO_KEY);
    return codigo ? (MENSAJE_MOTIVO[codigo] ?? MENSAJE_MOTIVO.UNAUTHENTICATED) : null;
  } catch {
    return null;
  }
}

function guardarSesion(u: SessionUser | null) {
  try {
    if (u) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* almacenamiento no disponible: sesión solo en memoria */
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);
  const [llaveLista, setLlaveLista] = useState(false);

  useEffect(() => {
    // Borradores de más de 24 h de cualquier cuenta que haya usado este equipo.
    purgarBorradoresVencidos();
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      const saved = raw ? (JSON.parse(raw) as Partial<SessionUser>) : null;
      // Descarta sesiones del formato anterior (sin id), previas a la gestión de usuarios
      if (saved?.id && saved.role && getToken()) {
        setUser(saved as SessionUser);
        // Confirma el token con el servidor y recupera la llave del borrador (solo vive en memoria).
        restaurarSesion()
          .then((u) => {
            setUser(u);
            guardarSesion(u);
            setLlaveLista(hayLlave());
          })
          .catch(() => {
            /* 401: lo atiende el aviso SESION_TERMINADA. Sin red: se sigue sin borrador. */
          });
      }
    } catch {
      /* almacenamiento no disponible: sesión solo en memoria */
    }
    setReady(true);
  }, []);

  // El backend rechazó el token: se limpia la sesión local y el layout protegido
  // manda al login, donde se muestra el motivo. La llave NO se olvida aquí: la
  // pantalla de captura la necesita para cifrar el borrador justo en este momento.
  useEffect(() => {
    function alTerminar(e: Event) {
      const codigo = (e as CustomEvent<{ codigo: CodigoSesion }>).detail?.codigo ?? 'UNAUTHENTICATED';
      try {
        sessionStorage.setItem(MOTIVO_KEY, codigo);
      } catch {}
      guardarSesion(null);
      setUser(null);
      setLlaveLista(false);
    }
    window.addEventListener(SESION_TERMINADA, alTerminar);
    return () => window.removeEventListener(SESION_TERMINADA, alTerminar);
  }, []);

  const login = useCallback(async (email: string, password: string, perfil?: Role) => {
    const u = await authenticate(email, password, perfil);
    setUser(u);
    guardarSesion(u);
    setLlaveLista(hayLlave());
    return u;
  }, []);

  const logout = useCallback(() => {
    // Cerrar sesión a propósito descarta el expediente nuevo que no se guardó.
    if (user) borrarBorrador(user.id);
    setUser(null);
    setLlaveLista(false);
    guardarSesion(null);
    // No se espera la respuesta: la sesión local ya se limpió de inmediato.
    void cerrarSesion();
  }, [user]);

  const actualizarSesion = useCallback((u: SessionUser) => {
    setUser(u);
    guardarSesion(u);
  }, []);

  const value = useMemo(
    () => ({ user, ready, llaveLista, login, logout, actualizarSesion }),
    [user, ready, llaveLista, login, logout, actualizarSesion],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
