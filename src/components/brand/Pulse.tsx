/**
 * Trazo de electrocardiograma: motivo compartido entre el acceso y el sidebar.
 * `animate` lo dibuja una sola vez (respeta prefers-reduced-motion vía globals.css).
 */
export function Pulse({ className = '', animate = false }: { className?: string; animate?: boolean }) {
  return (
    <svg viewBox="0 0 240 40" fill="none" aria-hidden className={className} preserveAspectRatio="none">
      <path
        d="M0 22h62l7-9 8 18 10-29 9 34 7-14h17l5-6 6 6h109"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        pathLength={1}
        strokeDasharray={animate ? 1 : undefined}
        className={animate ? 'animate-pulse-line' : undefined}
      />
    </svg>
  );
}
