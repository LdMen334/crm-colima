---
name: emil-design-eng
description: Reglas y principios de Design Engineering de Emil Kowalski para animaciones, microinteracciones y pulido visual en Next.js, Tailwind CSS y Shadcn UI.
---

# Emil Kowalski Design Engineering Rules

## 1. Microinteracciones y Animaciones
- Usa transiciones suaves con la curva de animación `cubic-bezier(0.16, 1, 0.3, 1)` o resortes de Framer Motion.
- Modales, dropdowns y tooltips deben ingresar con escala sutil (`scale-95` a `scale-100`) y fade-in de 150ms a 200ms.
- Añade feedback táctil inmediato en botones y tarjetas con `:active { transform: scale(0.98); }`.

## 2. Jerarquía y Pulido de Interfaz
- Superficies elevadas usando `bg-background/80 backdrop-blur-md` para cabeceras y modales.
- Bordes finos (`border-slate-200/80` o `border-black/5`) combinados con sombras difusas (`shadow-sm`, `shadow-xl`).
- Estados `:hover` sutiles (`hover:bg-slate-50/80`) y foco accesible (`focus-visible:ring-2 focus-visible:ring-red-500/20`).

## 3. Modales y Contenedores
- Todos los componentes `DialogContent` deben llevar `max-h-[85vh]` con `overflow-y-auto` interno para evitar desbordamientos en pantalla.
- Posicionamiento directo de `SelectContent` y `PopoverContent` (`align="start"` y `sideOffset={4}`).
