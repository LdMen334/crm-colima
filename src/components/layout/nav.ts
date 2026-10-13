import { ClipboardPlus, FileSpreadsheet, FolderSearch, ScrollText, UserRoundCog, UsersRound, type LucideIcon } from 'lucide-react';
import type { Permission } from '@/features/auth/permissions';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
}

export const NAV_GROUPS: readonly { title: string; items: readonly NavItem[] }[] = [
  {
    title: 'Expedientes',
    items: [
      { href: '/expedientes', label: 'Navegador de expedientes', icon: FolderSearch, permission: 'expediente:read' },
      { href: '/expediente', label: 'Nueva historia clínica', icon: ClipboardPlus, permission: 'expediente:write' },
    ],
  },
  {
    title: 'Administración',
    items: [
      { href: '/admin/usuarios', label: 'Usuarios', icon: UsersRound, permission: 'admin:usuarios' },
      { href: '/admin/bitacora', label: 'Bitácora de auditoría', icon: ScrollText, permission: 'admin:bitacora' },
      { href: '/admin/reportes', label: 'Reporte Excel', icon: FileSpreadsheet, permission: 'admin:reportes' },
    ],
  },
  {
    title: 'Mi cuenta',
    items: [{ href: '/perfil', label: 'Mi perfil', icon: UserRoundCog, permission: 'perfil:editar' }],
  },
];

/** "/expediente" no debe marcarse activo en "/expedientes". */
export const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);
