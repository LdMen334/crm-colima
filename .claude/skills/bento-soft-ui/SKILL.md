---
name: bento-soft-ui
description: Estilo de diseño Bento Grid Soft Moderno (inspirado en HealthPulse/Dribbble) con tarjetas flotantes ultra-redondeadas, canvas lavanda/gris suave, componentes en forma de píldora y jerarquía limpia para dashboards médicos.
---

# Reglas de Diseño Bento Soft UI

## 1. Lienzo y Estructura Base (Canvas)
- **Fondo de Pantalla (Canvas):** Usa un tono lavanda/periwinkle/gris ultra suave de fondo (`bg-[#F0F1FA]` o `bg-slate-100/90`).
- **Contenedores Principales:** Tarjetas o páneles blancos puros (`bg-white`) con esquinas muy pronunciadas (`rounded-[28px]` o `rounded-3xl`).
- **Sombras Difusas:** Utiliza sombras suaves e invisibles al borde (`shadow-[0_10px_35px_rgba(0,0,0,0.03)]` o `shadow-sm`), sin bordes grises oscuros o pesados.

## 2. Navegación y Botones (Pill Design)
- **Barra Flotante Superior (Header):** Contenedor blanco redondeado (`rounded-full bg-white px-4 py-2 shadow-sm`).
- **Pestañas y Estados Activos:** Botones redondeados tipo cápsula (`rounded-full px-5 py-2.5 text-sm font-semibold transition-all`).
  - Estado Activo: `bg-red-600 text-white shadow-md shadow-red-500/20` (o color primario).
  - Estado Inactivo: `text-slate-500 hover:bg-slate-100 hover:text-slate-800`.

## 3. Disposición Bento Grid (KPIs y Widgets)
- **Tarjetas de Métricas:** Grilla de 3 columnas (`grid grid-cols-1 md:grid-cols-3 gap-4`).
- **Badges de Ícono:** Íconos encerrados en círculos con fondo de color suave (`w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center`).
- **Números de Gran Formato:** Métricas principales en `text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight`.

## 4. Tablas y Calendarios
- **Líneas delgadas y limpias:** Filas separadas por `border-b border-slate-100` con `hover:bg-slate-50/80`.
- **Selector de Días / Fechas:** Píldoras verticales u horizontales con el día seleccionado resaltado en fondo sólido.
