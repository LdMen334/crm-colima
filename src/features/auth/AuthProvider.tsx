'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authenticate, cerrarSesion } from '@/features/usuarios/api';
import type { Role, SessionUser } from './types';

interface AuthContextValue {
  user: SessionUser | null;
  ready: boolean;
  login: (email: string, password: string, perfil?: Role) => Promise<SessionUser>;
  logout: () => void;
  /** Reemplaza los datos de la sesión tras editar el perfil o cambiar la contraseña. */
  actualizarSesion: (u: SessionUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = 'crm-hc-session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      const saved = raw ? (JSON.parse(raw) as Partial<SessionUser>) : null;
      // Descarta sesiones del formato anterior (sin id), previas a la gestión de usuarios
      if (saved?.id && saved.role) setUser(saved as SessionUser);
    } catch {
      /* almacenamiento no disponible: sesión solo en memoria */
    }
    setReady(true);
  }, []);

  const login = useCallback(async (email: string, password: string, perfil?: Role) => {
    const u = await authenticate(email, password, perfil);
    setUser(u);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } catch {}
    return u;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {}
    // No se espera la respuesta: la sesión local ya se limpió de inmediato.
    void cerrarSesion();
  }, []);

  const actualizarSesion = useCallback((u: SessionUser) => {
    setUser(u);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } catch {}
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, logout, actualizarSesion }),
    [user, ready, login, logout, actualizarSesion],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
