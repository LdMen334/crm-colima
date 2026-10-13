'use client';

import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import { can, type Permission } from './permissions';

/** Renderiza `children` solo si el usuario en sesión tiene el permiso. */
export function RoleGate({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { user } = useAuth();
  return <>{can(user?.role, permission) ? children : fallback}</>;
}
